import { SlashCommandBuilder, ChatInputCommandInteraction, CacheType, CommandInteractionOptionResolver, SlashCommandSubcommandBuilder, SlashCommandUserOption, SlashCommandStringOption } from "discord.js";
import { BaseCRUDCommand } from "../baseCRUDCommand.js";
import fs from 'fs';
import { formatFullSchedule } from "../../formatting/formatSchedule.js";
import { Schedule } from "../../data/types/schedule.js";
import { scheduleModal } from "../modals/uploadScheduleModal.js";

class Schedule_Command extends BaseCRUDCommand {
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
            .addUserOption(new SlashCommandUserOption()
                .setName("user")
                .setDescription("User to get schedule of"))
            .addStringOption(new SlashCommandStringOption()
                .setName("display_name")
                .setDescription("New display name")
                .setRequired(true)));

    async reply(interaction: ChatInputCommandInteraction<CacheType>, userId: string, isOp: boolean, isBanned: boolean, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        if (isBanned) {
            await interaction.reply({content: "**You are banned! You cannot use this command.**"});
            return;
        }

        const subcommand = options.getSubcommand(true);

        switch (subcommand) {
            case "upload":
                await this.replyPost(interaction, userId, options);
                break;
            case "remove":
                if (options.getUser("user") != undefined && !isOp) {
                    await interaction.reply("**You are not opped! You cannot remove the schedule of another user!");
                    return;
                }

                await this.replyDelete(interaction, userId, options);
                break;
            case "get":
                await this.replyGet(interaction, userId, options);
                break;
            case "getall":
                await this.replyGetAll(interaction, userId, options);
                break;
            case "setdisplayname":
                if (options.getUser("user") != undefined && !isOp) {
                    await interaction.reply("**You are not opped! You cannot set the display name of another user!");
                    return;
                }

                await this.replySetDisplayname(interaction, userId, options);
                break;
        }
    }

    async replyGet(interaction: ChatInputCommandInteraction<CacheType>, userId: string, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        const scheduleFilepaths: string[] = JSON.parse(fs.readdirSync("./data/schedules/").toString());

        const searchUserId: string = options.getUser("user")?.id || userId;

        for (const scheduleFilepath of scheduleFilepaths) {
            const scheduleFilepathWithoutExtension = scheduleFilepath.split(".")[0];
            
            if (scheduleFilepathWithoutExtension == searchUserId) {
                const schedule: Schedule = JSON.parse(fs.readFileSync(`./data/schedules/${scheduleFilepath}`).toString());

                await interaction.reply({ content: formatFullSchedule(schedule) });
                return;
            }
        }

        await interaction.reply("**You do not have a schedule registered!**");
    }

    async replyPost(interaction: ChatInputCommandInteraction<CacheType>, userId: string, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        await interaction.showModal(scheduleModal);
    }

    async replyDelete(interaction: ChatInputCommandInteraction<CacheType>, userId: string, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        const scheduleFilepaths: string[] = JSON.parse(fs.readdirSync("./data/schedules/").toString());

        const searchUserId: string = options.getUser("user")?.id || userId;

        for (const scheduleFilepath of scheduleFilepaths) {
            const scheduleFilepathWithoutExtension = scheduleFilepath.split(".")[0];

            if (searchUserId == scheduleFilepathWithoutExtension) {
                fs.unlinkSync(`./data/schedules/${scheduleFilepath}`);

                interaction.reply("**Removed your schedule!**");
                return;
            }
        }

        await interaction.reply("**You do not have a schedule registered!**");
    }

    async replyGetAll(interaction: ChatInputCommandInteraction<CacheType>, userId: string, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        const scheduleFilepaths: string[] = JSON.parse(fs.readdirSync("./data/schedules/").toString());

        if (scheduleFilepaths.length == 0) {
            interaction.reply("**No registered schedules!**");
            return;
        }

        let stringOutput = "# Registered schedules:\n";

        for (const scheduleFilepath of scheduleFilepaths) {
            const userId = scheduleFilepath.split(".")[0];

            stringOutput += `@<${userId}> with ID \`${userId}\`\n`;
        }

        await interaction.reply({content: stringOutput, ephemeral: true, allowedMentions: { users: [], roles: [] }});
    }

    async replySetDisplayname(interaction: ChatInputCommandInteraction<CacheType>, userId: string, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        const scheduleFilepaths: string[] = JSON.parse(fs.readdirSync("./data/schedules/").toString());

        const searchUserId: string = options.getUser("user")?.id || userId;
        const newDisplayname: string = options.getString("display_name", true);

        for (const scheduleFilepath of scheduleFilepaths) {
            const scheduleFilepathWithoutExtension = scheduleFilepath.split(".")[0];

            if (scheduleFilepathWithoutExtension == searchUserId) {
                const schedule: Schedule = JSON.parse(fs.readFileSync(`./data/schedules/${scheduleFilepath}`).toString());
                schedule.displayName = newDisplayname;
                fs.readFileSync(JSON.stringify(`./data/schedules/${scheduleFilepath}`, null, "\t"));

                await interaction.reply("Updated display name!");
                return;
            }
        }

        await interaction.reply("**You do not have a schedule registered!**");
    }
}

export default Schedule_Command;
