import { SlashCommandBuilder } from "discord.js";
import { Command } from "./Command.js";
import { CommandInteraction, CommandOptions, InteractionReply } from "../../dto/InteractionArguments.js";

export abstract class CRUDCommand extends Command {
    abstract commandBuilder: Pick<SlashCommandBuilder, "name" | "description" | "toJSON">;

    abstract reply(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply>;

    abstract replyRead(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply>;
    abstract replyCreate(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply>;
    abstract replyDelete(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply>;
}
