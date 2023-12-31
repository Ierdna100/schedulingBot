const { Client, GatewayIntentBits } = require('discord.js')
const { GenerateNewSchedulesEmbed, SetAnnouncementChannel } = require('./periodicEventsHandlers/updateSchedulesEmbed.js')
const createLogger = require('logging')
const { AddVariableToEnvFile } = require('./envManager.js')
const { UpdateUserDisplayName, InitializeScheduleRequest, ClearUserSchedule, UploadUserSchedule } = require('./commandsHandler/userHandler.js')
const { ReplyWithSchedule } = require('./commandsHandler/getScheduleHandler.js')
const { ReplyWithLoggedUsers } = require('./commandsHandler/getLoggedUsers.js')
const { GetScheduleFormatted } = require('./commandsHandler/getScheduleFormatted.js')
const { RemoveLoggedUser } = require('./commandsHandler/removeLoggedUser.js')
const { BanlistHandler, IsUserBanned } = require('./commandsHandler/banListHandler.js')
const { IsUserOp } = require('./commandsHandler/opHandler.js')
const { InitializeDayoffModal, SetDayoff, UploadDayoff } = require('./commandsHandler/dayoffHandler.js')

require('dotenv').config()

/**@type boolean */
let clientRunning = false

/**@type Channel */
let updateChannel
let messageReference = undefined;
const logger = createLogger.default('Scheduling Bot')
let client

//Timeout values
let createClientTimeout
let updateSchedulesTimeout
let announcementsChannel

if (!process.env.TOKEN 
    || !process.env.CLIENT_ID 
    || !process.env.UPDATE_CHANNEL_ID)
{
    logger.error(".env file is missing Token, client ID or channel ID. Fill those in!")
    process.exit(1)
}

createClient()

