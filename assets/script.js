(() => {
  'use strict';
  const Z = window.Z || {owner:'zavorynofficial',repo:'portfolio',branch:'main'};
  const portfolio = window.ZAVORYN_PORTFOLIO || {};
  const API = `https://api.github.com/repos/${Z.owner}/${Z.repo}/contents/`;
  const CACHE_TTL = 6 * 60 * 60 * 1000;
  const isImg = (name='') => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name);
  const clean = (name='') => name.replace(/\.[^/.]+$/,'').replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim().replace(/\b\w/g,c=>c.toUpperCase());

  function injectStyle(id, href){
    if(document.getElementById(id)) return;
    const link=document.createElement('link');
    link.id=id;
    link.rel='stylesheet';
    link.href=href;
    document.head.appendChild(link);
  }

  function currentSection(){
    const f=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    if(!f||f==='index.html') return 'home';
    if(f==='services.html'||f.startsWith('service-')) return 'services';
    if(['portfolio.html','websites.html','brand-design.html','logos.html','letterheads.html','business-cards.html','stationery.html','brand-guidelines.html','post-design.html','social-media.html','social-brand.html','ai-automation.html'].includes(f)) return 'work';
    if(f==='case-studies.html'||f.startsWith('case-study-')) return 'cases';
    if(f==='tools.html'||f.startsWith('tool-')||f==='website-audit.html'||f==='project-planner.html') return 'tools';
    if(f==='industries.html'||f.startsWith('industry-')) return 'industries';
    if(f==='about.html') return 'about';
    return '';
  }

  function universalNav(){
    const header=document.querySelector('.site-header');
    if(!header) return;
    const active=currentSection();
    const item=(key,label,href)=>`<a href="${href}" class="${active===key?'active':''}">${label}</a>`;
    header.innerHTML=`<div class="container nav"><a href="index.html" class="brand" aria-label="Zavoryn Home"><img src="assets/img/zavoryn-logo.png" alt="Zavoryn" class="brand-logo"></a><button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="zavoryn-primary-nav">☰</button><nav class="nav-links" id="zavoryn-primary-nav" aria-label="Primary navigation">${item('home','Home','index.html')}${item('services','Services','services.html')}${item('work','Work','portfolio.html')}${item('cases','Case Studies','case-studies.html')}${item('tools','Tools','tools.html')}${item('industries','Industries','industries.html')}${item('about','About','about.html')}<a class="btn small nav-cta" href="project-planner.html" data-track="start_project_click">Start a project <span aria-hidden="true">↗</span></a></nav></div>`;
  }

  const socials={
    instagram:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.7" r=".8" fill="currentColor" stroke="none"/></svg>',
    facebook:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 20v-7h2.5l.4-3h-2.9V8.1c0-.9.25-1.6 1.6-1.6h1.7V3.8c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2V10H8v3h2.4v7h3.1Z"/></svg>',
    email:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 5.5h16v13H4z"/><path d="m5 7 7 5 7-5"/></svg>'
  };

  function universalFooter(){
    const footer=document.querySelector('.site-footer');
    if(!footer) return;
    footer.innerHTML=`<div class="container footer-grid"><div class="footer-brand"><a href="index.html" class="brand" aria-label="Zavoryn Home"><img src="assets/img/zavoryn-logo.png" alt="Zavoryn" class="brand-logo"></a><p class="copy">Digital systems, design and automation built around real business goals.</p><div class="footer-mini">Web · Brand · Growth · AI · Automation</div><div class="footer-socials"><a href="https://www.instagram.com/zavoryn.official/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${socials.instagram}</a><a href="https://www.facebook.com/zavoryn.official/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">${socials.facebook}</a><a href="mailto:zavoryn@outlook.com" aria-label="Email">${socials.email}</a></div></div><div><div class="footer-title">Explore</div><div class="footer-links"><a href="services.html">Services</a><a href="portfolio.html">Work</a><a href="case-studies.html">Case Studies</a><a href="tools.html">Zavoryn Lab</a><a href="industries.html">Industries</a><a href="about.html">About</a></div></div><div><div class="footer-title">Start here</div><div class="footer-links"><a href="project-planner.html">Project Planner</a><a href="tool-website-cost.html">Website Cost</a><a href="website-audit.html">Website Audit</a><a href="contact.html">Contact</a></div><div class="footer-title footer-connect">More</div><div class="footer-links"><a href="packages.html">Packages</a><a href="process.html">Process</a><a href="faq.html">FAQ</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a></div></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} ZAVORYN. All rights reserved.</span><span>Make Business Smarter.</span></div>`;
  }

  function a11y(){
    if(!document.querySelector('.skip-link')){const a=document.createElement('a');a.className='skip-link';a.href='#main-content';a.textContent='Skip to content';document.body.prepend(a)}
    const main=document.querySelector('main');if(main&&!main.id)main.id='main-content';
  }

  function initNav(){
    const menu=document.querySelector('.menu-btn'),nav=document.querySelector('.nav-links');
    if(!menu||!nav) return;
    const close=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open menu')};
    menu.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Open menu')});
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  }

  function initHeader(){
    const header=document.querySelector('.site-header');if(!header) return;
    const update=()=>header.classList.toggle('scrolled',window.scrollY>8);
    update();window.addEventListener('scroll',update,{passive:true});
  }

  function track(name,label=''){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:name,label})}
  function initTracking(){document.querySelectorAll('[data-track]').forEach(el=>el.addEventListener('click',()=>track(el.dataset.track,(el.textContent||'').trim())))}

  const cardMap={website:'card-website.svg',brand:'card-brand.svg',social:'card-social.svg',content:'card-content.svg',growth:'card-growth.svg',automation:'card-automation.svg',tool:'card-tool.svg',case:'card-case.svg',industry:'card-industry.svg',system:'card-system.svg'};
  function cardKind(el){const t=(el.innerText||'').toLowerCase();if(el.classList.contains('tool-card'))return'tool';if(el.classList.contains('case-card'))return'case';if(el.classList.contains('industry-card'))return'industry';if(t.includes('automation')||t.includes('workflow'))return'automation';if(t.includes('content')&&!t.includes('social'))return'content';if(t.includes('brand')||t.includes('logo')||t.includes('identity'))return'brand';if(t.includes('social'))return'social';if(t.includes('growth')||t.includes('marketing')||t.includes('lead'))return'growth';if(t.includes('seo')||t.includes('analytics'))return'system';return'website'}
  function injectCardGraphics(){document.querySelectorAll('.service,.tool-card,.case-card,.industry-card').forEach(el=>{if(el.querySelector('.card-graphic')||el.querySelector('.card-media'))return;const g=document.createElement('div');g.className='card-graphic';g.setAttribute('aria-hidden','true');g.innerHTML=`<img src="assets/img/${cardMap[cardKind(el)]}" alt="" loading="lazy" decoding="async">`;el.prepend(g)})}

  async function contents(path){
    const key=`zavoryn:${Z.owner}/${Z.repo}:${Z.branch}:${path}`;
    try{const cached=JSON.parse(localStorage.getItem(key)||'null');if(cached&&Date.now()-cached.time<CACHE_TTL)return cached.data}catch{}
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
    try{const r=await fetch(`${API}${path}?ref=${encodeURIComponent(Z.branch||'main')}`,{headers:{Accept:'application/vnd.github+json'},signal:controller.signal,cache:'force-cache'});if(!r.ok)throw new Error(`GitHub API ${r.status}`);const data=await r.json();try{localStorage.setItem(key,JSON.stringify({time:Date.now(),data}))}catch{}return data}finally{clearTimeout(timer)}
  }
  async function images(path){try{const items=await contents(path),out=[];const walk=async list=>{for(const item of list||[]){if(item.type==='file'&&isImg(item.name))out.push(item);else if(item.type==='dir'){try{await walk(await contents(item.path))}catch(e){console.warn('Catalogue folder',item.path,e)}}}};await walk(items);return out}catch(e){console.warn('Catalogue',path,e);return[]}}
  function makeLightbox(){if(document.getElementById('z-lightbox'))return;const box=document.createElement('div');box.id='z-lightbox';box.className='lightbox';box.setAttribute('aria-hidden','true');box.innerHTML='<button type="button" class="lightbox-close" aria-label="Close image">×</button><img alt="">';document.body.appendChild(box);box.addEventListener('click',e=>{if(e.target===box||e.target.closest('.lightbox-close'))closeLightbox()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox()})}
  function openLightbox(src,alt){const box=document.getElementById('z-lightbox');if(!box)return;box.querySelector('img').src=src;box.querySelector('img').alt=alt;box.classList.add('open');box.setAttribute('aria-hidden','false')}
  function closeLightbox(){const box=document.getElementById('z-lightbox');if(!box)return;box.classList.remove('open');box.setAttribute('aria-hidden','true')}
  function mediaCard(file,label){const el=document.createElement('article'),src=file.download_url,alt=clean(file.name);el.className='media-card reveal';el.innerHTML=`<button class="media-button" type="button" aria-label="Open ${alt}"><div class="media-image"><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></div><div class="media-meta"><span>${label}</span></div></button>`;el.querySelector('button').addEventListener('click',()=>openLightbox(src,alt));return el}
  async function renderGallery(element,path,label,limit=999){if(!element)return;element.innerHTML='<div class="loading">Loading work…</div>';const files=await images(path);if(!files.length){element.innerHTML='<div class="notice">No work could be loaded right now.</div>';return}element.innerHTML='';files.slice(0,limit).forEach(f=>element.appendChild(mediaCard(f,label)));observe()}
  function initGalleryPages(){const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();const map={'brand-design.html':['assets/img/brand-designing/logos','Brand Design'],'logos.html':['assets/img/brand-designing/logos','Logo Design'],'letterheads.html':['assets/img/brand-designing/letterheads','Letterheads'],'business-cards.html':['assets/img/brand-designing/business-cards','Business Cards'],'stationery.html':['assets/img/brand-designing/stationery','Stationery'],'brand-guidelines.html':['assets/img/brand-designing/brand-guidelines','Brand Guidelines'],'post-design.html':['assets/img/post-designing','Post Design'],'social-media.html':['assets/img/social-media-management','Social Media'],'ai-automation.html':['assets/img/ai-automation','AI & Automation']};const el=document.querySelector('[data-gallery]');if(el&&map[file])renderGallery(el,...map[file])}

  const goals={leads:{title:'Build a stronger acquisition system',copy:'Map the path from attention to enquiry and fix the highest-impact leak before buying more traffic.',stack:['Website','Lead Generation','Conversion','Growth Marketing']},website:{title:'Build a website with a job to do',copy:'Clarify the audience, offer, structure and next action before choosing the visual layer.',stack:['Strategy','UX','Development','SEO']},brand:{title:'Build a recognizable brand system',copy:'Create a consistent identity across website, social and customer touchpoints.',stack:['Brand Strategy','Identity','Website','Content']},conversion:{title:'Improve the path to action',copy:'Find where visitors hesitate and improve clarity, proof, offer or friction.',stack:['UX','Landing Pages','Conversion','Analytics']},automation:{title:'Remove repetitive work',copy:'Map repeatable work and connect tools where AI and automation can create useful leverage.',stack:['Process Mapping','AI','Automation','Integrations']},social:{title:'Make social support the business',copy:'Build a repeatable content system around a clear audience, message and business goal.',stack:['Strategy','Content','Social','Reporting']},ecommerce:{title:'Turn product discovery into purchase',copy:'Connect product presentation, trust, merchandising and checkout into one clear journey.',stack:['E-commerce','UX','Conversion','Analytics']},seo:{title:'Build durable search visibility',copy:'Start with technical foundations, useful content and local relevance before chasing more traffic.',stack:['Technical SEO','Content','Local SEO','Analytics']},unsure:{title:'Start with the problem',copy:'Use the Project Planner to describe the goal and get a focused starting direction.',stack:['Project Planner','Website Audit','Strategy']}};
  function initGoals(){const root=document.querySelector('[data-goal-selector]');if(!root)return;const output=root.querySelector('[data-goal-output]'),buttons=[...root.querySelectorAll('[data-goal]')];const render=k=>{const item=goals[k]||goals.unsure;buttons.forEach(b=>{const on=b.dataset.goal===k;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});if(output)output.innerHTML=`<small>Recommended direction</small><h3>${item.title}</h3><p>${item.copy}</p><div class="goal-stack">${item.stack.map(x=>`<span>${x}</span>`).join('')}</div>`};buttons.forEach(b=>b.addEventListener('click',()=>render(b.dataset.goal)));render('leads')}
  function initFeatured(){const root=document.querySelector('[data-home-work]'),items=portfolio.websites||[];if(!root||!items.length)return;const [main,...rest]=items;root.innerHTML=`<article class="work-main"><img src="${main.cover}" alt="${main.title}" loading="lazy" decoding="async"><div class="work-overlay"><span class="tag">${main.category}</span><h3>${main.title}</h3><p>${main.description}</p><a href="${main.url}">View project ↗</a></div></article>${rest.slice(0,2).map(item=>`<article class="work-side"><img src="${item.cover}" alt="${item.title}" loading="lazy" decoding="async"><div class="work-overlay"><span class="tag">${item.category}</span><h3>${item.title}</h3><a href="${item.url}">View project ↗</a></div></article>`).join('')}`}
  function observe(){const els=document.querySelectorAll('.reveal:not(.visible)');if(!els.length)return;if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion:reduce)').matches){els.forEach(e=>e.classList.add('visible'));return}const ob=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');ob.unobserve(e.target)}}),{threshold:.08});els.forEach(e=>ob.observe(e))}

  document.addEventListener('DOMContentLoaded',()=>{injectStyle('zavoryn-quality-css','assets/brand-upgrades.css');injectStyle('zavoryn-global-css','assets/zavoryn-global.css');universalNav();universalFooter();a11y();makeLightbox();initNav();initHeader();initTracking();injectCardGraphics();initGoals();initFeatured();initGalleryPages();observe();const loader=document.createElement('script');loader.src='assets/production-upgrade.js';loader.async=true;document.head.appendChild(loader)});
  window.Zavoryn={track,renderGallery,openLightbox,closeLightbox};
})();
