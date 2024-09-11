import { Schools } from "./Schools.js";

export class Schedule implements ISchedule {
    userId: string = "";
    displayName: string = "";
    school: Schools = Schools.Other;
    finishesAt: {
        monday: number | null;
        tuesday: number | null;
        wednesday: number | null;
        thursday: number | null;
        friday: number | null;
    } = { monday: null, tuesday: null, wednesday: null, thursday: null, friday: null };
    schedule: {
        monday: Course[];
        tuesday: Course[];
        wednesday: Course[];
        thursday: Course[];
        friday: Course[];
    } = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] };
    metaCourses: MetaCourse[] = [];
}

export interface ISchedule {
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

export interface MetaCourse {
    courseId: number;
    group: string;
    courseCode: string;
    title: string;
    teacher: string;
}

export interface Course {
    courseId: number;
    startTime: number;
    endTime: number;
    rooms?: string[];
    isLab: boolean;
}

export interface TempCourse {
    courseId: number;
    courseCode: string;
    group: string;
    title: string;
    teacher: string;
    courses: {
        day: Weekday;
        startTime: number;
        endTime: number;
        rooms?: string[] | undefined;
        isLab: boolean;
    }[];
}

export interface ParseError {
    message: string;
    isError: true;
}

export type ParsedScheduleData = { schedule: ISchedule; isError: false } | ParseError;

export type RawCoursesData = { rawSchedule: string[][]; isError: false } | ParseError;

export type TempCourseData = { tempCourses: TempCourse; isError: false } | ParseError;

export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";

export enum WeekdayEnum {
    monday = "monday",
    tuesday = "tuesday",
    wednesday = "wednesday",
    thursday = "thursday",
    friday = "friday"
}

export const WeekdayToKeys = ["monday", "tuesday", "wednesday", "thursday", "friday"];

export enum WeekdayInFrench {
    "lun" = "monday",
    "mar" = "tuesday",
    "mer" = "wednesday",
    "jeu" = "thursday",
    "ven" = "friday"
}

export enum WeekdayInEnglish {
    "mon" = "monday",
    "tue" = "tuesday",
    "wed" = "wednesday",
    "thu" = "thursday",
    "fri" = "friday"
}
