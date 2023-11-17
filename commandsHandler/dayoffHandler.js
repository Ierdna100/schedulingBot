const { ActionRowBuilder, StringSelectMenuBuilder } = require("@discordjs/builders")
const fs = require('fs')
const createLogger = require('logging')
const { schools } = require("./schools")
const { dayoffModal } = require("./modals")
const { MonthsOfTheYear } = require("../periodicEventsHandlers/updateSchedulesEmbed")

const logger = createLogger.default('Scheduling Bot')

let currentDaysOff = JSON.parse(fs.readFileSync('./botData/daysoff.json'))
let newCurrentDayoff = {}

/**
 * @param {import("discord.js").Interaction} interaction 
 */
async function InitializeDayoffModal(interaction)
{
    logger.info(`Responded with action row builder`)
    await interaction.reply({ components: [
        new ActionRowBuilder().setComponents(new StringSelectMenuBuilder({
            custom_id: "dayoff_cegep_selector",
            placeholder: "Choose which CEGEPs are affected",
            max_values: 1,
            min_values: 1,
            options: [
                { label: "CÉGEP Bois-de-Boulogne", value: schools.bdeb },
                { label: "Vanier College", value: schools.vanier },
                { label: "All", value: schools.all }
            ]
        }))
    ]})
}

/**
 * @param {import("discord.js").StringSelectMenuInteraction} interaction 
 */
async function SetDayoff(interaction)
{
    values = interaction.values

    newCurrentDayoff.school = values[0]

    logger.info("Responded with modal")
    await interaction.showModal(dayoffModal)
}

async function UploadDayoff(interaction, userID, components)
{
    let rawDay
    let rawReason
    let pingOnDay = false

    for (c of components) {
        if (c.components[0].customId == "day") {
            rawDay = c.components[0].value
        } else if (c.components[0].customId == "reason") {
            rawReason = c.components[0].value
        } else if (c.components[0].customId == "ping_on_day") {
            if (c.components[0].value.toLowerCase() == "y") {
                pingOnDay = true
            }
        }
    }

    rawDay = rawDay.trim()
    
    if (rawDay.length != 5) {
        await interaction.reply("Invalid date format!")
        return
    }

    let rawDayMonth = rawDay.substring(0, 3)
    let rawDayDay = rawDay.substring(3)

    for (key in MonthsOfTheYear) {
        if (MonthsOfTheYear[key].substr(0, 3).toLowerCase() == rawDayMonth.toLowerCase())
        {
            newCurrentDayoff.month = key
            break
        }
    }

    newCurrentDayoff.day = rawDayDay

    newCurrentDayoff.reason = rawReason
    newCurrentDayoff.pingOnDay = pingOnDay

    currentDaysOff.push(newCurrentDayoff)
    fs.writeFileSync('./botData/daysoff.json', JSON.stringify(currentDaysOff, null, "\t"))

    await interaction.reply(`Added new day off with data:\n\`\`\`json\n${JSON.stringify(newCurrentDayoff, null, "  ")}\n\`\`\``)
}

module.exports = { InitializeDayoffModal, SetDayoff, UploadDayoff }