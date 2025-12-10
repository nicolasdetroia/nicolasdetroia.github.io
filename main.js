// === MINIMAL PARTICLE SYSTEM (Apple-style subtlety) ===
let scene, camera, renderer, particles;
let mouse = { x: 0, y: 0 };
let target = { x: 0, y: 0 };

function init() {
  // Setup scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 5, 15);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 8;

  // Renderer with transparency
  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#hero-canvas"),
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  createParticles();

  // Event listeners
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", onResize);

  // Respect motion preferences
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReducedMotion.matches) {
    particles.rotation.set(0, 0, 0);
  }
}

// === PARTICLE CREATION ===
function createParticles() {
  const geometry = new THREE.BufferGeometry();
  const particleCount = 1200;
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);

  // Create particle positions in a sphere
  for (let i = 0; i < particleCount * 3; i += 3) {
    const radius = 5 + Math.random() * 8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);

    velocities[i] = (Math.random() - 0.5) * 0.002;
    velocities[i + 1] = (Math.random() - 0.5) * 0.002;
    velocities[i + 2] = (Math.random() - 0.5) * 0.002;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3));

  // Minimal material
  const material = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x1d1d1f,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

// === EVENT HANDLERS ===
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// === ANIMATION LOOP ===
function animate() {
  requestAnimationFrame(animate);

  // Smooth camera movement
  target.x = mouse.x * 0.3;
  target.y = mouse.y * 0.3;

  camera.position.x += (target.x - camera.position.x) * 0.02;
  camera.position.y += (target.y - camera.position.y) * 0.02;
  camera.lookAt(scene.position);

  // Gentle rotation
  if (particles) {
    particles.rotation.y += 0.0005;
    particles.rotation.x += 0.0002;

    // Update particle positions
    const positions = particles.geometry.attributes.position.array;
    const velocities = particles.geometry.attributes.velocity.array;

    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i];
      positions[i + 1] += velocities[i + 1];
      positions[i + 2] += velocities[i + 2];

      // Boundary check
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      const distance = Math.sqrt(x * x + y * y + z * z);

      if (distance > 12 || distance < 3) {
        velocities[i] *= -1;
        velocities[i + 1] *= -1;
        velocities[i + 2] *= -1;
      }
    }

    particles.geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

// === SCROLL ANIMATIONS (Intersection Observer) ===
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -80px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Stagger animation
        setTimeout(() => {
          entry.target.classList.add("animate-in");
        }, index * 100);
      }
    });
  }, observerOptions);

  // Observe all cards
  const cards = document.querySelectorAll(
    ".project-card, .experience-card, .cert-card, .about-skills, .about-coursework"
  );
  
  cards.forEach(card => observer.observe(card));
}

// === NAVBAR SCROLL EFFECT ===
function initNavbarScroll() {
  const navbar = document.querySelector(".navbar");
  let lastScroll = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }

    lastScroll = currentScroll;
  });
}

// === SMOOTH SCROLL ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {
    const targetId = this.getAttribute("href");
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      e.preventDefault();
      
      const offsetTop = targetElement.offsetTop - 60;
      
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth"
      });
    }
  });
});

// === PAGE LOADER ===
window.addEventListener("load", () => {
  const loader = document.querySelector(".loading-screen");
  
  setTimeout(() => {
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => {
        loader.style.display = "none";
        initScrollAnimations();
      }, 400);
    }
  }, 600);
});

// === CONTACT FORM ===
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const button = contactForm.querySelector("button");
    const originalText = button.textContent;
    
    button.textContent = "Sending...";
    button.disabled = true;

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (response.ok) {
        const successMessage = document.getElementById("successMessage");
        if (successMessage) {
          successMessage.style.display = "block";
          contactForm.reset();
          
          setTimeout(() => {
            successMessage.style.display = "none";
          }, 5000);
        }
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("There was an error sending your message. Please try again.");
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  });
}

// === PARALLAX EFFECT FOR SECTIONS ===
function initParallax() {
  const sections = document.querySelectorAll("section");
  
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;
    
    sections.forEach(section => {
      const speed = 0.5;
      const yPos = -(scrolled * speed);
      const rect = section.getBoundingClientRect();
      
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        section.style.transform = `translateY(${yPos * 0.1}px)`;
      }
    });
  });
}

// === INITIALIZE EVERYTHING ===
document.addEventListener("DOMContentLoaded", () => {
  init();
  animate();
  initNavbarScroll();
  
  // Don't init parallax if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!prefersReducedMotion.matches) {
    // initParallax(); // Commented out for better performance
  }
});

// === KEYBOARD NAVIGATION IMPROVEMENTS ===
document.addEventListener("keydown", (e) => {
  // Add keyboard shortcuts if needed
  if (e.key === "Escape") {
    // Close any modals or overlays
  }
});
