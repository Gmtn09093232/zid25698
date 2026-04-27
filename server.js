const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const { verifyTelegram } = require("./config/telegram");
const { getRoom } = require("./game/roomManager");
const { generateCard, checkWin } = require("./game/bingoLogic");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static("public"));

/* ---------------- TELEGRAM AUTH ---------------- */
io.on("connection", (socket) => {

  socket.on("telegramAuth", (data) => {
    const valid = verifyTelegram(data, process.env.BOT_TOKEN);

    if (!valid) {
      socket.emit("authError");
      return;
    }

    const user = getUser(data.id);
    socket.user = user;

    socket.emit("authSuccess", user);
  });

  /* ---------------- ROOM JOIN ---------------- */
  socket.on("joinRoom", ({ roomId }) => {
    const room = getRoom(roomId);

    socket.join(roomId);
    socket.roomId = roomId;

    socket.emit("roomData", room);
  });

  /* ---------------- CARD SELECT ---------------- */
  socket.on("selectCard", () => {
    const room = getRoom(socket.roomId);

    const card = generateCard();

    room.players[socket.id] = {
      id: socket.id,
      card,
      marked: Array(25).fill(false)
    };

    socket.emit("card", card);
  });

  /* ---------------- MARK NUMBER ---------------- */
  socket.on("mark", ({ index, number }) => {
    const room = getRoom(socket.roomId);
    const player = room.players[socket.id];

    if (!player) return;

    if (player.card[index] !== number) return;
    player.marked[index] = true;

    io.to(socket.roomId).emit("marked", { socketId: socket.id, index });

    if (checkWin(player.marked)) {
      io.to(socket.roomId).emit("winner", {
        id: socket.id,
        name: socket.user.id
      });

      room.gameActive = false;
    }
  });

});

/* ---------------- GAME LOOP ---------------- */
function startNumberLoop(roomId) {
  const room = getRoom(roomId);

  setInterval(() => {
    if (!room.gameActive) return;

    const num = Math.floor(Math.random() * 75) + 1;

    room.calledNumbers.push(num);

    io.to(roomId).emit("number", num);

  }, 4000);
}

const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
  console.log("Bingo Pro running on", `http://t.me/melkamu1236_bot:${PORT}`);
});