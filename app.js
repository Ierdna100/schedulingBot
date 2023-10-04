const { Client, GatewayIntentBits } = require('discord.js')
const { GenerateNewSchedulesEmbed } = require('./periodicEventsHandlers/updateSchedulesEmbed.js')
const createLogger = require('logging')
const { AddVariableToEnvFile } = require('./envManager.js')
const { UpdateUserDisplayName, InitializeScheduleRequest, ClearUserSchedule, UploadUserSchedule } = require('./commandsHandler/userHandler.js')
const { ReplyWithSchedule } = require('./commandsHandler/getScheduleHandler.js')
const { ReplyWithLoggedUsers } = require('./commandsHandler/getLoggedUsers.js')
require('dotenv').config()

/**@type Channel */
let updateChannel
let messageReference = undefined;
const client = new Client({ intents: [GatewayIntentBits.Guilds] })
const logger = createLogger.default('Scheduling Bot')

client.on('ready', () => {
    updateChannel = client.channels.cache.get(process.env.UPDATE_CHANNEL_ID)

    logger.info(`Websocket ready and connected as: ${client.user.tag}`)

    UpdateSchedules()
})

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand())
    {
        let userID = interaction.user.id
        let options = interaction.options

        switch (interaction.commandName) {
            case 'setdisplayname':
                await UpdateUserDisplayName(interaction, userID, options.get('name'))
                break
            case 'uploadschedule':
                await InitializeScheduleRequest(interaction)
                break
            case 'clearschedule':
                await ClearUserSchedule(interaction, userID)
                break
            case 'getschedule':
                await ReplyWithSchedule(interaction, options.get('user'))
                break
            case 'help':
                await interaction.reply({ files: [ "./images/uploadingScheduleInfoV2.png" ]})
                break
            case 'getusers':
                await ReplyWithLoggedUsers(interaction)
                break
            default:
                await interaction.reply({ content: "`501 - Not Implemented`" })
        }
    }
    else if (interaction.isModalSubmit())
    {
        let userID = interaction.user.id
        let components = interaction.components

        if (interaction.customId == "schedule_modal")
        {
            UploadUserSchedule(interaction, userID, components)
        }
    }
})

async function UpdateSchedules() {
    //If message presumably doesn't exist
    if (process.env.UPDATE_MESSAGE_ID == "")
    {
        await updateChannel.send(GenerateNewSchedulesEmbed())
            .then(message => {
                logger.warn(`Message ID was not present, generated new message with ID: ${message.id}`)
                process.env.UPDATE_MESSAGE_ID = message.id
                AddVariableToEnvFile("UPDATE_MESSAGE_ID", message.id)
            })
    }
    else
    {
        if (messageReference == undefined)
        {
            logger.warn(`Message reference is missing, generating new message reference.`)
            messageReference = await updateChannel.messages.fetch(process.env.UPDATE_MESSAGE_ID)
                .catch(e => {
                    logger.error(e)
                    ResetMessageIDInfo()
                })
        }

        if (messageReference != undefined)
        {
            messageReference.edit(GenerateNewSchedulesEmbed())
                .catch(e => {
                    logger.error(e)
                    ResetMessageIDInfo()
                })
        }
    }

    setTimeout(UpdateSchedules, 10000)
}

function ResetMessageIDInfo()
{
    process.env.UPDATE_MESSAGE_ID = ""
    AddVariableToEnvFile("UPDATE_MESSAGE_ID", "")
    messageReference = undefined
}

client.login(process.env.TOKEN)