import * as THREE from "three";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const PEACH = new THREE.Color("#f3d6c5");
const DARK = new THREE.Color("#070513");

function smoothstep(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpVec(out, a, b, t) {
  out.set(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}

function sampleKeys(keys, t, vec, field) {
  if (t <= keys[0].t) {
    vec.set(...keys[0][field]);
    return;
  }
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1];
      const b = keys[i];
      const u = smoothstep(a.t, b.t, t);
      lerpVec(vec, a[field], b[field], u);
      return;
    }
  }
  const last = keys[keys.length - 1];
  vec.set(...last[field]);
}

function sampleScalar(keys, t, field) {
  if (t <= keys[0].t) return keys[0][field];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1];
      const b = keys[i];
      return lerp(a[field], b[field], smoothstep(a.t, b.t, t));
    }
  }
  return keys[keys.length - 1][field];
}

function makeLathe(points, segs = 64) {
  return new THREE.LatheGeometry(points, segs);
}

function bodyPoints() {
  const p = (x, y) => new THREE.Vector2(x, y);
  return [
    p(0.01, 0.0),
    p(3.52, 0.0),
    p(3.68, 0.12),
    p(3.66, 0.52),
    p(3.38, 0.7),
    p(3.5, 1.05),
    p(3.56, 2.6),
    p(3.54, 7.5),
    p(3.46, 13.2),
    p(3.32, 16.0),
    p(3.1, 16.7),
    p(2.55, 17.55),
    p(2.12, 18.2),
    p(1.98, 18.55),
    p(1.94, 19.5),
    p(1.98, 20.15),
    p(2.08, 20.38),
    p(1.82, 20.48),
  ];
}

function capPoints() {
  const p = (x, y) => new THREE.Vector2(x, y);
  return [
    p(0.01, 0.0),
    p(2.12, 0.0),
    p(2.28, 0.08),
    p(2.32, 0.22),
    p(2.34, 1.55),
    p(2.28, 2.15),
    p(2.05, 2.48),
    p(1.55, 2.72),
    p(0.85, 2.86),
    p(0.35, 2.9),
    p(0.01, 2.91),
  ];
}

function innerPoints() {
  const p = (x, y) => new THREE.Vector2(x, y);
  return [
    p(0.01, 1.1),
    p(3.15, 1.1),
    p(3.2, 1.4),
    p(3.22, 7.5),
    p(3.12, 15.6),
    p(2.9, 16.5),
    p(2.05, 17.9),
    p(1.72, 18.5),
    p(1.68, 20.2),
    p(1.7, 20.46),
  ];
}

function makeLogoMaps() {
  const w = 2048;
  const h = 2048;
  const color = document.createElement("canvas");
  color.width = w;
  color.height = h;
  const ctx = color.getContext("2d");
  ctx.fillStyle = "#161618";
  ctx.fillRect(0, 0, w, h);

  const letters = ["V", "E", "L", "U"];
  ctx.fillStyle = "#5a5a62";
  ctx.font = "800 320px Outfit, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const u0 = 0.10 * w;
  const u1 = 0.40 * w;
  const step = (u1 - u0) / (letters.length - 1);
  const vMid = 0.30 * h;
  letters.forEach((ch, i) => {
    ctx.fillText(ch, u0 + step * i, vMid);
  });

  const bump = document.createElement("canvas");
  bump.width = w;
  bump.height = h;
  const bctx = bump.getContext("2d");
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, w, h);
  bctx.fillStyle = "#202024";
  bctx.font = "800 320px Outfit, Arial, sans-serif";
  bctx.textAlign = "center";
  bctx.textBaseline = "middle";
  letters.forEach((ch, i) => {
    bctx.fillText(ch, u0 + step * i, vMid);
  });

  const colorMap = new THREE.CanvasTexture(color);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.anisotropy = 8;
  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.anisotropy = 8;
  return { colorMap, bumpMap };
}

function makePowerTexture() {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, s, s);
  ctx.translate(s / 2, s / 2);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(225, 75, 255, 0.28)";
  ctx.lineWidth = 54;
  ctx.beginPath();
  ctx.arc(0, 10, 148, -Math.PI * 0.68, Math.PI * 1.68, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -170);
  ctx.lineTo(0, 8);
  ctx.stroke();
  ctx.strokeStyle = "#f0a8ff";
  ctx.lineWidth = 36;
  ctx.beginPath();
  ctx.arc(0, 10, 148, -Math.PI * 0.68, Math.PI * 1.68, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -170);
  ctx.lineTo(0, 8);
  ctx.stroke();
  ctx.strokeStyle = "#e14bff";
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.arc(0, 10, 148, -Math.PI * 0.68, Math.PI * 1.68, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -170);
  ctx.lineTo(0, 8);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeSparkleTexture() {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,240,230,0.65)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

