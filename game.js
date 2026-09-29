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

const config = {
  map: 'dust2',
  site: 'A',
  playerHealth: 100,
  round: 1,
  roundTime: 90,
  bombTimer: 40,
  walkSpeed: 7,
  sprintSpeed: 10.6,
  crouchSpeed: 4.5,
  gravity: 28,
  jumpStrength: 7.5,
  bulletDamage: 25,
  ammo: { clip: 30, reserve: 90 }
};

const game = {
  started: false,
  bombPlanted: false,
  roundTimer: config.roundTime,
  roundTimeSpan: config.roundTime,
  message: 'Match live',
  currentSite: 'A',
  muted: false,
  siteHint: ''
};

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7ea7c7);
scene.fog = new THREE.Fog(0x7ea7c7, 10, 90);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
const clock = new THREE.Clock();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(14, 22, 10);
scene.add(dirLight);

const mapSize = 80;
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(mapSize, 1, mapSize),
  new THREE.MeshStandardMaterial({ color: 0x2d4337, roughness: 0.95, metalness: 0.08 })
);
floor.position.y = -0.5;
scene.add(floor);

const player = {
  position: new THREE.Vector3(0, 1.75, 14),
  velocity: new THREE.Vector3(),
  yaw: Math.PI,
  pitch: 0,
  radius: 0.7,
  height: 1.75,
  crouchHeight: 1.2,
  onGround: true,
  isCrouching: false,
  health: 100,
  weapon: 'Deagle',
  speedMultiplier: 1
};

const keys = {};
const wallBoxes = [];
const siteMarkers = {};
const effects = [];
const projectiles = [];

function createWall(x, y, z, w, h, d, color = 0x425868) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.2 })
  );
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
  wallBoxes.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2
  });
}

function addSiteMarker(name, x, z, color) {
  const marker = new THREE.Mesh(
    new THREE.CylinderGeometry(1.8, 1.8, 0.18, 28),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2 })
  );
  marker.position.set(x, 0.1, z);
  scene.add(marker);
  siteMarkers[name] = { x, z, mesh: marker };

  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(makeLabelTexture(name)),
      transparent: true,
      depthTest: false
    })
  );
  label.position.set(x, 2.5, z);
  label.scale.set(6.2, 2, 1);
  scene.add(label);
}

function makeLabelTexture(name) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, canvas.width / 2, canvas.height / 2);
  return canvas;
}

function buildMap() {
  const wallData = [
    { x: 0, y: 2.2, z: -20, w: 36, h: 4.4, d: 1.2 },
    { x: 0, y: 2.2, z: 20, w: 36, h: 4.4, d: 1.2 },
    { x: -20, y: 2.2, z: 0, w: 1.2, h: 4.4, d: 36 },
    { x: 20, y: 2.2, z: 0, w: 1.2, h: 4.4, d: 36 },

    { x: -8, y: 2.2, z: 0, w: 1.2, h: 4.4, d: 18 },
    { x: 8, y: 2.2, z: 0, w: 1.2, h: 4.4, d: 18 },

    { x: -12, y: 2.2, z: -9, w: 9, h: 4.4, d: 1.2 },
    { x: 12, y: 2.2, z: 9, w: 9, h: 4.4, d: 1.2 },

    { x: 0, y: 2.2, z: -12, w: 10, h: 4.4, d: 1.2 },
    { x: 0, y: 2.2, z: 12, w: 10, h: 4.4, d: 1.2 }
  ];

  wallData.forEach((data) => createWall(data.x, data.y, data.z, data.w, data.h, data.d));

  addSiteMarker('A', -12, -12, 0xff8a00);
  addSiteMarker('B', 12, 12, 0x41d6ff);

  const bombSite = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.12, 32),
    new THREE.MeshStandardMaterial({ color: 0xff8a00, emissive: 0x663300, emissiveIntensity: 0.5 })
  );
  bombSite.position.set(12, 0.12, 12);
  scene.add(bombSite);
  siteMarkers.bomb = bombSite;
}

