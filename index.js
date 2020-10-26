const Discord = require("discord.js");
const{prefix, token}=require("./config.json");
const ytdl = require("ytdl-core");
const {google}= require('googleapis');
const {ytToken}=require("./ytconfig.json");
const client = new Discord.Client();
// Login for the bot
client.login(token);
const queue = new Map();
const youtubeService=google.youtube({
    version:'v3',
    auth:'' //ytToken
});

client.once("ready", () => {
    console.log("Ready!");
});

client.once("reconnecting",() => {
    console.log("Reconnecting!")
});

client.once("disconnect", ()=>{
    console.log("Disconnect!");
});

// Listener
client.on('message', async message =>{
    // If the message is from the bot
    try{
        if (message.author.bot) return;
        if (message.content.startsWith(`${prefix};`)) return;
        if (!message.content.startsWith(prefix)) return;
        const serverQueue = queue.get(message.guild.id);
        // Add a song to a queue
        if (message.content.startsWith(`${prefix}play`)){
            await youtubeFinder(message, serverQueue, youtubeService).catch(e => { throw e });
        }// Skip a song
        else if (message.content.startsWith(`${prefix}skip`)){
            skip(message,serverQueue);
        }// Stop the songs
        else if (message.content.startsWith(`${prefix}stop`)){
            stop(message,serverQueue);
        }// Lists the songs
        else if (message.content.startsWith(`${prefix}list`)){
            list(message,serverQueue);
        }
        //Delete the last x messages
        else if (message.content.startsWith(`${prefix}delete`))
        {
            deleteMessage(message);
        }// If the command is wrong
        else{
            message.channel.send("Please check the manual on the github repository!!"+"https://github.com/KianSalehi/musicbot");
        }}
    catch (err){
        throw err;
    }

});
//function to find the url for song searched
 async function youtubeFinder(message, serverQueue, youtubeService){
    const args= message.content.split(" ");
    args.shift();
    await youtubeService.search.list({
        "part": [
            "snippet"
        ],
        "maxResults": 1,
        "q": `${args}`
    })
        .then(function(response) {
                // Handle the results here (response.result has the parsed body).
                const ytVideoId=response.data.items[0].id.videoId
                let youtube_url = `https://www.youtube.com/watch?v=${ytVideoId}`
                console.log("ID:",ytVideoId);
                execute(message,serverQueue,youtube_url);

            },
            function(err) { console.error("Execute error", err); });

}
async function execute (message, serverQueue, youtube_url){
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
            "You need to be in a voice channel to play music!"
        );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT")||!permissions.has("SPEAK")){
        return message.channel.send(
            "I need the permissions to join and speak in your voice channel!"
        );
    }
    console.log(youtube_url)
    const songInfo = await ytdl.getInfo(youtube_url);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
    };
    if (!serverQueue){
        // Creating a new object for the queue
        const queueContruct ={
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection:null,
            songs:[],
            volume:5,
            playing:true
        };
        // Setting up the queue using the new object
        queue.set(message.guild.id, queueContruct);
        // Pushing the song to our songs array
        queueContruct.songs.push(song);
        try{
            // try to join the voicechat and save our connection in the object
            queueContruct.connection = await voiceChannel.join();
            // Calling the play function to start a song
            play(message.guild, queueContruct.songs[0]);
        } catch (err){
            // printing the error message if the bot fails to join the voicechat
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}

function play (guild, song){
    const serverQueue = queue.get(guild.id);
    if (!song){
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }
    const dispatcher = serverQueue.connection
        .play(ytdl(song.url, {quality: 'highestaudio', highWaterMark: 1 << 25 }))
        .on("finish",() =>{
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume/ 5);
    serverQueue.textChannel.send(`Start playing: **${song.title}**`);
}

function skip(message, serverQueue){
    if(!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to skip the music!"
        );
    if (!serverQueue)
        return  message.channel.send("There are no songs in the queue to skip!");
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue){
    if(!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to stop the music")
    if(!serverQueue)
        return message.channel.send("There are no songs in the queue to stop!")
    serverQueue.songs=[];
    serverQueue.connection.dispatcher.end();
}

function list(message, serverQueue){
    if (!serverQueue){
        return message.channel.send("There are no songs in the queue to list.");
    }
    else{
        for(let i=0;i<serverQueue.songs.length;i++)
            message.channel.send((i)+" - "+serverQueue.songs[i].title+"\n")
    }
}

function deleteMessage(message){
    const args = message.content.split(" ");
    const textChannel = message.channel;
    const permission=textChannel.permissionsFor(message.client.user);
    if (!permission.has("MANAGE_MESSAGES")){
        message.channel.send("I do not have permission to manage the messages")
    }
    const userName=message.author.username
    const toDelete = parseInt(args[1])+1;
    textChannel.bulkDelete(toDelete);
    message.channel.send(`${userName} Deleted ${toDelete-1} messages!!`);
}