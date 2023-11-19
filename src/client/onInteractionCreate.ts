import { Interaction, CacheType, ChatInputCommandInteraction, ModalMessageModalSubmitInteraction, ModalSubmitInteraction } from "discord.js";
import isUserOp from "../data/isUserOp.js";
import isUserBanned from "../data/isUserBanned.js";
import {CommandLoader} from "../commands/commands.js";
import { DiscordClient } from "./client.js";
import { ModalLoader } from "../commands/modals.js";

export async function onInteractionCreate(interaction: Interaction<CacheType>, client: DiscordClient) {
    console.log("Interaction created!");
    
    if (interaction.isChatInputCommand()) {
        await handleChatInput(interaction);
    }
    else if (interaction.isModalSubmit()) {
        await handleModalSubmission(interaction);
    }
}

async function handleChatInput(interaction: ChatInputCommandInteraction<CacheType>) {
    console.log("Chat input created!");

    const userId = interaction.user.id;
    const options = interaction.options;

    const isOp: boolean = isUserOp(userId);
    const isBanned: boolean = isUserBanned(userId);

    for (const command of CommandLoader.commands) {
        if (command.commandBuilder.name == interaction.commandName) {
            await command.reply(interaction, userId, isOp, isBanned, options);
            return;
        }
    }

    console.log(`Command ${interaction.commandName} is not handled!`)
    await interaction.reply({ content: "`500 - Internal Server Error`" });
}

async function handleModalSubmission(interaction: ModalSubmitInteraction<CacheType>) {
    const userId = interaction.user.id;
    const components = interaction.components;

    for (const modal of ModalLoader.modals) {
        if (modal.modalBuilder.data.custom_id == interaction.customId) {
            await modal.reply(interaction, userId, components);
            return;
        }
    }
}
