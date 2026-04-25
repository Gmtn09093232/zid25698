const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const BOT_TOKEN = "8643570547:AAHOjH4GE12-dQ4JPbovs24reJgwVYWaU0o"; // replace this

// In-memory DB (replace later)
const users = {};

function verifyTelegramData(initData, botToken) {
  const secret = crypto
    .createHash('sha256')
    .update(botToken)
    .digest();

  const dataCheckString = initData
    .split('&')
    .filter(item => !item.startsWith('hash='))
    .sort()
    .join('\n');

  const hash = crypto
    .createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');

  const receivedHash = initData.match(/hash=([^&]+)/)[1];

  return hash === receivedHash;
}

app.post('/auth', (req, res) => {
  const { telegramId, username, firstName } = req.body;

  if (!telegramId) {
    return res.status(400).json({ error: 'Invalid Telegram data' });
  }

  let user = users[telegramId];

  if (!user) {
    user = {
      telegramId,
      username,
      firstName,
      balance: 0
    };

    users[telegramId] = user;
    console.log("✅ New user created:", user);
  } else {
    console.log("🔁 Existing user:", user);
  }

  res.json(user);
});

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});