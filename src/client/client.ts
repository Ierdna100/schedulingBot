import { Client, GatewayIntentBits } from "discord.js";
import { onClientReady } from "./onReady";
import { onInteractionCreate } from "./onInteractionCreate";
import { onError } from "./onError";

let discordClient: Client;
let clientRunning = false;

export function createClient() {
    discordClient = new Client({ intents: [GatewayIntentBits.Guilds] })

    discordClient.on('ready', onClientReady);
    discordClient.on('interactionCreate', onInteractionCreate);
    discordClient.on('error', onError);

    discordClient.login(process.env.token);
    clientRunning = true;
}

export function getClient() {
    return discordClient;
}

export function getClientRunning() {
    return clientRunning;
}
