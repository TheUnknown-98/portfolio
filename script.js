// ── Cursor ────────────────────────────────────────────────────────
const cursor    = document.getElementById('cursor');
const cursorDot = document.getElementById('cursor-dot');
let mouseX = 0, mouseY = 0, curX = 0, curY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';
  cursor.style.opacity = cursorDot.style.opacity = '1';
});

(function loop() {
  curX += (mouseX - curX) * 0.1;
  curY += (mouseY - curY) * 0.1;
  cursor.style.left = curX + 'px';
  cursor.style.top  = curY + 'px';
  requestAnimationFrame(loop);
})();

document.querySelectorAll('a, button, .project-card, .skill-chip').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(1.5)';
    cursor.style.background = 'var(--accent-dim)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(1)';
    cursor.style.background = 'transparent';
  });
});

// ── Nav scroll ────────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Typewriter ────────────────────────────────────────────────────
const phrases = ['Full-Stack Developer', 'Algorithm Enthusiast', 'Building from scratch'];
let pi = 0, ci = 0, del = false;
const tw = document.getElementById('typewriter');

function type() {
  const cur = phrases[pi];
  if (!del) {
    tw.textContent = cur.slice(0, ++ci);
    if (ci === cur.length) { del = true; setTimeout(type, 1800); return; }
  } else {
    tw.textContent = cur.slice(0, --ci);
    if (ci === 0) { del = false; pi = (pi + 1) % phrases.length; }
  }
  setTimeout(type, del ? 40 : 80);
}
setTimeout(type, 700);

// ── Canvas particle network ───────────────────────────────────────
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
let W, H, pts;

function resize() {
  W = canvas.width  = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}
window.addEventListener('resize', () => { resize(); init(); });
resize();

function init() {
  const n = Math.floor(W * H / 16000);
  pts = Array.from({ length: n }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - .5) * .35,
    vy: (Math.random() - .5) * .35,
    r:  Math.random() * 1.5 + .5
  }));
}
init();

function draw() {
  ctx.clearRect(0, 0, W, H);
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 120) {
        ctx.strokeStyle = `rgba(160,124,245,${(1 - d/120) * .18})`;
        ctx.lineWidth = .6;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
  }
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(160,124,245,.45)';
    ctx.fill();
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;
  }
  requestAnimationFrame(draw);
}
draw();

// ── Scroll reveal ─────────────────────────────────────────────────
const ro = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); ro.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal, .reveal-slow').forEach(el => ro.observe(el));

// ── Count-up stats ────────────────────────────────────────────────
const so = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.target;
    let cur = 0;
    const inc = target / (1200 / 16);
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { el.textContent = target; clearInterval(t); }
      else el.textContent = Math.floor(cur);
    }, 16);
    so.unobserve(el);
  });
}, { threshold: .5 });
document.querySelectorAll('.stat-num').forEach(el => so.observe(el));

// ── Card glow ─────────────────────────────────────────────────────
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', ((e.clientX - r.left) / r.width  * 100) + '%');
    card.style.setProperty('--mouse-y', ((e.clientY - r.top)  / r.height * 100) + '%');
  });
});

// ── Smooth scroll ─────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });
});
