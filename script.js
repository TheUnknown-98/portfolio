/* ─────────────────────────────────────────────────────────────
   THEUNKNOWN  ·  Portfolio v3  ·  script.js
   ───────────────────────────────────────────────────────────── */
'use strict';

// ── Spotlight ────────────────────────────────────────────────────
const spotlight = document.getElementById('spotlight');
let sX = window.innerWidth / 2, sY = window.innerHeight / 2;
let tX = sX, tY = sY;
let mVelX = 0, mVelY = 0, lastMx = sX, lastMy = sY, lastMTime = Date.now();
let isLabMode = false;
let mx = sX, my = sY;

document.addEventListener('mousemove', e => { tX = e.clientX; tY = e.clientY; });

(function animSpotlight() {
  sX += (tX - sX) * 0.08;
  sY += (tY - sY) * 0.08;
  spotlight.style.left = sX + 'px';
  spotlight.style.top  = sY + 'px';
  requestAnimationFrame(animSpotlight);
})();

// ── Topographic contour background ───────────────────────────────
const topoCanvas = document.getElementById('topo-canvas');
const topoCtx    = topoCanvas.getContext('2d');

function resizeTopo() {
  topoCanvas.width  = window.innerWidth;
  topoCanvas.height = window.innerHeight;
}
resizeTopo();
window.addEventListener('resize', resizeTopo);

// Scalar field: sum of sine waves at different frequencies + phases
function field(x, y, t) {
  let nx = x / topoCanvas.width;
  let ny = y / topoCanvas.height;

  return (
    Math.sin(nx * 4.2 + t * 0.28)          * Math.cos(ny * 3.1 - t * 0.19) +
    Math.sin(nx * 7.8 - ny * 5.4 + t * 0.17) * 0.55 +
    Math.cos(nx * 2.9 + ny * 6.1 + t * 0.22) * 0.45 +
    Math.sin(nx * 11  - t * 0.31)           * Math.cos(ny * 8.7 + t * 0.14) * 0.35 +
    Math.cos(nx * 5.5 + ny * 3.8 - t * 0.09) * 0.4
  );
}

// Contour levels and their colors (purple → blue spectrum)
const CONTOURS = [
  { level: -1.6, color: 'rgba(100, 40, 200, 0.40)' },
  { level: -1.2, color: 'rgba(120, 50, 220, 0.38)' },
  { level: -0.8, color: 'rgba(140, 60, 230, 0.35)' },
  { level: -0.4, color: 'rgba(155, 80, 240, 0.32)' },
  { level:  0.0, color: 'rgba(160, 90, 245, 0.30)' },
  { level:  0.4, color: 'rgba(140, 70, 235, 0.32)' },
  { level:  0.8, color: 'rgba(110, 50, 215, 0.35)' },
  { level:  1.2, color: 'rgba( 80, 40, 190, 0.38)' },
  { level:  1.6, color: 'rgba( 60, 30, 160, 0.40)' },
  // Bright accent lines
  { level: -0.6, color: 'rgba(200,130,255, 0.55)' },
  { level:  0.2, color: 'rgba(170,100,255, 0.48)' },
  { level:  0.9, color: 'rgba(130, 70,230, 0.45)' },
  { level: -1.0, color: 'rgba( 90,140,255, 0.45)' },
];

const STEP = 8; // sample resolution — lower = finer but heavier

let topoT = 0;

