import {REST, Routes, SlashCommandBuilder} from 'discord.js';
import fs from 'fs';
import * as configDotenv from "dotenv";
import { BaseCommand } from '../commands/baseCommand.js';
import { ForegroundConsoleColors } from '../console/consoleColors.js';

configDotenv.config();

class Application {
    public async registerCommands() {
        if (process.env.token == undefined || process.env.clientId == undefined) {
            console.log("Token or clientId not set in .env file!")
            process.exit(1);
        }

        const rest = new REST({ version: '10' }).setToken(process.env.token);

        let commands: Pick<SlashCommandBuilder, "name" | "description">[] = [];

        const commandFilenames = fs.readdirSync("./build/commands/commands/");

        for (const commandFilename of commandFilenames) {
            let command: { default: new () => BaseCommand } = await import(`../commands/commands/${commandFilename}`);
            console.log(`${ForegroundConsoleColors.Blue}Pushing ${commandFilename} to commands list...${ForegroundConsoleColors.Base}`);
            commands.push(new command.default().commandBuilder.toJSON());
        }

        let currentCommands;

        try {
            console.log("Started refreshing application slash commands...");
            currentCommands = await rest.put(Routes.applicationCommands(process.env.clientId), { body: commands });
            console.log("Successfully reloaded application slash commands.");
        }
        catch (error) {
            console.log(error);
            console.log(`Full error log can be found at ./logs/commandRegisteringLog.json`);
            fs.writeFileSync("./logs/commandRegisteringLog.json", JSON.stringify(error, null, "\t"));
            process.exit(1);
        }

        console.log("Full list of commands and options can be found at ./logs/currentlyRegisteredCommands.json");
        fs.writeFileSync("./logs/currentlyRegisteredCommands.json", JSON.stringify(currentCommands, null, "\t"));
    }
}

new Application().registerCommands();
