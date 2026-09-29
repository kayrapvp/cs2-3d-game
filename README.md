const socket = io();

const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const startBtn = document.getElementById('startBtn');
const healthEl = document.getElementById('health');
const weaponEl = document.getElementById('weapon');
const ammoEl = document.getElementById('ammo');
const roundEl = document.getElementById('round');
const timerEl = document.getElementById('timer');
const siteEl = document.getElementById('site');
const messageEl = document.getElementById('message');

const state = {
  selectedMap: 'dust2',
  currentSite: 'A',
  roundActive: false,
  timer: 90,
  bombPlanted: false,
  bombSite: null,
  players: {},
  localId: null,
  message: 'Waiting for match',
};

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.8, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7ca5c7);
scene.fog = new THREE.Fog(0x7ca5c7, 10, 90);

const ambient = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(15, 20, 12);
scene.add(sun);

const keys = {};
const mapMeshes = {};
const localPlayer = {
  x: 0,
  y: 1.7,
  z: 12,
  yaw: Math.PI,
  pitch: 0,
  crouch: false,
  sprint: false,
  health: 100,
  site: 'A',
  alive: true,
};

const localBody = new THREE.Group();
const bodyMesh = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.7, 1.6, 8, 12),
  new THREE.MeshStandardMaterial({ color: 0x6ec6ff, roughness: 0.65, metalness: 0.15 })
);
bodyMesh.position.y = 1.2;
localBody.add(bodyMesh);
scene.add(localBody);

function setMessage(msg) {
  state.message = msg;
  messageEl.textContent = msg;
}

function buildMap(mapName) {
  // Clear previous map
  Object.values(mapMeshes).forEach((obj) => scene.remove(obj));
  Object.keys(mapMeshes).forEach((key) => delete mapMeshes[key]);

  const map = {
    dust2: { color: 0x2a4737, siteA: { x: -12, z: -12 }, siteB: { x: 12, z: 12 } },
    mirage: { color: 0x56724a, siteA: { x: -14, z: -10 }, siteB: { x: 14, z: 10 } },
  }[mapName] || {
    color: 0x2a4737, siteA: { x: -12, z: -12 }, siteB: { x: 12, z: 12 },
  };

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(80, 1, 80),
    new THREE.MeshStandardMaterial({ color: map.color, roughness: 0.94, metalness: 0.1 })
  );
  ground.position.y = -0.5;
  scene.add(ground);
  mapMeshes.ground = ground;

  const walls = [
    { x: 0, y: 2.2, z: -20, w: 36, h: 4.5, d: 1.2 },
    { x: 0, y: 2.2, z: 20, w: 36, h: 4.5, d: 1.2 },
    { x: -20, y: 2.2, z: 0, w: 1.2, h: 4.5, d: 36 },
    { x: 20, y: 2.2, z: 0, w: 1.2, h: 4.5, d: 36 },
    { x: -8, y: 2.2, z: 0, w: 1.2, h: 4.5, d: 18 },
    { x: 8, y: 2.2, z: 0, w: 1.2, h: 4.5, d: 18 },
  ];

  walls.forEach((wall) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(wall.w, wall.h, wall.d),
      new THREE.MeshStandardMaterial({ color: 0x425868, roughness: 0.8, metalness: 0.2 })
    );
    mesh.position.set(wall.x, wall.y, wall.z);
    scene.add(mesh);
    mapMeshes[`wall-${wall.x}-${wall.z}`] = mesh;
  });

  const aMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 0.18, 32),
    new THREE.MeshStandardMaterial({ color: 0xff8a00, emissive: 0x5c2d00, emissiveIntensity: 0.5 })
  );
  aMesh.position.set(map.siteA.x, 0.12, map.siteA.z);
  scene.add(aMesh);
  mapMeshes.siteA = aMesh;

  const bMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 0.18, 32),
    new THREE.MeshStandardMaterial({ color: 0x41d6ff, emissive: 0x004c60, emissiveIntensity: 0.5 })
  );
  bMesh.position.set(map.siteB.x, 0.12, map.siteB.z);
  scene.add(bMesh);
  mapMeshes.siteB = bMesh;
}

function updateHud() {
  healthEl.textContent = `${Math.max(0, localPlayer.health)} HP`;
  weaponEl.textContent = 'Deagle';
  ammoEl.textContent = '30 / 90';
  roundEl.textContent = `Round ${state.roundActive ? '1' : '1'}`;
  timerEl.textContent = formatTime(state.timer);
  siteEl.textContent = `Site ${state.currentSite}`;
  messageEl.textContent = state.message;
}

function formatTime(value) {
  const total = Math.max(0, Math.ceil(value));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function setLocalState() {
  camera.position.set(localPlayer.x, localPlayer.y + 0.5, localPlayer.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = localPlayer.yaw;
  camera.rotation.x = localPlayer.pitch;

  localBody.position.set(localPlayer.x, 0, localPlayer.z);
  localBody.rotation.y = localPlayer.yaw;
}

function drawOtherPlayers() {
  const playerIds = Object.keys(state.players);
  const existing = new Set();

  playerIds.forEach((id) => {
    if (id === state.localId) return;
    existing.add(id);

    let group = scene.getObjectByName(`player-${id}`);
    if (!group) {
      group = new THREE.Group();
      group.name = `player-${id}`;

      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.7, 1.7, 8, 12),
        new THREE.MeshStandardMaterial({ color: 0xff5a5a, roughness: 0.82, metalness: 0.15 })
      );
      body.position.y = 1.1;
      group.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.7 })
      );
      head.position.y = 2.3;
      group.add(head);

      scene.add(group);
    }

    const p = state.players[id];
    group.position.set(p.x, 0, p.z);
    group.rotation.y = p.yaw;
    group.visible = p.alive;
  });

  scene.children.forEach((child) => {
    if (child.name && child.name.startsWith('player-') && !existing.has(child.name.replace('player-', ''))) {
      scene.remove(child);
    }
  });
}

