// prettier-ignore
import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandUserOption } from "discord.js";
import { PermissionsManager } from "../../../administration/PermissionsManager.js";
import { Authlevel } from "../../../dto/AuthLevel.js";
import { Application } from "../../../Application.js";
import { MongoModels } from "../../../dto/MongoModels.js";
import { CommandInteraction, CommandOptions, InteractionReply } from "../../../dto/InteractionArguments.js";
import { CRUD } from "../../../dto/CRUD.js";
import { Command } from "../Command.js";

class Command_Banlist extends Command {
    // prettier-ignore
    public commandBuilder = new SlashCommandBuilder()
        .setName("banlist")
        .setDescription("Manage the banlist")
        .setDefaultMemberPermissions("8")
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName(CRUD.create)
            .setDescription("Adds user to the banlist")
            .addUserOption(new SlashCommandUserOption()
                .setName("user")
                .setDescription("User to add to banlist")
                .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName(CRUD.delete)
            .setDescription("Removes user from banlist")
            .addUserOption(new SlashCommandUserOption()
                .setName("user")
                .setDescription("User to remove from banlist")
                .setRequired(true)))
        .addSubcommand(new SlashCommandSubcommandBuilder()
            .setName(CRUD.read)
            .setDescription("Gets the banlist"));

    async reply(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        if ((await PermissionsManager.getUserAuthLevel(executorId)) != Authlevel.admin) {
            await interaction.reply({ content: "**You are not an administrator! You cannot use this command.**" });
        }

        const subcommand = options.getSubcommand(true) as CRUD;

        switch (subcommand) {
            case CRUD.create:
                return await this.replyCreate(interaction, executorId, options);
            case CRUD.delete:
                return await this.replyDelete(interaction, executorId, options);
            case CRUD.read:
                return await this.replyRead(interaction, executorId, options);
        }
    }

    async replyRead(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const bannedUsersCount = await Application.instance.collections.bannedUsers.estimatedDocumentCount();
        if (bannedUsersCount == 0) {
            return "**No users are banned!**";
        }

        const bannedUsers = (await Application.instance.collections.bannedUsers.find().toArray()) as unknown as MongoModels.BannedUser[];
        let stringOutput = "# Banned users:\n";
        for (const bannedUser of bannedUsers) {
            stringOutput += `<@${bannedUser.userId}> with ID: \`${bannedUser.userId}\`\n`;
        }

        return { content: stringOutput, allowedMentions: {}, ephemeral: true };
    }

    async replyCreate(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const searchId = options.getUser("user", true).id;
        const bannedUser = (await Application.instance.collections.bannedUsers.findOne({ userId: searchId })) as unknown as MongoModels.BannedUser | null;
        if (bannedUser != null) {
            return "User is already banned!";
        }

        const bannedUserId = options.getUser("user", true).id;

        await Application.instance.collections.bannedUsers.insertOne({
            userId: bannedUserId
        });

        return `**Banned user <@${bannedUserId}> with ID:** \`${bannedUserId}\``;
    }

    async replyDelete(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const searchUserId: string = options.getUser("user", true).id;
        const bannedUser = (await Application.instance.collections.bannedUsers.findOne({ userId: searchUserId })) as unknown as MongoModels.BannedUser | null;

        if (bannedUser == null) {
            return "**User was not banned!**";
        }

        await Application.instance.collections.bannedUsers.deleteOne({ userId: searchUserId });
        return "**Successfully unbanned user!**";
    }
}

export default Command_Banlist;
