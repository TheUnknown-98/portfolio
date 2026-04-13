/* ─────────────────────────────────────────────────────────────
   THEUNKNOWN  ·  Portfolio v3  ·  script.js
   ───────────────────────────────────────────────────────────── */
'use strict';
 
// ── Spotlight ────────────────────────────────────────────────────
const spotlight = document.getElementById('spotlight');
let sX = window.innerWidth / 2, sY = window.innerHeight / 2;
let tX = sX, tY = sY;
 
document.addEventListener('mousemove', e => { tX = e.clientX; tY = e.clientY; });
 
(function animSpotlight() {
  sX += (tX - sX) * 0.08;
  sY += (tY - sY) * 0.08;
  spotlight.style.left = sX + 'px';
  spotlight.style.top  = sY + 'px';
  requestAnimationFrame(animSpotlight);
})();
 
// ── Particles ─────────────────────────────────────────────────────
const canvas = document.getElementById('particle-canvas');
const ctx    = canvas.getContext('2d');
 
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });
 
let particles = [];
function initParticles() {
  const count = Math.floor(window.innerWidth * window.innerHeight / 20000);
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - .5) * .2,
    vy: (Math.random() - .5) * .2,
    r: Math.random() * 1.2 + .3,
  }));
}
initParticles();
 
function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
 
  // Ambient blobs
  [
    { x: .1,  y: .18, r: 420, c: '#9d6fff' },
    { x: .9,  y: .72, r: 360, c: '#7c3aed' },
    { x: .5,  y: .96, r: 280, c: '#a78bfa' },
  ].forEach(b => {
    const g = ctx.createRadialGradient(
      b.x * canvas.width, b.y * canvas.height, 0,
      b.x * canvas.width, b.y * canvas.height, b.r
    );
    g.addColorStop(0, b.c + '10');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
 
  // Connections
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < 110) {
        ctx.strokeStyle = `rgba(157,111,255,${(1 - d / 110) * .11})`;
        ctx.lineWidth = .5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
 
  // Dots
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(157,111,255,.28)';
    ctx.fill();
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
  });
 
  requestAnimationFrame(drawParticles);
}
drawParticles();
 
// ── Cycling word ──────────────────────────────────────────────────
const WORDS    = ['work', 'ship', 'last', 'matter', 'think'];
let wordIdx    = 0;
let charIdx    = 0;
let isDeleting = false;
const cycleEl  = document.getElementById('cycleWord');
 
function cycleWord() {
  const current = WORDS[wordIdx];
 
  if (!isDeleting) {
    charIdx++;
    cycleEl.textContent = current.slice(0, charIdx);
    if (charIdx === current.length) {
      isDeleting = true;
      setTimeout(cycleWord, 2400);
      return;
    }
    setTimeout(cycleWord, 90);
  } else {
    charIdx--;
    cycleEl.textContent = current.slice(0, charIdx);
    if (charIdx === 0) {
      isDeleting = false;
      wordIdx    = (wordIdx + 1) % WORDS.length;
      setTimeout(cycleWord, 260);
      return;
    }
    setTimeout(cycleWord, 52);
  }
}
setTimeout(cycleWord, 1200);
 
// ── Typewriter eyebrow ────────────────────────────────────────────
const phrases = ['Full-Stack Developer', 'Algorithm Enthusiast', 'Building from scratch'];
let pi = 0, ci = 0, deleting = false;
const twEl = document.getElementById('typewriter');
 
function typewrite() {
  const cur = phrases[pi];
  if (!deleting) {
    twEl.textContent = cur.slice(0, ++ci);
    if (ci === cur.length) { deleting = true; setTimeout(typewrite, 2200); return; }
  } else {
    twEl.textContent = cur.slice(0, --ci);
    if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
  }
  setTimeout(typewrite, deleting ? 36 : 72);
}
setTimeout(typewrite, 600);
 
// ── Nav scroll ────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });
 
// ── Drag-to-browse track ──────────────────────────────────────────
const dragOuter = document.querySelector('.drag-outer');
const dragTrack = document.getElementById('dragTrack');
 
let isDragging  = false;
let dragStartX  = 0;
let scrollStart = 0;
let velocity    = 0;
let lastX       = 0;
let lastTime    = 0;
let momentum    = null;
 
function stopMomentum() {
  if (momentum) { cancelAnimationFrame(momentum); momentum = null; }
}
 