function drawTopo() {
  topoCtx.clearRect(0, 0, topoCanvas.width, topoCanvas.height);

  // Dark base
  topoCtx.fillStyle = '#09061a';
  topoCtx.fillRect(0, 0, topoCanvas.width, topoCanvas.height);

  const W = topoCanvas.width;
  const H = topoCanvas.height;
  const cols = Math.ceil(W / STEP) + 1;
  const rows = Math.ceil(H / STEP) + 1;

  // Pre-compute field grid
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = field(c * STEP, r * STEP, topoT);
    }
  }

  // Marching squares — for each contour level trace iso-lines
  CONTOURS.forEach(({ level, color }) => {
    topoCtx.beginPath();
    topoCtx.strokeStyle = color;
    topoCtx.lineWidth   = 1;
    topoCtx.lineCap     = 'round';
    topoCtx.lineJoin    = 'round';

    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const x0 = c * STEP, y0 = r * STEP;
        const x1 = x0 + STEP, y1 = y0 + STEP;

        const v00 = grid[r][c];
        const v10 = grid[r][c + 1];
        const v01 = grid[r + 1][c];
        const v11 = grid[r + 1][c + 1];

        // Interpolation helper
        function interp(a, b, va, vb) {
          if (Math.abs(vb - va) < 0.0001) return a;
          return a + (level - va) / (vb - va) * (b - a);
        }

        // Which corners are above the level?
        const idx =
          (v00 > level ? 1 : 0) |
          (v10 > level ? 2 : 0) |
          (v11 > level ? 4 : 0) |
          (v01 > level ? 8 : 0);

        if (idx === 0 || idx === 15) continue;

        // Edge midpoints
        const top    = { x: interp(x0, x1, v00, v10), y: y0 };
        const right  = { x: x1, y: interp(y0, y1, v10, v11) };
        const bottom = { x: interp(x0, x1, v01, v11), y: y1 };
        const left   = { x: x0, y: interp(y0, y1, v00, v01) };

        // All 16 marching squares cases → line segments
        const cases = {
          1:  [left,   top   ],
          2:  [top,    right ],
          3:  [left,   right ],
          4:  [right,  bottom],
          5:  [left,   top,   right, bottom],
          6:  [top,    bottom],
          7:  [left,   bottom],
          8:  [bottom, left  ],
          9:  [bottom, top   ],
          10: [top,    left,  bottom, right],
          11: [bottom, right ],
          12: [right,  left  ],
          13: [right,  top   ],
          14: [left,   top   ],
        };

        const seg = cases[idx];
        if (!seg) continue;

        if (seg.length === 2) {
          topoCtx.moveTo(seg[0].x, seg[0].y);
          topoCtx.lineTo(seg[1].x, seg[1].y);
        } else {
          // Ambiguous case — two separate segments
          topoCtx.moveTo(seg[0].x, seg[0].y);
          topoCtx.lineTo(seg[1].x, seg[1].y);
          topoCtx.moveTo(seg[2].x, seg[2].y);
          topoCtx.lineTo(seg[3].x, seg[3].y);
        }
      }
    }
    topoCtx.stroke();
  });

  topoT += 0.004; // animation speed — very slow drift
  requestAnimationFrame(drawTopo);
}
drawTopo();

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

    const dx = p.x - mx;
    const dy = p.y - my;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (isLabMode) {
      // Boids flocking logic
      let avgVx = 0, avgVy = 0, count = 0;
      for (let j = 0; j < particles.length; j++) {
        if (particles[j] === p) continue;
        const d = Math.sqrt((p.x - particles[j].x)**2 + (p.y - particles[j].y)**2);
        if (d < 80) {
          avgVx += particles[j].vx;
          avgVy += particles[j].vy;
          count++;
        }
      }
      if (count > 0) {
        p.vx += (avgVx / count - p.vx) * 0.05;
        p.vy += (avgVy / count - p.vy) * 0.05;
      }
      if (dist < 150) {
        p.vx += (dx / dist) * 0.4;
        p.vy += (dy / dist) * 0.4;
      }
      const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      if (speed > 3) {
        p.vx = (p.vx/speed) * 3;
        p.vy = (p.vy/speed) * 3;
      } else if (speed < 0.5 && speed > 0) {
        p.vx = (p.vx/speed) * 0.5;
        p.vy = (p.vy/speed) * 0.5;
      }
    } else {
      // Normal mode: shockwave
      if (dist < 120 && (Math.abs(mVelX) > 1 || Math.abs(mVelY) > 1)) {
        const force = (1 - dist / 120) * 0.15;
        p.vx += mVelX * force;
        p.vy += mVelY * force;
      }
      p.vx *= 0.98;
      p.vy *= 0.98;
      const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      if (speed < 0.2 && speed > 0) {
        p.vx = (p.vx/speed) * 0.2;
        p.vy = (p.vy/speed) * 0.2;
      }
    }

    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
  });

  requestAnimationFrame(drawParticles);
}
drawParticles();

// ── Cycling word ──────────────────────────────────────────────────
const WORDS    = [
  'work',
  'ship',
  'last',
  'matter',
  'scale',
  'perform',
  'solve',
  'teach',
  'evolve',
  'delight',
  'improve',
  'impact'
];
let wordIdx    = 0;
let charIdx    = 0;
let isDeleting = false;
const cycleEl  = document.getElementById('cycleWord');

// Show first word immediately so frag-4 is never empty
cycleEl.textContent = WORDS[0];
charIdx = WORDS[0].length;

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

