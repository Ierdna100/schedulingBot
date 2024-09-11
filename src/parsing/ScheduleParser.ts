import { TimeFormatter } from "../UI/TimeFormatter.js";
import {
    ISchedule,
    ParsedScheduleData,
    RawCoursesData,
    Schedule,
    TempCourse,
    TempCourseData,
    Weekday,
    WeekdayInEnglish,
    WeekdayInFrench
} from "../dto/Schedule.js";
import { Schools } from "../dto/Schools.js";

export class ScheduleParser {
    // FIXME : This should be a try-catch, not return this weird object with isError
    public static parseSchedule(rawSchedule: string, username: string, school: Schools): ParsedScheduleData {
        const rawCourses = ScheduleParser.computeRawCourses(rawSchedule);
        // FIXME : This should be a try-catch
        if (rawCourses.isError) {
            return { isError: true, message: rawCourses.message };
        }
        console.log(rawCourses);

        let tempCourses: TempCourse[] = [];
        for (const course of rawCourses.rawSchedule) {
            const tempCourseData = ScheduleParser.computeCourse(course);
            // FIXME : This should be a try-catch
            if (tempCourseData.isError) {
                return { isError: true, message: tempCourseData.message };
            }

            tempCourses.push(tempCourseData.tempCourses);
        }

        let schedule = ScheduleParser.compileDataIntoSchedule(tempCourses);
        schedule.displayName = username;
        schedule.school = school;

        for (const daykey in schedule.schedule) {
            schedule.schedule[daykey as Weekday].sort((a, b) => a.startTime - b.startTime);
        }

        return { isError: false, schedule: schedule };
    }

    private static computeRawCourses(rawSchedule: string): RawCoursesData {
        const scheduleAsLines = rawSchedule.split("\n");
        const courses: string[][] = [];

        let courseIndex = -1;
        // Turns the big string into string array arrays as [i][j] where
        // i is the course by course data to parse and j is a line by line breakdown
        for (let line of scheduleAsLines) {
            line = line.trim();
            if (line == "") {
                continue;
            }

            // If the line is a new course declaration
            const splitLine = line.split(" ");
            // True for `1    Course Title Or Whatever` (first ever line in a new course)
            if (!splitLine[0].includes("-") && !Number.isNaN(parseInt(splitLine[0]))) {
                // Go to next course
                courses.push([]);
            }

            // This if only returns if the first line is not a valid course declaration?
            if (courses.length == 0) {
                return {
                    isError: true,
                    // message: "The course declaration looks wrong, unable to parse (courseIndex was -1)"
                    message: "The course declaration looks wrong, the first line is not a valid course title and identifier."
                };
            }

            // By default we add every line to parse
            courses[courses.length - 1].push(line);
        }

        // Filters any classes that don't have any actual useful information (such as universal breaks and other weird classes)
        const finalCourses: string[][] = [];
        for (const course of courses) {
            // FIXME : Add if this should return an error or not!
            if (course.length == 0) {
                // return {
                //     isError: true,
                //     message: `Found course with a length of 0 declaration lines!`
                // };
                continue;
            }

            // FIXME : Add if this should return an error or not!
            if (course.length == 1) {
                // return {
                //     isError: true,
                //     message: `Course with declaration "${course[0]}" is missing any other data!`
                // };
                continue;
            }

            // No useful data
            if (course.length == 2) {
                continue;
            }

            // Doesn't include metadata
            // FIXME : Add this as a setting down the line of what is valid and what isnt
            if (!(course[1].includes("gr.") || course[1].includes("sec."))) {
                continue;
            }

            if (course.length >= 3) {
                // Remove lines with starting and ending dates, possibly add these in the future
                // Only applicable to BdeB schedules, no english support yet
                if (course[2].split(" ")[0].includes("du")) {
                    course.splice(2, 1);
                }

                // If no other useful data existed
                // FIXME : Add if this should return an error or not!
                if (course.length == 2) {
                    continue;
                }
            }

            finalCourses.push(course);
        }

        if (finalCourses.length == 0) {
            return { isError: true, message: "Final courses detected was 0! Upload a schedule with a valid amount of valid courses!" };
        }

        return { isError: false, rawSchedule: finalCourses };
    }

