import { Server } from "socket.io";

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "https://admin.socket.io"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(
      "🟢 New client connected ::::::::::::::::::::::::: ",
      socket.id
    );

    socket.on("disconnect", () => {
      console.log(
        "🔴 Client disconnected :::::::::::::::::::::::::",
        socket.id
      );
    });
  });
};

export default initializeSocket;