function updateLocalMovement(dt) {
  const forward = new THREE.Vector3(Math.sin(localPlayer.yaw), 0, Math.cos(localPlayer.yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();

  let moveX = 0;
  let moveZ = 0;

  if (keys.w) moveZ -= 1;
  if (keys.s) moveZ += 1;
  if (keys.a) moveX -= 1;
  if (keys.d) moveX += 1;

  const moving = moveX !== 0 || moveZ !== 0;
  localPlayer.sprint = !!keys.shift && moving;
  localPlayer.crouch = !!keys.control;

  let speed = localPlayer.crouch ? 4.5 : localPlayer.sprint ? 10.8 : 7.2;
  const vector = new THREE.Vector3();
  vector.addScaledVector(forward, moveZ);
  vector.addScaledVector(right, moveX);

  if (vector.lengthSq() > 0) vector.normalize().multiplyScalar(speed * dt);

  localPlayer.x += vector.x;
  localPlayer.z += vector.z;

  const clampVal = 27;
  localPlayer.x = THREE.MathUtils.clamp(localPlayer.x, -clampVal, clampVal);
  localPlayer.z = THREE.MathUtils.clamp(localPlayer.z, -clampVal, clampVal);

  localPlayer.site = Math.abs(localPlayer.x) > Math.abs(localPlayer.z) ? (localPlayer.x > 0 ? 'B' : 'A') : (localPlayer.z > 0 ? 'B' : 'A');
  setLocalState();
}

function maybePlantBomb() {
  if (!state.roundActive) return;
  const mapConfig = {
    dust2: { A: { x: -12, z: -12 }, B: { x: 12, z: 12 } },
    mirage: { A: { x: -14, z: -10 }, B: { x: 14, z: 10 } },
  }[state.selectedMap] || { A: { x: -12, z: -12 }, B: { x: 12, z: 12 } };

  const site = Object.entries(mapConfig).find(([, value]) => {
    const dx = localPlayer.x - value.x;
    const dz = localPlayer.z - value.z;
    return Math.hypot(dx, dz) < 3.3;
  });

  if (site) {
    socket.emit('action:plant');
    setMessage(`Planting at Site ${site[0]}`);
  }
}

function fireWeapon() {
  if (!state.roundActive) return;
  setMessage('Shot fired');
}

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (event.key === 'e' || event.key === 'E') {
    maybePlantBomb();
  }

  if (event.key === ' ') {
    event.preventDefault();
    setMessage('Bhop jump');
  }
});

document.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

document.addEventListener('mousedown', () => {
  if (document.pointerLockElement !== document.body) {
    document.body.requestPointerLock();
    return;
  }
  fireWeapon();
});

document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement !== document.body) return;
  localPlayer.yaw -= event.movementX * 0.0019;
  localPlayer.pitch -= event.movementY * 0.0014;
  localPlayer.pitch = THREE.MathUtils.clamp(localPlayer.pitch, -1.45, 1.45);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const mapButtons = document.querySelectorAll('.map-btn');
mapButtons.forEach((button) => {
  button.addEventListener('click', () => {
    mapButtons.forEach((el) => el.classList.remove('active'));
    button.classList.add('active');
    state.selectedMap = button.dataset.map;
    socket.emit('map:change', state.selectedMap);
  });
});

startBtn.addEventListener('click', () => {
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  document.body.requestPointerLock();
  socket.emit('startMatch');
  setMessage('Round started');
  state.roundActive = true;
});

socket.on('init', (data) => {
  state.localId = data.id;
  state.selectedMap = data.selectedMap;
  state.roundActive = data.roundActive;
  state.timer = data.timer;
  state.bombPlanted = data.bombPlanted;
  state.bombSite = data.bombSite;
  buildMap(state.selectedMap);
});

socket.on('chat', (data) => {
  if (data && data.message) setMessage(data.message);
});

socket.on('state', (serverState) => {
  state.selectedMap = serverState.selectedMap;
  state.roundActive = serverState.roundActive;
  state.timer = serverState.timer;
  state.bombPlanted = serverState.bombPlanted;
  state.bombSite = serverState.bombSite;
  state.players = {};

  serverState.players.forEach((player) => {
    state.players[player.id] = player;
    if (player.id === state.localId) {
      localPlayer.x = player.x;
      localPlayer.y = player.y;
      localPlayer.z = player.z;
      localPlayer.yaw = player.yaw;
      localPlayer.pitch = player.pitch;
      localPlayer.health = player.health;
      localPlayer.site = player.site;
      localPlayer.alive = player.alive;
      state.currentSite = localPlayer.site;
    }
  });

  if (state.selectedMap !== 'dust2' && state.selectedMap !== 'mirage') {
    state.selectedMap = 'dust2';
  }

  buildMap(state.selectedMap);
  drawOtherPlayers();
  updateHud();
});

let lastSent = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = 1 / 60;

  updateLocalMovement(dt);
  updateHud();

  const now = performance.now();
  if (now - lastSent > 50) {
    socket.emit('player:update', {
      x: localPlayer.x,
      y: localPlayer.y,
      z: localPlayer.z,
      yaw: localPlayer.yaw,
      pitch: localPlayer.pitch,
      health: localPlayer.health,
      crouch: localPlayer.crouch,
      sprint: localPlayer.sprint,
      site: localPlayer.site,
      alive: localPlayer.alive,
    });
    lastSent = now;
  }

  renderer.render(scene, camera);
}

buildMap('dust2');
updateHud();
animate();
