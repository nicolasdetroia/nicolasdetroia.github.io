// === INSANE 3D PARTICLE GALAXY ===
let scene, camera, renderer, particles, stars, mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

function init() {
  // Scene setup
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.z = 15;

  // Renderer with ultra quality
  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#hero-canvas"),
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  createParticleGalaxy();
  createFloatingStars();
  
  document.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", onResize);
  
  // Check motion preference
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!prefersReduced.matches) {
    animate();
  }
}

// === PARTICLE GALAXY ===
function createParticleGalaxy() {
  const geometry = new THREE.BufferGeometry();
  const particleCount = 3000;
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  
  const colorPalette = [
    new THREE.Color('#667eea'),
    new THREE.Color('#764ba2'),
    new THREE.Color('#f093fb'),
    new THREE.Color('#06b6d4'),
    new THREE.Color('#8b5cf6')
  ];
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    
    // Create spiral galaxy shape
    const radius = Math.random() * 25;
    const spinAngle = radius * 0.3;
    const branchAngle = ((i % 5) / 5) * Math.PI * 2;
    
    const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);
    const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);
    const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);
    
    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY * 0.5;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;
    
    // Colors
    const color = colorPalette[i % colorPalette.length];
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
    
    // Sizes
    sizes[i] = Math.random() * 0.15 + 0.05;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  const material = new THREE.PointsMaterial({
    size: 0.15,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

// === FLOATING STARS ===
function createFloatingStars() {
  const geometry = new THREE.BufferGeometry();
  const starCount = 800;
  
  const positions = new Float32Array(starCount * 3);
  
  for (let i = 0; i < starCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 100;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const material = new THREE.PointsMaterial({
    size: 0.08,
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true
  });
  
  stars = new THREE.Points(geometry, material);
  scene.add(stars);
}

// === MOUSE INTERACTION ===
function onMouseMove(e) {
  mouseX = (e.clientX - window.innerWidth / 2) / 100;
  mouseY = (e.clientY - window.innerHeight / 2) / 100;
}

// === RESIZE HANDLER ===
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// === ANIMATION LOOP ===
function animate() {
  requestAnimationFrame(animate);
  
  // Smooth camera follow
  targetX = mouseX * 0.5;
  targetY = mouseY * 0.5;
  
  camera.position.x += (targetX - camera.position.x) * 0.05;
  camera.position.y += (-targetY - camera.position.y) * 0.05;
  camera.lookAt(scene.position);
  
  // Rotate galaxy
  if (particles) {
    particles.rotation.y += 0.0005;
    particles.rotation.x = Math.sin(Date.now() * 0.0001) * 0.1;
  }
  
  // Floating stars
  if (stars) {
    stars.rotation.y -= 0.0002;
    stars.rotation.x += 0.0001;
  }
  
  renderer.render(scene, camera);
}

// === SCROLL REVEAL ANIMATIONS ===
function initScrollAnimations() {
  const options = {
    threshold: 0.15,
    rootMargin: "0px 0px -100px 0px"
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("animate-in");
          entry.target.style.transitionDelay = `${index * 0.1}s`;
        }, 100);
      }
    });
  }, options);
  
  const elements = document.querySelectorAll(
    ".project-card, .experience-card, .cert-card, .about-skills, .about-coursework"
  );
  
  elements.forEach(el => observer.observe(el));
}