dragOuter.addEventListener('mousedown', e => {
  isDragging  = true;
  dragStartX  = e.pageX;
  scrollStart = dragOuter.scrollLeft;
  velocity    = 0;
  lastX       = e.pageX;
  lastTime    = Date.now();
  dragOuter.classList.add('dragging');
  stopMomentum();
});
 
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const dx = e.pageX - dragStartX;
  dragOuter.scrollLeft = scrollStart - dx;
 
  const now = Date.now();
  velocity  = (e.pageX - lastX) / (now - lastTime || 1);
  lastX     = e.pageX;
  lastTime  = now;
});
 
window.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  dragOuter.classList.remove('dragging');
 
  // Momentum glide
  let v = -velocity * 14;
  function glide() {
    if (Math.abs(v) < 0.5) return;
    dragOuter.scrollLeft += v;
    v *= 0.92;
    momentum = requestAnimationFrame(glide);
  }
  glide();
});
 
// Touch support
dragOuter.addEventListener('touchstart', e => {
  dragStartX  = e.touches[0].pageX;
  scrollStart = dragOuter.scrollLeft;
  stopMomentum();
}, { passive: true });
 
dragOuter.addEventListener('touchmove', e => {
  const dx = e.touches[0].pageX - dragStartX;
  dragOuter.scrollLeft = scrollStart - dx;
}, { passive: true });
 
// Card glow
document.querySelectorAll('.proj-card-h').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
  });
});
 
// Prevent link clicks during drag
let didDrag = false;
dragOuter.addEventListener('mousedown', () => { didDrag = false; });
window.addEventListener('mousemove',   () => { if (isDragging) didDrag = true; });
dragOuter.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', e => { if (didDrag) e.preventDefault(); });
});
 
// ── Overflow hidden on drag-outer for scrollLeft to work ──────────
dragOuter.style.overflowX = 'scroll';
dragOuter.style.scrollbarWidth = 'none';  // Firefox
dragOuter.style.msOverflowStyle = 'none'; // IE
const styleEl = document.createElement('style');
styleEl.textContent = '.drag-outer::-webkit-scrollbar { display: none; }';
document.head.appendChild(styleEl);
 
// ── Scroll reveal ─────────────────────────────────────────────────
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));
 
// ── Count-up stats ────────────────────────────────────────────────
const so = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.target;
    let cur = 0;
    const inc = target / (900 / 16);
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { el.textContent = target; clearInterval(t); }
      else el.textContent = Math.floor(cur);
    }, 16);
    so.unobserve(el);
  });
}, { threshold: .5 });
document.querySelectorAll('.hstat-n').forEach(el => so.observe(el));
 
// ── Custom cursor — comet tail ────────────────────────────────────
const TAIL_COUNT = 6;
const tail = Array.from({ length: TAIL_COUNT }, (_, i) => {
  const el = document.createElement('div');
  const scale = 1 - i * 0.13;
  el.style.cssText = `
    position: fixed;
    width: ${8 * scale}px;
    height: ${8 * scale}px;
    background: rgba(${i === 0 ? '255,255,255' : '180,140,255'}, ${1 - i * 0.15});
    border-radius: 50%;
    pointer-events: none;
    z-index: ${9999 - i};
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity .3s ease;
    will-change: left, top;
  `;
  document.body.appendChild(el);
  return { el, x: 0, y: 0 };
});
 
let mx = 0, my = 0;
 
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  tail.forEach(t => t.el.style.opacity = '1');
});
 
document.addEventListener('mouseleave', () => {
  tail.forEach(t => t.el.style.opacity = '0');
});
 
// Each dot chases the one ahead of it
const LERPS = [0.28, 0.2, 0.15, 0.11, 0.08, 0.06];
 
(function animTail() {
  tail.forEach((t, i) => {
    const targetX = i === 0 ? mx : tail[i - 1].x;
    const targetY = i === 0 ? my : tail[i - 1].y;
    t.x += (targetX - t.x) * LERPS[i];
    t.y += (targetY - t.y) * LERPS[i];
    t.el.style.left = t.x + 'px';
    t.el.style.top  = t.y + 'px';
  });
  requestAnimationFrame(animTail);
})();
 
// Grow head dot on hover
document.querySelectorAll('a, button, .proj-card-h, .skill-pill').forEach(el => {
  el.addEventListener('mouseenter', () => {
    tail[0].el.style.width  = '14px';
    tail[0].el.style.height = '14px';
    tail[0].el.style.background = 'rgba(200,170,255,1)';
  });
  el.addEventListener('mouseleave', () => {
    tail[0].el.style.width  = '8px';
    tail[0].el.style.height = '8px';
    tail[0].el.style.background = 'rgba(255,255,255,1)';
  });
});
 
// ── Smooth scroll ─────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });
});
 