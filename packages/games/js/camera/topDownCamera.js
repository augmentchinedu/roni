import * as THREE from "three";

export function createTopDownCamera({ size = 10, positionY = 15, aspect = 1 }) {
  const camera = new THREE.OrthographicCamera(
    -size * aspect,
    size * aspect,
    size,
    -size,
    0.1,
    100
  );

  camera.position.set(0, positionY, 0);
  camera.lookAt(0, 0, 0);
  return camera;
}
