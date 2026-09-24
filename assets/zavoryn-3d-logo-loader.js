(() => {
  const load = async () => {
    try {
      await import('./zavoryn-3d-logo-v2.js');
    } catch (error) {
      console.warn('[ZAVORYN] 3D logo unavailable; retaining static hero.', error);
      const frame = document.querySelector('.hero-system-frame');
      if (!frame) return;
      frame.classList.add('is-3d-unavailable');
      const image = frame.querySelector('img');
      if (image) image.hidden = false;
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();
