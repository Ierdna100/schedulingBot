import { EmbedBuilder, EmbedField } from "discord.js";
import { ISchedule, Schedule, Weekday, WeekdayEnum, WeekdayToKeys } from "../dto/Schedule.js";
import { TimeFormatter } from "./TimeFormatter.js";
import { Application } from "../Application.js";
import { MongoModels } from "../dto/MongoModels.js";
import { Schools } from "../dto/Schools.js";
import { Dayoff } from "../dto/Dayoff.js";
import { ANSI } from "../dto/ANSIColors.js";

export class ScheduleFormatter {
    public static formatFullSchedule(schedule: ISchedule): string {
        let stringOutput = "";

        for (const day of Object.values(WeekdayEnum)) {
            if (schedule.finishesAt[day] == null) {
                continue;
            }

            // Title of day
            stringOutput += `**${day[0].toUpperCase() + day.substring(1)}:**\n`;

            for (const course of schedule.schedule[day]) {
                stringOutput += "\t\t";
                stringOutput += `\`[${TimeFormatter.decimalHoursToHumanReadable(course.startTime)}] - [${TimeFormatter.decimalHoursToHumanReadable(
                    course.endTime
                )}]\` `;

                if (course.rooms != undefined) {
                    for (const room of course.rooms) {
                        stringOutput += `(${room}), `;
                    }

                    // Removes last space and comma
                    stringOutput = stringOutput.substring(0, stringOutput.length - 2);
                }

                stringOutput += `\t__${schedule.metaCourses.find((e) => e.courseId == course.courseId)?.title}__\n`;
            }
        }

        return stringOutput;
    }

    public static async FormatSchedulesAsEmbed(rawSchedules: Schedule[]): Promise<EmbedBuilder> {
        const currentDate = new Date();
        const currentTime = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const daysoffModel = (await Application.instance.collections.daysoff.find({ date: currentDate }).toArray()) as MongoModels.Dayoff[];
        const daysoff: Dayoff[] = [];

        // Construct daysoff
        for (const dayoffModel of daysoffModel) {
            daysoff.push({
                date: new Date(dayoffModel.date),
                reason: dayoffModel.reason,
                affectedSchools: dayoffModel.affectedSchools
            });
        }

        // If sunday/saturday
        if (currentDate.getDay() == 0 || currentDate.getDay() == 6) {
            return new EmbedBuilder().setTitle(`No school today`);
        }

        // If general day off
        for (const dayoff of daysoff) {
            if (dayoff.affectedSchools == Schools.All) {
                return new EmbedBuilder().setTitle(`No school today`).setDescription(`Reason: ${dayoff.reason}`);
            }
        }

        // "- 1" because 0 is sunday
        const dayKey = WeekdayToKeys[currentDate.getDay() - 1] as Weekday;
        const currentTimeAsNum = currentTime.getHours() + currentTime.getMinutes() / 60;

        // Find last ending time
        let absoluteEndTime = -1;
        for (const schedule of rawSchedules) {
            if (schedule.finishesAt[dayKey] == null) {
                continue;
            }

            if (absoluteEndTime < schedule.finishesAt[dayKey]!) {
                absoluteEndTime = schedule.finishesAt[dayKey]!;
            }
        }

        // Everyone finished
        if (absoluteEndTime == -1 || currentTimeAsNum >= absoluteEndTime) {
            return new EmbedBuilder().setTitle(`Everyone finished today`);
        }

        const fields: EmbedField[] = [];
        for (const schedule of rawSchedules) {
            this.appendStudentToFields(schedule, daysoff, dayKey, fields, currentTimeAsNum);
        }

        const finalFields: EmbedField[] = [];
        for (const field of fields) {
            finalFields.push({
                name: field.name,
                value: `\`\`\`ansi\n${field.value}${ANSI.clear}\n\`\`\``,
                inline: field.inline
            });
        }

        return new EmbedBuilder().setTitle(`Schedules for today`).setDescription(TimeFormatter.dateToScheduleDatestamp(currentDate)).setFields(finalFields);
    }

