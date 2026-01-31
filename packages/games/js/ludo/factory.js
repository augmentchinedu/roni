import * as THREE from "three";

export function createLudoPieces(boardGroup, squareSize = 2) {
  const colors = {
    red: 0xff0000,
    blue: 0x0000ff,
    green: 0x00ff00,
    yellow: 0xffff00,
  };

  const radius = 0.6;
  const height = 1;
  const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);

  const pieces = new THREE.Group();

  const positions = {
    red: [
      [-5, -5],
      [-3, -5],
      [-5, -3],
      [-3, -3],
    ],
    blue: [
      [-5, 5],
      [-3, 5],
      [-5, 3],
      [-3, 3],
    ],
    green: [
      [5, -5],
      [3, -5],
      [5, -3],
      [3, -3],
    ],
    yellow: [
      [5, 5],
      [3, 5],
      [5, 3],
      [3, 3],
    ],
  };

  for (const [color, squares] of Object.entries(positions)) {
    squares.forEach(([i, j]) => {
      const piece = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: colors[color] })
      );
      piece.position.set(i * squareSize, height / 2, j * squareSize);
      pieces.add(piece);
    });
  }

  boardGroup.add(pieces);
  return pieces;
}
