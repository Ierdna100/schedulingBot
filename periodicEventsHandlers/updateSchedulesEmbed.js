const createLogger = require('logging')
const fs = require('fs')
require('dotenv').config()

const logger = createLogger.default('Scheduling Bot')

let schedules = []

/**@enum */
const Weekdays = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday"
}

/**@enum */
const CurrentlyDoing = {
    inClass: 1,
    almostClass: 2,
    inBreak: 3,
    almostBreak: 4,
    finishedDay: 5,
    almostEnd: 6
}

/**@enum */
const MonthsOfTheYear = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "Decmber"
}

function UpdateSchedulesInMemory()
{
    schedules = []

    directory = fs.readdirSync("./schedules/")

    for (filename of directory)
    {
        schedules.push({
            studentID: `${filename.split(".")[0]}`,
            data: JSON.parse(fs.readFileSync(`./schedules/${filename}`))
        })
    }
}

function GenerateNewSchedulesEmbed()
{
    if (schedules.length == 0)
    {
        UpdateSchedulesInMemory()
    }

    /**@type Date */
    let currentDate = new Date()
    let currentTime = (currentDate.getTime() % (24 * 60 * 60 * 1000))
    let currentTimeInHours = currentTime / 1000 / 60 / 60
    let currentTimeInHoursWithOffset = currentTimeInHours - (currentDate.getTimezoneOffset() / 60)
    let absoluteTimeInHours = (currentTimeInHoursWithOffset + 24) % 24
    
    let day = currentDate.getDay()

    let dayKey = Weekdays[day]

    let fields = []

    for (let schedule of schedules)
    {
        student = schedule.data

        let studentStatus

        // If sunday or saturday
        if (day == 0 || day == 6)
        {
            return { embeds: [
                {
                    title: "No school today",
                    footer: {
                        text: "Want your name and schedule to appear here? Type \"/help\" and follow the instructions!"
                    },
                    timestamp: currentDate.toISOString(),
                    color: parseInt("0x0091ff")
                }
            ]}
        }

        // If student has no classes today || If student has finished
        if (student.finishesAt[dayKey] == null || absoluteTimeInHours > student.finishesAt[dayKey])
        {
            fields.push({
                name: student.displayName,
                value: "Day finished",
                inline: true
            })
            continue
        }

        let currentClassID
        let maxCourseIndex = student.schedule[dayKey].length
        let courseIndex = 0 // Our system is 0 indexed, schedules are 1 indexed
        for (course of student.schedule[dayKey])
        {
            // If we are over the start time
            if (absoluteTimeInHours > course.startTime)
            {
                // If above start time and below end time, then we are in class
                // If not within 15 minutes of end, then show inClass
                if (absoluteTimeInHours <= (course.endTime - 0.25))
                {
                    currentClassID = course.id
                    studentStatus = CurrentlyDoing.inClass
                    break
                }
                // If within 15 minutes before end, show almostEndOfClass
                else if (absoluteTimeInHours <= course.endTime)
                {
                    currentClassID = course.id

                    // If endTime is dayEndTime, then we are near the day
                    if (course.endTime == student.finishesAt[dayKey])
                        studentStatus = CurrentlyDoing.almostEnd
                    // Else, near break
                    else
                        studentStatus = CurrentlyDoing.almostBreak

                    break
                }
                // Else, check other class
                else
                {
                    courseIndex++
                    continue
                }
            }
            // If not before the start of a class and before the end of previous class
            // If within 15 minutes of class
            else if (absoluteTimeInHours > (course.startTime - 0.25))
            {
                studentStatus = CurrentlyDoing.almostClass
                break
            }
            // If not within 15 minutes of class
            else
            {
                studentStatus = CurrentlyDoing.inBreak
                break
            }
        }

        let fieldValue = ""

        switch (studentStatus)
        {
            case CurrentlyDoing.almostBreak:
            case CurrentlyDoing.almostEnd:
            case CurrentlyDoing.inClass:
                // classDefs are off by one in the JSON
                fieldValue += `**Currently in** __${student.classDefinition[currentClassID - 1].name}__\n`
                fieldValue += `**Ends at:** \`[${DecimalHoursToHumanReadable(student.schedule[dayKey][courseIndex].endTime)}]\`\n`

                if (courseIndex + 1 != maxCourseIndex)
                {
                    let previousCourse = student.schedule[dayKey][courseIndex]
                    for (let i = (courseIndex + 1); i < student.schedule[dayKey].length; i++)
                    {
                        let currentCourse = student.schedule[dayKey][i]

                        if (currentCourse.startTime != previousCourse.endTime)
                        {
                            fieldValue += `**Next break:** \`[${DecimalHoursToHumanReadable(previousCourse.endTime)}]\`\n`
                            break
                        }
                    }

                    // classDefs are off by one in the JSON
                    fieldValue += `**Next class:** __${student.classDefinition[student.schedule[dayKey][courseIndex].id].name}__\n`
                    fieldValue += `**Ends at:** \`[${DecimalHoursToHumanReadable(student.schedule[dayKey][courseIndex + 1].endTime)}]\`\n`
                    fieldValue += `**Ends day at:** \`[${DecimalHoursToHumanReadable(student.finishesAt[dayKey])}]\``
                }
                    
                break
            case CurrentlyDoing.almostClass:
                fieldValue += `**Class starting soon**\n`
            case CurrentlyDoing.inBreak:
                fieldValue += `**Currently in break**\n`
                fieldValue += `**Until:** \`[${DecimalHoursToHumanReadable(student.schedule[dayKey][courseIndex].startTime)}]\`\n`
                // classDefs are off by one in the JSON
                fieldValue += `**Next class:** __${student.classDefinition[student.schedule[dayKey][courseIndex - 1].id].name}__\n`
                fieldValue += `**Ends at:** \`[${DecimalHoursToHumanReadable(student.schedule[dayKey][courseIndex].endTime)}]\`\n`
                fieldValue += `**Ends day at:** \`[${DecimalHoursToHumanReadable(student.finishesAt[dayKey])}]\``
                break
            // Not technically used
            case CurrentlyDoing.finishedDay:
                fieldValue += `**Day ended**`
                break
            default:
                logger.warn(`Invalid studentStatus for student ${student.displayName} (${schedule.id})`)
                fieldValue += `\`\`\`diff\n-Error 500: Internal Server Error\n\`\`\``
        }

        fields.push({
            name: student.displayName,
            value: fieldValue,
            inline: true
        })
    }

    currentDateStr = ""
    currentDateStr += `${currentDate.getDate()}`
    
    switch(currentDate.getDate() % 10)
    {
        case 1:
            currentDateStr += "st"
            break
        case 2:
            currentDateStr += "nd"
            break
        case 3:
            currentDateStr += "rd"
            break
        default:
            currentDateStr += "th"
    }

    currentDateStr += ` of ${MonthsOfTheYear[currentDate.getMonth()]}, ${currentDate.getFullYear()}`

    return { embeds: [
        {
            title: "Schedules for today",
            description: currentDateStr,
            footer: {
                text: "Want your name and schedule to appear here? Type \"/help\" and follow the instructions!"
            },
            fields: fields,
            timestamp: currentDate.toISOString(),
            color: 0x0091FF
        }
    ]}
}

function DecimalHoursToHumanReadable(hours)
{
    return `${Math.floor(hours)}`.padEnd(2, "0") + ":" + `${Math.floor((hours % 1) * 60)}`.padEnd(2, "0")
}

module.exports = { GenerateNewSchedulesEmbed, UpdateSchedulesInMemory }