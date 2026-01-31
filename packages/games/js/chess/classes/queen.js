import { Piece } from "./piece";

export class Queen extends Piece {
  constructor(color) {
    super(color);
    this.symbol = "q";
  }
}
