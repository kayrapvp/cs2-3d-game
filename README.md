const socket = io();

const menu = document.getElementById('menu');
const hud = document.getElementById('hud');
const startBtn = document.getElementById('startBtn');
const healthEl = document.getElementById('health');
const weaponEl = document.getElementById('weapon');
const ammoEl = document.getElementById('ammo');
const moneyEl = document.getElementById('money');
const roundEl = document.getElementById('round');
const timerEl = document.getElementById('timer');
const siteEl = document.getElementById('site');
const messageEl = document.getElementById('message');
const scoreListEl = document.getElementById('scoreList');
const buyMenu = document.getElementById('buyMenu');

const WEAPONS = {
  deagle: { label: 'Deagle', mag: 7, reserve: 35, damage: 35, recoil: 0.14, spread: 0.05, fireRate: 0.45, price: 700 },
  usp: { label: 'USP', mag: 12, reserve: 24, damage: 20, recoil: 0.08, spread: 0.04, fireRate: 0.14, price: 200 },
  m4a1: { label: 'M4A1', mag: 30, reserve: 90, damage: 28, recoil: 0.11, spread: 0.06, fireRate: 0.09, price: 2700 },
  ak47: { label: 'AK47', mag: 30, reserve: 90, damage: 34, recoil: 0.14, spread: 0.08, fireRate: 0.1, price: 2700 },
  awp: { label: 'AWP', mag: 5, reserve: 30, damage: 100, recoil: 0.36, spread: 0.01, fireRate: 0.9, price: 4750 },
};

const state = {
  selectedMap: 'dust2',
  currentSite: 'A',
  roundActive: false,
  timer: 90,
  bombPlanted: false,
  bombSite: null,
  players: {},
  scoreboard: [],
  localId: null,
  message: 'Waiting for match',
  mapConfig: null,
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
scene.fog = new THREE.Fog(0x7ca5c7, 10, 95);

const ambient = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(15, 20, 12);
scene.add(sun);

const keys = {};
const mapMeshes = {};
const grenadeObjects = [];
const localEffects = [];
const botTargets = [];

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
  money: 800,
  kills: 0,
  deaths: 0,
  weapon: 'deagle',
  ammo: { clip: 7, reserve: 35 },
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

function getMapConfig(mapName) {
  const mapLookup = {
    dust2: { color: 0x2d4637, siteA: { x: -12, z: -12 }, siteB: { x: 12, z: 12 }, spawn: { x: 0, z: 14 } },
    mirage: { color: 0x4a6f45, siteA: { x: -14, z: -10 }, siteB: { x: 14, z: 10 }, spawn: { x: 0, z: 16 } },
    nuke: { color: 0x7c7e7b, siteA: { x: -10, z: -14 }, siteB: { x: 10, z: 12 }, spawn: { x: 0, z: 18 } },
  };
  return mapLookup[mapName] || mapLookup.dust2;
}

function clearMap() {
  Object.values(mapMeshes).forEach((obj) => scene.remove(obj));
  Object.keys(mapMeshes).forEach((key) => delete mapMeshes[key]);
  botTargets.forEach((bot) => scene.remove(bot.mesh));
  botTargets.length = 0;
}

function createBot(x, z, color = 0xff5555) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.7, 1.6, 8, 12),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.2 })
  );
  body.position.y = 1.1;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 14, 14),
    new THREE.MeshStandardMaterial({ color: 0xe7e7e7, roughness: 0.7 })
  );
  head.position.y = 2.3;
  group.add(head);

  group.position.set(x, 0, z);
  scene.add(group);

  botTargets.push({
    id: `bot-${Math.random().toString(16).slice(2)}`,
    mesh: group,
    x,
    z,
    health: 100,
    alive: true,
    yaw: 0,
  });
}

