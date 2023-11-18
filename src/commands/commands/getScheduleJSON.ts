import { SlashCommandBuilder, SlashCommandUserOption, ChatInputCommandInteraction, CacheType, CommandInteractionOptionResolver, CommandInteractionOption } from 'discord.js';
import BaseCommand from '../baseCommand.js';
import fs from 'fs';
import path from 'path'

class getScheduleJSON_Command extends BaseCommand {
    public command = new SlashCommandBuilder()
        .setName("getschedulejson")
        .setDescription("Returns the schedule of the specified user as it appears in the database (formatted as JSON).")
        .addUserOption(new SlashCommandUserOption()
            .setName("target_user")
            .setDescription("User to fetch schedule JSON file from.")
            .setRequired(false));

    public async reply(interaction: ChatInputCommandInteraction<CacheType>, userId: string, isOp: boolean, isBanned: boolean, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        if (isBanned) {
            await interaction.reply({ content: "You are banned! You cannot use this command." });
            return;
        }

        const targettedUser = options.get("target_user")

        let userSearchId: string
        if (targettedUser == null || targettedUser.value == undefined) {
            userSearchId = userId;
        }
        else {
            userSearchId = targettedUser.value.toString();
        }

        const usersDirectory = fs.readdirSync("./data/schedules/")

        for (const userFilename of usersDirectory) {
            const userFilenameWithoutExtension = userFilename.split('.')[0];

            if (userFilenameWithoutExtension == userSearchId) {
                console.log(path.resolve('./'))
                await interaction.reply({
                    files: [
                        `./data/schedules/${userFilename}`
                    ]
                });
                return
            }
        }
        await interaction.reply(`**No schedules were found for selected user with ID ${userSearchId}**`)
    }
}

export default getScheduleJSON_Command;
