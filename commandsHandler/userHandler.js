const { scheduleModal } = require("./modals.js")
const fs = require('fs')
const { ParseSchedule, ParseClasses } = require("./parseSchedule.js")
const createLogger = require('logging')
const { UpdateSchedulesInMemory } = require("../periodicEventsHandlers/updateSchedulesEmbed.js")

const logger = createLogger.default('Scheduling Bot')

async function UpdateUserDisplayName(interaction, userID, newUserName)
{
    directory = fs.readdirSync("./schedules/")
    searchString = `${userID}.json`

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

    interaction.reply("**You don't have a schedule logged in the system, could not update display name.**")
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
    let classes = components[2].components[0].value

    let numberOfClasses

    try
    {
        schedule = ParseSchedule(schedule)
        numberOfClasses = schedule.numberOfClasses
        schedule = schedule.daysClass
    }
    catch (err)
    {
        logger.warn(err)
        interaction.reply("**Invalid schedule declaration! Please follow the instructions provided by /help**")
        return
    }

    try
    {
        classes = ParseClasses(classes, numberOfClasses)
    }
    catch (err)
    {
        logger.warn(err)
        interaction.reply("**Invalid class declaration! Please follow the instructions provided by /help**")
        return
    }

    // If less classes exist than there should be, then there is a few missing. Otherwise we dont really care and its even useful if someone has classes sat/sun
    if (classes.length < numberOfClasses)
    {
        logger.warn(`Invalid class declaration, the number of parsed classes (${numberOfClasses}) != expected number of classes from schedule (${classes.length}).`)
        interaction.reply("**Invalid class declaration! Please follow the instructions provided by /help**")
        return
    }

    let finishesAt = {}

    for (day in daysClass)
    {   
        if (daysClass[day].length != 0)
            finishesAt[day] = daysClass[day][daysClass[day].length - 1].endTime
        else
            finishesAt[day] = null
    }

    let scheduleAsJSON = {
        displayName: username,
        finishesAt: finishesAt,
        schedule: schedule,
        classDefinition: classes
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

    interaction.reply("**You don't have a schedule logged in the system, could not delete.**")
}

module.exports = { UpdateUserDisplayName, InitializeScheduleRequest, ClearUserSchedule, UploadUserSchedule }