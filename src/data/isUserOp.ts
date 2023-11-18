import fs from 'fs';

function isUserOp(searchUserId: string)
{
    const currentlyOppedUsers: string[] = JSON.parse(fs.readFileSync('./data/opUsers.json').toString())

    for (const userId of currentlyOppedUsers)
    {
        if (userId == searchUserId)
        {
            return true
        }
    }

    return false
}

export default isUserOp;
