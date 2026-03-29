/* ─────────────────────────────────────────────────────────────
   THEUNKNOWN  ·  Portfolio v2  ·  script.js
   ───────────────────────────────────────────────────────────── */
'use strict';

// ── Mouse spotlight ───────────────────────────────────────────────
const spotlight = document.getElementById('spotlight');
let sX = window.innerWidth / 2, sY = window.innerHeight / 2;
let tX = sX, tY = sY;

document.addEventListener('mousemove', e => {
  tX = e.clientX; tY = e.clientY;
});

(function animSpotlight() {
  sX += (tX - sX) * 0.09;
  sY += (tY - sY) * 0.09;
  spotlight.style.left = sX + 'px';
  spotlight.style.top  = sY + 'px';
  requestAnimationFrame(animSpotlight);
})();

// ── Particle canvas ───────────────────────────────────────────────
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
    x:  Math.random() * canvas.width,
    y:  Math.random() * canvas.height,
    vx: (Math.random() - .5) * .22,
    vy: (Math.random() - .5) * .22,
    r:  Math.random() * 1.2 + .3,
  }));
}
initParticles();

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Ambient glow blobs
  [
    { x: .12, y: .2,  r: 420, c: '#9d6fff' },
    { x: .88, y: .7,  r: 360, c: '#7c3aed' },
    { x: .5,  y: .95, r: 280, c: '#a78bfa' },
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
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 110) {
        ctx.strokeStyle = `rgba(157,111,255,${(1 - d/110) * .12})`;
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
    ctx.fillStyle = 'rgba(157,111,255,.3)';
    ctx.fill();
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
  });

  requestAnimationFrame(drawParticles);
}
drawParticles();

// ── Cycling word animation ────────────────────────────────────────
const WORDS = ['work', 'ship', 'last', 'matter', 'think'];
let wordIdx   = 0;
let charIdx   = 0;
let isDeleting = false;
const cycleEl  = document.getElementById('cycleWord');

function cycleWord() {
  const current = WORDS[wordIdx];

  if (!isDeleting) {
    // Typing
    charIdx++;
    cycleEl.textContent = current.slice(0, charIdx);

    if (charIdx === current.length) {
      // Fully typed — pause then delete
      isDeleting = true;
      setTimeout(cycleWord, 2400);
      return;
    }
    setTimeout(cycleWord, 90);
  } else {
    // Deleting
    charIdx--;
    cycleEl.textContent = current.slice(0, charIdx);

    if (charIdx === 0) {
      // Fully deleted — move to next word
      isDeleting = false;
      wordIdx = (wordIdx + 1) % WORDS.length;
      setTimeout(cycleWord, 260);
      return;
    }
    setTimeout(cycleWord, 55);
  }
}

// Start after hero animates in
setTimeout(cycleWord, 1000);

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

// ── Card glow follow ──────────────────────────────────────────────
document.querySelectorAll('.proj-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
  });
});

// ── Custom cursor ─────────────────────────────────────────────────
const cur = document.createElement('div');
const dot = document.createElement('div');
cur.style.cssText = `position:fixed;width:26px;height:26px;border:1px solid rgba(157,111,255,.6);border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:transform .15s ease,background .2s,opacity .2s,width .2s,height .2s;opacity:0;`;
dot.style.cssText = `position:fixed;width:4px;height:4px;background:#9d6fff;border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);opacity:0;transition:opacity .2s;`;
document.body.appendChild(cur);
document.body.appendChild(dot);

let mx = 0, my = 0, cx = 0, cy = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  cur.style.opacity = dot.style.opacity = '1';
});
(function animCur() {
  cx += (mx - cx) * .1; cy += (my - cy) * .1;
  cur.style.left = cx + 'px'; cur.style.top = cy + 'px';
  requestAnimationFrame(animCur);
})();

document.querySelectorAll('a, button, .proj-card, .skill-pill').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cur.style.transform = 'translate(-50%,-50%) scale(1.6)';
    cur.style.background = 'rgba(157,111,255,.1)';
    cur.style.borderColor = 'rgba(157,111,255,1)';
  });
  el.addEventListener('mouseleave', () => {
    cur.style.transform = 'translate(-50%,-50%) scale(1)';
    cur.style.background = 'transparent';
    cur.style.borderColor = 'rgba(157,111,255,.6)';
  });
});

// ── Smooth scroll ─────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });
});
