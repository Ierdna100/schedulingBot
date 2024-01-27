import { SlashCommandBuilder, CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver } from "discord.js";
import { CommandInteraction, CommandOptions, InteractionReply } from "../../dto/InteractionArguments.js";

export abstract class BaseCommand {
    abstract commandBuilder: Pick<SlashCommandBuilder, "name" | "description" | "toJSON">;

    abstract reply(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply>;
}
