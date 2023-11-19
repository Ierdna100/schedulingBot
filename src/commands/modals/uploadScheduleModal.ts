import { ActionRowBuilder, TextInputBuilder } from "@discordjs/builders";
import { ActionRowModalData, CacheType, ModalBuilder, ModalSubmitInteraction, TextInputStyle } from "discord.js";
import { BaseModal } from "../baseModal.js";
import { Schedule, School, SchoolKeys } from "../../data/types/schedule.js";
import fs from 'fs';
import { parseSchedule } from "../../formatting/parseSchedule.js";

class ScheduleUpload_Modal extends BaseModal {
    public modalBuilder = new ModalBuilder()
    .setCustomId("schedule_modal")
    .setTitle("Input your schedule")
    .setComponents(
        new ActionRowBuilder<TextInputBuilder>()
            .setComponents(new TextInputBuilder()
                .setCustomId("username")
                .setMaxLength(20)
                .setPlaceholder("Display name")
                .setRequired(true)
                .setLabel("Your display name")
                .setStyle(TextInputStyle.Short)),
        new ActionRowBuilder<TextInputBuilder>()
            .setComponents(new TextInputBuilder()
                .setCustomId("schedule")
                .setPlaceholder("Your schedule here")
                .setRequired(true)
                .setLabel("Your schedule")
                .setStyle(TextInputStyle.Paragraph)),
        new ActionRowBuilder<TextInputBuilder>()
            .setComponents(new TextInputBuilder()
                .setCustomId("school")
                .setMaxLength(1)
                .setPlaceholder("School ID")
                .setRequired(true)
                .setLabel("1 = Vanier, 2 = Bdeb, 3 = Other")
                .setStyle(TextInputStyle.Short))); 

    async reply(interaction: ModalSubmitInteraction<CacheType>, userId: string, components: ActionRowModalData[]): Promise<void> {
        const username = components[0].components[0].value;
        const rawSchedule = components[0].components[0].value;
        const rawSchoolId = components[0].components[0].value;
        let userAlreadyExists = false;

        let schoolId: number;

        try {
            schoolId = parseInt(rawSchoolId);
        }
        catch {
            await interaction.reply("**School ID was invalid!**");
            return;
        }

        if (schoolId < 0 || schoolId > 3) {
            await interaction.reply("**School ID was invalid!**");
            return;
        }

        const school = School[SchoolKeys[schoolId] as keyof typeof SchoolKeys];

        // Log in case people want to fuck over the bot
        const currentDate = new Date();
        fs.writeFileSync(`./logs/scheduleUploadLogs/${currentDate.toISOString().replaceAll(":","-")}_${userId}.txt`, rawSchedule);

        const existingSchedulesFilenames = fs.readdirSync("./data/schedules/");
        for (const existingScheduleFilename of existingSchedulesFilenames) {
            const existingScheduleFilenameWithoutExtension = existingScheduleFilename.split(".")[0];

            // If user is already registered, then they can change their own name
            if (existingScheduleFilenameWithoutExtension == userId) {
                userAlreadyExists = true;
                continue;
            }

            const existingSchedule: Schedule = JSON.parse(fs.readFileSync(`./data/schedules/${existingScheduleFilename}`).toString());

            // If username includes any other person's name without spaces, then do not allow
            if (username.toLowerCase().includes(existingSchedule.displayName.toLowerCase().replaceAll(" ", ""))) {
                await interaction.reply("**Username cannot match already existing name!**");
                return;
            }
        }

        let newSchedule;

        try {
            newSchedule = parseSchedule(rawSchedule, username, school);
        }
        catch (error) {
            await interaction.reply(`
                **Invalid schedule declaration! Please follow the instructions provided by /help. 
                Note that you cannot upload schedule from a mobile device, as the formatting is wrong on them.**`);
            return;
        }

        if (newSchedule == null) {
            await interaction.reply("**Schedule is invalid. No classes were parsed. If you think this was a mistake, contact <@337662083523018753>**");
            return;
        }

        fs.writeFileSync(`./schedules/${userId}.json`, JSON.stringify(newSchedule, null, "\t"));

        if (userAlreadyExists)
        {
            interaction.reply("**Successfully replaced old schedule!**")
        }
        else
        {
            interaction.reply("**Successfully uploaded new schedule!**")
        }
    }
}

export {ScheduleUpload_Modal}
