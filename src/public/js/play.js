const socket = io();

document.getElementById("playButton").addEventListener("click", () => {
  const playerName = document.getElementById("playerName").value;

  if (playerName) {
    document.getElementById("status").classList.remove("hidden");
    socket.emit("joinRoom", playerName);
  }
});

document.getElementById("leaveButton").addEventListener("click", () => {
  window.location.reload();
});

socket.on("gameStarted", ({ p1, p2, turn }) => {
  const playerName = document.getElementById("playerName").value;

  document.getElementById("home").classList.add("hidden");
  document.getElementById("play-ground").classList.remove("hidden");

  console.log("p1", p1);
  console.log("p2", p2);
  console.log("playerName", playerName);

  document.getElementById("you").innerText =
    playerName === p1.name ? p1.name : p2.name;
  document.getElementById("playingAs").innerText =
    playerName === p1.name ? p2.playingAs : p1.playingAs;

  document.getElementById("opponent").innerText =
    playerName === p1.name ? p2.name : p1.name;
  document.getElementById("playingAs").innerText =
    playerName === p1.name ? p1.playingAs : p2.playingAs;

  document.getElementById("turn").innerText = turn;
});

socket.on("opponentLeft", () => {
  const res = alert("Opponent left the game");
  window.location.reload();
});

document.querySelectorAll(".cell").forEach((cell) => {
  cell.addEventListener("click", (e) => {
    const playerName = document.getElementById("playerName").value;
    const playingAs = document.getElementById("playingAs").innerText;
    const turn = document.getElementById("turn").innerText;

    if (playerName === turn) {
      if (e.target.innerText === "") {
        e.target.innerText = playingAs;
        e.target.disabled = true;
        socket.emit("move", {
          playerName,
          cell: e.target.id,
        });
      }
    }
  });
});

socket.on(
  "movePlayed",
  ({ playerName, playingAs, cell, turn, playedMoves }) => {
    document.getElementById(cell).innerText = playingAs;
    document.getElementById(cell).disabled = true;
    console.log("playedMoves", playedMoves);
    document.getElementById("turn").innerText = turn;
  }
);

socket.on("gameOver", (playerName) => {
  console.log("Game Over! " + playerName + " won the game");
  if (playerName === "Draw") {
    alert("Game Over! 🎉 It's a Draw 🎉");
  } else {
    alert("Game Over! 🎉 " + playerName + " won the game 🎉");
  }
  window.location.reload();
});
