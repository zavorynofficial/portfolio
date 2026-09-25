(() => {
  'use strict';

  const boot = () => {
    const hero = document.querySelector('.hero-premium');
    const grid = document.querySelector('.hero-premium-grid');
    const copy = document.querySelector('.hero-intro-copy');
    const finalCta = document.querySelector('.cta-band')?.closest('.section');
    if (!hero || !grid || !copy || !finalCta || document.querySelector('.zavoryn-scroll-orchestrator')) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (v,a=0,b=1) => Math.min(b,Math.max(a,v));
    const lerp = (a,b,t) => a+(b-a)*t;
    const ease = v => { v=clamp(v); return v*v*(3-2*v); };
    const inv = (v,a,b) => clamp((v-a)/Math.max(.0001,b-a));
    const hash = n => {
      const x=Math.sin(n*127.1+311.7)*43758.5453123;
      return x-Math.floor(x);
    };

    const paths=[
      'M173 116H410L356 170V238L286 310H216L342 177H112Z',
      'M216 204H286L161 336H148V273Z',
      'M148 343H389L327 397H94Z'
    ];
    const allPath='M173 116H410L356 170V238L286 310H216L342 177H112ZM216 204H286L161 336H148V273ZM148 343H389L327 397H94Z';
    const svgUrl=d=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#f5f6ef" d="'+d+'"/></svg>'
    );

    const wrap=document.createElement('div');
    wrap.className='zavoryn-scroll-orchestrator';
    wrap.innerHTML=
      '<div class="zavoryn-scroll-stage">'+
        '<div class="zavoryn-logo-scene" data-logo-scene><div class="zavoryn-logo-depth" data-logo-depth></div></div>'+
        '<canvas class="zavoryn-particle-canvas" data-particles aria-hidden="true"></canvas>'+
        '<div class="zavoryn-scroll-hud"><span>ZAVORYN / <strong>IDENTITY IN MOTION</strong></span><span data-state>ARRIVING</span></div>'+
        '<div class="zavoryn-logo-wordmark">ZAVORYN</div>'+
        '<div class="zavoryn-scroll-status" data-status>SCROLL TO TRANSFORM</div>'+
        '<div class="zavoryn-scroll-meter" data-meter></div>'+
      '</div>';
    document.body.appendChild(wrap);

    const scene=wrap.querySelector('[data-logo-scene]');
    const depth=wrap.querySelector('[data-logo-depth]');
    const particleCanvas=wrap.querySelector('[data-particles]');
    const ctx=particleCanvas.getContext('2d',{alpha:true});
    const state=wrap.querySelector('[data-state]');
    const status=wrap.querySelector('[data-status]');
    const meter=wrap.querySelector('[data-meter]');

    const parts=paths.map((d,i)=>{
      const part=document.createElement('div');
      part.className='zavoryn-logo-part';
      const src=svgUrl(d);
      for(let layer=0;layer<10;layer++){
        const img=document.createElement('img');
        img.className='zavoryn-logo-layer'+(layer===9?' is-face':'');
        img.src=src;
        img.alt='';
        img.draggable=false;
        img.style.transform='translateZ('+((layer-9)*2.8)+'px)';
        img.style.opacity=String(layer===9?1:.04+layer*.01);
        if(layer<9) img.style.filter='brightness('+(0.68+layer*.025)+')';
        part.appendChild(img);
      }
      depth.appendChild(part);
      return part;
    });

    const sample=document.createElement('canvas');
    sample.width=sample.height=512;
    const sampleCtx=sample.getContext('2d',{willReadFrequently:true});
    const particleImage=new Image();
    const particles=[];
    let particlesReady=false;

    particleImage.onload=()=>{
      sampleCtx.clearRect(0,0,512,512);
      sampleCtx.drawImage(particleImage,0,0,512,512);
      const px=sampleCtx.getImageData(0,0,512,512).data;
      const step=window.innerWidth<=680?6:4;
      const coords=[];
      for(let y=0;y<512;y+=step){
        for(let x=0;x<512;x+=step){
          if(px[(y*512+x)*4+3]>100) coords.push([x,y]);
        }
      }
      const limit=window.innerWidth<=680?1500:3200;
      const stride=Math.max(1,Math.ceil(coords.length/limit));
      for(let i=0;i<coords.length;i+=stride){
        const [x,y]=coords[i];
        const bx=(x-256)*1.22;
        const by=(256-y)*1.22;
        const r=Math.hypot(bx,by);
        const theta=Math.atan2(by,bx);
        const burst=85+hash(i+8)*260+r*.26;
        const angle=theta+(hash(i+12)-.5)*1.15;
        particles.push({
          bx,by,bz:(hash(i+18)-.5)*24,
          dx:bx+Math.cos(angle)*burst+(hash(i+22)-.5)*70,
          dy:by+Math.sin(angle)*burst+(hash(i+26)-.5)*70,
          dz:(hash(i+30)-.5)*360,
          seed:hash(i+34)
        });
      }
      particlesReady=true;
    };
    particleImage.src=svgUrl(allPath);

    const sectionData=()=>{
      const y=el=>{
        if(!el) return null;
        const r=el.getBoundingClientRect();
        return {top:r.top+window.scrollY,height:r.height,center:r.top+window.scrollY+r.height*.45};
      };
      const trust=document.querySelector('.trust');
      const goal=document.querySelector('[data-goal-selector]');
      const work=document.querySelector('[data-home-work]')?.closest('.section');
      const capabilities=document.querySelector('.family-grid')?.closest('.section');
      const tools=document.querySelector('.home-lab');
      const h=y(hero),t=y(trust),g=y(goal),w=y(work),c=y(capabilities),l=y(tools),f=y(finalCta);
      const heroStart=h.top;
      const heroMotionEnd=Math.max(heroStart+1,h.top+h.height-window.innerHeight);
      return {h,t,g,w,c,l,f,heroStart,heroMotionEnd};
    };

    let layout=sectionData();
    let stageW=window.innerWidth;
    let stageH=window.innerHeight;
    let targetScroll=window.scrollY;
    let currentScroll=targetScroll;
    let raf=0;
    let last=performance.now();
    let loadStart=performance.now();

    const measure=()=>{
      layout=sectionData();
      stageW=window.innerWidth;
      stageH=window.innerHeight;
      const dpr=Math.min(window.devicePixelRatio||1,1.25);
      particleCanvas.width=Math.max(1,Math.floor(stageW*dpr));
      particleCanvas.height=Math.max(1,Math.floor(stageH*dpr));
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const header=document.querySelector('.site-header');
      const hh=header?header.getBoundingClientRect().height:(stageW<=680?72:76);
      document.documentElement.style.setProperty('--z-header-h',Math.round(hh)+'px');
    };

    const onScroll=()=>{targetScroll=window.scrollY;};
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',measure,{passive:true});
    measure();

    const keyframes=()=>{
      const s=[
        {y:layout.heroStart-stageH*.72,x:.50,yv:-.62,s:1.02,ry:-.72,rx:.16,rz:-.05},
        {y:layout.heroStart+layout.h.height*.18,x:.50,yv:.26,s:.88,ry:0,rx:0,rz:0},
        {y:layout.heroMotionEnd,x:.70,yv:.63,s:.60,ry:.62,rx:.05,rz:.02},
        {y:(layout.t?.center||layout.heroMotionEnd+stageH),x:.22,yv:.48,s:.47,ry:1.55,rx:.08,rz:.025},
        {y:(layout.g?.center||0),x:.80,yv:.36,s:.50,ry:2.55,rx:-.06,rz:.06},
        {y:(layout.w?.center||0),x:.22,yv:.58,s:.55,ry:3.65,rx:.10,rz:.08},
        {y:(layout.c?.center||0),x:.79,yv:.38,s:.48,ry:4.75,rx:-.08,rz:-.06},
        {y:(layout.l?.center||0),x:.20,yv:.59,s:.50,ry:5.55,rx:.08,rz:.03},
        {y:(layout.f?.center||0),x:.50,yv:.38,s:1.05,ry:Math.PI*2,rx:0,rz:0}
      ];
      return s.filter(k=>Number.isFinite(k.y)).sort((a,b)=>a.y-b.y);
    };

    const interpolate=scroll=>{
      const k=keyframes();
      if(scroll<=k[0].y) return k[0];
      for(let i=0;i<k.length-1;i++){
        const a=k[i],b=k[i+1];
        if(scroll<=b.y){
          const t=ease(inv(scroll,a.y,b.y));
          return {
            x:lerp(a.x,b.x,t),yv:lerp(a.yv,b.yv,t),s:lerp(a.s,b.s,t),
            ry:lerp(a.ry,b.ry,t),rx:lerp(a.rx,b.rx,t),rz:lerp(a.rz,b.rz,t)
          };
        }
      }
      return k[k.length-1];
    };

    const drawParticles=(scroll,time)=>{
      if(!particlesReady) return;
      const disStart=layout.g?.top || layout.heroMotionEnd;
      const disEnd=(layout.l?.top||disStart+stageH)-stageH*.10;
      const rebuildStart=(layout.l?.center||disEnd)-stageH*.25;
      const rebuildEnd=(layout.f?.top||disEnd+stageH*.8)+stageH*.15;
      const dis=ease(inv(scroll,disStart,disEnd));
      const rebuild=ease(inv(scroll,rebuildStart,rebuildEnd));
      const spread=clamp(dis*(1-rebuild));
      const k=interpolate(scroll);
      const cx=stageW*k.x;
      const cy=stageH*k.yv;
      const scale=Math.min(stageW,stageH)/780;

      ctx.clearRect(0,0,stageW,stageH);
      for(const pt of particles){
        let x=lerp(pt.bx,pt.dx,spread);
        let y=lerp(pt.by,pt.dy,spread);
        let z=lerp(pt.bz,pt.dz,spread);
        const cos=Math.cos(k.ry),sin=Math.sin(k.ry);
        const rx=x*cos-z*sin;
        const rz=x*sin+z*cos;
        x=lerp(rx,pt.bx,rebuild);
        y=lerp(y,pt.by,rebuild);
        z=lerp(rz,pt.bz,rebuild);
        x+=Math.sin(time*.0012+pt.seed*50)*spread*4;
        y+=Math.cos(time*.0010+pt.seed*42)*spread*3;
        const depthScale=1+z/900;
        const sx=cx+x*scale*depthScale;
        const sy=cy-y*scale*depthScale;
        const alpha=(spread*.95+rebuild*.24)*(.55+.45*pt.seed);
        if(alpha<.015) continue;
        const size=.95+pt.seed*1.25;
        ctx.fillStyle='rgba(245,246,239,'+alpha.toFixed(3)+')';
        ctx.fillRect(sx,sy,size,size);
      }
      const hue=ease(inv(scroll,disStart,rebuildEnd));
      scene.style.filter='drop-shadow(0 0 '+(12+spread*54)+'px rgba(200,255,34,'+(.05+spread*.11)+'))';
      scene.style.opacity=String(clamp(1-spread*.92+rebuild));
      scene.dataset.motion=String(Math.round(hue*100));
      return {dis,rebuild,spread};
    };

    const update=time=>{
      const dt=Math.min(.05,(time-last)/1000||.016);
      last=time;
      currentScroll+=((targetScroll-currentScroll)*(1-Math.exp(-dt*10)));
      const k=interpolate(currentScroll);
      const vh=stageH;

      scene.style.transform=
        'translate3d('+(k.x*stageW)+'px,'+(k.yv*vh)+'px,0) translate(-50%,-50%) scale('+k.s+') rotateX('+k.rx+'rad) rotateY('+k.ry+'rad) rotateZ('+k.rz+'rad)';

      const disStart=layout.g?.top||layout.heroMotionEnd;
      const disEnd=(layout.l?.top||disStart+stageH)-stageH*.10;
      const rebuildStart=(layout.l?.center||disEnd)-stageH*.25;
      const rebuildEnd=(layout.f?.top||disEnd+stageH*.8)+stageH*.15;
      const dis=ease(inv(currentScroll,disStart,disEnd));
      const rebuild=ease(inv(currentScroll,rebuildStart,rebuildEnd));

      const separation=dis*(1-rebuild);
      const meta=[
        {x:-78,y:-34,z:48,rx:-.08,ry:.12,rz:-.05},
        {x:22,y:40,z:-36,rx:.13,ry:-.14,rz:.06},
        {x:78,y:-28,z:42,rx:-.10,ry:.09,rz:.03}
      ];
      parts.forEach((part,i)=>{
        const m=meta[i];
        part.style.transform=
          'translate3d('+(m.x*separation)+'px,'+(m.y*separation)+'px,'+(m.z*separation)+'px) '+
          'rotateX('+(m.rx*separation)+'rad) rotateY('+(m.ry*separation)+'rad) rotateZ('+(m.rz*separation)+'rad)';
        part.style.opacity=String(clamp(1-dis*1.18+rebuild*1.18));
      });

      const heroLocal=clamp((currentScroll-layout.heroStart)/Math.max(1,layout.heroMotionEnd-layout.heroStart));
      const copyIn=ease(inv(heroLocal,.04,.22));
      copy.style.opacity=String(copyIn);
      copy.style.transform='translate3d(0,'+lerp(70,0,copyIn)+'px,0)';

      if(meter){
        const start=layout.heroStart;
        const end=layout.f?.center||start+1;
        meter.style.setProperty('--meter',(clamp((currentScroll-start)/Math.max(1,end-start))*100).toFixed(2)+'%');
      }

      let phase='ARRIVING';
      if(currentScroll>=layout.heroMotionEnd && currentScroll<(layout.g?.top||Infinity)) phase='MOVING';
      if(dis>.08 && dis<.95) phase='BREAKING APART';
      if(rebuild>.08 && rebuild<.98) phase='REBUILDING';
      if(rebuild>=.98) phase='COMPLETE';
      if(state) state.textContent=phase;
      if(status) status.textContent=
        phase==='BREAKING APART'?'FORMING PARTICLES':
        phase==='REBUILDING'?'RECONSTRUCTING':
        phase==='COMPLETE'?'ZAVORYN / COMPLETE':'SCROLL TO TRANSFORM';

      drawParticles(currentScroll,time);
    };

    // Entrance is independent from scroll so Z visibly arrives on a fresh page load.
    const entrance=()=>{
      const t=clamp((performance.now()-loadStart)/1400);
      if(currentScroll<8 && t<1){
        const e=ease(t);
        const k=interpolate(layout.heroStart-stageH*.72);
        const targetY=stageH*k.yv;
        scene.style.transform=
          'translate3d('+(k.x*stageW)+'px,'+lerp(-stageH*1.08,targetY,e)+'px,0) '+
          'translate(-50%,-50%) scale('+lerp(.42,k.s,e)+') rotateX('+lerp(.25,k.rx,e)+'rad) rotateY('+lerp(-.7,k.ry,e)+'rad) rotateZ('+lerp(-.08,k.rz,e)+'rad)';
        scene.style.opacity=String(e);
        return true;
      }
      return false;
    };

    const frame=time=>{
      const entering=entrance();
      if(!entering) update(time);
      if(time-loadStart>80) wrap.classList.add('is-ready');
      raf=requestAnimationFrame(frame);
    };
    raf=requestAnimationFrame(frame);

    window.addEventListener('pagehide',()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll',onScroll);
      window.removeEventListener('resize',measure);
      wrap.remove();
    },{once:true});
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();