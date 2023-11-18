import BaseCommand from './baseCommand.js';
import fs from 'fs';

class CommandLoader {
    public static commands: BaseCommand[] = [];

    public async loadCommands() {
        CommandLoader.commands = []

        const commandFileNames = fs.readdirSync('./build/commands/commands/');

        for (const commandFileName of commandFileNames) {
            let command = await import(`./commands/${commandFileName}`);
            CommandLoader.commands.push(new command.default)
        }
    }
}

export {CommandLoader};
