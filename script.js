// ── Particle network canvas ───────────────────────────────────────
const canvas = document.getElementById('particle-canvas');
const ctx    = canvas.getContext('2d');

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); initParticles(); });

let particles = [];

function initParticles() {
  const count = Math.floor(window.innerWidth * window.innerHeight / 18000);
  particles = Array.from({ length: count }, () => ({
    x:  Math.random() * canvas.width,
    y:  Math.random() * canvas.height,
    vx: (Math.random() - .5) * .28,
    vy: (Math.random() - .5) * .28,
    r:  Math.random() * 1.4 + .4
  }));
}
initParticles();

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Ambient glow blobs
  const blobs = [
    { x: .15, y: .25, r: 380, c: '#9d6fff' },
    { x: .85, y: .65, r: 320, c: '#7c3aed' },
    { x: .5,  y: .9,  r: 260, c: '#a78bfa' },
  ];
  blobs.forEach(b => {
    const g = ctx.createRadialGradient(
      b.x * canvas.width, b.y * canvas.height, 0,
      b.x * canvas.width, b.y * canvas.height, b.r
    );
    g.addColorStop(0, b.c + '14');
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
      if (d < 120) {
        ctx.strokeStyle = `rgba(157,111,255,${(1 - d/120) * .15})`;
        ctx.lineWidth   = .5;
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
    ctx.fillStyle = 'rgba(157,111,255,.38)';
    ctx.fill();
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
  });

  requestAnimationFrame(drawParticles);
}
drawParticles();

// ── Letter-by-letter name reveal ──────────────────────────────────
function lettersIn(id, baseDelay) {
  const el   = document.getElementById(id);
  const text = el.textContent;
  el.innerHTML = '';
  [...text].forEach((ch, i) => {
    const s = document.createElement('span');
    s.className   = 'hn-letter';
    s.textContent = ch === ' ' ? '\u00A0' : ch;
    el.appendChild(s);
    setTimeout(() => s.classList.add('in'), baseDelay + i * 55);
  });
}

lettersIn('hn-the',     300);
lettersIn('hn-unknown', 600);

// ── Typewriter eyebrow ────────────────────────────────────────────
const phrases = ['Full-Stack Developer', 'Algorithm Enthusiast', 'Building from scratch'];
let pi = 0, ci = 0, deleting = false;
const twEl = document.getElementById('typewriter');

function typewrite() {
  const cur = phrases[pi];
  if (!deleting) {
    twEl.textContent = cur.slice(0, ++ci);
    if (ci === cur.length) { deleting = true; setTimeout(typewrite, 2000); return; }
  } else {
    twEl.textContent = cur.slice(0, --ci);
    if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
  }
  setTimeout(typewrite, deleting ? 38 : 78);
}
setTimeout(typewrite, 500);

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
document.querySelectorAll('.stat-n').forEach(el => so.observe(el));

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
cur.style.cssText = `position:fixed;width:28px;height:28px;border:1px solid #9d6fff;border-radius:50%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:transform .15s ease,background .2s,opacity .2s;opacity:0;`;
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

document.querySelectorAll('a, button, .proj-card, .chips span').forEach(el => {
  el.addEventListener('mouseenter', () => { cur.style.transform = 'translate(-50%,-50%) scale(1.6)'; cur.style.background = '#9d6fff18'; });
  el.addEventListener('mouseleave', () => { cur.style.transform = 'translate(-50%,-50%) scale(1)';   cur.style.background = 'transparent'; });
});

// ── Smooth scroll ─────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });
});
