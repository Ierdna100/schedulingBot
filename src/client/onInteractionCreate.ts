import { Interaction, CacheType, ChatInputCommandInteraction } from "discord.js";
import isUserOp from "../data/isUserOp.js";
import isUserBanned from "../data/isUserBanned.js";
import {CommandLoader} from "../commands/commands.js";
import { DiscordClient } from "./client.js";

export async function onInteractionCreate(interaction: Interaction<CacheType>, client: DiscordClient) {
    console.log("Interaction created!");
    
    if (interaction.isChatInputCommand()) {
        await handleChatInput(interaction);
    }
    else if (interaction.isModalSubmit()) {
        await handleModalSubmission();
    }
    else if (interaction.isStringSelectMenu()) {
        await handleStringSelectionMenu();
    }
}

async function handleChatInput(interaction: ChatInputCommandInteraction<CacheType>) {
    console.log("Chat input created!");

    const userId = interaction.user.id;
    const options = interaction.options;

    const isOp: boolean = isUserOp(userId);
    const isBanned: boolean = isUserBanned(userId);

    for (const command of CommandLoader.commands) {
        if (command.command.name == interaction.commandName) {
            await command.reply(interaction, userId, isOp, isBanned, options);
            return;
        }
    }

    console.log(`Command ${interaction.commandName} is not handled!`)
    await interaction.reply({ content: "`500 - Internal Server Error`" });
}

async function handleModalSubmission() {

}

async function handleStringSelectionMenu() {

}
