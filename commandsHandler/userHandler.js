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
        if (newUserName.value.toLowerCase().includes(name.toLowerCase().replaceAll(" ", "")))
        {
            logger.warn(`User <${userID}> attempted to replace name but could not override existing name!`)
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
                
                logger.info(`Replaced display name of user <@${userID}>`)
                interaction.reply(`**Successfully replaced display name!**`)

                UpdateSchedulesInMemory()
                
                return
            }
            else
            {
                logger.error(`${file} has an invalid JSON format!`)
                interaction.reply(`\`\`\`\nReferenceException: ${file} has an invalid JSON format.\n\tat userHandler.js\n\tat UpdateUserDisplayName()\`\`\``)
                return
            }
        }
    }

    logger.info(`<@${userID}> attempted to update display name but doesn't have a schedule registered.`)
    await interaction.reply("**You don't have a schedule logged in the system, could not update display name.**")
}

/**
 * @param {import("discord.js").Interaction} interaction 
 */
async function InitializeScheduleRequest(interaction)
{
    logger.info(`Responded with modal`)
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

    // log schedules in case people want to fuck over the bot
    /**@type Date */
    let currentDateForLog = new Date()
    fs.writeFileSync(`./logSchedules/${currentDateForLog.toISOString().replaceAll(":","-")}_${userID}.txt`, schedule.toString())

    // Ensure no duplicate names exist
    let existingNames = GetExistingName()
    for (let name of existingNames)
    {
        if (username.toLowerCase().includes(name.toLowerCase().replaceAll(" ", "-")))
        {
            logger.warn(`<@${userID}> attempted to upload schedule with display name ${username}, which already exists!`)
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
        interaction.reply("**Invalid schedule declaration! Please follow the instructions provided by /help. Note that you cannot upload schedule from a mobile device, as the formatting is wrong on them.**")
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
        logger.info(`<@${userID} uploaded an invalid schedule. Schedule can be seen at ./uploadedSchedules`)
        await interaction.reply({
            content: "**Schedule is invalid. No classes were parsed. If you think this was a mistake, contact <@337662083523018753>**",
            allowedMentions: { users: [], roles: [] }
        })
        return
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
        logger.info(`User <@${userID}> replaced old schedule`)
        interaction.reply("**Successfully replaced old schedule!**")
    }
    else
    {
        logger.info(`User <@${userID}> uploaded new schedule`)
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
            logger.info(`User <@${userID}> deleted their schedule`)
            interaction.reply(`**Successfully deleted your schedule!**`)

            UpdateSchedulesInMemory()
            
            return
        }
    }

    logger.info(`User <@${userID}> attempted to delete schedule but doesn't have one logged.`)
    await interaction.reply("**You don't have a schedule logged in the system, could not delete.**")
}

module.exports = { UpdateUserDisplayName, InitializeScheduleRequest, ClearUserSchedule, UploadUserSchedule }