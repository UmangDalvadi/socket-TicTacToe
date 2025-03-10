import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
  room: { type: String, required: true, unique: true },
  players: [
    {
      name: { type: String, required: true },
      socketId: { type: String, required: true },
      playingAs: { type: String, required: true },
      playedMoves: {
        type: [String],
        default: ["", "", "", "", "", "", "", "", ""],
      },
    },
  ],
  playCount: { type: Number, default: 0 },
  winner: { type: String, default: "" },
  draw: { type: Boolean, default: false },
});

const Game = mongoose.model("Game", gameSchema);

export default Game;
