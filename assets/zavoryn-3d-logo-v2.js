(() => {
  'use strict';

  const boot = () => {
    const hero = document.querySelector('.hero-premium');
    const grid = document.querySelector('.hero-premium-grid');
    const frame = document.querySelector('.hero-system-frame');
    if (!hero || !grid || !frame || frame.dataset.zavoryn3d === 'audited') return;
    frame.dataset.zavoryn3d = 'audited';

    const copy = grid.children[0];
    if (!copy) return;
    copy.classList.add('hero-copy-runtime');

    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
    const lerp = (a, b, t) => a + (b - a) * t;
    const range = (v, a, b) => ease((v - a) / Math.max(0.0001, b - a));
    const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const isMobile = () => window.innerWidth <= 640;

    const paths = [
      'M173 116H410L356 170V238L286 310H216L342 177H112Z',
      'M216 204H286L161 336H148V273Z',
      'M148 343H389L327 397H94Z'
    ];
    const polygons = [
      [[112,116],[410,116],[356,170],[356,238],[286,310],[216,310],[342,177],[112,177]],
      [[216,204],[286,204],[161,336],[148,336],[148,273]],
      [[148,343],[389,343],[327,397],[94,397]]
    ];
    const svg = path => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#f5f6ef" d="' + path + '"/></svg>');

    frame.innerHTML = '<div class="hero-3d-stage" data-stage>' +
      '<div class="hero-logo-scene" data-scene><div class="hero-logo-depth" data-depth></div></div>' +
      '<canvas class="hero-particle-canvas" data-particles aria-hidden="true"></canvas>' +
      '<div class="hero-3d-hud"><span>ZAVORYN / <strong>IDENTITY IN MOTION</strong></span><span data-state>ARRIVING</span></div>' +
      '<div class="hero-3d-footer"><span>SCROLL TO TRANSFORM</span><span data-count>01 — 05</span></div>' +
      '<div class="hero-3d-wordmark">ZAVORYN</div>' +
      '<div class="hero-scroll-meter" data-meter><i class="hero-scroll-dot"></i></div>' +
      '</div>';

    const scene = frame.querySelector('[data-scene]');
    const depth = frame.querySelector('[data-depth]');
    const canvas = frame.querySelector('[data-particles]');
    const state = frame.querySelector('[data-state]');
    const count = frame.querySelector('[data-count]');
    const meter = frame.querySelector('[data-meter]');
    const ctx = canvas.getContext('2d', { alpha: true });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const parts = paths.map((path, index) => {
      const part = document.createElement('div');
      part.className = 'hero-logo-part';
      part.dataset.part = String(index);
      const source = svg(path);
      for (let layer = 0; layer < 8; layer += 1) {
        const image = document.createElement('img');
        image.className = 'hero-logo-layer' + (layer === 7 ? ' is-face' : '');
        image.src = source;
        image.alt = '';
        image.draggable = false;
        image.style.transform = 'translateZ(' + ((layer - 7) * 3) + 'px)';
        if (layer < 7) {
          image.style.opacity = String(0.035 + layer * 0.014);
          image.style.filter = 'brightness(' + (0.66 + layer * 0.035) + ')';
        }
        part.appendChild(image);
      }
      depth.appendChild(part);
      return part;
    });

    const inside = (point, polygon) => {
      let result = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect = ((yi > point[1]) !== (yj > point[1])) && (point[0] < (xj - xi) * (point[1] - yi) / ((yj - yi) || 0.0001) + xi);
        if (intersect) result = !result;
      }
      return result;
    };

    const particles = [];
    const step = isMobile() ? 7 : 5;
    let particleIndex = 0;
    polygons.forEach(polygon => {
      for (let y = 80; y <= 430; y += step) {
        for (let x = 70; x <= 430; x += step) {
          if (!inside([x, y], polygon)) continue;
          const bx = (x - 256) * 1.35;
          const by = (256 - y) * 1.35;
          const angle = Math.atan2(by, bx) + (hash(particleIndex + 4) - 0.5) * 1.3;
          const distance = 90 + hash(particleIndex + 8) * 240 + Math.hypot(bx, by) * 0.2;
          particles.push({
            bx, by, bz: (hash(particleIndex + 2) - 0.5) * 26,
            dx: bx + Math.cos(angle) * distance + (hash(particleIndex + 5) - 0.5) * 80,
            dy: by + Math.sin(angle) * distance + (hash(particleIndex + 6) - 0.5) * 80,
            dz: (hash(particleIndex + 7) - 0.5) * 340,
            seed: hash(particleIndex + 9)
          });
          particleIndex += 1;
        }
      }
    });

    let target = 0;
    let current = 0;
    let last = 0;
    let width = 1;
    let height = 1;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const readScroll = () => {
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(1, hero.offsetHeight - window.innerHeight);
      target = clamp(-rect.top / travel);
    };

    const moveCopy = p => {
      if (isMobile()) {
        copy.style.transform = 'translate3d(0,-50%,0)';
        copy.style.opacity = String(p < 0.08 ? lerp(0.25, 1, range(p, 0, 0.08)) : 1);
        return;
      }
      let x = 0;
      let y = -50;
      if (p < 0.23) {
        x = 0;
        y = -50;
      } else if (p < 0.46) {
        const t = range(p, 0.23, 0.46);
        x = lerp(0, Math.min(window.innerWidth * 0.42, 470), t);
        y = lerp(-50, -43, t);
      } else if (p < 0.70) {
        const t = range(p, 0.46, 0.70);
        x = lerp(Math.min(window.innerWidth * 0.42, 470), 0, t);
        y = lerp(-43, -52, t);
      } else if (p < 0.90) {
        const t = range(p, 0.70, 0.90);
        x = lerp(0, Math.min(window.innerWidth * 0.38, 420), t);
        y = lerp(-52, -46, t);
      } else {
        const t = range(p, 0.90, 1);
        x = lerp(Math.min(window.innerWidth * 0.38, 420), 0, t);
        y = -50;
      }
      copy.style.transform = 'translate3d(' + x + 'px,' + y + '%,0)';
      copy.style.opacity = '1';
    };

    const drawParticles = (p, time) => {
      ctx.clearRect(0, 0, width, height);
      if (reduced) return;
      const dis = range(p, 0.30, 0.60);
      const re = range(p, 0.67, 0.92);
      const active = Math.max(0, Math.min(dis, 1 - re));
      const scale = Math.min(width, height) / 820;
      const shift = isMobile() ? 0 : (p < 0.42 ? width * 0.16 : p < 0.70 ? -width * 0.18 : -width * 0.04);
      const cx = width / 2 + shift;
      const cy = height / 2;
      if (active <= 0.001 && re <= 0.001) return;
      particles.forEach(point => {
        const x = lerp(lerp(point.bx, point.dx, active), point.bx, re);
        const y = lerp(lerp(point.by, point.dy, active), point.by, re);
        const z = lerp(lerp(point.bz, point.dz, active), point.bz, re);
        const depthScale = 1 + z / 900;
        const wobble = Math.sin(time * 0.001 + point.seed * 50) * active * 4;
        const sx = cx + x * scale * depthScale + wobble;
        const sy = cy - y * scale * depthScale + wobble * 0.6;
        const alpha = clamp(active * 0.95 + re * 0.24) * 0.9;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(245,246,239,' + alpha.toFixed(3) + ')';
        ctx.arc(sx, sy, 1.1 + point.seed * 1.4, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const update = (p, time) => {
      const dis = range(p, 0.30, 0.60);
      const re = range(p, 0.67, 0.92);
      const phase = p < 0.16 ? 'intro' : p < 0.43 ? 'move-right' : p < 0.68 ? 'disintegrate' : p < 0.92 ? 'reassemble' : 'final';
      grid.dataset.phase = phase;
      copy.dataset.scrollPhase = phase;

      let x = 0, y = 0, scale = 1, rx = 0, ry = 0, rz = 0;
      if (isMobile()) {
        x = 0;
        y = lerp(-window.innerHeight * 0.10, window.innerHeight * 0.08, ease(p));
        scale = lerp(0.72, 0.98, ease(p));
        ry = lerp(-0.25, Math.PI * 2, p);
      } else if (p < 0.12) {
        const t = range(p, 0, 0.12); x = lerp(0, window.innerWidth * 0.16, t); y = lerp(-window.innerHeight * 0.95, 0, t); scale = lerp(0.42, 1, t); ry = lerp(-0.7, 0, t); rx = lerp(0.24, 0, t);
      } else if (p < 0.38) {
        const t = range(p, 0.12, 0.38); x = lerp(window.innerWidth * 0.16, window.innerWidth * 0.23, t); y = lerp(0, window.innerHeight * 0.03, t); scale = lerp(1, 0.94, t); ry = lerp(0, 0.95, t); rx = lerp(0, 0.08, t);
      } else if (p < 0.60) {
        const t = range(p, 0.38, 0.60); x = lerp(window.innerWidth * 0.23, -window.innerWidth * 0.23, t); y = lerp(window.innerHeight * 0.03, window.innerHeight * 0.06, t); scale = lerp(0.94, 0.78, t); ry = lerp(0.95, 2.55, t); rx = lerp(0.08, -0.10, t); rz = lerp(0.04, 0.10, t);
      } else if (p < 0.78) {
        const t = range(p, 0.60, 0.78); x = lerp(-window.innerWidth * 0.23, -window.innerWidth * 0.15, t); y = lerp(window.innerHeight * 0.06, -window.innerHeight * 0.08, t); scale = lerp(0.78, 0.86, t); ry = lerp(2.55, 3.65, t); rx = lerp(-0.10, 0.11, t); rz = lerp(0.10, -0.04, t);
      } else if (p < 0.94) {
        const t = range(p, 0.78, 0.94); x = lerp(-window.innerWidth * 0.15, window.innerWidth * 0.12, t); y = lerp(-window.innerHeight * 0.08, 0, t); scale = lerp(0.86, 1.02, t); ry = lerp(3.65, 5.35, t); rx = lerp(0.11, -0.05, t); rz = lerp(-0.04, 0.02, t);
      } else {
        const t = range(p, 0.94, 1); x = lerp(window.innerWidth * 0.12, 0, t); y = lerp(0, -window.innerHeight * 0.01, t); scale = lerp(1.02, 1.08, t); ry = lerp(5.35, Math.PI * 2, t); rx = lerp(-0.05, 0, t); rz = lerp(0.02, 0, t);
      }

      scene.style.transform = 'translate3d(calc(-50% + ' + x + 'px),calc(-50% + ' + y + 'px),0) scale(' + scale + ') rotateX(' + rx + 'rad) rotateY(' + ry + 'rad) rotateZ(' + rz + 'rad)';
      scene.style.opacity = String(clamp(1 - dis * 1.12 + re * 1.2));
      scene.style.filter = 'drop-shadow(0 0 ' + (12 + dis * 55) + 'px rgba(200,255,34,' + (0.05 + dis * 0.10) + '))';

      const separation = range(p, 0.34, 0.60) * (1 - range(p, 0.68, 0.86));
      const targets = [{x:-68,y:-26,z:45,rx:-0.08,ry:0.10,rz:-0.04},{x:22,y:38,z:-30,rx:0.12,ry:-0.12,rz:0.05},{x:68,y:-22,z:36,rx:-0.10,ry:0.08,rz:0.02}];
      parts.forEach((part, i) => {
        const t = targets[i];
        part.style.transform = 'translate3d(' + t.x * separation + 'px,' + t.y * separation + 'px,' + t.z * separation + 'px) rotateX(' + t.rx * separation + 'rad) rotateY(' + t.ry * separation + 'rad) rotateZ(' + t.rz * separation + 'rad)';
        part.style.opacity = String(clamp(1 - dis * 1.15 + re * 1.3));
      });

      drawParticles(p, time);
      meter.style.setProperty('--meter', (p * 100).toFixed(2) + '%');
      count.textContent = phase === 'intro' ? '01 — 05' : phase === 'move-right' ? '02 — 05' : phase === 'disintegrate' ? '03 — 05' : phase === 'reassemble' ? '04 — 05' : '05 — 05';
      state.textContent = phase === 'intro' ? 'ARRIVING' : phase === 'move-right' ? 'ROTATING' : phase === 'disintegrate' ? 'BREAKING APART' : phase === 'reassemble' ? 'REBUILDING' : 'COMPLETE';
    };

    resize();
    readScroll();
    window.addEventListener('resize', () => { resize(); readScroll(); }, { passive: true });
    window.addEventListener('scroll', readScroll, { passive: true });

    const frameLoop = time => {
      const dt = Math.min(0.05, (time - last) / 1000 || 0.016);
      last = time;
      if (reduced) current = 0;
      else current += (target - current) * (1 - Math.pow(0.0008, dt));
      moveCopy(current);
      update(current, time);
      window.requestAnimationFrame(frameLoop);
    };

    moveCopy(0);
    update(0, 0);
    window.requestAnimationFrame(frameLoop);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
