# Scheduling Bot for all our scheduling needs

`./schedules/` contains all the schedules it updates

empty `.env` file:

```
TOKEN=
CLIENT_ID=
UPDATE_CHANNEL_ID=

# Leave blank
UPDATE_MESSAGE_ID=
```

## Setup:
1. Make sure to generate a `schedules` folder in the root if git decides its a good day not to include it
2. Fill in .env file
3. Install node modules with `npm install`
4. Register commands if new bot with `npm run reg`

Running server:
`npm run run` or `node app.js`