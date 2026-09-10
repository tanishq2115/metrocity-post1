(() => {
  const URL = window.METROCITY_SUPABASE_URL;
  const KEY = window.METROCITY_SUPABASE_KEY;
  const API = `${URL}/rest/v1`;
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl = v => { try { const u = new URL(v, location.href); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; } };
  const get = async path => { const r = await fetch(API + path, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' }); if (!r.ok) throw new Error(`Supabase ${r.status}`); return r.json(); };
  const stamp = v => { const t = new Date(v || 0).getTime(); return Number.isFinite(t) ? t : 0; };
  const dateKey = v => { const d = new Date(v); if (Number.isNaN(d.getTime())) return ''; return new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Kolkata', year:'numeric', month:'2-digit', day:'2-digit' }).format(d); };
  const dateLabel = v => { const d = new Date(v); if (Number.isNaN(d.getTime())) return ''; return new Intl.DateTimeFormat('mr-IN', { timeZone:'Asia/Kolkata', day:'numeric', month:'long', year:'numeric' }).format(d); };
  const timeLabel = v => { const d = new Date(v); if (Number.isNaN(d.getTime())) return ''; return new Intl.DateTimeFormat('mr-IN', { timeZone:'Asia/Kolkata', hour:'numeric', minute:'2-digit', hour12:true }).format(d); };
  const shortText = (v, n=160) => { const s = String(v || '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); return s.length > n ? s.slice(0,n-1) + '…' : s; };
  const slugLink = slug => `news.html?slug=${encodeURIComponent(slug || '')}`;

  function normalize(row) {
    const category = row.categories;
    return { ...row, category_name: typeof category === 'object' && category ? category.name : '' };
  }

  function groupEpapers(rows) {
    const map = new Map();
    [...(rows || [])].sort((a,b) => stamp(b.published_at || b.created_at) - stamp(a.published_at || a.created_at)).forEach(row => {
      const key = dateKey(row.published_at || row.created_at); if (!key) return;
      if (!map.has(key)) map.set(key, { type:'epaper', dateKey:key, items:[], latestAt:row.published_at || row.created_at, first:row });
      map.get(key).items.push(row);
    });
    return [...map.values()];
  }

  function unified(epapers, written) {
    return [
      ...epapers.map(g => ({ type:'epaper', sortAt:g.latestAt, group:g })),
      ...written.map(row => ({ type:'written', sortAt:row.published_at || row.created_at, row }))
    ].sort((a,b) => stamp(b.sortAt) - stamp(a.sortAt));
  }

  function writtenCard(n) {
    const img = safeUrl(n.main_image_url), href = slugLink(n.slug);
    return `<article class="home-story"><a href="${esc(href)}" class="written-card-link"><span class="home-story-media ${img?'':'no-image'}">${img?`<img src="${esc(img)}" alt="" loading="lazy">`:'📝'}</span><span class="home-story-body"><span class="story-meta"><span class="tag">${esc(n.category_name || 'बातमी')}</span><span class="story-time">${esc(timeLabel(n.published_at || n.created_at))}</span></span><h3>${esc(n.headline || 'बातमी')}</h3><p>${esc(shortText(n.subheadline || n.content || '',120))}</p><span class="read-more">बातमी वाचा <span>→</span></span></span></a></article>`;
  }

  function renderWritten(items) {
    const box = $('#written-list'); if (!box) return;
    if (!items.length) { box.innerHTML = '<div class="empty written-empty">अजून लिखित बातम्या प्रकाशित झालेल्या नाहीत.</div>'; return; }
    box.innerHTML = items.slice(0,8).map(writtenCard).join('');
  }

  function writtenLatest(item) {
    const n=item.row, img=safeUrl(n.main_image_url), href=slugLink(n.slug);
    return `<article class="latest-written"><a class="latest-visual" href="${esc(href)}">${img?`<img src="${esc(img)}" alt="${esc(n.headline || 'बातमी')}" fetchpriority="high">`:'📝'}<span class="latest-type">📝 लिखित बातमी</span></a><div class="latest-copy"><span class="section-kicker">${esc(n.category_name || 'ताजी बातमी')}</span><h2>${esc(n.headline || 'ताजी बातमी')}</h2><p>${esc(shortText(n.subheadline || n.content || '',220))}</p><div class="meta-line">प्रकाशित ${esc(dateLabel(n.published_at || n.created_at))} • ${esc(timeLabel(n.published_at || n.created_at))}</div><a class="latest-action" href="${esc(href)}">संपूर्ण बातमी वाचा →</a></div></article>`;
  }

  function renderLatest(item) {
    const box=$('#latest-content'), ep=$('#epaper-section'), written=$('#written');
    if (!box || !ep) return;
    if (!item) { box.innerHTML='<div class="empty">अजून कोणतेही प्रकाशित कंटेंट उपलब्ध नाही.</div>'; return; }
    if (item.type === 'epaper') {
      // The reader itself is the latest item. Do not show a placeholder card or open another page.
      box.innerHTML='';
      ep.classList.add('latest-embedded-epaper');
      box.appendChild(ep);
      $('#epaper-section-status').textContent='सर्वात नवीन • ई-पेपर';
    } else {
      box.innerHTML=writtenLatest(item);
      ep.classList.remove('latest-embedded-epaper');
      if (written) written.insertAdjacentElement('afterend',ep);
      $('#epaper-section-status').textContent='दैनिक अंक';
    }
  }

  function renderTicker(items) {
    const box=$('#ticker'); if (!box) return;
    const top=items.slice(0,5);
    if (!top.length) { box.innerHTML='<span>अजून बातम्या उपलब्ध नाहीत.</span>'; return; }
    box.innerHTML=top.map(item => {
      const label=item.type==='epaper' ? 'ई-पेपर' : (item.row.category_name || 'बातमी');
      const title=item.type==='epaper' ? `मेट्रोसिटी पोस्ट • ${dateLabel(item.group.latestAt)} चा ई-पेपर` : (item.row.headline || 'ताजी बातमी');
      return `<span class="ticker-item"><b>${esc(label)}</b> ${esc(title)}</span>`;
    }).join('');
  }

  async function init() {
    const today=$('#today-label'); if (today) today.textContent=dateLabel(new Date());
    try {
      const rows=await get('/news?select=id,slug,headline,subheadline,content,location,main_image_url,epaper_layout,published_at,created_at,categories(name)&status=eq.published&order=published_at.desc.nullslast,created_at.desc.nullslast&limit=200');
      const all=(rows||[]).map(normalize).sort((a,b)=>stamp(b.published_at||b.created_at)-stamp(a.published_at||a.created_at));
      const epapers=all.filter(n=>n.epaper_layout==='direct-newspaper');
      const written=all.filter(n=>n.epaper_layout!=='direct-newspaper');
      const groups=groupEpapers(epapers);
      const feed=unified(groups,written);
      renderLatest(feed[0]);
      renderWritten(written);
      renderTicker(feed);
      const updated=$('#latest-updated'); if(updated && feed[0]) updated.textContent=`अपडेट ${timeLabel(feed[0].sortAt)}`;
      if (window.MetroEpaper && typeof window.MetroEpaper.loadRows==='function') await window.MetroEpaper.loadRows(epapers);
    } catch (e) {
      console.error('Metrocity homepage load failed:', e);
      const latest=$('#latest-content'); if(latest) latest.innerHTML='<div class="load-error">माहिती लोड करता आली नाही. कृपया इंटरनेट कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.</div>';
      const written=$('#written-list'); if(written) written.innerHTML='<div class="load-error">लिखित बातम्या लोड करता आल्या नाहीत.</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
