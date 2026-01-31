import { Piece } from "./piece";

export class Pawn extends Piece {
  constructor(color) {
    super(color);
    this.symbol = "p";
  }
}
