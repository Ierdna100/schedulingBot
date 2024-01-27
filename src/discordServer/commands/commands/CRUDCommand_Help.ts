import { SlashCommandBuilder, ChatInputCommandInteraction, CacheType, CommandInteractionOptionResolver } from "discord.js";
import { CommandLoader } from "../CommandLoader.js";
import { CommandInteraction, CommandOptions, InteractionReply } from "../../../dto/InteractionArguments.js";
import { Command } from "../Command.js";

class Command_Help extends Command {
    // prettier-ignore
    public commandBuilder = new SlashCommandBuilder()
        .setName("help")
        .setDescription("Get help");

    async reply(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        let stringOutput = "";

        for (const command of CommandLoader.commands) {
            const commandName = command.commandBuilder.name;
            const commandDescription = command.commandBuilder.description;

            stringOutput += `\`/${commandName}\` - ${commandDescription}\n`;
        }

        return stringOutput;
    }
}

export default Command_Help;
