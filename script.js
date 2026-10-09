/* وجهك حلو — محرك السرد. بلا مكتبات. كل حركة هنا تحمل معنى، وإلا حُذفت. */
(() => {
  'use strict';
  const doc = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  /* كل لون يأتي من توكن في :root (قاعدة 10.7) */
  const tok = n => getComputedStyle(doc).getPropertyValue(n).trim();
  const map = (v, a, b) => clamp((v - a) / (b - a));
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (rm) doc.classList.add('rm');
  if (location.hash === '#dev') doc.classList.add('dev');

  /* ───── الصوت: اختياري ومغلق افتراضياً ───── */
  const snd = { on: false, ctx: null, room: null, level: 1 };
  const sndBtn = $('.snd');
  function startAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    snd.ctx = snd.ctx || new AC();
    if (!snd.room) {
      const c = snd.ctx, n = c.sampleRate * 3, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; }
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = .5;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(c.destination); src.start();
      snd.room = g;
    }
    snd.ctx.resume();
    return true;
  }
  function roomLevel(v) {
    snd.level = v;
    if (snd.room && snd.on) snd.room.gain.setTargetAtTime(.05 * v, snd.ctx.currentTime, .6);
  }
  function tick() {
    if (!snd.on || !snd.ctx) return;
    const c = snd.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = 1500 + Math.random() * 400;
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(.03, c.currentTime + .004);
    g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + .09);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + .1);
  }
  sndBtn.addEventListener('click', () => {
    if (!snd.on) { if (!startAudio()) return; snd.on = true; roomLevel(snd.level); }
    else { snd.on = false; snd.room && snd.room.gain.setTargetAtTime(0, snd.ctx.currentTime, .2); }
    sndBtn.setAttribute('aria-pressed', String(snd.on));
    $('span', sndBtn).textContent = snd.on ? 'الصوت مفتوح' : 'الصوت مغلق';
    sndBtn.setAttribute('aria-label', snd.on ? 'إيقاف الصوت' : 'تشغيل الصوت');
  });

  /* ───── الظهور عند الوصول ───── */
  const lines = $$('.line');
  if (rm) lines.forEach(l => l.classList.add('on'));
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); }
    }), { threshold: .35, rootMargin: '0px 0px -8% 0px' });
    lines.forEach((l, i) => {
      l.style.transitionDelay = (l.closest('.wrap') ? [...l.parentNode.children].indexOf(l) * 0.28 : 0) + 's';
      io.observe(l);
    });
  }

  /* ───── عدّ النقود: يتقدم بتقدم التمرير ───── */
  const tallyEl = $('.tally');
  const pieces = [['coin'], ['note', -4], ['coin'], ['coin'], ['note c', 3], ['coin'], ['note', 5], ['coin'], ['coin'], ['note c', -3], ['coin']]
    .map(([cls, r]) => { const b = document.createElement('b'); b.className = cls.includes('note') ? cls : 'coin'; if (r) b.style.setProperty('--r', r + 'deg'); tallyEl.appendChild(b); return b; });
  if (rm) pieces.forEach(b => b.classList.add('on'));

  /* ───── الزجاج المبخَّر ───── */
  const fogCanvas = $('.fog');
  const fog = (() => {
    if (rm || !fogCanvas) return null;
    const ctx = fogCanvas.getContext('2d');
    let w = 0, h = 0, dpr = Math.min(devicePixelRatio || 1, 1.5), vis = true, last = null;
    function paintFog() {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = tok('--sc-fog'); ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 28; i++) {
        const x = Math.random() * w, y = Math.random() * h, r = (.12 + Math.random() * .22) * Math.max(w, h);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, tok('--sc-fog-cloud-0')); g.addColorStop(1, tok('--sc-fog-cloud-1'));
        ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
    function size() {
      const r = fogCanvas.getBoundingClientRect(); w = fogCanvas.width = Math.max(1, r.width * dpr); h = fogCanvas.height = Math.max(1, r.height * dpr); paintFog();
    }
    function wipe(x, y, r = 46) {
      ctx.globalCompositeOperation = 'destination-out';
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * dpr);
      g.addColorStop(0, tok('--sc-erase-0')); g.addColorStop(.6, tok('--sc-erase-1')); g.addColorStop(1, tok('--sc-erase-2'));
      ctx.fillStyle = g; ctx.fillRect(x - r * dpr, y - r * dpr, r * 2 * dpr, r * 2 * dpr);
    }
    function stroke(x0, y0, x1, y1, r) {
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (r * dpr * .4)));
      for (let i = 0; i <= n; i++) wipe(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, r);
    }
    size(); addEventListener('resize', size);
    /* إصبع يمسح الزجاج مرة عند الفتح: يكشف مكان العنوان */
    const t0 = performance.now() + 500;
    (function auto(t) {
      const k = clamp((t - t0) / 1500);
      if (k > 0 && k <= 1) {
        const x = w * (.86 - .72 * k), y = h * (.5 + Math.sin(k * 5) * .035);
        if (last) stroke(last[0], last[1], x, y, 70); last = [x, y];
      }
      if (t - t0 < 1700) requestAnimationFrame(auto);
    })(performance.now());
    /* يمسحه الزائر بإصبعه أو مؤشره، ويعود البخار ببطء */
    let down = false, prev = null;
    const pos = e => { const r = fogCanvas.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; };
    fogCanvas.addEventListener('pointerdown', e => { down = true; prev = pos(e); });
    fogCanvas.addEventListener('pointermove', e => {
      if (!(down || e.pointerType === 'mouse')) return;
      const p = pos(e); if (prev) stroke(prev[0], prev[1], p[0], p[1], 46); prev = p;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => fogCanvas.addEventListener(t, () => { down = false; prev = null; }));
    new IntersectionObserver(es => vis = es[0].isIntersecting).observe(fogCanvas);
    setInterval(() => {
      if (!vis || document.hidden) return;
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = tok('--sc-fog-regrow'); ctx.fillRect(0, 0, w, h);
    }, 220);
    return fogCanvas;
  })();

  /* ───── الساعة على شاشة الهاتف: وقت الزائر الآن ───── */
  const clock = $('.clock'), dateEl = $('.date');
  try {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString('ar-SY', { hour: 'numeric', minute: '2-digit', hour12: false });
    dateEl.textContent = now.toLocaleDateString('ar-SY', { weekday: 'long' });
  } catch (e) { clock.textContent = ''; }

  /* ───── المشاهد اللاصقة ───── */
  const pins = $$('.pin').map(el => {
    const len = +el.dataset.len || 200;
    if (!rm) el.style.height = (len + 100) + 'dvh';
    return { el, stage: $('.stage', el), steps: $$('.step', el), id: el.id, state: {} };
  });
  if (rm) pins.forEach(p => p.steps.forEach(s => s.classList.add('on')));

  const handlers = {
    s0(p, k) {
      const t = map(k, .05, .85);
      /* على عناصر العنوان مباشرة: تغيير المتغير على القسم يعيد حساب أنماط شجرته كلها */
      const ho = String(1 - t), hb = (t * 9).toFixed(1) + 'px';
      (p.state.heads ||= $$('.title,.sub,.hint,.cue', p.el)).forEach(h => {
        h.style.setProperty('--ho', ho);
        h.style.setProperty('--hb', hb);
      });
      if (fog) fog.style.opacity = String(1 - map(k, .1, .95));
    },
    s3(p, k) {
      const n = Math.round(map(k, .22, .9) * pieces.length);
      pieces.forEach((b, i) => b.classList.toggle('on', i < n));
      if (n !== p.state.n && n > (p.state.n || 0)) tick();
      p.state.n = n;
    },
    s5(p, k) {
      /* الصمت: لا نص ولا رنين ولا صوت غرفة بين دخول المكالمة وإيماءة الرأس */
      roomLevel(k > .08 && k < .72 ? 0 : 1);
      if (k > .7 && !p.state.nod) { p.state.nod = true; $('.plate', p.stage).classList.add('nod'); }
      if (k < .5 && p.state.nod) { p.state.nod = false; $('.plate', p.stage).classList.remove('nod'); }
    },
    s6(p, k) {
      p.el.classList.toggle('no-wrapped', !$('img.wrapped', p.el));
      p.el.style.setProperty('--wx', map(k, .55, .8).toFixed(3));
      p.el.style.setProperty('--fold', map(k, .5, .85).toFixed(3));
      p.el.style.setProperty('--pw', (map(k, .46, .56) * (1 - map(k, .94, 1))).toFixed(3));
    },
    s7(p, k) {
      p.el.style.setProperty('--vp', map(k, .1, .8).toFixed(3));
    },
    s8(p, k) {
      const ph = k < .2 ? 0 : k < .4 ? 1 : k < .56 ? 2 : 3;
      if (p.stage.dataset.ph !== String(ph)) p.stage.dataset.ph = String(ph);
      /* الرجوع للخلف: لقطة المكالمة تومض ثانية بالأبيض والأسود ثم تنطفئ */
      const rw = map(k, .4, .46) * (1 - map(k, .5, .56));
      p.el.style.setProperty('--rw', rw.toFixed(3));
    },
  };

  /* ───── حلقة التمرير ───── */
  let ticking = false;
  const vh = () => innerHeight;
  function frame() {
    ticking = false;
    const y = scrollY, H = vh();
    if (!rm) {
      pins.forEach(p => {
        const r = p.el.getBoundingClientRect();
        if (r.bottom < -H || r.top > H * 2) return;
        const k = clamp(-r.top / (r.height - H));
        p.steps.forEach(s => {
          const at = +s.dataset.at, until = s.dataset.until ? +s.dataset.until : 2;
          s.classList.toggle('on', k >= at && k < until);
          s.classList.toggle('off', k >= until);
        });
        (handlers[p.id] || (() => {}))(p, k);
      });
    }
    /* الدفء يخرج إلى الشارع حين يخرج الرجل */
    const s7 = $('#s7').getBoundingClientRect();
    document.body.classList.toggle('warm', s7.top < H * .35);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();

  /* ───── عارض الصور: Esc يغلق ويعيد التركيز، واليمين للسابق في العربية ───── */
  (() => {
    const box = $('.lb'), openBtn = $('.lb-open');
    if (!box || !openBtn) return;
    const seen = new Set();
    const items = $$('img[data-title]').filter(i => !i.classList.contains('eagle') && !seen.has(i.getAttribute('src')) && seen.add(i.getAttribute('src')))
      .map(i => ({ src: i.getAttribute('src'), title: i.dataset.title, desc: i.dataset.desc, alt: i.getAttribute('alt') || i.dataset.desc }));
    const img = $('.lb-img', box), ttl = $('.lb-title', box), dsc = $('.lb-desc', box), cnt = $('.lb-count', box);
    let i = 0, opener = null;
    const show = n => {
      i = (n + items.length) % items.length;
      const it = items[i];
      img.src = it.src; img.alt = it.alt; ttl.textContent = it.title; dsc.textContent = it.desc;
      cnt.textContent = (i + 1) + ' / ' + items.length;
    };
    const open = () => { opener = document.activeElement; box.hidden = false; show(0); $('.lb-close', box).focus(); };
    const close = () => { box.hidden = true; if (opener) opener.focus(); };
    openBtn.addEventListener('click', open);
    $('.lb-close', box).addEventListener('click', close);
    $('.lb-prev', box).addEventListener('click', () => show(i - 1));
    $('.lb-next', box).addEventListener('click', () => show(i + 1));
    box.addEventListener('click', e => { if (e.target === box) close(); });
    addEventListener('keydown', e => {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(i - 1);
      else if (e.key === 'ArrowLeft') show(i + 1);
      else if (e.key === 'Tab') {
        const f = $$('button', box); const a = document.activeElement;
        if (e.shiftKey && a === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  })();

  /* ───── المشاركة: رابط واحد ───── */
  $('.share').addEventListener('click', async e => {
    const b = e.currentTarget, data = { title: 'وجهك حلو', text: 'حكاية من مطعم فروج مشوي', url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); b.textContent = 'نُسخ الرابط'; setTimeout(() => (b.textContent = 'شارك الحكاية'), 2200); }
    } catch (_) { /* أغلق الزائر النافذة */ }
  });
})();
