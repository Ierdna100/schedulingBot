import { SlashCommandBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { BaseCommand } from "./BaseCommand.js";
import { CommandInteraction, CommandOptions, InteractionReply } from "../../dto/InteractionArguments.js";

export abstract class BaseCRUDCommand extends BaseCommand {
    abstract commandBuilder: Pick<SlashCommandBuilder, "name" | "description" | "toJSON">;

    abstract reply(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply>;

    abstract replyRead(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply>;
    abstract replyCreate(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply>;
    abstract replyDelete(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply>;
}
