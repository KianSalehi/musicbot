const Discord = require("discord.js");
const {prefix, token} = require("./config.json");
const ytdl = require("ytdl-core");
const {google} = require('googleapis');
const client = new Discord.Client();
// Login for the bot
client.login(token);
const queue = new Map();

// Emojis
const ePlaying = ":fire:  ";
const eNext = ":small_orange_diamond:  ";
const eFoundResult = ":large_orange_diamond:  ";
const eAttention = ":exclamation:  ";
const eAdd = ":pushpin:  "

//Youtube API
const youtubeService = google.youtube({
    version: 'v3',
    auth: '' //ytToken
});

client.once("ready", () => {
    console.log("Ready!");
});

client.once("reconnecting", () => {
    console.log("Reconnecting!")
});

client.once("disconnect", () => {
    console.log("Disconnect!");
});
// Listener to reset the queue if the bot gets disconnected from the voice channel
client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
        if (!newState.member.user.bot) return;
        if (newState.connection == null) {
            await queue.delete(oldState.guild.id);
            return;
        }
        ;
        if (newState.connection.status == 2) return;

    } catch (e) {
        throw e;
    }
    return;
});
// Listener to the messages sent in the servers
client.on('message', async message => {
    // If the message is from the bot
    try {
        if (message.author.bot) return;
        if (message.content.startsWith(`${prefix};`)) return;
        if (!message.content.startsWith(prefix)) return;
        if (message.content.toLowerCase().startsWith(`${prefix}o`) && !message.content.toLowerCase().includes(`${prefix}oplay`)) return;
        const serverQueue = queue.get(message.guild.id);
        // Add a song to a queue
        if (message.content.toLowerCase().startsWith(`${prefix}play`)) {
            await youtubeFinder(message, serverQueue, youtubeService).catch(e => {
                throw e
            });
        }// Option play
        else if (message.content.toLowerCase().startsWith(`${prefix}oplay`)) {
            await optionFinder(message, serverQueue, youtubeService);
        }// Skip a song
        else if (message.content.toLowerCase().startsWith(`${prefix}skip`)) {
            skip(message, serverQueue);
        }// Stop the songs
        else if (message.content.toLowerCase().startsWith(`${prefix}stop`)) {
            stop(message, serverQueue);
        }// Lists the songs
        else if (message.content.toLowerCase().startsWith(`${prefix}list`)) {
            list(message, serverQueue);
        }
        //Delete the last x messages
        else if (message.content.toLowerCase().startsWith(`${prefix}delete`)) {
            deleteMessage(message);
        }
        // Skip a specific item in the list
        else if (message.content.toLowerCase().startsWith(`${prefix}remove`)) {
            cancelSpecificSong(message, serverQueue);
        }
        // If the command is wrong
        else {
            message.channel.send(`${eAttention}` + "Please check the manual on the github repository!!" + "https://github.com/KianSalehi/musicbot");
        }
    } catch (err) {
        throw err;
    }

});

// Function to find the options to play from Youtube
async function optionFinder(message, serverQueue, youtubeService) {
    const args = message.content.split(" ");
    args.shift();
    if (args == "") {
        message.channel.send(`${eAttention}` + "Please enter the url or name of the song and artist.");
        message.channel.send("Check the manual on the github repository!!" + "https://github.com/KianSalehi/musicbot");
        return;
    }
    await youtubeService.search.list({
        "part": [
            "snippet"
        ],
        "maxResults": 5,
        "q": `${args}`
    }).then(function (response) {
        // Handle the results here (response.result has the parsed body).
        let songs = "\n" + `${eFoundResult}` + "Songs Found on Youtube: \n\n"
        for (let i = 0; i < 4; i++) {
            songs = songs + `${eNext}` + ((i + 1) + "- " + response.data.items[i].snippet.title + "\n\n");
        }
        songs = `${eAttention}` + songs + "\nPlease select the song by typing:\n ;o #number";
        message.reply(songs).then(message => {
            message.delete({timeout: 30000})
        }).catch(console.error);
        client.on("message", message1 => {
            try {
                if (message1.author.bot) return;
                const serverQueue1 = queue.get(message.guild.id);
                if (message1.content.startsWith(`${prefix};`)) return;
                if (!message1.content.startsWith(prefix)) return;
                if (message1.content.toLowerCase().startsWith(`${prefix}o`) && !message1.content.toLowerCase().includes(`${prefix}oplay`)) {
                    let args1 = message1.content.split(" ");
                    args1.shift();
                    if (args1 == "") {
                        message1.channel.send(`${eAttention}` + "Please enter the url or name of the song and artist.");
                        message1.channel.send("Check the manual on the github repository!!" + "https://github.com/KianSalehi/musicbot");
                        return;
                    }
                    if (response == null) return;
                    let ytVideoId = response.data.items[(parseInt(args1[0]) - 1)].id.videoId;
                    let videoTitle = response.data.items[(parseInt(args1[0]) - 1)].snippet.title;
                    let youtube_url = `https://www.youtube.com/watch?v=${ytVideoId}`
                    response = null;
                    if (ytVideoId == undefined) return;
                    execute(message1, serverQueue1, youtube_url, videoTitle);
                }

            } catch (e) {
                throw e;
            }
        });

    }, function (err) {
        console.error("Execute error", err);
    });
    return;
}


