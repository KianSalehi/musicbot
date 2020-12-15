# musicbot

A discord bot made with NodeJS and Javascript to play music in discord servers.

Update: New functionality added:

## Use

Clone the repository and with the use of terminal or command line execute (Make sure to enter your bot key into the config.json file before executing the following codes):
```
npm init
```
and follow the instructions, and then execute:
```
node index.js
```
to start the bot.

## Dependencies

Discord.js,googleapis, ytdl-core, and ffmpeg modules are required to run this bot

## Bot Manual

To play a song, url or name of the youtube video is required:

```
;play url||name
```

To stop the bot:

```
;stop
```

To skip the songs:

```
;skip
```

To list the songs in queue:

```
;list
```

To delete messages in a channel:

```
;delete number
```

To remove a song from the list of songs:

```
;remove *number that the song is listed as*
```
