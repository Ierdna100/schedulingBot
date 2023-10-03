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

module.exports = { ParseScheduleV2 }