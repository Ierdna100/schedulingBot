import fs from "fs";
import { Command } from "./Command.js";

export class CommandLoader {
    public static commands: Command[] = [];

    public static async loadCommands() {
        CommandLoader.commands = [];

        const commandFileNames = fs.readdirSync("./build/discordServer/commands/commands/");

        for (const commandFileName of commandFileNames) {
            let command: { default: new () => Command } = await import(`./commands/${commandFileName}`);
            CommandLoader.commands.push(new command.default());
        }
    }

    public static getCommandByName(name: string): Command | undefined {
        for (const command of CommandLoader.commands) {
            if (command.commandBuilder.name == name) {
                return command;
            }
        }

        return undefined;
    }
}
