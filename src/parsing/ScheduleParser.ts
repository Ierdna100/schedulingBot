import { TimeFormatter } from "../UI/TimeFormatter.js";
import { ISchedule, ParsedScheduleData, RawCoursesData, Schedule, TempCourse, TempCourseData, Weekday, WeekdayInFrench } from "../dto/Schedule.js";
import { Schools } from "../dto/Schools.js";

export class ScheduleParser {
    public static parseSchedule(rawSchedule: string, username: string, school: Schools): ParsedScheduleData {
        const rawCourses = ScheduleParser.computeRawCourses(rawSchedule);
        if (rawCourses.isError) {
            return { isError: true, message: rawCourses.message };
        }
        console.log(rawCourses);

        let tempCourses: TempCourse[] = [];
        for (const course of rawCourses.rawSchedule) {
            const tempCourseData = ScheduleParser.computeCourse(course);
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
        let courseDataLength = 0;
        for (let line of scheduleAsLines) {
            line = line.trim();
            if (line == "") {
                continue;
            }

            // If the line is a new course declaration
            const splitLine = line.split(" ");
            if (!splitLine[0].includes("-") && !Number.isNaN(parseInt(splitLine[0]))) {
                // Go to next course
                courseDataLength = 0;
                courseIndex++;
            }

            // Add new course to array if not already done
            if (courseDataLength == 0) {
                courses.push([]);
            }

            // Push new data to course
            if (courseIndex == -1) {
                return {
                    isError: true,
                    message: "The course declaration looks wrong, unable to parse (courseIndex was -1)"
                };
            }

            courses[courseIndex].push(line);
            courseDataLength++;
        }

        // Remove any classes with no group definitions and else
        const finalCourses: string[][] = [];
        for (const course of courses) {
            if (course.length == 0) {
                return {
                    isError: true,
                    message: `Found course with a length of 0 delcaration lines!`
                };
            }

            if (course.length == 1) {
                return {
                    isError: true,
                    message: `Course with declaration "${course[0]}" is missing any other data!`
                };
            }

            // No useful data
            if (course.length == 2) {
                continue;
            }

            // Doesn't include metadata
            if (!(course[1].includes("gr.") || course[1].includes("sec."))) {
                continue;
            }

            if (course.length >= 3) {
                // Remove lines with starting and ending dates, possibly add these in the future
                if (course[2].split(" ")[0].includes("du")) {
                    course.splice(2, 1);
                }

                // If no other useful data existed
                if (course.length == 2) {
                    continue;
                }
            }

            finalCourses.push(course);
        }

        if (finalCourses.length == 0) {
            return { isError: true, message: "Final courses detected was 0!" };
        }

        return { isError: false, rawSchedule: finalCourses };
    }

    private static computeCourse(rawCourses: string[]): TempCourseData {
        // "6  \tData Structures and Object oriented Programming" -> ["6  ", "Data Structures and Object oriented Programming"]
        let firstLineSplit: string[] = [];
        if (rawCourses[0].includes("\t")) {
            firstLineSplit = rawCourses[0].split("\t");
        } else {
            rawCourses[0] = rawCourses[0].trim();
            const splitIndex = rawCourses[0].indexOf(" ");

            if (splitIndex == -1) {
                return { isError: true, message: `Split index for course with header "${rawCourses[0]}" was invalid!` };
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

        // "420-202-RE gr.00003, prof.: Sakkaravarthi Ramanathan" -> ["420-202-RE gr.00003, prof.", "Sakkaravarthi Ramanathan"]
        let secondLineSplit1 = rawCourses[1].split(": ");
        if (secondLineSplit1.length != 2) {
            return { isError: true, message: `Teacher declaration was invalid for class "${title}"` };
        }

        const teacher = secondLineSplit1[1];

        // "420-202-RE gr.00003, prof." -> ["420-202-RE", "gr.00003,", "prof."]
        let secondLineSplit2 = secondLineSplit1[0].split(" ");
        if (secondLineSplit2.length != 3) {
            return { isError: true, message: `Course code and group were invalid for course "${title}"!` };
        }

        const courseCode = secondLineSplit2[0];
        const group = secondLineSplit2[1].split(".")[1].replaceAll(",", "");

        let coursesToAdd: TempCourse["courses"] = [];
        for (let i = 2; i < rawCourses.length; i++) {
            const rawCourse = rawCourses[i];

            const isLab = rawCourse.includes("(Laboratoire)");

            // "Mer 10:00 - 12:00, local D-210;VL-210" -> ["Mer 10:00 - 12:00", "local D-210;VL-210"]
            let nLineSplit1 = rawCourse.split(",");
            let rooms = undefined;
            if (nLineSplit1.length == 2) {
                rooms = nLineSplit1[1].replaceAll("local", "").replaceAll("(Théorie)", "").replaceAll("(Laboratoire)", "").trim().split(";");
            }

            // "Mer 10:00 - 12:00" -> ["Mer", "10:00", "-", "12:00"]
            let nLineSplit2 = nLineSplit1[0].split(" ");
            if (nLineSplit2.length != 4) {
                return { isError: true, message: `Time declaration "${nLineSplit1[0]}" for course "${title}" was not valid!` };
            }

            const day = WeekdayInFrench[nLineSplit2[0] as keyof typeof WeekdayInFrench];
            const startTime = TimeFormatter.humanReadableToDecimalHours(nLineSplit2[1]);
            const endTime = TimeFormatter.humanReadableToDecimalHours(nLineSplit2[3]);

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
