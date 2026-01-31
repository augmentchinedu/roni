import { Rook, Knight, Bishop, Queen, King, Pawn } from "./classes";

export function createBoard(board) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.className =
        (row + col) % 2 === 0 ? "white square" : "black square";
      board.value.appendChild(square);
    }
  }
}
export function createPieces(board) {
  const pieces = {
    0: [
      new Rook("black"),
      new Knight("black"),
      new Bishop("black"),
      new Queen("black"),
      new King("black"),
      new Bishop("black"),
      new Knight("black"),
      new Rook("black"),
    ],
    1: Array(8)
      .fill(null)
      .map(() => new Pawn("black")),
    6: Array(8)
      .fill(null)
      .map(() => new Pawn("white")),
    7: [
      new Rook("white"),
      new Knight("white"),
      new Bishop("white"),
      new Queen("white"),
      new King("white"),
      new Bishop("white"),
      new Knight("white"),
      new Rook("white"),
    ],
  };

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = board.value.children[row * 8 + col];
      const piece = pieces[row]?.[col];

      if (!piece) continue;

      const img = document.createElement("img");
      img.src = piece.img;
      img.className = "piece";
      img.draggable = false;

      square.appendChild(img);
    }
  }
}
