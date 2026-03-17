// ── Ambient BG canvas ─────────────────────────────────────────────
const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Slow drifting orbs
const orbs = [
  { x: 0.15, y: 0.2,  r: 400, color: '#8b5cf6', speed: 0.00008 },
  { x: 0.85, y: 0.7,  r: 350, color: '#6d28d9', speed: 0.00006 },
  { x: 0.5,  y: 0.95, r: 300, color: '#a78bfa', speed: 0.0001  },
];
let t = 0;

function drawBG() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  t += 1;
  orbs.forEach((o, i) => {
    const x = (o.x + Math.sin(t * o.speed + i) * 0.08) * canvas.width;
    const y = (o.y + Math.cos(t * o.speed + i) * 0.06) * canvas.height;
    const g = ctx.createRadialGradient(x, y, 0, x, y, o.r);
    g.addColorStop(0, o.color + '18');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
  requestAnimationFrame(drawBG);
}
drawBG();

// ── Letter-by-letter name reveal ──────────────────────────────────
function wrapLetters(el) {
  const text  = el.textContent;
  el.innerHTML = '';
  text.split('').forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch === ' ' ? '\u00A0' : ch;
    s.style.animationDelay = `${0.5 + i * 0.055}s`;
    s.style.animation = `letter-in 0.5s ${0.5 + i * 0.055}s cubic-bezier(0.22,1,0.36,1) forwards`;
    el.appendChild(s);
  });
}

wrapLetters(document.getElementById('word-the'));
wrapLetters(document.getElementById('word-unknown'));

// ── Nav scroll ────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── Scroll reveal ─────────────────────────────────────────────────
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      ro.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

// ── Count-up ──────────────────────────────────────────────────────
const co = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el     = e.target;
    const target = +el.dataset.target;
    let cur = 0;
    const inc = target / (900 / 16);
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= target) { el.textContent = target; clearInterval(timer); }
      else el.textContent = Math.floor(cur);
    }, 16);
    co.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.c-num').forEach(el => co.observe(el));

// ── Smooth scroll ─────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))
      ?.scrollIntoView({ behavior: 'smooth' });
  });
});