    private static computeCourse(rawCourses: string[]): TempCourseData {
        // "6  \tData Structures and Object oriented Programming" -> ["6  ", "Data Structures and Object oriented Programming"]
        let firstLineSplit: string[] = [];
        if (rawCourses[0].includes("\t")) {
            // FIXME: This should just remove tabulations and replace them with spaces, then the following code should execute anyway
            firstLineSplit = rawCourses[0].split("\t");
        } else {
            rawCourses[0] = rawCourses[0].trim();
            const splitIndex = rawCourses[0].indexOf(" ");

            if (splitIndex == -1) {
                return { isError: true, message: `Split index for course with header \`${rawCourses[0]}\` was invalid!` };
            }

            // prettier-ignore
            firstLineSplit = [
                rawCourses[0].substring(0, splitIndex),
                rawCourses[0].substring(splitIndex + 1)
            ]
        }

        const courseId = parseInt(firstLineSplit[0].trim());
        if (Number.isNaN(courseId)) {
            return { isError: true, message: `Course ID for course with header "${rawCourses[0]}" was NaN!` };
        }

        const title = firstLineSplit[1];

        // "000-000-RE gr.00000, prof.: Name Name" -> ["000-000-RE gr.00000, prof.", "Name Name"]
        // "000-000-RE sec.00000, teacher: Name Name" -> ["000-000-RE sec.00000, teacher", "Name Name"]
        let secondLineSplit1 = rawCourses[1].split(": ");

        if (secondLineSplit1.length != 2) {
            return { isError: true, message: `Teacher declaration was invalid for class "${title}"` };
        }

        const teacher = secondLineSplit1[1];

        // "000-000-RE gr.00000, prof." -> ["000-000-RE", "gr.00000,", "prof."]
        let secondLineSplit2 = secondLineSplit1[0].split(" ");
        if (secondLineSplit2.length != 3) {
            return { isError: true, message: `Course code and group were invalid for course "${title}"!` };
        }

        // ["000-000-RE", "gr.00000,", "prof."] -> "000-000-RE"
        const courseCode = secondLineSplit2[0];
        // ["000-000-RE", "gr.00000,", "prof."] -> "00000"
        const group = secondLineSplit2[1].split(".")[1].replaceAll(",", "");

        let coursesToAdd: TempCourse["courses"] = [];
        for (let i = 2; i < rawCourses.length; i++) {
            const rawCourse = rawCourses[i];

            const isLab = rawCourse.includes("Lab");

            // "Mer 10:00 - 12:00, local D-210;VL-210" -> ["Mer 10:00 - 12:00", "local D-210;VL-210"]
            let nLineSplit1 = rawCourse.split(",");
            let rooms = undefined;

            if (nLineSplit1.length == 2) {
                // FIXME : This should very likely be a more static parser that indexes the string and doesnt remove things one by one
                // FIXME : These should probably be a JSON file somewhere
                const removers = ["local", "classroom", "(Lab)", "(Theory)", "(Théorie)", "(Laboratoire)"];

                let replacedLine = nLineSplit1[1];
                for (const remover of removers) {
                    replacedLine = replacedLine.replaceAll(remover, "");
                }
                rooms = replacedLine.trim().split(";");
            } else {
                return {
                    isError: true,
                    message: `Specific class declaration \`${rawCourse}\` is an invalid form!`
                };
            }

            // "Mer 10:00 - 12:00" -> ["Mer", "10:00", "-", "12:00"]
            let nLineSplit2 = nLineSplit1[0].split(" ");
            if (nLineSplit2.length != 4) {
                return { isError: true, message: `Time declaration "${nLineSplit1[0]}" for course "${title}" was not valid!` };
            }

            const dayAsString = nLineSplit2[0].toLowerCase();
            let day: Weekday;
            if (Object.keys(WeekdayInFrench).includes(dayAsString)) {
                day = WeekdayInFrench[nLineSplit2[0].toLowerCase() as keyof typeof WeekdayInFrench];
            } else if (Object.keys(WeekdayInEnglish).includes(dayAsString)) {
                day = WeekdayInEnglish[nLineSplit2[0].toLowerCase() as keyof typeof WeekdayInEnglish];
            } else {
                return {
                    isError: true,
                    message: `Day key \`${nLineSplit2[0]}\` is not valid in french or english!`
                };
            }

            const startTime = TimeFormatter.humanReadableToDecimalHours(nLineSplit2[1]);
            const endTime = TimeFormatter.humanReadableToDecimalHours(nLineSplit2[3]);

            // Null validation because this has been bypassed before
            if (Number.isNaN(startTime)) {
                return {
                    isError: true,
                    message: `Start time in course with title \`${title}\` has a NaN start time!`
                };
            }
            if (Number.isNaN(endTime)) {
                return {
                    isError: true,
                    message: `Start time in course with title \`${title}\` has a NaN end time!`
                };
            }
            if (rooms == undefined) {
                return {
                    isError: true,
                    message: `Start time in course with title \`${title}\` has invalid rooms!`
                };
            }

            coursesToAdd.push({
                day: day,
                startTime: startTime,
                endTime: endTime,
                isLab: isLab,
                rooms: rooms
            });
        }

        return {
            isError: false,
            tempCourses: {
                courseId: courseId,
                courseCode: courseCode.trim(),
                group: group.trim(),
                title: title.trim(),
                teacher: teacher.trim(),
                courses: coursesToAdd
            }
        };
    }

    private static compileDataIntoSchedule(tempCourses: TempCourse[]): ISchedule {
        let schedule = new Schedule();

        for (const tempCourse of tempCourses) {
            schedule.metaCourses.push({
                courseId: tempCourse.courseId,
                group: tempCourse.group,
                courseCode: tempCourse.courseCode,
                title: tempCourse.title.trim(),
                teacher: tempCourse.teacher
            });

            for (const individualCourse of tempCourse.courses) {
                if (individualCourse.day == undefined) {
                    // Do something here?
                    continue;
                }

                schedule.schedule[individualCourse.day].push({
                    courseId: tempCourse.courseId,
                    startTime: individualCourse.startTime,
                    endTime: individualCourse.endTime,
                    rooms: individualCourse.rooms,
                    isLab: individualCourse.isLab
                });

                if (schedule.finishesAt[individualCourse.day] == null || schedule.finishesAt[individualCourse.day]! < individualCourse.endTime) {
                    schedule.finishesAt[individualCourse.day] = individualCourse.endTime;
                }
            }
        }

        return schedule;
    }
}
