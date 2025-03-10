import { Server } from "socket.io";
import Game from "./model/game.model.js";
import redisClient from "./config/redis.js";

let io;
const rooms = new Map(); // roomName: { players: [{name: Alice, socketId: asdfutw4rnba3rq37, playingAs: X, playedMoves: [""]}, {name: Bob, socketId: 3q4r7q3r7q3r7q3}, playingAs: 0, playedMoves: [""]], playCount: 0 }
const checkWinner = (playedMoves, playerSymbol) => {
  const winningCombos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const playerMoves = playedMoves
    .map((move, index) => (move === playerSymbol ? index : null))
    .filter((index) => index !== null);

  return winningCombos.some((combo) =>
    combo.every((index) => playerMoves.includes(index))
  );
};

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_DOMAIN, "https://admin.socket.io"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);

    socket.on("joinRoom", async (playerName) => {
      // let game = await Game.findOne({ players: { $size: 1 } });

      let game = await redisClient.get("game:waiting");
      game = JSON.parse(game);

      if (game) {
        game.players.push({
          name: playerName,
          socketId: socket.id,
          playingAs: "0",
          playedMoves: ["", "", "", "", "", "", "", "", ""],
        });
        // game.playCount = 0;
        // await game.save();

        await redisClient.del("game:waiting");
        await redisClient.setex(
          `game:${game.room}`,
          3600,
          JSON.stringify(game)
        );

        socket.join(game.room);
        io.to(game.room).emit("gameStarted", {
          p1: {
            name: game.players[0].name,
            playingAs: game.players[0].playingAs,
            playedMoves: game.players[0].playedMoves,
            socketId: game.players[0].socketId,
          },
          p2: {
            name: game.players[1].name,
            playingAs: game.players[1].playingAs,
            playedMoves: game.players[1].playedMoves,
            socketId: game.players[1].socketId,
          },
          turn:
            Math.floor(Math.random() * 2) === 0
              ? game.players[0].name
              : game.players[1].name,
        });

        console.log("Game started in:", game.room);
        return;
      }
      // }

      const newRoom = `room-${Date.now()}`;
      game = {
        room: newRoom,
        players: [
          {
            name: playerName,
            socketId: socket.id,
            playingAs: "X",
            playedMoves: ["", "", "", "", "", "", "", "", ""],
          },
        ],
        playCount: 0,
      };
      // game.save();
      await redisClient.set("game:waiting", JSON.stringify(game));
      socket.join(newRoom);
      console.log(`${playerName} is waiting in room: ${newRoom}`);
      return;
    });

    socket.on("move", async ({ playerName, cell, socketId }) => {
      // const game = await Game.findOne({ "players.socketId": socketId });
      const allKeys = await redisClient.keys("game:*");
      let game;
      let gameKey;

      for (const key of allKeys) {
        const value = await redisClient.get(key);
        const parsedValue = JSON.parse(value);
        if (parsedValue.players.some((p) => p.socketId === socketId)) {
          game = parsedValue;
          gameKey = key;
          break;
        }
      }

      if (game && gameKey) {
        const player = game.players.find((p) => p.name === playerName);
        const opponent = game.players.find((p) => p.name !== playerName);
        if (player && opponent) {
          const index = parseInt(cell);
          player.playedMoves[index] = player.playingAs;

          io.to(game.room).emit("movePlayed", {
            playerName,
            playingAs: player.playingAs,
            cell,
            playedMoves: player.playedMoves,
            turn: opponent.name,
          });

          const winner = checkWinner(player.playedMoves, player.playingAs);
          if (winner) {
            io.to(game.room).emit("gameOver", playerName);
            Game.create({
              room: game.room,
              players: game.players,
              playCount: game.playCount,
              winner: playerName,
            });
            // await gameStore.save();
            await redisClient.del(gameKey);
            return;
          }

          game.playCount += 1;
          if (game.playCount === 9) {
            io.to(game.room).emit("gameOver", "Draw");

            Game.create({
              room: game.room,
              players: game.players,
              playCount: game.playCount,
              draw: true,
            });
            // await gameStore.save();
            await redisClient.del(gameKey);
            return;
          }

          await redisClient.set(gameKey, JSON.stringify(game));
          // await game.save();
        }
      }
    });

    // Handle user disconnect
    socket.on("disconnect", async () => {
      console.log("🔴 Client disconnected:", socket.id);

      // const game = await Game.findOne({ "players.socketId": socket.id });
      const allKeys = await redisClient.keys("game:*");
      let game;
      let gameKey;

      for (const key of allKeys) {
        const value = await redisClient.get(key);
        const parsedValue = JSON.parse(value);
        if (parsedValue.players.some((p) => p.socketId === socket.id)) {
          game = parsedValue;
          gameKey = key;
          break;
        }
      }

      if (game) {
        const opponent = game.players.find((p) => p.socketId !== socket.id);
        if (opponent) {
          io.to(opponent.socketId).emit("opponentLeft");
        }

        socket.leave(game.room);
        await redisClient.del(gameKey);
      }
    });
  });
};

export { initializeSocket, io };
