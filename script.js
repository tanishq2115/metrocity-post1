const {createClient}=window.supabase;const db=createClient(window.METROCITY_SUPABASE_URL,window.METROCITY_SUPABASE_KEY);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const marathiDate=d=>new Intl.DateTimeFormat('mr-IN',{day:'numeric',month:'long',year:'numeric'}).format(d);
const relativeTime=d=>{const x=Date.now()-new Date(d).getTime(),m=Math.floor(x/60000);if(m<1)return'आत्ताच';if(m<60)return`${m} मिनिटांपूर्वी`;const h=Math.floor(m/60);if(h<24)return`${h} तासांपूर्वी`;return marathiDate(new Date(d))};
const img=(u,cls='')=>u?`<img class="${cls}" src="${esc(u)}" alt="">`:`<div class="${cls} placeholder">छायाचित्र उपलब्ध नाही</div>`;
const paragraphs=t=>String(t||'').split(/\n+/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('');
function toggleSearch(){document.getElementById('searchbar')?.classList.toggle('show');document.getElementById('search-input')?.focus()}
function setDate(){document.querySelectorAll('[data-current-date]').forEach(e=>e.textContent=marathiDate(new Date()))}
function articleUrl(slug){return `article.html?slug=${encodeURIComponent(slug)}`}
function card(n){return `<article class="home-story" onclick="location.href='${articleUrl(n.slug)}'" tabindex="0" role="link"><a class="home-story-media" href="${articleUrl(n.slug)}" onclick="event.stopPropagation()">${n.main_image_url?`<img src="${esc(n.main_image_url)}" alt="${esc(n.headline)}" loading="lazy" onerror="this.parentElement.classList.add('no-image');this.remove()">`:`<div class="no-image">मेट्रोसिटी पोस्ट</div>`}</a><div class="home-story-body"><div class="story-meta"><span class="tag">${esc(n.categories?.name||'बातमी')}</span><time>${relativeTime(n.published_at)}</time></div><h3><a href="${articleUrl(n.slug)}" onclick="event.stopPropagation()">${esc(n.headline)}</a></h3><p>${esc(n.subheadline||'ताज्या घडामोडींचे संक्षिप्त वृत्तांकन.').slice(0,180)}${String(n.subheadline||'').length>180?'…':''}</p><a class="read-more" href="${articleUrl(n.slug)}" onclick="event.stopPropagation()">पुढे वाचा <span>→</span></a></div></article>`}
async function loadHome(){
  const {data,error}=await db.from('news').select('id,slug,headline,subheadline,location,main_image_url,published_at,categories(name,slug)').eq('status','published').order('published_at',{ascending:false}).limit(40);
  if(error){document.querySelectorAll('.loading').forEach(x=>x.outerHTML='<div class="error">बातम्या लोड करता आल्या नाहीत.</div>');return}
  const latest=document.querySelector('#latest-grid');
  if(!data?.length){if(latest)latest.innerHTML='<div class="empty">अजून बातम्या प्रकाशित झालेल्या नाहीत.</div>';document.querySelector('#breaking-news').textContent='अजून ब्रेकिंग बातमी उपलब्ध नाही.';return}
  const [first,...rest]=data;
  document.querySelector('#breaking-news').innerHTML=`<a href="${articleUrl(first.slug)}">${esc(first.headline)}</a>`;
  if(latest){
    latest.innerHTML=`<article class="lead-story" onclick="location.href='${articleUrl(first.slug)}'">
      <a class="lead-media" href="${articleUrl(first.slug)}" onclick="event.stopPropagation()">${first.main_image_url?`<img src="${esc(first.main_image_url)}" alt="${esc(first.headline)}" onerror="this.parentElement.classList.add('no-image');this.remove()">`:`<div class="no-image">मेट्रोसिटी पोस्ट</div>`}<span class="lead-badge">ताजी बातमी</span></a>
      <div class="lead-copy"><div class="story-meta"><span class="tag">${esc(first.categories?.name||'बातमी')}</span><time>${relativeTime(first.published_at)}</time></div><h2><a href="${articleUrl(first.slug)}" onclick="event.stopPropagation()">${esc(first.headline)}</a></h2><p>${esc(first.subheadline||'ताज्या घडामोडींचे संक्षिप्त वृत्तांकन.')}</p><a class="read-more large" href="${articleUrl(first.slug)}" onclick="event.stopPropagation()">पुढे वाचा <span>→</span></a></div>
    </article>
    <div class="news-feed">${rest.slice(0,8).map(card).join('')}</div>`;
  }
  const mah=data.filter(n=>n.categories?.slug==='maharashtra').slice(0,4);
  const local=data.filter(n=>n.categories?.slug==='local').slice(0,4);
  const politics=data.filter(n=>n.categories?.slug==='politics').slice(0,4);
  const sports=data.filter(n=>n.categories?.slug==='sports').slice(0,4);
  const fill=(id,items,empty)=>{const el=document.querySelector(id);if(el)el.innerHTML=items.length?items.map(card).join(''):`<div class="empty">${empty}</div>`};
  fill('#maharashtra-grid',mah,'महाराष्ट्र विभागात अजून बातम्या नाहीत.');
  fill('#local-grid',local,'स्थानिक विभागात अजून बातम्या नाहीत.');
  fill('#politics-grid',politics,'राजकारण विभागात अजून बातम्या नाहीत.');
  fill('#sports-grid',sports,'क्रीडा विभागात अजून बातम्या नाहीत.');
}
async function searchNews(q){const box=document.querySelector('#search-results');if(!box)return;if(!q.trim()){box.innerHTML='';return}const term=q.trim().replace(/[%_,]/g,' ');const {data,error}=await db.from('news').select('slug,headline,subheadline,published_at,categories(name)').eq('status','published').or(`headline.ilike.%${term}%,subheadline.ilike.%${term}%`).order('published_at',{ascending:false}).limit(15);box.innerHTML=error?'<div class="error">शोध करताना अडचण आली.</div>':data?.length?data.map(n=>`<a class="search-result" href="article.html?slug=${encodeURIComponent(n.slug)}"><small>${esc(n.categories?.name||'बातमी')}</small><b>${esc(n.headline)}</b><span>${relativeTime(n.published_at)}</span></a>`).join(''):'<div class="empty">बातमी सापडली नाही.</div>'}
async function loadArticle(){
  const slug=new URLSearchParams(location.search).get('slug');
  if(!slug)return;
  const {data,error}=await db.from('news').select('*,categories(name,slug)').eq('slug',slug).maybeSingle();
  if(error||!data||data.status!=='published'){document.querySelector('#paper').innerHTML='<div class="error">ही बातमी उपलब्ध नाही.</div>';return;}
  document.title=`${data.headline} | मेट्रोसिटी पोस्ट`;
  document.querySelector('meta[name="description"]')?.setAttribute('content',data.seo_description||data.subheadline||data.headline);
  const {data:photos}=await db.from('news_photos').select('image_url,caption,sort_order').eq('news_id',data.id).order('sort_order');
  const urls=[data.main_image_url,...(photos||[]).map(x=>x.image_url)].filter(Boolean);
  const paper=document.querySelector('#paper');
  if(data.epaper_layout==='direct-newspaper'){
    paper.innerHTML=`<div class="paper-mast"><strong>मेट्रोसिटी पोस्ट</strong><span>${marathiDate(new Date(data.published_at||data.created_at))}</span></div><hr class="double-rule"><div class="direct-paper-label">📰 वृत्तपत्राचे पान</div><div class="direct-paper-gallery">${urls.map((u,i)=>`<figure><img src="${esc(u)}" alt="${esc(data.headline)}"><figcaption>पान ${i+1} • मेट्रोसिटी पोस्ट</figcaption></figure>`).join('')}</div><div class="paper-foot"><span>प्रतिनिधी • मेट्रोसिटी पोस्ट</span><span>${marathiDate(new Date(data.published_at||data.created_at))}</span></div>`;
  }else{
    let layout=data.epaper_layout||'auto';
    if(layout==='auto')layout=data.main_image_url?'photo-left':'no-photo';
    if(!data.main_image_url)layout='no-photo';
    const photo=data.main_image_url?`<figure class="paper-photo"><img src="${esc(data.main_image_url)}" alt="${esc(data.headline)}"><figcaption>${esc(data.location||'मेट्रोसिटी पोस्ट')}</figcaption></figure>`:'';
    paper.innerHTML=`<div class="paper-mast"><strong>मेट्रोसिटी पोस्ट</strong><span>${marathiDate(new Date(data.published_at||data.created_at))}</span></div><hr class="double-rule"><div class="category">${esc(data.categories?.name||'विशेष')} • ${esc(data.location||'महाराष्ट्र')}</div><h1>${esc(data.headline)}</h1><p class="dek">${esc(data.subheadline||'')}</p><div class="paper-grid ${layout}">${photo}<div class="paper-text">${paragraphs(data.content)}</div></div><div class="paper-foot"><span>प्रतिनिधी • मेट्रोसिटी पोस्ट</span><span>${marathiDate(new Date(data.published_at||data.created_at))}</span></div>`;
  }
  const normal=document.querySelector('#article-normal');
  if(data.epaper_layout==='direct-newspaper'){
    normal.innerHTML=`<div class="eyebrow">वृत्तपत्रातील बातमी</div><h2>${esc(data.headline)}</h2><div class="meta">${esc(data.categories?.name||'ई-पेपर')} • ${esc(data.location||'महाराष्ट्र')} • ${marathiDate(new Date(data.published_at||data.created_at))}</div><p class="direct-note">ही बातमी वृत्तपत्राच्या पानाच्या स्वरूपात थेट प्रकाशित करण्यात आली आहे.</p><div class="article-photo-gallery direct-gallery">${urls.map(u=>`<img src="${esc(u)}" alt="${esc(data.headline)}">`).join('')}</div>`;
  }else{
    normal.innerHTML=`<div class="eyebrow">सविस्तर बातमी</div><h2>${esc(data.headline)}</h2><div class="meta">${esc(data.categories?.name||'बातमी')} • ${esc(data.location||'महाराष्ट्र')} • ${marathiDate(new Date(data.published_at||data.created_at))}</div>${urls.length>1?`<div class="article-photo-gallery">${urls.map(u=>`<img src="${esc(u)}" alt="">`).join('')}</div>`:''}<div class="body">${paragraphs(data.content)}</div>`;
  }
  const rel=document.querySelector('#related');
  if(rel){
    const {data:r}=await db.from('news').select('slug,headline,categories(name)').eq('status','published').neq('id',data.id).eq('category_id',data.category_id).order('published_at',{ascending:false}).limit(4);
    rel.innerHTML=(r||[]).map(n=>`<article class="story-card"><div class="story-card-body"><span class="tag">${esc(n.categories?.name||'बातमी')}</span><h3><a href="article.html?slug=${encodeURIComponent(n.slug)}">${esc(n.headline)}</a></h3></div></article>`).join('');
  }
  db.rpc('increment_news_views',{news_id:data.id}).catch(()=>{});
}
async function shareNews(){if(navigator.share)try{await navigator.share({title:document.title,url:location.href})}catch{}else copyLink()};async function copyLink(){try{await navigator.clipboard.writeText(location.href);alert('लिंक कॉपी झाली आहे.')}catch{prompt('लिंक कॉपी करा',location.href)}}
function wireSearch(){const i=document.querySelector('#search-input');if(i){let t;i.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>searchNews(i.value),250)});i.addEventListener('keydown',e=>{if(e.key==='Enter')searchNews(i.value)})}}
document.addEventListener('DOMContentLoaded',()=>{setDate();wireSearch();loadHome();loadArticle()});