function buildMap(mapName) {
  clearMap();
  state.mapConfig = getMapConfig(mapName);
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(80, 1, 80),
    new THREE.MeshStandardMaterial({ color: state.mapConfig.color, roughness: 0.95, metalness: 0.1 })
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
    { x: -12, y: 2.2, z: -10, w: 12, h: 4.4, d: 1.1 },
    { x: 12, y: 2.2, z: 10, w: 12, h: 4.4, d: 1.1 },
  ];

  walls.forEach((wall) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(wall.w, wall.h, wall.d),
      new THREE.MeshStandardMaterial({ color: 0x40586b, roughness: 0.82, metalness: 0.18 })
    );
    mesh.position.set(wall.x, wall.y, wall.z);
    scene.add(mesh);
    mapMeshes[`wall-${wall.x}-${wall.z}`] = mesh;
  });

  const aMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 0.18, 32),
    new THREE.MeshStandardMaterial({ color: 0xff8a00, emissive: 0x5e2500, emissiveIntensity: 0.55 })
  );
  aMesh.position.set(state.mapConfig.siteA.x, 0.12, state.mapConfig.siteA.z);
  scene.add(aMesh);
  mapMeshes.siteA = aMesh;

  const bMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 0.18, 32),
    new THREE.MeshStandardMaterial({ color: 0x41d6ff, emissive: 0x004f66, emissiveIntensity: 0.55 })
  );
  bMesh.position.set(state.mapConfig.siteB.x, 0.12, state.mapConfig.siteB.z);
  scene.add(bMesh);
  mapMeshes.siteB = bMesh;

  for (let i = 0; i < 3; i++) {
    createBot(-9 + i * 4, 7 + (i % 2) * 4, i % 2 === 0 ? 0xff4d4d : 0x78b9ff);
  }
}

