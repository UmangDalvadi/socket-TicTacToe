import { createServer } from "http";
import app from "./src/app.js";
import { initializeSocket } from "./src/socket.js";
import connectToDb from "./src/config/db.js";
import redisClient from "./src/config/redis.js";

const startServer = async () => {
  try {
    const server = createServer(app);

    await connectToDb();

    initializeSocket(server);

    server.listen(process.env.PORT, () => {
      console.log(
        "📌 Server is running on port ::::::::::::::::::::::::: ",
        process.env.PORT
      );
    });
  } catch (error) {
    console.error("Error while starting server...: ", error);
    process.exit(1);
  }
};

startServer();
