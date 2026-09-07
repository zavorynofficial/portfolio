const API=`https://api.github.com/repos/${Z.owner}/${Z.repo}/contents/`;
const CACHE_TTL=6*60*60*1000;
const isImg=name=>/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name);
const clean=name=>name.replace(/\.[^/.]+$/,'').replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim().replace(/\b\w/g,c=>c.toUpperCase());

function injectQualityStyles(){
  if(document.getElementById('zavoryn-quality-css'))return;
  const style=document.createElement('style');
  style.id='zavoryn-quality-css';
  style.textContent=`
    html{scroll-padding-top:92px}
    a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--lime);outline-offset:3px}
    .menu-btn{cursor:pointer}
    .loading,.notice{padding:22px;border:1px solid var(--line);border-radius:16px;color:var(--muted);background:rgba(255,255,255,.02);grid-column:1/-1}
    .notice.error{color:#ffd6d6;border-color:rgba(255,100,100,.25)}
    .lightbox[aria-hidden="true"]{visibility:hidden}
    .lightbox[aria-hidden="false"]{visibility:visible}
    @media (max-width:980px){
      .menu-btn{display:grid;place-items:center}
      .nav-links{display:none;position:absolute;left:20px;right:20px;top:70px;padding:12px;background:rgba(8,11,13,.98);border:1px solid var(--line);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.4);gap:5px}
      .nav-links.open{display:grid}
      .nav-links>a{padding:13px 14px}
      .hero-grid,.split,.planner-wrap{grid-template-columns:1fr}
      .hero-art{min-height:360px}
      .trust-grid{grid-template-columns:repeat(2,1fr)}
      .planner-result{position:static}
    }
    @media (max-width:680px){
      .container{width:min(calc(100% - 28px),var(--max))}
      .nav{min-height:68px}
      .nav-links{left:14px;right:14px;top:62px}
      .brand-logo{width:126px}
      .hero{padding:76px 0 68px}
      .hero h1{font-size:clamp(48px,15vw,76px);letter-spacing:-.065em}
      .lead{font-size:17px}
      .hero-art{min-height:300px}
      .hero-visual{border-radius:20px}
      .hero-pillar{left:5%;bottom:5%;padding:11px 12px}
      .hero-chip{right:5%;top:5%;padding:9px 11px}
      .trust-grid,.service-grid,.cards,.catalog,.tool-grid,.case-grid,.industry-grid,.choice-grid{grid-template-columns:1fr}
      .section{padding:68px 0}
      .section-head{align-items:flex-start;flex-direction:column}
      .section-head h2,.split h2{font-size:42px}
      .page-hero{padding:68px 0 42px}
      .page-hero h1{font-size:clamp(44px,13vw,68px)}
      .page-hero p{font-size:16px}
      .tool-card,.case-card,.industry-card,.planner-step,.planner-result{padding:22px}
      .cta-band{padding:25px;align-items:flex-start;flex-direction:column}
      .footer-grid{grid-template-columns:1fr;gap:28px}
      .footer-bottom{flex-direction:column;gap:8px}
      .media-image{min-height:240px}
    }
    @media (prefers-reduced-motion:reduce){
      html{scroll-behavior:auto}
      *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
      .reveal{opacity:1;transform:none}
    }
  `;
  document.head.appendChild(style);
}

async function contents(path){
  const key=`zavoryn:${Z.owner}/${Z.repo}:${Z.branch}:${path}`;
  try{
    const cached=JSON.parse(localStorage.getItem(key)||'null');
    if(cached&&Date.now()-cached.time<CACHE_TTL)return cached.data;
  }catch{}
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),9000);
  try{
    const r=await fetch(`${API}${path}?ref=${encodeURIComponent(Z.branch)}`,{headers:{Accept:'application/vnd.github+json'},signal:controller.signal,cache:'force-cache'});
    if(!r.ok)throw new Error(`GitHub API error: ${r.status}`);
    const data=await r.json();
    try{localStorage.setItem(key,JSON.stringify({time:Date.now(),data}))}catch{}
    return data;
  }finally{clearTimeout(timer)}
}

async function images(path){
  try{
    const items=await contents(path),out=[];
    const walk=async list=>{
      for(const item of list||[]){
        if(item.type==='file'&&isImg(item.name))out.push(item);
        else if(item.type==='dir'){
          try{await walk(await contents(item.path))}catch(e){console.warn('Catalogue subfolder error',item.path,e)}
        }
      }
    };
    await walk(items);
    return out;
  }catch(e){console.warn('Zavoryn catalogue error',path,e);return[]}
}

