(() => {
  'use strict';

  const boot = () => {
    const hero = document.querySelector('.hero-premium');
    const grid = document.querySelector('.hero-premium-grid');
    const frame = document.querySelector('.hero-system-frame');
    if (!hero || !grid || !frame || frame.dataset.zavoryn3d === 'audited-final') return;
    frame.dataset.zavoryn3d = 'audited-final';

    const copy = grid.children[0];
    if (!copy) return;
    copy.classList.add('hero-copy-runtime');

    const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
    const lerp = (a,b,t) => a+(b-a)*t;
    const ease = v => { v=clamp(v); return v*v*(3-2*v); };
    const range = (v,a,b) => ease((v-a)/Math.max(.0001,b-a));
    const hash = n => {
      const x = Math.sin(n*127.1+311.7)*43758.5453123;
      return x-Math.floor(x);
    };

    const paths = [
      'M173 116H410L356 170V238L286 310H216L342 177H112Z',
      'M216 204H286L161 336H148V273Z',
      'M148 343H389L327 397H94Z'
    ];
    const allPath =
      'M173 116H410L356 170V238L286 310H216L342 177H112ZM216 204H286L161 336H148V273ZM148 343H389L327 397H94Z';

    const svgUrl = (d,fill='#f5f6ef') => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="' + fill + '" d="' + d + '"/></svg>';
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stage = document.createElement('div');
    stage.className = 'hero-3d-stage';
    stage.innerHTML =
      '<div class="hero-logo-scene" data-logo-scene><div class="hero-logo-depth" data-logo-depth></div></div>' +
      '<canvas class="hero-particle-canvas" data-particles aria-hidden="true"></canvas>' +
      '<div class="hero-3d-hud"><span>ZAVORYN / <strong>IDENTITY IN MOTION</strong></span><span data-state>ARRIVING</span></div>' +
      '<div class="hero-3d-footer"><span>SCROLL TO TRANSFORM</span><span data-count>01 — 05</span></div>' +
      '<div class="hero-3d-wordmark">ZAVORYN</div>' +
      '<div class="hero-scroll-meter" data-meter></div>';

    frame.replaceChildren(stage);

    const scene = stage.querySelector('[data-logo-scene]');
    const depth = stage.querySelector('[data-logo-depth]');
    const particlesCanvas = stage.querySelector('[data-particles]');
    const ctx = particlesCanvas.getContext('2d', {alpha:true});
    const stateEl = stage.querySelector('[data-state]');
    const countEl = stage.querySelector('[data-count]');
    const meter = stage.querySelector('[data-meter]');

    const partMeta = [
      {x:-72,y:-30,z:45,rx:-.08,ry:.12,rz:-.05},
      {x:20,y:36,z:-34,rx:.12,ry:-.14,rz:.06},
      {x:72,y:-26,z:38,rx:-.10,ry:.09,rz:.025}
    ];

    const parts = paths.map((path,index) => {
      const part = document.createElement('div');
      part.className = 'hero-logo-part';
      part.dataset.part = String(index);
      const src = svgUrl(path);
      for(let layer=0;layer<10;layer++){
        const img=document.createElement('img');
        img.className='hero-logo-layer' + (layer===9?' is-face':'');
        img.src=src;
        img.alt='';
        img.draggable=false;
        const z=(layer-9)*2.6;
        img.style.transform='translateZ(' + z + 'px)';
        img.style.opacity=String(layer===9?1:.045+layer*.010);
        if(layer<9){
          img.style.filter='brightness(' + (.68+layer*.026) + ')';
        }
        part.appendChild(img);
      }
      depth.appendChild(part);
      return part;
    });

    // Rasterize the exact combined vector silhouette into deterministic particles.
    const sampleCanvas=document.createElement('canvas');
    sampleCanvas.width=512;
    sampleCanvas.height=512;
    const sampleCtx=sampleCanvas.getContext('2d',{willReadFrequently:true});
    const particleImage=new Image();
    const particleData=[];
    let particlesReady=false;

    particleImage.onload=()=>{
      sampleCtx.clearRect(0,0,512,512);
      sampleCtx.drawImage(particleImage,0,0,512,512);
      const pixels=sampleCtx.getImageData(0,0,512,512).data;
      const step=window.innerWidth<=680?6:4;
      const coords=[];
      for(let y=0;y<512;y+=step){
        for(let x=0;x<512;x+=step){
          if(pixels[(y*512+x)*4+3]>100) coords.push([x,y]);
        }
      }
      const limit=window.innerWidth<=680?1500:3200;
      const stride=Math.max(1,Math.ceil(coords.length/limit));
      for(let i=0;i<coords.length;i+=stride){
        const [x,y]=coords[i];
        const bx=(x-256)*1.22;
        const by=(256-y)*1.22;
        const radius=Math.hypot(bx,by);
        const theta=Math.atan2(by,bx);
        const burst=85+hash(i+8)*250+radius*.24;
        const angle=theta+(hash(i+12)-.5)*1.15;
        particleData.push({
          bx,by,bz:(hash(i+18)-.5)*20,
          dx:bx+Math.cos(angle)*burst+(hash(i+22)-.5)*65,
          dy:by+Math.sin(angle)*burst+(hash(i+26)-.5)*65,
          dz:(hash(i+30)-.5)*330,
          seed:hash(i+34)
        });
      }
      particlesReady=true;
    };
    particleImage.src=svgUrl(allPath);

    let target=0;
    let progress=0;
    let last=0;
    let lastW=0;
    let lastH=0;
    let stageW=1;
    let stageH=1;
    let headerH=76;

    const measure=()=>{
      const header=document.querySelector('.site-header');
      headerH=header ? Math.max(0,Math.round(header.getBoundingClientRect().height)) : (window.innerWidth<=680?72:76);
      hero.style.setProperty('--z-header-h',headerH+'px');
      const rect=grid.getBoundingClientRect();
      stageW=Math.max(1,rect.width);
      stageH=Math.max(1,rect.height);
      if(particlesCanvas.width !== Math.floor(stageW*(Math.min(window.devicePixelRatio||1,1.35))) || particlesCanvas.height !== Math.floor(stageH*(Math.min(window.devicePixelRatio||1,1.35)))){
        const dpr=Math.min(window.devicePixelRatio||1,1.35);
        particlesCanvas.width=Math.max(1,Math.floor(stageW*dpr));
        particlesCanvas.height=Math.max(1,Math.floor(stageH*dpr));
        ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      lastW=window.innerWidth;
      lastH=window.innerHeight;
    };

    measure();
    window.addEventListener('resize',measure,{passive:true});

    const readScroll=()=>{
      const travel=Math.max(1,hero.offsetHeight-grid.offsetHeight);
      target=clamp((-hero.getBoundingClientRect().top)/travel);
    };
    window.addEventListener('scroll',readScroll,{passive:true});
    readScroll();

    const positionCopy=(p)=>{
      const cw=copy.getBoundingClientRect().width;
      const maxX=Math.max(0,stageW-cw);
      let x=0,y=-50,opacity=1,scale=1;

      if(p<.08){
        opacity=range(p,0,.08);
        y=lerp(-46,-50,ease(p/.08));
      }else if(p<.32){
        const t=ease((p-.08)/.24);
        x=lerp(0,maxX*.92,t);
        y=lerp(-50,-48,t);
      }else if(p<.58){
        const t=ease((p-.32)/.26);
        x=lerp(maxX*.92,0,t);
        y=lerp(-48,-52,t);
        opacity=lerp(1,.76,t);
        scale=lerp(1,.985,t);
      }else if(p<.82){
        const t=ease((p-.58)/.24);
        x=lerp(0,maxX*.88,t);
        y=lerp(-52,-48,t);
        opacity=lerp(.76,1,t);
        scale=lerp(.985,1,t);
      }else{
        const t=ease((p-.82)/.18);
        x=lerp(maxX*.88,maxX*.12,t);
        y=lerp(-48,-50,t);
      }
      copy.style.transform='translate3d('+x+'px,'+y+'%,0) scale('+scale+')';
      copy.style.opacity=String(opacity);
    };

    const paintParticles=(p,time)=>{
      if(!particlesReady) return;
      const w=stageW,h=stageH;
      ctx.clearRect(0,0,w,h);

      const dis=range(p,.26,.57);
      const rebuild=range(p,.68,.91);
      const spread=Math.max(dis*(1-rebuild),0);
      const logoX =
        p<.32 ? stageW*.58 :
        p<.60 ? lerp(stageW*.58,stageW*.42,ease((p-.32)/.28)) :
        p<.84 ? lerp(stageW*.42,stageW*.56,ease((p-.60)/.24)) :
        stageW*.50;

      const scale=Math.min(w,h)/780;
      for(const pt of particleData){
        const x=lerp(lerp(pt.bx,pt.dx,spread),pt.bx,rebuild);
        const y=lerp(lerp(pt.by,pt.dy,spread),pt.by,rebuild);
        const z=lerp(lerp(pt.bz,pt.dz,spread),pt.bz,rebuild);
        const wobble=spread*Math.sin(time*.0011+pt.seed*50)*3.5;
        const depthScale=1+z/900;
        const sx=logoX+x*scale*depthScale+wobble;
        const sy=stageH*.50-y*scale*depthScale+
          spread*Math.cos(time*.0010+pt.seed*42)*3;

        const a=(spread*.98+rebuild*.22)*(.58+.42*pt.seed);
        if(a<.018) continue;
        const size=1+pt.seed*1.3;
        ctx.fillStyle='rgba(245,246,239,'+a.toFixed(3)+')';
        ctx.fillRect(sx,sy,size,size);
      }
    };

    const update=(p,time)=>{
      const intro=range(p,0,.10);
      const dis=range(p,.26,.57);
      const rebuild=range(p,.68,.91);
      const phase=
        p<.14?'intro':
        p<.36?'travel':
        p<.63?'disintegrate':
        p<.94?'reassemble':'complete';

      grid.dataset.phase=phase;
      if(meter) meter.style.setProperty('--meter',(p*100).toFixed(2)+'%');
      if(stateEl) stateEl.textContent=
        phase==='intro'?'ARRIVING':
        phase==='travel'?'MOVING':
        phase==='disintegrate'?'BREAKING APART':
        phase==='reassemble'?'REBUILDING':'COMPLETE';
      if(countEl) countEl.textContent=
        phase==='intro'?'01 — 05':
        phase==='travel'?'02 — 05':
        phase==='disintegrate'?'03 — 05':
        phase==='reassemble'?'04 — 05':'05 — 05';

      const introY=-stageH*.82*(1-intro);
      const travelT=p<.38?ease((p-.10)/.28):p<.60?ease((p-.38)/.22):p<.82?ease((p-.60)/.22):1;
      let x=stageW*.54,y=0,s=.96,ry=0,rx=0,rz=0;

      if(p<.10){
        y=introY;
        s=lerp(.44,.98,intro);
        ry=lerp(-.55,0,intro);
        rx=lerp(.20,0,intro);
      }else if(p<.38){
        x=lerp(stageW*.54,stageW*.68,travelT);
        y=lerp(0,stageH*.035,travelT);
        s=lerp(.98,.92,travelT);
        ry=lerp(0,.92,travelT);
        rz=lerp(0,.025,travelT);
      }else if(p<.60){
        const t=ease((p-.38)/.22);
        x=lerp(stageW*.68,stageW*.35,t);
        y=lerp(stageH*.035,stageH*.10,t);
        s=lerp(.92,.73,t);
        ry=lerp(.92,2.75,t);
        rx=lerp(0,-.12,t);
        rz=lerp(.025,.08,t);
      }else if(p<.82){
        const t=ease((p-.60)/.22);
        x=lerp(stageW*.35,stageW*.62,t);
        y=lerp(stageH*.10,stageH*-.04,t);
        s=lerp(.73,.84,t);
        ry=lerp(2.75,4.55,t);
        rx=lerp(-.12,.08,t);
        rz=lerp(.08,-.05,t);
      }else{
        const t=ease((p-.82)/.18);
        x=lerp(stageW*.62,stageW*.50,t);
        y=lerp(stageH*-.04,0,t);
        s=lerp(.84,1.04,t);
        ry=lerp(4.55,Math.PI*2,t);
        rx=lerp(.08,0,t);
        rz=lerp(-.05,0,t);
      }

      scene.style.transform=
        'translate3d('+x+'px,'+y+'px,0) translate(-50%,-50%) scale('+s+') rotateX('+rx+'rad) rotateY('+ry+'rad) rotateZ('+rz+'rad)';

      const separation=dis*(1-rebuild);
      parts.forEach((part,i)=>{
        const m=partMeta[i];
        part.style.transform=
          'translate3d('+(m.x*separation)+'px,'+(m.y*separation)+'px,'+(m.z*separation)+'px)' +
          'rotateX('+(m.rx*separation)+'rad) rotateY('+(m.ry*separation)+'rad) rotateZ('+(m.rz*separation)+'rad)';
        part.style.opacity=String(clamp(1-dis*1.15+rebuild*1.15));
      });

      scene.style.opacity=String(clamp(1-dis*.92+rebuild));
      scene.style.filter='drop-shadow(0 0 '+(12+dis*52)+'px rgba(200,255,34,'+(.05+dis*.10)+'))';
      positionCopy(p);
      paintParticles(p,time);
    };

    let raf=0;
    const frameLoop=time=>{
      const dt=Math.min(.05,(time-last)/1000||.016);
      last=time;
      if(reduceMotion){
        progress=0;
      }else{
        progress += (target-progress)*(1-Math.exp(-dt*9));
      }
      update(progress,time);
      raf=requestAnimationFrame(frameLoop);
    };

    requestAnimationFrame(()=>grid.classList.add('hero-ready'));
    requestAnimationFrame(frameLoop);

    window.addEventListener('pagehide',()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll',readScroll);
      window.removeEventListener('resize',measure);
    },{once:true});
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();