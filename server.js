const express = require('express');
const app = express();
const pool = require('./db');

app.use(express.json());
app.use(express.static(__dirname));

/* =========================
   USER LOGIN (TELEGRAM)
========================= */
app.post('/auth', async (req, res) => {
  const { telegramId, username, firstName } = req.body;

  if (!telegramId) {
    return res.status(400).json({ error: 'Invalid Telegram data' });
  }

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


/* =========================
   BINGO GAME LOGIC
========================= */

// Game state
let players = {};        // { telegramId: { card: [], marked: [] } }
let calledNumbers = [];
let gameRunning = false;

// Generate bingo card (5x5)
function generateCard() {
  let numbers = [];
  while (numbers.length < 25) {
    let n = Math.floor(Math.random() * 75) + 1;
    if (!numbers.includes(n)) numbers.push(n);
  }
  return numbers;
}

// Player joins game
app.post('/join', async (req, res) => {
  const { telegramId } = req.body;

  if (!telegramId) {
    return res.status(400).send("Missing ID");
  }

  if (players[telegramId]) {
    return res.json(players[telegramId]);
  }

  const card = generateCard();

  players[telegramId] = {
    card,
    marked: []
  };

  console.log("🎮 Player joined:", telegramId);

  res.json(players[telegramId]);
});


// Start game
app.post('/start-game', (req, res) => {
  if (gameRunning) return res.send("Game already running");

  gameRunning = true;
  calledNumbers = [];

  console.log("🚀 Game started");

  const interval = setInterval(() => {
    if (!gameRunning) return clearInterval(interval);

    let num;
    do {
      num = Math.floor(Math.random() * 75) + 1;
    } while (calledNumbers.includes(num));

    calledNumbers.push(num);
    console.log("📢 Called:", num);

  }, 4000);

  res.send("Game started");
});


// Mark number
app.post('/mark', (req, res) => {
  const { telegramId, number } = req.body;

  const player = players[telegramId];
  if (!player) return res.send("Player not found");

  if (calledNumbers.includes(number)) {
    if (!player.marked.includes(number)) {
      player.marked.push(number);
    }
  }

  res.json(player);
});


// Check win
function checkWin(marked) {
  if (marked.length < 5) return false;

  // Simple check (you can expand)
  return marked.length >= 5;
}


// Check winner
app.post('/check-win', (req, res) => {
  const { telegramId } = req.body;

  const player = players[telegramId];
  if (!player) return res.send("Player not found");

  if (checkWin(player.marked)) {
    gameRunning = false;

    console.log("🏆 Winner:", telegramId);

    return res.json({ winner: true });
  }

  res.json({ winner: false });
});


/* =========================
   SERVER
========================= */
app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});