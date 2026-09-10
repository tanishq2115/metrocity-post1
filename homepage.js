(() => {
  const URL = window.METROCITY_SUPABASE_URL;
  const KEY = window.METROCITY_SUPABASE_KEY;
  const API = `${URL}/rest/v1`;
  const $ = (s) => document.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl = (v) => { try { const u = new URL(v, location.href); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; } };
  const get = async (path) => { const r = await fetch(API + path, { headers:{apikey:KEY, Authorization:`Bearer ${KEY}`}, cache:'no-store' }); if(!r.ok) throw new Error(`Supabase ${r.status}`); return r.json(); };
  const dateKey = (v) => { const d = new Date(v); if(Number.isNaN(d.getTime())) return ''; return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d); };
  const dateLabel = (v) => { const d = new Date(v); if(Number.isNaN(d.getTime())) return ''; return new Intl.DateTimeFormat('mr-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'long',year:'numeric'}).format(d); };
  const timeLabel = (v) => { const d = new Date(v); if(Number.isNaN(d.getTime())) return ''; return new Intl.DateTimeFormat('mr-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'}).format(d); };
  const shortText = (v, n=150) => { const s=String(v||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); return s.length>n ? s.slice(0,n-1)+'…' : s; };
  const slugLink = (slug) => `news.html?slug=${encodeURIComponent(slug || '')}`;

  function groupEpapers(rows){
    const map=new Map();
    [...rows].sort((a,b)=>new Date(b.published_at||b.created_at)-new Date(a.published_at||a.created_at)).forEach(row=>{
      const key=dateKey(row.published_at||row.created_at);
      if(!key) return;
      if(!map.has(key)) map.set(key,{type:'epaper',dateKey:key,items:[],latestAt:row.published_at||row.created_at,first:row});
      map.get(key).items.push(row);
    });
    return [...map.values()];
  }

  function buildUnified(epapers, written){
    const items=[];
    epapers.forEach(g=>items.push({...g, sortAt:g.latestAt, pageRows:g.items}));
    written.forEach(n=>items.push({type:'written',sortAt:n.published_at||n.created_at,row:n}));
    return items.sort((a,b)=>new Date(b.sortAt)-new Date(a.sortAt));
  }

  function writtenCard(n){
    const img=safeUrl(n.main_image_url);
    const href=slugLink(n.slug);
    return `<article class="home-story" data-link="${esc(href)}"><a href="${esc(href)}" class="written-card-link"><span class="home-story-media ${img?'':'no-image'}">${img?`<img src="${esc(img)}" alt="" loading="lazy">`:'📝'}</span><span class="home-story-body"><span class="story-meta"><span class="tag">${esc(n.category_name||'बातमी')}</span><span class="story-time">${esc(timeLabel(n.published_at||n.created_at))}</span></span><h3>${esc(n.headline||'बातमी')}</h3><p>${esc(shortText(n.subheadline||n.content||'',120))}</p><span class="read-more">बातमी वाचा <span>→</span></span></span></a></article>`;
  }

  function epaperStory(g, pageCount){
    const img=safeUrl(g.first?.main_image_url);
    const href='epaper.html?date='+encodeURIComponent(g.dateKey)+'&page=1';
    return `<article class="home-story" data-link="${esc(href)}"><a href="${esc(href)}" class="written-card-link"><span class="home-story-media epaper-story-media ${img?'':'no-image'}">${img?`<img src="${esc(img)}" alt="ई-पेपर" loading="lazy">`:'📰'}</span><span class="home-story-body"><span class="story-meta"><span class="tag">ई-पेपर</span><span class="story-time">${esc(dateLabel(g.latestAt))}</span></span><h3>मेट्रोसिटी पोस्ट — आजचा दैनिक अंक</h3><p>${pageCount} ${pageCount===1?'पान':'पाने'} • शेवटचे अपलोड ${esc(timeLabel(g.latestAt))}</p><span class="read-more">ई-पेपर वाचा <span>→</span></span></span></a></article>`;
  }

  function renderLatest(item, pageCounts){
    const box=$('#latest-content');
    if(!item){box.innerHTML='<div class="empty">अजून कोणतेही प्रकाशित कंटेंट उपलब्ध नाही.</div>';return;}
    if(item.type==='epaper'){
      const img=safeUrl(item.first?.main_image_url); const pages=pageCounts.get(item.dateKey)||item.items.length;
      box.innerHTML=`<article class="latest-epaper"><a class="latest-visual epaper-preview" href="epaper.html?date=${encodeURIComponent(item.dateKey)}&page=1">${img?`<img src="${esc(img)}" alt="मेट्रोसिटी पोस्ट ई-पेपर" fetchpriority="high">`:'📰'}<span class="latest-type">📰 ई-पेपर</span></a><div class="latest-copy"><span class="section-kicker">${esc(dateLabel(item.latestAt))}</span><h2>मेट्रोसिटी पोस्ट — आजचा दैनिक ई-पेपर</h2><p>आजच्या अंकातील सर्व पाने एकाच डिजिटल आवृत्तीत वाचा. पानांमध्ये सहज पुढे-मागे जा, झूम करा आणि पूर्ण स्क्रीनमध्ये वाचा.</p><div class="meta-line">${pages} ${pages===1?'पान':'पाने'} • शेवटचे अपलोड ${esc(timeLabel(item.latestAt))}</div><a class="latest-action" href="epaper.html?date=${encodeURIComponent(item.dateKey)}&page=1">ई-पेपर उघडा →</a></div></article>`;
    } else {
      const n=item.row; const img=safeUrl(n.main_image_url); const href=slugLink(n.slug);
      box.innerHTML=`<article class="latest-written"><a class="latest-visual" href="${esc(href)}">${img?`<img src="${esc(img)}" alt="${esc(n.headline||'बातमी')}" fetchpriority="high">`:'📝'}<span class="latest-type">📝 लिखित बातमी</span></a><div class="latest-copy"><span class="section-kicker">${esc(n.category_name||'ताजी बातमी')}</span><h2>${esc(n.headline||'ताजी बातमी')}</h2><p>${esc(shortText(n.subheadline||n.content||'',220))}</p><div class="meta-line">प्रकाशित ${esc(dateLabel(n.published_at||n.created_at))} • ${esc(timeLabel(n.published_at||n.created_at))}</div><a class="latest-action" href="${esc(href)}">संपूर्ण बातमी वाचा →</a></div></article>`;
    }
  }

  function renderWritten(items){
    const box=$('#written-list');
    if(!items.length){box.innerHTML='<div class="empty written-empty">अजून लिखित बातम्या प्रकाशित झालेल्या नाहीत.</div>';return;}
    box.innerHTML=items.slice(0,8).map(writtenCard).join('');
  }

  function renderEpaperFeature(g, pageCount){
    const box=$('#epaper-feature');
    if(!g){box.innerHTML='<div class="empty">अजून ई-पेपर प्रकाशित झालेले नाही.</div>';return;}
    const img=safeUrl(g.first?.main_image_url); const href=`epaper.html?date=${encodeURIComponent(g.dateKey)}&page=1`;
    box.innerHTML=`<a class="epaper-feature-thumb" href="${esc(href)}">${img?`<img src="${esc(img)}" alt="ई-पेपर" loading="lazy">`:'📰'}</a><div class="epaper-feature-copy"><span class="type-badge">आजचा ई-पेपर</span><h3>मेट्रोसिटी पोस्ट — ${esc(dateLabel(g.latestAt))}</h3><p>${pageCount} ${pageCount===1?'पान':'पाने'} • शेवटचे अपलोड ${esc(timeLabel(g.latestAt))}</p><a class="read-more" href="${esc(href)}">संपूर्ण अंक वाचा <span>→</span></a></div><a class="epaper-feature-action" href="${esc(href)}">ई-पेपर उघडा</a>`;
  }

  async function init(){
    $('#today-label').textContent=dateLabel(new Date());
    try{
      const rows=await get('/news?select=id,slug,headline,subheadline,content,location,main_image_url,epaper_layout,published_at,created_at,categories(name)&status=eq.published&order=published_at.desc&limit=200');
      const all=rows||[];
      const epaperRows=all.filter(n=>n.epaper_layout==='direct-newspaper');
      const written=all.filter(n=>n.epaper_layout!=='direct-newspaper');
      const epapers=groupEpapers(epaperRows);
      written.forEach(n=>n.category_name=n.categories?.name||'बातमी');
      const pageCounts=new Map();
      if(epaperRows.length){
        const ids=epaperRows.map(n=>n.id).filter(Boolean);
        if(ids.length){
          const inValue='('+ids.join(',')+')';
          try{
            const photos=await get(`/news_photos?select=news_id&news_id=in.${inValue}`);
            const photoCount=new Map(); (photos||[]).forEach(p=>photoCount.set(p.news_id,(photoCount.get(p.news_id)||0)+1));
            epapers.forEach(g=>pageCounts.set(g.dateKey,g.items.reduce((sum,n)=>sum+1+(photoCount.get(n.id)||0),0)));
          }catch{epapers.forEach(g=>pageCounts.set(g.dateKey,g.items.length));}
        }
      }
      const unified=buildUnified(epapers,written);
      renderLatest(unified[0],pageCounts);
      renderWritten(written);
      renderEpaperFeature(epapers[0],pageCounts.get(epapers[0]?.dateKey)||epapers[0]?.items.length||0);
      const tickerItems=unified.slice(0,7).map(x=>x.type==='epaper'?'ई-पेपर — '+dateLabel(x.latestAt):x.row.headline).filter(Boolean);
      $('#ticker').innerHTML=tickerItems.length?tickerItems.map((t,i)=>`<a href="${esc(unified[i]?.type==='epaper'?`epaper.html?date=${unified[i].dateKey}&page=1`:slugLink(unified[i].row.slug))}">${esc(t)}</a>`).join(''):'<span>अजून बातम्या उपलब्ध नाहीत.</span>';
      $('#latest-updated').textContent=unified[0]?`अपडेट ${timeLabel(unified[0].sortAt)}`:'—';
    }catch(err){
      console.error(err);
      $('#latest-content').innerHTML='<div class="load-error">ताजी माहिती लोड करता आली नाही. कृपया पुन्हा प्रयत्न करा.</div>';
      $('#written-list').innerHTML='<div class="load-error written-empty">बातम्या लोड करता आल्या नाहीत.</div>';
      $('#epaper-feature').innerHTML='<div class="load-error">ई-पेपर लोड करता आले नाही.</div>';
      $('#ticker').innerHTML='<span>माहिती लोड करता आली नाही.</span>';
    }
  }
  document.addEventListener('DOMContentLoaded',init);
})();
