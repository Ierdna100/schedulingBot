import { Application } from "../Application.js";
import { DaysOfTheWeek, MonthsOfTheYear, Ordinals } from "../dto/Days.js";

export class TimeFormatter {
    public static decimalHoursToHumanReadable(time: number): string {
        // 11.5 -> 11:30
        return `${Math.floor(time)}`.padStart(2, "0") + ":" + `${Math.floor((time % 1) * 60)}`.padStart(2, "0");
    }

    public static humanReadableToDecimalHours(time: string): number {
        // 11:30 -> 11.5
        const split = time.split(":");
        return parseInt(split[0]) + parseInt(split[1]) / 60;
    }

    public static getWeekOfYear(date: Date): number {
        const millisecToHours = 1000 * 60 * 60 * 24;
        let startDate = new Date(date.getFullYear(), 0, 1);
        // Adjust the "- 1" to set start of week. -1: Monday, 0: Sunday
        startDate.setTime(startDate.getTime() - (startDate.getDay() - 1) * millisecToHours);

        const days = Math.floor((date.getTime() - startDate.getTime()) / millisecToHours);

        // Adjust the "+ 1" to set indexing. +1: 1-indexed, 0: 0-indexed
        return Math.floor(days / 7) + 1;
    }

    public static dateToScheduleDatestamp(date: Date): string {
        const schoolWeek = TimeFormatter.getWeekOfYear(date) - Application.instance.env.firstWeek;
        return `${DaysOfTheWeek[date.getDay()]} ${TimeFormatter.formatOrdinal(date.getDay())} of ${MonthsOfTheYear[date.getMonth()]} - Week ${schoolWeek}`;
    }

    private static formatOrdinal(day: number) {
        let ordinalIndex;

        if (day < 20) {
            ordinalIndex = Math.min(Math.floor(day - 1), 3);
        } else {
            ordinalIndex = Math.min(Math.floor(day - 1) % 10, 3);
        }

        return `${day}${Ordinals[ordinalIndex]}`;
    }
}
