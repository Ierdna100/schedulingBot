import { CacheType, Client, Interaction } from "discord.js";
import { CommandLoader } from "./commands/CommandLoader.js";
import { ModalLoader } from "./commands/ModalLoader.js";
import { Application } from "../Application.js";
import { Logger } from "../logging/Logger.js";
import { PeriodicMessage } from "./periodicMessages/PeriodicMessage.js";

export class DiscordClient {
    public client!: Client;
    public periodicMessage!: PeriodicMessage;

    constructor() {
        Application.instance.discordClient = this;

        this.initializeDiscordClient();
    }

    private async initializeDiscordClient() {
        this.client = new Client({ intents: [] });

        CommandLoader.loadCommands();
        ModalLoader.loadModals();

        this.client.on("ready", () => this.onReady());
        this.client.on("interactionCreate", (interaction) => this.onInteractionCreate(interaction));
        this.client.on("error", (error) => this.onError(error));

        await this.client.login(Application.instance.env.token);

        this.periodicMessage = new PeriodicMessage(Application.instance.env.updateChannelId);
    }

    private onReady() {
        Logger.info("Discord server started!");
        Logger.info(`Websocket ready and connected as ${this.client.user?.tag}`);
    }

    private async onInteractionCreate(interaction: Interaction<CacheType>) {
        if (interaction.isChatInputCommand()) {
            console.log(`Trying to handle command of name ${interaction.commandName}`);
            const command = CommandLoader.getCommandByName(interaction.commandName);

            if (command == undefined) {
                Logger.warn(`Command ${interaction.commandName} is not handled!`);
                await interaction.reply({ content: "`500 - Internal Server Error`" });
                return;
            }

            const userId = interaction.user.id;
            const options = interaction.options;
            const replyMessage = await command.reply(interaction, userId, options);

            console.log(`Interaction reply is: ${replyMessage}`);
            if (replyMessage != null) {
                interaction.reply(replyMessage);
            }
            return;
        }

        if (interaction.isModalSubmit()) {
            const modal = ModalLoader.getModalByCustomId(interaction.customId);

            if (modal == undefined) {
                Logger.warn(`Modal ${interaction.customId} is not handled!`);
                await interaction.reply({ content: "`500 - Internal Server Error`" });
                return;
            }

            const userId = interaction.user.id;
            const fields = interaction.fields;
            const replyMessage = await modal.reply(interaction, userId, fields);

            if (replyMessage != null) {
                interaction.reply(replyMessage);
            }
            return;
        }
    }

    private async onError(error: Error) {
        Logger.error(error);
    }
}
