import fs from "fs";
import { BaseCommand } from "./BaseCommand.js";

export class CommandLoader {
    public static commands: BaseCommand[] = [];

    public static async loadCommands() {
        CommandLoader.commands = [];

        const commandFileNames = fs.readdirSync("./build/discordServer/commands/commands/");

        for (const commandFileName of commandFileNames) {
            let command: { default: new () => BaseCommand } = await import(`./commands/${commandFileName}`);
            CommandLoader.commands.push(new command.default());
        }
    }

    public static getCommandByName(name: string): BaseCommand | undefined {
        for (const command of CommandLoader.commands) {
            if (command.commandBuilder.name == name) {
                return command;
            }
        }

        return undefined;
    }
}
