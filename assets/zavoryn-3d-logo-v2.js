(() => {
  'use strict';

  const root = document.querySelector('.hero-system-frame');
  const hero = document.querySelector('.hero-premium');
  const grid = document.querySelector('.hero-premium-grid');
  if (!root || !hero || !grid || root.dataset.zavoryn3d === 'ready') return;
  root.dataset.zavoryn3d = 'ready';

  const copy = grid.children[0];
  const art = grid.querySelector('.hero-premium-art') || grid.children[1];

  const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
  const smooth = v => v*v*(3-2*v);
  const lerp = (a,b,t) => a+(b-a)*t;
  const invLerp = (v,a,b) => clamp((v-a)/Math.max(.0001,b-a));
  const ease = v => smooth(clamp(v));
  const hash = n => {
    const x = Math.sin(n*127.1+311.7)*43758.5453;
    return x-Math.floor(x);
  };

  // The Z is constructed from the same three vector paths already used by the brand system.
  const paths = [
    'M173 116H410L356 170V238L286 310H216L342 177H112Z',
    'M216 204H286L161 336H148V273Z',
    'M148 343H389L327 397H94Z'
  ];
  const makeSvg = path =>
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#f5f6ef" d="' +
      path +
      '"/></svg>'
    );

  root.innerHTML =
    '<div class="hero-3d-stage" data-hero-stage>' +
      '<div class="hero-logo-scene" data-logo-scene>' +
        '<div class="hero-logo-depth" data-logo-depth></div>' +
      '</div>' +
      '<canvas class="hero-particle-canvas" data-particles aria-hidden="true"></canvas>' +
      '<div class="hero-3d-hud"><span>ZAVORYN / <strong>IDENTITY IN MOTION</strong></span><span data-state>ARRIVING</span></div>' +
      '<div class="hero-3d-footer"><span>SCROLL TO TRANSFORM</span><span data-count>01 — 05</span></div>' +
      '<div class="hero-3d-wordmark">ZAVORYN</div>' +
      '<div class="hero-scroll-meter" data-meter><i class="hero-scroll-dot"></i></div>' +
    '</div>';

  const stage = root.querySelector('[data-hero-stage]');
  const scene = root.querySelector('[data-logo-scene]');
  const depth = root.querySelector('[data-logo-depth]');
  const particleCanvas = root.querySelector('[data-particles]');
  const stateEl = root.querySelector('[data-state]');
  const countEl = root.querySelector('[data-count]');
  const meter = root.querySelector('[data-meter]');
  const ctx = particleCanvas.getContext('2d', { alpha:true });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  // Build three logo fragments, each with a real CSS 3D extrusion.
  const parts = paths.map((path, index) => {
    const el = document.createElement('div');
    el.className = 'hero-logo-part';
    el.dataset.part = String(index);
    const svg = makeSvg(path);

    for (let layer = 0; layer < 9; layer++) {
      const img = document.createElement('img');
      img.className = 'hero-logo-layer' + (layer === 8 ? ' is-face' : '');
      img.src = svg;
      img.alt = '';
      img.draggable = false;
      img.style.transform = 'translateZ(' + ((layer - 8) * 2.7) + 'px)';
      if (layer < 8) {
        img.style.opacity = String(.035 + layer * .012);
        img.style.filter =
          'brightness(' + (0.68 + layer*.025) + ')' +
          'drop-shadow(0 0 5px rgba(200,255,34,.02))';
      }
      el.appendChild(img);
    }

    depth.appendChild(el);
    return el;
  });

  const particleImage = new Image();
  const sampleSize = 512;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleCanvas.height = sampleSize;
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently:true });
  const particleData = [];
  let particlesReady = false;

  particleImage.onload = () => {
    sampleCtx.clearRect(0,0,sampleSize,sampleSize);
    sampleCtx.drawImage(particleImage,0,0,sampleSize,sampleSize);
    const pixels = sampleCtx.getImageData(0,0,sampleSize,sampleSize).data;
    const step = window.innerWidth < 700 ? 5 : 3;
    const list = [];

    for(let y=0;y<sampleSize;y+=step){
      for(let x=0;x<sampleSize;x+=step){
        if(pixels[(y*sampleSize+x)*4+3] > 90) list.push([x,y]);
      }
    }

    const max = window.innerWidth < 700 ? 2400 : 5200;
    const stride = Math.max(1,Math.ceil(list.length/max));

    for(let i=0;i<list.length;i+=stride){
      const [x,y] = list[i];
      const bx = (x-256)*1.26;
      const by = (256-y)*1.26;
      const radial = Math.sqrt(bx*bx+by*by);
      const theta = Math.atan2(by,bx);
      const depthZ = (hash(i+1)-.5)*22;
      const burst = 90 + hash(i+2)*260 + radial*.28;
      const driftAngle = theta + (hash(i+3)-.5)*1.2;

      particleData.push({
        bx, by, bz:depthZ,
        dx:bx + Math.cos(driftAngle)*burst + (hash(i+4)-.5)*85,
        dy:by + Math.sin(driftAngle)*burst + (hash(i+5)-.5)*85,
        dz:depthZ + (hash(i+6)-.5)*360,
        seed:hash(i+7)
      });
    }

    particlesReady = true;
  };
  particleImage.src = makeSvg('M173 116H410L356 170V238L286 310H216L342 177H112ZM216 204H286L161 336H148V273ZM148 343H389L327 397H94Z');

  let target = 0;
  let progress = 0;
  let lastTime = 0;

  const resizeParticles = () => {
    const rect = particleCanvas.getBoundingClientRect();
    particleCanvas.width = Math.max(1,Math.floor(rect.width*dpr));
    particleCanvas.height = Math.max(1,Math.floor(rect.height*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
  };
  resizeParticles();
  window.addEventListener('resize', resizeParticles, {passive:true});

  const readScroll = () => {
    const rect = hero.getBoundingClientRect();
    const travel = Math.max(1, hero.offsetHeight - window.innerHeight);
    target = clamp((-rect.top) / travel);
  };
  window.addEventListener('scroll', readScroll, {passive:true});
  readScroll();

  const setCopyPosition = p => {
    // 0–1: left → right → left → right → center.
    let x, y, opacity;
    if (p < .20) {
      x = 0;
      y = -50;
      opacity = lerp(.15,1,ease(invLerp(p,0,.10)));
    } else if (p < .45) {
      const t = ease(invLerp(p,.20,.45));
      x = lerp(0, window.innerWidth*.47, t);
      y = lerp(-50,-42,t);
      opacity = 1;
    } else if (p < .70) {
      const t = ease(invLerp(p,.45,.70));
      x = lerp(window.innerWidth*.47, 0, t);
      y = lerp(-42,-54,t);
      opacity = lerp(1,.82,t);
    } else if (p < .90) {
      const t = ease(invLerp(p,.70,.90));
      x = lerp(0, window.innerWidth*.44, t);
      y = lerp(-54,-46,t);
      opacity = lerp(.82,1,t);
    } else {
      const t = ease(invLerp(p,.90,1));
      x = lerp(window.innerWidth*.44, window.innerWidth*.10, t);
      y = lerp(-46,-50,t);
      opacity = 1;
    }

    // Keep the block readable: cross the page only during deliberate choreography.
    copy.style.transform = 'translate3d(' + x + 'px,' + y + '%,' + (p>.43&&p<.75 ? 80 : 0) + 'px)';
    copy.style.opacity = String(opacity);
  };

  const updateParticles = (p, time, opacityFactor, sideShift) => {
    if (!particlesReady || !ctx) return;
    const w = particleCanvas.clientWidth;
    const h = particleCanvas.clientHeight;
    ctx.clearRect(0,0,w,h);

    const dis = ease(invLerp(p,.30,.62));
    const re = ease(invLerp(p,.68,.93));
    const active = Math.max(0,Math.min(dis,1-re));
    const assembleT = re;

    const worldScale = Math.min(w,h) / 820;
    const centerX = w/2 + sideShift;
    const centerY = h/2;

    for(const pt of particleData){
      const wobble = Math.sin(time*.0012 + pt.seed*40) * active * 5;
      const wobbleY = Math.cos(time*.001 + pt.seed*33) * active * 4;
      const x3 = lerp(lerp(pt.bx,pt.dx,active),pt.bx,assembleT);
      const y3 = lerp(lerp(pt.by,pt.dy,active),pt.by,assembleT);
      const z3 = lerp(lerp(pt.bz,pt.dz,active),pt.bz,assembleT) +
        Math.sin(time*.0008 + pt.seed*60)*active*18;

      const depthScale = 1 + z3/850;
      const sx = centerX + (x3*worldScale*depthScale) + wobble;
      const sy = centerY - (y3*worldScale*depthScale) + wobbleY;

      const fade = active*.95 + (1-active)*re*.25;
      const size = 1.15 + pt.seed*1.4;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(245,246,239,' + (fade*opacityFactor*.86).toFixed(3) + ')';
      ctx.arc(sx,sy,size,0,Math.PI*2);
      ctx.fill();
    }
  };

  const updateScene = (p,time) => {
    const eased = ease(p);
    const intro = ease(invLerp(p,0,.12));
    const dis = ease(invLerp(p,.30,.62));
    const re = ease(invLerp(p,.68,.93));
    const assembled = clamp(1-dis+re);
    const phase =
      p < .16 ? 'intro' :
      p < .43 ? 'move-right' :
      p < .69 ? 'disintegrate' :
      p < .92 ? 'reassemble' : 'final';

    grid.dataset.phase = phase;
    copy.dataset.scrollPhase = phase;

    let logoX, logoY, logoScale, rotY, rotX, rotZ;
    if (p < .12) {
      const t = ease(invLerp(p,0,.12));
      logoX = lerp(window.innerWidth*.02, window.innerWidth*.20, t);
      logoY = lerp(-window.innerHeight*.92, -window.innerHeight*.03, t);
      logoScale = lerp(.42,1.0,t);
      rotY = lerp(-.70,0,t);
      rotX = lerp(.24,0,t);
      rotZ = lerp(-.08,0,t);
    } else if (p < .38) {
      const t = ease(invLerp(p,.12,.38));
      logoX = lerp(window.innerWidth*.20, window.innerWidth*.27,t);
      logoY = lerp(-window.innerHeight*.03, window.innerHeight*.03,t);
      logoScale = lerp(1.0,.94,t);
      rotY = lerp(0,.95,t);
      rotX = lerp(0,.08,t);
      rotZ = lerp(0,.04,t);
    } else if (p < .60) {
      const t = ease(invLerp(p,.38,.60));
      logoX = lerp(window.innerWidth*.27,-window.innerWidth*.28,t);
      logoY = lerp(window.innerHeight*.03,window.innerHeight*.07,t);
      logoScale = lerp(.94,.78,t);
      rotY = lerp(.95,2.55,t);
      rotX = lerp(.08,-.10,t);
      rotZ = lerp(.04,.10,t);
    } else if (p < .78) {
      const t = ease(invLerp(p,.60,.78));
      logoX = lerp(-window.innerWidth*.28,-window.innerWidth*.18,t);
      logoY = lerp(window.innerHeight*.07,-window.innerHeight*.10,t);
      logoScale = lerp(.78,.86,t);
      rotY = lerp(2.55,3.65,t);
      rotX = lerp(-.10,.11,t);
      rotZ = lerp(.10,-.04,t);
    } else if (p < .94) {
      const t = ease(invLerp(p,.78,.94));
      logoX = lerp(-window.innerWidth*.18,window.innerWidth*.14,t);
      logoY = lerp(-window.innerHeight*.10,window.innerHeight*.01,t);
      logoScale = lerp(.86,1.04,t);
      rotY = lerp(3.65,5.35,t);
      rotX = lerp(.11,-.05,t);
      rotZ = lerp(-.04,.02,t);
    } else {
      const t = ease(invLerp(p,.94,1));
      logoX = lerp(window.innerWidth*.14,0,t);
      logoY = lerp(window.innerHeight*.01,-window.innerHeight*.01,t);
      logoScale = lerp(1.04,1.10,t);
      rotY = lerp(5.35,Math.PI*2,t);
      rotX = lerp(-.05,0,t);
      rotZ = lerp(.02,0,t);
    }

    scene.style.transform =
      'translate3d(' + logoX + 'px,' + logoY + 'px,0)' +
      'translate(-50%,-50%)' +
      'scale(' + logoScale + ')' +
      'rotateX(' + rotX + 'rad) rotateY(' + rotY + 'rad) rotateZ(' + rotZ + 'rad)';

    // Individual logo fragments separate in physical space while particles take over.
    const partTargets = [
      {x:-58,y:-22,z:45,rx:-.06,ry:.08,rz:-.04},
      {x:18,y:32,z:-28,rx:.12,ry:-.10,rz:.05},
      {x:58,y:-18,z:36,rx:-.09,ry:.06,rz:.02}
    ];
    const separation = ease(invLerp(p,.34,.62)) * (1-ease(invLerp(p,.68,.86)));

    parts.forEach((part,i) => {
      const targetPart = partTargets[i];
      const sx = targetPart.x*separation;
      const sy = targetPart.y*separation;
      const sz = targetPart.z*separation;
      part.style.transform =
        'translate3d(' + sx + 'px,' + sy + 'px,' + sz + 'px)' +
        'rotateX(' + (targetPart.rx*separation) + 'rad)' +
        'rotateY(' + (targetPart.ry*separation) + 'rad)' +
        'rotateZ(' + (targetPart.rz*separation) + 'rad)';
      part.style.opacity = String(clamp(1-dis*1.18+re*1.24,0,1));
    });

    scene.style.opacity = String(clamp(assembled*1.08,0,1));
    scene.style.filter =
      'drop-shadow(0 0 ' + (10+dis*55) + 'px rgba(200,255,34,' + (.04+dis*.10) + '))';

    const sideForParticles =
      p<.38 ? window.innerWidth*.18 :
      p<.70 ? -window.innerWidth*.20 :
      p<.90 ? -window.innerWidth*.06 : 0;

    updateParticles(
      p,
      time,
      clamp(.25 + dis*1.0 + re*.52,0,1),
      sideForParticles
    );

    if(meter) meter.style.setProperty('--meter', (p*100).toFixed(2)+'%');

    countEl.textContent =
      phase==='intro' ? '01 — 05' :
      phase==='move-right' ? '02 — 05' :
      phase==='disintegrate' ? '03 — 05' :
      phase==='reassemble' ? '04 — 05' : '05 — 05';

    stateEl.textContent =
      phase==='intro' ? 'ARRIVING' :
      phase==='move-right' ? 'ROTATING' :
      phase==='disintegrate' ? 'BREAKING APART' :
      phase==='reassemble' ? 'REBUILDING' : 'COMPLETE';
  };

  const frame = time => {
    const delta = Math.min(.05,(time-lastTime)/1000 || .016);
    lastTime = time;
    if(reduceMotion){
      progress = 0;
    }else{
      const follow = 1-Math.pow(.0008,delta);
      progress += (target-progress)*follow;
    }
    setCopyPosition(progress);
    updateScene(progress,time);
    requestAnimationFrame(frame);
  };

  setCopyPosition(0);
  updateScene(0,0);
  requestAnimationFrame(frame);
})();