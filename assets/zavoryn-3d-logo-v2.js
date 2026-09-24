import * as THREE from 'https://esm.sh/three@0.180.0';

(() => {
  'use strict';
  const root = document.querySelector('.hero-system-frame');
  if (!root || root.dataset.zavoryn3d === 'ready') return;
  root.dataset.zavoryn3d = 'ready';

  const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#fff" d="M112 116H410L356 170V238L286 310H216L342 177H112Z"/><path fill="#fff" d="M148 273L216 204H286L161 336H148Z"/><path fill="#fff" d="M148 343H389L327 397H94Z"/></svg>`;
  root.innerHTML = `<div class="hero-3d-shell" data-3d-shell><canvas class="hero-3d-canvas" aria-label="Interactive three-dimensional ZAVORYN logo" role="img"></canvas><div class="hero-3d-hud"><span>ZAVORYN / <strong>IDENTITY SYSTEM</strong></span><span data-3d-state>ASSEMBLED</span></div><div class="hero-3d-footer"><span>SCROLL TO TRANSFORM</span><span>01 — 04</span></div><div class="hero-3d-fallback" hidden>${SVG}</div></div>`;

  const shell = root.querySelector('[data-3d-shell]');
  const canvas = root.querySelector('.hero-3d-canvas');
  const fallback = root.querySelector('.hero-3d-fallback');
  const stateLabel = root.querySelector('[data-3d-state]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = v => v * v * (3 - 2 * v);
  const range = (v, a, b) => clamp((v - a) / (b - a));
  const mix = (a, b, t) => a + (b - a) * t;

  const config = { white: new THREE.Color('#f5f6ef'), lime: new THREE.Color('#c8ff22'), depth: 18, spread: innerWidth < 700 ? 95 : 145, step: innerWidth < 700 ? 5 : 3, limit: innerWidth < 700 ? 2600 : 7600 };
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (error) { shell.classList.add('is-fallback'); fallback.hidden = false; stateLabel.textContent = 'STATIC MODE'; return; }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(27, 1, 1, 2400);
  camera.position.set(0, 0, 760);
  scene.add(new THREE.AmbientLight(0xffffff, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.4); key.position.set(-220, 280, 480); scene.add(key);
  const rim = new THREE.PointLight(0xc8ff22, 9, 950, 2); rim.position.set(260, -120, 320); scene.add(rim);

  const logoGroup = new THREE.Group();
  const meshGroup = new THREE.Group();
  logoGroup.add(meshGroup); scene.add(logoGroup);
  const material = new THREE.MeshStandardMaterial({ color: config.white, roughness: .31, metalness: .18, side: THREE.DoubleSide, transparent: true });
  const meshes = [];
  const polygons = [
    [[112,116],[410,116],[356,170],[356,238],[286,310],[216,310],[342,177],[112,177]],
    [[148,273],[216,204],[286,204],[161,336],[148,343]],
    [[148,343],[389,343],[327,397],[94,397]]
  ];
  polygons.forEach(points => {
    const shape = new THREE.Shape();
    points.forEach(([x,y], i) => { const px = x - 256; const py = 256 - y; if (i === 0) shape.moveTo(px, py); else shape.lineTo(px, py); });
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: config.depth, bevelEnabled: true, bevelSegments: 2, bevelSize: 1.8, bevelThickness: 1.8, curveSegments: 3 });
    geometry.translate(0, 0, -config.depth / 2); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material); meshGroup.add(mesh); meshes.push(mesh);
  });
  const box = new THREE.Box3().setFromObject(meshGroup); meshGroup.position.sub(box.getCenter(new THREE.Vector3()));

  const assembled = [], dispersed = [];
  let particles, particleGeometry, particleMaterial;
  const sampleCanvas = document.createElement('canvas'); sampleCanvas.width = sampleCanvas.height = 512;
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const sampleImage = new Image();
  sampleImage.onload = () => {
    sampleContext.clearRect(0, 0, 512, 512); sampleContext.drawImage(sampleImage, 0, 0, 512, 512);
    const pixels = sampleContext.getImageData(0, 0, 512, 512).data; const points = [];
    for (let y = 0; y < 512; y += config.step) for (let x = 0; x < 512; x += config.step) if (pixels[(y * 512 + x) * 4 + 3] > 90) points.push([x,y]);
    const stride = Math.max(1, Math.ceil(points.length / config.limit));
    for (let i = 0; i < points.length; i += stride) {
      const [x,y] = points[i]; const base = new THREE.Vector3((x - 256) * 1.22, (256 - y) * 1.22, (Math.random() - .5) * config.depth);
      const direction = new THREE.Vector3(base.x, base.y, base.z * .25); if (direction.lengthSq() < .01) direction.set(Math.random()-.5, Math.random()-.5, Math.random()-.5); direction.normalize();
      const target = base.clone().add(direction.multiplyScalar(config.spread * (.45 + Math.random() * .9)));
      target.x += (Math.random() - .5) * 75; target.y += (Math.random() - .5) * 75; target.z += (Math.random() - .5) * 130;
      assembled.push(base.x,base.y,base.z); dispersed.push(target.x,target.y,target.z);
    }
    particleGeometry = new THREE.BufferGeometry(); particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(assembled.slice(), 3));
    particleMaterial = new THREE.PointsMaterial({ color: config.white, size: innerWidth < 700 ? 2.2 : 2.8, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    particles = new THREE.Points(particleGeometry, particleMaterial); logoGroup.add(particles);
  };
  sampleImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`;

  const tempColor = new THREE.Color();
  const update = (progress, time) => {
    const eased = smooth(progress), disintegrate = smooth(range(progress,.24,.62)), reassemble = smooth(range(progress,.73,.98)), colorProgress = smooth(range(progress,.60,.98));
    logoGroup.rotation.y = mix(-.10, Math.PI * 2.05, eased); logoGroup.rotation.x = Math.sin(eased * Math.PI) * .16; logoGroup.rotation.z = Math.sin(eased * Math.PI * 1.4) * .035; logoGroup.position.y = Math.sin(time * .00055) * 4;
    material.color.copy(config.white).lerp(config.lime, colorProgress); material.opacity = clamp(1 - disintegrate * 1.25 + reassemble * 1.25); meshGroup.visible = material.opacity > .02;
    if (particles && particleGeometry) {
      const positions = particleGeometry.attributes.position.array; const amount = Math.min(disintegrate, 1 - reassemble);
      for (let i=0; i<assembled.length; i+=3) { positions[i] = mix(mix(assembled[i],dispersed[i],amount),assembled[i],reassemble); positions[i+1] = mix(mix(assembled[i+1],dispersed[i+1],amount),assembled[i+1],reassemble); positions[i+2] = mix(mix(assembled[i+2],dispersed[i+2],amount),assembled[i+2],reassemble); }
      particleGeometry.attributes.position.needsUpdate = true; particleMaterial.opacity = reducedMotion ? .06 : clamp(range(progress,.25,.42)*1.15 - reassemble*.6,0,.92); tempColor.copy(config.white).lerp(config.lime,colorProgress); particleMaterial.color.copy(tempColor);
    }
    stateLabel.textContent = progress < .25 ? 'ASSEMBLED' : progress < .63 ? 'DISINTEGRATING' : progress < .76 ? 'TRANSFORMING' : 'REASSEMBLING';
  };

  const resize = () => { const rect = shell.getBoundingClientRect(); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8)); renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / Math.max(1, rect.height); camera.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize, { passive: true });
  let target = 0, progress = 0;
  const hero = document.querySelector('.hero-premium');
  const readScroll = () => { if (!hero) return; const rect = hero.getBoundingClientRect(); const travel = Math.max(1, hero.offsetHeight - innerHeight * .18); target = clamp((-rect.top + innerHeight * .08) / travel); };
  addEventListener('scroll', readScroll, { passive: true }); readScroll();
  let last = 0;
  const frame = time => { const delta = Math.min(.05, (time-last)/1000 || .016); last=time; progress += (target-progress)*Math.min(1,delta*8.5); update(progress,time); renderer.render(scene,camera); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
  addEventListener('pagehide', () => { removeEventListener('scroll',readScroll); renderer.dispose(); particleGeometry?.dispose(); particleMaterial?.dispose(); material.dispose(); meshes.forEach(m=>m.geometry.dispose()); }, { once:true });
})();
