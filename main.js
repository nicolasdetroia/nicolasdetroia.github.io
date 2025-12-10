// === THREE.JS SCENE (subtle, performant) ===
let scene, camera, renderer, lines = null;
let particleLayers = [];
let heroEls = [];
let elTargets = [];
let mouse = { x: 0, y: 0 }, target = { x: 0, y: 0 };

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#hero-canvas"),
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Hero elements motion
  const hero = document.querySelector(".hero-content");
  if (hero) {
    heroEls = [
      hero.querySelector("h1"),
      hero.querySelector("h2"),
      hero.querySelector("p")
    ].filter(Boolean);

    elTargets = heroEls.map(() => ({ x: 0, y: 0 }));
    heroEls.forEach(el => (el.style.transition = "transform 80ms ease-out"));
  }

  generateParticleLayers();
  generateConnectionLines();

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", onResize);

  // Respect prefers-reduced-motion
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (media.matches) {
    particleLayers.forEach(layer => {
      layer.rotation.x = 0;
      layer.rotation.y = 0;
    });
  }
}

// === PARTICLE GENERATION ===
function generateParticleLayers() {
  const aspect = window.innerWidth / window.innerHeight;
  const spreadX = Math.max(18 * aspect, 18);
  const spreadY = 18;

  const configs = [
    { count: 900, depth: 3, size: 0.006, z: -1.5, opacity: 0.45 },
    { count: 650, depth: 2, size: 0.008, z: 0, opacity: 0.55 },
    { count: 420, depth: 1.6, size: 0.01, z: 1.2, opacity: 0.65 }
  ];

  particleLayers = [];
  configs.forEach(({ count, depth, size, z, opacity }, i) => {
    const layer = createParticleLayer(count, depth, size, spreadX, spreadY, opacity);
    layer.position.z = z;
    layer.userData.speed = 0.00025 * (i + 1);
    scene.add(layer);
    particleLayers.push(layer);
  });
}

function createParticleLayer(count, depth, size, spreadX, spreadY, opacity) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (Math.random() - 0.5) * spreadX;
    positions[i + 1] = (Math.random() - 0.5) * spreadY;
    positions[i + 2] = (Math.random() - 0.5) * depth;

    velocities[i] = (Math.random() - 0.5) * 0.01;
    velocities[i + 1] = (Math.random() - 0.5) * 0.01;
    velocities[i + 2] = (Math.random() - 0.5) * 0.006;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

  const material = new THREE.PointsMaterial({
    size,
    color: "#E9ECF4",
    transparent: true,
    opacity
  });

  return new THREE.Points(geometry, material);
}

// === CONNECTION LINES ===
function generateConnectionLines() {
  if (lines) {
    scene.remove(lines);
    lines.geometry.dispose();
    lines.material.dispose();
  }

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(1800); // cleaner lines
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: "#E9ECF4",
    transparent: true,
    opacity: 0.08
  });

  lines = new THREE.LineSegments(geometry, material);
  scene.add(lines);
}

function updateConnectionLines() {
  if (!lines || !particleLayers.length) return;

  const linePos = lines.geometry.attributes.position.array;
  const particles = particleLayers[1].geometry.attributes.position.array;

  let index = 0;
  const particleCount = particles.length / 3;

  const connectionCount = new Uint8Array(particleCount);
  const maxConnections = 3;

  for (let i = 0; i < particles.length; i += 3) {
    const iIndex = i / 3;
    if (connectionCount[iIndex] >= maxConnections) continue;

    for (let j = i + 3; j < particles.length; j += 3) {
      if (index >= linePos.length - 6) break;

      const jIndex = j / 3;
      if (connectionCount[jIndex] >= maxConnections) continue;

      const dx = particles[j] - particles[i];
      const dy = particles[j + 1] - particles[i + 1];
      const dz = particles[j + 2] - particles[i + 2];

      if (Math.hypot(dx, dy, dz) < 1.5) {
        linePos[index++] = particles[i];
        linePos[index++] = particles[i + 1];
        linePos[index++] = particles[i + 2];

        linePos[index++] = particles[j];
        linePos[index++] = particles[j + 1];
        linePos[index++] = particles[j + 2];

        connectionCount[iIndex]++;
        connectionCount[jIndex]++;

        if (connectionCount[iIndex] >= maxConnections) break;
      }
    }
  }

  // Clear unused segments
  linePos.fill(0, index);
  lines.geometry.attributes.position.needsUpdate = true;
}

// === EVENTS ===
function onMouseMove(e) {
  mouse.x = (e.clientX - window.innerWidth / 2) / 240;
  mouse.y = (e.clientY - window.innerHeight / 2) / 240;

  heroEls.forEach((el, idx) => {
    const xRange = 20 - idx * 5;
    const yRange = 12 - idx * 3;

    elTargets[idx] = {
      x: ((e.clientX / window.innerWidth) - 0.5) * xRange,
      y: ((e.clientY / window.innerHeight) - 0.5) * yRange
    };
  });
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Rebuild particles + lines cleanly
  particleLayers.forEach(layer => {
    scene.remove(layer);
    layer.geometry.dispose();
    layer.material.dispose();
  });

  generateParticleLayers();
  generateConnectionLines();
}

// === ANIMATION LOOP ===
function animate() {
  requestAnimationFrame(animate);

  // Camera smoothing
  target.x = mouse.x * 0.4;
  target.y = mouse.y * 0.4;
  camera.position.x += (target.x - camera.position.x) * 0.035;
  camera.position.y += (target.y - camera.position.y) * 0.035;

  // Hero element float
  heroEls.forEach((el, i) => {
    const t = elTargets[i];
    if (t) el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0)`;
  });

  // Particle movement
  particleLayers.forEach((layer, idx) => {
    const positions = layer.geometry.attributes.position.array;
    const velocities = layer.geometry.attributes.velocity.array;
    const spread = [16, 13, 10][idx];

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i] * 0.65;
      positions[i + 1] += velocities[i + 1] * 0.65;
      positions[i + 2] += velocities[i + 2] * 0.65;

      const s = spread;
      if (positions[i] > s) positions[i] = -s;
      else if (positions[i] < -s) positions[i] = s;

      if (positions[i + 1] > s) positions[i + 1] = -s;
      else if (positions[i + 1] < -s) positions[i + 1] = s;

      if (positions[i + 2] > s) positions[i + 2] = -s;
      else if (positions[i + 2] < -s) positions[i + 2] = s;
    }

    layer.geometry.attributes.position.needsUpdate = true;
    layer.rotation.x += layer.userData.speed;
    layer.rotation.y += layer.userData.speed;
  });

  updateConnectionLines();
  renderer.render(scene, camera);
}

// === Smooth Scroll ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", e => {
    const target = document.querySelector(anchor.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// === Loader ===
window.addEventListener("load", () => {
  const loader = document.querySelector(".loading-screen");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => (loader.style.display = "none"), 450);
  }
});

// === Contact Form ===
const form = document.getElementById("contactForm");
if (form) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = new FormData(form);

    fetch(form.action, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" }
    })
      .then(res => {
        if (res.ok) {
          const success = document.getElementById("successMessage");
          if (success) {
            success.style.display = "block";
            form.reset();
            setTimeout(() => (success.style.display = "none"), 4000);
          }
        }
      })
      .catch(console.error);
  });
}

// === Start ===
init();
animate();
