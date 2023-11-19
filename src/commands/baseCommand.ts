import { SlashCommandBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver } from 'discord.js';

abstract class BaseCommand {
    abstract commandBuilder: Pick<SlashCommandBuilder, "name" | "description" | "toJSON">;

    abstract reply(
        interaction: ChatInputCommandInteraction<CacheType>, 
        userId: string, 
        isOp: boolean, 
        isBanned: boolean, 
        options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">
        ): Promise<void>;
}

export {BaseCommand};
