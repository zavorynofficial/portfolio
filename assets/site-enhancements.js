(() => {
  'use strict';
  const portfolio = window.ZAVORYN_PORTFOLIO || {};
  const goalData = {
    leads:{title:'Build a stronger acquisition system',copy:'Map the path from attention to enquiry, then fix the highest-impact leak before buying more traffic.',stack:['Website','Lead Generation','Conversion','Growth Marketing']},
    website:{title:'Build a website with a job to do',copy:'Clarify the audience, offer, structure and next action before choosing the visual layer.',stack:['Strategy','UX','Development','SEO']},
    brand:{title:'Build a recognizable brand system',copy:'Create a consistent identity that can carry across your website, social presence and sales touchpoints.',stack:['Brand Strategy','Identity','Website','Content']},
    conversion:{title:'Improve the path to action',copy:'Find the point where visitors hesitate, then improve clarity, proof, offer or friction.',stack:['UX','Landing Pages','Conversion','Analytics']},
    automation:{title:'Remove repetitive work',copy:'Map repeatable work and connect tools where AI and automation can create useful leverage.',stack:['Process Mapping','AI','Automation','Integrations']},
    social:{title:'Make social support the business',copy:'Build a repeatable content system around a clear audience, message and business goal.',stack:['Strategy','Content','Social','Reporting']},
    ecommerce:{title:'Turn product discovery into purchase',copy:'Connect product presentation, trust, merchandising and checkout into one clear customer journey.',stack:['E-commerce','UX','Conversion','Analytics']},
    seo:{title:'Build durable search visibility',copy:'Start with technical foundations, useful content and local relevance before chasing more traffic.',stack:['Technical SEO','Content','Local SEO','Analytics']},
    unsure:{title:'Start with the problem',copy:'Use the Project Planner to describe the business goal and get a focused starting direction.',stack:['Project Planner','Website Audit','Strategy']}
  };
  function initGoals(){document.querySelectorAll('[data-goal-selector]').forEach(root=>{const output=root.querySelector('[data-goal-output]');const buttons=[...root.querySelectorAll('[data-goal]')];const render=key=>{const item=goalData[key]||goalData.unsure;buttons.forEach(b=>{const on=b.dataset.goal===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});if(output)output.innerHTML=`<small>Recommended direction</small><h3>${item.title}</h3><p>${item.copy}</p><div class="goal-stack">${item.stack.map(x=>`<span>${x}</span>`).join('')}</div>`};buttons.forEach(b=>b.addEventListener('click',()=>render(b.dataset.goal)));render('leads')})}
  function initFeatured(){const root=document.querySelector('[data-home-work]'),items=portfolio.websites||[];if(!root||!items.length)return;const [main,...rest]=items;root.innerHTML=`<article class="work-main"><img src="${main.cover}" alt="${main.title}" loading="lazy" decoding="async"><div class="work-overlay"><span class="tag">${main.category}</span><h3>${main.title}</h3><p>${main.description}</p><a href="${main.url}">View project ↗</a></div></article>${rest.slice(0,2).map(item=>`<article class="work-side"><img src="${item.cover}" alt="${item.title}" loading="lazy" decoding="async"><div class="work-overlay"><span class="tag">${item.category}</span><h3>${item.title}</h3><a href="${item.url}">View project ↗</a></div></article>`).join('')}`}
  function initMetrics(){const cards=[...document.querySelectorAll('[data-metric]')];if(!cards.length)return;const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('metric-visible');observer.unobserve(entry.target)}}),{threshold:.2});cards.forEach(c=>observer.observe(c))}
  const init=()=>{initGoals();initFeatured();initMetrics()};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
