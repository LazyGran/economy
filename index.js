const Discord   = require('discord.js');
const jsonfile  = require('jsonfile');
const random    = require('random');
const fs        = require('fs');
const internal = require('stream');
const { isError } = require('util');
const { isTypedArray, isGeneratorFunction } = require('util/types');

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

    //basic things needed for economy
    var stats = {}; 

    if(fs.existsSync('data.json'))  
    {
        stats = jsonfile.readFileSync('data.json')
    }

    if(message.author.id in stats === false) 
    {
        stats[message.author.id] =
        {
            purse: 100,  //base money the user gets on its first message to its purse
            bank: 1500,   //base money the user gets on its first message to its bank
            openinterest: 0, //the interest left for the user
            last_message: 0, //keeps track of the exact timestamp the user sent its last message (IMPORTANT FOR SOME GAMES/FUNCTIONS TO WORK!!!!)
            msgsend: 0  //the total amount of messages a member has send
        }
    }


    
    const userStats = stats[message.author.id];
    currency = "$" //change the thing inside the "" to whatever you want your currency name to be

    //counting the total messages
    userStats.msgsend++

    //adding money per message (very little amount)
    userStats.bank = userStats.bank + 10;
    userStats.last_message = Date.now();

    //for positive interest
    userStats.openinterest++
    if(userStats.openinterest >= 100)
    {
        userStats.openinterest = 0
        console.log(userStats.openinterest)
        togain = userStats.bank
        togain = togain*0.05
        console.log(togain)
        userStats.bank = userStats.bank+togain
        console.log(userStats.bank)
    }
    
    //saving everything
    jsonfile.writeFileSync('data.json', stats);


    //basic commands
    if(command === 'purse')
    {
        const embed = new Discord.MessageEmbed()
        .setColor('#0fb309')
        .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
        .setDescription(
            `You currently have ${userStats.purse}${currency} in your wallet \n`)
        .setFooter('Made by Gran')
        
        message.channel.send(embed)
    }
    if(command === 'bank')
    {
        const embed = new Discord.MessageEmbed()
        .setColor('#086904')
        .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
        .setDescription(
            `You currently have ${userStats.bank}${currency} in your Bank \n`)
        .setFooter('Made by Gran')
        
        message.channel.send(embed)
    }
    if(command === 'withdraw')
    {
        if(args[0])
        {
            const towithdraw = parseInt(args[0], 10);
            if(userStats.bank < towithdraw)
            {
                message.reply(`You can't withdraw more money then you have on your bank account! \n As a reminder, you have ${userStats.bank}${currency} on your bank account.`)
            }
            else
            {
                userStats.bank = userStats.bank - towithdraw
                userStats.purse = userStats.purse + towithdraw

                const embed = new Discord.MessageEmbed()
                .setColor('#086904')
                .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                .setDescription(
                    `You have withdrawn ${towithdraw}${currency} from your bank account \n
                    You now carry ${userStats.purse}${currency} with you and have ${userStats.bank}${currency} left in your bank account`)
                .setFooter('Made by Gran')

                message.channel.send(embed)

                jsonfile.writeFileSync('data.json', stats);
            } 
        }
        else
        {
            message.reply('You need to enter an amount to withdraw!')
        }
    }
    if(command === 'deposit')
    {
        if(args[0])
        {
        const todeposit = parseInt(args[0], 10);
        if(userStats.purse < todeposit)
        {  
            message.reply(`You can't deposit more money then you carry with you! \n As a reminder, you have ${userStats.purse}${currency} in your purse.`)
        }
        else
        {
            userStats.bank = userStats.bank + todeposit
            userStats.purse = userStats.purse - todeposit

            const embed = new Discord.MessageEmbed()
            .setColor('#086904')
            .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
            .setDescription(
                `You have deposited ${todeposit}${currency} to your bank account.\n
                You now carry ${userStats.purse}${currency} with you and have ${userStats.bank}${currency} left in your bank account`)
            .setFooter('Made by Gran')

            message.channel.send(embed)

            jsonfile.writeFileSync('data.json', stats);
        }
        }
        else
        {
            message.reply('You need to enter an amount to deposit!')
        }
    }

    //games
    //street games
    //coinflip
    if(command === 'coinflip')
    {
        if(args[0])
        {   
            if(args[0] !== "Heads")
            {
                if(args[0] !== "Tails")
                {
                    message.reply('You need to say wether you are betting on **Heads** or **Tails**!')
                    return;
                }
            }
            if(args[1])
            {
                if(args[1] > userStats.purse)
                {
                    message.reply("You cant bet more money than you carry with you!")
                    return;
                }
                const chosen    = args[0]
                const bet       = parseInt(args[1], 10)
                const drawn_1   = random.int(1,2)

                let drawn_2     = "nothing"
                if(drawn_1 === 1)   {drawn_2 = "Heads"}
                if(drawn_1 === 2)   {drawn_2 = "Tails"}

                if(drawn_2 === chosen)
                {
                    const won       = bet*2
                    userStats.purse = userStats.purse + won   

                    const embed = new Discord.MessageEmbed()
                    .setColor('#abe805')
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setDescription(
                        `You **won** ${won}${currency}! \n
                        You now carry ${userStats.purse}${currency} with you!`)
                    message.channel.send(embed)

                    jsonfile.writeFileSync('data.json', stats);
                }
                else
                {               
                    const lost          = bet
                    userStats.purse     = userStats.purse - lost  

                    const embed = new Discord.MessageEmbed()
                    .setColor('#abe805')
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setDescription(
                        `You **lost** ${lost}${currency}! \n
                        You now carry ${userStats.purse}${currency} with you!`)
                    message.channel.send(embed)

                    jsonfile.writeFileSync('data.json', stats);
                }
            }else{message.reply('You need to say how much you are betting!')}
        }else{message.reply('You need to say wether you are betting on **Heads** or **Tails**!')}
    }
    //dice role
    if(command === 'dicerole')
    {
        if(args[0])
        {   
            if(args[0] <= 6)
            {
                if(args[0] >= 1)
                {
                    if(args[1])
                    {
                        if(args[1] > userStats.purse)
                        {
                            message.reply("You cant bet more money than you carry with you!")
                            return;
                        }
                        const chosen    = parseInt(args[0], 10)
                        const bet       = parseInt(args[1], 10)
                        const roled     = random.int(1, 6)
                        
                        if(chosen === roled)
                        {
                            const won = bet*6
                            userStats.purse = userStats.purse + won

                            const embed = new Discord.MessageEmbed()
                            .setColor('#abe805')
                            .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                            .setDescription(
                                `You **won** ${won}${currency}! \n
                                You now carry ${userStats.purse}${currency} with you!`)
                            message.channel.send(embed)
        
                            jsonfile.writeFileSync('data.json', stats);
                        }
                        else
                        {
                            lost = bet
                            userStats.purse = userStats.purse - lost

                            const embed = new Discord.MessageEmbed()
                            .setColor('#abe805')
                            .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                            .setDescription(
                                `The diece roled ${roled}, which means you **lost** ${lost}${currency}! \n
                                You now carry ${userStats.purse}${currency} with you!`)
                            message.channel.send(embed)
        
                            jsonfile.writeFileSync('data.json', stats);
                        }
                    } else {message.reply('You need to say how much you are betting!')}
                } else {message.reply("The Number has to be **between 1 and 6, including 1 and 6**!")}
            } else {message.reply("The Number has to be **between 1 and 6, including 1 and 6**!")}
        }
        else
        {
            message.reply('You need to say what number you are betting on! The number can be **between 1 and 6, including 1 and 6**!')
        }
    }
    if(command === 'rps')
    {
        if(args[0])
        {
            if(args[0] !== "Rock")
            {
                if(args[0] !== "Paper")
                {
                    if(args[0] !== "Scissors")
                    {
                        message.reply("You have to tell me wether you are choosing **Rock**, **Paper**, or **Scissors**!")
                        return;
                    }
                }
            }
            if(args[1])
            {
                if(args[1] > userStats.purse)
                {
                    message.reply("You cant bet more money than you carry with you!")
                    return;
                }
                const chosen    = args[0]
                const bet       = parseInt(args[1], 10)
                const drawn_1   = random.int(1,3)

                letdrawn_2   = "nothing"
                if(drawn_1 === 1)   {drawn_2 = "Rock"}
                if(drawn_1 === 2)   {drawn_2 = "Paper"}
                if(drawn_1 === 3)   {drawn_2 = "Scissors"}

                if(chosen === drawn_2)
                {
                    const lost = bet
                    userStats.purse = userStats.purse - lost

                    const embed = new Discord.MessageEmbed()
                    .setColor('#abe805')
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setDescription(
                        `The bot took ${drawn_2}, which means you **lost** ${lost}${currency}! \n
                        You now carry ${userStats.purse}${currency} with you!`)
                    message.channel.send(embed)

                    jsonfile.writeFileSync('data.json', stats);
                    return;
                }

                if(chosen === "Rock")
                {
                    if(drawn_2 === "Paper")
                    {
                        const lost = bet
                        userStats.purse = userStats.purse - lost
    
                        const embed = new Discord.MessageEmbed()
                        .setColor('#abe805')
                        .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                        .setDescription(
                            `The bot took ${drawn_2}, which means you **lost** ${lost}${currency}! \n
                            You now carry ${userStats.purse}${currency} with you!`)
                        message.channel.send(embed)
    
                        jsonfile.writeFileSync('data.json', stats);
                        return;
                    }
                    if(drawn_2 === "Scissors")
                    {
                        const won = bet*3
                        userStats.purse = userStats.purse + won
    
                        const embed = new Discord.MessageEmbed()
                        .setColor('#abe805')
                        .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                        .setDescription(
                            `The bot took ${drawn_2}, which means you **won** ${won}${currency}! \n
                            You now carry ${userStats.purse}${currency} with you!`)
                        message.channel.send(embed)
    
                        jsonfile.writeFileSync('data.json', stats);
                        return;
                    }
                }
                if(chosen === "Paper")
                {
                    if(drawn_2 === "Scissors")
                    {
                        const lost = bet
                        userStats.purse = userStats.purse - lost
    
                        const embed = new Discord.MessageEmbed()
                        .setColor('#abe805')
                        .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                        .setDescription(
                            `The bot took ${drawn_2}, which means you **lost** ${lost}${currency}! \n
                            You now carry ${userStats.purse}${currency} with you!`)
                        message.channel.send(embed)
    
                        jsonfile.writeFileSync('data.json', stats);
                        return;
                    }
                    if(drawn_2 === "Rock")
                    {
                        const won = bet*3
                        userStats.purse = userStats.purse + won
    
                        const embed = new Discord.MessageEmbed()
                        .setColor('#abe805')
                        .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                        .setDescription(
                            `The bot took ${drawn_2}, which means you **won** ${won}${currency}! \n
                            You now carry ${userStats.purse}${currency} with you!`)
                        message.channel.send(embed)
    
                        jsonfile.writeFileSync('data.json', stats);
                        return;
                    }
                }
                if(chosen === "Scissors")
                {
                    if(drawn_2 === "Rock")
                    {
                        const lost = bet
                        userStats.purse = userStats.purse - lost
    
                        const embed = new Discord.MessageEmbed()
                        .setColor('#abe805')
                        .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                        .setDescription(
                            `The bot took ${drawn_2}, which means you **lost** ${lost}${currency}! \n
                            You now carry ${userStats.purse}${currency} with you!`)
                        message.channel.send(embed)
    
                        jsonfile.writeFileSync('data.json', stats);
                        return;
                    }
                }
                if(drawn_2 === "Paper")
                {
                    const won = bet*3
                    userStats.purse = userStats.purse + won

                    const embed = new Discord.MessageEmbed()
                    .setColor('#abe805')
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
                    .setDescription(
                        `The bot took ${drawn_2}, which means you **won** ${won}${currency}! \n
                        You now carry ${userStats.purse}${currency} with you!`)
                    message.channel.send(embed)

                    jsonfile.writeFileSync('data.json', stats);
                    return;
                }
            } else {message.reply('You need to say how much you are betting!')}
        } else {message.reply("You have to tell me wether you are choosing **Rock**, **Paper**, or **Scissors**!")}
    }
})