const fs = require('fs')
const { scheduleModal } = require('./modals')

async function GetScheduleFormatted(interaction, opID, userID)
{
    if (userID != null)
        userSearchID = userID.value
    else
        userSearchID = opID
    
    directory = fs.readdirSync('./schedules')

    for (filename of directory)
    {
        filenameWithoutExt = filename.split('.')[0]

        if (filenameWithoutExt == userSearchID)
        {
            await interaction.reply({
                content: ParseScheduleClean(JSON.parse(fs.readFileSync(`./schedules/${filename}`).toString()))
            })
            return
        }
    }

    await interaction.reply(`**No schedules were found for selected user with ID ${userSearchID}**`)
}

function ParseScheduleClean(data)
{
    schedule = data.schedule
    let stringOutput = ""

    for (day in schedule)
    {
        if (data.finishesAt[day] == null)
        {
            continue
        }

        dayTitleCased = day[0].toUpperCase() + day.substring(1)
        stringOutput += `**${dayTitleCased}:**\n`

        // need to sort now that they are no longer in order
        schedule[day] = schedule[day].sort((a, b) => a.startTime - b.startTime)

        for (course of schedule[day])
        {
            stringOutput += `\t\t\`[${DecimalHoursToHumanReadable(course.startTime)}] - [${DecimalHoursToHumanReadable(course.endTime)}]\` `

            if (course.rooms != undefined)
            {
                for (room of course.rooms)
                {
                    stringOutput += `(${room}),  `
                }

                // removes last space and comma
                stringOutput = stringOutput.substring(0, stringOutput.length - 3)
            }

            stringOutput += `\t__${course.className}__\n`
        }
    }

    return stringOutput
}

// should maybe shove this in its own file
function DecimalHoursToHumanReadable(hours)
{
    return `${Math.floor(hours)}`.padStart(2, "0") + ":" + `${Math.floor((hours % 1) * 60)}`.padStart(2, "0")
}

module.exports = { GetScheduleFormatted }