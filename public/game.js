* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #04080d;
  color: white;
  font-family: Arial, Helvetica, sans-serif;
}

canvas {
  display: block;
  width: 100vw;
  height: 100vh;
}

.menu {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, rgba(10, 18, 30, 0.68), rgba(3, 6, 12, 0.95));
  z-index: 30;
}

.menu.hidden {
  display: none;
}

.panel {
  width: min(620px, 92vw);
  background: rgba(16, 20, 30, 0.94);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 20px;
  box-shadow: 0 0 30px rgba(0,0,0,0.48);
  padding: 30px 28px 24px;
  text-align: center;
}

h1 {
  margin: 0;
  font-size: clamp(2.1rem, 4vw, 3.8rem);
  letter-spacing: 2px;
  color: #f2f6ff;
}

.subtitle {
  margin: 8px 0 22px;
  color: #c2d3f7;
  letter-spacing: 1px;
}

.row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
}

.row.small {
  margin-bottom: 22px;
}

button {
  appearance: none;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  color: white;
  padding: 12px 18px;
  font-size: 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s ease;
}

button:hover {
  background: rgba(255,255,255,0.12);
}

button.active {
  border-color: rgba(115, 214, 255, 0.85);
  background: rgba(41, 110, 180, 0.4);
  box-shadow: inset 0 0 0 1px rgba(115, 214, 255, 0.35);
}

.primary {
  width: 100%;
  margin-top: 10px;
  background: linear-gradient(135deg, #18a6ff, #245eff);
  border: none;
  font-size: 1.1rem;
  font-weight: 700;
}

.controls {
  list-style: none;
  padding: 0;
  margin: 0 0 10px;
  line-height: 1.8;
  color: #e4ebff;
}

.hud {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 20;
}

.hud.hidden {
  display: none;
}

.health,
.weapon,
.ammo,
.money,
.round,
.timer,
.site,
.message {
  position: absolute;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  padding: 8px 12px;
}

.health {
  left: 26px;
  bottom: 28px;
  font-weight: 700;
  font-size: 1.2rem;
}

.weapon {
  right: 26px;
  bottom: 28px;
  font-weight: 700;
  font-size: 1.1rem;
}

.ammo {
  right: 26px;
  bottom: 78px;
  font-weight: 700;
  font-size: 1.6rem;
}

.money {
  right: 26px;
  bottom: 128px;
  font-weight: 700;
}

.round {
  top: 20px;
  left: 26px;
  font-weight: 700;
}

.timer {
  top: 20px;
  right: 26px;
  font-weight: 700;
  font-size: 1.2rem;
}

.site {
  top: 70px;
  left: 26px;
}

.message {
  left: 50%;
  top: 18px;
  transform: translateX(-50%);
  min-width: 220px;
  text-align: center;
}

.crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22px;
  height: 22px;
  transform: translate(-50%, -50%);
}

.crosshair::before,
.crosshair::after {
  content: "";
  position: absolute;
  background: rgba(255,255,255,0.9);
  border-radius: 2px;
}

.crosshair::before {
  left: 10px;
  top: 0;
  width: 2px;
  height: 22px;
}

.crosshair::after {
  left: 0;
  top: 10px;
  width: 22px;
  height: 2px;
}

.scoreboard {
  position: absolute;
  top: 120px;
  left: 26px;
  width: 220px;
  background: rgba(0,0,0,0.32);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 10px 12px;
}

.score-title {
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
}

.score-list {
  display: grid;
  gap: 6px;
  font-size: 0.9rem;
}

.buy-menu {
  position: absolute;
  right: 20px;
  top: 120px;
  width: 200px;
  background: rgba(0,0,0,0.36);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 10px;
  display: grid;
  gap: 8px;
  pointer-events: auto;
}

.buy-menu.hidden {
  display: none;
}

.buy-heading {
  font-weight: 700;
  text-align: center;
}

.buy-btn {
  width: 100%;
  text-align: left;
}
