// === THREE.JS SCENE CONFIGURATION ===

let scene, camera, renderer, lines;
let particleLayers = [];
let heroElements = [];
let elementTargets = [];

let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

// Entry point
function init() {
    // Initialize scene and camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Configure renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#hero-canvas'),
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Capture hero text elements for animation
    const hero = document.querySelector('.hero-content');
    if (hero) {
        heroElements = [
            hero.querySelector('h1'),
            hero.querySelector('h2'),
            hero.querySelector('p')
        ];

        elementTargets = heroElements.map(() => ({ x: 0, y: 0 }));

        heroElements.forEach(el => {
            if (el) el.style.transition = 'transform 0.1s ease-out';
        });
    }

    // Generate particles and lines
    generateParticleLayers();
    generateConnectionLines();

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
}

function generateParticleLayers() {
    const aspect = window.innerWidth / window.innerHeight;
    const spreadX = Math.max(20 * aspect, 20);
    const spreadY = 20;

    const configs = [
        { count: 3000, depth: 6, size: 0.003, z: -2 },
        { count: 2000, depth: 4, size: 0.005, z: 0 },
        { count: 1000, depth: 2, size: 0.007, z: 2 }
    ];

    configs.forEach(({ count, depth, size, z }) => {
        const layer = createParticleLayer(count, depth, size, spreadX, spreadY);
        layer.position.z = z;
        particleLayers.push(layer);
        scene.add(layer);
    });
}

function createParticleLayer(count, depth, size, spreadX, spreadY) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < positions.length; i += 3) {
        positions[i] = (Math.random() - 0.5) * spreadX;
        positions[i + 1] = (Math.random() - 0.5) * spreadY;
        positions[i + 2] = (Math.random() - 0.5) * depth;

        velocities[i] = (Math.random() - 0.5) * 0.02;
        velocities[i + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i + 2] = (Math.random() - 0.5) * 0.01;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
        size,
        color: '#fff',
        transparent: true,
        opacity: 0.8
    });

    return new THREE.Points(geometry, material);
}

function generateConnectionLines() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(3000 * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
        color: '#fff',
        transparent: true,
        opacity: 0.1
    });

    lines = new THREE.LineSegments(geometry, material);
    scene.add(lines);
}

function updateConnectionLines() {
    if (!lines || !particleLayers.length) return;

    const positions = lines.geometry.attributes.position.array;
    const particles = particleLayers[1].geometry.attributes.position.array;
    let index = 0;

    const maxConnections = 5;
    const connectionCount = new Array(particles.length / 3).fill(0);

    for (let i = 0; i < particles.length; i += 3) {
        if (connectionCount[i / 3] >= maxConnections) continue;

        for (let j = i + 3; j < particles.length; j += 3) {
            if (index >= positions.length - 6) break;
            if (connectionCount[j / 3] >= maxConnections) continue;

            const dx = particles[j] - particles[i];
            const dy = particles[j + 1] - particles[i + 1];
            const dz = particles[j + 2] - particles[i + 2];

            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < 2) {
                positions.set([
                    particles[i], particles[i + 1], particles[i + 2],
                    particles[j], particles[j + 1], particles[j + 2]
                ], index);

                connectionCount[i / 3]++;
                connectionCount[j / 3]++;
                index += 6;

                if (connectionCount[i / 3] >= maxConnections) break;
            }
        }
    }

    for (let i = index; i < positions.length; i++) {
        positions[i] = 0;
    }

    lines.geometry.attributes.position.needsUpdate = true;
}

function handleMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) / 200;
    mouseY = (event.clientY - window.innerHeight / 2) / 200;

    heroElements.forEach((el, idx) => {
        const xRange = 25 - idx * 5;
        const yRange = 15 - idx * 3;

        elementTargets[idx] = {
            x: ((event.clientX / window.innerWidth) - 0.5) * xRange,
            y: ((event.clientY / window.innerHeight) - 0.5) * yRange
        };
    });
}

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    particleLayers.forEach(layer => scene.remove(layer));
    particleLayers = [];

    if (lines) scene.remove(lines);

    generateParticleLayers();
    generateConnectionLines();
}

// === ANIMATION LOOP ===
function animate() {
    requestAnimationFrame(animate);

    targetX = mouseX * 0.4;
    targetY = mouseY * 0.4;
    camera.position.x += (targetX - camera.position.x) * 0.03;
    camera.position.y += (targetY - camera.position.y) * 0.03;

    heroElements.forEach((el, i) => {
        if (el) {
            const target = elementTargets[i];
            el.style.transform = `translate(${target.x}px, ${target.y}px)`;
        }
    });

    particleLayers.forEach((layer, i) => {
        const positions = layer.geometry.attributes.position.array;
        const velocities = layer.geometry.attributes.velocity.array;
        const spread = [20, 15, 10][i];

        for (let j = 0; j < positions.length; j += 3) {
            positions[j] += velocities[j];
            positions[j + 1] += velocities[j + 1];
            positions[j + 2] += velocities[j + 2];

            if (positions[j] > spread) positions[j] = -spread;
            if (positions[j] < -spread) positions[j] = spread;
            if (positions[j + 1] > spread) positions[j + 1] = -spread;
            if (positions[j + 1] < -spread) positions[j + 1] = spread;
            if (positions[j + 2] > spread) positions[j + 2] = -spread;
            if (positions[j + 2] < -spread) positions[j + 2] = spread;
        }

        layer.geometry.attributes.position.needsUpdate = true;
        layer.rotation.x += 0.0003 * (i + 1);
        layer.rotation.y += 0.0003 * (i + 1);
    });

    updateConnectionLines();
    renderer.render(scene, camera);
}

// === SMOOTH SCROLL & FORM SUBMISSION ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

window.addEventListener('load', () => {
    const loader = document.querySelector('.loading-screen');
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
});

document.getElementById('contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
    }).then(response => {
        if (response.ok) {
            document.getElementById('successMessage').style.display = 'block';
            form.reset();
            setTimeout(() => {
                document.getElementById('successMessage').style.display = 'none';
            }, 5000);
        }
    }).catch(console.error);
});

// === LAUNCH ===
init();
animate();