// === MAGNETIC BUTTON EFFECT ===
function initMagneticButtons() {
  const buttons = document.querySelectorAll(
    ".project-link, .cert-link, .download-btn, .contact-form button"
  );
  
  buttons.forEach(button => {
    button.addEventListener("mousemove", (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.05)`;
    });
    
    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
    });
  });
}

// === NAVBAR SCROLL MAGIC ===
function initNavbar() {
  const navbar = document.querySelector(".navbar");
  let lastScroll = 0;
  
  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
    
    // Hide on scroll down, show on scroll up
    if (currentScroll > lastScroll && currentScroll > 500) {
      navbar.style.transform = "translateY(-100%)";
    } else {
      navbar.style.transform = "translateY(0)";
    }
    
    lastScroll = currentScroll;
  });
}

// === SMOOTH SCROLL WITH OFFSET ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {
    const href = this.getAttribute("href");
    
    if (href === "#") return;
    
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      
      const offsetTop = target.offsetTop - 80;
      
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth"
      });
    }
  });
});

// === TYPING ANIMATION FOR HERO ===
function initTypingEffect() {
  const heroTitle = document.querySelector(".hero h1");
  if (!heroTitle) return;
  
  const text = heroTitle.textContent;
  heroTitle.textContent = "";
  heroTitle.style.opacity = "1";
  
  let i = 0;
  const typing = setInterval(() => {
    if (i < text.length) {
      heroTitle.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(typing);
    }
  }, 80);
}

// === PARALLAX EFFECT ===
function initParallax() {
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;
    
    // Parallax for sections
    const sections = document.querySelectorAll("section");
    sections.forEach((section, index) => {
      const speed = (index % 2 === 0) ? 0.5 : -0.3;
      section.style.transform = `translateY(${scrolled * speed * 0.05}px)`;
    });
  });
}

// === CARD TILT EFFECT ===
function initCardTilt() {
  const cards = document.querySelectorAll(
    ".project-card, .cert-card, .social-card, .resume-card"
  );
  
  cards.forEach(card => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });
    
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

// === LOADING SCREEN ===
window.addEventListener("load", () => {
  const loader = document.querySelector(".loading-screen");
  
  setTimeout(() => {
    if (loader) {
      loader.style.opacity = "0";
      
      setTimeout(() => {
        loader.style.display = "none";
        initScrollAnimations();
        initMagneticButtons();
        initCardTilt();
      }, 500);
    }
  }, 1000);
});

// === CONTACT FORM ENHANCEMENT ===
const form = document.getElementById("contactForm");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const button = form.querySelector("button");
    const originalText = button.textContent;
    const formData = new FormData(form);
    
    // Animate button
    button.textContent = "Sending...";
    button.style.transform = "scale(0.95)";
    button.disabled = true;
    
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }
      });
      
      if (response.ok) {
        button.textContent = "Sent! ✓";
        button.style.background = "linear-gradient(135deg, #10b981, #06b6d4)";
        
        const success = document.getElementById("successMessage");
        if (success) {
          success.style.display = "block";
          form.reset();
          
          setTimeout(() => {
            success.style.display = "none";
            button.textContent = originalText;
            button.style.background = "";
          }, 5000);
        }
      } else {
        throw new Error("Failed to send");
      }
    } catch (error) {
      console.error(error);
      button.textContent = "Error! Try again";
      button.style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = "";
      }, 3000);
    } finally {
      button.disabled = false;
      button.style.transform = "";
    }
  });
}

// === CURSOR TRAIL EFFECT ===
function initCursorTrail() {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9998";
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  
  document.addEventListener("mousemove", (e) => {
    particles.push({
      x: e.clientX,
      y: e.clientY,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 2,
      speedY: (Math.random() - 0.5) * 2,
      life: 1
    });
  });
  
  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${p.life * 0.5})`;
      ctx.fill();
      
      p.x += p.speedX;
      p.y += p.speedY;
      p.life -= 0.02;
      p.size *= 0.95;
      
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
    
    requestAnimationFrame(animateParticles);
  }
  
  animateParticles();
  
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// === GRADIENT ANIMATION ===
function initGradientAnimation() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  
  let hue = 0;
  
  setInterval(() => {
    hue = (hue + 0.5) % 360;
    hero.style.setProperty("--gradient-shift", `hsl(${hue}, 70%, 60%)`);
  }, 50);
}

// === INITIALIZE EVERYTHING ===
document.addEventListener("DOMContentLoaded", () => {
  init();
  initNavbar();
  
  // Check for reduced motion
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  
  if (!prefersReduced.matches) {
    initCursorTrail();
    // initTypingEffect(); // Uncomment if you want typing effect
  }
});

// === EASTER EGG - KONAMI CODE ===
let konamiCode = [];
const sequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

document.addEventListener("keydown", (e) => {
  konamiCode.push(e.keyCode);
  konamiCode = konamiCode.slice(-10);
  
  if (konamiCode.join("") === sequence.join("")) {
    document.body.style.animation = "rainbow 2s linear infinite";
    setTimeout(() => {
      document.body.style.animation = "";
    }, 5000);
  }
});

// Add rainbow keyframes
const style = document.createElement("style");
style.textContent = `
  @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }
`;
document.head.appendChild(style);
