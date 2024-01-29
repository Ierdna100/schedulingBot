// prettier-ignore
import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandUserOption, SlashCommandStringOption } from "discord.js";
import { CRUDCommand } from "../CRUDCommand.js";
import { PermissionsManager } from "../../../administration/PermissionsManager.js";
import { CommandInteraction, CommandOptions, InteractionReply } from "../../../dto/InteractionArguments.js";
import { Authlevel } from "../../../dto/AuthLevel.js";
import { Application } from "../../../Application.js";
import { MongoModels } from "../../../dto/MongoModels.js";
import { ISchedule } from "../../../dto/Schedule.js";
import { ScheduleFormatter } from "../../../UI/ScheduleFormatter.js";
import { ModalLoader } from "../ModalLoader.js";

class Command_Schedule extends CRUDCommand {
    // prettier-ignore
    public commandBuilder = new SlashCommandBuilder()
        .setName("schedule")
        .setDescription("Manage schedules")
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
            Application.logger.info(`User with ID ${executorId} was banned, could not use schedules command`);
            return { content: "**You are banned! You cannot use this command.**", ephemeral: true };
        }

        const destinator = options.getUser("user");
        if (destinator != null && executorId != destinator.id && (await PermissionsManager.getUserAuthLevel(executorId)) != Authlevel.admin) {
            Application.logger.info(`User with ID ${executorId} was not admin, could not use schedules command`);
            return { content: "**You are not an administrator! You can only modify your own schedule!**", ephemeral: true };
        }

        const subcommand = options.getSubcommand(true) as "upload" | "remove" | "get" | "getall" | "setdisplayname";
        Application.logger.info(`User ${executorId} executed schedule command with subcommand ${subcommand}`);
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
            Application.logger.info(`User ${executorId} had no schedule registered`);
            return { content: "**You do not have a schedule registered!**", ephemeral: true };
        }

        return { content: ScheduleFormatter.formatFullSchedule(schedule) };
    }

    async replyCreate(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const modalToShow = ModalLoader.getModalByCustomId("schedule_modal");

        if (modalToShow == undefined) {
            Application.logger.error(new Error("Was not able to find a modal!"));
            return { content: `500 - Internal Server Error`, ephemeral: true };
        }

        await interaction.showModal(modalToShow.modalBuilder);
        return null;
    }

    async replyDelete(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const searchUserId: string = options.getUser("user")?.id || executorId;

        const schedule = (await Application.instance.collections.schedules.findOne({ userId: searchUserId })) as unknown as MongoModels.Schedule | null;
        if (schedule == null) {
            Application.logger.info(`User ${executorId} had no schedule registered`);
            return { content: "**You do not have a schedule registered!**", ephemeral: true };
        }

        await Application.instance.collections.schedules.deleteOne({ userId: searchUserId });
        Application.logger.info(`User ${executorId} deleted their schedule`);
        return { content: "**Successfully deleted your schedule!**", ephemeral: true };
    }

    async replyReadAll(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const registeredSchedulesCount = await Application.instance.collections.schedules.estimatedDocumentCount();
        if (registeredSchedulesCount == 0) {
            Application.logger.info(`User ${executorId} read all schedules, but none were registered`);
            return { content: "**No schedules are registered!**", ephemeral: true };
        }

        const schedules = (await Application.instance.collections.schedules.find().toArray()) as unknown as MongoModels.Schedule[];
        let stringOutput = "# Registered schedules:\n";

        for (const schedule of schedules) {
            stringOutput += `<@${schedule.userId}> with ID \`${schedule.userId}\`\n`;
        }

        Application.logger.info(`User ${executorId} read all schedules, there were ${schedules.length} registered`);
        return { content: stringOutput, ephemeral: true, allowedMentions: { users: [], roles: [] } };
    }

    async replySetDisplayname(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const userId: string = options.getUser("user")?.id || executorId;

        const schedule: ISchedule | null = (await Application.instance.collections.schedules.findOne({ userId: userId })) as MongoModels.Schedule | null;
        if (schedule == null) {
            Application.logger.info(`User ${executorId} had no schedule registered`);
            return { content: "**You do not have a schedule registered!**", ephemeral: true };
        }

        const oldDisplayName = schedule.displayName;
        schedule.displayName = options.getString("display_name", true);
        await Application.instance.collections.schedules.replaceOne({ userId: userId }, schedule);

        Application.logger.info(`User ${executorId} replaced display name from "${oldDisplayName}" to "${schedule.displayName}"`);
        return { content: "**Successfully replaced display name!**", ephemeral: true };
    }
}

export default Command_Schedule;
