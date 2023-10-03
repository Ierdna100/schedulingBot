const fs = require('fs')

async function ReplyWithLoggedUsers(interaction)
{
    directory = fs.readdirSync('./schedules/')
    
    let message = "**Users with an available schedule are:**\n"
    let index = 0
    let lengthOfDirectory = directory.length

    if (lengthOfDirectory == 0)
    {
        interaction.reply("**No logged users in database.**")
        return
    }

    for (file of directory)
    {
        let filename = file.split(".")[0]
        let copyOfMessage = message + `<@${filename}> with ID: \`${filename}\`\n`

        if (copyOfMessage.length >= 1700)
        {
            message += `**And ${lengthOfDirectory - index} more...`
            break
        }

        message = copyOfMessage
        index++
    }

    await interaction.reply({content: message, allowedMentions: { users: [], roles: [] }})
}

module.exports = { ReplyWithLoggedUsers }