const fs = require('fs')

const envFileFormat = `TOKEN=
CLIENT_ID=
UPDATE_CHANNEL_ID=
UPDATE_RATE_SECONDS=
UPDATE_MESSAGE_ID=
FIRST_WEEK_NUM=
ANNOUNCEMENTS_CHANNEL=
LOG_CHANNEL=`

fs.mkdirSync("./botData/", () => {})
fs.mkdirSync("./logSchedules/", () => {})
fs.mkdirSync("./schedules/", () => {})

fs.writeFileSync("./botData/bannedUsers.json", "[]")
fs.writeFileSync("./botData/daysoff.json", "[]")
fs.writeFileSync("./botData/opUsers.json", "[]")

fs.writeFileSync("./.env", envFileFormat)

fs.writeFileSync("./outputlog.txt", "")

console.log("Initialized directories! Please fill the .env file!\n\n")