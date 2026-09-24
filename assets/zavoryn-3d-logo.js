import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { SVGLoader } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/SVGLoader.js';

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

  const config = {
    accent: new THREE.Color('#c8ff22'),
    white: new THREE.Color('#f5f6ef'),
    depth: 18,
    particleStep: window.innerWidth < 700 ? 5 : 3,
    particleLimit: window.innerWidth < 700 ? 2600 : 7600,
    spread: window.innerWidth < 700 ? 95 : 145,
    cameraZ: 760,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.8)
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (error) {
    shell.classList.add('is-fallback');
    fallback.hidden = false;
    stateLabel.textContent = 'STATIC MODE';
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(27, 1, 1, 2400);
  camera.position.set(0, 0, config.cameraZ);

  const ambient = new THREE.AmbientLight(0xffffff, 2.3);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 3.6);
  key.position.set(-220, 280, 480);
  scene.add(key);
  const rim = new THREE.PointLight(0xc8ff22, 9, 950, 2);
  rim.position.set(260, -120, 320);
  scene.add(rim);

  const logoGroup = new THREE.Group();
  const meshGroup = new THREE.Group();
  logoGroup.add(meshGroup);
  scene.add(logoGroup);

  const svgLoader = new SVGLoader();
  const svgData = svgLoader.parse(SVG);
  const meshMaterial = new THREE.MeshStandardMaterial({ color: config.white, roughness: .31, metalness: .18, side: THREE.DoubleSide });
  const meshes = [];

  svgData.paths.forEach(path => {
    const shapes = SVGLoader.createShapes(path);
    shapes.forEach(shape => {
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: config.depth, bevelEnabled: true, bevelSegments: 2, bevelSize: 1.8, bevelThickness: 1.8, curveSegments: 3 });
      geometry.computeVertexNormals();
      const mesh = new THREE.Mesh(geometry, meshMaterial);
      meshGroup.add(mesh);
      meshes.push(mesh);
    });
  });

  const box = new THREE.Box3().setFromObject(meshGroup);
  const center = box.getCenter(new THREE.Vector3());
  meshGroup.position.sub(center);
  meshGroup.scale.setScalar(1.04);

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 512;
  sampleCanvas.height = 512;
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const image = new Image();
  image.onload = () => sampleContext.drawImage(image, 0, 0, 512, 512);
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`;

  const assembled = [];
  const dispersed = [];
  const pixelData = [];
  const drawParticles = () => {
    if (!sampleContext) return;
    const pixels = sampleContext.getImageData(0, 0, 512, 512).data;
    for (let y = 0; y < 512; y += config.particleStep) {
      for (let x = 0; x < 512; x += config.particleStep) {
        const alpha = pixels[(y * 512 + x) * 4 + 3];
        if (alpha < 90) continue;
        pixelData.push([x, y]);
      }
    }
    const stride = Math.max(1, Math.ceil(pixelData.length / config.particleLimit));
    for (let i = 0; i < pixelData.length; i += stride) {
      const [x, y] = pixelData[i];
      const px = (x - 256) * 1.22;
      const py = (256 - y) * 1.22;
      const pz = (Math.random() - .5) * config.depth;
      const base = new THREE.Vector3(px, py, pz);
      const direction = new THREE.Vector3(px, py, pz * .25).normalize();
      if (direction.lengthSq() < .01) direction.set(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize();
      const amount = config.spread * (.45 + Math.random() * .9);
      const target = base.clone().add(direction.multiplyScalar(amount));
      target.x += (Math.random() - .5) * 75;
      target.y += (Math.random() - .5) * 75;
      target.z += (Math.random() - .5) * 130;
      assembled.push(base.x, base.y, base.z);
      dispersed.push(target.x, target.y, target.z);
    }
    createParticles();
  };

  let particleGeometry;
  let particleMaterial;
  let particles;
  const createParticles = () => {
    particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(assembled.slice(), 3));
    particleMaterial = new THREE.PointsMaterial({ color: config.white, size: window.innerWidth < 700 ? 2.2 : 2.8, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.visible = true;
    logoGroup.add(particles);
  };

  const tempColor = new THREE.Color();
  const currentPositions = [];
  const smooth = (value) => value * value * (3 - 2 * value);
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const mapRange = (value, start, end) => clamp((value - start) / (end - start));

  const updateParticles = (progress) => {
    if (!particles || !particleGeometry) return;
    const positions = particleGeometry.attributes.position.array;
    const disintegrate = smooth(mapRange(progress, .26, .62));
    const reassemble = smooth(mapRange(progress, .73, .98));
    const amount = Math.min(disintegrate, 1 - reassemble);
    const finalMix = smooth(mapRange(progress, .58, .98));
    for (let i = 0; i < assembled.length; i += 3) {
      const x = mix(assembled[i], dispersed[i], amount);
      const y = mix(assembled[i + 1], dispersed[i + 1], amount);
      const z = mix(assembled[i + 2], dispersed[i + 2], amount);
      positions[i] = mix(x, assembled[i], reassemble);
      positions[i + 1] = mix(y, assembled[i + 1], reassemble);
      positions[i + 2] = mix(z, assembled[i + 2], reassemble);
    }
    particleGeometry.attributes.position.needsUpdate = true;
    particleMaterial.opacity = reducedMotion ? .06 : clamp(mapRange(progress, .25, .42) * 1.15 - reassemble * .6, 0, .92);
    tempColor.copy(config.white).lerp(config.accent, finalMix);
    particleMaterial.color.copy(tempColor);
  };

  const updateScene = (progress, time) => {
    const eased = smooth(progress);
    const disintegration = smooth(mapRange(progress, .24, .62));
    const reassembly = smooth(mapRange(progress, .73, .98));
    const colorProgress = smooth(mapRange(progress, .60, .98));
    logoGroup.rotation.y = mix(-.10, Math.PI * 2.05, eased);
    logoGroup.rotation.x = Math.sin(eased * Math.PI) * .16;
    logoGroup.rotation.z = Math.sin(eased * Math.PI * 1.4) * .035;
    logoGroup.position.y = Math.sin(time * .00055) * 4;
    meshMaterial.color.copy(config.white).lerp(config.accent, colorProgress);
    meshMaterial.opacity = clamp(1 - disintegration * 1.25 + reassembly * 1.25, 0, 1);
    meshMaterial.transparent = meshMaterial.opacity < 1;
    meshGroup.visible = meshMaterial.opacity > .02;
    updateParticles(progress);
    if (stateLabel) {
      stateLabel.textContent = progress < .25 ? 'ASSEMBLED' : progress < .63 ? 'DISINTEGRATING' : progress < .76 ? 'TRANSFORMING' : 'REASSEMBLING';
    }
  };

  let scrollTarget = 0;
  let scrollProgress = 0;
  const hero = document.querySelector('.hero-premium');
  const readScroll = () => {
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    const travel = Math.max(1, hero.offsetHeight - window.innerHeight * .18);
    scrollTarget = clamp((-rect.top + window.innerHeight * .08) / travel);
  };
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', () => {
    const rect = shell.getBoundingClientRect();
    renderer.setPixelRatio(config.pixelRatio);
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  }, { passive: true });

  const resize = () => {
    const rect = shell.getBoundingClientRect();
    renderer.setPixelRatio(config.pixelRatio);
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  };
  resize();
  drawParticles();

  let last = 0;
  const frame = (time) => {
    const delta = Math.min(.05, (time - last) / 1000 || .016);
    last = time;
    scrollProgress += (scrollTarget - scrollProgress) * Math.min(1, delta * 8.5);
    updateScene(scrollProgress, time);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  readScroll();
  requestAnimationFrame(frame);

  window.addEventListener('pagehide', () => {
    window.removeEventListener('scroll', readScroll);
    renderer.dispose();
    particleGeometry?.dispose();
    particleMaterial?.dispose();
    meshMaterial.dispose();
    meshes.forEach(mesh => mesh.geometry.dispose());
  }, { once: true });
})();
