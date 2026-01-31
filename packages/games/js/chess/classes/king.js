import { Piece } from "./piece";

export class King extends Piece {
  constructor(color) {
    super(color);
    this.symbol = "k";
  }
}