    private static appendStudentToFields(schedule: ISchedule, daysoff: Dayoff[], dayKey: Weekday, fields: EmbedField[], time: number): true {
        for (const dayoff of daysoff) {
            if (schedule.school == dayoff.affectedSchools) {
                fields.push({ name: schedule.displayName, value: `${ANSI.green}Day off today`, inline: true });
                return true;
            }
        }

        // Student has no classes today or finished
        if (schedule.finishesAt[dayKey] == null || time >= schedule.finishesAt[dayKey]!) {
            fields.push({ name: schedule.displayName, value: `${ANSI.green}Day finished`, inline: true });
            return true;
        }

        // Student has not begun today
        if (time < schedule.schedule[dayKey][0].startTime) {
            const nextCourse = schedule.schedule[dayKey][0];
            const nextCourseMeta = schedule.metaCourses.find((e) => e.courseId == nextCourse.courseId)!;

            fields.push({
                name: schedule.displayName,
                value:
                    (time < nextCourse.startTime - 0.25 ? `${ANSI.green}` : `${ANSI.yellow}Starting soon\n`) +
                    `Has not begun yet${ANSI.clear}\n` +
                    `Starts at: [${TimeFormatter.decimalHoursToHumanReadable(nextCourse.startTime)}]\n` +
                    `Starts with: \n${ANSI.under}${nextCourseMeta.title}${ANSI.clear}\n` +
                    ScheduleFormatter.formatRooms(nextCourse.rooms) +
                    `Class end: [${TimeFormatter.decimalHoursToHumanReadable(nextCourse.endTime)}]\n` +
                    `Day end:   [${TimeFormatter.decimalHoursToHumanReadable(schedule.finishesAt[dayKey]!)}]`,
                inline: true
            });
            return true;
        }

        // Finding out current status
        let courseIdx;
        for (courseIdx = 0; courseIdx < schedule.schedule[dayKey].length; courseIdx++) {
            const course = schedule.schedule[dayKey][courseIdx];

            // Student is in this course
            if (time >= course.startTime && time < course.endTime) {
                break;
            }

            // Student is in break is going to enter current course
            if (time < course.startTime) {
                const courseMeta = schedule.metaCourses.find((e) => e.courseId == course.courseId)!;

                fields.push({
                    name: schedule.displayName,
                    value:
                        (time < course.startTime - 0.25 ? `${ANSI.green}` : `${ANSI.yellow}Starting soon\n`) +
                        `Currently in break${ANSI.clear}\n` +
                        `Until:     [${TimeFormatter.decimalHoursToHumanReadable(course.startTime)}]\n` +
                        `Next class: \n` +
                        `${ANSI.under}${courseMeta.title}${ANSI.clear}\n` +
                        ScheduleFormatter.formatRooms(course.rooms) +
                        `Class end: [${TimeFormatter.decimalHoursToHumanReadable(course.endTime)}]\n` +
                        `Day end:   [${TimeFormatter.decimalHoursToHumanReadable(schedule.finishesAt[dayKey]!)}]\n`,
                    inline: true
                });
                return true;
            }
        }

        // If is in last class
        if (courseIdx == schedule.schedule[dayKey].length - 1) {
            const course = schedule.schedule[dayKey][courseIdx];
            const courseMeta = schedule.metaCourses.find((e) => e.courseId == course.courseId)!;

            fields.push({
                name: schedule.displayName,
                value:
                    `${ANSI.red}Currently in:${ANSI.clear}\n` +
                    `${ANSI.under}${courseMeta.title}${ANSI.clear}\n` +
                    ScheduleFormatter.formatRooms(course.rooms) +
                    `Day end:   [${TimeFormatter.decimalHoursToHumanReadable(course.endTime)}]\n`,
                inline: true
            });
            return true;
        }

        // Is in class
        // Finding out next break, breakAt will be null if no breaks exist between now and end of day
        let breakAt: number | undefined;
        let prevCourse = schedule.schedule[dayKey][courseIdx];
        for (let i = courseIdx + 1; i < schedule.schedule[dayKey].length; i++) {
            const nextCourse = schedule.schedule[dayKey][i];

            if (nextCourse.startTime == prevCourse.endTime) {
                prevCourse = nextCourse;
                continue;
            }

            if (prevCourse != undefined) {
                breakAt = prevCourse.endTime;
            }

            break;
        }

        const course = schedule.schedule[dayKey][courseIdx];
        const nextCourse = schedule.schedule[dayKey][courseIdx + 1];
        const courseMeta = schedule.metaCourses.find((e) => e.courseId == course.courseId)!;
        const nextCourseMeta = schedule.metaCourses.find((e) => e.courseId == nextCourse.courseId)!;

        fields.push({
            name: schedule.displayName,
            value:
                `${ANSI.red}Currently in:${ANSI.clear}\n` +
                `${ANSI.under}${courseMeta.title}${ANSI.clear}\n` +
                ScheduleFormatter.formatRooms(course.rooms) +
                `Class end: [${TimeFormatter.decimalHoursToHumanReadable(course.endTime)}]\n` +
                (breakAt == undefined ? "" : `Next break:[${TimeFormatter.decimalHoursToHumanReadable(breakAt!)}]\n`) +
                `Next class:\n` +
                `${ANSI.under}${nextCourseMeta.title}${ANSI.clear}\n` +
                `Class end: [${TimeFormatter.decimalHoursToHumanReadable(nextCourse.endTime)}]\n` +
                `Day end:   [${TimeFormatter.decimalHoursToHumanReadable(schedule.finishesAt[dayKey]!)}]`,
            inline: true
        });
        return true;
    }

    private static formatRooms(rooms: string[] | undefined) {
        if (rooms == undefined) {
            return "\n";
        } else {
            return `(${rooms[0]})\n`;
        }
    }
}
