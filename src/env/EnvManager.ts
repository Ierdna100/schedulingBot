import { configDotenv } from "dotenv";

export class EnvManager {
    public static assertDefined(fieldName: string): string {
        const fieldValue = process.env[fieldName];

        if (fieldValue == "" || fieldValue == undefined) {
            throw new Error(`Environnement field <${fieldName}> not set to a value! Please fill out the .env file!`);
        }

        return fieldValue;
    }

    public static config(): EnvFileFields {
        configDotenv();
        let envFileFields = new EnvFileFields();

        envFileFields.firstWeek = parseInt(EnvManager.assertDefined("FIRST_WEEK"));
        envFileFields.token = EnvManager.assertDefined("TOKEN");
        envFileFields.clientId = EnvManager.assertDefined("CLIENT_ID");
        envFileFields.dbConnectionString = EnvManager.assertDefined("DB_CONNECTION_STRING");
        envFileFields.dbName = EnvManager.assertDefined("DB_NAME");
        envFileFields.updateChannelId = EnvManager.assertDefined("UPDATE_CHANNEL_ID");
        envFileFields.updateFreqSec = parseInt(EnvManager.assertDefined("UPDATE_FREQ_SEC"));

        envFileFields.coll_auth = EnvManager.assertDefined("COLL_AUTH");
        envFileFields.coll_bans = EnvManager.assertDefined("COLL_BANS");
        envFileFields.coll_daysoff = EnvManager.assertDefined("COLL_DAYSOFF");
        envFileFields.coll_schedules = EnvManager.assertDefined("COLL_SCHEDULES");
        envFileFields.coll_periodicMessages = EnvManager.assertDefined("COLL_PERIODIC_MESSAGES");
        envFileFields.coll_scheduleLogs = EnvManager.assertDefined("COLL_SCHEDULE_LOGS");

        return envFileFields;
    }

    public static generateTemplate(): string {
        const fields = new EnvFileFields();

        let output = "";
        for (const key in fields) {
            output += `${EnvManager.keyAsPascalCase(key)}=\n`;
        }

        return output;
    }

    private static keyAsPascalCase(key: string): string {
        let keyOut = "";
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);

            if (char >= "A".charCodeAt(0) && char <= "Z".charCodeAt(0)) {
                keyOut += `_${key.charAt(i)}`;
                continue;
            }

            keyOut += key.charAt(i);
        }

        return keyOut.toUpperCase();
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

    constructor() {}
}
