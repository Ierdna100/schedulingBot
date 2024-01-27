import { ObjectId } from "mongodb";
import { Authlevel } from "./AuthLevel.js";
import { Schools } from "./Schools.js";
import { PeriodicMessageType } from "./PeriodicMessageType.js";

export namespace MongoModels {
    export interface Base {
        _id?: ObjectId;
    }

    export interface AuthData extends Base {
        userId: string;
        level: Authlevel;
    }

    export interface BannedUser extends Base {
        userId: string;
    }

    export interface Dayoff extends Base {
        date: string;
        reason: string;
        affectedSchools: Schools;
    }

    export interface PeriodicMessageMetadata extends Base {
        type: PeriodicMessageType;
        messageId: string;
    }

    export interface Schedule extends Base {
        userId: string;
        displayName: string;
        school: Schools;
        metaCourses: MetaCourse[];
        finishesAt: {
            monday: number | null;
            tuesday: number | null;
            wednesday: number | null;
            thursday: number | null;
            friday: number | null;
        };
        schedule: {
            monday: Course[];
            tuesday: Course[];
            wednesday: Course[];
            thursday: Course[];
            friday: Course[];
        };
    }

    interface MetaCourse {
        courseId: number;
        group: string;
        courseCode: string;
        title: string;
        teacher: string;
    }

    interface Course {
        courseId: number;
        startTime: number;
        endTime: number;
        rooms?: string[];
        isLab: boolean;
    }
}