function formatTime(value) {
  const total = Math.max(0, Math.ceil(value));
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateScoreboard() {
  const rows = state.scoreboard.slice(0, 5);
  if (!rows.length) {
    scoreListEl.innerHTML = '<div>No players yet</div>';
    return;
  }

  scoreListEl.innerHTML = rows
    .map((entry) => `<div>${entry.username || 'Player'}: ${entry.kills || 0} / ${entry.deaths || 0}</div>`)
    .join('');
}

function syncHud() {
  const gun = WEAPONS[localPlayer.weapon] || WEAPONS.deagle;
  healthEl.textContent = `${Math.max(0, localPlayer.health)} HP`;
  weaponEl.textContent = gun.label;
  ammoEl.textContent = `${localPlayer.ammo.clip} / ${localPlayer.ammo.reserve}`;
  moneyEl.textContent = `$${localPlayer.money}`;
  roundEl.textContent = `Round ${state.roundActive ? '1' : '1'}`;
  timerEl.textContent = formatTime(state.timer);
  siteEl.textContent = `Site ${state.currentSite}`;
  messageEl.textContent = state.message;
  updateScoreboard();
}

function setLocalState() {
  camera.position.set(localPlayer.x, localPlayer.y + 0.5, localPlayer.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = localPlayer.yaw;
  camera.rotation.x = localPlayer.pitch;

  localBody.position.set(localPlayer.x, 0, localPlayer.z);
  localBody.rotation.y = localPlayer.yaw;
}

function drawRemotePlayers() {
  const existing = new Set();

  Object.values(state.players).forEach((player) => {
    if (player.id === state.localId) return;
    existing.add(player.id);

    let group = scene.getObjectByName(`player-${player.id}`);
    if (!group) {
      group = new THREE.Group();
      group.name = `player-${player.id}`;

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

    group.position.set(player.x, 0, player.z);
    group.rotation.y = player.yaw;
    group.visible = player.alive;
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

  const clampVal = 28;
  localPlayer.x = THREE.MathUtils.clamp(localPlayer.x, -clampVal, clampVal);
  localPlayer.z = THREE.MathUtils.clamp(localPlayer.z, -clampVal, clampVal);

  const siteGuess = Math.abs(localPlayer.x) > Math.abs(localPlayer.z)
    ? (localPlayer.x > 0 ? 'B' : 'A')
    : (localPlayer.z > 0 ? 'B' : 'A');

  localPlayer.site = siteGuess;
  state.currentSite = localPlayer.site;
  setLocalState();
}

function buyWeapon(weaponName) {
  const gun = WEAPONS[weaponName];
  if (!gun) return;

  if (localPlayer.money >= gun.price) {
    localPlayer.money -= gun.price;
    localPlayer.weapon = weaponName;
    localPlayer.ammo = { clip: gun.mag, reserve: gun.reserve };
    socket.emit('weapon:buy', weaponName);
    setMessage(`${gun.label} equipped`);
  } else {
    setMessage('Not enough money');
  }
}

function switchWeapon(index) {
  const names = ['deagle', 'usp', 'm4a1', 'ak47'];
  const selected = names[index - 1];
  if (selected) {
    localPlayer.weapon = selected;
    const gun = WEAPONS[selected];
    localPlayer.ammo = { clip: gun.mag, reserve: gun.reserve };
    setMessage(`${gun.label} equipped`);
  }
}

function applyRecoil() {
  const gun = WEAPONS[localPlayer.weapon] || WEAPONS.deagle;
  localPlayer.pitch += gun.recoil * 0.7;
  localPlayer.yaw += (Math.random() - 0.5) * gun.spread * 3.2;
}

function fireWeapon() {
  if (!state.roundActive) return;
  const gun = WEAPONS[localPlayer.weapon] || WEAPONS.deagle;
  if (localPlayer.ammo.clip <= 0) {
    setMessage('Reloading...');
    localPlayer.ammo.clip = gun.mag;
    return;
  }

  localPlayer.ammo.clip -= 1;
  applyRecoil();

  const origin = camera.position.clone();
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

  let hitTarget = null;
  let closestDistance = Infinity;

  const candidates = [...botTargets, ...Object.values(state.players).filter((p) => p.id !== state.localId && p.alive)];
  for (const candidate of candidates) {
    const targetPosition = candidate.mesh ? candidate.mesh.position : new THREE.Vector3(candidate.x, candidate.y, candidate.z);
    const toTarget = targetPosition.clone().sub(origin);
    const distance = toTarget.length();
    if (distance < closestDistance) {
      const projected = toTarget.normalize();
      const dot = projected.dot(direction);
      if (dot > 0.98 && distance < 50) {
        closestDistance = distance;
        hitTarget = candidate;
      }
    }
  }

  if (hitTarget) {
    const target = hitTarget.mesh ? hitTarget : null;
    if (target) {
      target.health = Math.max(0, target.health - gun.damage);
      if (target.health <= 0) {
        target.alive = false;
        target.mesh.visible = false;
        localPlayer.kills += 1;
        socket.emit('player:kill', hitTarget.id);
        setMessage('Enemy eliminated');
      } else {
        setMessage('Target hit');
      }
    }
  } else {
    setMessage(`${gun.label} fired`);
  }

  syncHud();
}

function throwGrenade(type) {
  if (!state.roundActive) return;

  const origin = camera.position.clone();
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  const colorMap = { smoke: 0xa5a5a5, flash: 0xf5d76f, molotov: 0xff6a00 };

  const grenade = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 10),
    new THREE.MeshBasicMaterial({ color: colorMap[type] || 0xffffff })
  );

  grenade.position.copy(origin);
  scene.add(grenade);

  grenadeObjects.push({
    mesh: grenade,
    velocity: direction.clone().multiplyScalar(18),
    type,
    life: 1.8,
  });

  socket.emit('grenade:throw', type);
  setMessage(`${type.toUpperCase()} thrown`);
}

function updateGrenades(dt) {
  for (let i = grenadeObjects.length - 1; i >= 0; i--) {
    const item = grenadeObjects[i];
    item.mesh.position.addScaledVector(item.velocity, dt);
    item.velocity.y -= 6 * dt;
    item.life -= dt;

    if (item.life <= 0) {
      const impact = new THREE.Mesh(
        new THREE.SphereGeometry(item.type === 'smoke' ? 1.2 : 1.6, 20, 20),
        new THREE.MeshBasicMaterial({ color: item.type === 'flash' ? 0xffffaa : item.type === 'molotov' ? 0xff7d00 : 0xb7b7b7, transparent: true, opacity: 0.45 })
      );
      impact.position.copy(item.mesh.position);
      scene.add(impact);
      localEffects.push({ mesh: impact, life: 0.7 });
      scene.remove(item.mesh);
      grenadeObjects.splice(i, 1);
    }
  }

  for (let i = localEffects.length - 1; i >= 0; i--) {
    localEffects[i].life -= dt;
    if (localEffects[i].life <= 0) {
      scene.remove(localEffects[i].mesh);
      localEffects.splice(i, 1);
    }
  }
}

function maybePlantBomb() {
  const map = state.mapConfig || getMapConfig(state.selectedMap);
  const candidates = Object.entries({ A: map.siteA, B: map.siteB });
  const site = candidates.find(([, value]) => Math.hypot(localPlayer.x - value.x, localPlayer.z - value.z) < 3.2);

  if (site) {
    state.bombPlanted = true;
    state.currentSite = site[0];
    socket.emit('action:plant');
    setMessage(`Bomb planted at Site ${site[0]}`);
  }
}

function handleInput(key, pressed) {
  keys[key] = pressed;
  if (pressed && (key === 'g' || key === 'f' || key === 'h')) {
    const grenadeType = key === 'g' ? 'smoke' : key === 'f' ? 'flash' : 'molotov';
    throwGrenade(grenadeType);
  }

  if (pressed && key === 'b') {
    buyMenu.classList.toggle('hidden');
  }

  if (pressed && key === 'e') {
    maybePlantBomb();
  }
}

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  handleInput(key, true);

  if (key === ' ') {
    event.preventDefault();
    if (localPlayer.y > 1.7) return;
    setMessage('Bhop jump');
  }

  if (key === '1') switchWeapon(1);
  if (key === '2') switchWeapon(2);
  if (key === '3') switchWeapon(3);
  if (key === '4') switchWeapon(4);

  if (key === 'control') localPlayer.crouch = true;
  if (key === 'shift') localPlayer.sprint = true;
});

document.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  handleInput(key, false);
  if (key === 'control') localPlayer.crouch = false;
  if (key === 'shift') localPlayer.sprint = false;
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
  localPlayer.pitch -= event.movementY * 0.0013;
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
    buildMap(state.selectedMap);
  });
});

