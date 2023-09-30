const { REST, Routes } = require('discord.js')
const fs = require('fs')
const createLogger = require('logging')
require('dotenv').config()

const logger = createLogger.default('registerCommands.js')

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
        logger.info('Started refreshing application (/) commands.')

        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })

        logger.info('Successfully reloaded application (/) commands.')
    } 
    catch (error) 
    {
        logger.error(error)
        logger.error(`Full error log can be found at ./logs/COMMAND_REGISTERING_LOG.json`)
        fs.writeFileSync("./logs/COMMAND_REGISTERING_LOG.json", JSON.stringify(error, null, "\t"))
    }
}