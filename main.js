// === THREE.JS SCENE (subtle, performant) ===
let scene, camera, renderer, lines;
let particleLayers = [];
let heroEls = [];
let elTargets = [];
let mouse = { x: 0, y: 0 }, target = { x: 0, y: 0 };

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#hero-canvas'),
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const hero = document.querySelector('.hero-content');
  if (hero) {
    heroEls = [hero.querySelector('h1'), hero.querySelector('h2'), hero.querySelector('p')].filter(Boolean);
    elTargets = heroEls.map(() => ({ x: 0, y: 0 }));
    heroEls.forEach(el => el.style.transition = 'transform 80ms ease-out');
  }

  generateParticleLayers();
  generateConnectionLines();

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onResize);

  // Respect prefers-reduced-motion
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (media.matches) {
    particleLayers.forEach(layer => (layer.rotation.x = layer.rotation.y = 0));
  }
}

function generateParticleLayers() {
  const aspect = window.innerWidth / window.innerHeight;
  const spreadX = Math.max(18 * aspect, 18);
  const spreadY = 18;

  // Lighter counts for calmer vibe + performance
  const configs = [
    { count: 900, depth: 3, size: 0.006, z: -1.5, opacity: 0.45 },
    { count: 650, depth: 2, size: 0.008, z: 0,   opacity: 0.55 },
    { count: 420, depth: 1.6, size: 0.01, z: 1.2, opacity: 0.65 }
  ];

  configs.forEach(({ count, depth, size, z, opacity }, i) => {
    const layer = createParticleLayer(count, depth, size, spreadX, spreadY, opacity);
    layer.position.z = z;
    layer.userData.speed = 0.00025 * (i + 1);
    particleLayers.push(layer);
    scene.add(layer);
  });
}

function createParticleLayer(count, depth, size, spreadX, spreadY, opacity) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < positions.length; i += 3) {
    positions[i]     = (Math.random() - 0.5) * spreadX;
    positions[i + 1] = (Math.random() - 0.5) * spreadY;
    positions[i + 2] = (Math.random() - 0.5) * depth;

    velocities[i]     = (Math.random() - 0.5) * 0.01;
    velocities[i + 1] = (Math.random() - 0.5) * 0.01;
    velocities[i + 2] = (Math.random() - 0.5) * 0.006;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

  const material = new THREE.PointsMaterial({
    size,
    color: '#E9ECF4',
    transparent: true,
    opacity
  });

  return new THREE.Points(geometry, material);
}

function generateConnectionLines() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(1800); // fewer, cleaner lines
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: '#E9ECF4',
    transparent: true,
    opacity: 0.08
  });

  lines = new THREE.LineSegments(geometry, material);
  scene.add(lines);
}

function updateConnectionLines() {
  if (!lines || !particleLayers.length) return;

  const positions = lines.geometry.attributes.position.array;
  const particles = particleLayers[1].geometry.attributes.position.array;
  let index = 0;

  const maxConnections = 3;
  const connectionCount = new Array(particles.length / 3).fill(0);

  for (let i = 0; i < particles.length; i += 3) {
    if (connectionCount[i / 3] >= maxConnections) continue;

    for (let j = i + 3; j < particles.length; j += 3) {
      if (index >= positions.length - 6) break;
      if (connectionCount[j / 3] >= maxConnections) continue;

      const dx = particles[j]     - particles[i];
      const dy = particles[j + 1] - particles[i + 1];
      const dz = particles[j + 2] - particles[i + 2];
      const dist = Math.hypot(dx, dy, dz);

      if (dist < 1.5) {
        positions.set([
          particles[i], particles[i + 1], particles[i + 2],
          particles[j], particles[j + 1], particles[j + 2]
        ], index);
        connectionCount[i / 3]++; connectionCount[j / 3]++;
        index += 6;
        if (connectionCount[i / 3] >= maxConnections) break;
      }
    }
  }
  for (let i = index; i < positions.length; i++) positions[i] = 0;
  lines.geometry.attributes.position.needsUpdate = true;
}

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

  particleLayers.forEach(layer => scene.remove(layer));
  particleLayers = [];
  if (lines) scene.remove(lines);

  generateParticleLayers();
  generateConnectionLines();
}

// === Animation Loop (subtle motion) ===
function animate() {
  requestAnimationFrame(animate);

  target.x = mouse.x * 0.4;
  target.y = mouse.y * 0.4;
  camera.position.x += (target.x - camera.position.x) * 0.035;
  camera.position.y += (target.y - camera.position.y) * 0.035;

  heroEls.forEach((el, i) => {
    const t = elTargets[i] || { x: 0, y: 0 };
    el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0)`;
  });

  particleLayers.forEach((layer, idx) => {
    const positions = layer.geometry.attributes.position.array;
    const velocities = layer.geometry.attributes.velocity.array;
    const spread = [16, 13, 10][idx];

    for (let j = 0; j < positions.length; j += 3) {
      positions[j]     += velocities[j]     * 0.65;
      positions[j + 1] += velocities[j + 1] * 0.65;
      positions[j + 2] += velocities[j + 2] * 0.65;

      if (positions[j] > spread) positions[j] = -spread;
      if (positions[j] < -spread) positions[j] = spread;
      if (positions[j + 1] > spread) positions[j + 1] = -spread;
      if (positions[j + 1] < -spread) positions[j + 1] = spread;
      if (positions[j + 2] > spread) positions[j + 2] = -spread;
      if (positions[j + 2] < -spread) positions[j + 2] = spread;
    }

    layer.geometry.attributes.position.needsUpdate = true;
    layer.rotation.x += layer.userData.speed;
    layer.rotation.y += layer.userData.speed;
  });

  updateConnectionLines();
  renderer.render(scene, camera);
}

// === Smooth Scroll (native) & Form ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

window.addEventListener('load', () => {
  const loader = document.querySelector('.loading-screen');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => (loader.style.display = 'none'), 450);
  }
});

const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    })
      .then(res => {
        if (res.ok) {
          const success = document.getElementById('successMessage');
          if (success) {
            success.style.display = 'block';
            form.reset();
            setTimeout(() => (success.style.display = 'none'), 4000);
          }
        }
      })
      .catch(console.error);
  });
}

// === Launch ===
init();
animate();
