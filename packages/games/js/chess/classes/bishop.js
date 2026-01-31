import { Piece } from "./piece";

export class Bishop extends Piece {
  constructor(color) {
    super(color);
    this.symbol = "b";
  }
}
