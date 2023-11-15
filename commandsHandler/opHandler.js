const fs = require("fs")

function IsUserOp(searchID)
{
    currentlyOppedUsers = JSON.parse(fs.readFileSync("./botData/opUsers.json"))

    for (user of currentlyOppedUsers)
    {
        if (user == searchID)
        {
            return true
        }
    }

    return false
}

module.exports = { IsUserOp }