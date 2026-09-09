(()=>{'use strict';
const f=(location.pathname.split('/').pop()||'').toLowerCase();
if(!f.startsWith('service-')&&!['services.html'].includes(f))return;
const common={
'website-development':[['What does a website project include?','Scope can include strategy, information architecture, responsive UI, development, SEO foundations, analytics and launch QA.'],['How long does it take?','Timing depends on page count, content readiness, integrations and functionality. The project planner is a better starting point than a fixed promise.']],
'web-design-ux':[['Do you design before development?','Yes. The experience, information hierarchy and key flows should be understood before the interface is finalized.'],['Can you improve an existing site?','Yes. UX audits can identify friction, unclear hierarchy and conversion opportunities before a rebuild is considered.']],
'ecommerce':[['Can you work with an existing store?','Yes. The work can focus on product discovery, merchandising, trust, checkout or conversion without replacing the entire stack.'],['What should be measured?','Useful measurement depends on the business, but product views, add-to-cart, checkout and purchase are common decision points.']],
'brand-design':[['Is this more than a logo?','Yes. The goal is a repeatable visual system that works across digital and physical touchpoints.'],['Can existing branding be improved?','Yes. A focused refresh can preserve useful equity while fixing inconsistency.']],
'logo-design':[['Do you provide logo variations?','Where useful, yes: primary, responsive and monochrome versions plus practical usage guidance.'],['What makes a logo useful?','It should remain recognizable, legible and usable across the touchpoints where the business actually appears.']],
'brand-identity':[['What is included in an identity system?','Typical work includes type, color, composition, applications and usage rules alongside the core mark.'],['Can it cover social and web?','Yes. The system should be designed to stay consistent across customer touchpoints.']],
'social-media':[['Do you only create posts?','No. Strategy, content pillars, planning, publishing, community and reporting can be connected around a business goal.'],['Can social support lead generation?','Yes, when content, offer, landing experience and measurement are connected.']],
'content-design':[['Do you create reusable templates?','Yes. Reusable creative systems can reduce repeated design work while keeping a consistent brand.'],['Can one campaign work across formats?','Yes. A strong core concept can be adapted deliberately for different placements and sizes.']],
'growth-marketing':[['Do you promise a specific result?','No. Campaign outcomes depend on offer, market, creative, audience, economics and execution. We focus on measurable systems and testing.'],['What comes before scaling spend?','Clarify the offer, customer journey, conversion path and unit economics first.']],
'lead-generation':[['What happens after a form submission?','The system can include qualification, routing, notifications, follow-up and measurement so a lead does not disappear after capture.'],['Can you connect a CRM?','Where the chosen tools provide a suitable integration, yes.']],
'seo':[['How quickly does SEO work?','Timing varies by market, competition, site condition and content. SEO should be treated as a compounding system, not a guaranteed short-term result.'],['Do you only target rankings?','No. Search visibility matters because it should help the right people discover useful pages and take the next step.']],
'local-seo':[['Who benefits most from local SEO?','Businesses with location-based demand such as clinics, salons, trades, restaurants and local professional services.'],['Do you create location pages?','Where genuinely useful, yes. Pages should represent real services and locations rather than thin doorway content.']],
'conversion-optimization':[['Do you need more traffic first?','Not necessarily. Existing traffic can be enough to identify friction and test improvements.'],['How do you choose what to improve?','Prioritize hypotheses by likely impact, confidence and implementation effort, then measure the change.']],
'ai-automation':[['What should be automated first?','Start with repetitive, rules-based work where the process is understood and exceptions can be handled safely.'],['Does automation remove humans completely?','Not necessarily. Human review can remain part of the system where judgment or exceptions matter.']],
'business-automation':[['Which processes are good candidates?','Lead routing, recurring reporting, notifications, data transfer and other repeatable workflows are common starting points.'],['How do you handle exceptions?','Design explicit exception paths and ownership instead of assuming every case is identical.']],
'analytics-optimization':[['Do you install analytics tools?','The work starts with measurement needs and event definitions, then maps them to the available tooling.'],['What makes analytics useful?','A clear connection between measured events and real business decisions.']],
'maintenance-support':[['What does ongoing support cover?','Updates, fixes, performance hygiene, security checks and small improvements can be scoped into an ongoing support plan.'],['Can you support an existing website?','Yes, provided the stack and access allow safe maintenance.']],
'digital-strategy':[['When should strategy happen?','Before significant digital work when priorities, sequencing or business goals are unclear.'],['What is the output?','A focused diagnosis, priority roadmap, capability stack and recommended sequence of work.']]
};
const links={
'website-development':['websites.html','case-study-aurelia.html','tool-website-cost.html'],
'web-design-ux':['websites.html','case-study-ora-dental.html','website-audit.html'],
'ecommerce':['websites.html','tool-roi.html','tool-ltv-cac.html'],
'brand-design':['brand-design.html','logos.html','brand-guidelines.html'],
'logo-design':['logos.html','brand-design.html','project-planner.html'],
'brand-identity':['brand-design.html','social-brand.html','project-planner.html'],
'social-media':['social-media.html','post-design.html','tool-social-budget.html'],
'content-design':['post-design.html','social-media.html','tool-social-budget.html'],
'growth-marketing':['tool-roi.html','tool-media-roi.html','tool-funnel-roi.html'],
'lead-generation':['tool-funnel-roi.html','website-audit.html','project-planner.html'],
'seo':['website-audit.html','industry-real-estate.html','project-planner.html'],
'local-seo':['website-audit.html','industry-healthcare.html','project-planner.html'],
'conversion-optimization':['tool-conversion-lift.html','tool-funnel-roi.html','website-audit.html'],
'ai-automation':['tool-automation-roi.html','ai-automation.html','project-planner.html'],
'business-automation':['tool-automation-roi.html','tool-project-profitability.html','project-planner.html'],
'analytics-optimization':['tool-roi.html','tool-conversion-lift.html','website-audit.html'],
'maintenance-support':['website-audit.html','contact.html','project-planner.html'],
'digital-strategy':['project-planner.html','website-audit.html','tools.html']
};
function run(){const key=f.replace(/^service-/,'').replace(/\.html$/,'');const main=document.querySelector('main');if(!main||main.querySelector('.service-final-extra'))return;const wrap=document.createElement('section');wrap.className='section service-final-extra dark';const faq=common[key]||[];const related=links[key]||[];wrap.innerHTML=`<div class="container final-grid"><article class="final-panel"><div class="section-kicker">FAQ</div><h2>Common questions</h2><div class="detail-grid">${faq.map(x=>`<div class="detail-panel"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join('')}</div></article><article class="final-panel"><div class="section-kicker">Explore next</div><h2>Related ZAVORYN work and tools.</h2><div class="final-pills">${related.map(x=>{const label=x.replace(/\.html$/,'').replace(/^tool-/,'').replace(/^case-study-/,'').replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());return`<a class="final-pill" href="${x}">${label} ↗</a>`}).join('')}</div><p class="muted-note" style="margin-top:18px">Scope, timing and recommendations depend on your business context. Tools are planning models, not guarantees.</p></article></div>`;main.appendChild(wrap)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();