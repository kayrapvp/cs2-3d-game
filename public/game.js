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
  background: radial-gradient(circle at center, rgba(12, 18, 28, 0.7), rgba(3, 5, 10, 0.95));
  z-index: 30;
}

.menu.hidden {
  display: none;
}

.panel {
  width: min(560px, 90vw);
  background: rgba(15, 19, 29, 0.92);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 20px;
  box-shadow: 0 0 30px rgba(0,0,0,0.45);
  padding: 28px 26px 22px;
  text-align: center;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.5rem);
  letter-spacing: 2px;
  color: #f4f7ff;
}

.subtitle {
  margin: 8px 0 20px;
  color: #bed0f6;
}

.row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.row.small {
  margin-bottom: 18px;
}

button {
  appearance: none;
  border: 1px solid rgba(255,255,255,0.12);
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
  border-color: rgba(120, 200, 255, 0.8);
  background: rgba(56, 116, 173, 0.4);
  box-shadow: inset 0 0 0 1px rgba(120,200,255,0.35);
}

.primary {
  width: 100%;
  margin-top: 10px;
  background: linear-gradient(135deg, #1ca3ff, #2c5dff);
  border: none;
  font-weight: 700;
  font-size: 1.1rem;
}

.controls {
  list-style: none;
  padding: 0;
  margin: 0 0 8px;
  line-height: 1.8;
  color: #dfeaff;
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

.health {
  position: absolute;
  left: 26px;
  bottom: 28px;
  font-weight: 700;
  font-size: 1.2rem;
  background: rgba(0,0,0,0.35);
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.12);
}

.weapon {
  position: absolute;
  right: 26px;
  bottom: 28px;
  font-weight: 700;
  font-size: 1.1rem;
  background: rgba(0,0,0,0.35);
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.12);
}

.ammo {
  position: absolute;
  right: 26px;
  bottom: 78px;
  font-weight: 700;
  font-size: 1.6rem;
  background: rgba(0,0,0,0.35);
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.12);
}

.round {
  position: absolute;
  top: 20px;
  left: 26px;
  font-weight: 700;
  background: rgba(0,0,0,0.35);
  padding: 8px 12px;
  border-radius: 8px;
}

.timer {
  position: absolute;
  top: 20px;
  right: 26px;
  font-weight: 700;
  font-size: 1.2rem;
  background: rgba(0,0,0,0.35);
  padding: 8px 12px;
  border-radius: 8px;
}

.site {
  position: absolute;
  top: 72px;
  left: 26px;
  background: rgba(0,0,0,0.35);
  padding: 8px 12px;
  border-radius: 8px;
}

.message {
  position: absolute;
  left: 50%;
  top: 18px;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.35);
  padding: 8px 14px;
  border-radius: 8px;
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
