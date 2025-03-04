import { Server } from "socket.io";

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

    socket.on("joinRoom", (playerName) => {
      for (const [room, value] of rooms.entries()) {
        if (value.players.length === 1) {
          value.players.push({
            name: playerName,
            socketId: socket.id,
            playingAs: "0",
            playedMoves: ["", "", "", "", "", "", "", "", ""],
          });
          value.playCount = 0;
          rooms.set(room, value);

          socket.join(room);
          console.log("player array", value.players);
          io.to(room).emit("gameStarted", {
            p1: {
              name: value.players[0].name,
              playingAs: value.players[0].playingAs,
              playedMoves: value.players[0].playedMoves,
            },
            p2: {
              name: value.players[1].name,
              playingAs: value.players[1].playingAs,
              playedMoves: value.players[1].playedMoves,
            },
            turn:
              Math.floor(Math.random() * 2) === 0
                ? value.players[0].name
                : value.players[1].name,
          });

          console.log("Game started in:", room);
          return;
        }
      }

      const newRoom = `room-${rooms.size + 1}`;
      rooms.set(newRoom, {
        players: [
          {
            name: playerName,
            socketId: socket.id,
            playingAs: "X",
            playedMoves: ["", "", "", "", "", "", "", "", ""],
          },
        ],
      });
      socket.join(newRoom);
      console.log(`${playerName} is waiting in room: ${newRoom}`);
      return;
    });

    socket.on("move", async ({ playerName, cell }) => {
      for (const [room, value] of rooms.entries()) {
        const player = value.players.find((p) => p.name === playerName);
        if (player) {
          const opponent = value.players.find((p) => p.name !== playerName);
          if (opponent) {
            const index = parseInt(cell);
            player.playedMoves[index] = player.playingAs;

            // console.log("you", player, "opponent", opponent, "cell", cell);

            io.to(room).emit("movePlayed", {
              playerName,
              playingAs: player.playingAs,
              cell,
              playedMoves: player.playedMoves,
              turn: opponent.name,
            });

            const winner = checkWinner(player.playedMoves, player.playingAs);
            if (winner) {
              io.to(room).emit("gameOver", playerName);
              rooms.delete(room);
              return;
            }

            value.playCount += 1;
            if (value.playCount === 9) {
              io.to(room).emit("gameOver", "Draw");
              rooms.delete(room);
              return;
            }
          }
        }
      }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);

      for (const [room, value] of rooms.entries()) {
        if (value.players.some((p) => p.socketId === socket.id)) {
          const opponent = value.players.find((p) => p.socketId !== socket.id);
          if (opponent) {
            io.to(opponent.socketId).emit("opponentLeft");
          }

          rooms.delete(room);
          socket.leave(room);
          break;
        }
      }
    });
  });
};

export { initializeSocket, io };
