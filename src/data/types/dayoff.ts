import { School } from "./schedule.js";

export interface Dayoff {
    day: number;
    month: number;
    year: number;
    reason: string;
    affectedSchool: School
}
