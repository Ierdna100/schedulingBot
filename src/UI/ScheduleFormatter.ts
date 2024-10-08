import { EmbedBuilder, EmbedField } from "discord.js";
import { ISchedule, Schedule, Weekday, WeekdayEnum, WeekdayToKeys } from "../dto/Schedule.js";
import { TimeFormatter } from "./TimeFormatter.js";
import { Application } from "../Application.js";
import { MongoModels } from "../dto/MongoModels.js";
import { Schools } from "../dto/Schools.js";
import { Dayoff } from "../dto/Dayoff.js";
import { ScheduleFormatData } from "../dto/ScheduleFormatData.js";
import { Weekdays } from "../dto/Weekdays.js";
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

    public static async formatSchedulesAsEmbed(rawSchedules: Schedule[], currentTime = new Date(), currentDate = new Date()): Promise<ScheduleFormatData> {
        currentDate.setHours(0, 0, 0, 0);
        const daysoffModel = (await Application.instance.collections.daysoff.find({ date: currentDate }).toArray()) as MongoModels.Dayoff[];
        const daysoff: Dayoff[] = [];
        const dateString = TimeFormatter.dateToScheduleDatestamp(currentDate);

        // If dates are equal, it means this is the same day as the one we're processing
        const relativeDay = new Date().getDate() == currentDate.getDate() ? "today" : "tomorrow";

        // Construct daysoff
        for (const dayoffModel of daysoffModel) {
            daysoff.push({
                date: new Date(dayoffModel.date),
                reason: dayoffModel.reason,
                affectedSchools: dayoffModel.affectedSchools
            });
        }

        // If Saturday or Sunday
        const currentDay = currentDate.getDay();
        if (currentDay == Weekdays.saturday || currentDay == Weekdays.sunday) {
            return {
                embed: new EmbedBuilder().setTitle(`No school ${relativeDay}`).setDescription(dateString),
                generateNextDay: currentDay == Weekdays.sunday
            };
        }

        // If general day off
        for (const dayoff of daysoff) {
            if (dayoff.affectedSchools == Schools.All) {
                return {
                    embed: new EmbedBuilder().setTitle(`No school ${relativeDay} • ${dateString}`).setDescription(`Reason: ${dayoff.reason}`),
                    generateNextDay: true
                };
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
        if (absoluteEndTime == -1 || absoluteEndTime < currentTimeAsNum) {
            return { embed: new EmbedBuilder().setTitle(`Everyone finished today`).setDescription(dateString), generateNextDay: currentDay != Weekdays.friday };
        }

        const flippedDays = await Application.instance.collections.flippedDays.find<MongoModels.FlippedDay>({ date: currentDate }).toArray();

        // Generates schedules and flip days depending on if their day is a flipped day
        const fields: EmbedField[] = [];
        for (const schedule of rawSchedules) {
            let localDayKey = dayKey;
            const flippedDay = flippedDays.find((e) => e.affectedSchools == schedule.school);
            if (flippedDays.length != 0 && flippedDay != undefined) {
                localDayKey = WeekdayToKeys[flippedDay.replacedDay - 1] as Weekday;
            }
            this.appendStudentToFields(schedule, daysoff, localDayKey, fields, currentTimeAsNum, relativeDay);
        }

        // Wraps everything around an ANSI codeblock
        const finalFields: EmbedField[] = [];
        for (const field of fields) {
            finalFields.push({
                name: field.name,
                value: `\`\`\`ansi\n${field.value}${ANSI.clear}\n\`\`\``,
                inline: field.inline
            });
        }

        return {
            embed: new EmbedBuilder().setTitle(`Schedules for ${relativeDay}`).setDescription(dateString).setFields(finalFields),
            generateNextDay: false
        };
    }

    private static appendStudentToFields(schedule: ISchedule, daysoff: Dayoff[], dayKey: Weekday, fields: EmbedField[], time: number, relativeDay: string) {
        for (const dayoff of daysoff) {
            if (schedule.school == dayoff.affectedSchools) {
                fields.push({ name: schedule.displayName, value: `${ANSI.green}Day off ${relativeDay}`, inline: true });
                return;
            }
        }

        // Student has no classes today or finished
        if (schedule.finishesAt[dayKey] == null || time >= schedule.finishesAt[dayKey]!) {
            fields.push({ name: schedule.displayName, value: `${ANSI.green}Day finished`, inline: true });
            return;
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
            return;
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
                return;
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
            return;
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
        return;
    }

    private static formatRooms(rooms: string[] | undefined) {
        if (rooms == undefined) {
            return "\n";
        } else {
            return `(${rooms[0]})\n`;
        }
    }
}
