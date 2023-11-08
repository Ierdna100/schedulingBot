# Scheduling Bot for all our scheduling needs

`./schedules/` contains all the schedules it updates

empty `.env` file:

```
TOKEN=
CLIENT_ID=
UPDATE_CHANNEL_ID=
UPDATE_RATE_SECONDS=
DEBUG_PORT=

# Leave blank
UPDATE_MESSAGE_ID=
```

## Setup:
1. Run `npm install` to install dependencies for npm
2. Run `npm run install` to generate related files and folders
3. Run `npm run register` to register bot commands
4. Fill in `.env` file
5. Run `npm run run` to run server or use provided shell script

1. Make sure to generate a `schedules` folder in the root if git decides its a good day not to include it
2. Generate a `logSchedules` folder
3. Generate a `outputlog.txt` file
3. Fill in .env file
4. Install node modules with `npm install`
5. Register commands if new bot with `npm run reg`