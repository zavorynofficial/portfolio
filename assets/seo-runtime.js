(()=>{'use strict';
const file=location.pathname.split('/').pop().toLowerCase()||'index.html';
const base='https://zavoryn.pages.dev/';
const titleMap={
'index.html':'ZAVORYN | Digital Systems for Smarter Businesses',
'services.html':'Services | ZAVORYN Digital Systems',
'portfolio.html':'Work | ZAVORYN Digital Studio',
'case-studies.html':'Case Studies | ZAVORYN',
'industries.html':'Industries | ZAVORYN',
'tools.html':'Zavoryn Lab | Business Tools & Calculators',
'about.html':'About | ZAVORYN',
'contact.html':'Contact | ZAVORYN',
'project-planner.html':'Project Planner | ZAVORYN',
'website-audit.html':'Website Audit | ZAVORYN'
};
function meta(name,content,attr='name'){let el=document.head.querySelector(`meta[${attr}="${name}"]`);if(!el){el=document.createElement('meta');el.setAttribute(attr,name);document.head.appendChild(el)}el.setAttribute('content',content)}
function ensureLink(rel,href){let el=document.head.querySelector(`link[rel="${rel}"]`);if(!el){el=document.createElement('link');el.rel=rel;document.head.appendChild(el)}el.href=href}
function run(){const title=document.title||titleMap[file]||`ZAVORYN | ${file.replace(/\.html$/,'')}`;document.title=title;const canonical=new URL(file==='index.html'?'':file,base).href.replace(/\/$/,'/');ensureLink('canonical',canonical);meta('robots','index,follow');meta('theme-color','#070a0c');meta('og:type','website','property');meta('og:title',title,'property');meta('og:site_name','ZAVORYN','property');meta('og:url',canonical,'property');meta('og:image',`${base}assets/img/zavoryn-og-cover.png`,'property');meta('twitter:card','summary_large_image');meta('twitter:title',title);meta('twitter:image',`${base}assets/img/zavoryn-og-cover.png`);
let schema=document.getElementById('zavoryn-organization-schema');if(!schema){schema=document.createElement('script');schema.id='zavoryn-organization-schema';schema.type='application/ld+json';schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Organization','name':'ZAVORYN','url':base,'email':'zavoryn@outlook.com','sameAs':['https://www.instagram.com/zavoryn.official/','https://www.facebook.com/zavoryn.official/']});document.head.appendChild(schema)}
const main=document.querySelector('main');if(main&&!main.id)main.id='main-content';document.querySelectorAll('img').forEach((img,i)=>{if(!img.alt)img.alt='ZAVORYN visual asset';if(i>1&&!img.hasAttribute('loading'))img.loading='lazy';if(!img.hasAttribute('decoding'))img.decoding='async'});document.querySelectorAll('a[target="_blank"]').forEach(a=>{const rel=(a.getAttribute('rel')||'').split(/\s+/).filter(Boolean);if(!rel.includes('noopener'))rel.push('noopener');if(!rel.includes('noreferrer'))rel.push('noreferrer');a.setAttribute('rel',rel.join(' '))});document.querySelectorAll('.nav-links a').forEach(a=>{if(a.classList.contains('active'))a.setAttribute('aria-current','page')});if('requestIdleCallback' in window)requestIdleCallback(()=>document.documentElement.classList.add('z-idle-ready'));else setTimeout(()=>document.documentElement.classList.add('z-idle-ready'),200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();