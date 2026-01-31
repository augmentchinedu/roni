import * as THREE from "three";

/**
 * Automatically positions camera to frame a 3D object
 * @param {THREE.Camera} camera
 * @param {THREE.Object3D} object
 * @param {number} padding extra space around object
 */

export function frameCamera(camera, object, padding = 1.1) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  if (camera.isPerspectiveCamera) {
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = (camera.fov * Math.PI) / 180;
    let distance = maxDim / (2 * Math.tan(fov / 2));
    distance *= padding;

    camera.position.set(center.x, distance, center.z + distance);
    camera.lookAt(center);
  } else if (camera.isOrthographicCamera) {
    const canvasAspect = window.innerWidth / window.innerHeight; // or pass container width/height
    const boardAspect = size.x / size.z;

    let orthoHeight = (size.z / 2) * padding;
    let orthoWidth = orthoHeight * canvasAspect;

    // If board is wider than container, expand width
    if (boardAspect > canvasAspect) {
      orthoWidth = (size.x / 2) * padding;
      orthoHeight = orthoWidth / canvasAspect;
    }

    camera.left = -orthoWidth;
    camera.right = orthoWidth;
    camera.top = orthoHeight;
    camera.bottom = -orthoHeight;

    camera.position.set(center.x, camera.position.y, center.z);
    camera.lookAt(center);
  }

  camera.updateProjectionMatrix();
}
