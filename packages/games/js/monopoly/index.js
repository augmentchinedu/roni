import * as THREE from "three";
import { Box3, Vector3 } from "three";

export function createMonopolyBoard(scene) {
  const size = 10;
  const squareSize = 2.5;

  const board = new THREE.Group();

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const isEdge = i === 0 || i === size - 1 || j === 0 || j === size - 1;

      if (!isEdge) continue;

      const geometry = new THREE.BoxGeometry(squareSize, 0.2, squareSize);
      const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const square = new THREE.Mesh(geometry, material);

      square.position.set(
        (i - (size - 1) / 2) * squareSize,
        0,
        (j - (size - 1) / 2) * squareSize
      );

      board.add(square);
    }
  }


const box = new Box3().setFromObject(board);
const center = new Vector3();
box.getCenter(center);

board.position.sub(center);


  scene.add(board); // ✅ scene passed in
  return board
}
