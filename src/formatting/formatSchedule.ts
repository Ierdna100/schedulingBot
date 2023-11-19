import { Schedule } from "../data/types/schedule.js";
import { toPascalCase } from "./pascalCase.js";
import { decimalHoursToHumanReadable } from "./time.js";

export function formatFullSchedule(schedule: Schedule): string {
    let stringOutput = "";

    for (const day of Object.keys(schedule.finishesAt) as Array<keyof typeof schedule.finishesAt>) {
        if (schedule.finishesAt[day] == null) {
            continue;
        }

        // Title of day
        stringOutput += `**${toPascalCase(day)}:**\n`

        // Sort schedule now that it is no longer in order
        schedule.schedule[day] = schedule.schedule[day].sort((a, b) => a.startTime - b.startTime);

        for (const course of schedule.schedule[day]) {
            stringOutput += "\t\t";
            stringOutput += `[${decimalHoursToHumanReadable(course.startTime)}] - [${decimalHoursToHumanReadable(course.endTime)}] `;
            
            if (course.rooms != undefined) {
                for (const room of course.rooms) {
                    stringOutput += `(${room}), `
                }

                // Removes last space and comma
                stringOutput = stringOutput.substring(0, stringOutput.length - 2)
            }

            stringOutput += `\t__${course.className}__\n`;
        }
    }

    return stringOutput;
}   
