// ── Sound system (from alexvictorabraham.com) ─────────────────────────────
let _ctx = null;

function _tone(ctx, t, freq, opts) {
  const { duration=.004, decay=20, filterType='bandpass', filterQ=8, gain=1, randomization=.1 } = opts||{};
  const len = Math.round(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (2 * Math.random() - 1) * Math.exp(-i / decay);
  const filt = ctx.createBiquadFilter();
  filt.type = filterType;
  filt.frequency.value = freq * (1 + (Math.random() - .5) * randomization);
  filt.Q.value = filterQ;
  const g = ctx.createGain(); g.gain.value = gain;
  const src = ctx.createBufferSource(); src.buffer = buf;
  src.connect(filt).connect(g).connect(ctx.destination); src.start(t);
  src.onended = () => { src.disconnect(); filt.disconnect(); g.disconnect(); };
}

const SOUNDS = {
  tap:    (c,t,v) => { _tone(c,t,2800,{duration:.005,decay:30,filterQ:6,gain:.75*(v||1)}); _tone(c,t+.001,4000,{decay:25,gain:1.5*(v||1)}); },
  hover:  (c,t,v) => _tone(c,t,2000,{duration:.003,decay:15,filterQ:4,gain:.4*(v||1)}),
  toggle: (c,t,v) => _tone(c,t,3200,{duration:.004,decay:18,filterQ:7,gain:1.8*(v||1)}),
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

  // ── Orb scroll shrink ────────────────────────────────────────────────
  const orb = document.getElementById('orb');
  if (orb) {
    window.addEventListener('scroll', () => {
      orb.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // ── Theme toggle ─────────────────────────────────────────────────────
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      play('toggle');
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // ── Sound: nav ───────────────────────────────────────────────────────
  document.querySelectorAll('.nav-link').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
    el.addEventListener('pointerdown', () => play('tap'));
  });

  // ── Sound: social ────────────────────────────────────────────────────
  document.querySelectorAll('.social-link').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
    el.addEventListener('pointerdown', () => play('tap'));
  });

  // ── Card hover: video play + mute button ─────────────────────────────
  document.querySelectorAll('.card').forEach(card => {
    const video   = card.querySelector('video');
    const muteBtn = card.querySelector('.mute-btn');
    let hideTimer = null;

    function showMute() {
      clearTimeout(hideTimer);
      card.classList.add('show-mute');
      hideTimer = setTimeout(() => card.classList.remove('show-mute'), 2000);
    }

    card.addEventListener('mouseenter', () => {
      play('hover');
      if (video) video.play().catch(() => {});
      if (muteBtn) showMute();
    });

    card.addEventListener('mouseleave', () => {
      if (video) { video.pause(); video.currentTime = 0; }
      clearTimeout(hideTimer);
      card.classList.remove('show-mute');
    });

    if (muteBtn && video) {
      muteBtn.addEventListener('click', e => {
        e.stopPropagation();
        play('tap');
        video.muted = !video.muted;
        muteBtn.querySelector('.icon-muted').style.display   = video.muted ? '' : 'none';
        muteBtn.querySelector('.icon-unmuted').style.display = video.muted ? 'none' : '';
        showMute();
      });
    }
  });

  // ── Sound: orb + theme btn ───────────────────────────────────────────
  if (orb)      orb.addEventListener('mouseenter', () => play('hover'));
  if (themeBtn) themeBtn.addEventListener('mouseenter', () => play('hover'));

});
