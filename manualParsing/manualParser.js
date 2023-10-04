const fs = require('fs')
const { ParseScheduleV2 } = require('../commandsHandler/parseSchedule')

directory = fs.readdirSync('./manualParsing/input/')

console.log(`Manually updating files:`)
console.log(directory)

for (file of directory)
{
    let username = file.split(".")[0]
    let schedule = fs.readFileSync(`./manualParsing/input/${file}`).toString()

    // try and parse schedule
    try
    {
        classDays = ParseScheduleV2(schedule)
    }
    catch (err)
    {
        console.log(err)
        continue
    }

    let finishesAt = {}

    // get end times
    for (day in classDays)
    {   
        if (classDays[day].length != 0)
        {
            let highestClassEndTime = 0
            for (course of classDays[day])
            {
                if (course.endTime > highestClassEndTime)
                    highestClassEndTime = course.endTime
            }

            finishesAt[day] = highestClassEndTime
        } 
        else
        {
            finishesAt[day] = null
        }
    }

    let hasAtLeastOneValidClass = false

    // safety check
    for (day in classDays)
    {
        if (finishesAt[day] != null)
        {
            hasAtLeastOneValidClass = true
            break
        }
    }

    if (!hasAtLeastOneValidClass)
    {
        console.log("Schedule is invalid. No classes were parsed. If you think this was a mistake, contact <@337662083523018753>")
        continue
    }

    let scheduleAsJSON = {
        displayName: username,
        finishesAt: finishesAt,
        schedule: classDays,
    }

    fs.writeFileSync(`./manualParsing/output/${file.split(".")[0]}.json`, JSON.stringify(scheduleAsJSON, null, "\t"))
}

console.log("DONE!")