// ── Cipher / Matrix Reveal ────────────────────────────────────────
const cipherChars = '!<>-_\\/[]{}—=+*^?#';
document.querySelectorAll('.frag[data-text]').forEach((el, i) => {
  const original = el.getAttribute('data-text');
  let iter = 0;
  setTimeout(() => {
    const interval = setInterval(() => {
      el.innerText = original.split('').map((letter, index) => {
        if(index < iter) return original[index];
        return cipherChars[Math.floor(Math.random() * cipherChars.length)];
      }).join('');
      iter += 1/3;
      if(iter >= original.length){
        clearInterval(interval);
        el.innerText = original;
      }
    }, 30);
  }, 100 + i * 150);
});

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

function applyDragTransform(vel) {
  const skew = Math.max(-15, Math.min(15, vel * 2));
  const blur = Math.min(8, Math.abs(vel) * 1.5);
  document.querySelectorAll('.proj-card-h').forEach(c => {
    c.style.transform = `skewX(${skew}deg)`;
    c.style.filter = `blur(${blur}px)`;
  });
}

function stopMomentum() {
  if (momentum) { cancelAnimationFrame(momentum); momentum = null; }
}

if (dragOuter) {
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
    
    applyDragTransform(velocity);
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    dragOuter.classList.remove('dragging');

    // Momentum glide
    let v = -velocity * 14;
    function glide() {
      if (Math.abs(v) < 0.5) {
        applyDragTransform(0);
        return;
      }
      dragOuter.scrollLeft += v;
      v *= 0.92;
      applyDragTransform(v / 14);
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
}

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
if (dragOuter) {
  dragOuter.addEventListener('mousedown', () => { didDrag = false; });
  window.addEventListener('mousemove',   () => { if (isDragging) didDrag = true; });
  dragOuter.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => { if (didDrag) e.preventDefault(); });
  });
}

// ── Overflow hidden on drag-outer for scrollLeft to work ──────────
if (dragOuter) {
  dragOuter.style.overflowX = 'scroll';
  dragOuter.style.scrollbarWidth = 'none';  // Firefox
  dragOuter.style.msOverflowStyle = 'none'; // IE
  const styleEl = document.createElement('style');
  styleEl.textContent = '.drag-outer::-webkit-scrollbar { display: none; }';
  document.head.appendChild(styleEl);
}

// ── Project filters ───────────────────────────────────────────────
const filtersWrap = document.getElementById('projectFilters');
const projectCards = Array.from(document.querySelectorAll('.proj-card-h[data-category]'));
if (filtersWrap && projectCards.length) {
  filtersWrap.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      filtersWrap.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');

      projectCards.forEach(card => {
        const categories = (card.dataset.category || '').split(' ');
        const match = filter === 'all' || categories.includes(filter);
        card.classList.toggle('is-hidden', !match);
      });
      if (dragOuter) {
        dragOuter.scrollTo({ left: 0, behavior: 'smooth' });
      }
    });
  });
}

// ── Architecture modal ────────────────────────────────────────────
const ARCH_DATA = {
  pathfinder: {
    title: 'Pathfinder Visualizer',
    summary: 'Interactive grid architecture built around deterministic animation ticks and isolated algorithm modules.',
    flow: 'Grid state -> algorithm queue -> animation scheduler -> DOM paint + metrics',
    note: 'Tradeoff: chose simpler rendering and predictable state updates over heavy visuals to keep interaction smooth.'
  },
  snap: {
    title: 'Snap Decision',
    summary: 'Lightweight decision engine that maps three behavioral prompts into weighted confidence signals.',
    flow: 'Question inputs -> scoring map -> confidence buckets -> final recommendation',
    note: 'Tradeoff: optimized for clarity and speed of completion, minimizing extra UI branches.'
  }
};

const archModal = document.getElementById('archModal');
const archTitle = document.getElementById('archTitle');
const archSummary = document.getElementById('archSummary');
const archFlow = document.getElementById('archFlow');
const archNote = document.getElementById('archNote');
const archClose = document.getElementById('archClose');

function closeArchModal() {
  if (!archModal) return;
  archModal.classList.remove('is-open');
  archModal.setAttribute('aria-hidden', 'true');
}

