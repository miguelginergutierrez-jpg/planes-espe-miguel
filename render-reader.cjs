const path=require('node:path'),fs=require('node:fs');
function runtime(){return require(require('./reader-runtime.cjs').resolve('playwright'))}
// Every browser request is fulfilled by the same DNS-pinned public HTTP reader.
// No profile, cookies, filesystem URLs, private network or form submissions.
async function renderPage(url,{readResource,signal=AbortSignal.timeout(14000)}={}){
 const {chromium}=runtime();const edge=process.env.PLANES_BROWSER_PATH||[process.env['ProgramFiles(x86)'],process.env.ProgramFiles].filter(Boolean).map(p=>path.join(p,'Microsoft/Edge/Application/msedge.exe')).find(p=>fs.existsSync(p));
 const browser=await chromium.launch({headless:true,...(edge?{executablePath:edge}:{})});let requests=0,total=0;
 const close=()=>browser.close().catch(()=>{});signal.addEventListener('abort',close,{once:true});
 try{signal.throwIfAborted();const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:false,locale:'es-ES',timezoneId:'Europe/Madrid'});
  await context.routeWebSocket('**/*',route=>route.close());
  await context.route('**/*',async route=>{try{const r=route.request();if(r.method()!=='GET'||['image','media','font','stylesheet'].includes(r.resourceType())||++requests>70||total>18000000||signal.aborted)return await route.abort();const data=await readResource(r.url(),{signal});total+=data.body.length;if(total>18000000)return await route.abort();await route.fulfill({status:200,contentType:data.headers['content-type']||'text/plain',headers:{'access-control-allow-origin':'*'},body:data.body})}catch{await route.abort().catch(()=>{})}});
  const page=await context.newPage();await page.goto(url,{waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForLoadState('networkidle',{timeout:4500}).catch(()=>{});
  // Details are already in the DOM. Opening them and scrolling triggers lazy content without clicking purchase or account controls.
  await page.evaluate(()=>{document.querySelectorAll('details').forEach(d=>d.open=true);window.scrollTo(0,document.body.scrollHeight)});
  await page.waitForLoadState('networkidle',{timeout:1500}).catch(()=>{});
  await page.evaluate(()=>{
   function read(item,depth=0){if(depth>8)return {};const value={'@type':(item.getAttribute('itemtype')||'').split('/').pop()};const refs=(item.getAttribute('itemref')||'').split(/\s+/).map(id=>document.getElementById(id)).filter(Boolean);const elements=[...item.querySelectorAll('[itemprop]'),...refs.flatMap(r=>[r,...r.querySelectorAll('[itemprop]')])];
    for(const el of elements){const parent=el.parentElement?.closest('[itemscope]');if(parent!==item&&!refs.some(r=>r===el||r.contains(el)))continue;const v=el.hasAttribute('itemscope')?read(el,depth+1):el.getAttribute('content')||el.getAttribute('datetime')||el.getAttribute('href')||el.getAttribute('src')||el.textContent.trim();for(const key of (el.getAttribute('itemprop')||'').split(/\s+/).filter(Boolean)){if(value[key]!==undefined)value[key]=[].concat(value[key],v);else value[key]=v;}}
    return value;
   }
   const nodes=[...document.querySelectorAll('[itemscope][itemtype]')].filter(el=>/\/(?:\w*Event|Product|Restaurant|TouristAttraction)$/.test(el.getAttribute('itemtype'))&&!el.parentElement?.closest('[itemscope]')).map(el=>read(el));if(nodes.length){const script=document.createElement('script');script.type='application/ld+json';script.textContent=JSON.stringify({'@graph':nodes}).replace(/</g,'\\u003c');document.head.appendChild(script)}
  });
  const html=await page.content();return {url:page.url(),html,format:'html',rendered:true};
 }finally{signal.removeEventListener('abort',close);await close()}
}
module.exports={renderPage};
