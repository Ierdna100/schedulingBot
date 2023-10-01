const fs = require('fs')

async function ReplyWithSchedule(interaction, userID)
{
    userSearchID = userID.value
    
    directory = fs.readdirSync('./schedules')

    for (filename of directory)
    {
        filenameWithoutExt = filename.split('.')[0]

        if (filenameWithoutExt == userSearchID)
        {
            await interaction.reply({
                files: [
                    `./schedules/${filename}`
                ]
            })
            return
        }
    }

    interaction.reply(`**No schedules were found for selected user with ID ${userSearchID}**`)
}

module.exports = { ReplyWithSchedule }