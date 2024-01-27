import { Schools } from "./Schools.js";

export interface Dayoff {
    date: Date;
    reason: string;
    affectedSchools: Schools;
}
