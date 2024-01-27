import { ActionRowBuilder, TextInputBuilder } from "@discordjs/builders";
import { CacheType, ComponentType, ModalBuilder, ModalSubmitFields, ModalSubmitInteraction, TextInputStyle } from "discord.js";
import { Schools, SchoolsIdToName } from "../../../dto/Schools.js";
import { InteractionReply } from "../../../dto/InteractionArguments.js";
import { Application } from "../../../Application.js";
import { ScheduleParser } from "../../../parsing/ScheduleParser.js";
import { Logger } from "../../../logging/Logger.js";
import { ISchedule } from "../../../dto/Schedule.js";
import Modal_Base from "../Modal.js";

class Modal_ScheduleUpload extends Modal_Base {
    // prettier-ignore
    public modalBuilder = new ModalBuilder()
        .setCustomId("schedule_modal")
        .setTitle("Input your schedule here!")
        .addComponents(
            new ActionRowBuilder<TextInputBuilder>()
                .addComponents(new TextInputBuilder()
                    .setCustomId("username")
                    .setMaxLength(20)
                    .setMinLength(3)
                    .setLabel("Display name")
                    .setRequired(true)
                    .setPlaceholder("Your display name")
                    .setStyle(TextInputStyle.Short)).toJSON(),
            new ActionRowBuilder<TextInputBuilder>()
                .addComponents(new TextInputBuilder()
                    .setCustomId("schedule")
                    .setPlaceholder("Your schedule here")
                    .setRequired(true)
                    .setLabel("Your schedule")
                    .setStyle(TextInputStyle.Paragraph)).toJSON(),
            new ActionRowBuilder<TextInputBuilder>()
                .addComponents(new TextInputBuilder()
                    .setCustomId("school")
                    .setMaxLength(1)
                    .setLabel("School ID")
                    .setRequired(true)
                    .setPlaceholder("1 = Vanier, 2 = BdeB, 3 = Other")
                    .setStyle(TextInputStyle.Short)).toJSON());

    async reply(interaction: ModalSubmitInteraction<CacheType>, executorId: string, fields: ModalSubmitFields): Promise<InteractionReply> {
        const rawUsername = fields.getTextInputValue("username");
        const rawSchedule = fields.getTextInputValue("schedule");
        const rawSchoolId = fields.getTextInputValue("school");

        const schoolId = parseInt(rawSchoolId);

        if (Number.isNaN(schoolId) || schoolId < 1 || schoolId > 3) {
            return "**School ID was invalid!**";
        }

        const school = Schools[SchoolsIdToName[schoolId] as keyof typeof SchoolsIdToName];

        let userAlreadyExists = false;
        const existingSchedules = (await Application.instance.collections.schedules
            .find({}, { projection: { _id: 0, displayName: 1, userId: 1 } })
            .toArray()) as unknown as { displayName: string; userId: string }[];

        for (const schedule of existingSchedules) {
            // Let users replace their own name
            if (executorId == schedule.userId) {
                userAlreadyExists = true;
                continue;
            }

            // If username includes any other person's name without spaces
            if (rawUsername.toLowerCase().includes(schedule.displayName.toLowerCase().replaceAll(" ", ""))) {
                return "**Username cannot match already existing name!**";
            }
        }

        // Log in case people want to mess with the bot
        Application.instance.collections.scheduleLogs.insertOne({
            timestamp: new Date(),
            rawUsername: rawUsername,
            rawSchedule: rawSchedule,
            rawSchoolId: rawSchoolId
        });

        let parsedSchedule: ISchedule;
        // We do handle errors, but maybe I forgot some of them
        try {
            const parsedScheduleData = ScheduleParser.parseSchedule(rawSchedule, rawUsername, school);

            if (parsedScheduleData.isError) {
                return (
                    `**Invalid schedule declaration! Please follow the instructions provided by \`/help\`. Note that you cannot upload a schedule from a mobile device, the formatting is lost.**` +
                    `\`Error: ${parsedScheduleData.message}\``
                );
            }

            parsedSchedule = parsedScheduleData.schedule;
            parsedSchedule.userId = executorId;
        } catch (err) {
            if (err instanceof Error) {
                Logger.error(err);
            }

            return "**500 - Internal Server Error**";
        }

        if (userAlreadyExists) {
            await Application.instance.collections.schedules.replaceOne({ userId: executorId }, parsedSchedule);
            return "**Successfully replaced old schedule!**";
        } else {
            await Application.instance.collections.schedules.insertOne(parsedSchedule);
            return "**Successfully uploaded new schedule!**";
        }
    }
}

export default Modal_ScheduleUpload;
