const { REST, Routes } = require('discord.js')
const fs = require('fs')
require('dotenv').config()

main()

async function main()
{
    let commands = []

    directory = fs.readdirSync("./commands/")

    for (fileName of directory)
    {
        commands.push(JSON.parse(fs.readFileSync(`./commands/${fileName}`)))
    }

    console.log("Detected commands:")
    console.log(commands)

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

    try 
    {
        console.log('Started refreshing application (/) commands.')

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })

        console.log('Successfully reloaded application (/) commands.')
    } 
    catch (error) 
    {
        console.error(error)
    }
}