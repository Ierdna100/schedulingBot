import fs from "fs";
import { EnvManager } from "./env/EnvManager.js";

async function install() {
    fs.writeFileSync("./.env", EnvManager.generateTemplate());
}

install();
