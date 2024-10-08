import { DiscordClient } from "./discordServer/DiscordClient.js";
import { EnvFileFields, EnvManager } from "./env/EnvManager.js";
import { Logger } from "./logging/Logger.js";
import * as MongoDB from "mongodb";

export class Application {
    public static instance: Application;
    public static logger: Logger;

    public env: EnvFileFields;
    public discordClient: DiscordClient;

    private mongClient: MongoDB.MongoClient;
    private mongoDb: MongoDB.Db;
    public collections;

    constructor() {
        Application.instance = this;

        this.env = EnvManager.readAndParse();
        Application.logger = new Logger();
        Application.logger.info("Server started!");

        this.discordClient = new DiscordClient();
        this.mongClient = new MongoDB.MongoClient(this.env.dbConnectionString);
        this.mongClient.connect();
        this.mongoDb = this.mongClient.db(this.env.dbName);
        this.collections = {
            auth: this.mongoDb.collection(this.env.coll_auth),
            bannedUsers: this.mongoDb.collection(this.env.coll_bans),
            daysoff: this.mongoDb.collection(this.env.coll_daysoff),
            schedules: this.mongoDb.collection(this.env.coll_schedules),
            periodicMessages: this.mongoDb.collection(this.env.coll_periodicMessages),
            scheduleLogs: this.mongoDb.collection(this.env.coll_scheduleLogs),
            flippedDays: this.mongoDb.collection(this.env.coll_flippedDays)
        };
    }
}

if (!process.argv.includes("--register")) {
    new Application();
}