if (archModal && archTitle && archSummary && archFlow && archNote) {
  document.querySelectorAll('.arch-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.arch;
      const data = ARCH_DATA[key];
      if (!data) return;
      archTitle.textContent = data.title;
      archSummary.textContent = data.summary;
      archFlow.textContent = data.flow;
      archNote.textContent = data.note;
      archModal.classList.add('is-open');
      archModal.setAttribute('aria-hidden', 'false');
    });
  });

  archModal.querySelectorAll('[data-close-modal="true"]').forEach(el => {
    el.addEventListener('click', closeArchModal);
  });
  if (archClose) archClose.addEventListener('click', closeArchModal);
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeArchModal();
  });
}

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
}, { threshold: 0 });
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
    transition: opacity .3s ease, border-radius .2s ease, width .2s ease, height .2s ease;
    will-change: left, top;
    box-sizing: border-box;
  `;
  document.body.appendChild(el);
  return { el, x: 0, y: 0 };
});

let scrolling = false;
let scrollTimer = null;

mx = window.innerWidth * 0.5;
my = window.innerHeight * 0.5;

document.addEventListener('pointermove', e => {
  mx = e.clientX; my = e.clientY;
  const now = Date.now();
  const dt = now - lastMTime || 16;
  mVelX = (mx - lastMx) / dt;
  mVelY = (my - lastMy) / dt;
  lastMx = mx; lastMy = my; lastMTime = now;

  tail.forEach(t => t.el.style.opacity = '1');
});

setInterval(() => {
  if (Date.now() - lastMTime > 50) { mVelX = 0; mVelY = 0; }
}, 50);

document.addEventListener('pointerleave', () => {
  tail.forEach(t => t.el.style.opacity = '0');
});

// Each dot chases the one ahead of it
const LERPS = [0.28, 0.2, 0.15, 0.11, 0.08, 0.06];
let magneticTarget = null;
let magRect = null;

(function animTail() {
  if (magneticTarget) {
    magRect = magneticTarget.getBoundingClientRect();
  }

  tail.forEach((t, i) => {
    let targetX, targetY;
    
    if (i === 0) {
      if (magneticTarget && magRect) {
        targetX = magRect.left + magRect.width / 2;
        targetY = magRect.top + magRect.height / 2;
        t.el.style.width = magRect.width + 16 + 'px';
        t.el.style.height = magRect.height + 16 + 'px';
        t.el.style.borderRadius = '8px';
        t.el.style.background = 'transparent';
        t.el.style.border = '1px solid #9d6fff';
        t.el.style.mixBlendMode = 'normal';
      } else {
        targetX = mx;
        targetY = my;
        t.el.style.width = '8px';
        t.el.style.height = '8px';
        t.el.style.borderRadius = '50%';
        t.el.style.background = 'rgba(255,255,255,1)';
        t.el.style.border = 'none';
        t.el.style.mixBlendMode = 'normal';
      }
    } else {
      targetX = tail[i - 1].x;
      targetY = tail[i - 1].y;
    }

    const baseFactor = scrolling ? LERPS[i] * 0.62 : LERPS[i];
    const factor = (i === 0 && magneticTarget) ? baseFactor * 1.5 : baseFactor;
    
    t.x += (targetX - t.x) * factor;
    t.y += (targetY - t.y) * factor;
    t.el.style.left = t.x + 'px';
    t.el.style.top  = t.y + 'px';
  });
  requestAnimationFrame(animTail);
})();

window.addEventListener('scroll', () => {
  scrolling = true;
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => { scrolling = false; }, 120);
}, { passive: true });

// Magnetic snapping on hover
document.querySelectorAll('a, button, .proj-card-h, .skill-pill, .frag-1, .frag-2, .frag-3, .frag-4').forEach(el => {
  el.addEventListener('mouseenter', () => {
    magneticTarget = el;
  });
  el.addEventListener('mouseleave', () => {
    if (magneticTarget === el) magneticTarget = null;
  });
});

// ── Boot Lab ──────────────────────────────────────────────────────
document.querySelectorAll('.boot-lab').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    isLabMode = true;
    document.body.classList.add('lab-mode');
    particles.forEach(p => {
      p.vx = (Math.random() - 0.5) * 4;
      p.vy = (Math.random() - 0.5) * 4;
    });
  });
});

const exitLabBtn = document.getElementById('exitLabBtn');
if(exitLabBtn) {
  exitLabBtn.addEventListener('click', () => {
    isLabMode = false;
    document.body.classList.remove('lab-mode');
  });
}

// ── Smooth scroll ─────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });
});

// ── Spacebar jump navigation ──────────────────────────────────────
const jumpSections = ['hero', 'projects', 'case-study', 'about', 'thinking', 'contact']
  .map(id => document.getElementById(id))
  .filter(Boolean);

document.addEventListener('keydown', e => {
  if (e.code !== 'Space') return;
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
  const typing = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);
  if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault();

  if (!jumpSections.length) return;
  const marker = window.scrollY + window.innerHeight * 0.28;
  let next = jumpSections.find(section => section.offsetTop > marker);
  if (!next) next = jumpSections[0];
  next.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
