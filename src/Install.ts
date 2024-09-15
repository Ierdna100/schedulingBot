import fs from "fs";
import { EnvFileFields } from "./env/EnvManager.js";
import { ANSI } from "./dto/ANSIColors.js";

async function install() {
    console.log(ANSI.blue + "Setting up project...");
    onlyAddNewFieldsOrCreate("./env.json", new EnvFileFields());
    checkExistsAndMkdir("./logs/");
    checkExistsAndMkdir("./static/");
    checkExistsAndMkdir("./static/instructionsImages");
    console.log(ANSI.green);
    console.log("Successfully setup project!" + ANSI.clear);
}

function onlyAddNewFieldsOrCreate(filepath: string, data: any, prettyJson = true) {
    let writeData = data;

    if (fs.existsSync(filepath)) {
        console.log("Appending fields to env.json, as it alread exists...");
        const existingData = JSON.parse(fs.readFileSync(filepath).toString());
        writeData = { ...data, ...existingData };
    }

    console.log("Writing to environnement file...");
    if (prettyJson) {
        fs.writeFileSync(filepath, JSON.stringify(writeData, null, "\t"));
    } else {
        fs.writeFileSync(filepath, JSON.stringify(writeData));
    }
    console.log("Successfully written to environnement file!");
}

function checkExistsAndMkdir(filepath: string) {
    if (fs.existsSync(filepath)) {
        console.log(`Directory to initialize '${filepath}' already exists, skipping...`);
        return;
    }

    console.log(`Creating directory '${filepath}'...`);
    fs.mkdirSync(filepath);
    console.log("Successfully created directory!");
}

install();
