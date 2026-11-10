/* =====================================================================
   Northstar · Aandelenbekijker
   Lijst met aandelen & ETF's, filteren per categorie, en per aandeel
   een detailpagina met koersgrafiek, kerncijfers, kwartaalcijfers,
   bedrijfsprofiel en dividend. Data via eigen server (Yahoo Finance).
   ===================================================================== */
'use strict';

/* ---------- Universum: welke aandelen staan in de lijst ---------- */
// cat = categorie (filterchip), reg = regio
const UNIVERSE = [
  // Tech & software
  ['AAPL','Tech','VS'],['MSFT','Tech','VS'],['GOOGL','Tech','VS'],['AMZN','Tech','VS'],['META','Tech','VS'],
  ['NFLX','Tech','VS'],['ORCL','Tech','VS'],['CRM','Tech','VS'],['ADBE','Tech','VS'],['NOW','Tech','VS'],
  ['PLTR','Tech','VS'],['SNOW','Tech','VS'],['SHOP','Tech','VS'],['UBER','Tech','VS'],['APP','Tech','VS'],
  ['DOCU','Tech','VS'],['SAP.DE','Tech','EU'],['ADYEN.AS','Tech','NL'],['PRX.AS','Tech','NL'],['TKWY.AS','Tech','NL'],
  // Halfgeleiders
  ['NVDA','Chips','VS'],['AMD','Chips','VS'],['AVGO','Chips','VS'],['INTC','Chips','VS'],['QCOM','Chips','VS'],
  ['TSM','Chips','Azië'],['MU','Chips','VS'],['ARM','Chips','VS'],['ASML.AS','Chips','NL'],['ASM.AS','Chips','NL'],
  ['BESI.AS','Chips','NL'],['IFX.DE','Chips','EU'],
  // Zorg
  ['LLY','Zorg','VS'],['JNJ','Zorg','VS'],['UNH','Zorg','VS'],['PFE','Zorg','VS'],['MRK','Zorg','VS'],
  ['ABBV','Zorg','VS'],['TMO','Zorg','VS'],['ISRG','Zorg','VS'],['NVO','Zorg','EU'],['ROG.SW','Zorg','EU'],
  ['PHIA.AS','Zorg','NL'],['ARGX.BR','Zorg','EU'],['PHARM.AS','Zorg','NL'],
  // Financieel
  ['JPM','Financieel','VS'],['BAC','Financieel','VS'],['V','Financieel','VS'],['MA','Financieel','VS'],
  ['GS','Financieel','VS'],['BRK-B','Financieel','VS'],['PYPL','Financieel','VS'],['INGA.AS','Financieel','NL'],
  ['ABN.AS','Financieel','NL'],['ASRNL.AS','Financieel','NL'],['NN.AS','Financieel','NL'],['ALV.DE','Financieel','EU'],
  ['FLOW.AS','Financieel','NL'],
  // Consument
  ['TSLA','Consument','VS'],['KO','Consument','VS'],['PEP','Consument','VS'],['MCD','Consument','VS'],
  ['NKE','Consument','VS'],['COST','Consument','VS'],['WMT','Consument','VS'],['PG','Consument','VS'],
  ['SBUX','Consument','VS'],['MC.PA','Consument','EU'],['HEIA.AS','Consument','NL'],['AD.AS','Consument','NL'],
  ['ULVR.L','Consument','EU'],['RACE','Consument','EU'],
  // Energie
  ['XOM','Energie','VS'],['CVX','Energie','VS'],['SHEL.AS','Energie','NL'],['TTE.PA','Energie','EU'],
  ['NEE','Energie','VS'],['ENPH','Energie','VS'],['VWS.CO','Energie','EU'],
  // Industrie & defensie
  ['CAT','Industrie','VS'],['BA','Industrie','VS'],['LMT','Industrie','VS'],['RTX','Industrie','VS'],
  ['GE','Industrie','VS'],['AIR.PA','Industrie','EU'],['RHM.DE','Industrie','EU'],['SIE.DE','Industrie','EU'],
  ['WKL.AS','Industrie','NL'],['RAND.AS','Industrie','NL'],['FUR.AS','Industrie','NL'],
  // Communicatie
  ['DIS','Communicatie','VS'],['T','Communicatie','VS'],['VZ','Communicatie','VS'],['SPOT','Communicatie','EU'],
  ['UMG.AS','Communicatie','NL'],['KPN.AS','Communicatie','NL'],
  // ETF's
  ['IWDA.AS','ETF','Wereld'],['VWRL.AS','ETF','Wereld'],['VWCE.DE','ETF','Wereld'],['CSPX.AS','ETF','VS'],
  ['VUSA.AS','ETF','VS'],['SXR8.DE','ETF','VS'],['EQQQ.DE','ETF','VS'],['IEMA.AS','ETF','Opkomend'],
  ['IUSN.DE','ETF','Wereld'],['VHYL.AS','ETF','Wereld'],['DFNS.AS','ETF','Wereld'],['INRG.L','ETF','Wereld'],
  ['IAEX.AS','ETF','NL'],['SMH','ETF','VS'],['QQQ','ETF','VS'],['SPY','ETF','VS'],
];
const CATS = ['Alles','Tech','Chips','Zorg','Financieel','Consument','Energie','Industrie','Communicatie','ETF'];
const REGIONS = ['Alle regio\'s','NL','EU','VS','Azië','Wereld','Opkomend'];
const META = Object.fromEntries(UNIVERSE.map(([s,c,r]) => [s,{cat:c,reg:r}]));

