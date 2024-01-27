// prettier-ignore
import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandUserOption, SlashCommandStringOption } from "discord.js";
import { BaseCRUDCommand } from "../BaseCRUDCommand.js";
import { PermissionsManager } from "../../../administration/PermissionsManager.js";
import { CommandInteraction, CommandOptions, InteractionReply } from "../../../dto/InteractionArguments.js";
import { Authlevel } from "../../../dto/AuthLevel.js";
import { Application } from "../../../Application.js";
import { MongoModels } from "../../../dto/MongoModels.js";
import { ISchedule } from "../../../dto/Schedule.js";
import { ScheduleFormatter } from "../../../UI/ScheduleFormatter.js";
import { ModalLoader } from "../ModalLoader.js";
import { Logger } from "../../../logging/Logger.js";
import Modal_ScheduleUpload from "../modals/Modal_UploadSchedule.js";
import fs from "fs";

class Command_Schedule extends BaseCRUDCommand {
    // prettier-ignore
    public commandBuilder = new SlashCommandBuilder()
        .setName("schedule")
        .setDescription("Manage schedules")
        .setDefaultMemberPermissions("8")
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("upload")
            .setDescription("Upload or update a schedule"))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("remove")
            .setDescription("Removes schedule")
            .addUserOption(new SlashCommandUserOption()
                .setName("user")
                .setDescription("User to remove schedule of")))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("get")
            .setDescription("Gets schedule")
            .addUserOption(new SlashCommandUserOption()
                .setName("user")
                .setDescription("User to get schedule of")))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("getall")
            .setDescription("Gets a list of all schedule"))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("setdisplayname")
            .setDescription("Sets display name")
            .addStringOption(new SlashCommandStringOption()
                .setName("display_name")
                .setDescription("New display name")
                .setRequired(true))
            .addUserOption(new SlashCommandUserOption()
                .setName("user")
                .setDescription("User to get schedule of")));

    async reply(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        if (await PermissionsManager.getUserBanned(executorId)) {
            return { content: "**You are banned! You cannot use this command.**" };
        }

        const destinator = options.getUser("user");
        if (destinator != null && executorId != destinator.id && (await PermissionsManager.getUserAuthLevel(executorId)) != Authlevel.admin) {
            return "**You are not an administrator! You can only modify your own schedule!**";
        }

        const subcommand = options.getSubcommand(true) as "upload" | "remove" | "get" | "getall" | "setdisplayname";

        let returnVal;
        switch (subcommand) {
            case "upload":
                returnVal = await this.replyCreate(interaction, executorId, options);
                break;
            case "remove":
                returnVal = await this.replyDelete(interaction, executorId, options);
                break;
            case "get":
                returnVal = await this.replyRead(interaction, executorId, options);
                break;
            case "getall":
                returnVal = await this.replyReadAll(interaction, executorId, options);
                break;
            case "setdisplayname":
                returnVal = await this.replySetDisplayname(interaction, executorId, options);
                break;
        }

        Application.instance.discordClient.periodicMessage.fetchNewestData();
        return returnVal;
    }

    async replyRead(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const userId: string = options.getUser("user")?.id || executorId;

        const schedule: ISchedule | null = (await Application.instance.collections.schedules.findOne({ userId: userId })) as MongoModels.Schedule | null;
        if (schedule == null) {
            return "**You do not have a schedule registered!**";
        }

        return { content: ScheduleFormatter.formatFullSchedule(schedule) };
    }

    async replyCreate(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const modalToShow = ModalLoader.getModalByCustomId("schedule_modal");

        if (modalToShow == undefined) {
            Logger.warn("Was not able to find a modal!");
            return `500 - Internal Server Error`;
        }
        try {
            await interaction.showModal(new Modal_ScheduleUpload().modalBuilder);
        } catch (e) {
            console.log(e);
            fs.writeFileSync("./debug.json", JSON.stringify(e, null, "\t"));
        }
        return null;
    }

    async replyDelete(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const searchUserId: string = options.getUser("user")?.id || executorId;

        const schedule = (await Application.instance.collections.bannedUsers.findOne({ userId: searchUserId })) as unknown as MongoModels.BannedUser | null;
        if (schedule == null) {
            return "**You do not have a schedule registered!**";
        }

        await Application.instance.collections.schedules.deleteOne({ userId: searchUserId });
        return "**Successfully deleted your schedule!**";
    }

    async replyReadAll(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const registeredSchedulesCount = await Application.instance.collections.schedules.estimatedDocumentCount();
        if (registeredSchedulesCount == 0) {
            return "**No schedules are registered!**";
        }

        const schedules = (await Application.instance.collections.schedules.find().toArray()) as unknown as MongoModels.Schedule[];
        let stringOutput = "# Registered schedules:\n";

        for (const schedule of schedules) {
            stringOutput += `@<${schedule.userId}> with ID \`${schedule.userId}\`\n`;
        }

        return { content: stringOutput, ephemeral: true, allowedMentions: { users: [], roles: [] } };
    }

    async replySetDisplayname(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const userId: string = options.getUser("user")?.id || executorId;

        const schedule: ISchedule | null = (await Application.instance.collections.schedules.findOne({ userId: userId })) as MongoModels.Schedule | null;
        if (schedule == null) {
            return "**You do not have a schedule registered!**";
        }

        schedule.displayName = options.getString("display_name", true);
        await Application.instance.collections.schedules.replaceOne({ userId: userId }, schedule);

        return "**Successfully replaced display name!";
    }
}

export default Command_Schedule;
