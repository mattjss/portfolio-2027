// ── Sound system ──────────────────────────────────────────────────────────
let _ctx = null;

function _tone(ctx, t, freq, opts) {
  const { duration = .004, decay = 20, filterType = 'bandpass', filterQ = 8, gain = 1, randomization = .1 } = opts || {};
  const len = Math.round(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (2 * Math.random() - 1) * Math.exp(-i / decay);
  const filt = ctx.createBiquadFilter();
  filt.type = filterType;
  filt.frequency.value = freq * (1 + (Math.random() - .5) * randomization);
  filt.Q.value = filterQ;
  const g = ctx.createGain();
  g.gain.value = gain;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(filt).connect(g).connect(ctx.destination);
  src.start(t);
  src.onended = () => { src.disconnect(); filt.disconnect(); g.disconnect(); };
}

const SOUNDS = {
  press:  (c,t,v) => _tone(c,t,2800,{duration:.005,decay:30,filterQ:6,gain:1.5*(v||1)}),
  click:  (c,t,v) => _tone(c,t,4000,{decay:25,gain:3*(v||1)}),
  tap:    (c,t,v) => { _tone(c,t,2800,{duration:.005,decay:30,filterQ:6,gain:.75*(v||1)}); _tone(c,t+.001,4000,{decay:25,gain:1.5*(v||1)}); },
  hover:  (c,t,v) => _tone(c,t,2000,{duration:.003,decay:15,filterQ:4,gain:.4*(v||1)}),
  select: (c,t,v) => _tone(c,t,2000,{duration:.006,decay:30,filterQ:5,gain:1.2*(v||1)}),
  toggle: (c,t,v) => _tone(c,t,3200,{duration:.004,decay:18,filterQ:7,gain:1.8*(v||1)}),
  tick:   (c,t,v) => _tone(c,t,3200,{duration:.002,decay:12,filterQ:8,gain:.8*(v||1)}),
};

function play(type, vol) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    if (!_ctx) _ctx = new AudioContext();
    if (_ctx.state === 'suspended') _ctx.resume();
    SOUNDS[type](_ctx, _ctx.currentTime, vol);
  } catch(e) {}
}

// ── Theme init (also runs inline before body; this handles post-load) ──────
function getResolvedTheme() {
  const t = localStorage.getItem('theme') || 'system';
  return t === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : t;
}

// ── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Mark active nav link
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .dropdown-link').forEach(el => {
    const href = el.getAttribute('href') || '';
    if (href === path || (path === 'index.html' && href === './') || (path === '' && href === 'index.html')) {
      el.classList.add('active');
    }
  });

  // ── Theme toggle ──────────────────────────────────────────────────────
  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      play('toggle');
      const next = getResolvedTheme() === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
    });
  }

  // ── Live time ─────────────────────────────────────────────────────────
  const timeEl = document.querySelector('.live-time-text');
  if (timeEl) {
    const tick = () => { timeEl.textContent = new Date().toISOString(); };
    tick(); setInterval(tick, 1000);
  }

  // ── Logo shrink on scroll ─────────────────────────────────────────────
  const logoSvg = document.querySelector('.logo-svg');
  if (logoSvg) {
    const BASE = 32, MIN = 20;
    window.addEventListener('scroll', () => {
      const s = Math.round(BASE - (BASE - MIN) * Math.min(scrollY / 200, 1));
      logoSvg.style.width = s + 'px';
      logoSvg.style.height = s + 'px';
    }, { passive: true });
  }

  // ── Mobile menu ───────────────────────────────────────────────────────
  const toggle = document.querySelector('.menu-toggle');
  const dropdown = document.querySelector('.dropdown');
  if (toggle && dropdown) {
    toggle.addEventListener('click', () => {
      play('toggle');
      const open = dropdown.classList.toggle('open');
      toggle.classList.toggle('open', open);
    });
    document.addEventListener('click', e => {
      if (!toggle.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
        toggle.classList.remove('open');
      }
    });
  }

  // ── About: 3D tilt card ───────────────────────────────────────────────
  const imgWrap = document.querySelector('.about-image-wrap');
  const profileImg = document.querySelector('.about-profile-img');
  if (imgWrap && profileImg) {
    imgWrap.addEventListener('mousemove', e => {
      const r = imgWrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      profileImg.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
    });
    imgWrap.addEventListener('mouseleave', () => {
      profileImg.style.transform = '';
    });
  }

  // ── Sound: all interactive elements ──────────────────────────────────
  document.querySelectorAll('.logo').forEach(el => {
    el.addEventListener('pointerdown', () => play('tap'));
  });
  document.querySelectorAll('.nav-link, .dropdown-link').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
    el.addEventListener('pointerdown', () => play('tap'));
  });
  document.querySelectorAll('.work-item, .archive-item, .pg-link, .pg-featured-link').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
    el.addEventListener('pointerdown', () => play('tap'));
  });
  document.querySelectorAll('.contact-link, .social-link').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
    el.addEventListener('pointerdown', () => play('tap'));
  });
  document.querySelectorAll('.filter-btn').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
    el.addEventListener('click', () => play('select'));
  });
});
