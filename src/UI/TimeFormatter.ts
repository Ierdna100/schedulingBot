import { Application } from "../Application.js";
import { DaysOfTheWeek, MonthsOfTheYear, Ordinals } from "../dto/Days.js";
import { DaysInMonth } from "../dto/DaysInMonth.js";
import { TimeFormattingError } from "../dto/TimeFormatterErrors.js";

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
        return `${DaysOfTheWeek[date.getDay()]} ${TimeFormatter.formatOrdinal(date.getDate())} of ${MonthsOfTheYear[date.getMonth()]} - Week ${schoolWeek}`;
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

    public static stringToDate(date: string, identifier = ""): TimeFormattingError {
        // String: 0000/00/00
        // CharAt: 0123456789
        if (!(date.charAt(4) == "/" && date.charAt(7) == "/")) {
            return { isError: true, message: `**Day ${identifier} declaration was invalid! Please use the \`YYYY/MM/DD\` format!` };
        }

        const year = parseInt(date.substring(0, 4));
        const month = parseInt(date.substring(5, 7)) - 1;
        const day = parseInt(date.substring(8));

        if (Number.isNaN(year)) return { isError: true, message: `**Year ${identifier} was NaN!**` };
        if (Number.isNaN(month)) return { isError: true, message: `**Month ${identifier} was NaN!**` };
        if (Number.isNaN(day)) return { isError: true, message: `**Day ${identifier} was NaN!**` };

        if (month < 0 || month > 11) return { isError: true, message: `**Month ${identifier} was out of bounds!**` };
        if (day < 1 || day > DaysInMonth[month]) return { isError: true, message: `**Day ${identifier} was out of bounds!**` };

        return { isError: false, date: new Date(year, month, day, 0, 0, 0, 0) };
    }
}
