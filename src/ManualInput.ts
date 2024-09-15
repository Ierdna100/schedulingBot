import { ISchedule } from "./dto/Schedule.js";
import { Schools } from "./dto/Schools.js";
import { EnvFileFields, EnvManager } from "./env/EnvManager.js";
import * as MongoDB from "mongodb";
import { ScheduleParser } from "./parsing/ScheduleParser.js";

class ManualInput {
    public env: EnvFileFields;

    private mongClient: MongoDB.MongoClient;
    private mongoDb: MongoDB.Db;
    private collections;

    constructor() {
        this.env = EnvManager.readAndParse();

        this.mongClient = new MongoDB.MongoClient(this.env.dbConnectionString);
        this.mongClient.connect();
        this.mongoDb = this.mongClient.db(this.env.dbName);
        this.collections = {
            schedules: this.mongoDb.collection(this.env.coll_schedules)
        };
    }

    public async input(executorId: string, rawUsername: string, rawSchedule: string, school: Schools) {
        console.log(await this._input(executorId, rawUsername, rawSchedule, school));
    }

    private async _input(executorId: string, rawUsername: string, rawSchedule: string, school: Schools) {
        let userAlreadyExists = false;
        const existingSchedules = (await this.collections.schedules.find({}, { projection: { _id: 0, displayName: 1, userId: 1 } }).toArray()) as unknown as {
            displayName: string;
            userId: string;
        }[];

        for (const schedule of existingSchedules) {
            // Let users replace their own name
            if (executorId == schedule.userId) {
                userAlreadyExists = true;
                continue;
            }

            // If username includes any other person's name without spaces
            if (rawUsername.toLowerCase().includes(schedule.displayName.toLowerCase().replaceAll(" ", ""))) {
                return "Username cannot match already existing name!";
            }
        }

        let parsedSchedule: ISchedule;
        // We do handle errors, but maybe I forgot some of them
        try {
            const parsedScheduleData = ScheduleParser.parseSchedule(rawSchedule, rawUsername, school);

            if (parsedScheduleData.isError) {
                return `Invalid schedule declaration!\n` + `Error: ${parsedScheduleData.message}`;
            }

            parsedSchedule = parsedScheduleData.schedule;
            parsedSchedule.userId = executorId;
        } catch (err) {
            if (err instanceof Error) {
                console.error(err);
            }

            return "500 - Internal Server Error";
        }

        if (userAlreadyExists) {
            await this.collections.schedules.replaceOne({ userId: executorId }, parsedSchedule);
            return "Successfully replaced old schedule!";
        } else {
            await this.collections.schedules.insertOne(parsedSchedule);
            return "Successfully uploaded new schedule!";
        }
    }
}

const rawSchedule = ``;
new ManualInput().input("", "", rawSchedule, Schools.Vanier);
