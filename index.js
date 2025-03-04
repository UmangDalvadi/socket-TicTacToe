import { createServer } from "http";
import app from "./src/app.js";
import { initializeSocket } from "./src/socket.js";

const startServer = async () => {
  try {
    const server = createServer(app);

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
