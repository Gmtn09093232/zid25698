const { Telegraf } = require('telegraf');

const bot = new Telegraf('8643570547:AAHOjH4GE12-dQ4JPbovs24reJgwVYWaU0o');

// Start command
bot.start((ctx) => {
  ctx.reply('🎮 Welcome to Bingo Game!', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 Open Game',
            web_app: { url: 'https://zid25698.onrender.com' } // your mini app URL
          }
        ]
      ]
    }
  });
});

bot.launch();
console.log("🤖 Bot is running...");