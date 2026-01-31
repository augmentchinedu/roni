import * as THREE from "three";
import { Box3, Vector3 } from "three";

export function createLudoBoard(scene) {
  const size = 15;
  const squareSize = 2;

  const board = new THREE.Group();

  // Loop through the board grid
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      let color = 0xffffff; // default is white

      // Determine base color
      if (i < 6 && j < 6) color = 0xff0000; // red
      else if (i < 6 && j > 8) color = 0x0000ff; // blue
      else if (i > 8 && j < 6) color = 0x00ff00; // green
      else if (i > 8 && j > 8) color = 0xffff00; // yellow

      // Main square (border)
      const geometry = new THREE.BoxGeometry(squareSize, 0.2, squareSize);
      const material = new THREE.MeshStandardMaterial({ color });
      const square = new THREE.Mesh(geometry, material);
      square.position.set(
        (i - (size - 1) / 2) * squareSize,
        0,
        (j - (size - 1) / 2) * squareSize
      );
      board.add(square);

      // If inside a base (top-left, top-right, bottom-left, bottom-right)
      if (
        (i < 6 && j < 6) ||
        (i < 6 && j > 8) ||
        (i > 8 && j < 6) ||
        (i > 8 && j > 8)
      ) {
        const centerGeometry = new THREE.BoxGeometry(squareSize / 2, 0.21, squareSize / 2);
        const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const centerSquare = new THREE.Mesh(centerGeometry, centerMaterial);
        centerSquare.position.set(
          (i - (size - 1) / 2) * squareSize,
          0.01, // slightly above the border to prevent z-fighting
          (j - (size - 1) / 2) * squareSize
        );
        board.add(centerSquare);
      }
    }
  }

  // Center the board
  const box = new Box3().setFromObject(board);
  const center = new Vector3();
  box.getCenter(center);
  board.position.sub(center);

  scene.add(board);
  return board;
}
