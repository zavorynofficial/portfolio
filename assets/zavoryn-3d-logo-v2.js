import * as THREE from 'https://esm.sh/three@0.180.0';

(() => {
  'use strict';
  const root = document.querySelector('.hero-system-frame');
  if (!root || root.dataset.zavoryn3d === 'ready') return;
  root.dataset.zavoryn3d = 'ready';

  const paths = [
    'M173 116H410L356 170V238L286 310H216L342 177H112Z',
    'M216 204H286L161 336H148V273Z',
    'M148 343H389L327 397H94Z'
  ];
  const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g fill="#fff">${paths.map(d => `<path d="${d}"/>`).join('')}</g></svg>`;
  root.innerHTML = `<div class="hero-3d-shell" data-3d-shell><canvas class="hero-3d-canvas" aria-label="Interactive three-dimensional ZAVORYN logo" role="img"></canvas><div class="hero-3d-hud"><span>ZAVORYN / <strong>IDENTITY SYSTEM</strong></span><span data-3d-state>ASSEMBLED</span></div><div class="hero-3d-footer"><span>SCROLL TO TRANSFORM</span><span>01 — 04</span></div><div class="hero-3d-fallback" hidden>${SVG}</div></div>`;

  const shell = root.querySelector('[data-3d-shell]');
  const canvas = root.querySelector('.hero-3d-canvas');
  const fallback = root.querySelector('.hero-3d-fallback');
  const stateLabel = root.querySelector('[data-3d-state]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = v => v * v * (3 - 2 * v);
  const range = (v, a, b) => clamp((v - a) / Math.max(0.0001, b - a));
  const lerp = (a, b, t) => a + (b - a) * t;

  const config = {
    white: new THREE.Color('#f5f6ef'),
    lime: new THREE.Color('#c8ff22'),
    depth: 18,
    spread: innerWidth < 700 ? 95 : 145,
    sampleStep: innerWidth < 700 ? 5 : 3,
    particleLimit: innerWidth < 700 ? 2600 : 7600
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (error) {
    shell.classList.add('is-fallback');
    fallback.hidden = false;
    stateLabel.textContent = 'STATIC MODE';
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(27, 1, 1, 2400);
  camera.position.set(0, 0, 760);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 2.1));
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(-220, 280, 480);
  scene.add(key);
  const rim = new THREE.PointLight(0xc8ff22, 8, 950, 2);
  rim.position.set(260, -120, 320);
  scene.add(rim);

  const logoGroup = new THREE.Group();
  const meshGroup = new THREE.Group();
  logoGroup.add(meshGroup);
  scene.add(logoGroup);
  const material = new THREE.MeshStandardMaterial({ color: config.white, roughness: 0.31, metalness: 0.18, side: THREE.DoubleSide, transparent: true });
  const meshes = [];

  paths.forEach(pathData => {
    const shape = new THREE.Shape();
    const commands = pathData.match(/[A-Z][^A-Z]*/g) || [];
    commands.forEach((command, index) => {
      const type = command[0];
      const values = command.slice(1).trim().split(/[ ,]+/).filter(Boolean).map(Number);
      if (type === 'M') shape.moveTo(values[0] - 256, 256 - values[1]);
      if (type === 'L') shape.lineTo(values[0] - 256, 256 - values[1]);
      if (type === 'H') shape.lineTo(values[0] - 256, shape.currentPoint?.y || 0);
      if (type === 'V') shape.lineTo(shape.currentPoint?.x || 0, 256 - values[0]);
      if (type === 'Z') shape.closePath();
      if (index === commands.length - 1) shape.closePath();
    });
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: config.depth, bevelEnabled: true, bevelSegments: 2, bevelSize: 1.8, bevelThickness: 1.8, curveSegments: 3 });
    geometry.translate(0, 0, -config.depth / 2);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    meshGroup.add(mesh);
    meshes.push(mesh);
  });

  const bounds = new THREE.Box3().setFromObject(meshGroup);
  meshGroup.position.sub(bounds.getCenter(new THREE.Vector3()));

  const assembled = [];
  const dispersed = [];
  let particles = null;
  let particleGeometry = null;
  let particleMaterial = null;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleCanvas.height = 512;
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const sampleImage = new Image();

  sampleImage.onload = () => {
    sampleContext.clearRect(0, 0, 512, 512);
    sampleContext.drawImage(sampleImage, 0, 0, 512, 512);
    const pixels = sampleContext.getImageData(0, 0, 512, 512).data;
    const points = [];
    for (let y = 0; y < 512; y += config.sampleStep) {
      for (let x = 0; x < 512; x += config.sampleStep) {
        if (pixels[(y * 512 + x) * 4 + 3] > 90) points.push([x, y]);
      }
    }
    const stride = Math.max(1, Math.ceil(points.length / config.particleLimit));
    for (let i = 0; i < points.length; i += stride) {
      const [x, y] = points[i];
      const base = new THREE.Vector3((x - 256) * 1.22, (256 - y) * 1.22, (Math.random() - 0.5) * config.depth);
      const direction = new THREE.Vector3(base.x, base.y, base.z * 0.25);
      if (direction.lengthSq() < 0.01) direction.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      direction.normalize();
      const target = base.clone().add(direction.multiplyScalar(config.spread * (0.45 + Math.random() * 0.9)));
      target.x += (Math.random() - 0.5) * 75;
      target.y += (Math.random() - 0.5) * 75;
      target.z += (Math.random() - 0.5) * 130;
      assembled.push(base.x, base.y, base.z);
      dispersed.push(target.x, target.y, target.z);
    }
    particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(assembled.slice(), 3));
    particleMaterial = new THREE.PointsMaterial({ color: config.white, size: innerWidth < 700 ? 2.2 : 2.8, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    particles = new THREE.Points(particleGeometry, particleMaterial);
    logoGroup.add(particles);
  };
  sampleImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`;

  const tempColor = new THREE.Color();
  const update = (progress, time) => {
    const p = reduceMotion ? 0 : smooth(progress);
    const disintegrate = smooth(range(p, 0.24, 0.62));
    const reassemble = smooth(range(p, 0.73, 0.98));
    const colorProgress = smooth(range(p, 0.60, 0.98));
    logoGroup.rotation.y = reduceMotion ? 0 : lerp(-0.10, Math.PI * 2.05, p);
    logoGroup.rotation.x = reduceMotion ? 0 : Math.sin(p * Math.PI) * 0.16;
    logoGroup.rotation.z = reduceMotion ? 0 : Math.sin(p * Math.PI * 1.4) * 0.035;
    logoGroup.position.y = reduceMotion ? 0 : Math.sin(time * 0.00055) * 4;
    material.color.copy(config.white).lerp(config.lime, colorProgress);
    material.opacity = clamp(1 - disintegrate * 1.25 + reassemble * 1.25);
    meshGroup.visible = material.opacity > 0.02;

    if (particles && particleGeometry) {
      const positions = particleGeometry.attributes.position.array;
      const amount = Math.min(disintegrate, 1 - reassemble);
      for (let i = 0; i < assembled.length; i += 3) {
        positions[i] = lerp(lerp(assembled[i], dispersed[i], amount), assembled[i], reassemble);
        positions[i + 1] = lerp(lerp(assembled[i + 1], dispersed[i + 1], amount), assembled[i + 1], reassemble);
        positions[i + 2] = lerp(lerp(assembled[i + 2], dispersed[i + 2], amount), assembled[i + 2], reassemble);
      }
      particleGeometry.attributes.position.needsUpdate = true;
      particleMaterial.opacity = reduceMotion ? 0 : clamp(range(p, 0.25, 0.42) * 1.15 - reassemble * 0.6, 0, 0.92);
      tempColor.copy(config.white).lerp(config.lime, colorProgress);
      particleMaterial.color.copy(tempColor);
    }
    stateLabel.textContent = p < 0.25 ? 'ASSEMBLED' : p < 0.63 ? 'DISINTEGRATING' : p < 0.76 ? 'TRANSFORMING' : 'REASSEMBLING';
  };

  const resize = () => {
    const rect = shell.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let target = 0;
  let progress = 0;
  const hero = document.querySelector('.hero-premium');
  const readScroll = () => {
    if (!hero || reduceMotion) return;
    const rect = hero.getBoundingClientRect();
    const travel = Math.max(1, hero.offsetHeight - window.innerHeight * 0.18);
    target = clamp((-rect.top + window.innerHeight * 0.08) / travel);
  };
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  let last = 0;
  const frame = time => {
    const delta = Math.min(0.05, (time - last) / 1000 || 0.016);
    last = time;
    progress += (target - progress) * Math.min(1, delta * 8.5);
    update(progress, time);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  window.addEventListener('pagehide', () => {
    window.removeEventListener('scroll', readScroll);
    window.removeEventListener('resize', resize);
    renderer.dispose();
    particleGeometry?.dispose();
    particleMaterial?.dispose();
    material.dispose();
    meshes.forEach(mesh => mesh.geometry.dispose());
  }, { once: true });
})();