function lightbox(src,alt){
  const box=document.getElementById('z-lightbox');
  if(!box)return;
  const image=box.querySelector('img');
  if(!image)return;
  image.src=src;image.alt=alt;
  box.setAttribute('aria-hidden','false');box.classList.add('open');document.body.classList.add('lightbox-active');
  const close=box.querySelector('.lightbox-close');
  close?.focus();
}
function closeLightbox(){
  const box=document.getElementById('z-lightbox');
  if(!box)return;
  box.classList.remove('open');box.setAttribute('aria-hidden','true');document.body.classList.remove('lightbox-active');
}
function mediaCard(file,label){
  const el=document.createElement('article'),src=file.download_url,alt=clean(file.name);
  el.className='media-card reveal';el.style.setProperty('--media-card-bg',`url("${src}")`);
  el.innerHTML=`<button class="media-button" type="button" aria-label="Open ${alt}"><div class="media-image"><div class="media-image-bg" aria-hidden="true"></div><div class="media-image-overlay" aria-hidden="true"></div><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></div><div class="media-meta"><span>${label}</span></div></button>`;
  el.querySelector('button').addEventListener('click',()=>lightbox(src,alt));
  return el;
}
async function renderGallery(element,path,label,limit=999){
  if(!element)return;
  element.innerHTML='<div class="loading">Loading work…</div>';
  const files=await images(path);
  if(!files.length){element.innerHTML='<div class="notice">No work could be loaded right now. Refresh once or check the GitHub folder.</div>';return}
  element.innerHTML='';files.slice(0,limit).forEach(f=>element.appendChild(mediaCard(f,label)));observe();
}
function observe(){
  const elements=document.querySelectorAll('.reveal:not(.visible)');
  if(!elements.length)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){elements.forEach(el=>el.classList.add('visible'));return}
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.08});
  elements.forEach(el=>observer.observe(el));
}
function initNavigation(){
  const menu=document.querySelector('.menu-btn'),nav=document.querySelector('.nav-links');
  if(!menu||!nav)return;
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu')});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu')}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus()}});
}
function initLightbox(){
  const box=document.getElementById('z-lightbox');
  if(!box)return;
  box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-hidden','true');
  box.addEventListener('click',e=>{if(e.target===box||e.target.classList.contains('lightbox-close'))closeLightbox()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&box.classList.contains('open'))closeLightbox()});
}
function initTools(){
  document.querySelectorAll('.tool-form').forEach(form=>{
    const result=form.querySelector('.tool-result');if(!result)return;
    form.addEventListener('submit',e=>{e.preventDefault();const n=k=>Number(form.elements[k]?.value||0);switch(form.dataset.tool){case'website':{const base=n('type'),pages=n('pages'),features=n('features'),low=Math.round(base+Math.max(0,pages-3)*70+features),high=Math.round(low*1.5);result.textContent=`$${low.toLocaleString()} – $${high.toLocaleString()}`;break}case'roi':{const revenue=n('visitors')*(n('rate')/100)*n('aov');result.textContent=`$${Math.round(revenue).toLocaleString()} estimated monthly revenue`;break}case'automation':{const monthly=n('people')*n('hours')*n('rate')*4.33;result.textContent=`$${Math.round(monthly).toLocaleString()} estimated monthly manual cost`;break}case'social':{const monthly=n('posts')*35+n('reels')*65+n('ads')*150+n('management')*250;result.textContent=`$${Math.round(monthly).toLocaleString()} estimated monthly plan`;break}case'planner':{const p=form.elements.priority?.value;const labels={website:'Website + conversion system',brand:'Brand system + digital foundation',growth:'Growth website + acquisition system',automation:'Automation workflow + operations system'};result.textContent=`Recommended: ${labels[p]||'Focused digital system'}`;break}}});
  });
}
function initFilters(){
  document.querySelectorAll('[data-filter-target]').forEach(group=>{const target=document.querySelector(group.dataset.filterTarget);if(!target)return;group.addEventListener('click',e=>{const button=e.target.closest('[data-filter]');if(!button)return;group.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active'));button.classList.add('active');target.querySelectorAll('[data-industry]').forEach(card=>{const f=button.dataset.filter;card.hidden=f!=='all'&&card.dataset.industry!==f})})});
}
function initAudit(){
  const form=document.querySelector('#audit-form');if(!form)return;
  form.addEventListener('submit',e=>{e.preventDefault();const checks=[...form.querySelectorAll('input[type=checkbox]:checked')].length,total=form.querySelectorAll('input[type=checkbox]').length,score=total?Math.round(checks/total*100):0;const out=form.querySelector('.audit-result');if(out)out.textContent=`${score}/100`;const note=document.querySelector('.audit-note');if(note)note.textContent=score>=80?'Strong foundation. Focus on conversion and growth opportunities.':score>=60?'Good start. Several high-impact improvements are available.':'Several fundamentals need attention before scaling.'});
}
function initPlanner(){
  const form=document.querySelector('#project-planner');if(!form)return;const out=document.querySelector('#planner-output');if(!out)return;
  const sync=()=>{const service=form.elements.service?.value||'website',goal=form.elements.goal?.value||'leads',timeline=form.elements.timeline?.value||'flexible';const map={website:['Conversion-focused website','Landing pages, UX structure, SEO basics'],brand:['Brand foundation','Identity system, guidelines, digital touchpoints'],social:['Social growth system','Content direction, creative system, publishing rhythm'],automation:['Automation system','Workflow mapping, integrations, monitoring']};const item=map[service]||map.website;const h=out.querySelector('h2'),p=out.querySelector('p'),plan=out.querySelector('[data-plan]');if(h)h.textContent=item[0];if(p)p.textContent=`Goal: ${goal}. Timeline: ${timeline}.`;if(plan)plan.textContent=item[1]};
  form.addEventListener('change',sync);sync();
}

document.addEventListener('DOMContentLoaded',()=>{injectQualityStyles();initNavigation();initLightbox();initTools();initFilters();initAudit();initPlanner();observe()});
