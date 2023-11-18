import { DiscordClient } from "./client.js";

export function onClientReady(client: DiscordClient) {
    console.log("Server started!");
    console.log(`Websocket ready and connected as: ${client.client.user?.tag}`);

    client.clientRunning = true;
}
