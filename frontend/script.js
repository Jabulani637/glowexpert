// Custom cursor
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});

document.querySelectorAll('a, button, .cat-card, .product-card').forEach((el) => {
  el.addEventListener('mouseenter', () => cursor.classList.add('expand'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('expand'));
});

// Scroll nav
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
});

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  },
  { threshold: 0.12 }
);
revealEls.forEach((el) => observer.observe(el));

// Tabs
function setTab(btn) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  btn.classList.add('active');
}

// Testimonials
function setTestimonial(index, dotEl) {
  document.querySelectorAll('.testimonial').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.dot').forEach((d) => d.classList.remove('active'));
  document.querySelectorAll('.testimonial')[index].classList.add('active');
  dotEl.classList.add('active');
}

// Auto-rotate testimonials
let current = 0;
setInterval(() => {
  current = (current + 1) % 3;
  const dots = document.querySelectorAll('.dot');
  setTestimonial(current, dots[current]);
}, 5000);