function createBot(x, z) {
  const bot = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.7, 1.6, 8, 12),
    new THREE.MeshStandardMaterial({ color: 0xff4d4d, roughness: 0.8, metalness: 0.2 })
  );
  body.position.y = 1.1;
  bot.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: 0.6 })
  );
  head.position.y = 2.3;
  bot.add(head);

  bot.position.set(x, 0, z);
  scene.add(bot);
  return { group: bot, health: 100, path: new THREE.Vector3(x, 0, z), velocity: new THREE.Vector3() };
}

const bot = createBot(-10, 7);

function setMessage(msg) {
  game.message = msg;
  messageEl.textContent = msg;
}

function updateHud() {
  const health = Math.max(0, player.health);
  healthEl.textContent = `${health} HP`;
  weaponEl.textContent = player.weapon;
  ammoEl.textContent = `${config.ammo.clip} / ${config.ammo.reserve}`;
  roundEl.textContent = `Round ${config.round}`;
  timerEl.textContent = formatTime(game.roundTimer);

  const siteName = game.currentSite || config.site;
  siteEl.textContent = `Site ${siteName}`;
  messageEl.textContent = game.message;
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function setGameStarted() {
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  game.started = true;
  document.body.requestPointerLock();
  setMessage('Round live');
}

startBtn.addEventListener('click', setGameStarted);

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (event.key === 'Control') {
    player.isCrouching = true;
  }

  if (event.key === 'e' || event.key === 'E') {
    if (game.started && !game.bombPlanted && isNearSite(game.currentSite)) {
      game.bombPlanted = true;
      setMessage('Bomb planted');
    }
  }

  if (event.key === ' ') {
    event.preventDefault();
    if (player.onGround && game.started) {
      player.velocity.y = config.jumpStrength;
      player.onGround = false;
      setMessage('Bhop jump');
    }
  }
});

document.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  keys[key] = false;

  if (event.key === 'Control') {
    player.isCrouching = false;
  }
});

document.addEventListener('mousedown', () => {
  if (!game.started) return;
  if (document.pointerLockElement !== document.body) {
    document.body.requestPointerLock();
    return;
  }
  fireWeapon();
});

document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement !== document.body || !game.started) return;
  player.yaw -= event.movementX * 0.0019;
  player.pitch -= event.movementY * 0.0013;
  player.pitch = THREE.MathUtils.clamp(player.pitch, -1.45, 1.45);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function getMovementVector() {
  let x = 0;
  let z = 0;

  if (keys['w']) z -= 1;
  if (keys['s']) z += 1;
  if (keys['a']) x -= 1;
  if (keys['d']) x += 1;

  if (x === 0 && z === 0) return new THREE.Vector3();

  const forward = new THREE.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw));
  const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
  const move = new THREE.Vector3();

  move.addScaledVector(forward, z);
  move.addScaledVector(right, x);
  move.normalize();
  return move;
}

function isBlocked(x, z) {
  for (const box of wallBoxes) {
    if (x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ) {
      return true;
    }
  }
  return false;
}