function makeShadowTexture() {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
  g.addColorStop(0, "rgba(0,0,0,0.38)");
  g.addColorStop(0.4, "rgba(0,0,0,0.16)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

const CAM_KEYS = [
  { t: 0.0, camPos: [10, 4, 36], camTarget: [5.5, 3, 0], bottlePos: [7.2, -1.2, 0], bottleRot: [0.32, -0.72, 0.1], bottleScale: 1.15, capY: 0, capRot: 0, dark: 0 },
  { t: 0.08, camPos: [8.5, 4.2, 38], camTarget: [4.5, 3.2, 0], bottlePos: [6.2, -1.0, 0], bottleRot: [0.28, -0.58, 0.08], bottleScale: 1.12, capY: 0, capRot: 0, dark: 0 },
  { t: 0.16, camPos: [5, 3.5, 46], camTarget: [2.2, 1.5, 0], bottlePos: [3.4, 0, 0], bottleRot: [0.16, -0.4, 0.04], bottleScale: 1.05, capY: 0, capRot: 0, dark: 0 },
  { t: 0.24, camPos: [0, 1.2, 52], camTarget: [0, 0.4, 0], bottlePos: [0, 0, 0], bottleRot: [0, 0.18, 0], bottleScale: 1.0, capY: 0, capRot: 0, dark: 0 },
  { t: 0.32, camPos: [0, 1.6, 54], camTarget: [0, 1.6, 0], bottlePos: [0, -0.4, 0], bottleRot: [0, 0.22, 0], bottleScale: 0.95, capY: 4.4, capRot: 4.8, dark: 0 },
  { t: 0.4, camPos: [0, 6.2, 34], camTarget: [0, 6.4, 0], bottlePos: [0, -2.4, 0], bottleRot: [0.1, 0.3, 0], bottleScale: 1.0, capY: 5.4, capRot: 5.6, dark: 0 },
  { t: 0.48, camPos: [9.5, 1.2, 12.5], camTarget: [3.2, 0.2, 0], bottlePos: [0, -1.0, 0], bottleRot: [0.15, 0.95, 0], bottleScale: 1.2, capY: 8, capRot: 5.8, dark: 0 },
  { t: 0.56, camPos: [0.2, 26, 14], camTarget: [0, 9, 0], bottlePos: [0, 0, 0], bottleRot: [0, 0.08, 0], bottleScale: 1.0, capY: 18, capRot: 6.0, dark: 0 },
  { t: 0.64, camPos: [0.15, 22, 16], camTarget: [0, 8.5, 0], bottlePos: [0, 0, 0], bottleRot: [0, 0.04, 0], bottleScale: 1.0, capY: 20, capRot: 6.0, dark: 0 },
  { t: 0.72, camPos: [0.4, 16, 22], camTarget: [0, 6.5, 0], bottlePos: [0, 0, 0], bottleRot: [0.05, 0.1, 0], bottleScale: 1.0, capY: 14, capRot: 3.0, dark: 0 },
  { t: 0.78, camPos: [0, 2.0, 54], camTarget: [0, 1.8, 0], bottlePos: [0, 0, 0], bottleRot: [0, 0.2, 0], bottleScale: 0.98, capY: 5.2, capRot: 0.5, dark: 0 },
  { t: 0.88, camPos: [0, 1.8, 54], camTarget: [0, 1.6, 0], bottlePos: [0, 0, 0], bottleRot: [0, 0.24, 0], bottleScale: 0.95, capY: 4.6, capRot: 0.25, dark: 0.9 },
  { t: 0.94, camPos: [0, 6.8, 48], camTarget: [0, 6.6, 0], bottlePos: [0, 6.2, 0], bottleRot: [0, 0.28, 0], bottleScale: 0.72, capY: 3.6, capRot: 0.2, dark: 1 },
  { t: 1.0, camPos: [0, 7.0, 48], camTarget: [0, 6.8, 0], bottlePos: [0, 6.4, 0], bottleRot: [0, 0.32, 0], bottleScale: 0.7, capY: 3.4, capRot: 0.15, dark: 1 },
];

export async function createWorld(canvas) {
  try {
    await document.fonts.load('800 280px "Outfit"');
  } catch (e) {
    /* keep going with fallback fonts */
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  camera.position.set(3.6, 5.4, 11.2);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.85;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xfff2e8, 2.6);
  key.position.set(-8, 14, 10);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xf7e4d6, 1.05);
  fill.position.set(10, 6, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffe8d8, 1.55);
  rim.position.set(-6, 8, -8);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xfff5ee, 0.42));

  const uvLightA = new THREE.PointLight(0xe14bff, 0, 16, 2);
  const uvLightB = new THREE.PointLight(0xb026ff, 0, 12, 2);
  uvLightA.position.set(0, 18.2, 0);
  uvLightB.position.set(0, 16.4, 0);

  const { colorMap, bumpMap } = makeLogoMaps();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0x161618,
    map: colorMap,
    bumpMap,
    bumpScale: 0.14,
    metalness: 0.86,
    roughness: 0.32,
    clearcoat: 0.22,
    clearcoatRoughness: 0.35,
    envMapIntensity: 1.05,
  });
  const capMat = new THREE.MeshPhysicalMaterial({
    color: 0x121214,
    metalness: 0.88,
    roughness: 0.26,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
    envMapIntensity: 1.1,
  });
  const silverMat = new THREE.MeshPhysicalMaterial({
    color: 0xc9c6c1,
    metalness: 1,
    roughness: 0.16,
    envMapIntensity: 1.2,
  });
  const rubberMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d0d0f,
    metalness: 0.15,
    roughness: 0.72,
  });
  const innerMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4efe9,
    metalness: 0.05,
    roughness: 0.46,
    side: THREE.BackSide,
  });

  const bodyGeo = makeLathe(bodyPoints(), 96);
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.y = Math.PI; // keep the lathe seam at the back

  const rubberGeo = makeLathe(
    [new THREE.Vector2(0.01, 0), new THREE.Vector2(3.7, 0), new THREE.Vector2(3.7, 0.58), new THREE.Vector2(3.35, 0.7), new THREE.Vector2(0.01, 0.7)],
    64
  );
  const rubber = new THREE.Mesh(rubberGeo, rubberMat);

  const ringGeo = new THREE.TorusGeometry(1.95, 0.07, 16, 64);
  const ring = new THREE.Mesh(ringGeo, silverMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 20.42;

  const innerGeo = makeLathe(innerPoints(), 64);
  const inner = new THREE.Mesh(innerGeo, innerMat);

  const capGeo = makeLathe(capPoints(), 80);
  capGeo.computeVertexNormals();
  const capMesh = new THREE.Mesh(capGeo, capMat);
  const btnGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.12, 32);
  const btn = new THREE.Mesh(btnGeo, silverMat);
  btn.position.y = 2.94;

  const capUnder = new THREE.Mesh(new THREE.CircleGeometry(2.12, 48), capMat);
  capUnder.rotation.x = Math.PI / 2;
  capUnder.position.y = 0.01;
  const capGroup = new THREE.Group();
  capGroup.add(capMesh, btn, capUnder);
  capGroup.position.y = 20.28;
  const innerFloor = new THREE.Mesh(new THREE.CircleGeometry(3.15, 48), new THREE.MeshPhysicalMaterial({
    color: 0xf4efe9,
    metalness: 0.04,
    roughness: 0.5,
  }));
  innerFloor.rotation.x = -Math.PI / 2;
  innerFloor.position.y = 1.12;

  const ledGeo = new THREE.CapsuleGeometry(0.12, 0.7, 6, 10);
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x2a0838,
    emissive: 0xe14bff,
    emissiveIntensity: 0,
    roughness: 0.3,
    metalness: 0.1,
  });
  const ledL = new THREE.Mesh(ledGeo, ledMat);
  const ledR = new THREE.Mesh(ledGeo, ledMat.clone());
  ledL.position.set(-0.28, 16.6, 0);
  ledR.position.set(0.28, 16.6, 0);

  const bottle = new THREE.Group();
  bottle.add(body, rubber, ring, inner, innerFloor, capGroup, ledL, ledR, uvLightA, uvLightB);
  // Center the bottle around its visual midpoint so rotations feel natural
  const wrap = new THREE.Group();
  bottle.position.y = -12;
  wrap.add(bottle);
  scene.add(wrap);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshBasicMaterial({ map: makeShadowTexture(), transparent: true, depthWrite: false, opacity: 0.85 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -12.05;
  wrap.add(shadow);

  const sparkleTex = makeSparkleTexture();
  const sparkCount = 80;
  const sparkGeo = new THREE.BufferGeometry();
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const y = 4 + Math.random() * 12;
    const r = 3.52 + Math.random() * 0.12;
    sparkPos[i * 3] = Math.cos(a) * r;
    sparkPos[i * 3 + 1] = y;
    sparkPos[i * 3 + 2] = Math.sin(a) * r;
  }
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparkles = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      map: sparkleTex,
      transparent: true,
      depthWrite: false,
      size: 0.28,
      opacity: 0,
      color: 0xfff6ee,
      blending: THREE.AdditiveBlending,
    })
  );
  bottle.add(sparkles);

  const powerTex = makePowerTexture();
  const icons = new THREE.Group();
  const iconMat = new THREE.MeshBasicMaterial({
    map: powerTex,
    transparent: true,
    depthWrite: false,
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const ICON_COUNT = 6;
  for (let i = 0; i < ICON_COUNT; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 2.05), iconMat.clone());
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = 2;
    icons.add(m);
  }
  bottle.add(icons);

  const camTarget = new THREE.Vector3();
  const tmpCam = new THREE.Vector3();
  const tmpPos = new THREE.Vector3();
  const tmpRot = new THREE.Vector3();
  const bgColor = PEACH.clone();

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || Math.max(1, window.innerHeight - 64);
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function apply(t) {
    t = Math.max(0, Math.min(1, t));
    sampleKeys(CAM_KEYS, t, tmpCam, "camPos");
    sampleKeys(CAM_KEYS, t, camTarget, "camTarget");
    sampleKeys(CAM_KEYS, t, tmpPos, "bottlePos");
    sampleKeys(CAM_KEYS, t, tmpRot, "bottleRot");
    let scale = sampleScalar(CAM_KEYS, t, "bottleScale");
    const capY = sampleScalar(CAM_KEYS, t, "capY");
    const capRot = sampleScalar(CAM_KEYS, t, "capRot");
    const dark = sampleScalar(CAM_KEYS, t, "dark");

    camera.position.copy(tmpCam);
    camera.lookAt(camTarget);
    const mobile = (canvas.clientWidth || window.innerWidth) < 720;
    if (mobile) {
      tmpPos.x *= 0.35;
      tmpPos.y -= 1.2;
      scale *= t < 0.5 ? 0.92 : 0.88;
    }
    wrap.position.copy(tmpPos);
    wrap.rotation.set(tmpRot.x, tmpRot.y, tmpRot.z);
    wrap.scale.setScalar(scale);
    capGroup.position.y = 20.28 + capY;
    capGroup.rotation.y = capRot;

    const stageEl = document.getElementById("stage");
    if (stageEl) {
      const peach = [243, 214, 197];
      const darkC = [7, 5, 19];
      const mix = (a, b) => Math.round(lerp(a, b, dark));
      stageEl.style.background = `rgb(${mix(peach[0], darkC[0])}, ${mix(peach[1], darkC[1])}, ${mix(peach[2], darkC[2])})`;
    }
    shadow.material.opacity = lerp(0.85, 0.12, dark);
    key.intensity = lerp(2.6, 0.5, dark);
    fill.intensity = lerp(1.05, 0.18, dark);
    rim.color.set(dark > 0.4 ? 0xb026ff : 0xffe8d8);
    rim.intensity = lerp(1.55, 2.6, dark);

    const sparkOn = smoothstep(0.45, 0.5, t) * (1 - smoothstep(0.54, 0.58, t));
    sparkles.material.opacity = sparkOn * 0.95;
    sparkles.visible = sparkOn > 0.01;

    const iconOn = smoothstep(0.55, 0.6, t) * (1 - smoothstep(0.68, 0.74, t));
    icons.visible = iconOn > 0.01;
    const drop = smoothstep(0.6, 0.74, t);
    for (let i = 0; i < ICON_COUNT; i++) {
      const m = icons.children[i];
      const baseY = 32.5 - i * 2.15 - drop * 14;
      m.position.set(0, baseY, 0);
      const inside = smoothstep(20.6, 16.4, baseY);
      m.material.opacity = iconOn * (1 - inside);
      m.scale.setScalar(lerp(1, 0.32, inside));
    }

    const uvOn = smoothstep(0.7, 0.78, t) * (1 - smoothstep(0.88, 0.96, t)) + smoothstep(0.88, 0.96, t) * 0.85;
    ledMat.emissiveIntensity = uvOn * 4.5;
    ledR.material.emissiveIntensity = uvOn * 4.5;
    uvLightA.intensity = uvOn * 18;
    uvLightB.intensity = uvOn * 10;
    ledL.visible = ledR.visible = uvOn > 0.02;
  }

  function render() {
    renderer.render(scene, camera);
  }

  function dispose() {
    renderer.dispose();
    bodyGeo.dispose();
    capGeo.dispose();
    innerGeo.dispose();
    colorMap.dispose();
    bumpMap.dispose();
    powerTex.dispose();
    sparkleTex.dispose();
  }

  resize();
  apply(0);
  render();

  return { renderer, scene, camera, canvas, resize, apply, render, dispose, wrap };
}
