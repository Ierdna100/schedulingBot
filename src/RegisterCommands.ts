import { REST, Routes } from "discord.js";
import * as configDotenv from "dotenv";
import fs from "fs";
import { BaseCommand } from "./discordServer/commands/BaseCommand.js";

async function refreshCommands() {
    configDotenv.config();

    let commands = [];

    for (const file of fs.readdirSync("./build/discordServer/commands/commands/")) {
        let command: { default: new () => BaseCommand } = await import(`./discordServer/commands/commands/${file}`);
        commands.push(new command.default().commandBuilder.toJSON());
    }

    const rest = new REST().setToken(process.env.TOKEN || "");

    console.log("Refreshing commands");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID || ""), { body: commands });

    console.log("Finished refreshing commands");
}

refreshCommands();
