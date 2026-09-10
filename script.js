const API_BASE=`${window.METROCITY_SUPABASE_URL}/rest/v1`;
const API_KEY=window.METROCITY_SUPABASE_KEY;
async function publicGet(path){const r=await fetch(API_BASE+path,{headers:{apikey:API_KEY,Authorization:`Bearer ${API_KEY}`},cache:'no-store'});if(!r.ok){let d='';try{d=await r.text()}catch{}throw new Error(`Supabase ${r.status}: ${d||r.statusText}`)}return r.json()}
async function publicPost(path,body){const r=await fetch(API_BASE+path,{method:'POST',headers:{apikey:API_KEY,Authorization:`Bearer ${API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(`Supabase ${r.status}`);return r.text()}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const marathiDate=d=>new Intl.DateTimeFormat('mr-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'}).format(d);
const istParts=d=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(d));const o=Object.fromEntries(parts.map(x=>[x.type,x.value]));return `${o.year}-${o.month}-${o.day}`};
const dateKey=d=>istParts(d);
const timeLabel=d=>new Intl.DateTimeFormat('mr-IN',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'}).format(new Date(d));
let editions=[];let selectedEdition=null;let currentPage=0;let zoom=1;let pages=[];let drag=null;
const $=s=>document.querySelector(s);
function setText(id,text){const e=document.getElementById(id);if(e)e.textContent=text}
function openDates(){const d=$('#date-drawer');if(!d)return;d.classList.add('open');d.setAttribute('aria-hidden','false')}
function closeDates(){const d=$('#date-drawer');if(!d)return;d.classList.remove('open');d.setAttribute('aria-hidden','true')}
function editionLabel(item){return item.dateKey?marathiDate(new Date(`${item.dateKey}T00:00:00+05:30`)):marathiDate(new Date(item.published_at||item.created_at))}
function groupEditions(rows){
 const sorted=[...(rows||[])].sort((a,b)=>new Date(b.published_at||b.created_at)-new Date(a.published_at||a.created_at));
 const map=new Map();
 for(const row of sorted){
   const key=dateKey(row.published_at||row.created_at);
   if(!map.has(key))map.set(key,{id:`day-${key}`,dateKey:key,items:[],headline:row.headline,location:row.location,latestAt:row.published_at||row.created_at});
   map.get(key).items.push(row);
 }
 return [...map.values()];
}
function groupPageCount(group){return group?.items?.length||0}
function groupTitle(group){return group?.headline||'मेट्रोसिटी पोस्ट — ई-पेपर'}
function renderEditionList(){
 const box=$('#edition-list');if(!box)return;
 if(!editions.length){box.innerHTML='<div class="rail-loading">अंक उपलब्ध नाहीत.</div>';return}
 box.innerHTML=editions.map((g,i)=>{const active=selectedEdition&&selectedEdition.id===g.id;return `<button class="edition-item ${active?'active':''}" data-index="${i}"><span><b>${esc(groupTitle(g))}</b><small>${editionLabel(g)} • ${groupPageCount(g)} ${groupPageCount(g)===1?'पान':'पाने'} • शेवटचे अपलोड ${timeLabel(g.latestAt)}${g.location?' • '+esc(g.location):''}</small></span><span class="edition-arrow">›</span></button>`}).join('');
 box.querySelectorAll('.edition-item').forEach((b,i)=>b.addEventListener('click',()=>{selectEdition(editions[i]);closeDates()}));
}
function renderRecentEditions(){
 const box=$('#recent-editions-list');if(!box)return;
 if(!editions.length){box.innerHTML='<div class="rail-loading">अजून कोणताही ई-पेपर प्रकाशित झालेला नाही.</div>';return}
 box.innerHTML=editions.slice(0,12).map((g,i)=>{const first=g.items[0]||{};return `<button class="recent-card" type="button" data-recent-index="${i}"><span class="recent-thumb">${first.main_image_url?`<img src="${esc(first.main_image_url)}" alt="" loading="lazy">`:'📰'}</span><span><b>${esc(groupTitle(g))}</b><small>${editionLabel(g)} • ${groupPageCount(g)} ${groupPageCount(g)===1?'पान':'पाने'} • शेवटचे अपलोड ${timeLabel(g.latestAt)}</small></span><span class="recent-arrow">›</span></button>`}).join('');
 box.querySelectorAll('[data-recent-index]').forEach(b=>b.addEventListener('click',()=>{selectEdition(editions[Number(b.dataset.recentIndex)]);window.scrollTo({top:0,behavior:'smooth'})}));
}
function getPages(n){const urls=[];if(n.main_image_url)urls.push(n.main_image_url);if(Array.isArray(n.news_photos))for(const p of n.news_photos)if(p.image_url&&!urls.includes(p.image_url))urls.push(p.image_url);return urls}
async function enrichEdition(n){let photos=[];try{photos=await publicGet(`/news_photos?select=image_url,sort_order&news_id=eq.${encodeURIComponent(n.id)}&order=sort_order.asc`)}catch(e){console.warn('photo list',e)}return {...n,news_photos:photos||[]}}
function getFitWidth(){
 const img=$('#paper-image'),view=$('#paper-viewport');
 if(!img||!view)return 0;
 const cs=getComputedStyle(view);
 const pad=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
 return Math.max(80,view.clientWidth-pad);
}
function resetZoom(){zoom=1;applyZoom(true)}
function applyZoom(resetScroll=false){
 const img=$('#paper-image'),view=$('#paper-viewport');if(!img)return;
 const pct=Math.round(zoom*100);
 setText('zoom-value',`${pct}%`);setText('zoom-value-top',`${pct}%`);
 img.classList.toggle('zoomed',zoom>1.01);
 view.classList.toggle('is-zoomed',zoom>1.01);
 const fitWidth=getFitWidth();
 if(fitWidth){
   img.style.transform='none';
   img.style.width=`${fitWidth*zoom}px`;
   img.style.maxWidth='none';
   img.style.height='auto';
 }
 if(zoom<=1.01){
   img.style.width=`${fitWidth||100}%`;
   if(resetScroll){view.scrollTop=0;view.scrollLeft=0;}
 }
}
function selectPage(i){if(!pages.length)return;currentPage=Math.max(0,Math.min(i,pages.length-1));const img=$('#paper-image'),loading=$('#paper-loading');if(!img)return;loading.style.display='flex';img.style.visibility='hidden';resetZoom();img.onload=()=>{loading.style.display='none';img.style.visibility='visible'};img.onerror=()=>{loading.innerHTML='<span>हे पान लोड करता आले नाही. पुन्हा प्रयत्न करा.</span>';img.style.visibility='hidden'};img.src=pages[currentPage];setText('page-current',String(currentPage+1));setText('page-total',String(pages.length));setText('mobile-page-label',`पान ${currentPage+1}`);setText('rail-count',String(pages.length));setText('fullscreen-label',`पान ${currentPage+1} / ${pages.length}`);document.querySelectorAll('.thumb').forEach((x,i2)=>x.classList.toggle('active',i2===currentPage));updateNav()}
function updateNav(){const prev=$('#prev-page'),next=$('#next-page'),mp=$('#mobile-prev'),mn=$('#mobile-next'),fp=$('#fs-prev'),fn=$('#fs-next');[prev,mp,fp].forEach(x=>{if(x)x.disabled=currentPage<=0});[next,mn,fn].forEach(x=>{if(x)x.disabled=currentPage>=pages.length-1})}
function renderThumbnails(){const box=$('#thumbnails');if(!box)return;if(!pages.length){box.innerHTML='<div class="rail-loading">पाने उपलब्ध नाहीत.</div>';return}box.innerHTML=pages.map((u,i)=>`<button class="thumb ${i===currentPage?'active':''}" type="button" aria-label="पान ${i+1}"><img src="${esc(u)}" alt="पान ${i+1}" loading="lazy"><span>पान ${i+1}</span></button>`).join('');box.querySelectorAll('.thumb').forEach((b,i)=>b.addEventListener('click',()=>selectPage(i)))}
async function selectEdition(group){
 selectedEdition=group;
 setText('edition-title',groupTitle(group));
 setText('edition-date',editionLabel(group));
 const enriched=await Promise.all((group.items||[]).map(enrichEdition));
 pages=[];
 // Each upload during a day is a page, newest upload first. If an upload contains
 // additional photos, those remain attached after its main page.
 for(const item of enriched){pages.push(...getPages(item))}
 currentPage=0;
 renderEditionList();
 renderThumbnails();
 if(!pages.length){$('#paper-image').style.display='none';$('#paper-empty').hidden=false;$('#paper-loading').style.display='none';updateNav();return}
 $('#paper-image').style.display='block';$('#paper-empty').hidden=true;$('#paper-loading').innerHTML='<div class="spinner"></div><span>ई-पेपर लोड होत आहे…</span>';selectPage(0);
}
async function loadSingle(){const slug=new URLSearchParams(location.search).get('slug');if(!slug)return false;try{const rows=await publicGet(`/news?select=id,slug,headline,location,main_image_url,epaper_layout,published_at,created_at&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`);if(!rows?.length){setText('edition-title','ई-पेपर उपलब्ध नाही');setText('edition-date','ही आवृत्ती सापडली नाही.');$('#paper-loading').style.display='none';$('#paper-empty').hidden=false;return true}const groups=groupEditions(rows);await selectEdition(groups[0]);return true}catch(e){console.error(e);setText('edition-title','ई-पेपर लोड झाले नाही');$('#paper-loading').innerHTML='<span>ही आवृत्ती लोड करताना अडचण आली.</span>';return true}}
async function loadHome(){try{const rows=await publicGet('/news?select=id,slug,headline,location,main_image_url,epaper_layout,published_at,created_at&status=eq.published&epaper_layout=eq.direct-newspaper&order=published_at.desc&limit=100');editions=groupEditions(rows||[]);renderEditionList();renderRecentEditions();if(editions.length)await selectEdition(editions[0]);else{setText('edition-date','अजून कोणताही ई-पेपर प्रकाशित झालेला नाही.');$('#paper-loading').style.display='none';$('#paper-empty').hidden=false}}catch(e){console.error(e);$('#paper-loading').innerHTML='<span>ई-पेपर लोड करताना अडचण आली. कृपया पुन्हा प्रयत्न करा.</span>'}}
async function shareCurrent(){try{await (navigator.share?navigator.share({title:`${selectedEdition?.headline||'मेट्रोसिटी पोस्ट'} — ई-पेपर`,url:location.href}):navigator.clipboard.writeText(location.href));if(!navigator.share)alert('ई-पेपरची लिंक कॉपी झाली आहे.')}catch(e){}}
async function downloadCurrentPage(){
 if(!pages.length)return;
 const url=pages[currentPage];
 const stamp=dateKey(selectedEdition?.published_at||selectedEdition?.created_at||new Date());
 const filename=`metrocity-post-${stamp}-page-${currentPage+1}.jpg`;
 try{
   const r=await fetch(url,{mode:'cors',cache:'no-store'});
   if(!r.ok)throw new Error('download failed');
   const blob=await r.blob();
   const blobUrl=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=blobUrl;a.download=filename;document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(blobUrl),1500);
 }catch(e){
   const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.download=filename;document.body.appendChild(a);a.click();a.remove();
 }
}
async function openFullscreen(){
 if(!pages.length)return;
 const f=$('#fullscreen-reader'),img=$('#fullscreen-image');
 img.src=pages[currentPage];
 setText('fullscreen-label',`पान ${currentPage+1} / ${pages.length}`);
 f.classList.add('open');f.setAttribute('aria-hidden','false');
 document.body.classList.add('fullscreen-active');
 // Native fullscreen when supported; the CSS reader remains available as a fallback.
 try{
   if(document.fullscreenEnabled && f.requestFullscreen) await f.requestFullscreen();
 }catch(e){ console.debug('Native fullscreen unavailable; using reader fullscreen.',e); }
}
async function closeFullscreen(){
 const f=$('#fullscreen-reader');
 f.classList.remove('open');f.setAttribute('aria-hidden','true');
 $('#fullscreen-image').removeAttribute('src');
 document.body.classList.remove('fullscreen-active');
 try{if(document.fullscreenElement)await document.exitFullscreen()}catch(e){}
}
function updateFullscreenPage(){
 const img=$('#fullscreen-image');
 if(img)img.src=pages[currentPage]||'';
 setText('fullscreen-label',`पान ${currentPage+1} / ${pages.length}`);
 updateNav();
}
function changePage(delta){
 const next=Math.max(0,Math.min(currentPage+delta,pages.length-1));
 if(next===currentPage)return;
 const keepY=window.scrollY;
 selectPage(next);
 requestAnimationFrame(()=>window.scrollTo(0,keepY));
}
function bindReader(){
 const bind=(id,fn)=>document.getElementById(id)?.addEventListener('click',fn);
 const zoomIn=()=>{zoom=Math.min(3,+(zoom+0.25).toFixed(2));applyZoom()};
 const zoomOut=()=>{zoom=Math.max(1,+(zoom-0.25).toFixed(2));applyZoom()};
 bind('zoom-in-top',zoomIn);bind('zoom-out-top',zoomOut);bind('fit-top',resetZoom);
 bind('download-top',downloadCurrentPage);bind('fullscreen-top',openFullscreen);
 bind('date-open',openDates);bind('date-close',closeDates);
 $('#date-drawer')?.addEventListener('click',e=>{if(e.target.id==='date-drawer')closeDates()});
 bind('share-btn',shareCurrent);bind('download-btn',downloadCurrentPage);
 bind('prev-page',()=>changePage(-1));bind('next-page',()=>changePage(1));
 bind('mobile-prev',()=>changePage(-1));bind('mobile-next',()=>changePage(1));
 bind('zoom-in',zoomIn);bind('zoom-out',zoomOut);bind('fit-btn',resetZoom);bind('fullscreen-btn',openFullscreen);
 bind('fullscreen-close',closeFullscreen);bind('fs-prev',()=>changePage(-1));bind('fs-next',()=>changePage(1));bind('fs-download',downloadCurrentPage);
 $('#fullscreen-reader')?.addEventListener('click',e=>{if(e.target.id==='fullscreen-reader')closeFullscreen()});
 document.addEventListener('fullscreenchange',()=>{
   if(!document.fullscreenElement && $('#fullscreen-reader')?.classList.contains('open')){
     // Keep the in-page fullscreen reader open if the browser exits native fullscreen.
     return;
   }
 });
 document.addEventListener('keydown',e=>{
   if(e.key==='Escape'){closeDates();if($('#fullscreen-reader')?.classList.contains('open'))closeFullscreen();}
   if(e.key==='ArrowLeft')changePage(-1);if(e.key==='ArrowRight')changePage(1);
   if(e.key==='+'||e.key==='=')zoomIn();if(e.key==='-')zoomOut();
 });
 const view=$('#paper-viewport');
 let swipe=null;
 view?.addEventListener('touchstart',e=>{
   if(e.touches.length!==1)return;
   swipe={x:e.touches[0].clientX,y:e.touches[0].clientY,scrollY:window.scrollY};
 },{passive:true});
 view?.addEventListener('touchend',e=>{
   if(!swipe||e.changedTouches.length!==1){swipe=null;return;}
   const dx=e.changedTouches[0].clientX-swipe.x,dy=e.changedTouches[0].clientY-swipe.y;
   const startY=swipe.scrollY;swipe=null;
   if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.35){
     changePage(dx<0?1:-1);
     requestAnimationFrame(()=>window.scrollTo({top:startY,behavior:'auto'}));
   }
 },{passive:true});
 window.addEventListener('resize',()=>{if(zoom<=1.01)applyZoom();});
}
document.addEventListener('DOMContentLoaded',()=>{bindReader();if(document.body.classList.contains('single-paper'))loadSingle();else loadHome()});
