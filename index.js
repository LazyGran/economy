const Discord   = require('discord.js');
const jsonfile  = require('jsonfile');
const random    = require('random');
const fs        = require('fs');

const prefix    = '.';
const client    = new Discord.Client({partials: ["MESSAGE", "CHANNEL", "REACTION"]});
const token     = jsonfile.readFileSync('token.json');

if(!token) console.log("error")
else       client.login(token)

client.once('ready', () =>
{
    console.log('started')
})

client.on('message', message =>
{
    const args      = message.content.slice(prefix.length).split(/ +/);
    const command   = args.shift().toLowerCase();

    if(message.author.bot)  return;

    //ping command, shows you API & Bot latency 
    if(command === 'ping')
    {
        const botlatency = Date.now() - message.createdTimestamp    //the bots latency
        const apilatency = Math.round(client.ws.ping)   //the discord apis latency
        const embed = new Discord.MessageEmbed()
        .setColor('#a31a1a')
        .setAuthor('Latency')
        .setDescription(
            `Bot latency is ${botlatency}ms \n
             API latency is ${apilatency}ms \n`)
        .setFooter('Made by Gran')

        message.channel.send(embed)
    }
})