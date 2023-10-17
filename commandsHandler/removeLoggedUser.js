const fs = require('fs')
const createLogger = require('logging')
const logger = createLogger.default('Scheduling Bot')

async function RemoveLoggedUser(interaction, opID, userID)
{
    userID = userID.value
    
    directory = fs.readdirSync("./schedules/")
    searchString = `${userID}.json`

    for (file of directory)
    {
        if (file == searchString)
        {
            fs.unlinkSync(`./schedules/${file}`)
            logger.info(`User <${opID}> successfully deleted user with ID ${userID}.`)
            await interaction.reply(`**Successfully removed <@${userID}> from database.**`)
            return
        }
    }

    logger.info(`User <${opID}> tried to delete user with ID ${userID}.`)
    await interaction.reply({allowedMentions: { users: [], roles: [] }, content: `**User <@${userID}> doesn't have a schedule logged in the system, could not delete schedule.**`})
}

module.exports = { RemoveLoggedUser }