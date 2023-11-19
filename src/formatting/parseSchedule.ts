import { Course, Schedule, School } from "../data/types/schedule.js";

export function parseSchedule(rawSchedule: string, username: string, school: School): Schedule | null {
    const scheduleLines = school.split("\n");

    let isNewCourse = true;
    let courseTitle = "";

    let courses: Schedule["schedule"] = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
    };

    let finishesAt: Schedule["finishesAt"] = {
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null
    }

    // Parse raw schedule string
    for (const line in scheduleLines) {
        if (line == undefined || line == " ") {
            continue;
        }

        // Get title of new course
        if (isNewCourse) {
            // If doesnt have a tab, then we start on third character of line
            if (line.indexOf("\t") == -1) {
                courseTitle = line.substring(line.indexOf(" " + 2)).trim();
            }
            else {
                courseTitle = line.split("\t")[1];
            }

            isNewCourse = false;
            continue;
        }

        // Parse rest of course info, e.g.:
        // Mer 11:00 - 12:30, local B-503;B-502

        // "Lun" -> "monday"
        const dayOfCourse = line.replaceAll("\t", "").replaceAll(" ", "").substring(0, 3) as keyof typeof DaysFrench;

        courses[dayOfCourse].push(parseRawScheduleLine(courseTitle, line));
    }

    let hasAtLeastOneValidClass = false;

    // Figure out what end times are for each day
    for (const day of Object.keys(courses) as Array<keyof typeof courses>) {
        if (courses[day].length == 0) {
            finishesAt[day] = null;
        }

        let highestCourseEndTime = 0;

        for (const course of courses[day]) {
            if (course.endTime > highestCourseEndTime) {
                highestCourseEndTime = course.endTime;
            }
        }

        finishesAt[day] = highestCourseEndTime;

        // Figure out if schedule is just empty
        hasAtLeastOneValidClass = true;
    }

    if (!hasAtLeastOneValidClass) {
        return null;
    }

    return {
        displayName: username,
        school: school,
        finishesAt: finishesAt,
        schedule: courses
    }
}

function parseRawScheduleLine(courseTitle: string, line: string): Course {
    //[ 'Mer', '11:00', '-', '12:30,', 'local', 'B-503;B-502' ]
    const formattedLine = line.trim().split(" ");

    // 11:30 -> 11.5
    const startTimeRaw = line[1].split(":");
    const startTime = parseInt(startTimeRaw[0]) + parseFloat(startTimeRaw[1]) / 60;

    const endTimeRaw = line[3].split(":");
    const endTime = parseInt(endTimeRaw[0]) + parseFloat(endTimeRaw[1]) / 60;

    // edge case where there are no rooms but text after anyway
    if (line[4] == "local")
    {
        return {
            className: courseTitle,
            startTime: startTime,
            endTime: endTime,
            rooms: line[5]?.split(";")
        }
    }
    else
    {
        return {
            className: courseTitle,
            startTime: startTime,
            endTime: endTime
        }
    }
}

enum DaysFrench {
    monday = "lun",
    tuesday = "mar",
    wednesday = "mer",
    thursday = "jeu",
    friday = "ven"
}
