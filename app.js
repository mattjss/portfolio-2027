// ── Sound system (exact copy from alexvictorabraham.com) ──────────────────
let _ctx = null;

function _tone(ctx, t, freq, opts) {
  const { duration=.004, decay=20, filterType='bandpass', filterQ=8, gain=1, randomization=.1 } = opts||{};
  const len=Math.round(ctx.sampleRate*duration), buf=ctx.createBuffer(1,len,ctx.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=(2*Math.random()-1)*Math.exp(-i/decay);
  const filt=ctx.createBiquadFilter(); filt.type=filterType; filt.frequency.value=freq*(1+(Math.random()-.5)*randomization); filt.Q.value=filterQ;
  const g=ctx.createGain(); g.gain.value=gain;
  const src=ctx.createBufferSource(); src.buffer=buf; src.connect(filt).connect(g).connect(ctx.destination); src.start(t);
  src.onended=()=>{src.disconnect();filt.disconnect();g.disconnect();};
}

const SOUNDS = {
  tap:    (c,t,v)=>{ _tone(c,t,2800,{duration:.005,decay:30,filterQ:6,gain:.75*(v||1)}); _tone(c,t+.001,4000,{decay:25,gain:1.5*(v||1)}); },
  hover:  (c,t,v)=>_tone(c,t,2000,{duration:.003,decay:15,filterQ:4,gain:.4*(v||1)}),
  toggle: (c,t,v)=>_tone(c,t,3200,{duration:.004,decay:18,filterQ:7,gain:1.8*(v||1)}),
};

function play(type, vol) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    if (!_ctx) _ctx = new AudioContext();
    if (_ctx.state === 'suspended') _ctx.resume();
    SOUNDS[type](_ctx, _ctx.currentTime, vol);
  } catch(e) {}
}

// ── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── Live time (header) ────────────────────────────────────────────────
  const timeEl = document.getElementById('headerTime');
  if (timeEl) {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      timeEl.textContent = h + ':' + m + ' PST';
    };
    tick(); setInterval(tick, 1000);
  }

  // ── Theme toggle ──────────────────────────────────────────────────────
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      play('toggle');
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
    });
  }

  // ── Mobile menu ───────────────────────────────────────────────────────
  const menuToggle = document.getElementById('menuToggle');
  const dropdown = document.getElementById('dropdown');
  if (menuToggle && dropdown) {
    menuToggle.addEventListener('click', () => {
      play('toggle');
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!menuToggle.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
    // Close on link click
    dropdown.querySelectorAll('.dropdown-link').forEach(link => {
      link.addEventListener('click', () => {
        dropdown.classList.remove('open');
      });
    });
  }

  // ── Smooth scroll for anchor nav links ───────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ── Sound: nav links ─────────────────────────────────────────────────
  document.querySelectorAll('.nav-link, .dropdown-link').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
    el.addEventListener('pointerdown', () => play('tap'));
  });

  // ── Sound: work cards ─────────────────────────────────────────────────
  document.querySelectorAll('.work-card').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
  });
  document.querySelectorAll('.work-card-link').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
    el.addEventListener('pointerdown', () => play('tap'));
  });

  // ── Sound: playground cards ───────────────────────────────────────────
  document.querySelectorAll('.pg-card').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
    el.addEventListener('pointerdown', () => play('tap'));
  });

  // ── Sound: contact items ──────────────────────────────────────────────
  document.querySelectorAll('.contact-item').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
    el.addEventListener('pointerdown', () => play('tap'));
  });

  // ── Sound: theme toggle hover ─────────────────────────────────────────
  if (themeBtn) {
    themeBtn.addEventListener('mouseenter', () => play('hover'));
  }

});
