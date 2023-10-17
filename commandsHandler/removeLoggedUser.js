const fs = require('fs')

async function RemoveLoggedUser(interaction, opID, userID)
{
    directory = fs.readdirSync("./schedules/")
    searchString = `${userID}.json`

    for (file of directory)
    {
        if (file == searchString)
        {
            fs.unlink(`./schedules/${file}.json`)
            logger.info(`User <${opID}> successfully deleted user with ID ${userID}.`)
            await interaction.reply(`**Successfully removed <@${userID}> from database.`)
            return
        }
    }

    logger.info(`User <${opID}> tried to delete user with ID ${userID}.`)
    await interaction.reply("**You don't have a schedule logged in the system, could not update display name.**")
}

module.exports = { RemoveLoggedUser }