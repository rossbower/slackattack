import botkit from 'botkit';

console.log('starting bot');

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot
const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

// Adapted from https://github.com/olalonde/node-yelp
const Yelp = require('yelp');
const yelp = new Yelp({
  consumer_key: '1Fskptn9DDWmew3UOg89ZQ',
  consumer_secret: '1wjMAygT7pUjgLCmKdTNBioeXpw',
  token: 'zXYz3GC5KLE5KYqGCMGi-wMjbN5-tCfS',
  token_secret: 'QgOLa4Qk0tlBYcQtO7DtqITtMQ0',
});


// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

// example hello response
controller.hears(['hello', 'hi', 'howdy', 'hey'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});

controller.hears(['silly', 'funny'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'No, you\'re a silly goose!');
});

controller.hears(['love you'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'That\'s sweet... I have committment issues though');
});

// controller.on('user_typing', (bot, message) => {
//   bot.reply(message, 'stop typing!');
// });

controller.on('outgoing_webhook', (bot, message) => {
  bot.replyPublic(message, 'alright, alright I\'m up! kinda...http://gph.is/1aRGKdk');
});


// Used https://github.com/howdyai/botkit/blob/master/slack_bot.js as a template
// to implement a bot using botkit
controller.hears(['hungry', 'starving', 'eat', 'food'], 'direct_message,direct_mention,mention', (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    if (!err) {
      convo.ask('Are you looking for a place to eat?', [
        {
          pattern: bot.utterances.yes,
          callback: (response, convo) => {
            convo.say('Great! Let\'s get started!');
            convo.next();
            convo.ask('What type of food are you interested in?', (food, convo) => {
              convo.ask('Yum! Where are you?', (location, convo) => {
                bot.reply(message, 'Cool! Finding a place for you to eat...');
                convo.next();
                // Adapted from https://github.com/olalonde/node-yelp
                yelp.search({ term: food.text, location: location.text })
                .then((data) => {
                  bot.reply(message, `${data.businesses[0].name}`);
                  bot.reply(message, `Rating: ${data.businesses[0].rating}`);
                  bot.reply(message, `Phone: ${data.businesses[0].display_phone}`);
                  bot.reply(message, {
                    // Adapted from https://api.slack.com/docs/message-attachments
                    attachments: [
                      {
                        pretext: 'For more information, click below for the website',
                        title: `${data.businesses[0].name}`,
                        title_link: `${data.businesses[0].url}`,
                        image_url: `${data.businesses[0].image_url}`,
                      },
                    ],
                  });
                });
                convo.next();
              });
              convo.next();
            });
            convo.next();
          },
        },
        {
          pattern: bot.utterances.no,
          callback: (response, convo) => {
            bot.reply(message, 'Okay, nevermind then.');
            // setTimeout(() => {
            //   process.exit();
            // }, 3000);
            convo.stop();
          },
        },
        {
          default: true,
          callback(response, convo) {
            convo.say('Sorry, I\'m not sure I got that');
            convo.repeat();
            convo.next();
          },
        },
      ]);
    }
  });
});


controller.hears(['bored', 'lonely'], 'direct_message,direct_mention,mention', (bot, message) => {
  bot.startConversation(message, (err, convo) => {
    if (!err) {
      convo.ask('Do you want to chat a bit?', [
        {
          pattern: bot.utterances.yes,
          callback: (response, convo) => {
            convo.say('Okay, I\'d love that!');
            convo.next();
            convo.ask('What did you do today?', (today, convo) => {
              convo.ask('That sounds fun! Do you have plans for the weekend?', (weekend, convo) => {
                convo.say('Have a great time! You\'ll have to tell me how that goes!');
                convo.next();
              });
              convo.next();
            });
            convo.next();
          },
        },
        {
          pattern: bot.utterances.no,
          callback: (response, convo) => {
            bot.reply(message, 'Alright, well I\'m around if you decide you want to!');
            // convo.next();
            // setTimeout(() => {
            //   process.exit();
            // }, 3000);
            convo.stop();
          },
        },
        {
          default: true,
          callback(response, convo) {
            convo.say('Is that a yes?');
            convo.repeat();
            convo.next();
          },
        },
      ]);
    }
  });
});