function movePlayer(dt) {
  if (!game.started) return;

  const move = getMovementVector();
  const sprinting = !!keys['shift'];
  const crouching = !!keys['control'] || player.isCrouching;

  const desiredSpeed = crouching
    ? config.crouchSpeed
    : sprinting
      ? config.sprintSpeed
      : config.walkSpeed;

  const targetVelX = move.x * desiredSpeed;
  const targetVelZ = move.z * desiredSpeed;

  player.velocity.x += (targetVelX - player.velocity.x) * Math.min(1, 8 * dt);
  player.velocity.z += (targetVelZ - player.velocity.z) * Math.min(1, 8 * dt);

  if (move.lengthSq() === 0) {
    player.velocity.x *= 0.78;
    player.velocity.z *= 0.78;
  }

  const nextX = player.position.x + player.velocity.x * dt;
  const nextZ = player.position.z + player.velocity.z * dt;

  if (!isBlocked(nextX, player.position.z)) {
    player.position.x = nextX;
  }

  if (!isBlocked(player.position.x, nextZ)) {
    player.position.z = nextZ;
  }

  player.velocity.y -= config.gravity * dt;
  player.position.y += player.velocity.y * dt;

  const groundY = 1.75;
  if (player.position.y <= groundY) {
    player.position.y = groundY;
    player.velocity.y = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  if (crouching) {
    player.height = player.crouchHeight;
  } else {
    player.height = 1.75;
  }

  camera.position.set(player.position.x, player.position.y + 0.1, player.position.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
}

function fireWeapon() {
  if (config.ammo.clip <= 0) {
    setMessage('Reloading');
    config.ammo.clip = 30;
    return;
  }

  config.ammo.clip -= 1;

  const origin = camera.position.clone();
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  const raycaster = new THREE.Raycaster(origin, direction, 0, 60);
  const hit = raycaster.intersectObject(bot.group, true)[0];

  if (hit) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffd88e })
    );
    spark.position.copy(hit.point);
    scene.add(spark);
    effects.push({ mesh: spark, life: 0.12 });
    bot.health -= config.bulletDamage;
    setMessage('Target hit');
  } else {
    setMessage('No hit');
  }

  updateHud();
}

function updateBot(dt) {
  const targetPos = new THREE.Vector3(-10 + Math.sin(performance.now() * 0.0009) * 7, 0, 7 + Math.cos(performance.now() * 0.0013) * 5);
  const delta = targetPos.clone().sub(bot.group.position);
  delta.y = 0;
  if (delta.length() > 0.2) {
    delta.normalize();
    bot.group.position.addScaledVector(delta, dt * 1.8);
  }

  const distance = bot.group.position.distanceTo(player.position);
  if (distance < 3.2) {
    player.health = Math.max(0, player.health - 10 * dt);
    setMessage('Enemy pressure');
  }

  if (bot.health <= 0) {
    bot.group.visible = false;
    setMessage('Enemy down');
  }

  bot.group.rotation.y = Math.atan2(player.position.x - bot.group.position.x, player.position.z - bot.group.position.z);
}

function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].life -= dt;
    if (effects[i].life <= 0) {
      scene.remove(effects[i].mesh);
      effects.splice(i, 1);
    }
  }
}

function isNearSite(site) {
  const target = siteMarkers[site];
  if (!target) return false;
  return Math.hypot(player.position.x - target.x, player.position.z - target.z) < 3.2;
}

function updateSiteState() {
  const siteA = isNearSite('A');
  const siteB = isNearSite('B');
  if (siteA) game.currentSite = 'A';
  else if (siteB) game.currentSite = 'B';
  else game.currentSite = config.site;

  if (game.currentSite === 'A') setMessage('Site A control');
  else if (game.currentSite === 'B') setMessage('Site B control');
}

function updateRound(dt) {
  if (!game.started) return;

  game.roundTimer -= dt;
  if (game.bombPlanted) {
    config.bombTimer -= dt;
    if (config.bombTimer <= 0) {
      setMessage('Explosion!');
      game.bombPlanted = false;
    }
  }

  if (game.roundTimer <= 0) {
    setMessage('Round over');
    game.started = false;
  }

  if (player.health <= 0) {
    setMessage('You were eliminated');
    game.started = false;
  }

  updateHud();
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);

  if (game.started) {
    movePlayer(dt);
    updateBot(dt);
    updateEffects(dt);
    updateSiteState();
    updateRound(dt);
  }

  renderer.render(scene, camera);
}

buildMap();
updateHud();
animate();

const mapButtons = document.querySelectorAll('.map-btn');
mapButtons.forEach((button) => {
  button.addEventListener('click', () => {
    mapButtons.forEach((b) => b.classList.remove('active'));
    button.classList.add('active');
    config.map = button.dataset.map;
  });
});

const siteButtons = document.querySelectorAll('.site-btn');
siteButtons.forEach((button) => {
  button.addEventListener('click', () => {
    siteButtons.forEach((b) => b.classList.remove('active'));
    button.classList.add('active');
    config.site = button.dataset.site;
    game.currentSite = config.site;
  });
});

updateHud();
