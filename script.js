// Header animations
gsap.from("h2", { duration: 1, y: -50, opacity: 0, ease: "power3.out" });

// Paragraph animations
gsap.from("p", { duration: 1, y: 50, opacity: 0, delay: 0.5, ease: "power3.out" });

// Image animations
gsap.from("img", { duration: 1, scale: 0.9, opacity: 0, ease: "power3.out", stagger: 0.3 });

// Form animations (if present)
if (document.querySelector("form")) {
  gsap.from("form", { duration: 1, scale: 0.9, opacity: 0, ease: "elastic.out(1, 0.3)" });
}
