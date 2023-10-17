async function RemoveLoggedUser(interaction, opID, userID)
{
    directory = fs.readdirSync("./schedules/")
    searchString = `${userID}.json`

    for (file of directory)
    {
        if (file == searchString)
        {
            
        }
    }

    logger.info(`<@${opID}> tried to delete user with ID ${userID}.`)
    await interaction.reply("**You don't have a schedule logged in the system, could not update display name.**")
}

module.exports = { RemoveLoggedUser }