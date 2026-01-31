import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createTopDownCamera } from "./camera/topDownCamera";

import { frameCamera } from "./utility";

let scene, camera, renderer, controls;

export async function createGame(gameID, container) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const width = container.clientWidth;
  const height = container.clientHeight;

  /* ---------- CAMERA (LOCKED TOP VIEW) ---------- */
  if (gameID === "chess") {
    camera = createTopDownCamera({
      size: 12,
      positionY: 18,
      aspect: width / height,
    });
  }

  if (gameID === "ludo") {
    camera = createTopDownCamera({
      size: 14,
      positionY: 20,
      aspect: width / height,
    });
  }

  if (gameID === "monopoly") {
    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 30, 22);
    camera.lookAt(0, 0, 0);
  }

  /* ---------- RENDERER ---------- */
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  /* ---------- CONTROLS (LOCKED) ---------- */
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enableZoom = false;

  /* ---------- LIGHTS ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const light = new THREE.DirectionalLight(0xffffff, 0.6);
  light.position.set(30, 50, 30);
  scene.add(light);

  /* ---------- LOAD BOARD ---------- */
  let boardObject;

  // Chess
  if (gameID === "chess") {
    // Import board and pieces dynamically
    const chessModule = await import("./chess/index.js");
    boardObject = chessModule.createChessBoard(scene);

    // Dynamically import pieces
    const piecesModule = await import("./chess/factory.js");
    piecesModule.createChessPieces(boardObject);
  }

  // Ludo
  if (gameID === "ludo") {
    const ludoModule = await import("./ludo/index.js");
    boardObject = ludoModule.createLudoBoard(scene);

    const piecesModule = await import("./ludo/factory.js");
    piecesModule.createLudoPieces(boardObject);
  }

  // Ludo
  if (gameID === "monopoly") {
    const monopolyModule = await import("./monopoly/index.js");
    boardObject = monopolyModule.createMonopolyBoard(scene);
    // const piecesModule = await import("./ludoPieces.js");
    // piecesModule.createLudoPieces(boardObject);
  }

  // Frame camera after board is added
  frameCamera(camera, boardObject);

  /* ---------- RESIZE ---------- */
  const resizeObserver = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;

    if (camera.isOrthographicCamera) {
      const aspect = w / h;
      camera.left = -camera.top * aspect;
      camera.right = camera.top * aspect;
    } else {
      camera.aspect = w / h;
    }

    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  resizeObserver.observe(container);

  /* ---------- LOOP ---------- */
  let animationId; // declare at top

  function animate() {
    animationId = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();

  // return cleanup
  return () => {
    cancelAnimationFrame(animationId);
    renderer.dispose();
    scene.clear();
    container.removeChild(renderer.domElement);
  };
}
