const fs = require('fs')

function AddVariableToEnvFile(key, value) {
    let file = fs.readFileSync("./.env").toString()
    let splitter

    if (process.platform == 'win32') //windows separates newlines differently
    {
        splitter = "\r\n"
    }
    else
    {
        splitter = "\n"
    }

    file = file.split(splitter)
  
    //this is written like this and not a .split("=") because some URLs have equals in them for the query string.
    let outputArray = []

    file.forEach((element, index) => {
        equalsIndex = element.indexOf("=")

        before = element.slice(0, equalsIndex)
        after = element.slice(equalsIndex + 1, element.length)

        outputArray.push([ before, after ])
    });

    file = outputArray

    //console.log(file)

    let keyAlreadyExistsAtIndex = -1

    file.forEach((element, index) => {
        if (element[0] == key) {
            keyAlreadyExistsAtIndex = index
        }
    })

    if (keyAlreadyExistsAtIndex != -1) 
    {
        file[keyAlreadyExistsAtIndex][1] = value
        //console.log(`Variable already exists, assigning ${value} to it`)
    }
    else 
    {
        file.push([key, value])
        //console.log(`Variable didn't already exist, assigning ${[key, value]} to it`)
    }

    //console.log(file)

    let writeData = ""

    file.forEach(element => {
        writeData = writeData + `${element[0]}=${element[1]}${splitter}`
    })

    writeData = writeData.substring(0, writeData.length - splitter.length) //remvoes the extra \r\n

    //console.log(writeData)

    fs.writeFileSync("./.env", writeData)
}

module.exports = { AddVariableToEnvFile }