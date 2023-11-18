import * as configDotenv from "dotenv";
import { createClient } from "./client/client";

// Dotenv
configDotenv.config()

// Discord client
createClient()

// HTTP server control
