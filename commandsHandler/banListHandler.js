const fs = require('fs')

async function BanlistHandler(interaction, opID, subcommand, userID)
{
    currentlyBannedUsers = JSON.parse(fs.readFileSync("./permissions/bannedUsers.json"))
    searchID = userID?.value

    if (subcommand == 'add')
    {
        for (user of currentlyBannedUsers)
        {
            if (user == searchID)
            {
                interaction.reply({content: `**User <@${searchID}> is already banned.**`, allowedMentions: { users: [], roles: [] }})
                return
            }
        }

        currentlyBannedUsers.push(searchID)
        console.log(currentlyBannedUsers)

        fs.writeFileSync("./permissions/bannedUsers.json", JSON.stringify(currentlyBannedUsers, null, "\t"))

        interaction.reply({content: `**Banned user <@${searchID}>**`, allowedMentions: { users: [], roles: [] }})
        return
    }
    else if (subcommand == 'remove')
    {
        for (user of currentlyBannedUsers)
        {
            if (user == searchID)
            {
                let newBanlist = []

                for (user of currentlyBannedUsers)
                {
                    if (user != searchID)
                    {
                        newBanlist.push(user)
                    }
                }

                fs.writeFileSync("./permissions/bannedUsers.json", JSON.stringify(newBanlist, null, "\t"))

                interaction.reply({content: `**Unbanned user <@${searchID}>**`, allowedMentions: { users: [], roles: [] }})
                return
            }
        }

        interaction.reply({content: `**User <@${searchID}> is not banned.**`, allowedMentions: { users: [], roles: [] }})
        return
    }
    else if (subcommand == 'get')
    {
        if (currentlyBannedUsers.length == 0)
        {
            interaction.reply("**There are no banned users.**")
            return
        }

        message = ""

        for (user of currentlyBannedUsers)
        {
            message += `<@${user}>\n`
        }

        interaction.reply({content: message, allowedMentions: { users: [], roles: [] }})
        return
    }
    else
    {
        interaction.reply("`500 - Internal error occured.`")
    }
}

function IsUserBanned(searchID)
{
    currentlyBannedUsers = JSON.parse(fs.readFileSync("./permissions/bannedUsers.json"))
    
    for (user of currentlyBannedUsers)
    {
        if (user == searchID)
        {
            return true
        }
    }

    return false
}

module.exports = { BanlistHandler, IsUserBanned }