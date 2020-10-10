const Discord = require("discord.js");
const{prefix,
token}=require("./config.json");
const ytdl = require("ytdl-core");
const client = new Discord.Client();
const queue = new Map();

client.login(token);
client.once("ready", () => {
    console.log("Ready!");
});

client.once("reconnecting",() => {
    console.log("Reconnecting!")
});

client.once("disconnect", ()=>{
    console.log("Disconnect!");
});

client.on('message', async message =>{
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    const serverQueue = queue.get(message.guild.id);
    //Add a song to a queue
    if (message.content.startsWith(`${prefix}play`)){
        execute(message, serverQueue);
        return;
    }// Skip a song
    else if (message.content.startsWith(`${prefix}skip`)){
        skip(message,serverQueue);
        return;
    }//Stop the songs
    else if (message.content.startsWith(`${prefix}stop`)){
        stop(message,serverQueue);
        return;
    }//Lists the songs
    else if (message.content.startsWith(`${prefix}list`)){
        list(message,serverQueue);
        return;
    }//If the command is wrong
    else{
        message.channel.send("YOU DUMB FUCK, READ THE MANUAL STUPID!!");
    }

});
async function execute (message,serverQueue){
    const args= message.content.split(" ");
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
    const songInfo = await ytdl.getInfo(args[1]);
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
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
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
        .play(ytdl(song.url))
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
        return  message.channel.send("There is no song to skip!");
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue){
    if(!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to stop the music")
    serverQueue.songs=[];
    serverQueue.connection.dispatcher.end();
}

function list(message, serverQueue){
    for(i=0;i<serverQueue.songs.length;i++)
        message.channel.send((i)+" - "+serverQueue.songs[i].title+"\n")
    return;
}
