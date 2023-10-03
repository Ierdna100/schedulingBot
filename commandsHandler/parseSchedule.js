function ParseScheduleV2(schedule)
{
    schedule = schedule.split('\n')

    let classDays = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
    }

    let newClassState = 0
    let classTitle = ""

    for (element of schedule)
    {
        if (element == undefined) continue

        if (element == " ")
        {
            newClassState = 1
            continue
        }

        if (newClassState == 1)
        {
            classTitle = element.split('\t')[1]
            newClassState = 2
            continue
        }
        else if (newClassState == 2)
        {
            switch(element.substring(0, 3))
            {
                case "Lun":
                    classDays.monday.push(ParseClassElement(classTitle, element))
                    break
                case "Mar":
                    classDays.tuesday.push(ParseClassElement(classTitle, element))
                    break
                case "Mer":
                    classDays.wednesday.push(ParseClassElement(classTitle, element))
                    break
                case "Jeu":
                    classDays.thursday.push(ParseClassElement(classTitle, element))
                    break
                case "Ven":
                    classDays.friday.push(ParseClassElement(classTitle, element))
                    break
            }
        }
    }

    return classDays
}

function ParseClassElement(classTitle, element)
{
    //[ 'Mer', '11:00', '-', '12:30,', 'local', 'B-503;B-502' ]
    element = element.split(" ")

    let startTime = element[1].split(":")
    startTime = parseInt(startTime[0]) + parseFloat(startTime[1]) / 60

    let endTime = element[3].split(":")
    endTime = parseInt(endTime[0]) + parseFloat(endTime[1]) / 60

    let rooms = element[5].split(";")

    return {
        className: classTitle,
        startTime: startTime,
        endTime: endTime,
        rooms: rooms
    }
}

function ParseSchedule(schedule)
{
    let highestClassIndex = 0

    schedule = schedule.split("\n")

    schedule.forEach((element, index) => {
        schedule[index] = element.split("\t")
    })

    // if copied badly and has trailing space
    if (schedule[schedule.length - 1] == '')
        schedule.splice(schedule.length - 1)

    days = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
    }

    daysClass = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
    }

    // Sorts everything by day instead of by time
    for (let i = 1; i < schedule.length; i++) {
        days.monday.push(schedule[i][1])
        days.tuesday.push(schedule[i][2])
        days.wednesday.push(schedule[i][3])
        days.thursday.push(schedule[i][4])
        days.friday.push(schedule[i][5])
    }

    const startTime = 8
    //const endTime = 18
    const timeDivisions = 0.5

    for (day in days) {
        let oldID = 0

        // element = ID of class
        days[day].forEach((element, index) => {
            if (element == undefined)
            {
                element = " "
            }
            // If the element is new
            if (element != oldID)
            {
                // If new and not a space, must be a new class
                if (element != " ")
                {
                    highestClassIndex = Math.max(highestClassIndex, parseInt(element))

                    // Add new class
                    daysClass[day].push({
                        id: parseInt(element),
                        startTime: startTime + index * timeDivisions,
                        endTime: 0
                    })
                }
            }
            // Else if its neither the previous class nor a space, then it is a break, which we do not care about
            else if (element != " ")
            {
                // Sets the endTime
                daysClass[day][daysClass[day].length - 1].endTime = startTime + (index + 1) * timeDivisions
            }
            oldID = element
        })
    }

    return { daysClass: daysClass, numberOfClasses: highestClassIndex}
}

function ParseClasses(rawClasses)
{
    rawClasses = rawClasses.replaceAll("\t", "")
    rawClasses = rawClasses.split("\n")

    let halfParsedClasses = []
    let parsedClasses = []

    let lastLineWasSpaceString = true

    for (line of rawClasses)
    {
        if (line == "" || line == " ")
        {
            lastLineWasSpaceString = true
            continue
        }
        else if (lastLineWasSpaceString)
        {
            halfParsedClasses.push(line)
        }

        lastLineWasSpaceString = false
    }

    halfParsedClasses.forEach((halfParsedClass, i) => {
        indexOfSpace = halfParsedClass.indexOf(" ")

        parsedClasses.push({
            id: parseInt(halfParsedClass.substring(0, indexOfSpace)),
            name: halfParsedClass.substring(indexOfSpace + 2)
        })
    })

    return parsedClasses
}

module.exports = { ParseSchedule, ParseScheduleV2, ParseClasses }