function createClient() {
    client = new Client({ intents: [GatewayIntentBits.Guilds] })

    client.on('ready', () => {
        updateChannel = client.channels.cache.get(process.env.UPDATE_CHANNEL_ID)
        announcementsChannel = client.channels.cache.get(process.env.ANNOUNCEMENTS_CHANNEL)

        SetAnnouncementChannel(announcementsChannel)

        logChannel = client.channels.cache.get(process.env.LOG_CHANNEL)
    
        logChannel.send(`<@337662083523018753> server started`)
    
        logger.info(`Websocket ready and connected as: ${client.user.tag}`)
        
        if (!process.env.UPDATE_RATE_SECONDS)
        {
            process.env.UPDATE_RATE_SECONDS = 120
            logger.warn(`Update rate is not defined in .env file. Defaulting to 120 seconds (2 minutes)`)
        }
        else
        {
            logger.info(`Update rate is ${process.env.UPDATE_RATE_SECONDS} seconds.`)
        }
    
        UpdateSchedules()
        clientRunning = true
    })
    
    client.on('interactionCreate', async interaction => {
        if (interaction.isChatInputCommand())
        {
            let userID = interaction.user.id
            let options = interaction.options
    
            let isOp = IsUserOp(userID)
            let isBanned = IsUserBanned(userID)
    
            switch (interaction.commandName) {
                case 'setdisplayname':
                    logger.info(`User <@${userID}> entered command 'setdisplayname'`)
                    await UpdateUserDisplayName(interaction, userID, options.get('name'))
                    break
                case 'uploadschedule':
                    if (isBanned)
                    {
                        logger.info(`User <@${userID}> cannot use command 'uploadschedule': banned`)
                        await interaction.reply("**You canot upload a schedule: you are banned**")
                        return
                    }
    
                    logger.info(`User <@${userID}> entered command 'uploadschedule'`)
                    await InitializeScheduleRequest(interaction)
                    break
                case 'clearschedule':
                    logger.info(`User <@${userID}> entered command 'clearschedule'`)
                    await ClearUserSchedule(interaction, userID)
                    break
                case 'getschedule':
                    logger.info(`User <@${userID}> entered command 'getschedule'`)
                    await GetScheduleFormatted(interaction, userID, options.get('user'))
                    break
                case 'getschedulejson':
                    logger.info(`User <@${userID}> entered command 'getschedulejson'`)
                    await ReplyWithSchedule(interaction, userID, options.get('user'))
                    break
                case 'help':
                    logger.info(`User <@${userID}> entered command 'help'`)
                    await interaction.reply({ files: [ "./images/uploadingScheduleInfoV2.png" ]})
                    break
                case 'getusers':
                    logger.info(`User <@${userID}> entered command 'getusers'`)
                    await ReplyWithLoggedUsers(interaction)
                    break
                case 'removeschedule':
                    if (!isOp)
                    {
                        logger.info(`User <@${userID}> cannot use command 'removeschedule': not admin`)
                        await interaction.reply("**You cannot remove user from board: you are not an admin**")
                        return
                    }
    
                    logger.info(`User <@${userID}> entered command 'removeschedule'`)
                    await RemoveLoggedUser(interaction, userID, options.get('user'))
                    break
                case 'banlist':
                    if (!isOp)
                    {
                        logger.info(`User <@${userID}> cannot use command 'removeuser': not admin`)
                        await interaction.reply("**You cannot modify banlist: you are not an admin**")
                        return
                    }
    
                    logger.info(`User <@${userID}> entered command 'removeuser'`)
                    await BanlistHandler(interaction, userID, options.getSubcommand(), options.get('user'))
                    break
                case 'dayoff':
                    if (!isOp)
                    {
                        logger.info(`User <@${userID}> cannot use command 'dayoff': not admin`)
                        await interaction.reply("**You cannot modify days off: you are not an admin**")
                        return
                    }
    
                    logger.info(`User <@${userID}> entered command 'dayoff'`)
                    await InitializeDayoffModal(interaction)
                    break
                default:
                    logger.warn(`Command ${interaction.commandName} is not handled!`)
                    await interaction.reply({ content: "`501 - Not Implemented`" })
            }
        }
        else if (interaction.isModalSubmit())
        {
            let userID = interaction.user.id
            let components = interaction.components
    
            console.log(interaction.customId)

            if (interaction.customId == "schedule_modal")
            {
                logger.info(`User <@${userID}> submitted modal 'schedule_modal'`)
                UploadUserSchedule(interaction, userID, components)
            }
            else if (interaction.customId == "dayoff_modal")
            {
                logger.info(`User <@${userID}> submitted modal 'dayoff_modal'`)
                UploadDayoff(interaction, userID, components)
            }
        }
        else if (interaction.isStringSelectMenu())
        {
            let userID = interaction.user.id

            let isOp = IsUserOp(userID)
            let isBanned = IsUserBanned(userID)

            if (isBanned)
            {
                logger.info(`User <@${userID}> cannot submit select menus: banned`)
                await interaction.reply("**You canot interact with the bot: you are banned**")
                return
            }

            if (interaction.customId == "dayoff_cegep_selector")
            {
                logger.info(`User <@${userID}> submitted select menu 'dayoff_cegep_selector'`)
                await SetDayoff(interaction)
                return
            }
        }
    })
    
    client.on('error', error => {
        clientRunning = false
        client.destroy()
        clearTimeout(updateSchedulesTimeout)

        logger.error(`Server crashed with error name: ${error.name}`)
        logger.error(`${error.message}`)
        logger.error("Attempting restart in 10 minutes!")

        createClientTimeout = setTimeout(createClient, 10 * 60 * 1000)
    })

    logger.info("Attempting to connect to Discord with websocket...")
    client.login(process.env.TOKEN)
}

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

    updateSchedulesTimeout = setTimeout(UpdateSchedules, process.env.UPDATE_RATE_SECONDS * 1000)
}

function ResetMessageIDInfo()
{
    process.env.UPDATE_MESSAGE_ID = ""
    AddVariableToEnvFile("UPDATE_MESSAGE_ID", "")
    messageReference = undefined
}
