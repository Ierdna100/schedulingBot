import { SlashCommandBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver } from 'discord.js';

abstract class BaseCommand {
    abstract command: Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">

    abstract reply(interaction: ChatInputCommandInteraction<CacheType>, userId: string, isOp: boolean, isBanned: boolean, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void>;
}

export default BaseCommand;
