import { SlashCommandBuilder, ChatInputCommandInteraction, CacheType, CommandInteractionOptionResolver } from "discord.js";
import { BaseCommand } from "../baseCommand.js";
import { CommandLoader } from "../commands.js";

class Help_Command extends BaseCommand {
    public commandBuilder = new SlashCommandBuilder()
        .setName("help")
        .setDescription("Get help");
    
    async reply(interaction: ChatInputCommandInteraction<CacheType>, userId: string, isOp: boolean, isBanned: boolean, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        let stringOutput = "";
        
        for (const command of CommandLoader.commands) {
            const commandName = command.commandBuilder.name;
            const commandDescription = command.commandBuilder.description;

            stringOutput += `\`/${commandName}\` - ${commandDescription}`;
        }

        await interaction.reply(stringOutput);
        return;
    }

}

export default Help_Command;
