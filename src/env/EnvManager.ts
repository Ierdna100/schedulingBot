import fs from "fs";
import { Logger } from "../logging/Logger.js";

const envFilepath = "./env.json";

export class EnvManager {
    public static readAndParse(): EnvFileFields {
        const logger = new Logger("ENV MANAGER");

        if (!fs.existsSync(envFilepath)) {
            throw new Error("Environnement file does not exist! Please create an env.json file for this project!");
        }

        const envFileJSON = JSON.parse(fs.readFileSync(envFilepath).toString());

        let envFileFields = new EnvFileFields();

        const remainingFieldKeys: string[] = [];
        for (const key in envFileFields) {
            remainingFieldKeys.push(key);
        }

        for (const key in envFileJSON) {
            if (!remainingFieldKeys.includes(key)) {
                logger.warn(
                    `Environnement variable with key ${key} is not required by this software, it may be leftover from a previous version. You can safely remove it.`
                );
                continue;
            }

            if (typeof envFileFields[key as keyof EnvFileFields] == "number") {
                const value = parseFloat(envFileJSON[key]);
                if (Number.isNaN(value)) {
                    throw new Error(`Environnement variable with key '${key}' was expected to be a number, but parsing it returned NaN!`);
                }
                (envFileFields[key as keyof EnvFileFields] as number) = value;
            } else {
                (envFileFields[key as keyof EnvFileFields] as any) = envFileJSON[key];
            }

            remainingFieldKeys.splice(remainingFieldKeys.indexOf(key), 1);
        }

        if (remainingFieldKeys.length != 0) {
            throw new Error(`Environnement field '${remainingFieldKeys[0]}' not set to a value! Please fill out the .env file!`);
        }

        return envFileFields;
    }
}

export class EnvFileFields {
    public firstWeek = 0;
    public token = "";
    public clientId = "";
    public dbConnectionString = "";
    public dbName = "";
    public updateChannelId = "";
    public updateFreqSec = 0;

    public coll_auth = "";
    public coll_bans = "";
    public coll_daysoff = "";
    public coll_schedules = "";
    public coll_periodicMessages = "";
    public coll_scheduleLogs = "";
    public coll_flippedDays = "";

    constructor() {}
}
