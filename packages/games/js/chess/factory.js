import * as THREE from "three";

const pieceColors = {
  white: 0xffffff,
  black: 0x000000,
};

const pieceGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32);

export function createChessPieces(boardGroup, squareSize = 3) {
  const pieces = new THREE.Group();

  // Pawns
  for (let i = 0; i < 8; i++) {
    const whitePawn = new THREE.Mesh(
      pieceGeometry,
      new THREE.MeshStandardMaterial({ color: pieceColors.white })
    );
    whitePawn.position.set((i - 3.5) * squareSize, 0.6, -2.5 * squareSize);
    pieces.add(whitePawn);

    const blackPawn = new THREE.Mesh(
      pieceGeometry,
      new THREE.MeshStandardMaterial({ color: pieceColors.black })
    );
    blackPawn.position.set((i - 3.5) * squareSize, 0.6, 2.5 * squareSize);
    pieces.add(blackPawn);
  }

  // Rooks, Knights, Bishops, Queen, King
  const backRow = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];

  backRow.forEach((type, i) => {
    const whitePiece = new THREE.Mesh(
      pieceGeometry,
      new THREE.MeshStandardMaterial({ color: pieceColors.white })
    );
    whitePiece.position.set((i - 3.5) * squareSize, 0.6, -3.5 * squareSize);
    pieces.add(whitePiece);

    const blackPiece = new THREE.Mesh(
      pieceGeometry,
      new THREE.MeshStandardMaterial({ color: pieceColors.black })
    );
    blackPiece.position.set((i - 3.5) * squareSize, 0.6, 3.5 * squareSize);
    pieces.add(blackPiece);
  });

  boardGroup.add(pieces);
  return pieces;
}
