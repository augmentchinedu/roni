export class Piece {
  constructor(color) {
    this.color = color; // "white" | "black"
  }

  get img() {
    return `https://storage.googleapis.com/great-unknown.appspot.com/images/games/chess/${this.color[0]}${this.symbol}.png`;
  }
}
