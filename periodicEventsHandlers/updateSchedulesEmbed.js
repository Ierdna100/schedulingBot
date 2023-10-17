const createLogger = require('logging')
const fs = require('fs')
require('dotenv').config()

const logger = createLogger.default('Scheduling Bot')

let schedules = []
let existingNames = []

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
    almostEnd: 6,
    hasNotBegun: 7,
    hasAlmostBegun: 8
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
    11: "December"
}

function UpdateSchedulesInMemory()
{
    logger.info(`Updated schedules in memory!`)

    schedules = []
    existingNames = []

    directory = fs.readdirSync("./schedules/")

    for (filename of directory)
    {
        let data = JSON.parse(fs.readFileSync(`./schedules/${filename}`))

        existingNames.push(data.displayName)

        //sort days
        for (day in data.schedule)
        {
            data.schedule[day] = data.schedule[day].sort((a, b) => a.startTime - b.startTime)
        }

        schedules.push({
            userID: `${filename.split(".")[0]}`,
            data: data
        })
    }
}

function GetExistingName()
{
    return existingNames
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

        // Compute studentStatus
        let maxCourseIndex = student.schedule[dayKey].length
        let courseIndex = 0
        for (course of student.schedule[dayKey])
        {
            // If we are more than 15 minutes before first start time
            if (courseIndex == 0 && absoluteTimeInHours <= (course.startTime - 0.25))
            {
                studentStatus = CurrentlyDoing.hasNotBegun
            }
            // If we are before first start time
            else if (courseIndex == 0 && absoluteTimeInHours <= course.startTime)
            {
                studentStatus = CurrentlyDoing.hasAlmostBegun
            }
            // If we are over the start time
            else if (absoluteTimeInHours > course.startTime)
            {
                // If above start time and below end time, then we are in class
                // If not within 15 minutes of end, then show inClass
                if (absoluteTimeInHours <= (course.endTime - 0.25))
                {
                    studentStatus = CurrentlyDoing.inClass
                    break
                }
                // If within 15 minutes before end, show almostEndOfClass
                else if (absoluteTimeInHours <= course.endTime)
                {
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

        // Compute fields
        let fieldValue = ""

        let currentCourse
        let nextCourse

        nextCourse = student.schedule[dayKey][courseIndex + 1]

        // if in break, then courseIndex indicates nextclass
        if (studentStatus == CurrentlyDoing.inBreak || studentStatus == CurrentlyDoing.almostClass)
        {
            nextCourse = student.schedule[dayKey][courseIndex]
        }
        // If not in break, then courseIndex indicates class, + 1 indicates nextClass
        else
        {
            currentCourse = student.schedule[dayKey][courseIndex]
            nextCourse = student.schedule[dayKey][courseIndex + 1]
        }

        switch (studentStatus)
        {
            case CurrentlyDoing.almostBreak:
            case CurrentlyDoing.almostEnd:
            case CurrentlyDoing.inClass:
                fieldValue += `**Currently in** __${currentCourse.className}__`
                rooms = currentCourse.rooms
                if (rooms == undefined)
                {
                    fieldValue += "\n"
                }
                else
                {
                    fieldValue += ` (${rooms[0]})\n`
                }
                fieldValue += `**Ends at:** \`[${DecimalHoursToHumanReadable(currentCourse.endTime)}]\`\n`

                if (courseIndex != maxCourseIndex - 1)
                {
                    let previousCourse = currentCourse
                    for (let i = (courseIndex + 1); i < maxCourseIndex; i++)
                    {
                        let currentCourseToCheck = student.schedule[dayKey][i]

                        if (currentCourseToCheck.startTime != previousCourse.endTime)
                        {
                            fieldValue += `**Next break:** \`[${DecimalHoursToHumanReadable(previousCourse.endTime)}]\`\n`
                            break
                        }
                    }

                    fieldValue += `**Next class: ** __${nextCourse.className}__\n`
                    fieldValue += `**Ends at:** \`[${DecimalHoursToHumanReadable(nextCourse.endTime)}]\`\n`
                    fieldValue += `**Ends day at:** \`[${DecimalHoursToHumanReadable(student.finishesAt[dayKey])}]\``
                }

                break
            case CurrentlyDoing.almostClass:
                fieldValue += `**Class starting soon**\n`
            case CurrentlyDoing.inBreak:
                fieldValue += `**Currently in break**\n`
                fieldValue += `**Until:** \`[${DecimalHoursToHumanReadable(nextCourse.startTime)}]\`\n`
                fieldValue += `**Next class:** __${nextCourse.className}__`
                rooms = nextCourse.rooms
                if (rooms == undefined)
                {
                    fieldValue += "\n"
                }
                else
                {
                    fieldValue += ` (${rooms[0]})\n`
                }

                fieldValue += `**Ends at:** \`[${DecimalHoursToHumanReadable(nextCourse.endTime)}]\`\n`
                fieldValue += `**Ends day at:** \`[${DecimalHoursToHumanReadable(student.finishesAt[dayKey])}]\``
                break
            // Not technically used
            case CurrentlyDoing.finishedDay:
                fieldValue += `**Day ended**`
                break
            case CurrentlyDoing.hasAlmostBegun:
                fieldValue += `**Class starting soon**\n`
            case CurrentlyDoing.hasNotBegun:
                fieldValue += `**Has not began classes yet**\n`
                fieldValue += `**Starts at:** \`[${DecimalHoursToHumanReadable(nextCourse.startTime)}]\`\n`
                fieldValue += `**Starts with:** __${nextCourse.className}__\n`
                fieldValue += `**Ends class at:** \`[${DecimalHoursToHumanReadable(nextCourse.endTime)}]\`\n`
                fieldValue += `**Ends day at:** \`[${DecimalHoursToHumanReadable(student.finishesAt[dayKey])}]\``
                break
            default:
                logger.warn(`Invalid studentStatus for student ${student.displayName} (${schedule.userID})`)
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
    return `${Math.floor(hours)}`.padStart(2, "0") + ":" + `${Math.floor((hours % 1) * 60)}`.padStart(2, "0")
}

module.exports = { GenerateNewSchedulesEmbed, UpdateSchedulesInMemory, GetExistingName }