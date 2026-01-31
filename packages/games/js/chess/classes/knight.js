import { Piece } from "./piece";

export class Knight extends Piece {
  constructor(color) {
    super(color);
    this.symbol = "n";
  }
}
