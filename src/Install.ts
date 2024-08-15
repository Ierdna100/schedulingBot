import fs from "fs";
import { EnvManager } from "./env/EnvManager.js";

async function install() {
    fs.writeFileSync("./.env", EnvManager.generateTemplate());
    fs.mkdirSync("./logs/");
    fs.mkdirSync("./static/");
    fs.mkdirSync("./static/instructionsImages");
}

install();
