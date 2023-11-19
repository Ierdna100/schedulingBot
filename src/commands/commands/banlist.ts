import { SlashCommandBuilder, ChatInputCommandInteraction, CacheType, CommandInteractionOptionResolver, SlashCommandSubcommandBuilder, SlashCommandUserOption, SlashCommandBooleanOption, User } from "discord.js";
import { BaseCRUDCommand } from "../baseCRUDCommand.js";
import fs from 'fs';

class Banlist_Command extends BaseCRUDCommand {
    public commandBuilder = new SlashCommandBuilder()
        .setName("banlist")
        .setDescription("Manage the banlist")
        .setDefaultMemberPermissions("8")
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("add")
            .setDescription("Adds user to the banlist")
            .addUserOption(new SlashCommandUserOption()
                .setName("user")
                .setDescription("User to add to banlist")
                .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("remove")
            .setDescription("Removes user from banlist")
            .addUserOption(new SlashCommandUserOption()
                .setName("user")
                .setDescription("User to remove from banlist")
                .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName("get")
            .setDescription("Gets the banlist"));

    async reply(interaction: ChatInputCommandInteraction<CacheType>, userId: string, isOp: boolean, isBanned: boolean, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        if (!isOp) {
            await interaction.reply({content: "**You are not an administrator! You cannot use this command.**"});
            return;
        }

        const subcommand = options.getSubcommand(true);

        switch (subcommand) {
            case "add":
                await this.replyPost(interaction, userId, options);
                break;
            case "remove":
                await this.replyDelete(interaction, userId, options);
                break;
            case "get":
                await this.replyGet(interaction, userId, options);
                break;
        }
    }

    async replyGet(interaction: ChatInputCommandInteraction<CacheType>, userId: string, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        const bannedUsers: string[] = JSON.parse(fs.readFileSync("./data/bannedUsers.json").toString());

        if (bannedUsers.length == 0) {
            await interaction.reply("**No users are banned!**");
            return;
        }

        let stringOutput = "# Banned users:\n";

        for (const bannedUser of bannedUsers) {
            stringOutput += `<@${bannedUser}> with ID: \`${bannedUser}\`\n`;
        }

        interaction.reply({content: stringOutput, allowedMentions: {}, ephemeral: true});
    }

    async replyPost(interaction: ChatInputCommandInteraction<CacheType>, userId: string, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        const bannedUsers: string[] = JSON.parse(fs.readFileSync("./data/bannedUsers.json").toString());

        const searchUserId: string = options.getUser("user", true).id;

        for (const bannedUser of bannedUsers) {
            if (bannedUser == searchUserId) {
                interaction.reply("**User is already banned!**");
                return;
            }
        }

        bannedUsers.push(searchUserId);

        fs.writeFileSync("./data/bannedUsers.json", JSON.stringify(bannedUsers, null, "\t"));
        await interaction.reply(`**Banned user <@${searchUserId}> with ID: \`${searchUserId}\``);
    }

    async replyDelete(interaction: ChatInputCommandInteraction<CacheType>, userId: string, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        let bannedUsers: string[] = JSON.parse(fs.readFileSync("./data/bannedUsers.json").toString());

        const searchUserId: string = options.getUser("user", true).id;

        if (bannedUsers.length == 0) {
            await interaction.reply("**No users are banned!**");
            return;
        }

        for (let i = 0; i < bannedUsers.length; i++) {
            if (bannedUsers[i] == searchUserId) {
                const lastElement = bannedUsers.pop();

                if (lastElement == undefined) {
                    bannedUsers = [];
                    break;
                }

                bannedUsers[i] = lastElement;

                fs.writeFileSync("./data/bannedUsers.json", JSON.stringify(bannedUsers, null, "\t"));
                interaction.reply(`**Unbanned user <@${lastElement}> with ID \`${lastElement}\`**`);
                return;
            }
        }

        await interaction.reply("**User was not banned!**");
    }
}

export default Banlist_Command;
