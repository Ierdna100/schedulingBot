const { scheduleModal } = require("./modals.js")
const fs = require('fs')
const { ParseScheduleV2 } = require("./parseSchedule.js")
const createLogger = require('logging')
const { UpdateSchedulesInMemory, GetExistingName } = require("../periodicEventsHandlers/updateSchedulesEmbed.js")

const logger = createLogger.default('Scheduling Bot')

/**
 * @param {String} userID 
 * @param {String} newUserName 
 */
async function UpdateUserDisplayName(interaction, userID, newUserName)
{
    directory = fs.readdirSync("./schedules/")
    searchString = `${userID}.json`

    let existingNames = GetExistingName()

    for (let name of existingNames)
    {
        if (newUserName.toLowerCase().includes(name))
        {
            await interaction.reply("**Username cannot match already existing name!**")
            return
        }
    }

    for (file of directory)
    {
        if (file == searchString)
        {
            fileData = JSON.parse(fs.readFileSync(`./schedules/${file}`))

            if ("displayName" in fileData)
            {
                fileData.displayName = newUserName.value
                fs.writeFileSync(`./schedules/${file}`, JSON.stringify(fileData, null, "\t"))
                
                interaction.reply(`**Successfully replaced display name!**`)

                UpdateSchedulesInMemory()
                
                return
            }
            else
            {
                interaction.reply(`\`\`\`\nReferenceException: ${file} has an invalid JSON format.\n\tat userHandler.js\n\tat UpdateUserDisplayName()\`\`\``)
                return
            }
        }
    }

    await interaction.reply("**You don't have a schedule logged in the system, could not update display name.**")
}

/**
 * @param {import("discord.js").Interaction} interaction 
 */
async function InitializeScheduleRequest(interaction)
{
    await interaction.showModal(scheduleModal)
}

/**
 * @param {import("discord.js").Interaction} interaction 
 */
async function UploadUserSchedule(interaction, userID, components)
{
    directory = fs.readdirSync("./schedules/")

    let userExists = false

    // see if user already exists
    for (file of directory)
    {
        filename = file.split(".")[0]

        if (filename == userID)
        {
            userExists = true
            break
        }
    }

    let username = components[0].components[0].value
    let schedule = components[1].components[0].value

    // Ensure no duplicate names exist
    let existingNames = GetExistingName()
    for (let name of existingNames)
    {
        if (username.toLowerCase().includes(name))
        {
            await interaction.reply("**Username cannot match already existing name!**")
            return
        }
    }

    // try and parse schedule
    try
    {
        classDays = ParseScheduleV2(schedule)
    }
    catch (err)
    {
        logger.warn(err)
        interaction.reply("**Invalid schedule declaration! Please follow the instructions provided by /help**")
        return
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
        await interaction.reply({
            content: "**Schedule is invalid. No classes were parsed. If you think this was a mistake, contact <@337662083523018753>**",
            allowedMentions: { users: [], roles: [] }
        })
    }

    let scheduleAsJSON = {
        displayName: username,
        finishesAt: finishesAt,
        schedule: classDays,
    }

    fs.writeFileSync(`./schedules/${userID}.json`, JSON.stringify(scheduleAsJSON, null, "\t"))

    UpdateSchedulesInMemory()

    if (userExists)
    {
        interaction.reply("**Successfully replaced old schedule!**")
    }
    else
    {
        interaction.reply("**Successfully uploaded new schedule!**")
    }
}

async function ClearUserSchedule(interaction, userID)
{
    directory = fs.readdirSync("./schedules/")
    searchString = `${userID}.json`

    for (file of directory)
    {
        if (file == searchString)
        {
            fs.unlinkSync(`./schedules/${file}`)
            interaction.reply(`**Successfully deleted your schedule!**`)

            UpdateSchedulesInMemory()
            
            return
        }
    }

    await interaction.reply("**You don't have a schedule logged in the system, could not delete.**")
}

module.exports = { UpdateUserDisplayName, InitializeScheduleRequest, ClearUserSchedule, UploadUserSchedule }