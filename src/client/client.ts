import { Client, GatewayIntentBits } from "discord.js";
import { onClientReady } from "./onReady.js";
import { onInteractionCreate } from "./onInteractionCreate.js";
import { onError } from "./onError.js";
import { CommandLoader } from "../commands/commands.js";
import { ModalLoader } from "../commands/modals.js";

class DiscordClient {
    public client: Client;
    public clientRunning = false;

    constructor() {
        new CommandLoader().loadCommands();
        new ModalLoader().loadModals();
    
        this.client = new Client({ intents: [GatewayIntentBits.Guilds] })
    
        this.client.on('ready', () => { onClientReady(this) });
        this.client.on('interactionCreate', (interaction) => { onInteractionCreate(interaction, this) });
        this.client.on('error', () => { onError(this) });
    
        this.client.login(process.env.token);
    }
}

export {DiscordClient};