//function to find the url for song searched
async function youtubeFinder(message, serverQueue, youtubeService) {
    const args = message.content.split(" ");
    args.shift();
    if (args == "") {
        message.channel.send(`${eAttention}` + "Please enter the url or name of the song and artist.");
        message.channel.send("Check the manual on the github repository!!" + "https://github.com/KianSalehi/musicbot");
        return;
    }
    if (args[0].includes("list=")) {
        let playlistId=args[0].split("list=");
        playlistId = playlistId[1];
        await youtubeService.playlistItems.list({
            "part":[
                "snippet"
            ],
            "playlistId":`${playlistId}`,
            "maxResults":10
        }).then(async function (response) {
            // Handle the results here (response.result has the parsed body).
            let collectionOfSongs= response.data.items
            let playListSongsIDs=[];
            let playlistTitles = [];
            for (let i=0;i<collectionOfSongs.length;i++){
                playListSongsIDs.push("https://www.youtube.com/watch?v="+`${collectionOfSongs[i].snippet.resourceId.videoId}`);
                playlistTitles.push(collectionOfSongs[i].snippet.title);
            }
            let serverQueue1 = queue.get(message.guild.id);
            for (let i=0; i<playListSongsIDs.length;i++){
                serverQueue1=await execute(message, serverQueue1, playListSongsIDs[i], playlistTitles[i]);
            }
        },
            function (err) {console.error("Execute error", err);
        });
    } else {
        await youtubeService.search.list({
            "part": [
                "snippet"
            ],
            "maxResults": 1,
            "q": `${args}`
        })
            .then(function (response) {
                    // Handle the results here (response.result has the parsed body).
                    const ytVideoId = response.data.items[0].id.videoId;
                    const videoTitle = response.data.items[0].snippet.title;
                    let youtube_url = `https://www.youtube.com/watch?v=${ytVideoId}`
                    console.log("ID:", ytVideoId);
                    if (ytVideoId == undefined) return;
                    execute(message, serverQueue, youtube_url, videoTitle);

                },
                function (err) {
                    console.error("Execute error", err);
                });
    }

}

async function execute(message, serverQueue, youtube_url, videoTitle) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
            `${eAttention}` + "You need to be in a voice channel to play music!"
        );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
            `${eAttention}` + "I need the permissions to join and speak in your voice channel!"
        );
    }
    console.log(youtube_url)
    const song = {
        title: videoTitle,
        url: youtube_url,
    };
    if (!serverQueue) {
        // Creating a new object for the queue
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };
        // Setting up the queue using the new object
        queue.set(message.guild.id, queueContruct);
        // Pushing the song to our songs array
        queueContruct.songs.push(song);
        try {
            // try to join the voicechat and save our connection in the object
            queueContruct.connection = await voiceChannel.join();
            // Calling the play function to start a song
            play(message.guild, queueContruct.songs[0]);
            return queue.get(message.guild.id);
        } catch (err) {
            // printing the error message if the bot fails to join the voicechat
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        message.channel.send(`${eAdd}` + `${song.title} has been added to the queue!`);
        return queue.get(message.guild.id);
    }
}

// Function to play a song
function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    const dispatcher = serverQueue.connection
        .play(ytdl(song.url, {quality: 'highestaudio', highWaterMark: 1 << 25}))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send(`${ePlaying}Start playing: **${song.title}**`);
}

// Function to skip a song
function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(
            `${eAttention}` + "You have to be in a voice channel to skip the music!"
        );
    if (!serverQueue)
        return message.channel.send(`${eAttention}` + "There are no songs in the queue to skip!");
    serverQueue.connection.dispatcher.end();
}

// Function to stop the bot
function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send(`${eAttention}` + "You have to be in a voice channel to stop the music")
    if (!serverQueue)
        return message.channel.send(`${eAttention}` + "There are no songs in the queue to stop!")
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

//Function to list the songs in queue
function list(message, serverQueue) {
    if (!serverQueue) {
        return message.channel.send(`${eAttention}` + "There are no songs in the queue to list.");
    } else {
        let playList = `${ePlaying} Playing: ` + serverQueue.songs[0].title + "\n";
        for (let i = 1; i < serverQueue.songs.length; i++)
            playList = playList + `${eNext}` + (i) + " - " + serverQueue.songs[i].title + "\n";
        message.channel.send(playList);
    }
}

// Function to delete messages
function deleteMessage(message) {
    const args = message.content.split(" ");
    const textChannel = message.channel;
    const permission = textChannel.permissionsFor(message.client.user);
    if (!permission.has("MANAGE_MESSAGES")) {
        message.channel.send(`${eAttention}` + "I do not have permission to manage the messages")
    }
    const userName = message.author.username
    const toDelete = parseInt(args[1]) + 1;
    textChannel.bulkDelete(toDelete);
    message.channel.send(`${userName} Deleted ${toDelete - 1} messages!!`);
}

// Function to cancel a specific song in the queue
function cancelSpecificSong(message, serverQueue) {
    const args = message.content.split(" ");
    const songToRemove = args [1];
    const textChannel = message.channel;
    if (!message.member.voice.channel) {
        return message.channel.send(`${eAttention}` + "You have to be in a voice channel to stop the music")
    }
    if (!serverQueue)
        return message.channel.send(`${eAttention}` + "There are no songs to remove!")
    else {
        try {
            message.channel.send(`${eAttention}` + "Removed: " + serverQueue.songs[songToRemove].title);
            serverQueue.songs.splice(songToRemove, 1)
        } catch (e) {
            textChannel.send(`${eAttention}` + "Could not remove the song from the list!")
        }
    }
}