const teamButtons = document.querySelectorAll('.team-btn');
teamButtons.forEach((button) => {
  button.addEventListener('click', () => {
    teamButtons.forEach((el) => el.classList.remove('active'));
    button.classList.add('active');
    localPlayer.site = button.dataset.team;
    state.currentSite = button.dataset.team;
  });
});

startBtn.addEventListener('click', () => {
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  document.body.requestPointerLock();
  socket.emit('startMatch');
  state.roundActive = true;
  setMessage('Round live');
});

const buyButtons = document.querySelectorAll('.buy-btn');
buyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const weaponName = button.dataset.weapon;
    buyWeapon(weaponName);
    buyMenu.classList.add('hidden');
  });
});

socket.on('init', (data) => {
  state.localId = data.id;
  state.selectedMap = data.selectedMap;
  state.timer = data.timer;
  state.roundActive = data.roundActive;
  state.bombPlanted = data.bombPlanted;
  state.bombSite = data.bombSite;
  state.scoreboard = data.scoreboard || [];
  buildMap(state.selectedMap);
});

socket.on('chat', (data) => {
  if (data && data.message) setMessage(data.message);
});

socket.on('state', (serverState) => {
  state.players = serverState.players || {};
  state.selectedMap = serverState.selectedMap;
  state.timer = serverState.timer;
  state.roundActive = serverState.roundActive;
  state.bombPlanted = serverState.bombPlanted;
  state.bombSite = serverState.bombSite;
  state.scoreboard = serverState.scoreboard || [];

  const localState = state.players.find((player) => player.id === state.localId);
  if (localState) {
    localPlayer.x = localState.x;
    localPlayer.y = localState.y;
    localPlayer.z = localState.z;
    localPlayer.yaw = localState.yaw;
    localPlayer.pitch = localState.pitch;
    localPlayer.health = localState.health;
    localPlayer.site = localState.site;
    localPlayer.alive = localState.alive;
    localPlayer.money = localState.money;
    localPlayer.weapon = localState.weapon;
    localPlayer.crouch = localState.crouch;
    localPlayer.sprint = localState.sprint;
    state.currentSite = localState.site;
  }

  drawRemotePlayers();
  syncHud();
});

let lastSent = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = 1 / 60;

  updateLocalMovement(dt);
  updateGrenades(dt);
  syncHud();

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
      weapon: localPlayer.weapon,
      money: localPlayer.money,
    });
    lastSent = now;
  }

  renderer.render(scene, camera);
}

buildMap('dust2');
syncHud();
animate();
