import * as THREE from "three";
import { Box3, Vector3 } from "three";

export function createChessBoard(scene) {
  const size = 8;
  const squareSize = 3;
  const board = new THREE.Group();

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const geometry = new THREE.BoxGeometry(squareSize, 0.2, squareSize);
      const material = new THREE.MeshStandardMaterial({
        color: (i + j) % 2 === 0 ? 0xffffff : 0x000000,
      });

      const square = new THREE.Mesh(geometry, material);
      square.position.set(
        (i - (size - 1) / 2) * squareSize,
        0,
        (j - (size - 1) / 2) * squareSize
      );

      board.add(square);
    }
  }

  // ✅ CENTER THE BOARD
  const box = new Box3().setFromObject(board);
  const center = new Vector3();
  box.getCenter(center);
  board.position.sub(center);

  scene.add(board);
  return board
}
