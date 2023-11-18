import { getClient } from "./client";

export function onClientReady() {
    console.log(`Websocket ready and connected as: ${getClient().user?.tag}`);
    
}
