import * as configDotenv from "dotenv";
import { DiscordClient } from "./client/client.js";

class Application {
    constructor() {
        // Dotenv
        configDotenv.config();

        // Discord client
        new DiscordClient();

        // HTTP server control
    }
}

new Application();
