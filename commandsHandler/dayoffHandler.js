const { ActionRowBuilder, StringSelectMenuBuilder } = require("@discordjs/builders")
const fs = require('fs')
const createLogger = require('logging')
const { schools } = require("./schools")
const { dayoffModal } = require("./modals")

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

    /**@type Date */
    d = new Date().setSeconds(18000)

    console.log(d.getMonth())
    console.log(d.getDay())
    console.log(d.getFullYear())

    newCurrentDayoff.school = values[0]

    logger.info("Responded with modal")
    await interaction.showModal(dayoffModal)
}

async function UploadDayoff(interaction, userID, components)
{
    /**@type Date */
    d = new Date().setSeconds(18000)

    console.log(d.getMonth())
    console.log(d.getDay())
    console.log(d.getFullYear())

    await interaction.reply("a")
}

module.exports = { InitializeDayoffModal, SetDayoff, UploadDayoff }