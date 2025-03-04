import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
// import session from "express-session";
import rateLimit from "express-rate-limit";
import expressLayouts from "express-ejs-layouts";
import { io } from "./socket.js";

dotenv.config();
const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: false, httpOnly: true, maxAge: 3600000 },
//   })
// );

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "./src/views");
app.use(expressLayouts);
app.set("layout", "./layout.ejs");

app.use(express.static("src/public"));

app.get("/api/user/home", (req, res) => {
  res.render("game/home");
});

// app.get("/api/user/play-ground/:room", (req, res) => {
//   const { room } = req.params;
//   const { you, opponent } = req.query;
//   res.render("game/play", { room, you, opponent });
// });

app.get("/health", (req, res) => {
  res.status(200).json({ status: "Server is UP" });
});

app.get("*", (req, res) => {
  res.send("404 Not Found");
});

export default app;