/* ---------- Kleine helpers ---------- */
const $ = (q, el = document) => el.querySelector(q);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const raw = v => (v && typeof v === 'object' && 'raw' in v) ? v.raw : v;
const isNum = v => typeof v === 'number' && isFinite(v);
const CUR_SYM = {EUR:'€',USD:'$',GBP:'£',GBp:'p',CHF:'CHF ',DKK:'kr ',SEK:'kr '};
function money(v, cur = 'EUR', dec = 2){
  if(!isNum(v)) return '–';
  const s = v.toLocaleString('nl-NL',{minimumFractionDigits:dec,maximumFractionDigits:dec});
  const sym = CUR_SYM[cur] ?? (cur + ' ');
  return cur === 'GBp' ? s + 'p' : sym + s;
}
function big(v, cur = ''){
  if(!isNum(v)) return '–';
  const a = Math.abs(v), sym = cur ? (CUR_SYM[cur] ?? cur + ' ') : '';
  const f = (n, u) => sym + n.toLocaleString('nl-NL',{maximumFractionDigits:n < 10 ? 2 : 1}) + u;
  if(a >= 1e12) return f(v/1e12,' bln');
  if(a >= 1e9)  return f(v/1e9,' mld');
  if(a >= 1e6)  return f(v/1e6,' mln');
  return sym + v.toLocaleString('nl-NL');
}
const pct = (v, dec = 2) => isNum(v) ? (v > 0 ? '+' : '') + v.toLocaleString('nl-NL',{minimumFractionDigits:dec,maximumFractionDigits:dec}) + '%' : '–';
const pctFrac = (v, dec = 2) => isNum(v) ? pct(v * 100, dec) : '–';
const num = (v, dec = 2) => isNum(v) ? v.toLocaleString('nl-NL',{minimumFractionDigits:dec,maximumFractionDigits:dec}) : '–';
const cls = v => isNum(v) ? (v >= 0 ? 'up' : 'down') : '';
const fmtDate = ts => ts ? new Date((raw(ts) > 1e11 ? raw(ts) : raw(ts) * 1000)).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'}) : '–';
function toast(msg){ const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3200); }

/* ---------- Opslag: volglijst ---------- */
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
let WATCH = new Set(store.get('ns_watch', ['ASML.AS','NVDA','IWDA.AS']));
function toggleWatch(sym){
  WATCH.has(sym) ? WATCH.delete(sym) : WATCH.add(sym);
  store.set('ns_watch', [...WATCH]);
  toast(WATCH.has(sym) ? `${sym} toegevoegd aan volglijst` : `${sym} verwijderd uit volglijst`);
  render();
}

/* ---------- API ---------- */
// Draait de pagina via VS Code Live Server (poort 5500) of als bestand,
// dan gaan API-aanvragen automatisch naar de Python-server op poort 8080.
const API_BASE = (location.protocol === 'file:' || (location.port && location.port !== '8080' && location.port !== '8000'))
  ? 'http://localhost:8080' : '';
async function api(path, timeoutMs = 45000){
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), timeoutMs);
  let r;
  try{ r = await fetch(API_BASE + path, {signal: ctl.signal}); }
  catch(e){ throw new Error(e.name === 'AbortError' ? 'server reageert niet (time-out)' : 'server niet bereikbaar op ' + (API_BASE || location.origin)); }
  finally{ clearTimeout(t); }
  const j = await r.json().catch(() => ({}));
  if(!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
  return j;
}
const QUOTES = {}; let quotesTs = 0;
async function loadQuotes(force = false){
  if(!force && Date.now() - quotesTs < 60e3 && Object.keys(QUOTES).length) return;
  const syms = [...new Set([...UNIVERSE.map(u => u[0]), ...WATCH])];
  const j = await api('/api/quotes?symbols=' + encodeURIComponent(syms.join(',')));
  for(const q of j.quotes || []) QUOTES[q.symbol] = q;
  quotesTs = Date.now();
}
// Laatst bekende koersen direct tonen (uit server-cache), daarna live bijwerken
async function loadCachedQuotes(){
  const syms = [...new Set([...UNIVERSE.map(u => u[0]), ...WATCH])];
  try{ const j = await api('/api/quotes?cached=1&symbols=' + encodeURIComponent(syms.join(',')), 5000); for(const q of j.quotes || []) if(!QUOTES[q.symbol]) QUOTES[q.symbol] = q; }catch(e){}
}

