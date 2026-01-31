import { Piece } from "./piece";

export class Rook extends Piece {
  constructor(color) {
    super(color);
    this.symbol = "r";
  }
}
