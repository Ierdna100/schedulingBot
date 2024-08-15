import { CacheType, Client, Interaction } from "discord.js";
import { CommandLoader } from "./commands/CommandLoader.js";
import { ModalLoader } from "./commands/ModalLoader.js";
import { Application } from "../Application.js";
import { Logger } from "../logging/Logger.js";
import { PeriodicMessage_Schedules } from "./periodicMessages/PeriodicMessage_Schedules.js";
import { PeriodicMessage } from "./PeriodicMessage.js";
import Command_UploadHelp from "./commands/commands/Command_UploadHelp.js";

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

        this.periodicMessage = new PeriodicMessage_Schedules(Application.instance.env.updateChannelId);
    }

    private onReady() {
        Application.logger.info("Discord server started!");
        Application.logger.info(`Websocket ready and connected as ${this.client.user?.tag}`);
    }

    private async onInteractionCreate(interaction: Interaction<CacheType>) {
        if (interaction.isChatInputCommand()) {
            Application.logger.info(
                `Trying to handle command of name ${interaction.commandName} sent by user ${interaction.user.displayName} with ID ${interaction.user.id}`
            );
            const command = CommandLoader.getCommandByName(interaction.commandName);

            if (command == undefined) {
                Application.logger.error(new Error(`Command ${interaction.commandName} is not handled!`));
                await interaction.reply({ content: "`500 - Internal Server Error`" });
                return;
            }

            const userId = interaction.user.id;
            const options = interaction.options;
            const replyMessage = await command.reply(interaction, userId, options);

            if (replyMessage != null) {
                interaction.reply(replyMessage);
            }
            return;
        }

        if (interaction.isModalSubmit()) {
            const modal = ModalLoader.getModalByCustomId(interaction.customId);

            if (modal == undefined) {
                Application.logger.error(new Error(`Modal ${interaction.customId} is not handled!`));
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

        if (interaction.isButton()) {
            switch (interaction.customId) {
                case "help-prev":
                    Command_UploadHelp.onButtonPrev(interaction);
                    break;
                case "help-next":
                    Command_UploadHelp.onButtonNext(interaction);
                    break;
            }

            return;
        }
    }

    private async onError(error: Error) {
        Application.logger.error(error);
    }
}
