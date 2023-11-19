import { SlashCommandBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import { BaseCommand } from './baseCommand.js';

abstract class BaseCRUDCommand extends BaseCommand {
    abstract commandBuilder: Pick<SlashCommandBuilder, "name" | "description" | "toJSON">;

    abstract reply(
        interaction: ChatInputCommandInteraction<CacheType>, 
        userId: string, 
        isOp: boolean, 
        isBanned: boolean, 
        options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">
        ): Promise<void>;

    abstract replyGet(
        interaction: ChatInputCommandInteraction<CacheType>, 
        userId: string,
        options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">
        ): Promise<void>;
    abstract replyPost(
        interaction: ChatInputCommandInteraction<CacheType>, 
        userId: string, 
        options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">
        ): Promise<void>;
    abstract replyDelete(
        interaction: ChatInputCommandInteraction<CacheType>, 
        userId: string, 
        options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">
        ): Promise<void>;
}

export {BaseCRUDCommand};
