// Required node packages
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const search = require('youtube-search');
const 
{
    prefix,
    token,
    youtube
} = require('./config.json');
const options = 
{
    results: 10,
    key: youtube,
    type: 'video'
};

// Initialize The Discord Bot
var bot = new Discord.Client();
var servers = {};

// Log that the bot is turned on and working
bot.on('ready', () =>
{
    console.log('Connected');
    console.log('Logged in, version 1.0.0');
});

bot.login(token);

// Bot Listener Command
bot.on('message', async message =>
{
    // Split the arguments given by the user into two
    let args = message.content.substring(1).split(' ');
    let cmd = args[0];
    let cmd2 = args[1];
    args = args.splice(1);

    if (message.content.startsWith(prefix))
    {
        // Cases For Each And Every Command
        switch(cmd)
        {
            case 'hello':
                message.channel.send('Greetings Human.');
            break;

            case 'help':
                message.member.send('Here is a list of commands that are currently implemented' +
                '\n\n.hello --> Sends a salutation in the channel chat' +
                '\n.help --> Shows a list of all commands' +
                '\n.rng (number) --> Generates a random number between 1 and the specified "number"' +
                '\n.coin --> Flips a coin' +
                '\n.play (url or keyword) --> Searches youtube to find the desired song' +
                '\n.skip --> Skips the current song in queue' +
                '\n.stop --> Stop the bot from playing music' +
                '\n.join --> Makes the bot join the voice channel it is called from' +
                '\n.server list --> Shows list of available regions to host the server' +
                '\n.server (region) --> Changes the server region to the requested region' +
                '\n.tictactoe --> Play tictactoe against a computer!');
            break;

            case 'rng':
                if (!cmd2)
                {
                    message.channel.send('The correct format is rng "number", Ex --> .rng 100 generates a number between 1-100');
                }
                else if (cmd2 && !isNaN(cmd2))
                {
                    message.channel.send(Math.floor((Math.random() * cmd2) + 1));
                }
            break;

            case 'coin':
                if (Math.floor((Math.random() * 2) + 1) == 1)
                {
                    message.channel.send('Heads');
                }
                else
                {
                    message.channel.send('Tails');
                }
            break;

            case 'play':
                // Play function will take a song and put into queue, and then shift the queue awaiting next song
                function play(connection, message)
                {
                    var server = servers[message.guild.id];
                    server.dispatcher = connection.playStream(ytdl(server.queue[0], {filter: "audioonly"}));
                    server.queue.shift();

                    server.dispatcher.on("end", function()
                    {
                        if (server.queue[0])
                        {
                            play(connection, message);
                        }
                        else
                        {
                            connection.disconnect();
                        }
                    });
                }

                if (!cmd2)
                {
                    message.channel.send('The correct format is play "url or keyword", Ex --> .play blinding lights');
                }
                else if (!message.member.voiceChannel)
                {
                    message.channel.send('You must be in a channel to use this command');
                }
                else {
                    // Make the bot join the voice channel
                    if (!servers[message.guild.id]) servers[message.guild.id] = 
                    {
                        queue: []
                    }

                    var server = servers[message.guild.id];
                    server.queue.push(cmd2);

                    // Make the bot play music
                    if (!message.guild.voiceConnection) message.member.voiceChannel.join().then(function(connection)
                    {
                        play(connection, message);
                    })
                }
            break;

            case 'search':
                if (!cmd2)
                {
                    let embed = new Discord.RichEmbed()
                        .setColor("#73ffdc")
                        .setDescription("Enter a search query")
                        .setTitle("Youtube Search")
                    let embedmsg = await message.channel.send(embed);
                }
                //else if (cmd2)
                //{
                    let filter = m => m.author.id === message.author.id;
                    let query = await message.channel.awaitMessages(filter, { max: 1});
                    let searchResults = await search(query.first().content, options).catch(err => console.log(err));
                    if (searchResults)
                    {
                        let i = 0;
                        let youtubeResults = searchResults.results;
                        let searchTitles = youtubeResults.map(result =>
                        {
                            i++;
                            return i + ". " + result.title;
                        });
                        console.log(searchTitles);
                        message.channel.send(
                        {
                            embed:
                            {
                                title: "Select the song by entering the corresponding number",
                                description: searchTitles.join("\n")
                            }
                        }).catch(err => console.log(err));

                        filter = m => (m.author.id === message.author.id) && m.content >= 1 && m.content <= youtubeResults.length && !isNaN(m.content);
                        let searchNum = await message.channel.awaitMessages(filter, { maxMatches: 1});
                        let selected = youtubeResults[searchNum.first().content - 1];
                    }
                //}
            break;

            case 'skip':
                var server = servers[message.guild.id];
                if (server.dispatcher) server.dispatcher.end();
                message.channel.send('Skipping the song');
            break;

            case 'stop':
                var server = servers[message.guild.id];
                if (message.guild.voiceConnection)
                {
                    for (let i = server.queue.length; i < 0; i--)
                    {
                        server.queue.splice(i, 1);
                    }
                    server.dispatcher.end();
                }    

                if (message.guild.connection) message.guild.voiceConnection.disconnect();
            break;

            case 'join':
                message.member.voiceChannel.join();
            break;

           /*  case 'tictactoe':
                function createBoard()
                {
                    message.channel.send(
                        "-->       |   |   \n" +
                        '-->    -------\n' +
                        '-->       |   |   \n' +
                        '-->    -------\n' +
                        "-->       |   |   \n");
                }

                function userInput()
                {
                    message.channel.awaitMessages(message.content.startsWith(prefix), { max: 4, time: 60000, errors: ['time'] });
                }

                message.channel.send('You will be X, I will be O, Here is the board.\n');
                createBoard();
                message.channel.send('To make a move enter the row number then the column number, Ex. 1 2 will go top middle.');
                userInput();
            break; */

            case 'server':
                if (cmd2 == 'list')
                {
                    message.channel.send('The list of possible regions include:\n' +
                    "'amsterdam', 'russia', 'sydney', 'us-south', " + 
                    "'europe', 'us-central', 'singapore', 'south-korea', " +
                    "'brazil', 'us-west', 'india', 'southafrica', 'eu-central', " +
                    "'dubai', 'us-east', 'japan', 'eu-west', 'hongkong', 'frankfurt', 'london'");
                    break;
                }

                if (!cmd2)
                {
                    message.channel.send('The correct format is .server (name of server) --> us-west, us-east, europe etc.');
                }
                else
                {
                    message.guild.setRegion(cmd2);
                    message.channel.send('The region has been changed to '+ message.guild.region);
                }
            break;

            /* case 'fight':
                if (!cmd2)
                {
                    message.channel.send('The correct format is .fight (username) Ex --> .fight SyBot');
                }
                else if (cmd2 == message.mentions.users.first().id)
                {
                    console.log('hello');
                }
            break; */
        }
    }
});

return;
