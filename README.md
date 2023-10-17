# Scheduling Bot for all our scheduling needs

`./schedules/` contains all the schedules it updates

empty `.env` file:

```
TOKEN=
CLIENT_ID=
UPDATE_CHANNEL_ID=
UPDATE_RATE_SECONDS=

# Leave blank
UPDATE_MESSAGE_ID=
```

## Setup:
1. Make sure to generate a `schedules` folder in the root if git decides its a good day not to include it
2. Generate a `logSchedules` folder
3. Generate a `outputlog.txt` file
3. Fill in .env file
4. Install node modules with `npm install`
5. Register commands if new bot with `npm run reg`

Running server:
`npm run run` or `node app.js`

Manual parsing of backed data:
`npm run manual`