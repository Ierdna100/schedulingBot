import fs from 'fs';

function isUserBanned(searchUserId: string)
{
    const currentlyOppedUsers: string[] = JSON.parse(fs.readFileSync('./data/bannedUsers.json').toString())

    for (const userId of currentlyOppedUsers)
    {
        if (userId == searchUserId)
        {
            return true
        }
    }

    return false
}

export default isUserBanned;
