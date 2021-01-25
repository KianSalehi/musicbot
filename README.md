
# musicbot
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/kiansalehi/musicbot/build)](https://github.com/KianSalehi/musicbot/actions?query=workflow%3Abuild) 
[![GitHub](https://img.shields.io/github/license/kiansalehi/musicbot)](https://github.com/KianSalehi/musicbot/blob/main/LICENSE)

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

To search for a song and get options to choose from:

```
;oplay name

a list of songs will be returned to choose from. Songs are indicated with a number.

;o (number)
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

