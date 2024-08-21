import { Schools } from "./Schools.js";

export interface FlippedDay {
    date: Date;
    affectedSchools: Schools;
    replacedDay: number;
}
