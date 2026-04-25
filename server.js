const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const BOT_TOKEN = "8643570547:AAHOjH4GE12-dQ4JPbovs24reJgwVYWaU0o"; // replace this

// In-memory DB (replace later)
const pool = require('./db');

app.post('/auth', async (req, res) => {
  const { telegramId, username, firstName } = req.body;

  try {
    let result = await pool.query(
      "SELECT * FROM users WHERE telegram_id = $1",
      [telegramId]
    );

    let user;

    if (result.rows.length === 0) {
      const insert = await pool.query(
        `INSERT INTO users (telegram_id, username, first_name, balance)
         VALUES ($1, $2, $3, 0)
         RETURNING *`,
        [telegramId, username, firstName]
      );

      user = insert.rows[0];
      console.log("✅ New user saved");
    } else {
      user = result.rows[0];
      console.log("🔁 Existing user loaded");
    }

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});
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