/* ---------- Extra CSS (bovenop style.css) ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>
.sv-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.sv-toolbar input{max-width:320px}
.sv-toolbar select{width:auto}
.sv-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.sv-chip{border:1px solid var(--bd);background:var(--s1);color:var(--mu);padding:6px 12px;border-radius:20px;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .15s}
.sv-chip:hover{color:var(--tx);background:var(--s2)}
.sv-chip.on{background:var(--ac);color:var(--ac-tx,#0b0e14);border-color:var(--ac)}
.sv-table th{cursor:pointer;white-space:nowrap}
.sv-table th.sorted{color:var(--tx)}
.sv-table td,.sv-table th{text-align:right}
.sv-table td:first-child,.sv-table th:first-child{text-align:left}
.sv-star{font-size:16px;color:var(--mu);padding:2px 6px;border-radius:6px;cursor:pointer}
.sv-star.on{color:var(--warn)}
.sv-star:hover{background:var(--s2)}
.sv-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:18px}
.sv-price{font:800 34px/1.1 var(--disp);letter-spacing:-.02em;margin-top:6px}
.sv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}
.sv-stat{background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:10px 12px;min-width:0}
.sv-stat .l{font-size:11px;color:var(--mu);font-weight:600;text-transform:uppercase;letter-spacing:.03em}
.sv-stat .v{font-weight:800;font-size:14.5px;margin-top:3px;word-break:break-word}
.sv-two{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:18px;margin-top:18px}
.sv-desc{color:var(--mu);line-height:1.6;font-size:13px}
.sv-desc.clamp{display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical;overflow:hidden}
.sv-bars{display:flex;align-items:flex-end;gap:10px;height:140px;padding-top:10px;border-bottom:1px solid var(--bd)}
.sv-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:4px}
.sv-bar{width:100%;max-width:34px;border-radius:5px 5px 0 0;min-height:3px}
.sv-bar-l{font-size:11px;color:var(--mu);margin-top:6px;text-align:center}
.sv-chart{width:100%;min-width:0}
.sv-chart svg{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none}
.sv-chart-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.sv-chart-bar .tabs-clean{max-width:100%}
#sv_detail{min-width:0}
#sv_detail .panel{min-width:0}
.sv-note{font-size:11.5px;color:var(--mu);margin-top:10px}

/* Detail page enhancements */
.ns-back-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:20px;background:var(--s2);border:1px solid var(--bd);color:var(--tx);font-size:12.5px;font-weight:600;margin-bottom:14px;text-decoration:none;transition:all .15s}
.ns-back-btn:hover{background:var(--s1);border-color:var(--ac);color:var(--ac)}
.health-pillar{display:grid;grid-template-columns:105px 1fr 32px;align-items:center;gap:12px;font-size:12.5px}
.health-bar{background:var(--s2);height:8px;border-radius:4px;overflow:hidden;position:relative}
.health-bar i{display:block;height:100%;border-radius:4px}
.tabs-clean{display:flex;gap:4px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.tabs-clean::-webkit-scrollbar{display:none}
.tabs-clean button{padding:6px 10px;border-radius:7px;border:1px solid var(--bd);background:var(--s1);color:var(--mu);font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0;transition:all .15s}
.tabs-clean button:hover{color:var(--tx);background:var(--s2)}
.tabs-clean button.on{background:var(--ac);color:var(--ac-tx,#0b0e14);border-color:var(--ac);font-weight:700}

@media (max-width:768px){
  .sv-head{flex-direction:column;align-items:stretch;gap:12px}
  .sv-head .btn{width:100%;justify-content:center}
  .sv-price{font-size:28px}
  .sv-two{grid-template-columns:minmax(0,1fr);gap:14px}
  .sv-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .sv-chart-bar{flex-direction:column;align-items:stretch}
  .sv-chart-bar .tabs-clean{justify-content:space-between}
  .sv-chart-bar .tabs-clean button{flex:1;padding:7px 4px}
  /* Tabellen op de detailpagina: compacter i.p.v. vaste 580px breedte */
  #sv_detail .ns-table{min-width:0}
  #sv_detail .ns-table th,#sv_detail .ns-table td{padding:8px 6px;font-size:12px}
  #sv_detail .sv-table th{white-space:normal;font-size:10px;letter-spacing:.02em}
  #sv_detail .sv-desc{font-size:12.5px}
}
@media (max-width:520px){
  #sv_detail .sv-hide-sm{display:none}
  .sv-stat{padding:8px 10px}
  .sv-stat .v{font-size:13.5px}
  .health-pillar{grid-template-columns:90px 1fr 24px;gap:8px;font-size:12px}
  .ns-nav{display:none}
}
@media (max-width:400px){
  .sv-stat .l{font-size:10px}
  .sv-stat .v{font-size:13px}
  .sv-price{font-size:26px}
  #sv_detail .ns-table th,#sv_detail .ns-table td{padding:7px 4px;font-size:11.5px}
}
</style>`);

/* ---------- Navigatie ---------- */
function renderNav(route){
  const items = [
    ['#/', 'Markten', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18M7 15l4-5 3 3 5-7"/></svg>'],
    ['#/volglijst', 'Volglijst', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>'],
    ['index.html#/', 'Mijn portfolio', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>']
  ];
  const navHtml = items.map(([h,l]) => `<a href="${h}" class="${(route === h.slice(1) || (h === '#/' && route === '/')) ? 'on' : ''}">${l}</a>`).join('');
  $('#nav').innerHTML = navHtml;
  const bnav = $('#bnav');
  if(bnav){
    bnav.innerHTML = items.map(([h,l,ic]) => `<a href="${h}" class="${(route === h.slice(1) || (h === '#/' && route === '/')) ? 'on' : ''}">${ic}<span>${l}</span></a>`).join('');
  }
  const bp = $('#ns_broker_pill'); if(bp) bp.style.display = 'none';
  const up = $('#ns_user_pill'); if(up) up.innerHTML = '';
}

/* ---------- Lijstpagina ---------- */
const LS = store.get('ns_list_state', {cat:'Alles', reg:'Alle regio\'s', q:'', sort:'cap', dir:-1});
function saveLS(){ store.set('ns_list_state', LS); }

function rowsFor(symbols){
  return symbols.map(s => {
    const q = QUOTES[s] || {}, m = META[s] || {cat: q.quoteType === 'ETF' ? 'ETF' : '—', reg:'—'};
    return {
      sym: s, name: q.longName || q.shortName || s, cat: m.cat, reg: m.reg,
      cur: q.currency, price: q.regularMarketPrice, chg: q.regularMarketChangePercent,
      cap: q.marketCap ?? q.netAssets ?? q.totalAssets, pe: q.trailingPE,
      div: isNum(q.dividendYield) ? q.dividendYield : (isNum(q.trailingAnnualDividendYield) ? q.trailingAnnualDividendYield * 100 : null),
      y1: q.fiftyTwoWeekChangePercent, type: q.quoteType
    };
  });
}

function tableHtml(rows, emptyMsg){
  const col = (k, l) => `<th data-sort="${k}" class="${LS.sort === k ? 'sorted' : ''}">${l}${LS.sort === k ? (LS.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`;
  if(!rows.length) return `<div class="empty">${emptyMsg}</div>`;
  return `<div class="ns-table-wrap"><table class="ns-table sv-table"><thead><tr>
    ${col('name','Naam')}${col('price','Koers')}${col('chg','Vandaag')}${col('y1','1 jaar')}${col('cap','Marktwaarde')}${col('pe','K/W')}${col('div','Dividend')}<th></th>
  </tr></thead><tbody>${rows.map(r => `
    <tr class="ns-tr" data-go="${esc(r.sym)}">
      <td><div class="ns-ticker-cell">
        <div class="ns-ticker-avatar" style="background:var(--s2);color:var(--tx)">${esc(r.sym.replace(/\..*$/,'').slice(0,4))}</div>
        <div><div class="ns-ticker-sym">${esc(r.name)}</div><div class="ns-ticker-name">${esc(r.sym)} · ${esc(r.cat)} · ${esc(r.reg)}</div></div>
      </div></td>
      <td><b>${money(r.price, r.cur)}</b></td>
      <td class="${cls(r.chg)}"><b>${pct(r.chg)}</b></td>
      <td class="${cls(r.y1)}">${pct(r.y1, 1)}</td>
      <td>${big(r.cap, r.cur)}</td>
      <td>${isNum(r.pe) ? num(r.pe, 1) : '–'}</td>
      <td>${isNum(r.div) && r.div > 0 ? num(r.div, 2) + '%' : '–'}</td>
      <td><button class="sv-star ${WATCH.has(r.sym) ? 'on' : ''}" data-star="${esc(r.sym)}" title="Volglijst">${WATCH.has(r.sym) ? '★' : '☆'}</button></td>
    </tr>`).join('')}</tbody></table></div>`;
}

function sortRows(rows){
  const k = LS.sort, d = LS.dir;
  return rows.sort((a, b) => {
    const x = a[k], y = b[k];
    if(k === 'name') return d * String(x).localeCompare(String(y));
    if(!isNum(x) && !isNum(y)) return 0;
    if(!isNum(x)) return 1; if(!isNum(y)) return -1;
    return d * (x - y);
  });
}

async function pageList(watchOnly = false){
  const main = $('#main');
  main.innerHTML = `
    <div class="ph"><div>
      <div class="ns-tag">${watchOnly ? 'Volglijst' : 'Markten'}</div>
      <h1>${watchOnly ? 'Jouw volglijst' : 'Aandelen & ETF\'s'}</h1>
      <div class="sub">${watchOnly ? 'Aandelen die je met ☆ hebt gemarkeerd.' : 'Filter op sector of regio en klik op een aandeel voor details en kwartaalcijfers.'}</div>
    </div></div>
    ${watchOnly ? '' : `
    <div class="sv-toolbar">
      <input id="sv_q" placeholder="Zoek op naam of ticker…" value="${esc(LS.q)}">
      <select id="sv_reg">${REGIONS.map(r => `<option ${LS.reg === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
      <button class="btn" id="sv_search_web" title="Zoek ook buiten deze lijst">🔍 Zoek elk aandeel</button>
    </div>
    <div class="sv-chips">${CATS.map(c => `<button class="sv-chip ${LS.cat === c ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>`}
    <section class="panel" id="sv_tbl"><div class="empty">Koersen laden…</div></section>
    <div class="sv-note">Koersen via Yahoo Finance, tot 15 minuten vertraagd. Alleen informatie, geen beleggingsadvies.</div>`;

  const draw = () => {
    let syms = watchOnly ? [...WATCH] : UNIVERSE.map(u => u[0]);
    let rows = rowsFor(syms);
    if(!watchOnly){
      if(LS.cat !== 'Alles') rows = rows.filter(r => r.cat === LS.cat);
      if(LS.reg !== 'Alle regio\'s') rows = rows.filter(r => r.reg === LS.reg);
      const q = LS.q.trim().toLowerCase();
      if(q) rows = rows.filter(r => r.sym.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
    }
    const box = $('#sv_tbl'); if(!box) return;
    box.innerHTML = `<div class="mu" style="font-size:12px;margin-bottom:4px">${rows.length} resultaten</div>` +
      tableHtml(sortRows(rows), watchOnly ? 'Je volglijst is leeg. Klik op ☆ bij een aandeel om het te volgen.' : 'Geen aandelen gevonden met deze filters.');
  };

  if(!watchOnly){
    $('#sv_q').oninput = e => { LS.q = e.target.value; saveLS(); draw(); };
    $('#sv_reg').onchange = e => { LS.reg = e.target.value; saveLS(); draw(); };
    $('#sv_search_web').onclick = () => openSearch(LS.q);
  }
  main.onclick = e => {
    const star = e.target.closest('[data-star]'); if(star){ e.stopPropagation(); toggleWatch(star.dataset.star); return; }
    const chip = e.target.closest('[data-cat]'); if(chip){ LS.cat = chip.dataset.cat; saveLS(); document.querySelectorAll('.sv-chip').forEach(c => c.classList.toggle('on', c.dataset.cat === LS.cat)); draw(); return; }
    const th = e.target.closest('[data-sort]'); if(th){ const k = th.dataset.sort; LS.dir = LS.sort === k ? -LS.dir : (k === 'name' ? 1 : -1); LS.sort = k; saveLS(); draw(); return; }
    const tr = e.target.closest('[data-go]'); if(tr) location.hash = '#/s/' + encodeURIComponent(tr.dataset.go);
  };

  // Toon de lijst meteen (namen), vul koersen in zodra ze binnen zijn
  draw();
  if(!Object.keys(QUOTES).length){ await loadCachedQuotes(); draw(); }
  const lbl = document.createElement('div'); lbl.className = 'mu'; lbl.style.cssText = 'font-size:12px'; lbl.id = 'sv_loading';
  lbl.textContent = '⏳ Live koersen ophalen…'; $('#sv_tbl')?.prepend(lbl);
  try{ await loadQuotes(); draw(); }
  catch(err){ const l = $('#sv_loading'); if(l) l.textContent = '⚠️ ' + err.message + '. Start python server.py.'; }
}

function serverError(err){
  return `<div class="empty">Kon geen data laden (${esc(err.message)}).<br>Start de app via <code>python server.py</code> en open <code>http://localhost:8080</code>.</div>`;
}

/* ---------- Zoeken naar elk aandeel (buiten de lijst) ---------- */
function openSearch(initial = ''){
  const m = $('#modal'); m.hidden = false;
  m.innerHTML = `<div class="mback" data-close><div class="mbox">
    <button class="mx" data-close>×</button><h3>Zoek een aandeel of ETF</h3>
    <input id="sv_sq" placeholder="Bijv. Coca-Cola, BESI, IE00B4L5Y983…" value="${esc(initial)}" autofocus>
    <div id="sv_sres" style="margin-top:12px;display:grid;gap:4px"></div></div></div>`;
  m.onclick = e => { if(e.target.hasAttribute('data-close')){ m.hidden = true; m.innerHTML = ''; } const it = e.target.closest('[data-pick]'); if(it){ m.hidden = true; m.innerHTML = ''; location.hash = '#/s/' + encodeURIComponent(it.dataset.pick); } };
  let t;
  const run = async () => {
    const q = $('#sv_sq').value.trim(); const box = $('#sv_sres'); if(!q){ box.innerHTML = ''; return; }
    box.innerHTML = '<div class="mu">Zoeken…</div>';
    try{
      const j = await api('/api/yahoo?url=' + encodeURIComponent(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0`));
      const res = (j.quotes || []).filter(x => ['EQUITY','ETF','MUTUALFUND'].includes(x.quoteType));
      box.innerHTML = res.length ? res.map(x => `<button class="pitem" data-pick="${esc(x.symbol)}"><b>${esc(x.symbol)}</b><span>${esc(x.longname || x.shortname || '')}</span><small>${esc(x.exchDisp || '')} · ${esc(x.quoteType)}</small></button>`).join('') : '<div class="mu">Niets gevonden.</div>';
    }catch(err){ box.innerHTML = `<div class="mu">Zoeken mislukt: ${esc(err.message)}</div>`; }
  };
  $('#sv_sq').oninput = () => { clearTimeout(t); t = setTimeout(run, 300); };
  if(initial) run();
}

/* ---------- Detailpagina ---------- */
const RANGES = [['1D','1d','5m'],['1W','5d','30m'],['1M','1mo','1d'],['6M','6mo','1d'],['1J','1y','1d'],['5J','5y','1wk'],['Max','max','1mo']];
let detailRange = store.get('ns_range', '1J');

function lineChart(ts, closes, cur, W = 800){
  const pts = ts.map((t, i) => [t, closes[i]]).filter(p => isNum(p[1]));
  if(pts.length < 2) return '<div class="empty">Geen grafiekdata.</div>';
  // Grafiek op echte pixelbreedte tekenen, zodat tekst op mobiel niet mee krimpt
  W = Math.max(260, Math.round(W));
  const narrow = W < 520, H = narrow ? 210 : 280, pad = {l:4, r:narrow ? 46 : 60, t:12, b:24};
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), yr = (y1 - y0) || 1;
  const X = t => pad.l + (t - x0) / ((x1 - x0) || 1) * (W - pad.l - pad.r);
  const Y = v => pad.t + (1 - (v - y0) / yr) * (H - pad.t - pad.b);
  const up = ys[ys.length - 1] >= ys[0], col = up ? 'var(--up)' : 'var(--down)';
  const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' ');
  const area = d + ` L${X(x1).toFixed(1)} ${H - pad.b} L${X(x0).toFixed(1)} ${H - pad.b} Z`;
  const grid = [0, .25, .5, .75, 1].map(f => { const v = y0 + f * yr, y = Y(v); return `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" stroke="var(--bd)"/><text x="${W - pad.r + 6}" y="${y + 4}" font-size="11" fill="var(--mu)">${num(v, v < 10 ? 2 : 0)}</text>`; }).join('');
  const span = x1 - x0, fmt = span < 2 * 86400 ? {hour:'2-digit',minute:'2-digit'} : span < 400 * 86400 ? {day:'numeric',month:'short'} : {month:'short',year:'2-digit'};
  const labels = (narrow ? [0, .5, 1] : [0, .25, .5, .75, 1]).map(f => { const t = x0 + f * span; return `<text x="${X(t)}" y="${H - 6}" font-size="11" fill="var(--mu)" text-anchor="${f === 0 ? 'start' : f === 1 ? 'end' : 'middle'}">${new Date(t * 1000).toLocaleString('nl-NL', fmt)}</text>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" data-pts='${JSON.stringify(pts.map(p => [p[0], +p[1].toFixed(4)]))}' data-cur="${esc(cur)}" data-l="${pad.l}" data-w="${W - pad.l - pad.r}" style="touch-action:pan-y">
    <defs><linearGradient id="svg_g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".22"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
    ${grid}${labels}<path d="${area}" fill="url(#svg_g)"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/>
    <line id="sv_cx" y1="${pad.t}" y2="${H - pad.b}" stroke="var(--mu)" stroke-dasharray="3 3" visibility="hidden"/>
  </svg><div class="mu" id="sv_hover" style="font-size:12px;height:16px;margin-top:4px"></div>`;
}

async function loadChart(sym, cur){
  const box = $('#sv_chart'); if(!box) return;
  const [, rng, iv] = RANGES.find(r => r[0] === detailRange) || RANGES[4];
  box.innerHTML = '<div class="empty">Grafiek laden…</div>';
  try{
    const j = await api(`/api/chart?symbol=${encodeURIComponent(sym)}&range=${rng}&interval=${iv}`);
    const r = j.chart?.result?.[0]; if(!r) throw new Error('geen data');
    const closes = r.indicators?.quote?.[0]?.close || [];
    const draw = () => { box.innerHTML = lineChart(r.timestamp || [], closes, r.meta?.currency || cur, box.clientWidth || 800); bindChart(box); };
    draw();
    // Opnieuw tekenen als de breedte verandert (draaien van telefoon, venster verkleinen)
    let lastW = box.clientWidth;
    if(window._svResize) window.removeEventListener('resize', window._svResize);
    window._svResize = () => { if(!document.body.contains(box)) return; const w = box.clientWidth; if(Math.abs(w - lastW) > 8){ lastW = w; clearTimeout(window._svResizeT); window._svResizeT = setTimeout(draw, 120); } };
    window.addEventListener('resize', window._svResize);
    const valid = closes.filter(isNum);
    if(valid.length > 1){
      const ch = (valid[valid.length - 1] / valid[0] - 1) * 100;
      $('#sv_range_chg').innerHTML = `<span class="${cls(ch)}">${pct(ch)}</span> <span class="mu">over ${detailRange}</span>`;
    }
  }catch(err){ box.innerHTML = `<div class="empty">Grafiek niet beschikbaar (${esc(err.message)}).</div>`; }
}

// Hover (muis) én aanraken/slepen (touch) op de grafiek
function bindChart(box){
  const svg = box.querySelector('svg'); if(!svg) return;
  const pts = JSON.parse(svg.dataset.pts), c = svg.dataset.cur, line = $('#sv_cx', box);
  const L = +svg.dataset.l, PW = +svg.dataset.w, VW = svg.viewBox.baseVal.width;
  const show = e => {
    const rc = svg.getBoundingClientRect(), xv = (e.clientX - rc.left) / rc.width * VW;
    const f = Math.max(0, Math.min(1, (xv - L) / PW));
    const i = Math.round(f * (pts.length - 1)), x = L + i / (pts.length - 1) * PW;
    line.setAttribute('x1', x); line.setAttribute('x2', x); line.setAttribute('visibility', 'visible');
    $('#sv_hover').textContent = new Date(pts[i][0] * 1000).toLocaleString('nl-NL', {dateStyle:'medium', timeStyle: detailRange === '1D' || detailRange === '1W' ? 'short' : undefined}) + ' · ' + money(pts[i][1], c);
  };
  const hide = () => { line.setAttribute('visibility', 'hidden'); $('#sv_hover').textContent = ''; };
  svg.onpointermove = show; svg.onpointerdown = show;
  svg.onpointerleave = hide; svg.onpointercancel = hide;
  svg.onpointerup = e => { if(e.pointerType !== 'mouse') setTimeout(hide, 1500); };
}

function stat(l, v){ return `<div class="sv-stat"><div class="l">${l}</div><div class="v">${v}</div></div>`; }

function quarterlySection(d, cur){
  const fin = d.earnings?.financialsChart?.quarterly || [];
  const eps = d.earnings?.earningsChart?.quarterly || [];
  const inc = d.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
  if(!fin.length && !eps.length && !inc.length) return '';
  // Omzet & winst per kwartaal (staafjes)
  let bars = '';
  if(fin.length){
    const max = Math.max(...fin.map(q => Math.abs(raw(q.revenue) || 0)), 1);
    bars = `<div style="display:flex;gap:14px;font-size:12px;margin-bottom:8px"><span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--ac);margin-right:4px"></i> Omzet</span><span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--purple);margin-right:4px"></i> Nettowinst</span></div>
    <div class="sv-bars">${fin.map(q => { const rv = raw(q.revenue) || 0, er = raw(q.earnings) || 0; return `
      <div class="sv-bar-col"><div style="display:flex;gap:4px;align-items:flex-end;width:100%;height:100%;justify-content:center">
        <div class="sv-bar" style="height:${Math.max(4, Math.abs(rv) / max * 100)}%;background:linear-gradient(180deg, var(--ac) 0%, rgba(0,208,132,0.65) 100%)" title="Omzet ${big(rv, cur)}"></div>
        <div class="sv-bar" style="height:${Math.max(4, Math.abs(er) / max * 100)}%;background:linear-gradient(180deg, ${er < 0 ? 'var(--down)' : 'var(--purple)'} 0%, rgba(168,85,247,0.65) 100%)" title="Winst ${big(er, cur)}"></div>
      </div></div>`; }).join('')}</div>
    <div style="display:flex;gap:10px;margin-top:8px">${fin.map(q => `<div class="sv-bar-l" style="flex:1"><span style="color:var(--mu);font-size:11px">${esc(q.date)}</span><br><b style="color:var(--tx);font-size:11.5px">${big(raw(q.revenue), cur)}</b></div>`).join('')}</div>`;
  }
  // Winst per aandeel: verwachting vs werkelijk
  const epsRows = eps.map(q => {
    const a = raw(q.actual), e = raw(q.estimate), s = isNum(a) && isNum(e) && e !== 0 ? (a - e) / Math.abs(e) * 100 : null;
    return `<tr><td><b>${esc(q.date)}</b></td><td>${isNum(e) ? num(e, 2) : '–'}</td><td><b>${isNum(a) ? num(a, 2) : '–'}</b></td><td class="${cls(s)}">${pct(s, 1)}</td></tr>`;
  }).join('');
  // Laatste kwartalen uit resultatenrekening (kolommen verbergen als data ontbreekt)
  const hasRealProfit = inc.some(q => (raw(q.grossProfit) || 0) > 0 || (raw(q.operatingIncome) || 0) > 0);
  const incRows = inc.slice(0, 4).map(q => {
    const dt = fmtDate(q.endDate);
    const rev = big(raw(q.totalRevenue), cur);
    const net = big(raw(q.netIncome), cur);
    if(hasRealProfit){
      return `<tr><td><b>${dt}</b></td><td>${rev}</td><td class="sv-hide-sm">${big(raw(q.grossProfit), cur)}</td><td class="sv-hide-sm">${big(raw(q.operatingIncome), cur)}</td><td class="${cls(raw(q.netIncome))}">${net}</td></tr>`;
    }
    return `<tr><td><b>${dt}</b></td><td>${rev}</td><td class="${cls(raw(q.netIncome))}">${net}</td></tr>`;
  }).join('');
  const incHead = hasRealProfit
    ? '<tr><th>Kwartaal t/m</th><th>Omzet</th><th class="sv-hide-sm">Brutowinst</th><th class="sv-hide-sm">Bedrijfsresultaat</th><th>Nettowinst</th></tr>'
    : '<tr><th>Kwartaal t/m</th><th>Omzet</th><th>Nettowinst</th></tr>';
  const next = d.calendarEvents?.earnings?.earningsDate?.[0];
  return `<section class="panel" style="margin-top:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><h3 style="margin:0">📊 Kwartaalcijfers</h3>
    ${next ? `<span class="badge ac">Volgende cijfers: ${fmtDate(next)}${d.calendarEvents.earnings.isEarningsDateEstimate ? ' (verwacht)' : ''}</span>` : ''}</div>
    ${bars ? `<div style="margin-top:14px">${bars}</div>` : ''}
    <div class="sv-two" style="margin-top:20px">
      ${incRows ? `<div><div class="lab" style="font-size:11.5px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px">Resultatenrekening per kwartaal</div><div class="ns-table-wrap"><table class="ns-table sv-table"><thead>${incHead}</thead><tbody>${incRows}</tbody></table></div></div>` : '<div></div>'}
      ${epsRows ? `<div><div class="lab" style="font-size:11.5px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px">Winst per aandeel: verwachting vs. werkelijk</div><div class="ns-table-wrap"><table class="ns-table sv-table"><thead><tr><th>Kwartaal</th><th>Verwacht</th><th>Werkelijk</th><th>Verschil</th></tr></thead><tbody>${epsRows}</tbody></table></div></div>` : ''}
    </div></section>`;
}

function etfSection(d){
  const fp = d.fundProfile, th = d.topHoldings;
  if(!fp && !th) return '';
  const hold = (th?.holdings || []).slice(0, 10).map(h => `<tr><td>${esc(h.holdingName || h.symbol)}</td><td>${pctFrac(raw(h.holdingPercent), 2).replace('+','')}</td></tr>`).join('');
  const sectors = (th?.sectorWeightings || []).map(o => Object.entries(o)[0]).map(([k, v]) => [k, raw(v)]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const SECT_NL = {technology:'Technologie',financial_services:'Financieel',healthcare:'Zorg',consumer_cyclical:'Consument (cyclisch)',consumer_defensive:'Consument (defensief)',industrials:'Industrie',communication_services:'Communicatie',energy:'Energie',basic_materials:'Grondstoffen',realestate:'Vastgoed',utilities:'Nutsbedrijven'};
  return `<section class="panel" style="margin-top:20px"><h3>🧺 Wat zit er in deze ETF?</h3>
    <div class="sv-grid" style="margin-bottom:14px">
      ${stat('Fondsbeheerder', esc(fp?.family || '–'))}${stat('Categorie', esc(fp?.categoryName || '–'))}
      ${stat('Kosten (TER)', isNum(raw(fp?.feesExpensesInvestment?.annualReportExpenseRatio)) ? pctFrac(raw(fp.feesExpensesInvestment.annualReportExpenseRatio)).replace('+','') : '–')}
    </div>
    <div class="sv-two" style="margin-top:0">
      <div><div class="lab" style="font-size:11.5px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px">Top 10 posities</div>${hold ? `<table class="ns-table sv-table"><tbody>${hold}</tbody></table>` : '<div class="mu">Niet beschikbaar.</div>'}</div>
      <div><div class="lab" style="font-size:11.5px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px">Sectoren</div>${sectors.length ? sectors.map(([k, v]) => `<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:12.5px"><span>${esc(SECT_NL[k] || k)}</span><b>${num(v * 100, 1)}%</b></div><div class="health-bar"><i style="width:${v * 100}%;background:var(--ac)"></i></div></div>`).join('') : '<div class="mu">Niet beschikbaar.</div>'}</div>
    </div></section>`;
}

async function pageDetail(sym){
  const main = $('#main');
  main.innerHTML = `<a href="#/" class="ns-back-btn">← Terug naar markten</a><div id="sv_detail"><div class="empty">Laden…</div></div>`;
  main.onclick = e => {
    const star = e.target.closest('[data-star]'); if(star){ toggleWatch(star.dataset.star); return; }
    const rb = e.target.closest('[data-range]'); if(rb){ detailRange = rb.dataset.range; store.set('ns_range', detailRange); document.querySelectorAll('[data-range]').forEach(b => b.classList.toggle('on', b.dataset.range === detailRange)); loadChart(sym, rb.dataset.cur); return; }
    const more = e.target.closest('#sv_more'); if(more){ $('#sv_desc').classList.toggle('clamp'); more.textContent = $('#sv_desc').classList.contains('clamp') ? 'Lees meer' : 'Minder'; }
  };
  let d;
  try{ d = (await api('/api/stock?symbol=' + encodeURIComponent(sym))).data; if(!d) throw new Error('aandeel niet gevonden'); }
  catch(err){ $('#sv_detail').innerHTML = serverError(err); return; }
  if(location.hash !== '#/s/' + encodeURIComponent(sym)) return;

  const p = d.price || {}, sd = d.summaryDetail || {}, ks = d.defaultKeyStatistics || {}, fd = d.financialData || {}, ap = d.assetProfile || {};
  const cur = p.currency || sd.currency || 'EUR', isEtf = p.quoteType === 'ETF';
  const price = raw(p.regularMarketPrice), chg = raw(p.regularMarketChangePercent) * 100, chgAbs = raw(p.regularMarketChange);
  const meta = META[sym];
  const marketState = {REGULAR:'Beurs open', PRE:'Voorbeurs', POST:'Nabeurs', CLOSED:'Beurs gesloten', POSTPOST:'Beurs gesloten', PREPRE:'Beurs gesloten'}[p.marketState] || '';
  const divY = raw(sd.dividendYield) ?? raw(sd.trailingAnnualDividendYield) ?? raw(sd.yield);

  const keyStats = isEtf ? [
    ['Vermogen', big(raw(sd.totalAssets), cur)], ['Dividendrendement', isNum(raw(sd.yield)) ? pctFrac(raw(sd.yield)).replace('+','') : '–'],
    ['52-weeks hoog', money(raw(sd.fiftyTwoWeekHigh), cur)], ['52-weeks laag', money(raw(sd.fiftyTwoWeekLow), cur)],
    ['Rendement dit jaar', pctFrac(raw(ks.ytdReturn))], ['Rendement 3 jaar (p.j.)', pctFrac(raw(ks.threeYearAverageReturn))],
    ['Rendement 5 jaar (p.j.)', pctFrac(raw(ks.fiveYearAverageReturn))], ['Beurs', esc(p.exchangeName || '–')],
  ] : [
    ['Marktwaarde', big(raw(p.marketCap), cur)], ['K/W (afgelopen 12 mnd)', num(raw(sd.trailingPE), 1)],
    ['K/W (verwacht)', num(raw(sd.forwardPE), 1)], ['Winst per aandeel', money(raw(ks.trailingEps), cur)],
    ['Dividendrendement', isNum(divY) ? pctFrac(divY).replace('+','') : '–'], ['Dividend per jaar', money(raw(sd.dividendRate), cur)],
    ['Uitkeringsratio', isNum(raw(sd.payoutRatio)) ? pctFrac(raw(sd.payoutRatio), 0).replace('+','') : '–'], ['Ex-dividenddatum', fmtDate(sd.exDividendDate)],
    ['Omzet (12 mnd)', big(raw(fd.totalRevenue), fd.financialCurrency || cur)], ['Omzetgroei (j-o-j)', pctFrac(raw(fd.revenueGrowth), 1)],
    ['Winstmarge', pctFrac(raw(fd.profitMargins), 1).replace('+','')], ['Vrije kasstroom', big(raw(fd.freeCashflow), fd.financialCurrency || cur)],
    ['Schuld / eigen vermogen', isNum(raw(fd.debtToEquity)) ? num(raw(fd.debtToEquity) / 100, 2) : '–'], ['Beta (volatiliteit)', num(raw(ks.beta) ?? raw(sd.beta), 2)],
    ['52-weeks hoog', money(raw(sd.fiftyTwoWeekHigh), cur)], ['52-weeks laag', money(raw(sd.fiftyTwoWeekLow), cur)],
  ];

  const desc = ap.longBusinessSummary || '';
  const profile = isEtf ? '' : `<section class="panel"><h3>🏢 Over ${esc(p.shortName || sym)}</h3>
    ${desc ? `<div class="sv-desc clamp" id="sv_desc">${esc(desc)}</div><button class="ns-link-btn" id="sv_more" style="margin-top:6px;font-size:12px">Lees meer</button>` : '<div class="mu">Geen beschrijving beschikbaar.</div>'}
    <div class="sv-grid" style="margin-top:14px">
      ${stat('Sector', esc(ap.sector || '–'))}${stat('Branche', esc(ap.industry || '–'))}
      ${stat('Land', esc(ap.country || '–'))}${stat('Medewerkers', isNum(ap.fullTimeEmployees) ? ap.fullTimeEmployees.toLocaleString('nl-NL') : '–')}
    </div>
    ${ap.website ? `<div style="margin-top:10px"><a class="ns-link-btn" href="${esc(ap.website)}" target="_blank" rel="noopener" style="font-size:12px">${esc(ap.website.replace(/^https?:\/\//,''))} ↗</a></div>` : ''}
  </section>`;

  const rec = d.recommendationTrend?.trend?.[0];
  const recTotal = rec ? rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell : 0;
  const recHtml = recTotal ? `<section class="panel"><h3>🧭 Oordeel analisten</h3>
    <div class="mu" style="font-size:12px;margin-bottom:12px">${recTotal} analisten deze maand. Ter informatie, geen advies.</div>
    <div style="display:flex;flex-direction:column;gap:10px">
    ${[['Sterk kopen',rec.strongBuy,'var(--up)'],['Kopen',rec.buy,'var(--up)'],['Houden',rec.hold,'var(--warn)'],['Verkopen',rec.sell,'var(--down)'],['Sterk verkopen',rec.strongSell,'var(--down)']].map(([l, n, c]) => `
      <div class="health-pillar"><span>${l}</span><div class="health-bar"><i style="width:${recTotal ? (n / recTotal * 100) : 0}%;background:${c}"></i></div><b style="text-align:right">${n}</b></div>`).join('')}
    </div>
    ${isNum(raw(fd.targetMeanPrice)) ? `<div class="sv-grid" style="margin-top:16px">${stat('Gem. koersdoel', money(raw(fd.targetMeanPrice), cur))}${stat('Laag / hoog', money(raw(fd.targetLowPrice), cur) + ' – ' + money(raw(fd.targetHighPrice), cur))}</div>` : ''}
  </section>` : '';

  $('#sv_detail').innerHTML = `
    <div class="sv-head" style="margin-top:12px">
      <div>
        <div class="ns-tag">${esc(isEtf ? 'ETF' : (meta?.cat || ap.sector || 'Aandeel'))} · ${esc(sym)} · ${esc(p.exchangeName || '')}</div>
        <h1 style="font:800 26px/1.2 var(--disp)">${esc(p.longName || p.shortName || sym)}</h1>
        <div class="sv-price">${money(price, cur)}</div>
        <div style="margin-top:4px;font-weight:700" class="${cls(chg)}">${isNum(chgAbs) ? (chgAbs >= 0 ? '+' : '') + num(chgAbs) : ''} (${pct(chg)}) <span class="mu" style="font-weight:500">vandaag · ${esc(marketState)}</span></div>
      </div>
      <button class="btn ${WATCH.has(sym) ? 'pri' : ''}" data-star="${esc(sym)}">${WATCH.has(sym) ? '★ In volglijst' : '☆ Volgen'}</button>
    </div>
    <section class="panel">
      <div class="sv-chart-bar">
        <div id="sv_range_chg" style="font-weight:700"></div>
        <div class="tabs-clean">${RANGES.map(([l]) => `<button data-range="${l}" data-cur="${esc(cur)}" class="${l === detailRange ? 'on' : ''}">${l}</button>`).join('')}</div>
      </div>
      <div class="sv-chart" id="sv_chart"></div>
    </section>
    <div class="sv-two">
      <section class="panel"><h3>📌 Kerncijfers</h3><div class="sv-grid">${keyStats.map(([l, v]) => stat(l, v)).join('')}</div></section>
      ${recHtml || profile}
    </div>
    ${recHtml ? `<div style="margin-top:20px">${profile}</div>` : ''}
    ${isEtf ? etfSection(d) : quarterlySection(d, fd.financialCurrency || cur)}
    <div class="sv-note">Bron: Yahoo Finance. Cijfers kunnen vertraagd of onvolledig zijn. Dit is informatie, geen beleggingsadvies.</div>`;
  loadChart(sym, cur);
}

/* ---------- Router ---------- */
function render(){
  const h = location.hash.replace(/^#/, '') || '/';
  if(h === '/portfolio' || h === 'portfolio' || h === '/dashboard' || h === 'dashboard'){
    window.location.href = 'index.html' + (h.includes('dashboard') ? '#/dashboard' : '#/portfolio');
    return;
  }
  renderNav(h.startsWith('/s/') ? '' : h);
  window.scrollTo(0, 0);
  if(h.startsWith('/s/')) return pageDetail(decodeURIComponent(h.slice(3)));
  if(h === '/volglijst') return pageList(true);
  return pageList(false);
}
window.addEventListener('hashchange', render);
document.addEventListener('click', e => {
  if(e.target.closest('[data-act="refresh"]')){ quotesTs = 0; loadQuotes(true).then(render).catch(err => toast('Vernieuwen mislukt: ' + err.message)); toast('Koersen vernieuwen…'); }
});
// Lijst elke minuut vernieuwen
setInterval(() => { const h = location.hash; if(!h.startsWith('#/s/') && document.visibilityState === 'visible') loadQuotes(true).then(() => { if(location.hash === h) render(); }).catch(() => {}); }, 60e3);
render();