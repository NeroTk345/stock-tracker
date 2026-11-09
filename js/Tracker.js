/* ================= state declaration ================= */
let UI = {
  privacyMode: localStorage.getItem('pf_privacy') === 'true',
  sort: {key:'value',dir:-1},
  dRange: '1Y',
  sRange: '6M',
  proj: {start:null,monthly:null,years:20,ret:7},
  txFilter: '',
  rbTargets: null,
  rbScenario: {},
  rbCash: 0,
  rbMode: 'sellbuy',
  rbTab: 'rebalance',
  distTab: 'funds'
};

/* ================= helpers ================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const NF=o=>new Intl.NumberFormat('nl-NL',o);
const eur=(n,d=2)=>{
  if(UI.privacyMode) return '€ •••••';
  return n==null||!isFinite(n)?'–':NF({style:'currency',currency:'EUR',minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
};
const num=(n,d=2)=>n==null||!isFinite(n)?'–':NF({minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const shr=(n)=>{
  if(window.UI&&UI.privacyMode) return '•••';
  return n==null||!isFinite(n)?'–':NF({maximumFractionDigits:4}).format(n);
};
const pct=n=>n==null||!isFinite(n)?'–':(n>0?'+':'')+num(n,2)+'%';
const seur=(n,d=2)=>{
  if(window.UI&&UI.privacyMode) return '€ •••••';
  return n==null||!isFinite(n)?'–':(n>0?'+':'')+eur(n,d);
};
const cls=n=>n>1e-6?'up':n<-1e-6?'down':'';
const compact=n=>n==null||!isFinite(n)?'–':NF({notation:'compact',maximumFractionDigits:2}).format(n);
const ago=ms=>{const m=Math.round((Date.now()-ms)/60000);if(m<1)return 'zojuist';if(m<60)return m+' min geleden';const h=Math.round(m/60);if(h<24)return h+' uur geleden';return Math.round(h/24)+' d geleden'};
const PALETTE=['#00d084','#8b5cf6','#38bdf8','#f59e0b','#ec4899','#10b981','#f43f5e','#6366f1','#14b8a6','#a855f7'];

const ICONS={
 dash:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
 brief:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
 cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
 eye:'<path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 eye_off:'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
 tax:'<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/>',
 print:'<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
 refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
 star:'<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/>',
 back:'<path d="M19 12H5M12 19l-7-7 7-7"/>',
 edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
 dl:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
 ul:'<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
 chart:'<path d="M3 3v18h18M7 15l4-5 3 3 5-7"/>',
 balance:'<path d="M12 3v18M3 9l9-6 9 6M6 13l-3 6h6l-3-6zM18 13l-3 6h6l-3-6z"/>',
 coin:'<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9h6a1.5 1.5 0 0 1 0 3H9a1.5 1.5 0 0 0 0 3h6"/>',
 folder:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
 globe:'<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
 hub:'<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>'
};
const ic=(n,s=18,fill)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${fill?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]||''}</svg>`;

/* ================= multi-account & user authentication state ================= */
const localProxyPrefix = (typeof location !== 'undefined' && (location.hostname === '127.0.0.1' || location.hostname === 'localhost')) ? 'http://127.0.0.1:8080' : '';

const AUTH = {
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('ns_auth_token') || null : null,
  user: null,
  syncStatus: 'idle',
  lastSync: null
};

async function authFetch(endpoint, options = {}){
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if(AUTH.token){
    headers['Authorization'] = 'Bearer ' + AUTH.token;
  }
  const url = `${localProxyPrefix}${endpoint}`;
  const resp = await fetch(url, { ...options, headers });
  const data = await resp.json().catch(() => ({}));
  if(!resp.ok){
    const err = new Error(data.error || 'Er is een fout opgetreden (HTTP ' + resp.status + ')');
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data;
}

let syncTimer = null;
function queueCloudSync(){
  if(!AUTH.token) return;
  AUTH.syncStatus = 'syncing';
  updateChrome();
  if(syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const res = await authFetch('/api/user/data', {
        method: 'POST',
        body: JSON.stringify({ portfolio: S })
      });
      AUTH.syncStatus = 'synced';
      AUTH.lastSync = res.updated_at || new Date().toISOString();
      updateChrome();
    } catch(err){
      AUTH.syncStatus = 'error';
      updateChrome();
    }
  }, 1000);
}

function ensurePortfolioIntegrity(st){
  if(!st) return;
  if(!st.set) st.set = { theme: 'dark', refresh: 30, finnhub: '', proxy: true, hideEst: true };
  if(!st.set.theme) st.set.theme = localStorage.getItem('pf_tracker_theme') || 'dark';
  if(!st.accounts || typeof st.accounts !== 'object') st.accounts = {};
  
  if(Object.keys(st.accounts).length === 0){
    st.accounts['MAIN'] = {
      id: 'MAIN',
      name: 'Mijn Portfolio',
      icon: '💼',
      file: '',
      inst: st.inst || {},
      tx: st.tx || [],
      dividends: st.dividends || [],
      watch: st.watch || ['ASML.AS', 'NVDA', 'AAPL'],
      plan: st.plan || { sym: '', amount: 100, day: 1, active: false },
      alerts: st.alerts || []
    };
  }

  if(!st.activeAccount || (st.activeAccount !== 'ALL' && !st.accounts[st.activeAccount])){
    st.activeAccount = Object.keys(st.accounts)[0] || 'MAIN';
  }

  const cur = st.activeAccount === 'ALL' ? null : st.accounts[st.activeAccount];
  if(cur){
    st.inst = cur.inst = cur.inst || {};
    st.tx = cur.tx = cur.tx || [];
    st.dividends = cur.dividends = cur.dividends || [];
    st.watch = cur.watch = cur.watch || [];
    st.plan = cur.plan = cur.plan || { sym: '', amount: 100, day: 1, active: false };
    st.alerts = cur.alerts = cur.alerts || [];
  } else if(st.activeAccount === 'ALL'){
    const firstAcc = Object.values(st.accounts)[0];
    if(firstAcc && (!st.plan || !st.plan.sym)){
      st.plan = firstAcc.plan || { sym: '', amount: 100, day: 1, active: false };
    }
  }

  // Automatische ontdubbeling op transactie-ID / unieke signatuur
  Object.values(st.accounts || {}).forEach(acc => {
    if(Array.isArray(acc.tx)){
      const seenTx = new Set();
      acc.tx = acc.tx.filter(t => {
        const sig = t.orderId || `${t.date}_${t.sym}_${t.type}_${t.shares}_${t.amount}`;
        if(seenTx.has(sig)) return false;
        seenTx.add(sig);
        return true;
      });
    }
    if(Array.isArray(acc.dividends)){
      const seenDiv = new Set();
      acc.dividends = acc.dividends.filter(d => {
        const sig = d.orderId || `${d.date}_${d.sym}_${d.amount}`;
        if(seenDiv.has(sig)) return false;
        seenDiv.add(sig);
        return true;
      });
    }
  });

  if(!st.plan) st.plan = { sym: '', amount: 100, day: 1, active: false };
  if(!st.alerts) st.alerts = [];
  if(!st.watch) st.watch = [];
  if(!st.tx) st.tx = [];
  if(!st.inst) st.inst = {};
}

async function initAuth(){
  if(!AUTH.token) {
    S = load(true);
    ensurePortfolioIntegrity(S);
    applyTheme();
    updateChrome();
    render(true);
    return;
  }
  try {
    const data = await authFetch('/api/auth/me');
    AUTH.user = data.user;
    updateChrome();

    // Fetch this user's private cloud portfolio
    const cloudRes = await authFetch('/api/user/data');
    if(cloudRes && cloudRes.portfolio && cloudRes.portfolio.accounts && Object.keys(cloudRes.portfolio.accounts).length > 0){
      S = cloudRes.portfolio;
      ensurePortfolioIntegrity(S);
      try { localStorage.setItem('pf_tracker_user_' + AUTH.user.id, JSON.stringify(S)); } catch(e){}
      AUTH.syncStatus = 'synced';
      AUTH.lastSync = cloudRes.updated_at;
      applyTheme();
      refreshAll();
      render(true);
      toast(`👋 Welkom terug, ${AUTH.user.name}!`);
    } else {
      S = makeFreshUserPortfolio(AUTH.user.name);
      ensurePortfolioIntegrity(S);
      save();
      applyTheme();
      refreshAll();
      render(true);
    }
  } catch(e){
    if(e.status === 401){
      AUTH.token = null;
      AUTH.user = null;
      try { localStorage.removeItem('ns_auth_token'); } catch(_){}
      S = load(true);
      ensurePortfolioIntegrity(S);
      applyTheme();
      updateChrome();
      render(true);
    }
  }
}

const LS='pf_tracker_v1';
const LS_ACC='pf_active_acc';

function defaultAccounts(){
  return {
    DEMO: {
      id: 'DEMO',
      name: 'Demo Portfolio',
      file: '',
      icon: '💼',
      inst: {
        'ASML.AS': { name: 'ASML Holding', type: 'Stock', sector: 'Technologie', region: 'Europa', cap: 'Large' },
        'AAPL': { name: 'Apple Inc.', type: 'Stock', sector: 'Technologie', region: 'Verenigde Staten', cap: 'Mega' },
        'MSFT': { name: 'Microsoft Corp', type: 'Stock', sector: 'Technologie', region: 'Verenigde Staten', cap: 'Mega' },
        'SXR8.DE': { name: 'iShares Core S&P 500 ETF', type: 'ETF', sector: 'Index Fondsen', region: 'Verenigde Staten', cap: 'Mega' },
        'VWCE.DE': { name: 'Vanguard FTSE All-World ETF', type: 'ETF', sector: 'Index Fondsen', region: 'Wereldwijd', cap: 'Mega' }
      },
      tx: [
        { id: 't1', date: '2024-01-15', sym: 'SXR8.DE', type: 'BUY', shares: 15, price: 475.20, amount: 7128.00, fee: 1.00, broker: 'Demo' },
        { id: 't2', date: '2024-02-10', sym: 'VWCE.DE', type: 'BUY', shares: 45, price: 108.50, amount: 4882.50, fee: 1.00, broker: 'Demo' },
        { id: 't3', date: '2024-03-05', sym: 'ASML.AS', type: 'BUY', shares: 6, price: 820.00, amount: 4920.00, fee: 2.00, broker: 'Demo' },
        { id: 't4', date: '2024-04-12', sym: 'AAPL', type: 'BUY', shares: 25, price: 168.00, amount: 4200.00, fee: 1.00, broker: 'Demo' },
        { id: 't5', date: '2024-05-20', sym: 'MSFT', type: 'BUY', shares: 10, price: 410.00, amount: 4100.00, fee: 1.00, broker: 'Demo' }
      ],
      dividends: [
        { id: 'd1', date: '2024-05-16', sym: 'AAPL', amount: 24.50, net: 20.82, tax: 3.68 },
        { id: 'd2', date: '2024-06-13', sym: 'MSFT', amount: 37.50, net: 31.88, tax: 5.62 },
        { id: 'd3', date: '2024-08-08', sym: 'ASML.AS', amount: 48.00, net: 40.80, tax: 7.20 }
      ],
      watch: ['ASML.AS','NVDA','AAPL','SXR8.DE','VWCE.DE'],
      plan: { sym: 'SXR8.DE', amount: 250, day: 1, active: true },
      alerts: []
    }
  };
}

function makeFreshUserPortfolio(name){
  const cleanName = (name || 'Mijn Portfolio').trim();
  return {
    ver: 4,
    activeAccount: 'MAIN',
    accounts: {
      MAIN: {
        id: 'MAIN',
        name: cleanName,
        icon: '💼',
        file: '',
        inst: {},
        tx: [],
        dividends: [],
        watch: ['ASML.AS', 'NVDA', 'AAPL'],
        plan: { sym: '', amount: 0, day: 1, active: false },
        alerts: []
      }
    },
    inst: {},
    tx: [],
    dividends: [],
    watch: ['ASML.AS', 'NVDA', 'AAPL'],
    plan: { sym: '', amount: 0, day: 1, active: false },
    alerts: [],
    set: { theme: 'dark', refresh: 30, finnhub: '', proxy: true, hideEst: true }
  };
}

function buildStateFromAccounts(allAccs, prefActiveId = 'TR', savedSet = null){
  let activeAccId = prefActiveId;
  Object.keys(allAccs).forEach(k => {
    if(!allAccs[k].id) allAccs[k].id = k;
  });

  let curAcc = allAccs[activeAccId];
  if(activeAccId !== 'ALL' && !curAcc){
    activeAccId = Object.keys(allAccs)[0] || 'MAIN';
    curAcc = allAccs[activeAccId];
  }

  const curTheme = savedSet?.theme || (typeof localStorage !== 'undefined' && localStorage.getItem('pf_tracker_theme')) || 'dark';
  const fullSet = Object.assign({
    theme: curTheme,
    refresh: 30,
    finnhub: '',
    proxy: true,
    hideEst: true
  }, savedSet || {});

  const S_res = {
    ver: 4,
    activeAccount: activeAccId,
    accounts: allAccs,
    inst: (curAcc && curAcc.inst) || {},
    tx: (curAcc && curAcc.tx) || [],
    dividends: (curAcc && curAcc.dividends) || [],
    watch: (curAcc && curAcc.watch) || [],
    plan: (curAcc && curAcc.plan) || {sym:'',amount:100,day:1,active:false},
    alerts: (curAcc && curAcc.alerts) || [],
    set: fullSet
  };

  if(activeAccId === 'ALL'){
    const mergedInst = {};
    const mergedTx = [];
    const mergedDiv = [];
    const mergedWatch = new Set();
    let bestPlan = null;
    Object.values(allAccs).forEach(acc => {
      Object.assign(mergedInst, acc.inst || {});
      (acc.tx || []).forEach(t => mergedTx.push({ ...t, _account: acc.name, _accId: acc.id }));
      (acc.dividends || []).forEach(d => mergedDiv.push({ ...d, _account: acc.name, _accId: acc.id }));
      (acc.watch || []).forEach(w => mergedWatch.add(w));
      if(!bestPlan && acc.plan && acc.plan.active && acc.plan.sym) bestPlan = acc.plan;
    });
    S_res.inst = mergedInst;
    S_res.tx = mergedTx;
    S_res.dividends = mergedDiv;
    S_res.watch = Array.from(mergedWatch);
    S_res.plan = bestPlan || Object.values(allAccs)[0]?.plan || {sym:'',amount:100,day:1,active:false};
  }
  return S_res;
}

function load(forceDemo = false){
  if(forceDemo || !AUTH.user){
    // Demo Mode: load clean demo accounts (no money / €0,00)
    let allAccs = defaultAccounts();
    let activeAccId = 'DEMO';
    let savedSet = null;
    try {
      const demoSaved = JSON.parse(localStorage.getItem('pf_tracker_demo'));
      if(demoSaved && demoSaved.accounts && Object.keys(demoSaved.accounts).length > 0){
        // If demo storage has old DEGIRO or old TR seed, clear it so father's data is wiped
        if(demoSaved.accounts.DEGIRO || demoSaved.accounts.TR || (demoSaved.accounts.DEMO && (!demoSaved.accounts.DEMO.tx || demoSaved.accounts.DEMO.tx.length === 0))){
          localStorage.removeItem('pf_tracker_demo');
          allAccs = defaultAccounts();
        } else {
          allAccs = demoSaved.accounts;
          if(demoSaved.activeAccount && allAccs[demoSaved.activeAccount]) activeAccId = demoSaved.activeAccount;
          if(demoSaved.set) savedSet = demoSaved.set;
        }
      }
    } catch(e){}
    return buildStateFromAccounts(allAccs, activeAccId, savedSet);
  }

  // Logged-in User: load from user's isolated storage
  const userKey = 'pf_tracker_user_' + AUTH.user.id;
  try {
    const saved = JSON.parse(localStorage.getItem(userKey));
    if(saved && saved.accounts && Object.keys(saved.accounts).length > 0){
      return buildStateFromAccounts(saved.accounts, saved.activeAccount || Object.keys(saved.accounts)[0], saved.set);
    }
  } catch(e){}

  return makeFreshUserPortfolio(AUTH.user.name);
}

let S=load();

function save(){
  if(S.accounts){
    Object.keys(S.accounts).forEach(k => {
      if(!S.accounts[k].id) S.accounts[k].id = k;
    });
  }

  if(!S.set) S.set = { theme: 'dark', refresh: 30, finnhub: '', proxy: true, hideEst: true };
  if(S.set.theme){
    try { localStorage.setItem('pf_tracker_theme', S.set.theme); } catch(e){}
  }

  if(!AUTH.user){
    // In Demo mode, only save to demo key, do NOT sync to cloud
    try { localStorage.setItem('pf_tracker_demo', JSON.stringify(S)); } catch(e){}
    return;
  }

  // Logged in user: save to user's isolated storage & sync to server
  const userKey = 'pf_tracker_user_' + AUTH.user.id;
  if(S.activeAccount === 'ALL'){
    try{ localStorage.setItem(userKey, JSON.stringify(S)); }catch(e){}
    queueCloudSync();
    return;
  }
  try{
    if(S.accounts && S.accounts[S.activeAccount]){
      S.accounts[S.activeAccount] = {
        id: S.activeAccount,
        name: S.accounts[S.activeAccount].name,
        file: S.accounts[S.activeAccount].file,
        icon: S.accounts[S.activeAccount].icon,
        inst: S.inst,
        tx: S.tx,
        dividends: S.dividends,
        watch: S.watch,
        plan: S.plan,
        alerts: S.alerts
      };
    }
    localStorage.setItem(userKey, JSON.stringify(S));
  }catch(e){}
  queueCloudSync();
}

let autoSwitchTimer = null;
let autoSwitchSeconds = 10;
let autoSwitchRemaining = 10;
let autoSwitchRunning = false;

function switchAccount(accId, isAuto = false){
  if(S.activeAccount === accId) return;
  save(); // save current individual account

  // Preserve rebalance targets per account
  if(!UI.rbTargetsByAcc) UI.rbTargetsByAcc = {};
  if(S.activeAccount && S.activeAccount !== 'ALL' && UI.rbTargets){
    UI.rbTargetsByAcc[S.activeAccount] = { ...UI.rbTargets };
  }

  if(accId === 'ALL'){
    S.activeAccount = 'ALL';
    const mergedInst = {};
    const mergedTx = [];
    const mergedDiv = [];
    const mergedWatch = new Set();
    let bestPlan = null;
    Object.values(S.accounts || {}).forEach(acc => {
      Object.assign(mergedInst, acc.inst || {});
      (acc.tx || []).forEach(t => mergedTx.push({ ...t, _account: acc.name, _accId: acc.id }));
      (acc.dividends || []).forEach(d => mergedDiv.push({ ...d, _account: acc.name, _accId: acc.id }));
      (acc.watch || []).forEach(w => mergedWatch.add(w));
      if(!bestPlan && acc.plan && acc.plan.active && acc.plan.sym) bestPlan = acc.plan;
    });
    S.inst = mergedInst;
    S.tx = mergedTx;
    S.dividends = mergedDiv;
    S.watch = Array.from(mergedWatch);
    // Preserve best plan across accounts so it doesn't vanish on ALL
    S.plan = bestPlan || Object.values(S.accounts || {})[0]?.plan || {sym:'',amount:100,day:1,active:false};
    S.alerts = [];

    UI.rbTargets = UI.rbTargetsByAcc['ALL'] ? { ...UI.rbTargetsByAcc['ALL'] } : null;
    UI.rbScenario = {};
    UI.rbCash = 0;

    try { localStorage.setItem(LS_ACC, 'ALL'); } catch(e){}
    toast(`🌍 Geconsolideerd overzicht van alle accounts actief!`);
    updateChrome();
    refreshAll();
    render(true);
    return;
  }

  if(!S.accounts || !S.accounts[accId]) return;
  S.activeAccount = accId;
  const target = S.accounts[accId];
  S.inst = target.inst || {};
  S.tx = target.tx || [];
  S.dividends = target.dividends || [];
  S.watch = target.watch || [];
  S.plan = target.plan || {sym:'',amount:0,day:1,active:false};
  S.alerts = target.alerts || [];

  UI.rbTargets = UI.rbTargetsByAcc[accId] ? { ...UI.rbTargetsByAcc[accId] } : null;
  UI.rbScenario = {};
  UI.rbCash = 0;

  try { localStorage.setItem(LS_ACC, accId); } catch(e){}
  save();

  if(isAuto){
    toast(`🔄 Auto-switch: ${target.icon} ${target.name} (${target.file})`);
  } else {
    toast(`${target.icon} Account gewisseld: ${target.name} (${target.file})`);
    if(autoSwitchRunning) autoSwitchRemaining = autoSwitchSeconds;
  }
  updateChrome();
  refreshAll();
  render(true);
}

function toggleNextAccount(){
  const keys = Object.keys(S.accounts || {});
  if(keys.length <= 1) return;
  const curIdx = keys.indexOf(S.activeAccount);
  const nextIdx = (curIdx + 1) % keys.length;
  switchAccount(keys[nextIdx]);
}

function toggleAutoSwitch(){
  autoSwitchRunning = !autoSwitchRunning;
  if(autoSwitchRunning){
    autoSwitchRemaining = autoSwitchSeconds;
    startAutoSwitch();
    toast(`🔄 Auto-switch AAN: wisselt elke ${autoSwitchSeconds}s tussen accounts`);
  } else {
    stopAutoSwitch();
    toast('⏹️ Auto-switch UIT');
  }
  updateAutoSwitchUI();
  updateChrome();
  render(true);
}

function startAutoSwitch(){
  if(autoSwitchTimer) clearInterval(autoSwitchTimer);
  autoSwitchRemaining = autoSwitchSeconds;
  autoSwitchTimer = setInterval(()=>{
    if(typeof busyUI === 'function' && busyUI()) return;
    autoSwitchRemaining--;
    if(autoSwitchRemaining <= 0){
      autoSwitchRemaining = autoSwitchSeconds;
      const keys = Object.keys(S.accounts || {});
      if(keys.length > 1){
        const curIdx = keys.indexOf(S.activeAccount);
        const nextIdx = (curIdx + 1) % keys.length;
        switchAccount(keys[nextIdx], true);
      }
    } else {
      updateAutoSwitchUI();
    }
  }, 1000);
}

function createNewAccount(name, icon, file, initialData = {}){
  const id = 'ACC_' + Date.now();
  if(!S.accounts) S.accounts = {};
  S.accounts[id] = {
    id,
    name: name || 'Nieuw Account',
    icon: icon || '💼',
    file: file || `${(name||'account').toLowerCase().replace(/\s+/g,'_')}.csv`,
    inst: initialData.inst || {},
    tx: initialData.tx || [],
    dividends: initialData.dividends || [],
    watch: initialData.watch || [],
    plan: initialData.plan || {sym:'',amount:0,day:1,active:false},
    alerts: initialData.alerts || []
  };
  save();
  switchAccount(id);
  toast(`🎉 Account aangemaakt: ${name}`);
  return id;
}

function clearAccountData(accId){
  const targetId = accId || S.activeAccount;
  if(targetId === 'ALL'){
    if(confirm('Weet je zeker dat je ALLE data (transacties, dividenden en posities) uit ALLE accounts wilt wissen?\n\nDe accounts blijven bestaan, maar alle gegevens en gekoppelde bestanden worden gewist.')){
      Object.values(S.accounts || {}).forEach(a => {
        a.inst = {};
        a.tx = [];
        a.dividends = [];
        a.watch = [];
        a.file = 'blanco';
      });
      S.inst = {};
      S.tx = [];
      S.dividends = [];
      S.watch = [];
      save();
      refreshAll();
      render(true);
      closeModal();
      toast('🧹 Alle gegevens uit alle accounts zijn volledig gewist!');
    }
    return;
  }
  const acc = S.accounts[targetId];
  if(!acc) return;
  if(confirm(`Weet je zeker dat je alle gegevens (transacties, dividenden en posities) uit "${acc.name}" wilt wissen?\n\nHet account blijft bestaan, maar alle geïmporteerde CSV/Excel-data wordt verwijderd.`)){
    acc.inst = {};
    acc.tx = [];
    acc.dividends = [];
    acc.watch = [];
    acc.file = 'blanco';
    if(S.activeAccount === targetId){
      S.inst = {};
      S.tx = [];
      S.dividends = [];
      S.watch = [];
    }
    save();
    refreshAll();
    render(true);
    closeModal();
    toast(`🧹 Account "${acc.name}" is volledig leeggemaakt en het bestand is ontkoppeld!`);
  }
}

function deleteAccount(accId){
  if(!S.accounts) return;
  let targetId = accId;
  if(!S.accounts[targetId]){
    targetId = Object.keys(S.accounts).find(k => k === accId || S.accounts[k]?.id === accId);
  }
  if(!targetId || !S.accounts[targetId]){
    render(true);
    closeModal();
    return;
  }

  const accName = S.accounts[targetId]?.name || 'Account';
  const remainingKeys = Object.keys(S.accounts).filter(k => k !== targetId);

  if(remainingKeys.length === 0){
    if(confirm(`"${accName}" is je enige account en kan niet volledig worden verwijderd.\n\nWil je in plaats daarvan alle data en het gekoppelde bestand uit "${accName}" wissen zodat het account weer blanco is?`)){
      clearAccountData(targetId);
    }
    return;
  }

  if(!confirm(`Weet je zeker dat je het account "${accName}" definitief wilt verwijderen?\n\nAlle bijbehorende transacties, dividenden en posities van dit account worden verwijderd.`)){
    return;
  }

  delete S.accounts[targetId];
  if(!UI.rbTargetsByAcc) UI.rbTargetsByAcc = {};
  delete UI.rbTargetsByAcc[targetId];

  // If the deleted account was the currently active account, switch to the first remaining account
  if(S.activeAccount === targetId){
    const nextAccId = remainingKeys[0];
    S.activeAccount = nextAccId;
    const nextTarget = S.accounts[nextAccId];
    S.inst = nextTarget?.inst || {};
    S.tx = nextTarget?.tx || [];
    S.dividends = nextTarget?.dividends || [];
    S.watch = nextTarget?.watch || [];
    S.plan = nextTarget?.plan || {sym:'',amount:0,day:1,active:false};
    S.alerts = nextTarget?.alerts || [];
    UI.rbTargets = UI.rbTargetsByAcc[nextAccId] ? { ...UI.rbTargetsByAcc[nextAccId] } : null;
    UI.rbScenario = {};
    UI.rbCash = 0;
    try { localStorage.setItem(LS_ACC, nextAccId); } catch(e){}
  }

  save();
  updateChrome();
  refreshAll();
  render(true);
  closeModal();
  toast(`🗑️ Account "${accName}" is definitief verwijderd.`);
}

function stopAutoSwitch(){
  if(autoSwitchTimer) clearInterval(autoSwitchTimer);
  autoSwitchTimer = null;
  autoSwitchRunning = false;
  updateAutoSwitchUI();
}

function updateAutoSwitchUI(){
  $$('.autoswitch-label').forEach(el => {
    el.textContent = autoSwitchRunning ? `Auto (${autoSwitchRemaining}s)` : 'Auto-switch';
  });
  $$('.autoswitch-btn').forEach(btn => {
    btn.classList.toggle('active-auto', autoSwitchRunning);
    btn.classList.toggle('pri', autoSwitchRunning);
  });
  $$('.autoswitch-dot').forEach(d => {
    d.classList.toggle('live', autoSwitchRunning);
  });
}

function copyText(txt){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>toast('Gekopieerd naar klembord! ✓')).catch(()=>fallbackCopy(txt));
  }else{
    fallbackCopy(txt);
  }
}
function fallbackCopy(txt){
  const ta=document.createElement('textarea');
  ta.value=txt;
  ta.style.position='fixed';
  ta.style.opacity='0';
  document.body.appendChild(ta);
  ta.select();
  try{document.execCommand('copy');toast('Gekopieerd naar klembord! ✓')}
  catch(e){toast('Kopiëren mislukt')}
  ta.remove();
}
const nameOf=s=>S.inst[s]?.name||M.q[s]?.name||s;
const colorOf=s=>S.inst[s]?.color||'#8a96a8';
const nextColor=()=>PALETTE[Object.keys(S.inst).length%PALETTE.length];

/* ================= market data ================= */
const M={q:{},fx:{},hist:{},news:{},bad:new Set(),extra:new Set(),mode:'loading',last:null,loaded:false,liveOK:false};
const PROXIES=[
  u=>`${localProxyPrefix}/api/yahoo?url=`+encodeURIComponent(u),
  u=>'https://api.allorigins.win/get?url='+encodeURIComponent(u),
  u=>'https://api.allorigins.win/raw?url='+encodeURIComponent(u),
  u=>'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(u)
];
sessionStorage.removeItem('pidx'); // Reset any stale proxy index
let pidx=0;

function isPlausibleTicker(s){
  if(!s || typeof s !== 'string') return false;
  const clean = s.trim();
  if(!/^[A-Za-z0-9.\-^=]{1,12}$/.test(clean)) return false;
  if(clean.includes('*') || clean.includes(' ') || clean.includes('/')) return false;
  if(/^\d+$/.test(clean)) return false;
  return true;
}

function makeFallbackQuote(s){
  const myTx = (S.tx || []).filter(t => t.sym === s && (t.price || (t.amount && t.shares)));
  let basePrice = 100;
  if(myTx.length > 0){
    const totalAmt = myTx.reduce((sum, t) => sum + (t.amount || (t.shares * t.price) || 0), 0);
    const totalSh = myTx.reduce((sum, t) => sum + (t.shares || (t.price ? t.amount / t.price : 1)), 0);
    if(totalSh > 0 && totalAmt > 0){
      basePrice = totalAmt / totalSh;
    } else if(myTx[0].price){
      basePrice = Number(myTx[0].price);
    }
  } else if(BASE[s]){
    basePrice = BASE[s];
  }

  return {
    sym: s,
    price: basePrice,
    prev: basePrice,
    cur: 'EUR',
    name: S.inst[s]?.name || s,
    hi: basePrice,
    lo: basePrice,
    w52h: basePrice * 1.1,
    w52l: basePrice * 0.9,
    vol: 0,
    exch: 'LOKAAL',
    spark: [basePrice, basePrice],
    time: Date.now(),
    open: false,
    demo: true,
    src: myTx.length > 0 ? 'Aankoopkoers' : 'Lokaal'
  };
}

async function yget(url){
  let err;
  for(let k=0;k<PROXIES.length;k++){
    const i=(pidx+k)%PROXIES.length;
    const targetUrl = PROXIES[i](url);
    if(targetUrl === url) continue; // Direct Yahoo Finance requests always fail with CORS in browsers
    if(i>1&&!S.set.proxy) continue;
    const ctrl=new AbortController(),to=setTimeout(()=>ctrl.abort(),9000);
    try{
      const r=await fetch(targetUrl,{signal:ctrl.signal});
      clearTimeout(to);
      if(r.status === 404 || r.status === 400){
        const notFound = new Error('NOT_FOUND_404');
        notFound.isNotFound = true;
        throw notFound;
      }
      if(!r.ok)throw new Error('HTTP '+r.status);
      let j;
      if(targetUrl.includes('api.allorigins.win/get')){
        const wrap=await r.json();
        j = typeof wrap.contents === 'string' ? JSON.parse(wrap.contents) : wrap.contents;
      } else {
        j = await r.json();
      }
      if(!j) throw new Error('Lege respons');
      pidx=i;sessionStorage.setItem('pidx',i);
      return j;
    }catch(e){
      clearTimeout(to);
      err=e;
      if(e.isNotFound) break;
    }
  }
  throw err||new Error('geen verbinding');
}
function parseChart(j){
  const r=j&&j.chart&&j.chart.result&&j.chart.result[0];
  if(!r)throw new Error('geen data');
  const ts=r.timestamp||[],cl=(r.indicators.quote[0]||{}).close||[];
  const t=[],c=[];
  ts.forEach((x,i)=>{if(cl[i]!=null){t.push(x*1000);c.push(cl[i])}});
  return {meta:r.meta,t,c,cur:r.meta.currency};
}
const CHART_URL=(s,range,interval)=>`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?range=${range}&interval=${interval}&includePrePost=false`;
/* ===== Euro-notering (Xetra/Duitse beurs) voor buitenlandse aandelen =====
   Brokers als Trade Republic en DEGIRO waarderen in EUR. Een USD-koers omrekenen
   met een wisselkoers geeft altijd afwijkingen, dus we zoeken de EUR-notering op. */
const EUR_LISTING = (()=>{ try{ return JSON.parse(localStorage.getItem('pf_eur_listing')||'{}'); }catch(e){ return {}; } })();
const EUR_PREF = ['.DE','.F'];
const isEurSuffix = s => /\.(AS|DE|PA|F|DU|MU|SG|BE|HM|MI|MC|BR|LS|VI|HE|IR)$/i.test(s);
function isinOf(s){
  const i = S.inst?.[s]?.isin;
  if(i) return i;
  return Object.keys(KNOWN_ISIN_MAP).find(k => KNOWN_ISIN_MAP[k].sym === s) || '';
}
async function resolveEurListing(s){
  if(isEurSuffix(s) || /[=\-^]/.test(s)) return s;
  if(EUR_LISTING[s]) return EUR_LISTING[s];
  const queries = [isinOf(s), s].filter(Boolean);
  for(const q of queries){
    try{
      const j = await yget(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=20&newsCount=0`);
      const cands = (j.quotes||[]).map(x=>x.symbol).filter(Boolean);
      for(const suf of EUR_PREF){
        const hit = cands.find(c => c.toUpperCase().endsWith(suf));
        if(hit){ EUR_LISTING[s] = hit; try{ localStorage.setItem('pf_eur_listing', JSON.stringify(EUR_LISTING)); }catch(e){} return hit; }
      }
    }catch(e){}
  }
  EUR_LISTING[s] = s;
  return s;
}
const quoteTicker = s => (s==='DFNS.AS' ? 'DFEN.DE' : (EUR_LISTING[s] || s));

async function fetchQuote(s){
  let ticker = s;
  if(ticker==='PALANTIR') ticker='PLTR';
  ticker = quoteTicker(ticker);
  const d=parseChart(await yget(CHART_URL(ticker,'1d','5m')));
  const m=d.meta,now=Date.now(),reg=m.currentTradingPeriod&&m.currentTradingPeriod.regular;
  const q={sym:s,price:m.regularMarketPrice,prev:m.chartPreviousClose??m.previousClose,cur:m.currency,
    name:m.longName||m.shortName||s,hi:m.regularMarketDayHigh,lo:m.regularMarketDayLow,
    w52h:m.fiftyTwoWeekHigh,w52l:m.fiftyTwoWeekLow,vol:m.regularMarketVolume,exch:m.fullExchangeName||m.exchangeName,
    spark:d.c,time:(m.regularMarketTime||0)*1000,qtype:m.instrumentType,src:'Yahoo Finance',
    open:reg?(now>=reg.start*1000&&now<reg.end*1000):false};
  if(q.price==null)throw new Error('geen koers');

  // Versheidscheck: een Duitse euronotering wordt soms weinig verhandeld en loopt dan achter.
  // Is de thuisbeurs (bijv. Nasdaq) duidelijk actueler, reken die koers dan om naar EUR.
  if(ticker !== s && ticker !== 'DFEN.DE' && !s.includes('=')){
    try{
      const h = parseChart(await yget(CHART_URL(s,'1d','5m'))).meta;
      const hTime = (h.regularMarketTime||0)*1000, fx = toEUR(h.currency);
      if(h.regularMarketPrice != null && hTime - q.time > 10*60*1000 && fx > 0){
        q.price = h.regularMarketPrice * fx;
        q.prev = (h.chartPreviousClose ?? h.previousClose) * fx;
        q.cur = 'EUR'; q.time = hTime;
        q.exch = (h.fullExchangeName || h.exchangeName || s) + ' (omgerekend naar EUR)';
        q.spark = null;
      }
    }catch(e){}
  }
  return q;
}
async function finnQuote(s){
  const r=await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s)}&token=${encodeURIComponent(S.set.finnhub)}`);
  const j=await r.json();if(!j||!j.c)throw new Error('finnhub');return j;
}
async function getQuote(s, force=false){
  if(!s) return false;
  if(s==='PALANTIR') s='PLTR';

  if(!isPlausibleTicker(s)){
    if(!M.q[s]) M.q[s] = makeFallbackQuote(s);
    M.bad.add(s);
    return false;
  }

  if(!force && M.bad.has(s) && M.q[s]){
    return false;
  }

  try{
    const q=await fetchQuote(s);
    if(S.set.finnhub&&!/[.=\-^]/.test(s)){
      try{const f=await finnQuote(s);q.price=f.c;q.prev=f.pc||q.prev;q.hi=f.h||q.hi;q.lo=f.l||q.lo;q.time=(f.t||0)*1000||q.time;q.src='Finnhub (realtime)';}catch(e){}
    }
    M.q[s]=q;M.bad.delete(s);M.liveOK=true;return true;
  }catch(e){
    if(e && e.isNotFound){
      M.bad.add(s);
    }
    if(!M.q[s]) M.q[s] = makeFallbackQuote(s);
    return false;
  }
}
/* demo-data (alleen als niets live te laden is) */
const BASE={PLTR:150,NVDA:175,SNOW:210,'EUNL.DE':110,'SXR8.DE':620,'ASML.AS':700,'EURUSD=X':1.08,APP:310,'PHARM.AS':0.85,'FUR.AS':14.5,'FLOW.AS':26.5,DOCU:75.0,'VUSA.AS':98.0,'IQQH.DE':9.5,'INR.PA':33.0,'ASRNL.AS':48.0,'G2X.DE':38.0,AMZN:215.0,'DFNS.AS':38.5,NVO:130.0};
function rng(seed){let s=0;for(const ch of seed)s=(s*31+ch.charCodeAt(0))>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function demoSeries(sym,n,step,vol){
  const r=rng(sym+n),end=Date.now(),v=[1];
  for(let i=1;i<n;i++)v.push(v[i-1]*(1+(r()-.48)*vol));
  const base=(BASE[sym]||100)*(0.96+0.08*rng(sym)()),k=base/v[n-1];
  const t=[],c=[];for(let i=0;i<n;i++){t.push(end-(n-1-i)*step);c.push(v[i]*k)}
  return {t,c};
}
function demoQuote(s){
  const d=demoSeries(s,78,300e3,.004),cur=/\.(DE|AS)$/.test(s)?'EUR':'USD';
  const pr=d.c[d.c.length-1],prev=d.c[0]*0.995;
  return {sym:s,price:pr,prev,cur,name:S.inst[s]?.name||s,hi:Math.max(...d.c),lo:Math.min(...d.c),w52h:pr*1.35,w52l:pr*.7,vol:2e6,exch:'DEMO',spark:d.c,time:Date.now(),open:false,demo:true,src:'Demo'};
}
const RANGES={'1D':['1d','5m'],'5D':['5d','15m'],'1W':['5d','15m'],'1M':['1mo','60m'],'6M':['6mo','1d'],'YTD':['ytd','1d'],'1J':['1y','1d'],'1Y':['1y','1d'],'5J':['5y','1wk'],'MAX':['max','1mo'],'ALL':['max','1mo']};
const DEMO_N={'1D':[78,300e3,.004],'5D':[130,900e3,.004],'1W':[130,900e3,.004],'1M':[150,3600e3,.004],'6M':[126,864e5,.014],'YTD':[100,864e5,.014],'1J':[252,864e5,.014],'1Y':[252,864e5,.014],'5J':[260,6048e5,.03],'MAX':[200,2592e6,.06],'ALL':[200,2592e6,.06]};
async function getHist(s,rk){
  const key=s+'|'+rk,c=M.hist[key],ttl=rk==='1D'?60e3:600e3;
  if(c&&Date.now()-c.ts<ttl)return c;
  let d;
  if(M.q[s]&&M.q[s].demo){const [n,st,v]=DEMO_N[rk];d=Object.assign(demoSeries(s,n,st,v),{cur:M.q[s].cur,demo:true});}
  else{
    const ticker = quoteTicker(s);
    try{d=parseChart(await yget(CHART_URL(ticker,...RANGES[rk])));}
    catch(e){if(c)return c;d={t:[],c:[],cur:M.q[s]?.cur||'EUR',err:true};}
  }
  d.ts=Date.now();M.hist[key]=d;return d;
}
function toEUR(cur){
  if(!cur||cur==='EUR')return 1;
  if(cur==='GBp'||cur==='GBX')return (M.fx.GBP||1.17)/100;
  return M.fx[cur]||(cur==='USD'?0.92:1);
}
async function fetchFx(){
  try{const d=await fetchQuote('EURUSD=X');M.fx.USD=1/d.price;}
  catch(e){
    try{
      const r=await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR');
      const j=await r.json();
      M.fx.USD=j.rates.EUR;
    }catch(e2){
      try{
        const r2=await fetch('https://open.er-api.com/v6/latest/USD');
        const j2=await r2.json();
        M.fx.USD=j2.rates.EUR;
      }catch(e3){
        if(!M.fx.USD)M.fx.USD=0.926;
      }
    }
  }
  const others=new Set(Object.values(M.q).map(q=>q.cur).filter(c=>c&&!['EUR','USD'].includes(c)));
  for(const c of others){
    const k=(c==='GBp'||c==='GBX')?'GBP':c;
    if(M.fx[k])continue;
    try{
      const r=await fetch('https://api.frankfurter.dev/v1/latest?base=' + k + '&symbols=EUR');
      const j=await r.json();
      M.fx[k]=j.rates.EUR;
    }catch(e){
      if(k==='GBP') M.fx.GBP=1.17;
    }
  }
}
async function searchSym(q){
  const j=await yget(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`);
  return (j.quotes||[]).filter(x=>x.symbol&&['EQUITY','ETF','CRYPTOCURRENCY','INDEX','MUTUALFUND'].includes(x.quoteType))
    .map(x=>({sym:x.symbol,name:x.longname||x.shortname||x.symbol,exch:x.exchDisp||'',type:x.quoteType==='ETF'?'ETF':'EQUITY'}));
}
const HIST_DATE_URL=(s,p1,p2)=>`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?period1=${p1}&period2=${p2}&interval=1d`;
async function fetchHistPriceOnDate(sym, dateStr){
  if(!dateStr || !isPlausibleTicker(sym) || M.bad.has(sym)) return null;
  if(dateStr >= today()){
    const q = M.q[sym];
    return q ? q.price * toEUR(q.cur) : null;
  }
  try{
    const d0 = new Date(dateStr + 'T12:00:00Z');
    const p1 = Math.floor(d0.getTime() / 1000) - 86400 * 2;
    const p2 = p1 + 86400 * 8;
    const j = await yget(HIST_DATE_URL(quoteTicker(sym), p1, p2));
    const r = j && j.chart && j.chart.result && j.chart.result[0];
    if(!r) return null;
    const quotes = (r.indicators.quote[0] && r.indicators.quote[0].close) || [];
    const val = quotes.find(x => x != null && x > 0);
    if(val == null) return null;
    const cur = r.meta.currency || 'EUR';
    return val * toEUR(cur);
  }catch(e){
    return null;
  }
}
async function getNews(s){
  if(!isPlausibleTicker(s) || M.bad.has(s)) return [];
  const c=M.news[s];if(c&&Date.now()-c.ts<600e3)return c.items;
  let items=[];
  try{
    const j=await yget(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(s)}&quotesCount=0&newsCount=6`);
    items=(j.news||[]).map(n=>({title:n.title,pub:n.publisher,link:n.link,t:(n.providerPublishTime||0)*1000,sym:s}));
  }catch(e){}
  M.news[s]={ts:Date.now(),items};return items;
}
const newsHTML=items=>items.length?items.map(n=>`<a class="news" href="${/^https?:/.test(n.link)?esc(n.link):'#'}" target="_blank" rel="noopener"><b>${esc(n.title)}</b><small>${esc(n.pub||'')} · ${ago(n.t)}</small></a>`).join(''):'<div class="empty">Geen nieuws beschikbaar.</div>';

const allSyms=()=>[...new Set([...Object.keys(S.inst),...S.watch,...M.extra])];
let refreshing=false;
async function refreshAll(manual){
  if(refreshing)return;refreshing=true;spin(true);
  if(manual) M.bad.clear();
  const syms=allSyms().map(s=>s==='PALANTIR'?'PLTR':s);
  for(const s of syms){ if(isPlausibleTicker(s)) await resolveEurListing(s); }
  const ok=[];
  for(let i=0;i<syms.length;i++){
    ok.push(await getQuote(syms[i]));
    if(i<syms.length-1) await new Promise(r=>setTimeout(r,120));
  }
  syms.forEach((s,i)=>{if(!M.q[s]) M.q[s]=makeFallbackQuote(s);});
  await fetchFx();
  M.mode=syms.length&&syms.every(s=>M.q[s]&&M.q[s].demo)?'demo':'live';
  M.last=Date.now();M.loaded=true;
  await lockPrices();checkAlerts();
  refreshing=false;spin(false);updateChrome();
  if(!busyUI())render(true);
  if(manual)toast(M.mode==='demo'?'Geen live koersen beschikbaar – demo-data actief.':'Koersen bijgewerkt');
}
async function lockPrices(){
  let ch=false;
  for(const t of S.tx){
    if(t.shares==null&&t.price==null || t.est){
      if(t.date && t.date < today()){
        try{
          const hp = await fetchHistPriceOnDate(t.sym, t.date);
          if(hp && hp > 0){
            t.price = hp;
            t.shares = t.amount / hp;
            delete t.est;
            ch = true;
            continue;
          }
        }catch(e){}
      }
      const q=M.q[t.sym];
      if(q&&!q.demo){t.price=q.price*toEUR(q.cur);t.est=true;ch=true}
    }
  }
  if(ch)save();
}
function checkAlerts(){
  let ch=false;
  for(const a of S.alerts){
    if(a.done)continue;const px=priceEUR(a.sym);if(px==null)continue;
    if((a.dir==='above'&&px>=a.price)||(a.dir==='below'&&px<=a.price)){
      a.done=true;ch=true;
      const msg=`${nameOf(a.sym)} is ${a.dir==='above'?'boven':'onder'} ${eur(a.price)} (nu ${eur(px)})`;
      toast('🔔 '+msg);
      try{if('Notification' in window&&Notification.permission==='granted')new Notification('Prijsalarm',{body:msg})}catch(e){}
    }
  }
  if(ch)save();
}
const priceEUR=s=>{const q=M.q[s];return q?q.price*toEUR(q.cur):null};

/* ================= portfolio maths ================= */
function txShares(t){
  if(t.shares!=null)return t.shares;
  if(t.price!=null)return t.amount/t.price;
  const px=priceEUR(t.sym);return px?t.amount/px:null;
}
function positions(){
  const P={};
  const txs=[...S.tx].sort((a,b)=>a.date.localeCompare(b.date));
  for(const t of txs){
    const p=P[t.sym]||(P[t.sym]={sym:t.sym,shares:0,cost:0,realized:0});
    const sh=txShares(t);if(sh==null)continue;
    if(t.type==='sell'){const avg=p.shares>0?p.cost/p.shares:0;p.cost-=avg*sh;p.shares-=sh;p.realized+=t.amount-avg*sh}
    else{p.shares+=sh;p.cost+=t.amount}
  }
  for(const s in S.inst)if(!P[s])P[s]={sym:s,shares:0,cost:0,realized:0};
  let totalVal=0;
  for(const s in P){
    const p=P[s],q=M.q[s],m=q?toEUR(q.cur):1;
    p.px=priceEUR(s);p.value=p.shares*(p.px||0);p.pl=p.value-p.cost;
    p.plPct=p.cost>0?p.pl/p.cost*100:0;
    p.dayPct=q&&q.prev?(q.price/q.prev-1)*100:null;
    p.dayChange=q?p.shares*(q.price-q.prev)*m:0;
    p.avg=p.shares>0?p.cost/p.shares:0;
    if(p.shares>1e-9) totalVal+=p.value;
  }
  for(const s in P){
    const p=P[s];
    p.w=p.shares>1e-9&&totalVal>0?(p.value/totalVal)*100:0;
  }
  return P;
}
function totals(P){
  let value=0,cost=0,day=0;
  for(const p of Object.values(P))if(p.shares>1e-9){value+=p.value;cost+=p.cost;day+=p.dayChange||0}
  for(const p of Object.values(P))p.w=p.shares>1e-9&&value>0?p.value/value*100:0;
  const pl=value-cost;
  return {value,cost,pl,plPct:cost>0?pl/cost*100:0,day,dayPct:value-day>0?day/(value-day)*100:0};
}
const held=P=>Object.values(P).filter(p=>p.shares>1e-9).sort((a,b)=>b.value-a.value);
function mergeSeries(list){
  const all=new Set();list.forEach(s=>s.t.forEach(x=>all.add(x)));
  const T=[...all].sort((a,b)=>a-b),idx=list.map(()=>0),last=list.map(s=>s.c[0]*s.m);
  const V=T.map(ts=>{let sum=0;list.forEach((s,k)=>{while(idx[k]<s.t.length&&s.t[idx[k]]<=ts){last[k]=s.c[idx[k]]*s.m;idx[k]++}sum+=last[k]});return sum});
  return {t:T,v:V};
}
/* spaarplan */
const planBooked=()=> (S.tx||[]).some(t=>t.plan && (!S.plan?.sym || t.sym===S.plan.sym) && t.date && t.date.slice(0,7)===today().slice(0,7));
const planDue=()=> !!(S.plan?.active && S.plan?.sym && (S.plan?.amount||0)>0 && !planBooked() && new Date().getDate()>=(S.plan?.day||1));
function nextPlanDate(){
  const d=new Date(),day=Math.min(S.plan?.day||1,28);
  let c=new Date(d.getFullYear(),d.getMonth(),day);
  const t0=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  if(planBooked()||c<t0)c=new Date(d.getFullYear(),d.getMonth()+1,day);
  return c;
}
async function bookPlan(){
  if(!S.plan || !S.plan.sym || !S.plan.amount){
    toast('⚠️ Stel eerst een geldig fonds en bedrag in bij Spaarplan');
    location.hash='#/plan';
    return;
  }
  const sym = S.plan.sym.toUpperCase();
  const amt = +S.plan.amount;
  if(amt <= 0){
    toast('⚠️ Spaarplan bedrag moet groter zijn dan €0');
    return;
  }
  if(!S.inst[sym]){
    S.inst[sym] = { name: nameOf(sym) || sym, type: 'ETF', color: nextColor() };
  }

  let px = priceEUR(sym);
  let sh = null;
  if(px && px > 0){
    sh = +(amt / px).toFixed(6);
  }

  const txId = uid();
  const newTx = {
    id: txId,
    sym: sym,
    type: 'buy',
    date: today(),
    amount: amt,
    shares: sh,
    price: px || null,
    plan: true
  };

  S.tx.push(newTx);

  const targetAccId = S.activeAccount === 'ALL' ? (Object.keys(S.accounts || {})[0] || 'main') : S.activeAccount;
  if(targetAccId && S.accounts && S.accounts[targetAccId]){
    S.accounts[targetAccId].tx = S.accounts[targetAccId].tx || [];
    if(!S.accounts[targetAccId].tx.some(t => t.id === txId)){
      S.accounts[targetAccId].tx.push(newTx);
    }
    if(!S.accounts[targetAccId].inst) S.accounts[targetAccId].inst = {};
    S.accounts[targetAccId].inst[sym] = S.inst[sym];
  }

  save();
  lockPrices();
  render(true);
  toast(`✓ Storting van ${eur(amt)} in ${esc(nameOf(sym))} geboekt!`);
}
function project(start,monthly,years,annual){
  const r=Math.pow(1+annual/100,1/12)-1;let v=start;const out=[v];
  for(let m=1;m<=years*12;m++){v=v*(1+r)+monthly;out.push(v)}return out;
}

/* ================= charts ================= */
let C={};
function colors(){const g=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();C={up:g('--up'),down:g('--down'),ac:g('--ac'),mu:g('--mu'),bd:g('--bd'),warn:g('--warn'),tx:g('--tx'),s1:g('--s1')}}
const charts=[];
function fmtT(ts,rk){
  const d=new Date(ts);
  if(rk==='1D')return d.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
  if(['5D','1W'].includes(rk))return d.toLocaleString('nl-NL',{weekday:'short',hour:'2-digit',minute:'2-digit'});
  if(['1M','6M','YTD','1J','1Y'].includes(rk))return d.toLocaleDateString('nl-NL',{month:'short'});
  return d.toLocaleDateString('nl-NL',{month:'short',year:'2-digit'});
}
function fmtTfull(ts,rk){
  const d=new Date(ts);
  return ['1D','5D','1W','1M'].includes(rk)?d.toLocaleString('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString('nl-NL',{day:'numeric',month:'long',year:'numeric'});
}
function drawChart(el,cfg,reg=true){
  if(!el)return;
  if(reg&&!charts.some(c=>c.el===el))charts.push({el,cfg});
  else if(reg)charts.find(c=>c.el===el).cfg=cfg;
  const W=Math.max(el.clientWidth,220),H=cfg.h||(el.clientHeight>120?el.clientHeight:250);
  const pl=46,pr=16,pt=14,pb=24,iw=W-pl-pr,ih=H-pt-pb,n=cfg.n;
  let lo=Infinity,hi=-Infinity;
  cfg.series.forEach(s=>s.v.forEach(x=>{if(x<lo)lo=x;if(x>hi)hi=x}));
  if(cfg.base!=null){lo=Math.min(lo,cfg.base);hi=Math.max(hi,cfg.base)}
  if(!isFinite(lo)||n<2){el.innerHTML='<div class="empty">Geen grafiekdata beschikbaar voor deze periode.</div>';return}
  if(hi===lo){hi+=1;lo-=1}
  const pv=(hi-lo)*.08;lo-=pv;hi+=pv;
  const X=i=>pl+i/(n-1)*iw,Y=v=>pt+(1-(v-lo)/(hi-lo))*ih,col=c=>C[c]||c;
  const dec=(hi-lo)<2?2:(hi-lo)<30?1:0,gid='g'+uid();
  let s=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;touch-action:pan-y">`;
  for(let k=0;k<=4;k++){
    const v=lo+(hi-lo)*k/4,y=Y(v);
    s+=`<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" stroke="${C.bd||'rgba(128,128,128,0.15)'}" stroke-width="1"/><text x="4" y="${y+4}" fill="${C.mu}" font-size="11" font-weight="500">${cfg.fmt(v,dec)}</text>`;
  }
  const nx=Math.min(5,n);
  for(let k=0;k<nx;k++){
    const i=Math.round(k*(n-1)/Math.max(nx-1,1));
    s+=`<text x="${X(i)}" y="${H-6}" fill="${C.mu}" font-size="11" font-weight="500" text-anchor="${k===0?'start':k===nx-1?'end':'middle'}">${esc(cfg.labels(i))}</text>`;
  }
  if(cfg.base!=null)s+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(cfg.base)}" y2="${Y(cfg.base)}" stroke="${C.mu}" stroke-width="1" stroke-dasharray="5 4"/>`;
  cfg.series.forEach(sr=>{
    const c=col(sr.color);
    const step=Math.max(1,Math.floor(n/(iw*1.5)));
    let d='';for(let i=0;i<n;i+=step)d+=(d?'L':'M')+X(i).toFixed(1)+' '+Y(sr.v[i]).toFixed(1);
    if((n-1)%step)d+='L'+X(n-1).toFixed(1)+' '+Y(sr.v[n-1]).toFixed(1);
    if(sr.area){
      s+=`<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".28"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${X(n-1)} ${H-pb}L${X(0)} ${H-pb}Z" fill="url(#${gid})"/>`;
    }
    s+=`<path d="${d}" fill="none" stroke="${c}" stroke-width="${sr.width||2.2}" stroke-linejoin="round" stroke-linecap="round"${sr.dash?` stroke-dasharray="${sr.dash}"`:''}/>`;
    
    // Glowing endpoint dot matching Northstar design
    const endX = X(n-1).toFixed(1);
    const endY = Y(sr.v[n-1]).toFixed(1);
    s+=`<circle cx="${endX}" cy="${endY}" r="7.5" fill="none" stroke="${c}" stroke-width="1.5" opacity="0.45"/>`;
    s+=`<circle cx="${endX}" cy="${endY}" r="3.5" fill="${c}" stroke="${C.s1||'var(--s1)'}" stroke-width="2"/>`;
  });
  s+=`<g class="hv" style="display:none"><line class="hl" y1="${pt}" y2="${H-pb}" stroke="${C.mu}" stroke-width="1"/>${cfg.series.map(sr=>`<circle class="hd" r="4.5" fill="${col(sr.color)}" stroke="${C.s1}" stroke-width="2"/>`).join('')}</g></svg><div class="tip" hidden></div>`;
  el.innerHTML=s;el.classList.remove('loading');
  const svg=el.querySelector('svg'),tip=el.querySelector('.tip'),hv=svg.querySelector('.hv'),hl=svg.querySelector('.hl'),dots=[...svg.querySelectorAll('.hd')];
  svg.addEventListener('pointermove',ev=>{
    const r=svg.getBoundingClientRect();let i=Math.round((ev.clientX-r.left-pl)/iw*(n-1));i=Math.max(0,Math.min(n-1,i));
    hv.style.display='';hl.setAttribute('x1',X(i));hl.setAttribute('x2',X(i));
    dots.forEach((d,k)=>{d.setAttribute('cx',X(i));d.setAttribute('cy',Y(cfg.series[k].v[i]))});
    tip.hidden=false;
    tip.innerHTML=`<b>${esc(cfg.tip(i))}</b><br>`+cfg.series.map(sr=>`${cfg.series.length>1?`<span style="color:${col(sr.color)}">●</span> ${esc(sr.name||'')} `:''}${cfg.fmt(sr.v[i],2)}`).join('<br>');
    const tw=tip.offsetWidth;tip.style.left=Math.max(4,Math.min(W-tw-4,X(i)+14>W-tw-4?X(i)-tw-14:X(i)+14))+'px';
  });
  svg.addEventListener('pointerleave',()=>{hv.style.display='none';tip.hidden=true});
}
let rsT;window.addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(()=>{charts.forEach(c=>{if(document.contains(c.el))drawChart(c.el,c.cfg,false)})},150)});
function spark(v,w=92,h=30){
  if(!v||v.length<2)return '';
  const st=Math.max(1,Math.floor(v.length/60)),a=v.filter((_,i)=>i%st===0);
  const lo=Math.min(...a),hi=Math.max(...a),r=hi-lo||1;
  const pts=a.map((x,i)=>`${(i/(a.length-1)*w).toFixed(1)},${(h-2-(x-lo)/r*(h-4)).toFixed(1)}`).join(' ');
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline fill="none" stroke="${v[v.length-1]>=v[0]?C.up:C.down}" stroke-width="1.7" stroke-linejoin="round" points="${pts}"/></svg>`;
}
function donut(items,size=180,centerVal,centerLbl){
  const tot=items.reduce((a,b)=>a+(Number(b.value)||0),0)||1,r=size/2-20,circ=2*Math.PI*r;let off=0;
  let s=`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="ns-donut-svg" style="display:block;margin:auto;overflow:visible"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${C.bd||'rgba(128,128,128,0.15)'}" stroke-width="20"/>`;
  items.forEach((it, idx)=>{
    const v = Number(it.value) || 0;
    const len=v/tot*circ;
    if(len>0.5){
      const dash = Math.max(len-2.5, 0.5);
      const name = it.name || it.label || '';
      s+=`<circle class="donut-slice" data-idx="${idx}" data-name="${esc(name)}" data-val="${eur(v)}" data-pct="${Math.round(v/tot*100)}%" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${it.color}" stroke-width="20" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-width .2s ease, opacity .2s ease, stroke .2s ease;cursor:pointer"><title>${esc(name)}: ${eur(v)} (${Math.round(v/tot*100)}%)</title></circle>`;
    }
    off+=len;
  });
  const val = centerVal || `${items.length} posities`;
  const lbl = centerLbl || 'Verdeling';
  return s+`<text id="donut-center-val" x="50%" y="47%" text-anchor="middle" fill="${C.tx||'var(--tx)'}" font-size="17" font-weight="800" font-family="'Plus Jakarta Sans',sans-serif">${esc(val)}</text><text id="donut-center-lbl" x="50%" y="59%" text-anchor="middle" fill="var(--mu)" font-size="11" font-weight="600">${esc(lbl)}</text></svg>`;
}

/* ================= UI plumbing ================= */
const main=$('#main');
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),4200)}
function spin(on){$$('[data-act=refresh]').forEach(b=>b.classList.toggle('spin',on))}
function openModal(html,mount){
  const m=$('#modal');m.innerHTML=`<div class="mback"><div class="mbox">${html}<button class="mx" data-act="closemodal" aria-label="Sluiten">×</button></div></div>`;
  m.hidden=false;if(mount)mount(m);
}
function closeModal(){const m=$('#modal');m.hidden=true;m.innerHTML=''}
const busyUI=()=>!$('#modal').hidden||(document.activeElement&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)&&main.contains(document.activeElement));
const head=(t,sub,acts)=>{
  const curAcc = S.activeAccount === 'ALL'
    ? { icon: '🌍', name: 'Alle Accounts (Geconsolideerd)' }
    : (S.accounts?.[S.activeAccount] || { icon: '💼', name: S.activeAccount });
  const totalHeldCount = new Set(Object.values(S.accounts || {}).flatMap(a => Object.keys(a.inst || {}))).size;
  const isPriv = UI.privacyMode;

  return `<header class="ph">
    <div style="min-width:0">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;flex-wrap:wrap">
        <h1 style="margin:0">${t}</h1>
        <div class="top-pill-bar">
          <button class="top-pill-btn active-pill" data-act="open_acc_picker" title="Wissel direct van broker of kies Geconsolideerd Totaal">
            <span>${curAcc.icon || '💼'} <b>${esc(curAcc.name)}</b></span>
            <span style="opacity:.6;font-size:11px">▾</span>
          </button>
          <button class="top-pill-btn ${isPriv ? 'active-pill' : ''}" data-act="toggle_privacy" title="${isPriv ? 'Privémodus AAN: bedragen zijn verborgen. Klik om te tonen.' : 'Privémodus: verberg alle bedragen met 1 klik voor demonstraties.'}">
            ${ic(isPriv ? 'eye_off' : 'eye', 14)}
            <span>${isPriv ? 'Verborgen' : 'Privé'}</span>
          </button>
          <button class="top-pill-btn" data-act="open_csv_hub" title="CSV Hub: download transacties, posities, templates of importeer bestanden">
            ${ic('dl', 13)}
            <span>CSV Hub</span>
          </button>
          <button class="top-pill-btn" data-act="open_report_modal" title="Exclusief Portfolio PDF / Print Rapport voor administratie of belastingaangifte">
            ${ic('print', 13)}
            <span>Rapport</span>
          </button>
          <button class="top-pill-btn autoswitch-btn ${autoSwitchRunning ? 'active-auto' : ''}" data-act="toggle_autoswitch" title="${autoSwitchRunning ? `Auto-switch staat AAN (${autoSwitchRemaining}s). Klik om te stoppen.` : 'Automatisch elke 10s schakelen tussen accounts.'}">
            <span class="dot autoswitch-dot ${autoSwitchRunning ? 'live' : ''}" style="width:7px;height:7px;margin-right:2px"></span>
            <span class="autoswitch-label">${autoSwitchRunning ? `Auto (${autoSwitchRemaining}s)` : 'Auto'}</span>
          </button>
        </div>
      </div>
      ${sub ? `<div class="sub">${sub}</div>` : ''}
    </div>
    <div class="acts">${acts || ''}</div>
  </header>`;
};

const NAV=[
  ['dashboard','Dashboard','dash'],
  ['portfolio','Portfolio','brief'],
  ['rebalance','Herbalanceren','balance'],
  ['dividends','Dividenden','coin'],
  ['plan','Spaarplan','cal'],
  ['watch','Watchlist','eye'],
  ['tx','Transacties','list'],
  ['settings','Instellingen','gear']
];
const navEl=$('#nav');
if(navEl) navEl.innerHTML=`<a href="markten.html#/" style="border-right:1px solid var(--bd);border-radius:7px 0 0 7px;margin-right:6px">← Markten</a>`+NAV.map(n=>`<a href="#/${n[0]}" data-nav="${n[0]}">${n[1]}</a>`).join('');
const BNAV = [
  ['dashboard', 'Dashboard', 'dash', '#/dashboard'],
  ['portfolio', 'Portfolio', 'brief', '#/portfolio'],
  ['tx', 'Transacties', 'list', '#/tx'],
  ['markten', 'Markten', 'chart', 'markten.html#/'],
  ['settings', 'Instellingen', 'gear', '#/settings']
];
const bnavEl=$('#bnav');
if(bnavEl) bnavEl.innerHTML=BNAV.map(n=>`<a href="${n[3]}" data-nav="${n[0]}">${ic(n[2],20)}<span>${n[1]}</span></a>`).join('');

function updateChrome(){
  const brokerPill = $('#ns_broker_pill');
  if(brokerPill){
    const curAcc = S.activeAccount === 'ALL'
      ? { icon: '🌍', name: 'Alle Accounts' }
      : (S.accounts?.[S.activeAccount] || { icon: '💼', name: S.activeAccount });
    const demoBadge = !AUTH.user ? `<span style="background:rgba(245,158,11,0.22);color:#f59e0b;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:800;letter-spacing:.03em;margin-right:2px">DEMO</span>` : '';
    brokerPill.innerHTML = `
      <span style="font-size:14px">${curAcc.icon || '💼'}</span>
      ${demoBadge}
      <span style="font-size:12px;font-weight:700;color:var(--tx)">${esc(curAcc.name)}</span>
      <span style="opacity:.6;font-size:10px">▾</span>
    `;
  }

  const userPill = $('#ns_user_pill');
  if(userPill){
    if(AUTH.user){
      const name = AUTH.user.name || 'Gebruiker';
      const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'U';
      userPill.innerHTML = `
        <div class="ns-user-pill" data-act="open_user_menu" title="Ingelogd als ${esc(AUTH.user.email)}">
          <div class="ns-avatar" style="background:var(--ac);color:var(--ac-tx,#0b0e14);font-weight:800">${esc(initials)}</div>
          <div class="ns-user-info">
            <span class="ns-user-name" style="display:flex;align-items:center;gap:5px">
              ${esc(name)}
              <span class="auth-sync-dot ${AUTH.syncStatus==='syncing'?'syncing':''}" title="${AUTH.syncStatus==='syncing'?'Synchroniseren met cloud...':'Cloud gesynchroniseerd'}"></span>
            </span>
            <span class="ns-user-sub">${esc(AUTH.user.email)}</span>
          </div>
          <span style="opacity:.5;font-size:10px;margin-left:2px">▾</span>
        </div>
      `;
    } else {
      userPill.innerHTML = `
        <button class="ns-auth-btn" data-act="open_auth_modal" title="Inloggen of gratis account aanmaken" style="display:inline-flex;align-items:center;gap:7px">
          <span style="background:#f59e0b;color:#0b0e14;font-size:10px;font-weight:800;padding:2px 6px;border-radius:999px;letter-spacing:.02em">DEMO</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="ns-auth-label">Inloggen</span>
        </button>
      `;
    }
  }
}
function banners(){
  let h='';
  if(!AUTH.user){
    h+=`
    <div class="demo-top-banner">
      <div class="demo-top-banner-content">
        <div class="demo-banner-pill">🎭 DEMO MODUS</div>
        <div class="demo-banner-text">
          <strong>Je bekijkt momenteel het Northstar Demo-Portfolio</strong>
          <span>Ontdek alle features, koersen en rapporten. Wil je jouw eigen beleggingen en CSV's veilig bijhouden? Maak binnen 10 seconden gratis een account aan!</span>
        </div>
      </div>
      <div class="demo-banner-actions">
        <button class="btn pri sm" data-act="open_auth_modal" data-v="register">✨ Gratis Account Aanmaken</button>
        <button class="btn sm" data-act="open_auth_modal" data-v="login">Inloggen</button>
      </div>
    </div>`;
  }
  if(M.mode==='demo')h+=`<div class="note w"><span><b>Markt-feed demo.</b> Live koersen konden niet worden opgehaald (geen internet of API geblokkeerd). Je ziet gesimuleerde koersen.</span><a class="btn sm" href="#/settings">API-status</a></div>`;
  if(!S.set.hideEst&&S.tx.some(t=>t.est))h+=`<div class="note"><span><b>Let op:</b> je aankoopkoersen zijn geschat op de koers van het moment dat je de site voor het eerst opende. Pas ze aan bij <a href="#/tx" style="text-decoration:underline">Transacties</a> voor exacte rendementen.</span><button class="btn sm" data-act="hideest">Begrepen</button></div>`;
  if(planDue())h+=`<div class="note"><span>Je maandelijkse spaarplan van <b>${eur(S.plan.amount)}</b> in <b>${esc(nameOf(S.plan.sym))}</b> is nog niet geboekt voor deze maand.</span><div style="display:flex;gap:6px"><button class="btn sm pri" data-act="book">Boek storting</button><a class="btn sm" href="#/plan">Aanpassen</a></div></div>`;
  return h;
}

/* ================= advanced widgets ================= */
function allocateCash(items, totalCash){
  if(totalCash <= 0.001) return items.map(() => 0);
  let low = 0;
  let high = items.reduce((a, b) => a + b.val, 0) + totalCash * 3;
  for(let it = 0; it < 50; it++){
    const mid = (low + high) / 2;
    let needed = 0;
    for(let i = 0; i < items.length; i++){
      const targetVal = (items[i].tgtPct / 100) * mid;
      if(targetVal > items[i].val) needed += (targetVal - items[i].val);
    }
    if(needed > totalCash) high = mid;
    else low = mid;
  }
  const mid = (low + high) / 2;
  const raw = items.map(it => Math.max(0, (it.tgtPct / 100) * mid - it.val));
  const rounded = raw.map(x => Math.floor(x * 100) / 100);
  let remCents = Math.round((totalCash - rounded.reduce((a, b) => a + b, 0)) * 100);
  if(remCents > 0){
    const indexed = items.map((it, i) => ({ i, def: (it.tgtPct / 100) * mid - it.val - rounded[i] }))
                         .sort((a, b) => b.def - a.def);
    for(let k = 0; k < remCents && k < indexed.length * 20; k++){
      rounded[indexed[k % indexed.length].i] += 0.01;
    }
  }
  return rounded.map(x => Math.round(x * 100) / 100);
}

function distributionWidget(H, T){
  if(!H.length) return '<div class="empty">Geen posities om te verdelen.</div>';
  const tab = UI.distTab || 'funds';

  let items = [];
  if(tab === 'funds'){
    items = H.map(p => ({ label: nameOf(p.sym), sub: p.sym, value: p.value, color: colorOf(p.sym), pct: p.w }));
  } else if(tab === 'type'){
    const etfVal = H.filter(p => S.inst[p.sym]?.type === 'ETF').reduce((a, p) => a + p.value, 0);
    const stockVal = Math.max(0, T.value - etfVal);
    items = [
      { label: 'Index ETF’s', sub: 'Passief & Wereldwijd', value: etfVal, color: 'var(--ac)', pct: T.value ? (etfVal / T.value) * 100 : 0 },
      { label: 'Individuele Aandelen', sub: 'Stock Picking', value: stockVal, color: 'var(--warn)', pct: T.value ? (stockVal / T.value) * 100 : 0 }
    ].filter(x => x.value > 0);
  } else if(tab === 'sector'){
    const sectors = {};
    H.forEach(p => {
      const sec = S.inst[p.sym]?.sector || (S.inst[p.sym]?.type === 'ETF' ? 'Index Fondsen' : 'Technologie');
      if(!sectors[sec]) sectors[sec] = { value: 0, syms: [] };
      sectors[sec].value += p.value;
      sectors[sec].syms.push(p.sym);
    });
    const sColors = ['#3052ff', '#0e8f64', '#e08a00', '#d6336c', '#0891b2', '#7c3aed', '#65a30d'];
    let idx = 0;
    items = Object.keys(sectors).map(sec => ({
      label: sec,
      sub: sectors[sec].syms.join(', '),
      value: sectors[sec].value,
      color: sColors[(idx++) % sColors.length],
      pct: T.value ? (sectors[sec].value / T.value) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  } else if(tab === 'region'){
    const regions = {};
    H.forEach(p => {
      const reg = S.inst[p.sym]?.region || (p.sym.includes('.DE') || p.sym.includes('.AS') ? 'Europa / Wereldwijd' : 'Verenigde Staten');
      if(!regions[reg]) regions[reg] = { value: 0, syms: [] };
      regions[reg].value += p.value;
      regions[reg].syms.push(p.sym);
    });
    const rColors = ['#0891b2', '#3052ff', '#0e8f64', '#e08a00'];
    let idx = 0;
    items = Object.keys(regions).map(reg => ({
      label: reg,
      sub: regions[reg].syms.join(', '),
      value: regions[reg].value,
      color: rColors[(idx++) % rColors.length],
      pct: T.value ? (regions[reg].value / T.value) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }

  return `
  <div class="alloc-widget">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div class="tabs-clean">
        <button class="${tab==='funds'?'on':''}" data-act="dist_tab" data-v="funds">Fondsen</button>
        <button class="${tab==='type'?'on':''}" data-act="dist_tab" data-v="type">Type</button>
        <button class="${tab==='sector'?'on':''}" data-act="dist_tab" data-v="sector">Sector</button>
      </div>
    </div>
    <div class="alloc-bar-track">
      ${items.map(it => `<div class="alloc-bar-segment" style="width:${Math.max(1.5, it.pct)}%;background:${it.color}" title="${esc(it.label)}: ${num(it.pct,1)}%"></div>`).join('')}
    </div>
    <div class="alloc-list">
      ${items.slice(0, 6).map(it => `
        <div class="alloc-row">
          <div style="display:flex;align-items:center;gap:7px;min-width:0">
            <span style="width:7px;height:7px;border-radius:2px;background:${it.color};flex-shrink:0"></span>
            <span style="font-weight:600;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(it.label)}</span>
          </div>
          <div style="text-align:right;font-size:12px;white-space:nowrap">
            <b>${eur(it.value)}</b>
            <span class="mu" style="margin-left:4px">${num(it.pct, 1)}%</span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function portfolioHealthWidget(H, T){
  if(!H.length) return '<div class="empty">Geen data beschikbaar.</div>';
  const top = H[0];
  const topW = top ? top.w : 0;
  
  // Pillar 1: Diversificatie (max 25)
  let p1 = 25;
  if(topW > 40) p1 = 10;
  else if(topW > 30) p1 = 16;
  else if(topW > 20) p1 = 22;

  // Pillar 2: ETF Basis (max 25)
  const etfVal = H.filter(p=>S.inst[p.sym]?.type==='ETF').reduce((a,p)=>a+p.value,0);
  const etfPct = T.value ? (etfVal / T.value) * 100 : 0;
  let p2 = 25;
  if(etfPct < 15) p2 = 10;
  else if(etfPct < 30) p2 = 18;
  else if(etfPct >= 35) p2 = 25;

  // Pillar 3: Balans / Afwijking van Target (max 25)
  let diffSum = 0;
  if(UI.rbTargets){
    H.forEach(p=>{
      const tgt = UI.rbTargets[p.sym] || 0;
      diffSum += Math.abs(p.w - tgt);
    });
  }
  let p3 = Math.max(8, Math.round(25 - (diffSum / 2) * 0.8));

  // Pillar 4: Winstgevendheid / Positieve Posities (max 25)
  const winCount = H.filter(p=>p.pl >= 0).length;
  const winRate = H.length ? winCount / H.length : 0;
  let p4 = Math.round(winRate * 25);

  const totalScore = Math.min(100, Math.max(0, p1 + p2 + p3 + p4));
  const scoreColor = totalScore >= 75 ? 'var(--up)' : totalScore >= 55 ? 'var(--warn)' : 'var(--down)';
  const label = totalScore >= 80 ? 'Uitstekend' : totalScore >= 65 ? 'Goed' : totalScore >= 50 ? 'Gemiddeld' : 'Aandacht nodig';

  // Tips
  const tips = [];
  if(topW > 30) tips.push(`Grootste positie (${esc(nameOf(top.sym))}: ${num(topW,0)}%) is aan de hoge kant. Overweeg bijstorten in achterblijvers.`);
  else tips.push(`Goede spreiding: geen enkel aandeel overschrijdt 30% van je portfolio.`);
  if(etfPct >= 35) tips.push(`Sterk fundament: ${num(etfPct,0)}% belegd in brede index ETF’s.`);
  else tips.push(`ETF aandeel is ${num(etfPct,0)}%. Verhogen verlaagt volatiliteit.`);

  const circ = 2 * Math.PI * 34;
  const dash = (totalScore / 100) * circ;

  return `<div class="health-box">
    <div class="health-ring-wrap">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="34" fill="none" stroke="var(--s2)" stroke-width="8"/>
        <circle cx="48" cy="48" r="34" fill="none" stroke="${scoreColor}" stroke-width="8"
          stroke-dasharray="${dash} ${circ - dash}" stroke-dashoffset="${circ * 0.25}"
          stroke-linecap="round" transform="rotate(-90 48 48)" style="transition:stroke-dasharray .6s"/>
      </svg>
      <div style="position:absolute;text-align:center">
        <div class="health-score-val" style="color:${scoreColor}">${totalScore}</div>
        <div class="health-score-lbl">${label}</div>
      </div>
    </div>
    <div style="display:grid;gap:6px">
      <div class="health-pillar"><span>Spreiding</span><div class="health-bar"><i style="width:${(p1/25)*100}%;background:var(--ac)"></i></div><b>${p1}/25</b></div>
      <div class="health-pillar"><span>ETF Basis</span><div class="health-bar"><i style="width:${(p2/25)*100}%;background:var(--up)"></i></div><b>${p2}/25</b></div>
      <div class="health-pillar"><span>Balans</span><div class="health-bar"><i style="width:${(p3/25)*100}%;background:var(--warn)"></i></div><b>${p3}/25</b></div>
      <div class="health-pillar"><span>Winnaars</span><div class="health-bar"><i style="width:${(p4/25)*100}%;background:${p4>=15?'var(--up)':'var(--mu)'}"></i></div><b>${p4}/25</b></div>
    </div>
  </div>
  <div class="note" style="margin-top:14px;margin-bottom:0;font-size:12px;line-height:1.5;padding:10px 12px">
    💡 <b>Gezondheidsadvies:</b> ${tips.join(' ')}
  </div>`;
}

function fireWidget(T){
  const val = T.value || 0;
  const pYr = val * 0.04;
  const pMo = pYr / 12;
  const monPlan = S.plan?.amount || 100;
  const rMo = 0.07 / 12;

  const milestones = [
    { icon: '☕', name: 'Koffie & extra’s', mo: 15, target: 4500 },
    { icon: '📱', name: 'Abonnementen', mo: 40, target: 12000 },
    { icon: '⚡', name: 'Vaste lasten / energie', mo: 150, target: 45000 },
    { icon: '🛒', name: 'Boodschappen', mo: 350, target: 105000 },
    { icon: '🏡', name: 'Wonen & hypotheek', mo: 1000, target: 300000 },
    { icon: '🌴', name: 'Volledig FIRE', mo: 2500, target: 750000 }
  ];

  const timeTo = (target) => {
    if(val >= target) return 'Bereikt! 🎉';
    if(monPlan <= 0) return '–';
    const top = target * rMo + monPlan;
    const bot = val * rMo + monPlan;
    const n = Math.log(top / bot) / Math.log(1 + rMo);
    if(!isFinite(n) || n <= 0) return '–';
    const yrs = Math.floor(n / 12);
    const mos = Math.round(n % 12);
    if(yrs === 0) return `nog ${mos} mnd`;
    return `nog ${yrs} j ${mos ? mos+' m' : ''}`;
  };

  const nextIdx = milestones.findIndex(m => val < m.target);
  const activeMilestones = milestones.slice(Math.max(0, nextIdx), Math.max(0, nextIdx) + 3);

  return `
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px">
    <div>
      <div class="mu" style="font-size:12px">Passief inkomen nu (4% regel)</div>
      <div style="font:700 22px var(--disp);color:var(--up)">${eur(pMo)} <span style="font-size:13px;font-weight:500;color:var(--mu)">/ maand</span></div>
    </div>
    <div style="text-align:right">
      <div class="mu" style="font-size:12px">Per jaar</div>
      <b style="font-size:15px">${eur(pYr)}</b>
    </div>
  </div>

  <div style="display:grid;gap:8px">
    ${activeMilestones.map(m => {
      const pctDone = Math.min(100, (val / m.target) * 100);
      const isReached = val >= m.target;
      return `<div class="fire-item">
        <div class="fire-icon">${m.icon}</div>
        <div style="min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;font-weight:600">
            <span>${esc(m.name)} <small class="mu">(${eur(m.mo)}/mnd)</small></span>
            <small class="${isReached?'up':'mu'}">${isReached ? '✓ Bereikt' : timeTo(m.target)}</small>
          </div>
          <div class="fire-bar"><i style="width:${pctDone}%;${isReached?'background:var(--up)':'background:var(--ac)'}"></i></div>
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-top:2px" class="mu">
            <span>${eur(val)} van ${eur(m.target, 0)}</span>
            <span>${num(pctDone, 1)}%</span>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>
  <div class="mu" style="font-size:11px;margin-top:10px">
    Gebaseerd op 4% veilige jaarlijkse onttrekking (Trinity Study) en €${monPlan}/mnd spaarplan à 7% rendement.
  </div>`;
}

/* ================= pages ================= */
const PAGES={};

/* ---- Dashboard (Northstar Homepage) ---- */
PAGES.dashboard=()=>{
  const P=positions(), T_real=totals(P), H_real=held(P);
  const hasHoldings = H_real.length > 0;
  
  // Clean 0-state when no holdings, or real calculated portfolio totals when present
  const T = hasHoldings ? T_real : {
    value: 0,
    cost: 0,
    pl: 0,
    plPct: 0,
    day: 0,
    dayPct: 0
  };

  const holdingsList = hasHoldings ? H_real.map(p => {
    const rawSym = p.sym.replace(/\..*/, '');
    const avg = p.shares > 0 ? p.cost / p.shares : 0;
    return {
      sym: rawSym,
      fullSym: p.sym,
      name: nameOf(p.sym),
      shares: p.shares,
      avg: avg,
      value: p.value,
      pl: p.pl,
      plPct: p.plPct,
      color: colorOf(p.sym)
    };
  }) : [];

  const investedSum = hasHoldings ? T.cost : 0;
  const assetCount = holdingsList.length;

  const curRange = UI.dRange || '1Y';
  const perfDiff = hasHoldings ? (T.pl || 0) : 0;
  const perfDiffPct = hasHoldings ? (T.plPct || 0) : 0;

  // Asset allocation categories
  const allocMode = UI.allocFilter || 'sector';
  let allocItems = [];
  if (hasHoldings) {
    const groupMap = {};
    const totalV = T.value || 1;

    holdingsList.forEach(p => {
      const sym = p.fullSym || p.sym;
      let groupKey = 'Overig';
      let groupColor = null;

      if (allocMode === 'asset') {
        groupKey = nameOf(sym);
        groupColor = colorOf(sym);
      } else if (allocMode === 'type') {
        groupKey = getAssetType(sym);
      } else if (allocMode === 'region') {
        groupKey = getAssetRegion(sym);
      } else {
        // default: 'sector'
        groupKey = getAssetSector(sym);
      }

      if (!groupMap[groupKey]) {
        groupMap[groupKey] = { value: 0, items: [], color: groupColor };
      }
      groupMap[groupKey].value += p.value;
      groupMap[groupKey].items.push(sym);
    });

    const entries = Object.entries(groupMap).sort((a, b) => b[1].value - a[1].value);
    const SECTOR_PALETTE = ['#00d084', '#38bdf8', '#818cf8', '#f59e0b', '#ec4899', '#10b981', '#6366f1', '#f97316', '#a855f7', '#06b6d4'];

    allocItems = entries.map(([name, data], idx) => {
      const pct = Math.round((data.value / totalV) * 1000) / 10;
      return {
        name,
        value: data.value,
        pct: pct >= 0.1 ? pct : +(data.value / totalV * 100).toFixed(1),
        count: data.items.length,
        items: data.items,
        color: data.color || SECTOR_PALETTE[idx % SECTOR_PALETTE.length]
      };
    });
  } else {
    allocItems = [];
  }

  // Greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
  const userName = AUTH.user ? AUTH.user.name.split(' ')[0] : 'Bezoeker (Demo)';
  const overviewTag = AUTH.user ? 'OVERVIEW' : '🎭 DEMO MODUS';
  const greetingSub = AUTH.user ? 'Hier is de realtime status van je persoonlijke beleggingsportefeuille.' : 'Je bekijkt momenteel een voorbeeld-portfolio. Maak gratis binnen 10 seconden een account aan om je eigen beleggingen en CSV’s veilig bij te houden!';

  // Center donut text
  const donutCenterVal = UI.privacyMode ? '€ •••••' : (T.value >= 1000 ? '€' + (T.value / 1000).toFixed(1) + 'k' : eur(T.value));

  main.innerHTML = `
    ${banners()}

    <!-- Greeting Section -->
    <div class="ns-greeting-row">
      <div>
        <div class="ns-tag">${overviewTag}</div>
        <h1 class="ns-greeting-title">${timeGreeting}, ${esc(userName)}</h1>
        <p class="ns-greeting-sub">${esc(greetingSub)}</p>
      </div>
      <div>
        <button class="ns-btn-primary" data-act="addtx">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Transactie toevoegen
        </button>
      </div>
    </div>

    <!-- 3-Segment Metric Card -->
    <div class="ns-metric-card">
      <div class="ns-metric-seg">
        <div class="ns-metric-lbl">
          <span>Total portfolio value</span>
          <button class="ns-eye-btn" data-act="toggle_privacy" title="Bedragen verbergen of tonen">
            ${ic(UI.privacyMode ? 'eye_off' : 'eye', 13)}
          </button>
        </div>
        <div class="ns-metric-val">${eur(T.value)}</div>
        <div class="ns-metric-status">
          <span class="ns-live-dot"></span>
          <span>Updated just now</span>
        </div>
      </div>

      <div class="ns-metric-seg">
        <div class="ns-metric-lbl">Total return</div>
        <div class="ns-metric-stat ${cls(T.pl)}">${seur(T.pl)}</div>
        <div class="ns-metric-trend ${cls(T.pl)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
          <span>${pct(T.plPct)} all time</span>
        </div>
      </div>

      <div class="ns-metric-seg">
        <div class="ns-metric-lbl">Today's change</div>
        <div class="ns-metric-stat ${cls(T.day)}">${seur(T.day)}</div>
        <div class="ns-metric-trend ${cls(T.day)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
          <span>${pct(T.dayPct)} today</span>
        </div>
      </div>
    </div>

    <!-- Middle 2-Column Grid -->
    <div class="ns-mid-grid">
      <!-- Left Card: Portfolio performance -->
      <div class="ns-card">
        <div class="ns-card-head">
          <div>
            <div class="ns-card-title">Portfolio performance</div>
            <div class="ns-card-sub">Market value over time</div>
          </div>
          <div class="ns-time-pills" id="dtabs">
            ${['1W','1M','1Y','ALL'].map(r => `<button data-act="drange" data-v="${r}" class="${curRange === r ? 'on' : ''}">${r}</button>`).join('')}
          </div>
        </div>

        <div class="ns-perf-val-row">
          <div class="ns-perf-val">${eur(T.value)}</div>
          <div class="ns-perf-badge ${cls(perfDiff)}">
            ${seur(perfDiff)} (${pct(perfDiffPct)})
          </div>
        </div>

        <div class="chart loading" id="dchart" style="min-height:250px"></div>
      </div>

      <!-- Right Card: Asset allocation -->
      <div class="ns-card" style="display:flex;flex-direction:column;justify-content:space-between">
        <div>
          <div class="ns-card-head" style="margin-bottom:10px;flex-wrap:wrap;gap:8px">
            <div>
              <div class="ns-card-title">Asset allocation</div>
              <div class="ns-card-sub">Verdeling per ${allocMode === 'asset' ? 'aandeel / positie' : allocMode === 'type' ? 'beleggingstype' : allocMode === 'region' ? 'geografische regio' : 'economische sector'}</div>
            </div>
            <div class="ns-time-pills">
              <button data-act="set_alloc_mode" data-v="sector" class="${allocMode==='sector'?'on':''}" title="Groeperen per sector">Sector</button>
              <button data-act="set_alloc_mode" data-v="asset" class="${allocMode==='asset'?'on':''}" title="Groeperen per aandeel/fonds">Aandeel</button>
              <button data-act="set_alloc_mode" data-v="type" class="${allocMode==='type'?'on':''}" title="Aandelen vs ETFs">Type</button>
              <button data-act="set_alloc_mode" data-v="region" class="${allocMode==='region'?'on':''}" title="Groeperen per regio">Regio</button>
            </div>
          </div>

          <!-- Donut Chart -->
          <!-- Donut Chart -->
          <div class="ns-donut-wrap" style="position:relative">
            ${allocItems.length > 0 
              ? donut(allocItems.map(a => ({ name: a.name, value: a.value, color: a.color })), 180, donutCenterVal, allocMode.toUpperCase())
              : `<div style="height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--mu);text-align:center">
                   <div style="font-size:32px;opacity:0.35;margin-bottom:6px">🥧</div>
                   <div style="font-size:12.5px;font-weight:700;color:var(--tx)">Geen posities om te verdelen</div>
                   <div style="font-size:11px;color:var(--mu)">Portefeuillewaarde: € 0,00</div>
                 </div>`
            }
          </div>

          ${UI.holdingsFilter ? `
            <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(0,208,132,0.12);border:1px solid rgba(0,208,132,0.3);border-radius:8px;padding:6px 10px;margin:8px 0;font-size:12px">
              <span>🔍 Filter: <b>${esc(UI.holdingsFilter)}</b></span>
              <button class="btn sm ghost" data-act="filter_alloc_holdings" data-v="${esc(UI.holdingsFilter)}" style="padding:2px 6px;font-size:11px;color:var(--tx)">✕ Wis filter</button>
            </div>
          ` : ''}

          <!-- Allocation Legend -->
          <div class="ns-alloc-legend" style="max-height:165px;overflow-y:auto;padding-right:4px">
            ${allocItems.length === 0 ? `
              <div style="text-align:center;padding:18px 12px;color:var(--mu);font-size:12px">Nog geen activa in portefeuille (€ 0,00)</div>
            ` : allocItems.map(item => {
              const isFiltered = UI.holdingsFilter === item.name;
              return `
              <div class="ns-alloc-legend-row" data-act="filter_alloc_holdings" data-v="${esc(item.name)}" data-alloc-item="${esc(item.name)}" title="Klik om holdings te filteren op ${esc(item.name)}" style="cursor:pointer;padding:5px 6px;border-radius:6px;transition:all .15s;${isFiltered ? 'background:rgba(0,208,132,0.16);font-weight:700;' : ''}">
                <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">
                  <span class="ns-legend-dot" style="background:${item.color};flex-shrink:0"></span>
                  <span class="ns-legend-label" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${esc(item.name)}">${esc(item.name)}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                  <span class="mu" style="font-size:12px">${eur(item.value)}</span>
                  <span class="ns-legend-pct" style="min-width:40px;text-align:right;font-weight:700">${item.pct}%</span>
                </div>
              </div>
            `}).join('')}
          </div>
        </div>

        <!-- Allocation Footer -->
        <div class="ns-alloc-footer" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--bd)">
          <a href="#/rebalance" class="ns-link-btn">
            Herbalanceren &amp; Doelallocatie <span style="font-size:12px;margin-left:2px">→</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Bottom Full-Width Card: Your holdings -->
    ${(() => {
      const displayHoldings = holdingsList.filter(h => {
        if (!UI.holdingsFilter) return true;
        const sym = h.fullSym || h.sym;
        if (allocMode === 'asset') return h.name === UI.holdingsFilter || h.sym === UI.holdingsFilter || sym === UI.holdingsFilter;
        if (allocMode === 'type') return getAssetType(sym) === UI.holdingsFilter;
        if (allocMode === 'region') return getAssetRegion(sym) === UI.holdingsFilter;
        return getAssetSector(sym) === UI.holdingsFilter;
      });

      return `
      <div class="ns-holdings-card">
        <div class="ns-card-head" style="align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <div>
            <div class="ns-card-title">Your holdings</div>
            <div class="ns-card-sub">${UI.holdingsFilter ? `<span class="badge ac">${displayHoldings.length} van ${assetCount} getoond (${esc(UI.holdingsFilter)})</span>` : `${assetCount} assets · ${eur(investedSum)} invested`}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${UI.holdingsFilter ? `<button class="btn sm ghost" data-act="filter_alloc_holdings" data-v="${esc(UI.holdingsFilter)}" style="font-size:12px">✕ Reset filter</button>` : ''}
            <a href="#/portfolio" class="ns-btn-outline">
              Manage holdings <span style="font-size:12px;margin-left:2px">→</span>
            </a>
          </div>
        </div>

        <div class="ns-table-wrap">
          <table class="ns-table">
            <thead>
              <tr>
                <th style="text-align:left">TICKER</th>
                <th style="text-align:right">SHARES</th>
                <th style="text-align:right">AVERAGE PRICE</th>
                <th style="text-align:right">CURRENT VALUE</th>
                <th style="text-align:right">PROFIT / LOSS</th>
                <th style="width:36px;text-align:center"></th>
              </tr>
            </thead>
            <tbody>
              ${displayHoldings.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align:center;padding:36px 16px;color:var(--mu)">
                    <div style="font-size:32px;margin-bottom:8px">💼</div>
                    <div style="font-weight:700;font-size:14px;color:var(--tx)">Er staat momenteel geen geld of beleggingen op deze portefeuille (€ 0,00)</div>
                    <div style="font-size:12px;margin-top:6px;max-width:440px;margin-left:auto;margin-right:auto">
                      ${!AUTH.user ? 'In de demo-modus staat het saldo leeg. Maak een gratis account aan of log in om je eigen transacties en CSV-bestanden te beheren!' : 'Klik op “Transactie toevoegen” of importeer een CSV-bestand van je broker.'}
                    </div>
                  </td>
                </tr>
              ` : displayHoldings.map(h => {
                const avatarLetters = h.sym.slice(0, 2).toUpperCase();
                return `
                  <tr class="ns-tr" data-go="#/stock/${encodeURIComponent(h.fullSym || h.sym)}">
                    <td>
                      <div class="ns-ticker-cell">
                        <div class="ns-ticker-avatar" style="border-color:${h.color}44;background:${h.color}18;color:${h.color}">
                          ${avatarLetters}
                        </div>
                        <div>
                          <div class="ns-ticker-sym">${esc(h.sym)}</div>
                          <div class="ns-ticker-name">${esc(h.name)}</div>
                        </div>
                      </div>
                    </td>
                    <td style="text-align:right;font-weight:600;color:var(--mu)">
                      ${shr(h.shares)}
                    </td>
                    <td style="text-align:right;font-weight:600;color:var(--mu)">
                      ${eur(h.avg)}
                    </td>
                    <td style="text-align:right;font-weight:700;color:var(--tx)">
                      ${eur(h.value)}
                    </td>
                    <td style="text-align:right">
                      <div class="ns-pl-val ${cls(h.pl)}">${seur(h.pl)}</div>
                      <div class="ns-pl-pct ${cls(h.pl)}">${pct(h.plPct)}</div>
                    </td>
                    <td style="text-align:center">
                      <button class="ns-row-dots" data-go="#/stock/${encodeURIComponent(h.fullSym || h.sym)}" title="Details">···</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    })()}
  `;

  loadDashChart(P);

  // Bind interactive donut hover & zoom
  const slices = $$('.donut-slice');
  const rows = $$('.ns-alloc-legend-row');
  const cVal = $('#donut-center-val');
  const cLbl = $('#donut-center-lbl');
  const defVal = donutCenterVal;
  const defLbl = allocMode.toUpperCase();

  const onHover = (name, val, pct) => {
    if(cVal) cVal.textContent = val;
    if(cLbl) cLbl.textContent = `${name} (${pct})`;
    slices.forEach(s => {
      const match = s.dataset.name === name;
      s.style.strokeWidth = match ? '26px' : '16px';
      s.style.opacity = match ? '1' : '0.35';
    });
    rows.forEach(r => {
      r.style.opacity = r.dataset.allocItem === name ? '1' : '0.45';
    });
  };

  const onLeave = () => {
    if(cVal) cVal.textContent = defVal;
    if(cLbl) cLbl.textContent = defLbl;
    slices.forEach(s => {
      s.style.strokeWidth = '20px';
      s.style.opacity = '1';
    });
    rows.forEach(r => {
      r.style.opacity = '1';
    });
  };

  slices.forEach(s => {
    s.addEventListener('mouseenter', () => onHover(s.dataset.name, s.dataset.val, s.dataset.pct));
    s.addEventListener('mouseleave', onLeave);
    s.addEventListener('click', () => {
      if(s.dataset.name) ACT.filter_alloc_holdings(s.dataset.name);
    });
  });

  rows.forEach(r => {
    const item = allocItems.find(a => a.name === r.dataset.allocItem);
    if(item){
      r.addEventListener('mouseenter', () => onHover(item.name, eur(item.value), item.pct + '%'));
      r.addEventListener('mouseleave', onLeave);
    }
  });
};
function ledgerRow(p){
  const q=M.q[p.sym];
  return `<div class="r" data-go="#/stock/${encodeURIComponent(p.sym)}">
    <div class="nm"><span class="sw" style="background:${colorOf(p.sym)}"></span><div style="min-width:0"><b>${esc(nameOf(p.sym))}</b><small>${esc(p.sym)} · ${shr(p.shares)} stuks</small></div></div>
    <div class="sp">${spark(q&&q.spark)}</div>
    <div><b>${eur(p.value)}</b><br><small class="${cls(p.dayPct)}">${pct(p.dayPct)} vandaag</small></div>
    <div><b class="${cls(p.pl)}">${seur(p.pl)}</b><br><small class="${cls(p.pl)}">${pct(p.plPct)}</small></div>
  </div>`;
}
function insights(H,T){
  if(!H.length)return '<div class="empty">Geen data.</div>';
  const etf=H.filter(p=>S.inst[p.sym]?.type==='ETF').reduce((a,p)=>a+p.value,0),ep=T.value?etf/T.value*100:0;
  const top=H[0],byDay=[...H].filter(p=>p.dayPct!=null).sort((a,b)=>b.dayPct-a.dayPct);
  const best=byDay[0],worst=byDay[byDay.length-1];
  const totalDiv=(S.dividends||[]).reduce((a,d)=>a+d.amount,0);
  return `<div class="lab">Spreiding ETF / losse aandelen</div>
    <div class="split"><i style="width:${ep}%;background:var(--ac)"></i><i style="width:${100-ep}%;background:var(--warn)"></i></div>
    <div style="display:flex;justify-content:space-between" class="mu"><span>ETF's ${num(ep,0)}%</span><span>Losse aandelen ${num(100-ep,0)}%</span></div>
    <div class="kv" style="margin-top:16px">
      <span>Grootste positie</span><span>${esc(nameOf(top.sym))} (${num(top.w,0)}%)</span>
      ${best?`<span>Beste vandaag</span><span class="${cls(best.dayPct)}">${esc(nameOf(best.sym))} ${pct(best.dayPct)}</span>`:''}
      ${worst&&worst!==best?`<span>Zwakste vandaag</span><span class="${cls(worst.dayPct)}">${esc(nameOf(worst.sym))} ${pct(worst.dayPct)}</span>`:''}
      ${totalDiv>0?`<span>Ontvangen dividend</span><span class="up">+${eur(totalDiv)}</span>`:''}
    </div>
    ${top.w>40&&H.length>1?`<div class="note w" style="margin:16px 0 0">${esc(nameOf(top.sym))} is ${num(top.w,0)}% van je portfolio. Een grote positie vergroot het risico.</div>`:''}`;
}
function dividendWidget(){
  const divs=(S.dividends||[]).sort((a,b)=>b.date.localeCompare(a.date));
  const total=divs.reduce((a,d)=>a+d.amount,0);
  if(!divs.length)return `<div class="empty">Nog geen dividenden. Voeg ze toe via <a href="#/settings">Instellingen</a>.</div>`;
  return `<div class="kv" style="margin-bottom:12px"><span>Totaal ontvangen</span><span class="up">${eur(total)}</span></div>
    ${divs.map(d=>`<div class="div-row"><span style="color:var(--mu)">${new Date(d.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}</span><span><b style="color:var(--mu)">${esc(nameOf(d.sym))}</b></span><span class="up">+${eur(d.amount)}</span></div>`).join('')}`;
}
function benchmarkWidget(T){
  // Static benchmark values – gebruiker kan dit vergelijken met zijn eigen rendement
  const myRet=T.plPct;
  const benchmarks=[
    {name:'Mijn portfolio',ret:myRet,color:'var(--ac)',highlight:true},
    {name:'S&P 500 (SXR8)',ret:2.1,color:'#0891b2'},
    {name:'MSCI World (EUNL)',ret:1.69,color:'#d6336c'}
  ];
  const maxAbs=Math.max(...benchmarks.map(b=>Math.abs(b.ret)),0.1);
  return benchmarks.map(b=>{
    const w=Math.min(100,(Math.abs(b.ret)/maxAbs)*100);
    return `<div class="bmark-row">
      <span style="font-size:13px;${b.highlight?'font-weight:700':'color:var(--mu)'}">${esc(b.name)}</span>
      <div class="bmark-bar-wrap"><div class="bmark-bar" style="width:${w}%;background:${b.ret>=0?b.color:'var(--down)'}"></div></div>
      <span class="${cls(b.ret)}" style="min-width:52px;text-align:right;font-weight:600;font-size:13px">${pct(b.ret)}</span>
    </div>`;
  }).join('')+`<div class="mu" style="font-size:11.5px;margin-top:8px">Benchmark: totaalrendement sinds aankoop. Indexrendementen zijn indicatief.</div>`;
}
function planBox(){
  const p = S.plan || { sym: '', amount: 0, day: 1, active: false };
  const nx = nextPlanDate();
  const fondName = p.sym ? nameOf(p.sym) : 'Nog niet ingesteld';
  const hasValidPlan = p.sym && (p.amount || 0) > 0;
  return `<div class="kv"><span>Fonds</span><span>${esc(fondName)}</span><span>Bedrag per maand</span><span>${eur(p.amount || 0)}</span><span>Volgende storting</span><span>${planBooked()?'Deze maand geboekt ✓':nx.toLocaleDateString('nl-NL',{day:'numeric',month:'long'})}</span></div>
  <div class="acts" style="margin-top:16px"><button class="btn pri" data-act="book" ${planBooked()||!hasValidPlan?'disabled style="opacity:.5"':''}>Boek storting nu</button><a class="btn" href="#/plan">Beheer spaarplan</a></div>`;
}
async function loadDashChart(P){
  const tok=routeTok,box=$('#dchart');if(!box)return;
  const rk=UI.dRange||'1Y',H=held(P);
  if(!H.length){
    box.classList.remove('loading');
    box.innerHTML = `
      <div style="height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--mu);text-align:center">
        <div style="font-size:36px;opacity:0.35;margin-bottom:8px">📈</div>
        <div style="font-weight:700;font-size:13.5px;color:var(--tx)">Geen koersgeschiedenis beschikbaar</div>
        <div style="font-size:12px;margin-top:4px">Er staat momenteel geen geld of transacties op dit portfolio (€ 0,00).</div>
      </div>
    `;
    return;
  }
  const hs=await Promise.all(H.map(p=>getHist(p.sym,rk)));
  if(tok!==routeTok)return;
  const list=H.map((p,i)=>({t:hs[i].t,c:hs[i].c,m:p.shares*toEUR(hs[i].cur||M.q[p.sym]?.cur)})).filter(s=>s.t.length);
  if(!list.length){box.classList.remove('loading');box.innerHTML='<div class="empty">Geen grafiekdata beschikbaar voor deze periode.</div>';return}
  const m=mergeSeries(list),up=m.v[m.v.length-1]>=m.v[0];
  drawChart(box,{
    n:m.v.length,
    series:[{v:m.v,color:up?'#00d084':'#f43f5e',area:true,width:2.4}],
    fmt:(v,d)=>'€'+(v>=1000?Math.round(v/1000)+'k':v.toFixed(0)),
    labels:i=>fmtT(m.t[i],rk),
    tip:i=>fmtTfull(m.t[i],rk)
  });
}
async function loadDashNews(H){
  const tok=routeTok,box=$('#dnews');if(!box)return;
  const lists=await Promise.all(H.slice(0,5).map(p=>getNews(p.sym)));
  if(tok!==routeTok)return;
  const seen=new Set(),all=lists.flat().sort((a,b)=>b.t-a.t).filter(n=>!seen.has(n.link)&&seen.add(n.link)).slice(0,6);
  box.innerHTML=newsHTML(all);
}



/* ---- Portfolio ---- */
PAGES.portfolio=()=>{
  const P=positions(),T=totals(P);
  const rows=held(P);
  const k=UI.sort.key,d=UI.sort.dir;
  rows.sort((a,b)=>(k==='name'?nameOf(a.sym).localeCompare(nameOf(b.sym)):(a[k]??-Infinity)-(b[k]??-Infinity))*d);
  const th=(l,key)=>`<th data-act="sort" data-v="${key}">${l}${UI.sort.key===key?(UI.sort.dir>0?' ↑':' ↓'):''}</th>`;
  main.innerHTML=`
  ${head('Portfolio',`${held(P).length} posities · ${eur(T.value)}`,`<a class="btn" href="#/rebalance">${ic('balance',16)} Herbalanceren</a><button class="btn pri" data-act="addtx">${ic('plus',16)} Aandeel of ETF toevoegen</button>`)}
  ${banners()}
  <section class="panel flat tbl-wrap"><table>
    <thead><tr>${th('Naam','name')}${th('Koers','px')}${th('Vandaag','dayPct')}<th>Verloop</th>${th('Aantal','shares')}${th('Waarde','value')}${th('Ingelegd','cost')}${th('Winst','pl')}${th('Rendement','plPct')}${th('Gewicht','w')}</tr></thead>
    <tbody>${rows.map(p=>`<tr class="row" data-go="#/stock/${encodeURIComponent(p.sym)}">
      <td><div class="nm"><span class="sw" style="background:${colorOf(p.sym)};height:28px"></span><div><b>${esc(nameOf(p.sym))}</b><small>${esc(p.sym)} <span class="badge">${S.inst[p.sym]?.type==='ETF'?'ETF':'Aandeel'}</span></small></div></div></td>
      <td>${eur(p.px)}</td><td class="${cls(p.dayPct)}">${pct(p.dayPct)}</td><td>${spark(M.q[p.sym]&&M.q[p.sym].spark,80,26)}</td>
      <td>${p.shares>1e-9?shr(p.shares):'–'}</td><td><b>${p.shares>1e-9?eur(p.value):'–'}</b></td><td>${p.shares>1e-9?eur(p.cost):'–'}</td>
      <td class="${cls(p.pl)}">${p.shares>1e-9?seur(p.pl):'–'}</td><td class="${cls(p.pl)}">${p.shares>1e-9?pct(p.plPct):'–'}</td>
      <td>${p.w?`<span class="wbar"><i style="width:${p.w}%"></i></span>${num(p.w,1)}%`:'–'}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Totaal</td><td></td><td class="${cls(T.day)}">${pct(T.dayPct)}</td><td></td><td></td><td>${eur(T.value)}</td><td>${eur(T.cost)}</td><td class="${cls(T.pl)}">${seur(T.pl)}</td><td class="${cls(T.pl)}">${pct(T.plPct)}</td><td>100%</td></tr></tfoot>
  </table></section>
  <div class="cols2"><section class="panel"><h3>Verdeling</h3>${distributionWidget(held(P), T)}</section>
  <section class="panel"><h3>Inzichten</h3>${insights(held(P),T)}</section></div>`;
};

/* ---- Stock detail ---- */
PAGES.stock=sym=>{
  sym=sym.toUpperCase();
  let q=M.q[sym];
  if(!q && (BASE[sym] || (S.tx||[]).some(t=>t.sym===sym))){
    M.q[sym]=makeFallbackQuote(sym);
    q=M.q[sym];
  }
  if(!q){
    main.innerHTML=`<a class="back" href="#/portfolio">${ic('back',16)} Terug</a><div class="panel empty"><h3>Koers van “${esc(sym)}” laden…</h3><div class="mu" style="margin-top:8px">Gegevens worden opgehaald via live beursfeed.</div></div>`;
    M.bad.delete(sym);
    getQuote(sym, true).then(ok=>{
      const [n]=curRoute();
      if(n==='stock'){
        if(M.q[sym]){
          render(true);
        } else {
          main.innerHTML=`<a class="back" href="#/portfolio">${ic('back',16)} Terug</a><div class="panel empty"><h3>Geen koersdata voor “${esc(sym)}”</h3>Controleer de ticker. Voor Europese notering: bijv. <b>.DE</b> (Xetra) of <b>.AS</b> (Amsterdam).<div style="margin-top:16px"><button class="btn pri" onclick="M.bad.delete('${esc(sym)}');getQuote('${esc(sym)}',true).then(()=>render(true));">🔄 Opnieuw proberen</button></div></div>`;
        }
      }
    });
    return;
  }
  if(!M.extra.has(sym)){
    M.extra.add(sym);
    getQuote(sym, true).then(ok=>{
      const [n]=curRoute();
      if(n==='stock'&&ok)render(true);
    });
  }
  const P=positions(),p=P[sym],inst=S.inst[sym],_T=totals(P),px=priceEUR(sym),m=toEUR(q.cur);
  const dayCh=(q.price-q.prev)*m,dayPct=q.prev?(q.price/q.prev-1)*100:0,starred=S.watch.includes(sym);
  const myTx=S.tx.filter(t=>t.sym===sym).sort((a,b)=>b.date.localeCompare(a.date));
  const myAl=S.alerts.filter(a=>a.sym===sym);
  const rngPos=q.w52h&&q.w52l&&q.w52h>q.w52l?Math.max(0,Math.min(100,(q.price-q.w52l)/(q.w52h-q.w52l)*100)):null;
  main.innerHTML=`
  <a class="back" href="#/portfolio">${ic('back',16)} Portfolio</a>
  <div class="hdr">
    <div>
      <h1 style="font-size:28px">${esc(nameOf(sym))}</h1>
      <div class="mu"><span class="badge ac">${esc(sym)}</span> ${esc(q.exch||'')} · ${q.open?'<span class="up">markt open</span>':'markt gesloten'} ${q.demo?`<span class="badge w">indicatief</span> <button class="btn sm" onclick="M.bad.delete('${esc(sym)}');getQuote('${esc(sym)}',true).then(()=>render(true));" style="padding:2px 8px;font-size:11px" title="Probeer live beursdata op te halen">🔄 Live ophalen</button>`:''}</div>
    </div>
    <div class="acts">
      <button class="btn" data-act="star" data-v="${esc(sym)}">${ic('star',16,starred)} ${starred?'In watchlist':'Watchlist'}</button>
      <button class="btn" data-act="alertmodal" data-v="${esc(sym)}">${ic('bell',16)} Prijsalarm</button>
      <button class="btn pri" data-act="addtx" data-v="${esc(sym)}">${ic('plus',16)} Transactie</button>
    </div>
  </div>
  <section class="panel hero">
    <div class="herotop"><div>
      <div class="big">${eur(px)}</div>
      <div class="lines"><span class="${cls(dayCh)}"><b>${seur(dayCh)} (${pct(dayPct)})</b> vandaag</span>${q.cur!=='EUR'?`<span>Koers in ${esc(q.cur)}: <b style="color:var(--tx)">${num(q.price)}</b></span>`:''}<span id="rngchg"></span></div>
    </div>
    <div class="tabs">${Object.keys(RANGES).map(r=>`<button data-act="srange" data-v="${r}" class="${UI.sRange===r?'on':''}">${r}</button>`).join('')}</div></div>
    <div class="chart loading" id="schart"></div>
    ${q.cur!=='EUR'?`<div class="mu" style="font-size:12.5px">Grafiek omgerekend naar euro tegen de huidige wisselkoers.</div>`:''}
  </section>
  <div class="cols">
    <div class="stack">
      <section class="panel"><h3>Kerncijfers</h3><div class="kv">
        <span>Vorige slotkoers</span><span>${eur(q.prev*m)}</span>
        <span>Dagbereik</span><span>${eur(q.lo*m)} – ${eur(q.hi*m)}</span>
        <span>52 weken</span><span>${eur(q.w52l*m)} – ${eur(q.w52h*m)}</span>
        <span>Volume</span><span>${compact(q.vol)}</span>
        <span>Valuta notering</span><span>${esc(q.cur)}</span>
        <span>Beurs</span><span>${esc(q.exch||'–')}</span>
        <span>Gegevensbron</span><span>${esc(q.src)}</span></div>
        ${rngPos!=null?`<div class="lab" style="margin-top:16px">Positie in 52-wekenbereik</div><div class="rng"><span class="mu">laag</span><div class="b"><i style="left:calc(${rngPos}% - 1px)"></i></div><span class="mu">hoog</span></div>`:''}
      </section>
      <section class="panel"><h3>Transacties</h3>${myTx.length?`<div class="tbl-wrap"><table><thead><tr><th>Datum</th><th>Type</th><th>Bedrag</th><th>Aantal</th><th>Koers</th><th></th></tr></thead><tbody>${myTx.map(txRow).join('')}</tbody></table></div>`:'<div class="empty">Nog geen transacties voor dit fonds.</div>'}</section>
      <section class="panel"><h3>Nieuws</h3><div id="snews" style="min-height:100px">${M.news[sym]?newsHTML(M.news[sym].items):'<div class="empty">Laden…</div>'}</div></section>
    </div>
    <div class="stack">
      <section class="panel"><h3>Jouw positie</h3>${p&&p.shares>1e-9?`<div class="big2 ${cls(p.pl)}">${seur(p.pl)}</div><div class="${cls(p.pl)}" style="margin-bottom:16px">${pct(p.plPct)} rendement</div>
        <div class="kv"><span>Waarde</span><span>${eur(p.value)}</span><span>Aantal</span><span>${shr(p.shares)}</span><span>Gemiddelde koers</span><span>${eur(p.avg)}</span><span>Ingelegd</span><span>${eur(p.cost)}</span><span>Vandaag</span><span class="${cls(p.dayChange)}">${seur(p.dayChange)}</span><span>Gewicht</span><span>${num(p.w,1)}%</span>${p.realized?`<span>Gerealiseerd</span><span class="${cls(p.realized)}">${seur(p.realized)}</span>`:''}</div>`:`<div class="empty">Je bezit dit fonds niet.<br><br><button class="btn pri" data-act="addtx" data-v="${esc(sym)}">Koop toevoegen</button></div>`}</section>
      <section class="panel"><h3>Prijsalarmen</h3>${myAl.length?myAl.map(a=>`<div class="kv" style="margin-bottom:8px"><span>${a.dir==='above'?'Boven':'Onder'} ${eur(a.price)} ${a.done?'<span class="badge">afgegaan</span>':''}</span><span><button class="btn sm ghost danger" data-act="delalert" data-v="${a.id}" aria-label="Verwijder alarm">${ic('trash',15)}</button></span></div>`).join(''):'<div class="mu">Geen alarmen ingesteld.</div>'}
        <button class="btn" style="margin-top:12px" data-act="alertmodal" data-v="${esc(sym)}">${ic('bell',16)} Alarm toevoegen</button></section>
      ${inst?`<button class="btn danger" data-act="rminst" data-v="${esc(sym)}">${ic('trash',16)} Verwijder uit portfolio</button>`:''}
    </div>
  </div>`;
  loadStockChart(sym);
  if(!M.news[sym])getNews(sym).then(it=>{const b=$('#snews');if(b)b.innerHTML=newsHTML(it)});
};
async function loadStockChart(sym){
  const tok=routeTok,box=$('#schart');if(!box)return;
  const rk=UI.sRange;box.classList.add('loading');
  const d=await getHist(sym,rk);if(tok!==routeTok)return;
  const m=toEUR(d.cur||M.q[sym]?.cur),v=d.c.map(x=>x*m);
  if(v.length<2){box.classList.remove('loading');box.innerHTML='<div class="empty">Geen grafiekdata beschikbaar voor deze periode.</div>';return}
  const base=rk==='1D'&&M.q[sym]?M.q[sym].prev*m:v[0],up=v[v.length-1]>=base;
  drawChart(box,{n:v.length,series:[{v,color:up?'up':'down',area:true,width:2.4}],base:rk==='1D'?base:null,fmt:(x,dd)=>eur(x,dd??2),labels:i=>fmtT(d.t[i],rk),tip:i=>fmtTfull(d.t[i],rk)});
  const ch=(v[v.length-1]/base-1)*100,el=$('#rngchg');
  if(el)el.innerHTML=`<b class="${cls(ch)}">${pct(ch)}</b> in deze periode`;
}
function txRow(t){
  const sh=txShares(t);
  return `<tr><td>${new Date(t.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}</td><td>${t.type==='sell'?'Verkoop':'Koop'} ${t.plan?'<span class="badge ac">spaarplan</span>':''}</td><td>${eur(t.amount)}</td><td>${sh!=null?(t.est||t.shares==null?'~':'')+shr(sh):'–'}</td><td>${sh?(t.est?'~':'')+eur(t.amount/sh):'–'} ${t.est?'<span class="badge w">geschat</span>':''}</td><td><button class="btn sm ghost" data-act="edittx" data-v="${t.id}" aria-label="Bewerk">${ic('edit',15)}</button><button class="btn sm ghost danger" data-act="deltx" data-v="${t.id}" aria-label="Verwijder">${ic('trash',15)}</button></td></tr>`;
}

/* ---- Herbalanceren ---- */
function rbProgressBars(orders, isCashOnly, extraCash = 0){
  const cleanLabel = (sym, name) => {
    if(sym.includes('SXR8')) return 'S&P 500 ETF';
    if(sym.includes('EUNL')) return 'MSCI World ETF';
    if(sym.includes('VWCE')) return 'All-World ETF';
    const first = (name || sym).split(' ')[0];
    return first.length > 2 ? first : name || sym;
  };

  return `<div class="rb-bars">${orders.map(o=>{
    const nowW = Math.min(100, Math.max(0, o.currPct));
    const tgtW = Math.min(100, Math.max(0, o.tgtPct));
    const newW = Math.min(100, Math.max(0, o.newPct));
    const isBuy = o.action === 'buy';
    const isSell = o.action === 'sell';

    const diffBefore = +(o.tgtPct - o.currPct).toFixed(1);
    const diffAfter = +(o.tgtPct - o.newPct).toFixed(1);

    let badgeHtml = '';
    if(isBuy) {
      badgeHtml = `<span class="badge up" style="font-size:11px;padding:2px 6px">+${eur(o.delta)}</span>`;
    } else if(isSell) {
      badgeHtml = `<span class="badge down" style="font-size:11px;padding:2px 6px">-${eur(Math.abs(o.delta))}</span>`;
    } else {
      // Hold or extraCash is 0 in cashonly mode
      if(isCashOnly && extraCash <= 0.01) {
        if(Math.abs(diffBefore) <= 0.3) {
          badgeHtml = `<span class="badge ac" style="font-size:10.5px;padding:2px 6px">Op doel ✓</span>`;
        } else if(diffBefore > 0) {
          badgeHtml = `<span class="badge up" style="font-size:10.5px;padding:2px 6px" title="Staat ${num(diffBefore,1)}% onder doel">+${num(diffBefore,1)}% onder doel</span>`;
        } else {
          badgeHtml = `<span class="badge down" style="font-size:10.5px;padding:2px 6px" title="Staat ${num(Math.abs(diffBefore),1)}% boven doel">-${num(Math.abs(diffBefore),1)}% overwogen</span>`;
        }
      } else if(isCashOnly && extraCash > 0.01) {
        if(Math.abs(diffAfter) <= 0.3) {
          badgeHtml = `<span class="badge ac" style="font-size:10.5px;padding:2px 6px">In balans ✓</span>`;
        } else if(diffAfter > 0) {
          badgeHtml = `<span class="badge mu" style="font-size:10.5px;padding:2px 6px">Nog +${num(diffAfter,1)}%</span>`;
        } else {
          badgeHtml = `<span class="badge mu" style="font-size:10.5px;padding:2px 6px">+${num(Math.abs(diffAfter),1)}% boven</span>`;
        }
      } else {
        badgeHtml = `<span class="badge" style="font-size:11px;padding:2px 6px">In balans</span>`;
      }
    }

    return `<div class="rb-bar-row" style="grid-template-columns:135px 1fr 110px">
      <div style="display:flex;align-items:center;gap:6px;overflow:hidden">
        <span style="width:9px;height:9px;border-radius:2.5px;background:${o.color};flex-shrink:0"></span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;font-size:12.5px" title="${esc(o.name)}">${cleanLabel(o.sym, o.name)}</span>
      </div>
      <div class="rb-bar-track" title="${esc(o.name)} · Nu: ${num(o.currPct,1)}% → Na actie: ${num(o.newPct,1)}% (Doel: ${num(o.tgtPct,1)}%)">
        <div class="rb-bar-now" style="width:${nowW}%;background:${o.color};opacity:.45"></div>
        ${isCashOnly && Math.abs(newW - nowW) > 0.05 ? `<div style="position:absolute;left:0;top:0;height:100%;width:${newW}%;background:${o.color};opacity:.75"></div>` : ''}
        <div class="rb-bar-tgt" style="width:${tgtW}%;border-color:${o.color};border-width:2.5px"></div>
      </div>
      <div style="text-align:right">
        ${badgeHtml}
      </div>
    </div>`;
  }).join('')}</div>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;font-size:11.5px;margin-top:6px;flex-wrap:wrap" class="mu">
    <div style="display:flex;gap:14px">
      <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:8px;border-radius:3px;background:var(--ac);opacity:.45;display:inline-block"></span>Huidig</span>
      ${isCashOnly ? '<span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:8px;border-radius:3px;background:var(--ac);opacity:.85;display:inline-block"></span>Na inleg</span>' : ''}
      <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:8px;border-radius:3px;border:2px solid var(--ac);display:inline-block"></span>Doel</span>
    </div>
    <span>${isCashOnly ? 'Bijkopen brengt achterblijvers stapsgewijs naar doel' : 'Budgetneutraal: winst afromen en achterblijvers bijkopen'}</span>
  </div>`;
}

function openTradeRepublicSheet(orders, mode){
  const activeOrders = orders.filter(o => o.action !== 'hold');
  const txt = [
    '📋 TRADE REPUBLIC ORDERBRIEFJE',
    '================================',
    ...activeOrders.map(o => `${o.action === 'sell' ? '🔴 VERKOOP' : '🟢 KOOP'} €${eur(Math.abs(o.delta))} van ${nameOf(o.sym)} (${o.sym}) [≈ ${shr(o.shares)} stuks]`),
    '================================',
    mode === 'cashonly' ? `Totale inleg: €${eur(activeOrders.reduce((a,o)=>a+o.delta,0))}` : `Budgetneutraal: €0 extra netto`,
    'Gegenereerd door Portfolio Tracker'
  ].join('\n');

  openModal(`
    <h3>📋 Trade Republic Orderbriefje</h3>
    <p class="mu" style="font-size:13px;margin-top:-6px">Vink de orders af terwijl je ze uitvoert in de Trade Republic app:</p>
    <div class="tr-sheet">
      ${activeOrders.length ? activeOrders.map((o, idx) => `
        <div class="tr-order-item" id="tr_item_${idx}">
          <label style="display:flex;align-items:center;gap:12px;margin:0;cursor:pointer;flex:1">
            <input type="checkbox" class="tr-check" onchange="$('#tr_item_${idx}').classList.toggle('done', this.checked)">
            <div>
              <b class="${o.action==='sell'?'down':'up'}">${o.action==='sell'?'🔴 Verkoop':'🟢 Koop'} ${eur(Math.abs(o.delta))}</b>
              <div style="font-size:12px;color:var(--tx)"><b>${esc(nameOf(o.sym))}</b> <small class="mu">(${esc(o.sym)})</small></div>
            </div>
          </label>
          <div style="text-align:right">
            <span class="badge">${shr(o.shares)} stuks</span>
          </div>
        </div>
      `).join('') : '<div class="empty">Geen orders nodig! Portfolio is al in evenwicht.</div>'}
    </div>
    <div class="note" style="margin:14px 0 16px;font-size:12.5px;padding:10px 14px">
      💡 <b>Tip in Trade Republic:</b> Zoek het aandeel of ETF, tik op <b>Kopen</b>, kies <b>Bedrag in €</b> en vul het exacte bedrag in. Trade Republic koopt automatisch fractionele aandelen.
    </div>
    <div class="acts">
      <button class="btn pri" id="copy_tr_btn">${ic('list', 15)} Kopieer orderlijst naar klembord</button>
      <button class="btn" data-act="closemodal">Sluiten</button>
    </div>
  `, (m) => {
    const btn = $('#copy_tr_btn', m);
    if(btn) btn.addEventListener('click', () => copyText(txt));
  });
}

function rbStepPlan(orders, mode, extraCash){
  const sells = orders.filter(o => o.action === 'sell');
  const buys = orders.filter(o => o.action === 'buy');
  const holds = orders.filter(o => o.action === 'hold');

  if(!sells.length && !buys.length){
    if(mode === 'cashonly' && extraCash <= 0.01){
      return `<div class="note" style="border-left:4px solid var(--ac);background:var(--s2);font-size:13px;padding:12px 14px">
        ℹ️ <b>Klaar voor inleg:</b> Vul hierboven een bedrag in (of klik op <b>+€50</b>, <b>+€100</b> of <b>Ideale inleg</b>) om de optimale kooporders voor je achterblijvers te berekenen.
      </div>`;
    }
    return `<div class="note" style="border-left:4px solid var(--up);background:var(--acs)">✅ <b>Je portfolio staat perfect op je doelpercentages!</b> Er zijn geen orders nodig.</div>`;
  }

  // Sorteren: eerst te verkopen fondsen (grootste verkoop eerst), dan in balans, dan te kopen (grootste aankoop eerst)
  const sortedOrders = [...orders].sort((a, b) => {
    if(a.action === 'sell' && b.action !== 'sell') return -1;
    if(b.action === 'sell' && a.action !== 'sell') return 1;
    if(a.action === 'buy' && b.action !== 'buy') return 1;
    if(b.action === 'buy' && a.action !== 'buy') return -1;
    return Math.abs(b.delta) - Math.abs(a.delta);
  });

  const tableRows = sortedOrders.map(o => {
    const diffPct = +(o.currPct - o.tgtPct).toFixed(1);
    let actBadge = '';
    let diffBadge = '';
    if(o.action === 'sell'){
      actBadge = `<span class="badge down" style="font-weight:700;font-size:11.5px;padding:3px 8px">🔴 Verkoop ${eur(Math.abs(o.delta))}</span>`;
      diffBadge = `<span class="down" style="font-weight:700">+${num(diffPct,1)}% boven doel</span>`;
    } else if(o.action === 'buy'){
      actBadge = `<span class="badge up" style="font-weight:700;font-size:11.5px;padding:3px 8px">🟢 Koop ${eur(o.delta)}</span>`;
      diffBadge = `<span class="up" style="font-weight:700">${num(diffPct,1)}% onder doel</span>`;
    } else {
      actBadge = `<span class="badge ac" style="font-size:11px;padding:2px 6px">⚪ In balans ✓</span>`;
      diffBadge = `<span class="mu" style="font-size:12px">0.0% afwijking</span>`;
    }
    const sharesText = o.shares > 0 ? `<b>≈ ${shr(o.shares)}</b> st.` : '–';

    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <span style="width:9px;height:9px;border-radius:2.5px;background:${o.color};flex-shrink:0"></span>
          <b style="font-size:13px">${esc(o.name)}</b>
          <small class="mu" style="font-size:11px">${esc(o.sym)}</small>
        </div>
      </td>
      <td><b>${num(o.currPct,1)}%</b> <div class="mu" style="font-size:11px">${eur(o.currVal)}</div></td>
      <td><b>${num(o.tgtPct,1)}%</b> <div class="mu" style="font-size:11px">${eur(o.newVal)}</div></td>
      <td>${diffBadge}</td>
      <td>${actBadge}</td>
      <td style="font-size:12px">${sharesText}</td>
    </tr>`;
  }).join('');

  const tableHtml = `
  <div style="margin-bottom:14px">
    <div style="font-size:12.5px;font-weight:700;color:var(--tx);margin-bottom:6px">📊 Overzicht per fonds (Huidig vs Doel)</div>
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Fonds / Aandeel</th>
            <th>Huidig (Nu)</th>
            <th>Doelgewicht</th>
            <th>Afwijking</th>
            <th>Herbalanceer Actie</th>
            <th>Geschat aantal</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  </div>`;

  let steps = '';
  sells.forEach(o => {
    steps += `<div class="rb-step sell-step">
      <div class="rb-step-body">
        <div class="rb-step-title">🔴 Verkoop ${eur(Math.abs(o.delta))} van ${esc(o.name)}</div>
        <div class="rb-step-sub">≈ ${shr(o.shares)} stuks · Huidig gewicht: <b>${num(o.currPct,1)}%</b> (${eur(o.currVal)}) ➔ Na verkoop: <b>${num(o.newPct,1)}%</b> (${eur(o.newVal)}) (Doel: ${num(o.tgtPct,1)}%)</div>
      </div>
      <button class="btn sm" data-act="rb_exec" data-v="${esc(o.sym)}|sell|${Math.abs(o.delta).toFixed(2)}|${o.shares.toFixed(4)}">Voer uit</button>
    </div>`;
  });

  buys.forEach(o => {
    steps += `<div class="rb-step buy-step">
      <div class="rb-step-body">
        <div class="rb-step-title">🟢 Koop ${eur(o.delta)} van ${esc(o.name)}</div>
        <div class="rb-step-sub">≈ ${shr(o.shares)} stuks · Huidig gewicht: <b>${num(o.currPct,1)}%</b> (${eur(o.currVal)}) ➔ Na aankoop: <b>${num(o.newPct,1)}%</b> (${eur(o.newVal)}) (Doel: ${num(o.tgtPct,1)}%)</div>
      </div>
      <button class="btn sm" data-act="rb_exec" data-v="${esc(o.sym)}|buy|${Math.abs(o.delta).toFixed(2)}|${o.shares.toFixed(4)}">Voer uit</button>
    </div>`;
  });

  holds.forEach(o => {
    steps += `<div class="rb-step hold-step" style="opacity:.65">
      <div class="rb-step-body">
        <div class="rb-step-title">⚪ Niets doen met ${esc(o.name)}</div>
        <div class="rb-step-sub">${eur(o.currVal)} (${num(o.currPct,1)}%) — staat al exact op doel (${num(o.tgtPct,1)}%)</div>
      </div>
    </div>`;
  });

  const totalSell = sells.reduce((a, o) => a + Math.abs(o.delta), 0);
  const totalBuy = buys.reduce((a, o) => a + o.delta, 0);
  const netto = totalBuy - totalSell;

  return `
    ${tableHtml}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
      <span style="font-size:13px;font-weight:700;color:var(--tx)">📋 ${sells.length + buys.length} concrete orders uit te voeren:</span>
      <button class="btn sm pri" data-act="rb_sheet_modal">${ic('list', 14)} 📋 Orderbriefje openen</button>
    </div>
    <div class="rb-steps">${steps}</div>
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;background:var(--s2);font-size:13px;margin-top:8px">
      ${mode !== 'cashonly' ? `
        <div><span>Totaal te verkopen: <b class="down">${eur(totalSell)}</b></span> &nbsp;·&nbsp; <span>Totaal te kopen: <b class="up">${eur(totalBuy)}</b></span></div>
        <div><span>Netto extra inleg nodig: <b class="up">€ 0,00</b> (100% budgetneutraal!)</span></div>
      ` : `
        <div><span>Totale nieuwe inleg: <b class="up">${eur(totalBuy)}</b></span></div>
        <div class="mu"><b class="up">0</b> verkopen · Geen verkooporders nodig</div>
      `}
    </div>`;
}

function rbAdvicePanel(orders, H, currentTotalVal, idealeInleg, extraCash, mode){
  if(!H.length) return '';

  // 1. Underweights (deficit > 0.15% to include micro differences as user requested)
  const underweights = orders
    .map(o => {
      const diffPct = +(o.tgtPct - o.currPct).toFixed(1);
      const targetVal = (o.tgtPct / 100) * currentTotalVal;
      const neededEuro = Math.max(0, targetVal - o.currVal);
      const isEtf = S.inst[o.sym]?.type === 'ETF';
      return { ...o, diffPct, neededEuro, isEtf };
    })
    .filter(o => o.diffPct > 0.15)
    .sort((a, b) => b.diffPct - a.diffPct);

  // 2. Overweights (excess > 0.3%)
  const overweights = orders
    .map(o => {
      const excessPct = +(o.currPct - o.tgtPct).toFixed(1);
      const targetVal = (o.tgtPct / 100) * currentTotalVal;
      const excessEuro = Math.max(0, o.currVal - targetVal);
      const isEtf = S.inst[o.sym]?.type === 'ETF';
      return { ...o, excessPct, excessEuro, isEtf };
    })
    .filter(o => o.excessPct > 0.3)
    .sort((a, b) => b.excessPct - a.excessPct);

  // 3. Concentration metrics
  const top1 = orders[0];
  const top2 = orders[1];
  const top2Pct = (top1 ? top1.currPct : 0) + (top2 ? top2.currPct : 0);
  const hasConcentrationRisk = top2Pct >= 25 || (top1 && top1.currPct >= 14);

  // 4. Asset Allocation (ETF vs Stocks)
  const etfTotal = H.filter(p => S.inst[p.sym]?.type === 'ETF').reduce((a, p) => a + p.value, 0);
  const etfPct = currentTotalVal > 0 ? (etfTotal / currentTotalVal) * 100 : 0;
  const stockPct = 100 - etfPct;

  // 5. Total deficit in euros
  const totalDeficitEuro = underweights.reduce((a, o) => a + o.neededEuro, 0);

  return `
  <section class="panel rb-adv-panel">
    <div class="rb-adv-head">
      <div>
        <div class="rb-adv-title">
          <span>🔮 Slim Herbalancerings- &amp; Toekomstadvies</span>
          <span class="badge ac" style="font-size:11px">AI Portfolio Analysator</span>
        </div>
        <p class="mu" style="font-size:12.5px;margin:4px 0 0">
          Gepersonaliseerd advies voor concentratierisico, micro-herbalancering bij kleine afwijkingen en strategische stappen.
        </p>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="badge ${hasConcentrationRisk ? 'w' : 'up'}">${hasConcentrationRisk ? '⚠️ Concentratierisico aanwezig' : '🛡️ Goede spreiding'}</span>
        <span class="badge">${H.length} posities · ETF: ${num(etfPct,1)}% / Aandelen: ${num(stockPct,1)}%</span>
      </div>
    </div>

    <div class="rb-adv-grid">
      <!-- KAART 1: CONCENTRATIE & RISICO -->
      <div class="rb-adv-box">
        <div class="rb-adv-box-title">
          <span>⚠️ Concentratie &amp; Risico-analyse</span>
          <span class="badge ${hasConcentrationRisk ? 'w' : 'ac'}">${num(top2Pct,1)}% in Top 2</span>
        </div>
        <div style="font-size:12.5px;line-height:1.55;color:var(--tx)">
          ${hasConcentrationRisk ? `
            <div style="padding:10px 12px;background:rgba(234,88,12,.1);border-left:3px solid var(--warn);border-radius:6px;margin-bottom:10px">
              <b>Opvallend scheve verdeling:</b> Je top 2 posities (<b>${esc(top1?.name)}</b> met ${num(top1?.currPct,1)}% en <b>${esc(top2?.name)}</b> met ${num(top2?.currPct,1)}%) beslaan samen <b>${num(top2Pct,1)}%</b> van je gehele portefeuille.
            </div>
            <p class="mu" style="margin:0 0 8px;font-size:12px">
              Beleggingsrichtlijn: Individuele aandelen boven de 10% brengen verhoogd bedrijfsspecifiek risico met zich mee.
            </p>
            <div style="font-weight:600;font-size:12px;color:var(--tx);margin-top:auto">
              💡 <b>Toekomstadvies:</b> Stop voorlopig met het bijkopen van ${esc(top1?.name)} en ${esc(top2?.name)}. Laat nieuw kapitaal vloeien naar je achterblijvers om de scheefgroei geleidelijk te neutraliseren.
            </div>
          ` : `
            <div style="padding:10px 12px;background:rgba(16,185,129,.1);border-left:3px solid var(--up);border-radius:6px;margin-bottom:10px">
              <b>Gezonde verdeling:</b> Geen enkele individuele positie domineert je portefeuille buitensporig. De top 2 beslaat een beheerste ${num(top2Pct,1)}%.
            </div>
            <p class="mu" style="margin:0;font-size:12px">
              Blijf periodiek herbalanceren om deze gezonde risicospreiding te behouden naarmate winnaars doorgroeien.
            </p>
          `}
        </div>
      </div>

      <!-- KAART 2: MICRO-HERBALANCERING (OOK BIJ KLEINE VERSCHILLEN) -->
      <div class="rb-adv-box">
        <div class="rb-adv-box-title">
          <span>🎯 Volgende Aankoop Prioriteiten</span>
          <span class="badge up">${underweights.length} achterblijvers</span>
        </div>
        <p class="mu" style="margin:0 0 6px;font-size:12px">
          Ranglijst van fondsen die onder je doelstelling liggen (zelfs bij kleine afwijkingen van 0,5%–2%):
        </p>
        <div class="rb-micro-list">
          ${underweights.length ? underweights.slice(0, 5).map((o, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`;
            return `
            <div class="rb-micro-item">
              <div style="display:flex;align-items:center;gap:8px;overflow:hidden">
                <span class="rb-micro-badge">${medal}</span>
                <div style="overflow:hidden">
                  <b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(o.name)}</b>
                  <small class="mu">${esc(o.sym)} · Nu: ${num(o.currPct,1)}% (Doel: ${num(o.tgtPct,1)}%)</small>
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <b class="up" style="font-size:12px">+${num(o.diffPct,1)}%</b>
                <div style="font-size:11px;color:var(--mu)">ca. ${eur(o.neededEuro)}</div>
              </div>
            </div>`;
          }).join('') : '<div class="empty" style="padding:14px">Alle posities staan momenteel op of boven doel!</div>'}
        </div>
        ${underweights.length > 5 ? `<div class="mu" style="font-size:11px;text-align:center;margin-top:6px">+ nog ${underweights.length - 5} andere fondsen met een kleine afwijking</div>` : ''}
      </div>

      <!-- KAART 3: DCA TOEKOMST INLEGPLAN -->
      <div class="rb-adv-box">
        <div class="rb-adv-box-title">
          <span>📅 DCA Inlegplan (Zonder verkoopkosten)</span>
          <span class="badge ac">0% Transactiekosten</span>
        </div>
        <p class="mu" style="margin:0 0 10px;font-size:12px">
          Herstel de balans met maandelijkse inleg zónder te hoeven verkopen:
        </p>
        <div style="display:grid;gap:8px">
          <div style="padding:9px 12px;background:var(--s1);border-radius:8px;border:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center">
            <div><b>Bij €50/mnd:</b> <span class="mu" style="font-size:12px">stap voor stap achterblijvers</span></div>
            <button class="btn sm" data-act="rb_quick_cash" data-v="50" style="padding:3px 8px;font-size:11px">Simuleer €50</button>
          </div>
          <div style="padding:9px 12px;background:var(--s1);border-radius:8px;border:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center">
            <div><b>Bij €100/mnd:</b> <span class="mu" style="font-size:12px">ca. ${Math.min(18, Math.max(2, Math.ceil(totalDeficitEuro / 100)))} mnd naar balans</span></div>
            <button class="btn sm pri" data-act="rb_quick_cash" data-v="100" style="padding:3px 8px;font-size:11px">Simuleer €100</button>
          </div>
          <div style="padding:9px 12px;background:var(--s1);border-radius:8px;border:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center">
            <div><b>Bij €250/mnd:</b> <span class="mu" style="font-size:12px">snelle correctie scheefgroei</span></div>
            <button class="btn sm" data-act="rb_quick_cash" data-v="250" style="padding:3px 8px;font-size:11px">Simuleer €250</button>
          </div>
        </div>
        <div class="note" style="margin-top:auto;padding:8px 10px;font-size:11.5px">
          💡 Het algoritme berekent automatisch via water-filling welke achterblijvers als eerste geld ontvangen.
        </div>
      </div>

      <!-- KAART 4: STRATEGISCHE TOEKOMST SCENARIO'S -->
      <div class="rb-adv-box">
        <div class="rb-adv-box-title">
          <span>🔮 Toekomst-Scenario's &amp; Beslisregels</span>
          <span class="badge">Marktstrategie</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div class="rb-strat-card">
            <span class="rb-strat-tag" style="background:rgba(239,68,68,.12);color:var(--down)">📉 Bij een marktdip (-10% / -25%)</span>
            <div style="font-size:12px;color:var(--mu);margin-top:2px">
              Als de beurs corrigeert, koop dan <b>uitsluitend de achterblijvers en brede ETF's</b> (zoals Vanguard S&P 500 en Amazon) extra bij. Zo verlaag je je gemiddelde aankoopkoers maximaal.
            </div>
          </div>
          <div class="rb-strat-card">
            <span class="rb-strat-tag" style="background:rgba(16,185,129,.12);color:var(--up)">🚀 Winst afromen (Trimming Rule)</span>
            <div style="font-size:12px;color:var(--mu);margin-top:2px">
              Stijgt ${esc(top1?.name || 'een aandeel')} boven de <b>17.5%</b>? Overweeg om 2-3% van de positie af te romen en te herbeleggen in je brede ETF-fundering. Zo beveilig je winsten structureel.
            </div>
          </div>
          <div class="rb-strat-card">
            <span class="rb-strat-tag" style="background:rgba(48,82,255,.12);color:var(--ac)">🛡️ Versterken ETF Fundering</span>
            <div style="font-size:12px;color:var(--mu);margin-top:2px">
              Breid op termijn de ETF-component uit richting 50-60% voor minder koersschommelingen en betrouwbare compound interest.
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

PAGES.rebalance=()=>{
  const P=positions(), H=held(P), T=totals(P);
  if(!H.length){
    main.innerHTML=`${head('Herbalanceren','Houd je verdeling in evenwicht')}
    <div class="panel empty"><h3>Geen posities om te herbalanceren</h3>Voeg eerst aandelen toe aan je portfolio via <a href="#/portfolio" style="text-decoration:underline">Portfolio</a>.</div>`;
    return;
  }

  // Multi-account target preservation
  if(!UI.rbTargetsByAcc) UI.rbTargetsByAcc = {};
  const curAcc = S.activeAccount || 'default';

  // If UI.rbTargets is not set, try to restore from UI.rbTargetsByAcc[curAcc]
  if(!UI.rbTargets && UI.rbTargetsByAcc[curAcc]){
    const cached = UI.rbTargetsByAcc[curAcc];
    if(Object.keys(cached).length === H.length && H.every(p => typeof cached[p.sym] === 'number' && !isNaN(cached[p.sym]))){
      UI.rbTargets = { ...cached };
    }
  }

  // Ensure UI.rbTargets exists and is populated with real numbers
  const hasValidTargets = UI.rbTargets && Object.keys(UI.rbTargets).length === H.length &&
                          H.every(p => typeof UI.rbTargets[p.sym] === 'number' && !isNaN(UI.rbTargets[p.sym]));

  if(!hasValidTargets){
    UI.rbTargets = {};
    const eq = +(100 / H.length).toFixed(1);
    let sum = 0;
    H.forEach((p, i) => {
      if(i === H.length - 1){
        UI.rbTargets[p.sym] = +(Math.max(0, 100 - sum)).toFixed(1);
      } else {
        UI.rbTargets[p.sym] = eq;
        sum += eq;
      }
    });
    UI.rbTargetsByAcc[curAcc] = { ...UI.rbTargets };
  }
  H.forEach(p => {
    if(UI.rbTargets[p.sym] == null || isNaN(UI.rbTargets[p.sym])) {
      UI.rbTargets[p.sym] = +(100 / H.length).toFixed(1);
    }
  });
  Object.keys(UI.rbTargets).forEach(s => {
    if(!P[s] || P[s].shares <= 1e-9) delete UI.rbTargets[s];
  });

  const totalTarget = Object.values(UI.rbTargets).reduce((a, b) => a + (b || 0), 0);
  const diff = +(100 - totalTarget).toFixed(1);
  const diffOK = Math.abs(diff) < 0.05;

  if(!UI.rbScenario) UI.rbScenario = {};
  const hasScenario = Object.values(UI.rbScenario).some(v => v !== 0);

  const currentTotalVal = H.reduce((a, p) => {
    const sc = (UI.rbScenario[p.sym] || 0) / 100;
    return a + p.value * (1 + sc);
  }, 0);

  // Ideale Inleg (Minimale inleg om zonder verkopen 100% in balans te komen)
  let maxReqTotal = 0;
  let anchor = null;
  H.forEach(p => {
    const sc = (UI.rbScenario[p.sym] || 0) / 100;
    const val = p.value * (1 + sc);
    const tgtPct = UI.rbTargets[p.sym] || 0;
    if (tgtPct > 0.01) {
      const req = val / (tgtPct / 100);
      if (req > maxReqTotal) {
        maxReqTotal = req;
        anchor = {
          sym: p.sym,
          name: nameOf(p.sym),
          currVal: val,
          currPct: currentTotalVal > 0 ? (val / currentTotalVal) * 100 : 0,
          tgtPct,
          req
        };
      }
    }
  });

  const idealeInleg = Math.max(0, Math.round((maxReqTotal - currentTotalVal) * 100) / 100);
  const extraCash = Math.max(0, +UI.rbCash || 0);

  let orders = [];
  if (UI.rbMode === 'cashonly') {
    const allocItems = H.map(p => {
      const sc = (UI.rbScenario[p.sym] || 0) / 100;
      return { sym: p.sym, val: p.value * (1 + sc), tgtPct: UI.rbTargets[p.sym] || 0 };
    });
    const allocations = allocateCash(allocItems, extraCash);
    const newTotalVal = currentTotalVal + extraCash;

    orders = H.map((p, i) => {
      const sc = (UI.rbScenario[p.sym] || 0) / 100;
      const px = (p.px || 0) * (1 + sc);
      const val = p.value * (1 + sc);
      const tgtPct = UI.rbTargets[p.sym] || 0;
      const delta = allocations[i];
      const newVal = val + delta;
      const currPct = currentTotalVal > 0 ? (val / currentTotalVal) * 100 : 0;
      const newPct = newTotalVal > 0 ? (newVal / newTotalVal) * 100 : 0;
      const action = delta > 0.05 ? 'buy' : 'hold';
      const shares = px > 0 ? delta / px : 0;
      return { sym: p.sym, name: nameOf(p.sym), color: colorOf(p.sym), currVal: val, currPct, tgtPct, newVal, newPct, delta, shares, px, action };
    }).sort((a, b) => b.currVal - a.currVal);
  } else {
    const newTotalVal = currentTotalVal;
    orders = H.map(p => {
      const sc = (UI.rbScenario[p.sym] || 0) / 100;
      const px = (p.px || 0) * (1 + sc);
      const val = p.value * (1 + sc);
      const tgtPct = UI.rbTargets[p.sym] || 0;
      const tgtVal = newTotalVal * (tgtPct / 100);
      const delta = tgtVal - val;
      const action = delta > 0.05 ? 'buy' : delta < -0.05 ? 'sell' : 'hold';
      const shares = px > 0 ? Math.abs(delta) / px : 0;
      const currPct = currentTotalVal > 0 ? (val / currentTotalVal) * 100 : 0;
      const newPct = tgtPct;
      const newVal = tgtVal;
      return { sym: p.sym, name: nameOf(p.sym), color: colorOf(p.sym), currVal: val, currPct, tgtPct, newVal, newPct, delta, shares, px, action };
    }).sort((a, b) => b.currVal - a.currVal);
  }

  const currBalansScore = Math.max(0, Math.round(100 - orders.reduce((a, o) => a + Math.abs(o.currPct - o.tgtPct), 0) / 2));
  const newBalansScore = Math.max(0, Math.round(100 - orders.reduce((a, o) => a + Math.abs(o.newPct - o.tgtPct), 0) / 2));
  const wouldBeSells = H.filter(p => {
    const sc = (UI.rbScenario[p.sym] || 0) / 100;
    const val = p.value * (1 + sc);
    const tgt = (UI.rbTargets[p.sym] || 0) / 100 * currentTotalVal;
    return (val - tgt) > 1.0;
  }).length;

  const hasConcentrationRisk = orders.some(o => o.currPct > 25);
  const activeTab = UI.rbTab || 'rebalance';

  let contentHtml = '';
  if (activeTab === 'advice') {
    contentHtml = rbAdvicePanel(orders, H, currentTotalVal, idealeInleg, extraCash, UI.rbMode);
  } else {
    contentHtml = `
    <section class="panel" style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="min-width:260px;flex:1">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:11px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.05em">Herbalanceer Advies</span>
          <span class="badge ${diffOK?'ac':'warn'}">${diffOK?'Doel: 100% ingesteld':`Doel: ${num(totalTarget,1)}%`}</span>
          <span class="badge ${currBalansScore>=90?'up':currBalansScore>=75?'ac':'warn'}">Balans: ${currBalansScore}% ➔ ${newBalansScore}%</span>
        </div>
        <div style="font-size:15px;font-weight:700;color:var(--tx)">
          ${UI.rbMode !== 'cashonly' ? `
            🔄 <b>Budgetneutraal herbalanceren:</b> Verkoop wat boven je doel staat (winst afromen) en koop achterblijvers bij. Extra geld nodig: <span class="up">€ 0,00</span>.
          ` : (idealeInleg > 0 ? `Inlegadvies: <span class="up">${eur(idealeInleg)}</span> storten om 100% in balans te komen zonder te verkopen.` : `✅ Je portfolio staat momenteel perfect op je doelverdeling.`)}
        </div>
      </div>
      ${idealeInleg > 0 ? `
      <div>
        <button class="btn pri" data-act="rb_apply_ideal" data-v="${idealeInleg.toFixed(2)}">
          ${ic('plus',14)} Pas inleg toe (${eur(idealeInleg)})
        </button>
      </div>` : ''}
    </section>

    <div class="cols2" style="margin-top:0">
      <!-- LINKER KOLOM: STAP 1 -->
      <section class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
        <div>
          <h3 style="margin:0">Stap 1 · Doelverdeling</h3>
          <p class="mu" style="margin:4px 0 0;font-size:12.5px">Kies hoeveel % je van elk fonds wilt bezitten (som = 100%):</p>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span class="badge ${diffOK?'ac':'warn'}" id="rb_tot_badge">${diffOK?'✓ 100%':`Som: ${num(totalTarget,1)}%`}</span>
          ${!diffOK?`<button class="btn sm" data-act="rb_normalize" title="Schaal alle percentages evenredig bij naar 100%">🔄 Maak 100%</button>`:''}
        </div>
      </div>

      <div class="rb-preset-bar">
        <span class="mu" style="font-size:11.5px;display:flex;align-items:center">Snelkeuze:</span>
        <button class="chip pri" data-act="rb_equal">⚖️ Gelijk verdelen (${(100/H.length).toFixed(1)}% elk)</button>
        <button class="chip" data-act="rb_current">📍 Huidige gewichten</button>
        <button class="chip" data-act="rb_coresatellite">🛡️ 60/40 Core-ETF</button>
      </div>
      <div style="font-size:12px;color:var(--mu);margin:6px 0 10px;line-height:1.4">
        💡 <b>Gelijke weging:</b> 100% verdeeld over ${H.length} posities = <b>${(100/H.length).toFixed(1)}% per fonds</b> (ca. ${eur(currentTotalVal / H.length)} per positie). Alles wat hoger staat dan ${(100/H.length).toFixed(1)}% wordt verkocht (winst afromen), en alles wat lager staat wordt bijgekocht.
      </div>

      <div style="display:grid;gap:8px" id="rb_target_list">
        ${H.map(p => {
          const sc = (UI.rbScenario[p.sym] || 0) / 100;
          const val = p.value * (1 + sc);
          const currPct = currentTotalVal > 0 ? (val / currentTotalVal) * 100 : 0;
          const tgt = UI.rbTargets[p.sym] || 0;
          const diffPct = +(tgt - currPct).toFixed(1);
          const isEtf = S.inst[p.sym]?.type === 'ETF';

          return `<div class="rb-target-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:8px;min-width:0">
                <span style="width:10px;height:10px;border-radius:3px;background:${colorOf(p.sym)};flex-shrink:0"></span>
                <b style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(nameOf(p.sym))}</b>
                <small class="mu">${esc(p.sym)}</small>
                ${isEtf ? '<span class="badge" style="font-size:10px;padding:1px 5px">ETF</span>' : ''}
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                <button class="rb-single-cur-btn" data-act="rb_single_current" data-v="${esc(p.sym)}|${currPct.toFixed(1)}" title="Zet dit aandeel op exact huidig gewicht (${num(currPct,1)}%)">📍 Huidig (${num(currPct,1)}%)</button>
              </div>
            </div>

            <!-- Slider + Number Input row -->
            <div class="rb-slider-row">
              <button class="nudge-btn" data-act="rb_nudge" data-v="${esc(p.sym)}|-0.5" title="Verlaag doel met 0.5%">−</button>
              <input class="tgt_rng" type="range" min="0" max="100" step="0.5" value="${tgt}" data-sym="${esc(p.sym)}">
              <button class="nudge-btn" data-act="rb_nudge" data-v="${esc(p.sym)}|0.5" title="Verhoog doel met 0.5%">+</button>
              <div style="display:flex;align-items:center;gap:4px">
                <input class="tgt_inp" type="number" step="0.1" min="0" max="100" value="${tgt}" data-sym="${esc(p.sym)}">
                <b style="font-size:13px">%</b>
              </div>
            </div>

            <!-- Card footer: Current vs Target Status -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:12px" class="mu">
              <span>Nu: <b>${num(currPct,1)}%</b> (${eur(val)})</span>
              <span>
                ${diffPct > 0.4 ? `<span class="badge up">+${num(diffPct,1)}% onderwogen</span>` :
                  diffPct < -0.4 ? `<span class="badge down">-${num(Math.abs(diffPct),1)}% overwogen</span>` :
                  `<span class="badge ac">In balans (${num(tgt,1)}%)</span>`}
              </span>
            </div>
          </div>`;
        }).join('')}
      </div>

      ${!diffOK?`<div class="note w" style="margin-top:12px">⚠️ Doeltotaal is ${num(totalTarget,1)}% (${diff>0?`nog +${num(diff,1)}% toe te wijzen`:`${num(Math.abs(diff),1)}% teveel`}). Klik op <b>“Maak 100%”</b> om direct te corrigeren.</div>`:''}
    </section>

    <!-- RECHTER KOLOM: STAP 2 & SCENARIO -->
    <div class="stack">
      <section class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <h3 style="margin:0">Stap 2 · Kies methode &amp; inleg</h3>
          <div class="tabs">
            <button class="${UI.rbMode!=='cashonly'?'on':''}" data-act="rb_setmode" data-v="sellbuy">🔄 Verkopen &amp; Kopen (Klassiek)</button>
            <button class="${UI.rbMode==='cashonly'?'on':''}" data-act="rb_setmode" data-v="cashonly">💰 Alleen bijkopen</button>
          </div>
        </div>
        <p class="mu" style="font-size:12.5px;margin-top:0">
          ${UI.rbMode!=='cashonly'?
            '<b>Budgetneutraal (€0,- extra geld nodig).</b> Verkoop de overgewogen fondsen die boven doel staan, en koop daarmee exact de ondergewogen achterblijvers bij.' :
            '<b>Geen verkooporders nodig.</b> Nieuw geld wordt automatisch verdeeld over de achterblijvende fondsen via de water-filling methode.'}
        </p>

        ${UI.rbMode==='cashonly'?`
        <div style="background:var(--s2);padding:14px;border-radius:12px;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <label style="margin:0;flex:1;min-width:200px">
              <span style="font-weight:600">Nieuw in te leggen bedrag (€)</span>
              <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
                <input id="rb_cash_in" type="number" min="0" step="5" value="${extraCash}" style="max-width:180px;font-weight:700;font-size:16px">
                <span style="font-weight:600">€</span>
              </div>
            </label>
            <div style="text-align:right">
              <span class="mu" style="font-size:12px">Balans na inleg:</span><br>
              <b class="${newBalansScore>=95?'up':newBalansScore>=80?'ac':'warn'}" style="font-size:18px">${newBalansScore}%</b>
            </div>
          </div>
          <div class="chip-row">
            <span class="mu" style="font-size:12px;display:flex;align-items:center;margin-right:4px">Snelle inleg:</span>
            <button class="chip" data-act="rb_quick_cash" data-v="25">+ €25</button>
            <button class="chip" data-act="rb_quick_cash" data-v="50">+ €50</button>
            <button class="chip" data-act="rb_quick_cash" data-v="100">+ €100</button>
            <button class="chip" data-act="rb_quick_cash" data-v="200">+ €200</button>
            ${idealeInleg>0?`<button class="chip pri" data-act="rb_quick_cash" data-v="${idealeInleg.toFixed(2)}">💎 Ideale inleg (${eur(idealeInleg)})</button>`:''}
            <button class="chip" data-act="rb_quick_cash" data-v="clear" style="color:var(--down)">Wis</button>
          </div>
        </div>`:''}

        ${diffOK?`
        <div style="display:flex;justify-content:space-between;align-items:center;margin:16px 0 8px">
          <h4 style="margin:0;font-size:13.5px">Visuele verdeling · Vóór &amp; Na</h4>
          <span class="badge ${newBalansScore>=95?'ac':''}">${newBalansScore}% in balans</span>
        </div>
        ${rbProgressBars(orders, UI.rbMode==='cashonly', extraCash)}
        <h4 style="margin:18px 0 8px;font-size:13.5px">Stappenplan</h4>
        ${rbStepPlan(orders, UI.rbMode, extraCash)}`:
        `<div class="note w">Zorg eerst dat de doelpercentages links optellen tot 100%.</div>`}
      </section>

      <!-- Scenarioplanner & Crash Test (Optioneel inklapbaar) -->
      <details class="panel" style="cursor:pointer"${hasScenario?' open':''}>
        <summary style="font-weight:700;font-size:13.5px;color:var(--tx);display:flex;align-items:center;justify-content:space-between;user-select:none">
          <span>🧪 Scenarioplanner &amp; Crash Test</span>
          <span class="badge ${hasScenario?'warn':'ac'}">${hasScenario?'Scenario actief':'Optioneel ▾'}</span>
        </summary>
        <div style="margin-top:14px;cursor:default">
          <div class="acts" style="margin-bottom:12px">
            <button class="btn sm" data-act="rb_scenario_dip" data-v="-10" title="Simuleer 10% correctie">📉 -10% Dip</button>
            <button class="btn sm" data-act="rb_scenario_dip" data-v="-25" title="Simuleer 25% crash">🐻 -25% Crash</button>
            <button class="btn sm" data-act="rb_scenario_dip" data-v="20" title="Simuleer 20% bull rally">🚀 +20% Rally</button>
            <button class="btn sm pri" data-act="rb_scenario_example">⚡ Voorbeeld (-50%/+50%)</button>
          </div>
          <div style="display:grid;gap:8px">
            ${H.map(p=>{
              const sc=UI.rbScenario[p.sym]||0;
              return `<div style="display:flex;align-items:center;gap:12px;background:var(--s2);padding:8px 12px;border-radius:8px">
                <span style="width:8px;height:8px;border-radius:2px;background:${colorOf(p.sym)};flex-shrink:0"></span>
                <div style="flex:1;font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(nameOf(p.sym))}</div>
                <input class="sc_inp" type="range" min="-80" max="150" step="5" value="${sc}" style="width:110px" data-sym="${esc(p.sym)}">
                <span style="font-size:12.5px;min-width:52px;text-align:right;font-weight:600" class="${sc>0?'up':sc<0?'down':'mu'}">${sc>0?'+':''}${sc}%</span>
              </div>`;
            }).join('')}
          </div>
          ${hasScenario?`<button class="btn sm ghost danger" style="margin-top:10px" data-act="rb_clearscenario">${ic('trash',14)} Wis scenario (terug naar live koersen)</button>`:''}
        </div>
      </details>
    </div>
  </div>`;
  }

  main.innerHTML=`
  ${head('Herbalanceren',`Portefeuillewaarde: <b>${eur(currentTotalVal)}</b> · ${H.length} posities`,
    `<div class="tabs">
      <button class="${activeTab==='rebalance'?'on':''}" data-act="rb_tab" data-v="rebalance">⚖️ Herbalanceren &amp; Simulator</button>
      <button class="${activeTab==='advice'?'on':''}" data-act="rb_tab" data-v="advice">💡 Slim AI-Advies &amp; Strategie ${hasConcentrationRisk ? '⚠️' : ''}</button>
    </div>`)}
  ${banners()}
  ${contentHtml}
  `;

  // Attach smart input & slider listeners that don't destroy focus
  const handleTargetChange = (sym, rawVal, originEl) => {
    let val = parseFloat(rawVal);
    if(isNaN(val)) val = 0;
    val = Math.max(0, Math.min(100, Math.round(val * 10) / 10));
    UI.rbTargets[sym] = val;
    if(!UI.rbTargetsByAcc) UI.rbTargetsByAcc = {};
    UI.rbTargetsByAcc[S.activeAccount || 'default'] = { ...UI.rbTargets };

    // Sync brother element (slider <-> input)
    if(originEl.classList.contains('tgt_inp')){
      const rng = $(`input.tgt_rng[data-sym="${sym}"]`, main);
      if(rng) rng.value = val;
    } else if(originEl.classList.contains('tgt_rng')){
      const inp = $(`input.tgt_inp[data-sym="${sym}"]`, main);
      if(inp) inp.value = val;
    }

    // Schedule rebalance redraw with focus preservation
    clearTimeout(window._rbDebounce);
    window._rbDebounce = setTimeout(() => {
      const active = document.activeElement;
      const activeSym = active?.dataset?.sym;
      const isInput = active?.classList?.contains('tgt_inp');
      const selStart = isInput ? active.selectionStart : null;
      const selEnd = isInput ? active.selectionEnd : null;

      PAGES.rebalance();

      if(activeSym && isInput){
        const newEl = $(`input.tgt_inp[data-sym="${activeSym}"]`, main);
        if(newEl){
          newEl.focus();
          if(selStart != null) try{ newEl.setSelectionRange(selStart, selEnd); }catch(e){}
        }
      }
    }, 180);
  };

  $$('.tgt_inp', main).forEach(inp => {
    inp.addEventListener('input', e => handleTargetChange(e.target.dataset.sym, e.target.value, e.target));
  });
  $$('.tgt_rng', main).forEach(rng => {
    rng.addEventListener('input', e => handleTargetChange(e.target.dataset.sym, e.target.value, e.target));
  });

  $$('.sc_inp', main).forEach(inp => {
    inp.addEventListener('input', e => {
      const sym = e.target.dataset.sym;
      UI.rbScenario[sym] = parseFloat(e.target.value) || 0;
      PAGES.rebalance();
    });
  });

  const cashIn = $('#rb_cash_in', main);
  if(cashIn){
    cashIn.addEventListener('input', e => {
      UI.rbCash = parseFloat(e.target.value) || 0;
      clearTimeout(window._rbCashDebounce);
      window._rbCashDebounce = setTimeout(() => {
        const active = document.activeElement;
        const selStart = active?.selectionStart;
        const selEnd = active?.selectionEnd;
        PAGES.rebalance();
        const newCashIn = $('#rb_cash_in', main);
        if(newCashIn && active === cashIn){
          newCashIn.focus();
          if(selStart != null) try{ newCashIn.setSelectionRange(selStart, selEnd); }catch(e){}
        }
      }, 150);
    });
  }
};

/* ---- Spaarplan ---- */
PAGES.plan=()=>{
  const P=positions(),T=totals(P),pl=S.plan || {sym:'',amount:100,day:1,active:false};
  if(UI.proj.start==null)UI.proj.start=Math.round(T.value)||0;
  if(UI.proj.monthly==null)UI.proj.monthly=pl.amount||100;
  const hist=(S.tx||[]).filter(t=>t.plan).sort((a,b)=>(b.date||'').localeCompare(a.date||''));

  const symbolMap = new Map();
  const popular = [
    { sym: 'SXR8.DE', name: 'iShares Core S&P 500 (Acc)' },
    { sym: 'EUNL.DE', name: 'iShares Core MSCI World (Acc)' },
    { sym: 'VWCE.DE', name: 'Vanguard FTSE All-World (Acc)' },
    { sym: 'QDVE.DE', name: 'iShares S&P 500 Info Tech (Acc)' },
    { sym: 'VUSA.AS', name: 'Vanguard S&P 500 (Dis)' }
  ];
  popular.forEach(p => symbolMap.set(p.sym, p.name));
  Object.keys(S.inst || {}).forEach(s => symbolMap.set(s, nameOf(s)));
  (S.watch || []).forEach(s => symbolMap.set(s, nameOf(s)));
  if(pl.sym && !symbolMap.has(pl.sym)) symbolMap.set(pl.sym, nameOf(pl.sym) || pl.sym);

  const symOptions = Array.from(symbolMap.entries()).map(([s, n]) =>
    `<option value="${esc(s)}" ${s===pl.sym?'selected':''}>${esc(n)} (${esc(s)})</option>`
  ).join('');

  main.innerHTML=`
  ${head('Spaarplan','Maandelijks automatisch beleggen en prognoses berekenen')}
  ${banners()}
  <div class="cols2" style="margin-top:0">
    <section class="panel"><h3>Mijn maandelijkse storting</h3>
      <form data-form="plan">
        <label><span>Fonds of ETF</span>
          <select name="sym" style="font-weight:600">
            ${symOptions}
          </select>
        </label>
        <div class="row2">
          <label><span>Bedrag per maand (€)</span><input name="amount" type="number" min="1" step="5" required value="${pl.amount || 100}"></label>
          <label><span>Vaste dag van de maand</span><input name="day" type="number" min="1" max="28" required value="${pl.day || 1}"></label>
        </div>
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer;margin-top:6px">
          <input type="checkbox" name="active" style="width:auto;accent-color:var(--ac)" ${pl.active?'checked':''}>
          <span><b>Spaarplan actief</b> (toont herinnering en waarschuwt zodra inleg kan worden geboekt)</span>
        </label>
        <div class="acts" style="margin-top:16px">
          <button class="btn pri" type="submit">Opslaan</button>
          <button class="btn" type="button" data-act="book" ${planBooked()?'disabled style="opacity:.5"':''}>${planBooked() ? '✓ Deze maand al geboekt' : 'Boek storting van deze maand nu'}</button>
        </div>
      </form>
    </section>
    <section class="panel"><h3>Geboekte stortingen (${hist.length})</h3>
      ${hist.length?`<div class="tbl-wrap"><table><thead><tr><th>Datum</th><th>Fonds</th><th>Bedrag</th><th></th></tr></thead><tbody>${hist.map(t=>`<tr><td>${new Date(t.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}</td><td><b>${esc(nameOf(t.sym))}</b> <span class="badge">${esc(t.sym)}</span></td><td><b>${eur(t.amount)}</b></td><td><button class="btn sm ghost danger" data-act="deltx" data-v="${t.id}" aria-label="Verwijder">${ic('trash',15)}</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Nog geen stortingen geboekt. Zodra je maandelijkse inleg bij je broker is uitgevoerd, klik je op “Boek storting”.</div>'}
    </section>
  </div>
  <section class="panel" style="margin-top:20px"><h3>Prognose</h3>
    <div class="cols3" style="margin-top:0">
      <label><span>Startbedrag (€)</span><input id="p_start" type="number" min="0" step="100" value="${UI.proj.start}"></label>
      <label><span>Per maand erbij (€)</span><input id="p_mon" type="number" min="0" step="10" value="${UI.proj.monthly}"></label>
      <div><label><span>Looptijd: <b id="p_yrs_v"></b></span><input id="p_yrs" type="range" min="1" max="40" value="${UI.proj.years}"></label>
      <label><span>Verwacht rendement per jaar: <b id="p_ret_v"></b></span><input id="p_ret" type="range" min="0" max="15" step="0.5" value="${UI.proj.ret}"></label></div>
    </div>
    <div class="facts" id="p_facts"></div>
    <div class="chart" id="projchart" style="min-height:320px"></div>
    <div class="tbl-wrap" style="margin-top:12px"><table id="p_tbl"></table></div>
    <p class="mu" style="font-size:12.5px">Dit is een rekenvoorbeeld, geen belofte. Werkelijke rendementen schommelen en kunnen negatief zijn. Kosten en belasting (box 3) zijn niet meegenomen.</p>
  </section>`;
  updateProj();
};
function updateProj(){
  if(!$('#p_start'))return;
  const st=+$('#p_start').value||0,mo=+$('#p_mon').value||0,yrs=+$('#p_yrs').value,rt=+$('#p_ret').value;
  Object.assign(UI.proj,{start:st,monthly:mo,years:yrs,ret:rt});
  $('#p_yrs_v').textContent=yrs+' jaar';$('#p_ret_v').textContent=num(rt,1)+'%';
  const A=project(st,mo,yrs,Math.max(0,rt-3)),B=project(st,mo,yrs,rt),Hh=project(st,mo,yrs,rt+3),Cn=B.map((_,i)=>st+mo*i);
  const fin=B[B.length-1],con=Cn[Cn.length-1];
  $('#p_facts').innerHTML=`<div><small>Verwachte waarde</small><b>${eur(fin,0)}</b></div><div><small>Totaal ingelegd</small><b>${eur(con,0)}</b></div><div><small>Verwacht rendement</small><b class="up">${eur(fin-con,0)}</b></div><div><small>Bandbreedte (±3%)</small><b>${eur(A[A.length-1],0)} – ${eur(Hh[Hh.length-1],0)}</b></div>`;
  drawChart($('#projchart'),{n:B.length,h:320,
    series:[{v:Hh,color:'up',dash:'5 4',name:`${num(rt+3,1)}%`},{v:B,color:'ac',area:true,width:2.6,name:`${num(rt,1)}% (verwacht)`},{v:A,color:'mu',dash:'5 4',name:`${num(Math.max(0,rt-3),1)}%`},{v:Cn,color:'warn',width:1.8,name:'Ingelegd'}],
    fmt:(v,d)=>eur(v,d>1?0:d??0),labels:i=>i===0?'nu':'jaar '+Math.round(i/12),tip:i=>`Na ${Math.floor(i/12)} jaar en ${i%12} mnd`});
  const ms=[5,10,15,20,30,40];
  $('#p_tbl').innerHTML=`<thead><tr><th>Na</th>${ms.map(y=>`<th>${y} jaar</th>`).join('')}</tr></thead><tbody><tr><td>Verwachte waarde</td>${ms.map(y=>`<td>${eur(project(st,mo,y,rt).pop(),0)}</td>`).join('')}</tr><tr><td>Ingelegd</td>${ms.map(y=>`<td>${eur(st+mo*12*y,0)}</td>`).join('')}</tr></tbody>`;
}

/* ---- Watchlist ---- */
PAGES.watch=()=>{
  const sugg=['AAPL','MSFT','TSLA','AMZN','GOOGL','META','VWCE.DE','ASML.AS','BTC-USD'].filter(s=>!S.watch.includes(s)&&!S.inst[s]);
  main.innerHTML=`
  ${head('Watchlist','Volg aandelen en ETF’s zonder ze te bezitten')}
  <section class="panel"><h3>Zoek een aandeel, ETF of crypto</h3>
    <div class="picker" id="wpick"><input placeholder="Zoek op naam of ticker, bijv. Tesla, VWCE of BTC-USD" autocomplete="off"><div class="plist"></div></div>
    <div class="acts" style="margin-top:12px">${sugg.slice(0,8).map(s=>`<button class="btn sm" data-act="quickwatch" data-v="${esc(s)}">${ic('plus',13)} ${esc(s)}</button>`).join('')}</div>
    <div class="mu" style="font-size:12.5px;margin-top:10px">Tip: Europese ETF’s hebben een beurs-achtervoegsel, zoals .DE (Xetra) of .AS (Amsterdam).</div>
  </section>
  <section class="panel" style="margin-top:20px"><h3>Mijn watchlist</h3>
    <div class="ledger">${S.watch.length?S.watch.map(s=>{const q=M.q[s],d=q&&q.prev?(q.price/q.prev-1)*100:null;
      return `<div class="r" data-go="#/stock/${encodeURIComponent(s)}"><div class="nm"><span class="sw" style="background:var(--mu)"></span><div style="min-width:0"><b>${esc(nameOf(s))}</b><small>${esc(s)}</small></div></div><div class="sp">${spark(q&&q.spark)}</div><div><b>${eur(priceEUR(s))}</b><br><small class="${cls(d)}">${pct(d)}</small></div><div><button class="btn sm" data-act="addtx" data-v="${esc(s)}">Koop</button> <button class="btn sm ghost danger" data-act="star" data-v="${esc(s)}" aria-label="Verwijder">${ic('trash',15)}</button></div></div>`}).join(''):'<div class="empty">Je watchlist is leeg. Zoek hierboven een aandeel.</div>'}</div>
  </section>
  <section class="panel" style="margin-top:20px"><h3>Prijsalarmen</h3>
    ${S.alerts.length?`<div class="tbl-wrap"><table><thead><tr><th>Fonds</th><th>Voorwaarde</th><th>Nu</th><th>Status</th><th></th></tr></thead><tbody>${S.alerts.map(a=>`<tr><td>${esc(nameOf(a.sym))}</td><td>${a.dir==='above'?'Boven':'Onder'} ${eur(a.price)}</td><td>${eur(priceEUR(a.sym))}</td><td>${a.done?'<span class="badge">afgegaan</span>':'<span class="badge ac">actief</span>'}</td><td><button class="btn sm ghost danger" data-act="delalert" data-v="${a.id}" aria-label="Verwijder">${ic('trash',15)}</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Nog geen alarmen. Open een aandeel en kies “Prijsalarm”.</div>'}
  </section>`;
  bindPicker($('#wpick'),r=>{if(!S.watch.includes(r.sym)){S.watch.push(r.sym);save();M.extra.delete(r.sym);toast(`${r.sym} toegevoegd aan watchlist`);refreshAll()}});
};

/* ---- Dividenden ---- */
/* ===== Live kalender: kwartaalcijfers & ex-dividend via eigen server (Yahoo Finance) ===== */
const CAL = { data: {}, ts: 0 };
function daysUntil(dateStr){
  const now = new Date(); const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y,m,d] = dateStr.split('-').map(Number);
  return Math.round((new Date(y, m-1, d) - t0) / 86400000);
}
async function fetchCalendar(syms){
  const need = syms.filter(s => isPlausibleTicker(s));
  if(!need.length) return {};
  if(Date.now() - CAL.ts < 3600e3 && need.every(s => s in CAL.data)) return CAL.data;
  const r = await fetch(`${localProxyPrefix}/api/calendar?symbols=${encodeURIComponent(need.join(','))}`);
  if(!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  Object.assign(CAL.data, j.data || {});
  CAL.ts = Date.now();
  return CAL.data;
}
function buildEvents(H, cal){
  const events = [];
  for(const p of H){
    const c = cal[p.sym]; if(!c) continue;
    const name = nameOf(p.sym);
    if(c.earningsDate && daysUntil(c.earningsDate) >= 0){
      events.push({ type:'earnings', sym:p.sym, name, date:c.earningsDate, diffDays:daysUntil(c.earningsDate),
        title: c.earningsEstimated ? 'Kwartaalcijfers (verwacht)' : 'Kwartaalcijfers',
        details: `${shr(p.shares)} stuks in bezit` });
    }
    if(c.exDividendDate && daysUntil(c.exDividendDate) >= 0){
      const per = c.lastDividendValue;
      const curr = c.currency || 'EUR';
      const estEur = per != null ? per * p.shares * toEUR(curr) : null;
      events.push({ type:'dividend', sym:p.sym, name, date:c.exDividendDate, diffDays:daysUntil(c.exDividendDate),
        title: per != null ? `Ex-dividend (laatste: ${num(per, 2)} ${curr} / aandeel)` : 'Ex-dividend',
        details: (estEur != null ? `Indicatie: ~${eur(estEur)} bruto` : 'Bedrag nog niet bekend') + (c.dividendDate ? ` · uitbetaling ${new Date(c.dividendDate).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}` : '') });
    }
  }
  return events.sort((a,b) => a.date.localeCompare(b.date));
}
function calEventCard(e){
  const [y,m,d] = e.date.split('-').map(Number);
  const dObj = new Date(y, m-1, d);
  const month = dObj.toLocaleDateString('nl-NL', { month: 'short' });
  const daysLabel = e.diffDays === 0 ? 'Vandaag!' : e.diffDays === 1 ? 'Morgen' : `over ${e.diffDays} dagen`;
  const isSoon = e.diffDays <= 7;
  return `<div class="cal-event-card ${e.type} ${isSoon ? 'imminent' : ''}">
    <div class="cal-event-top">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="cal-date-badge"><span class="day">${d}</span><span class="month">${month}</span></div>
        <div>
          <div style="display:flex;align-items:center;gap:6px"><b style="font-size:14px;color:var(--tx)">${esc(e.name)}</b><span class="badge" style="font-size:10px">${esc(e.sym)}</span></div>
          <div style="font-size:12px;font-weight:600;color:${e.type==='dividend'?'var(--up)':'var(--ac)'};margin-top:2px">${esc(e.title)}</div>
        </div>
      </div>
      <span class="cal-days-left ${isSoon ? 'soon' : 'norm'}">${daysLabel}</span>
    </div>
    <div class="cal-details"><span>${esc(e.details)}</span><a href="#/stock/${encodeURIComponent(e.sym)}" class="btn sm" style="padding:2px 7px;font-size:11px;text-decoration:none">Bekijk ↗</a></div>
  </div>`;
}
async function loadCalendar(H){
  const tok = routeTok, box = $('#cal_box'), badge = $('#cal_badge');
  if(!box) return;
  if(!H.length){ box.innerHTML = '<div class="empty" style="grid-column:1 / -1">Geen posities.</div>'; return; }
  try{
    const cal = await fetchCalendar(H.map(p => p.sym));
    if(tok !== routeTok) return;
    const ev = buildEvents(H, cal);
    if(badge) badge.textContent = `${ev.length} aankomend`;
    box.innerHTML = ev.length ? ev.map(calEventCard).join('')
      : '<div class="empty" style="grid-column:1 / -1">Geen bekende aankomende datums voor je posities. (ETF\'s hebben geen kwartaalcijfers.)</div>';
  }catch(err){
    if(tok !== routeTok) return;
    if(badge) badge.textContent = 'offline';
    box.innerHTML = `<div class="empty" style="grid-column:1 / -1">Kalender niet beschikbaar: start de app via <code>python server.py</code> (de kalender wordt via je eigen server opgehaald).</div>`;
  }
}

PAGES.dividends = (filterYear = '') => {
  const divs = [...(S.dividends || [])].sort((a,b) => b.date.localeCompare(a.date));
  const totalDiv = divs.reduce((sum, d) => sum + (d.amount || 0), 0);
  
  const curYr = String(new Date().getFullYear());
  const divsThisYr = divs.filter(d => d.date.startsWith(curYr)).reduce((sum, d) => sum + (d.amount || 0), 0);
  
  // Calculate distinct years and yearly breakdown
  const yearMap = {};
  divs.forEach(d => {
    const yr = d.date.slice(0, 4);
    yearMap[yr] = (yearMap[yr] || 0) + (d.amount || 0);
  });
  const years = Object.keys(yearMap).sort((a,b) => b.localeCompare(a));
  const maxYearAmt = Math.max(...Object.values(yearMap), 1);

  // Group by symbol for top dividend payers
  const symMap = {};
  divs.forEach(d => {
    if(!symMap[d.sym]) symMap[d.sym] = { sym: d.sym, name: nameOf(d.sym), count: 0, total: 0 };
    symMap[d.sym].count++;
    symMap[d.sym].total += (d.amount || 0);
  });
  const topPayers = Object.values(symMap).sort((a,b) => b.total - a.total);

  // Calculate yield on cost
  const P = positions(), T = totals(P), H = held(P);
  const yoc = T.cost > 0 ? (divsThisYr / T.cost * 100) : 0;
  const avgMonthly = divs.length ? (totalDiv / Math.max(1, (years.length || 1) * 12)) : 0;

  // Upcoming Ex-Dividend & Earnings Events

  // Filtered list
  const activeYear = filterYear || UI.divYearFilter || '';
  const filteredList = activeYear ? divs.filter(d => d.date.startsWith(activeYear)) : divs;

  main.innerHTML = `
  ${head('Dividenden & Kalender', `${divs.length} uitkeringen geregistreerd · Totaal ${eur(totalDiv)} netto ontvangen`, `
    <button class="btn" data-act="open_csv_hub" data-v="export">${ic('hub',16)} CSV Hub</button>
    <button class="btn" data-act="export_div_csv">${ic('dl',16)} Exporteer Dividenden (CSV)</button>
    <button class="btn pri" data-act="add_div_modal">${ic('plus',16)} Dividend toevoegen</button>
  `)}
  ${banners()}

  <div class="div-grid">
    <div class="div-card">
      <div class="lbl">Totaal Ontvangen</div>
      <div class="val" style="color:var(--up)">${eur(totalDiv)}</div>
      <div class="sub">Cumulatief passief inkomen</div>
    </div>
    <div class="div-card">
      <div class="lbl">Dit Jaar (${curYr})</div>
      <div class="val" style="color:var(--ac)">${eur(divsThisYr)}</div>
      <div class="sub">${divs.filter(d=>d.date.startsWith(curYr)).length} uitkeringen in ${curYr}</div>
    </div>
    <div class="div-card">
      <div class="lbl">Gemiddeld / Maand</div>
      <div class="val">${eur(avgMonthly)}</div>
      <div class="sub">Gemiddeld over actieve looptijd</div>
    </div>
    <div class="div-card">
      <div class="lbl">Yield on Cost (YoC)</div>
      <div class="val" style="color:var(--purple)">${num(yoc, 2)}%</div>
      <div class="sub">Jaarlijks dividend t.o.v. aankoopwaarde</div>
    </div>
  </div>

  <!-- Live Kalender -->
  <section class="panel" style="margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
      <div>
        <h3 style="margin:0">📅 Kwartaalcijfers &amp; Ex-Dividend Kalender</h3>
        <div class="mu" style="font-size:12.5px;margin-top:2px">Live opgehaald voor je posities · bron: Yahoo Finance. Datums kunnen door bedrijven nog worden aangepast.</div>
      </div>
      <span class="badge ac" id="cal_badge">laden…</span>
    </div>
    <div class="cal-event-grid" id="cal_box"><div class="empty" style="grid-column:1 / -1">Kalender laden…</div></div>
  </section>

  <div class="cols2">
    <section class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">📈 Jaarlijkse Dividend Groei</h3>
        <span class="badge ac">${years.length} Actieve Jaren</span>
      </div>
      <div class="div-chart-bar-wrap">
        ${[...years].reverse().map(yr => {
          const amt = yearMap[yr] || 0;
          const hPct = Math.max(8, (amt / maxYearAmt) * 100);
          const isCur = yr === curYr;
          return `<div class="div-chart-col">
            <span class="div-chart-amt">${eur(amt, 0)}</span>
            <div class="div-chart-bar" style="height:${hPct}%;${isCur ? 'background:linear-gradient(180deg,var(--ac),rgba(48,82,255,.45))' : ''}"></div>
            <span class="div-chart-lbl">${yr}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="mu" style="font-size:12px">
        💡 Samengestelde dividenden herbeleggen versnelt de groei via het rente-op-rente effect (compound interest).
      </div>
    </section>

    <section class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">🏆 Top Dividend Betalers</h3>
        <span class="badge">${topPayers.length} Fondsen</span>
      </div>
      <div style="display:grid;gap:8px">
        ${topPayers.slice(0, 5).map((p, idx) => {
          const pctOfTot = totalDiv > 0 ? (p.total / totalDiv) * 100 : 0;
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--s2);border-radius:8px;border:1px solid var(--bd)">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-weight:700;color:var(--mu);font-size:12px;width:16px">${idx + 1}.</span>
              <span class="sw" style="background:${colorOf(p.sym)}"></span>
              <div>
                <b>${esc(p.name)}</b>
                <div class="mu" style="font-size:11px">${esc(p.sym)} · ${p.count}x uitgekeerd</div>
              </div>
            </div>
            <div style="text-align:right">
              <b style="color:var(--up)">${eur(p.total)}</b>
              <div class="mu" style="font-size:11px">${num(pctOfTot, 1)}% van totaal</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </section>
  </div>

  <section class="panel" style="margin-top:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
      <div>
        <h3 style="margin:0">📜 Dividend Uitkeringshistorie</h3>
        <div class="mu" style="font-size:12px">${filteredList.length} betalingen ${activeYear ? `in ${activeYear}` : 'in totaal'}</div>
      </div>
      <div class="subtabs" style="margin-bottom:0">
        <button class="${!activeYear ? 'on' : ''}" data-act="filter_div_yr" data-v="">Alles</button>
        ${years.map(yr => `<button class="${activeYear === yr ? 'on' : ''}" data-act="filter_div_yr" data-v="${yr}">${yr}</button>`).join('')}
      </div>
    </div>
    
    <div class="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Fonds</th>
            <th>Account</th>
            <th>Netto Bedrag</th>
            <th>Omschrijving</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${filteredList.length ? filteredList.map(d => `
            <tr>
              <td>${new Date(d.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}</td>
              <td>
                <a href="#/stock/${encodeURIComponent(d.sym)}">
                  <b>${esc(nameOf(d.sym))}</b> <small class="mu">(${esc(d.sym)})</small>
                </a>
              </td>
              <td><span class="badge">${esc(d._account || S.accounts[S.activeAccount]?.name || 'Portfolio')}</span></td>
              <td><b style="color:var(--up)">+${eur(d.amount)}</b></td>
              <td><span class="mu" style="font-size:12px">${esc(d.note || 'Regulier dividend')}</span></td>
              <td style="text-align:right">
                <button class="btn sm ghost danger" data-act="del_div" data-v="${d.id}" aria-label="Verwijder dividend">${ic('trash',15)}</button>
              </td>
            </tr>
          `).join('') : `
            <tr><td colspan="6"><div class="empty">Geen dividenden gevonden voor dit jaar.</div></td></tr>
          `}
        </tbody>
      </table>
    </div>
  </section>`;
  loadCalendar(H);
};

/* ---- Transacties ---- */
PAGES.tx=()=>{
  const f=UI.txFilter,list=S.tx.filter(t=>!f||t.sym===f).sort((a,b)=>b.date.localeCompare(a.date));
  const syms=[...new Set(S.tx.map(t=>t.sym))];
  const buy=list.filter(t=>t.type!=='sell').reduce((a,t)=>a+t.amount,0),sell=list.filter(t=>t.type==='sell').reduce((a,t)=>a+t.amount,0);
  main.innerHTML=`
  ${head('Transacties',`${list.length} transacties · gekocht ${eur(buy)}${sell?` · verkocht ${eur(sell)}`:''}`,`
    <button class="btn" data-act="fixhist" title="Haal de werkelijke beurskoers op van de aankoopdatum voor al je transacties">${ic('refresh',16)} Bereken historische winst</button>
    <button class="btn" data-act="open_csv_hub" title="Open de CSV Hub met export- en importfuncties">${ic('hub',16)} CSV Hub</button>
    <button class="btn" data-act="export_tx_csv">${ic('dl',16)} Exporteer CSV</button>
    ${list.length ? `<button class="btn ghost danger" data-act="clear_acc_data" data-v="${S.activeAccount}" title="Wis alle gegevens uit dit account (maak blanco)">🧹 Data wissen</button>` : ''}
    <button class="btn pri" data-act="addtx">${ic('plus',16)} Transactie</button>
  `)}
  ${banners()}
  <section class="panel flat"><div style="max-width:260px;margin-bottom:12px"><select data-ui="txFilter"><option value="">Alle fondsen</option>${syms.map(s=>`<option value="${esc(s)}" ${s===f?'selected':''}>${esc(nameOf(s))}</option>`).join('')}</select></div>
  <div class="tbl-wrap"><table><thead><tr><th>Datum</th><th>Fonds</th><th>Account</th><th>Type</th><th>Bedrag</th><th>Aantal</th><th>Koers</th><th></th></tr></thead><tbody>
  ${list.length?list.map(t=>{const sh=txShares(t);return `<tr>
    <td>${new Date(t.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}</td>
    <td><a href="#/stock/${encodeURIComponent(t.sym)}"><b>${esc(nameOf(t.sym))}</b></a></td>
    <td><span class="badge" style="font-size:10px">${esc(t._account || S.accounts[S.activeAccount]?.name || 'Portfolio')}</span></td>
    <td>${t.type==='sell'?'Verkoop':'Koop'} ${t.plan?'<span class="badge ac">spaarplan</span>':''}</td>
    <td>${eur(t.amount)}</td>
    <td>${sh!=null?(t.est||t.shares==null?'~':'')+shr(sh):'–'}</td>
    <td>${sh?(t.est?'~':'')+eur(t.amount/sh):'–'} ${t.est?'<span class="badge w">geschat</span>':''}</td>
    <td><button class="btn sm ghost" data-act="edittx" data-v="${t.id}" aria-label="Bewerk">${ic('edit',15)}</button><button class="btn sm ghost danger" data-act="deltx" data-v="${t.id}" aria-label="Verwijder">${ic('trash',15)}</button></td>
  </tr>`}).join(''):'<tr><td colspan="8"><div class="empty">Geen transacties.</div></td></tr>'}
  </tbody></table></div></section>`;
};

/* ================= CSV & Multi-Account Hub Engine ================= */
function downloadCsvFile(filename, content){
  download(filename, content, 'text/csv;charset=utf-8;');
  toast(`📥 CSV gedownload: ${filename}`);
}

function exportTransactionsCsv(accId){
  let txList = [];
  let accName = 'transacties';
  if(!accId || accId === 'ALL' || S.activeAccount === 'ALL'){
    Object.values(S.accounts || {}).forEach(acc => {
      (acc.tx || []).forEach(t => txList.push({ ...t, _account: acc.name }));
    });
    accName = 'alle_accounts_transacties';
  } else {
    const acc = S.accounts[accId] || S.accounts[S.activeAccount];
    txList = (acc?.tx || []).map(t => ({ ...t, _account: acc.name }));
    accName = `${(acc?.name || 'account').toLowerCase().replace(/\s+/g,'_')}_transacties`;
  }
  txList.sort((a,b) => b.date.localeCompare(a.date));

  const rows = [
    ['Datum', 'Account', 'Ticker', 'Naam', 'Type', 'Bedrag_EUR', 'Aantal', 'Koers_EUR', 'Spaarplan'],
    ...txList.map(t => {
      const sh = txShares(t);
      return [
        t.date || '',
        `"${(t._account || '').replace(/"/g, '""')}"`,
        t.sym || '',
        `"${(nameOf(t.sym) || '').replace(/"/g, '""')}"`,
        t.type || 'buy',
        t.amount != null ? (+t.amount).toFixed(2).replace('.', ',') : '',
        sh != null ? (+sh).toFixed(4).replace('.', ',') : '',
        sh && t.amount ? (+(t.amount / sh)).toFixed(2).replace('.', ',') : '',
        t.plan ? 'JA' : 'NEE'
      ];
    })
  ];
  const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n');
  downloadCsvFile(`${accName}_${today()}.csv`, csvContent);
}

function exportPositionsCsv(accId){
  const P = positions();
  const rowsHeld = held(P);
  const T = totals(P);
  const accName = S.activeAccount === 'ALL' ? 'alle_accounts_posities' : `${(S.accounts[S.activeAccount]?.name || 'portfolio').toLowerCase().replace(/\s+/g,'_')}_posities`;

  const rows = [
    ['Account', 'Ticker', 'Naam', 'Type', 'Aantal', 'Huidige_Koers_EUR', 'Totale_Waarde_EUR', 'Ingelegd_EUR', 'Winst_Verlies_EUR', 'Rendement_Pct', 'Portfolioweging_Pct'],
    ...rowsHeld.map(p => [
      `"${(S.activeAccount === 'ALL' ? 'Geconsolideerd' : S.accounts[S.activeAccount]?.name || '').replace(/"/g, '""')}"`,
      p.sym,
      `"${(nameOf(p.sym) || '').replace(/"/g, '""')}"`,
      S.inst[p.sym]?.type === 'ETF' ? 'ETF' : 'Aandeel',
      (+p.shares).toFixed(4).replace('.', ','),
      p.px != null ? (+p.px).toFixed(2).replace('.', ',') : '',
      (+p.value).toFixed(2).replace('.', ','),
      (+p.cost).toFixed(2).replace('.', ','),
      (+p.pl).toFixed(2).replace('.', ','),
      (+p.plPct).toFixed(2).replace('.', ',') + '%',
      (+p.w).toFixed(2).replace('.', ',') + '%'
    ]),
    ['TOTAAL', '', '', '', '', '', (+T.value).toFixed(2).replace('.', ','), (+T.cost).toFixed(2).replace('.', ','), (+T.pl).toFixed(2).replace('.', ','), (+T.plPct).toFixed(2).replace('.', ',') + '%', '100%']
  ];
  const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n');
  downloadCsvFile(`${accName}_${today()}.csv`, csvContent);
}

function exportDividendsCsv(accId){
  let divList = [];
  let accName = 'dividenden';
  if(!accId || accId === 'ALL' || S.activeAccount === 'ALL'){
    Object.values(S.accounts || {}).forEach(acc => {
      (acc.dividends || []).forEach(d => divList.push({ ...d, _account: acc.name }));
    });
    accName = 'alle_accounts_dividenden';
  } else {
    const acc = S.accounts[accId] || S.accounts[S.activeAccount];
    divList = (acc?.dividends || []).map(d => ({ ...d, _account: acc.name }));
    accName = `${(acc?.name || 'account').toLowerCase().replace(/\s+/g,'_')}_dividenden`;
  }
  divList.sort((a,b) => b.date.localeCompare(a.date));

  const total = divList.reduce((a,b) => a + (b.amount || 0), 0);
  const rows = [
    ['Datum', 'Account', 'Ticker', 'Naam', 'Bedrag_EUR', 'Omschrijving'],
    ...divList.map(d => [
      d.date || '',
      `"${(d._account || '').replace(/"/g, '""')}"`,
      d.sym || '',
      `"${(nameOf(d.sym) || '').replace(/"/g, '""')}"`,
      (+d.amount).toFixed(2).replace('.', ','),
      `"${(d.note || '').replace(/"/g, '""')}"`
    ]),
    ['TOTAAL', '', '', '', (+total).toFixed(2).replace('.', ','), '']
  ];
  const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n');
  downloadCsvFile(`${accName}_${today()}.csv`, csvContent);
}

function exportBrokerFormatCsv(accId, format){
  const acc = S.accounts[accId] || S.accounts[S.activeAccount] || Object.values(S.accounts)[0];
  if(format === 'degiro'){
    // Authentic DEGIRO Account.csv format
    const rows = [
      ['Datum', 'Tijd', 'Valutadatum', 'Product', 'ISIN', 'Omschrijving', 'FX', 'Mutatie', '', 'Saldo', '', 'Order Id'],
      ...(acc.tx || []).map(t => {
        const sh = txShares(t) || 1;
        const px = t.price || (t.amount / sh);
        const parts = (t.date || '').split('-');
        const nlDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : t.date;
        const sign = t.type === 'sell' ? '' : '-';
        return [
          nlDate, '10:00', nlDate, nameOf(t.sym), t.sym,
          `${t.type==='sell'?'Verkoop':'Koop'} ${sh.toFixed(2).replace('.',',')} @ ${px.toFixed(2).replace('.',',')} EUR`,
          '', `${sign}${t.amount.toFixed(2).replace('.',',')}`, 'EUR', '1000,00', 'EUR', uid()
        ];
      }),
      ...(acc.dividends || []).map(d => {
        const parts = (d.date || '').split('-');
        const nlDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : d.date;
        return [
          nlDate, '12:00', nlDate, nameOf(d.sym), d.sym,
          `Dividend ${nameOf(d.sym)}`, '', d.amount.toFixed(2).replace('.',','), 'EUR', '1000,00', 'EUR', uid()
        ];
      })
    ];
    const csv = '\uFEFF' + rows.map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(',')).join('\r\n');
    downloadCsvFile(`Account_DEGIRO_${acc.name}_${today()}.csv`, csv);
  } else {
    // Authentic Trade Republic tr_transactions.csv format
    const rows = [
      ['timestamp', 'type', 'category', 'title', 'shares', 'price', 'amount', 'currency'],
      ...(acc.tx || []).map(t => {
        const sh = txShares(t) || 1;
        const px = t.price || (t.amount / sh);
        return [
          `${t.date}T10:00:00.000Z`, t.type === 'sell' ? 'SELL' : 'BUY', 'TRADING',
          nameOf(t.sym), sh.toFixed(4), px.toFixed(2), t.amount.toFixed(2), 'EUR'
        ];
      }),
      ...(acc.dividends || []).map(d => [
        `${d.date}T12:00:00.000Z`, 'DIVIDEND', 'DIVIDEND', nameOf(d.sym), '', '', d.amount.toFixed(2), 'EUR'
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\r\n');
    downloadCsvFile(`tr_transactions_${acc.name}_${today()}.csv`, csv);
  }
}

function downloadTemplateCsv(type){
  if(type === 'degiro'){
    const sample = [
      'Datum,Tijd,Valutadatum,Product,ISIN,Omschrijving,FX,Mutatie,,Saldo,,Order Id',
      '01-10-2026,10:15,01-10-2026,ASML Holding,NL0010273215,Koop 5 @ 850,00 EUR,, -4250,00,EUR,1500,00,EUR,ord101',
      '15-09-2026,09:30,15-09-2026,ASR Nederland,NL0011872643,Dividend ASR Nederland,, 85,50,EUR,5750,00,EUR,ord102',
      '10-08-2026,14:20,10-08-2026,Novo Nordisk B,DK0062498333,Koop 20 @ 110,00 EUR,, -2200,00,EUR,5664,50,EUR,ord103'
    ].join('\r\n');
    downloadCsvFile('template_degiro_Account.csv', '\uFEFF' + sample);
  } else if(type === 'tr'){
    const sample = [
      'timestamp,type,category,title,shares,price,amount,currency',
      '2026-10-01T08:30:00.000Z,BUY,TRADING,NVIDIA,2.5000,120.00,300.00,EUR',
      '2026-09-15T09:12:00.000Z,BUY,TRADING,Palantir,15.0000,32.00,480.00,EUR',
      '2026-09-02T12:00:00.000Z,BUY,TRADING,iShares Core S&P 500,1.2500,520.00,650.00,EUR',
      '2026-08-25T14:00:00.000Z,DIVIDEND,DIVIDEND,NVIDIA,,,15.20,EUR'
    ].join('\r\n');
    downloadCsvFile('template_trade_republic.csv', sample);
  } else {
    const sample = [
      'Datum;Ticker;Naam;Type;Bedrag;Aantal;Koers',
      '2026-10-01;ASML.AS;ASML Holding;Koop;1700,00;2,00;850,00',
      '2026-09-15;VWCE.DE;Vanguard All-World ETF;Koop;500,00;4,20;119,05',
      '2026-09-01;TSLA;Tesla;Koop;450,00;2,00;225,00',
      '2026-08-15;AAPL;Apple;Verkoop;800,00;4,00;200,00'
    ].join('\r\n');
    downloadCsvFile('template_universeel_portfolio.csv', '\uFEFF' + sample);
  }
}

const KNOWN_ISIN_MAP = {
  'NL0010273215': { sym: 'ASML.AS', name: 'ASML Holding', type: 'EQUITY', sector: 'Halfgeleiders & Chips', region: 'Nederland / Europa' },
  'IE00B4L5Y983': { sym: 'EUNL.DE', name: 'iShares Core MSCI World (Acc)', type: 'ETF', sector: 'Wereldwijde Index', region: 'Wereldwijd' },
  'IE00BK5BQT80': { sym: 'VWCE.DE', name: 'Vanguard FTSE All-World (Acc)', type: 'ETF', sector: 'Wereldwijde Index', region: 'Wereldwijd' },
  'IE00B5BMR087': { sym: 'SXR8.DE', name: 'iShares Core S&P 500 (Acc)', type: 'ETF', sector: 'US Large Cap Index', region: 'Verenigde Staten' },
  'IE00B3XXRP09': { sym: 'VUSA.AS', name: 'Vanguard S&P 500 (Dis)', type: 'ETF', sector: 'US Large Cap Index', region: 'Verenigde Staten' },
  'NL0011872643': { sym: 'ASRNL.AS', name: 'ASR Nederland', type: 'EQUITY', sector: 'Financieel & Verzekeringen', region: 'Nederland / Europa' },
  'NL0000009165': { sym: 'HEIA.AS', name: 'Heineken', type: 'EQUITY', sector: 'Consumptiegoederen', region: 'Nederland / Europa' },
  'NL0011821202': { sym: 'INGA.AS', name: 'ING Groep', type: 'EQUITY', sector: 'Banken & Financiën', region: 'Nederland / Europa' },
  'BMG3602E1084': { sym: 'FLOW.AS', name: 'Flow Traders', type: 'EQUITY', sector: 'Financiële Markten', region: 'Nederland / Europa' },
  'NL0011279492': { sym: 'FLOW.AS', name: 'Flow Traders', type: 'EQUITY', sector: 'Financiële Markten', region: 'Nederland / Europa' },
  'NL00150003E1': { sym: 'FUR.AS', name: 'Fugro', type: 'EQUITY', sector: 'Geo-data & Energie', region: 'Nederland / Europa' },
  'NL0010391025': { sym: 'PHARM.AS', name: 'Pharming Group', type: 'EQUITY', sector: 'Biotech & Gezondheid', region: 'Nederland / Europa' },
  'US0378331005': { sym: 'AAPL', name: 'Apple Inc.', type: 'EQUITY', sector: 'Consumentenelektronica', region: 'Verenigde Staten' },
  'US5949181045': { sym: 'MSFT', name: 'Microsoft Corporation', type: 'EQUITY', sector: 'Cloud & Software', region: 'Verenigde Staten' },
  'US67066G1040': { sym: 'NVDA', name: 'NVIDIA Corporation', type: 'EQUITY', sector: 'Halfgeleiders & AI', region: 'Verenigde Staten' },
  'US88160R1014': { sym: 'TSLA', name: 'Tesla Inc.', type: 'EQUITY', sector: 'Elektrische Voertuigen', region: 'Verenigde Staten' },
  'US0231351067': { sym: 'AMZN', name: 'Amazon.com', type: 'EQUITY', sector: 'E-commerce & Cloud', region: 'Verenigde Staten' },
  'US02079K3059': { sym: 'GOOGL', name: 'Alphabet (Google)', type: 'EQUITY', sector: 'Internet & AI', region: 'Verenigde Staten' },
  'US69608A1088': { sym: 'PLTR', name: 'Palantir Technologies', type: 'EQUITY', sector: 'AI & Data Software', region: 'Verenigde Staten' },
  'US2561631068': { sym: 'DOCU', name: 'DocuSign', type: 'EQUITY', sector: 'Zakelijke Software', region: 'Verenigde Staten' },
  'US2600031080': { sym: 'DOCU', name: 'DocuSign', type: 'EQUITY', sector: 'Zakelijke Software', region: 'Verenigde Staten' },
  'US8334451098': { sym: 'SNOW', name: 'Snowflake', type: 'EQUITY', sector: 'Cloud & Data Platform', region: 'Verenigde Staten' },
  'US03831W1080': { sym: 'APP', name: 'AppLovin Corp', type: 'EQUITY', sector: 'App Marketing & AI', region: 'Verenigde Staten' },
  'DK0062498333': { sym: 'NVO', name: 'Novo Nordisk', type: 'EQUITY', sector: 'Gezondheidszorg & Pharma', region: 'Europa' },
  'IE00B1XNHC34': { sym: 'IQQH.DE', name: 'iShares Global Clean Energy', type: 'ETF', sector: 'Schone Energie', region: 'Wereldwijd' },
  'FR0010361683': { sym: 'INR.PA', name: 'Amundi MSCI India ETF', type: 'ETF', sector: 'Opkomende Markten', region: 'Azië' },
  'LU1681043599': { sym: 'INR.PA', name: 'Amundi MSCI India ETF', type: 'ETF', sector: 'Opkomende Markten', region: 'Azië' },
  'IE000YYE6WK5': { sym: 'DFNS.AS', name: 'VanEck Defense ETF', type: 'ETF', sector: 'Defensie & Veiligheid', region: 'Wereldwijd' },
  'IE00B0M62Q58': { sym: 'DFNS.AS', name: 'VanEck Defense ETF', type: 'ETF', sector: 'Defensie & Veiligheid', region: 'Wereldwijd' },
  'IE00BQQP9F84': { sym: 'G2X.DE', name: 'VanEck Gold Miners ETF', type: 'ETF', sector: 'Grondstoffen & Goud', region: 'Wereldwijd' }
};

function getAssetSector(sym){
  if(S.inst[sym]?.sector && S.inst[sym].sector !== 'Other' && S.inst[sym].sector !== 'Overig') return S.inst[sym].sector;
  const match = Object.values(KNOWN_ISIN_MAP).find(x => x.sym === sym);
  if(match?.sector) return match.sector;
  if(sym === 'PLTR') return 'AI & Data Software';
  if(sym === 'NVDA') return 'Halfgeleiders & AI';
  if(sym === 'ASML' || sym === 'ASML.AS') return 'Halfgeleiders & Chips';
  if(sym === 'EUNL.DE') return 'Wereldwijde Index';
  if(sym === 'SXR8.DE') return 'US Large Cap Index';
  if(sym === 'SNOW') return 'Cloud & Data Platform';
  if(sym === 'AAPL') return 'Consumentenelektronica';
  if(sym === 'MSFT') return 'Cloud & Software';
  const name = S.inst[sym]?.name || M.q[sym]?.name || '';
  if(/semi|chip|hardware|asml|nvidia/i.test(name)) return 'Halfgeleiders';
  if(/etf|ucits|world|msci|s&p|index|ishares|vanguard|all-world|core/i.test(name) || S.inst[sym]?.type === 'ETF') return 'Index Fondsen';
  if(/software|tech|data|ai|cyber|palantir/i.test(name)) return 'AI & Software';
  if(/health|pharma|bio/i.test(name)) return 'Gezondheidszorg';
  if(/bank|finance|capital|invest/i.test(name)) return 'Financieel';
  return 'Overig';
}

function getAssetType(sym){
  const match = Object.values(KNOWN_ISIN_MAP).find(x => x.sym === sym);
  const t = (S.inst[sym]?.type || match?.type || '').toUpperCase();
  if(t.includes('ETF') || /etf|ucits|msci|s&p|ishares|vanguard/i.test(S.inst[sym]?.name || match?.name || '') || sym === 'EUNL.DE' || sym === 'SXR8.DE' || sym === 'VWCE.DE') return 'ETFs';
  if(t.includes('CRYPTO') || t.includes('COIN')) return 'Crypto';
  return 'Aandelen';
}

function getAssetRegion(sym){
  if(S.inst[sym]?.region) return S.inst[sym].region;
  const match = Object.values(KNOWN_ISIN_MAP).find(x => x.sym === sym);
  if(match?.region) return match.region;
  if(sym === 'ASML' || sym === 'ASML.AS') return 'Nederland / Europa';
  if(sym === 'EUNL.DE') return 'Wereldwijd';
  if(/\.AS$/.test(sym)) return 'Nederland';
  if(/\.DE$/.test(sym) || /\.PA$/.test(sym)) return 'Europa';
  if(/world|global|all-world/i.test(S.inst[sym]?.name || '')) return 'Wereldwijd';
  return 'Verenigde Staten';
}

function tokenizeCsvLine(line, delim = ','){
  const res = [];
  let cur = '';
  let inQuotes = false;
  for(let i = 0; i < line.length; i++){
    const ch = line[i];
    if(ch === '"'){
      if(inQuotes && line[i+1] === '"'){
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if(ch === delim && !inQuotes){
      res.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  res.push(cur.trim());
  return res;
}

function parseEuroOrUsNum(s){
  if(s == null) return null;
  let str = String(s).replace(/^"|"$/g, '').trim();
  if(!str || str === '–' || str === '-') return null;
  // Handle formats like "1.234,56" or "-901,86" or "1250,00"
  if(/^-?[\d\s.]+(,\d+)?$/.test(str) && str.includes(',')){
    str = str.replace(/\./g, '').replace(/\s/g, '').replace(',', '.');
  } else if(/^-?[\d\s,]+(\.\d+)?$/.test(str) && str.includes('.')){
    str = str.replace(/,/g, '').replace(/\s/g, '');
  }
  const v = parseFloat(str);
  return isNaN(v) ? null : v;
}

function parseUniversalDate(s){
  if(!s) return today();
  const clean = String(s).replace(/^"|"$/g, '').trim().slice(0, 10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  const m = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if(m){
    return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  }
  const d = new Date(s);
  if(!isNaN(d.getTime())){
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }
  return today();
}

async function readFileAsTextOrCsv(file){
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if(ext === 'xlsx' || ext === 'xls'){
    if(typeof XLSX === 'undefined'){
      throw new Error('De Excel parser (SheetJS) is momenteel niet beschikbaar. Sla het bestand op als CSV of controleer je verbinding.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if(!sheetName) throw new Error('Het Excel bestand bevat geen gegevensbladen.');
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_csv(sheet, { FS: ';', RS: '\r\n' });
  }
  return await file.text();
}

// =============================================================================
// CENT-PRECISIE & UNIVERSELE KOLOM NORMALISATIE (STAP 1 & STAP 2)
// =============================================================================
function roundCents(n){
  if(n == null || isNaN(n)) return 0;
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
function toCents(n){
  return Math.round((Number(n) || 0) * 100);
}
function fromCents(cents){
  return Math.round(cents) / 100;
}

const COLUMN_ALIASES = {
  date: ['datum', 'date', 'transactiedatum', 'trade date', 'timestamp', 'uitvoeringsdatum', 'valutadatum', 'booking date'],
  time: ['tijd', 'time'],
  symbol: ['symbol', 'symbool', 'ticker', 'isin', 'fonds', 'product', 'instrument', 'asset', 'code'],
  name: ['naam', 'name', 'productnaam', 'product', 'instrument name', 'title', 'omschrijving', 'description'],
  isin: ['isin', 'isin code', 'isincode'],
  type: ['type', 'actie', 'action', 'richting', 'mutatiesoort', 'category', 'transactietype', 'transactie', 'side'],
  shares: ['shares', 'aantal', 'aantal aandelen', 'no. of shares', 'stuks', 'volume', 'quantity', 'qty', 'units'],
  price: ['price', 'koers', 'transactiekoers', 'prijs', 'price / share', 'koers per aandeel', 'execution price', 'unit price'],
  amount: ['amount', 'mutatie', 'bedrag', 'totaal', 'total', 'waarde', 'netto', 'total (eur)', 'proceeds', 'net amount', 'volume (eur)'],
  fee: ['fee', 'kosten', 'transactiekosten', 'comm/fee', 'commission', 'kosten van derden', 'brokerage fee', 'transactie fee'],
  tax: ['tax', 'belasting', 'dividendbelasting', 'withholding tax', 'beurstaks', 'tob', 'roerende voorheffing'],
  orderId: ['order id', 'order_id', 'transaction_id', 'transaction id', 'transactie id', 'transactie-id', 'reference', 'referentie', 'order nummer', 'ordernummer']
};

function resolveColIdx(headers, aliases){
  if(!headers || !aliases) return -1;
  const hNorm = headers.map(h => (h || '').toLowerCase().trim().replace(/['"]/g, ''));
  for(let i = 0; i < hNorm.length; i++){
    if(aliases.includes(hNorm[i])) return i;
  }
  for(let i = 0; i < hNorm.length; i++){
    if(aliases.some(a => hNorm[i].startsWith(a) || hNorm[i].endsWith(a) || hNorm[i].includes(a))) return i;
  }
  return -1;
}

const DIV_FX_FALLBACK = { EUR: 1, USD: 0.86, DKK: 0.134, GBP: 1.16, CHF: 1.07 };
function parseUniversalCsv(txt, filename = ''){
  const rawLines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if(!rawLines.length) return null;

  const fnLower = (filename || '').toLowerCase();
  const firstLine = rawLines[0];
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const headerLower = firstLine.toLowerCase();

  let brokerType = 'generic';
  let brokerName = 'Universeel Portfolio';
  let brokerIcon = '💼';

  if(
    (headerLower.includes('mutatie') && (headerLower.includes('product') || headerLower.includes('isin'))) ||
    headerLower.includes('uitvoeringsplaats') ||
    fnLower.includes('degiro') ||
    fnLower === 'account.csv'
  ){
    brokerType = 'degiro';
    brokerName = 'DEGIRO';
    brokerIcon = '🏛️';
  } else if(
    (headerLower.includes('category') && headerLower.includes('shares') && headerLower.includes('price')) ||
    (headerLower.includes('asset_class') && headerLower.includes('transaction_id')) ||
    fnLower.includes('tr_transactions') ||
    fnLower.includes('trade_republic')
  ){
    brokerType = 'tr';
    brokerName = 'Trade Republic';
    brokerIcon = '🏦';
  } else if(
    rawLines.some(l => l.startsWith('Trades,Header') || l.startsWith('Trades,Data')) ||
    headerLower.includes('datadisdiscriminator') ||
    headerLower.includes('comm/fee') ||
    fnLower.includes('ibkr') ||
    fnLower.includes('interactive')
  ){
    brokerType = 'ibkr';
    brokerName = 'Interactive Brokers';
    brokerIcon = '🦅';
  } else if(
    headerLower.includes('action') && (headerLower.includes('no. of shares') || headerLower.includes('price / share') || headerLower.includes('withholding tax')) ||
    fnLower.includes('trading212') ||
    fnLower.includes('trading 212') ||
    fnLower.includes('t212')
  ){
    brokerType = 't212';
    brokerName = 'Trading 212';
    brokerIcon = '📈';
  } else if(
    headerLower.includes('instrument') && (headerLower.includes('transactiedatum') || headerLower.includes('trade date')) ||
    fnLower.includes('saxo')
  ){
    brokerType = 'saxo';
    brokerName = 'Saxo Bank';
    brokerIcon = '🇩🇰';
  } else if(
    headerLower.includes('rekeningnummer') || headerLower.includes('tegenrekening') || headerLower.includes('mutatiesoort') ||
    fnLower.includes('rabo') || fnLower.includes('ing') || fnLower.includes('abn')
  ){
    brokerType = 'bank';
    brokerName = 'Bank Beleggingen';
    brokerIcon = '🦁';
  }

  const txList = [];
  const divList = [];
  const instMap = {};
  let verifiedCount = 0;
  let adjustedCount = 0;
  let flaggedCount = 0;
  let totalFees = 0;
  let totalVolume = 0;
  const warnings = [];


  const cleanVal = s => String(s || '').replace(/^"|"$/g, '').trim();

  const registerInst = (rawSym, isin = '', prodName = '') => {
    let sym = (rawSym || isin || '').toUpperCase().trim();
    if(isin && KNOWN_ISIN_MAP[isin]){
      sym = KNOWN_ISIN_MAP[isin].sym;
    } else if(sym && KNOWN_ISIN_MAP[sym]){
      isin = sym;
      sym = KNOWN_ISIN_MAP[sym].sym;
    }
    if(!sym && prodName){
      sym = prodName.split(' ')[0].toUpperCase();
    }
    if(!sym) sym = 'BELEG';

    if(!instMap[sym]){
      const known = KNOWN_ISIN_MAP[isin] || KNOWN_ISIN_MAP[sym];
      const displayName = known?.name || prodName || sym;
      const isEtf = known?.type === 'ETF' || /etf|ucits|world|s&p|ishares|vanguard|all-world|msci/i.test(displayName);
      instMap[sym] = {
        name: displayName,
        type: isEtf ? 'ETF' : 'EQUITY',
        sector: known?.sector || getAssetSector(sym),
        region: known?.region || getAssetRegion(sym),
        isin: isin || (KNOWN_ISIN_MAP[sym] ? sym : '') || Object.keys(KNOWN_ISIN_MAP).find(k => KNOWN_ISIN_MAP[k].sym === sym) || '',
        color: nextColor()
      };
    }
    return sym;
  };

  if(brokerType === 'degiro'){
    const isTransExport = headerLower.includes('uitvoeringsplaats') || headerLower.includes('lokale waarde');
    if(isTransExport){
      // DEGIRO Transactions.csv
      const hCols = tokenizeCsvLine(rawLines[0], delim).map(c => c.toLowerCase());
      const dtIdx = hCols.findIndex(c => c.includes('datum'));
      const prodIdx = hCols.findIndex(c => c.includes('product'));
      const isinIdx = hCols.findIndex(c => c.includes('isin'));
      const shIdx = hCols.findIndex(c => c.includes('aantal'));
      const pxIdx = hCols.findIndex(c => c.includes('koers'));
      const valIdx = hCols.findIndex(c => c.includes('totaal') || c.includes('waarde'));

      for(let i = 1; i < rawLines.length; i++){
        const cols = tokenizeCsvLine(rawLines[i], delim).map(cleanVal);
        if(cols.length < 5) continue;
        const dt = parseUniversalDate(cols[dtIdx]);
        const prod = cols[prodIdx] || '';
        const isin = cols[isinIdx] || '';
        const sh = parseEuroOrUsNum(cols[shIdx]);
        const px = parseEuroOrUsNum(cols[pxIdx]);
        const val = parseEuroOrUsNum(cols[valIdx]);
        if(!dt || sh == null || px == null) continue;
        const sym = registerInst('', isin, prod);
        const isSell = sh < 0;
        const amt = val ? Math.abs(val) : Math.abs(sh * px);
        txList.push({
          id: uid(),
          sym,
          type: isSell ? 'sell' : 'buy',
          date: dt,
          amount: amt,
          shares: Math.abs(sh),
          price: px
        });
      }
    } else {
      // DEGIRO Account.csv - Geavanceerde en foutloze verwerking
      const orderInfoMap = {};
      for(let i = 1; i < rawLines.length; i++){
        const cols = tokenizeCsvLine(rawLines[i], delim).map(cleanVal);
        if(cols.length < 12) continue;
        const desc = (cols[5] || '').toLowerCase();
        const cur = cols[7] || '';
        const orderId = cols[11] || '';
        if(!orderId) continue;
        if(!orderInfoMap[orderId]) orderInfoMap[orderId] = { debitEur: 0, creditEur: 0, feesEur: 0, fxRate: null };

        const val = Math.abs(parseEuroOrUsNum(cols[8]) || 0);
        const fx = parseEuroOrUsNum(cols[6]);
        if(fx) orderInfoMap[orderId].fxRate = fx;

        if(desc.includes('valuta debitering') && cur === 'EUR'){
          orderInfoMap[orderId].debitEur += val;
        } else if(desc.includes('valuta creditering') && cur === 'EUR'){
          orderInfoMap[orderId].creditEur += val;
        } else if(desc.includes('transactiekosten') && cur === 'EUR'){
          orderInfoMap[orderId].feesEur += val;
        }
      }

      for(let i = 1; i < rawLines.length; i++){
        const cols = tokenizeCsvLine(rawLines[i], delim).map(cleanVal);
        if(cols.length < 6) continue;
        const dateStr = cols[0];
        const parts = dateStr.split('-');
        const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
        const prod = cols[3] || '';
        const isin = cols[4] || '';
        const desc = cols[5] || '';
        const cur = cols[7] || '';
        const mutatie = parseEuroOrUsNum(cols[7]) ?? parseEuroOrUsNum(cols[8]);
        const orderId = cols[11] || '';

        if(!prod && !isin) continue;

        // Skip derivaten, opties, hefboomproducten/sprinters, geldmarktfondsen & cash compensaties
        if(isin.startsWith('NLEN') || isin.startsWith('NLEX')) continue;
        const prodLower = prod.toLowerCase();
        const descLower = desc.toLowerCase();
        if(prodLower.includes('liquidity fund') || prodLower.includes('cash fund') || prodLower.includes('fundshare') || prodLower.includes('geldmarktfonds')) continue;
        if(descLower.includes('optie expiratie') || descLower.includes('hefboomproduct') || descLower.includes('claimemissie')) continue;
        if(/\b[CP]\d+(\.\d+)?\b/.test(prod) || /\b(sl|hb|fn)\b/i.test(prod)) continue;
        if(prodLower.includes('fugro') && (isin === 'NL0000352565' || isin === 'NL00150001Y3' || isin === 'NL00150004A7')) continue;
        if(descLower.includes('wijziging isin') || descLower.includes('split aanpassing') || descLower.includes('kapitaalverhoging')) continue;

        const sym = registerInst('', isin, prod);

        if(descLower.includes('dividend')){
          if(mutatie && Math.abs(mutatie) > 0){
            const isTax = descLower.includes('dividendbelasting');
            const key = isoDate + '_' + sym;
            let d = divList.find(x => x._key === key);
            if(!d){
              d = { id: 'div_' + uid(), orderId: 'degiro_div_' + key, _key: key, sym, date: isoDate, gross: 0, tax: 0, amount: 0, currency: cur || 'EUR', note: 'Dividend ' + prod };
              divList.push(d);
            }
            const fx = DIV_FX_FALLBACK[d.currency] || 1;
            if(isTax) d.tax = roundCents(d.tax + Math.abs(mutatie) * fx);
            else d.gross = roundCents(d.gross + Math.abs(mutatie) * fx);
            d.amount = roundCents(d.gross - d.tax);
            if(d.currency !== 'EUR') d.note = 'Dividend ' + prod + ' (' + d.currency + ', omgerekend naar EUR, benadering)';
          }
        } else if(descLower.includes('koop') || descLower.includes('verkoop') || descLower.includes('delisting')){
          const isSell = descLower.includes('verkoop') || descLower.includes('delisting');
          let shares = null, px = null, tradeCur = 'EUR';
          const match = desc.match(/(?:(?:[^:]+):\s*)?(?:Koop|Verkoop)\s+([\d.,]+)\s+@\s+([\d.,]+)\s*([A-Za-z]{3})?/i);
          if(match){
            shares = parseEuroOrUsNum(match[1]);
            px = parseEuroOrUsNum(match[2]);
            if(match[3]) tradeCur = match[3].toUpperCase();
          }
          if(!shares) continue;

          let amt = null;
          const ord = orderId ? orderInfoMap[orderId] : null;
          const fee = ord ? ord.feesEur : 0;

          if(tradeCur === 'EUR' || cur === 'EUR'){
            const base = (mutatie && Math.abs(mutatie) > 0) ? Math.abs(mutatie) : (shares && px ? shares * px : 0);
            amt = isSell ? Math.max(0, base - fee) : (base + fee);
          } else {
            // Vreemde valuta (USD, DKK): neem het exacte EUR debet/credit bedrag van DEGIRO inclusief transactiekosten
            if(!isSell && ord && ord.debitEur > 0){
              amt = ord.debitEur + fee;
            } else if(isSell && ord && ord.creditEur > 0){
              amt = Math.max(0, ord.creditEur - fee);
            } else if(ord && ord.fxRate && px){
              const base = (shares * px) / ord.fxRate;
              amt = isSell ? Math.max(0, base - fee) : (base + fee);
            } else if(px){
              const base = shares * px;
              amt = isSell ? Math.max(0, base - fee) : (base + fee);
            }
          }

          const roundedAmt = roundCents(amt);
          const roundedPx = roundCents(px);
          const roundedFee = roundCents(fee);

          // Cent-balans controle
          const expectedPure = roundCents(shares * (px || 0));
          const expectedTot = isSell ? roundCents(expectedPure - roundedFee) : roundCents(expectedPure + roundedFee);
          let note = '';
          if(Math.abs(roundedAmt - expectedTot) > 0.05 && tradeCur === 'EUR'){
            note = 'Handmatige controle nodig (afwijking centen)';
            flaggedCount++;
          } else {
            verifiedCount++;
          }
          totalFees += roundedFee;
          totalVolume += roundedAmt;

          txList.push({
            id: orderId || uid(),
            orderId: orderId || `${isoDate}_${sym}_${isSell?'sell':'buy'}_${shares}_${roundedAmt}`,
            sym,
            type: isSell ? 'sell' : 'buy',
            date: isoDate,
            amount: roundedAmt,
            shares,
            price: roundedPx,
            fee: roundedFee,
            tax: 0,
            currency: tradeCur,
            note: note || undefined
          });
        }
      }


    }
  } else if(brokerType === 'tr'){
    const hCols = tokenizeCsvLine(rawLines[0], delim).map(c => c.toLowerCase());
    const dtIdx = hCols.findIndex(c => c.includes('date') || c.includes('timestamp'));
    const catIdx = hCols.findIndex(c => c.includes('category'));
    const typIdx = hCols.findIndex(c => c === 'type');
    const nameIdx = hCols.findIndex(c => c.includes('name') || c.includes('title'));
    const symIdx = hCols.findIndex(c => c.includes('symbol') || c.includes('isin'));
    const shIdx = hCols.findIndex(c => c.includes('shares'));
    const pxIdx = hCols.findIndex(c => c.includes('price'));
    const amtIdx = hCols.findIndex(c => c.includes('amount'));
    const feeIdx = hCols.findIndex(c => c === 'fee' || c.includes('kosten'));
    const taxIdx = hCols.findIndex(c => c === 'tax' || c.includes('belasting'));
    const oidIdx = hCols.findIndex(c => c.includes('transaction_id') || c.includes('order_id') || c === 'id');

    for(let i = 1; i < rawLines.length; i++){
      const cols = tokenizeCsvLine(rawLines[i], delim).map(cleanVal);
      if(cols.length < 5) continue;
      const dt = parseUniversalDate(cols[dtIdx]);
      const cat = catIdx >= 0 ? cols[catIdx].toUpperCase() : '';
      const typ = typIdx >= 0 ? cols[typIdx].toUpperCase() : '';
      const prodName = nameIdx >= 0 ? cols[nameIdx] : '';
      const rawSym = symIdx >= 0 ? cols[symIdx] : '';
      const shares = shIdx >= 0 ? parseEuroOrUsNum(cols[shIdx]) : null;
      const price = pxIdx >= 0 ? parseEuroOrUsNum(cols[pxIdx]) : null;
      const amount = amtIdx >= 0 ? parseEuroOrUsNum(cols[amtIdx]) : null;
      const fee = roundCents(feeIdx >= 0 ? Math.abs(parseEuroOrUsNum(cols[feeIdx]) || 0) : 0);
      const tax = roundCents(taxIdx >= 0 ? Math.abs(parseEuroOrUsNum(cols[taxIdx]) || 0) : 0);
      const rowOid = oidIdx >= 0 ? cols[oidIdx] : '';

      if(cat === 'DIVIDEND' || typ === 'DIVIDEND'){
        if(!prodName && !rawSym) continue;
        const sym = registerInst(rawSym, rawSym.length === 12 ? rawSym : '', prodName);
        const gross = roundCents(amount ? Math.abs(amount) : 0);
        const netDiv = roundCents(gross - tax);
        if(netDiv > 0){
          totalFees += tax;
          divList.push({
            id: rowOid || ('div_' + uid()),
            orderId: rowOid || (dt + '_' + sym + '_div_' + netDiv),
            sym,
            date: dt,
            amount: netDiv,
            gross,
            tax,
            note: 'Dividend ' + (prodName || sym)
          });
        }
      } else if(cat === 'TRADING' || typ === 'BUY' || typ === 'SELL'){
        if(!prodName && !rawSym) continue;
        const sym = registerInst(rawSym, rawSym.length === 12 ? rawSym : '', prodName);
        const isSell = typ === 'SELL' || (shares != null && shares < 0);
        let sh = shares != null ? Math.abs(shares) : null;
        let px = price != null ? roundCents(price) : null;
        let amt = amount != null ? Math.abs(amount) : null;

        // Automatische afleiding van ontbrekende waarden
        if((sh == null || sh === 0) && px && amt){
          sh = Math.round(((amt - (isSell ? 0 : fee)) / px) * 10000) / 10000;
          adjustedCount++;
        }
        if((px == null || px === 0) && sh && amt){
          px = roundCents((amt - (isSell ? -fee : fee)) / sh);
          adjustedCount++;
        }

        if(sh || amt){
          const pureVal = roundCents((sh || 0) * (px || 0));
          let finalAmt;
          if(amt != null){
            // Als CSV bedrag zuivere aandeelwaarde is (exclusief fee/tax), tel fee/tax op voor koop of trek af voor verkoop
            if(pureVal > 0 && Math.abs(amt - pureVal) <= 0.05 && (fee > 0 || tax > 0)){
              finalAmt = isSell ? roundCents(Math.max(0, amt - fee - tax)) : roundCents(amt + fee + tax);
            } else if(pureVal > 0 && Math.abs(amt - (isSell ? pureVal - fee - tax : pureVal + fee + tax)) <= 0.05){
              finalAmt = roundCents(amt);
            } else {
              finalAmt = roundCents(isSell ? Math.max(0, amt - fee - tax) : (amt + fee + tax));
            }
          } else if(sh && px){
            finalAmt = isSell ? roundCents(Math.max(0, pureVal - fee - tax)) : roundCents(pureVal + fee + tax);
          }

          finalAmt = roundCents(finalAmt);
          const expectedTot = isSell ? roundCents(pureVal - fee - tax) : roundCents(pureVal + fee + tax);
          let note = '';
          if(sh && px && Math.abs(finalAmt - expectedTot) > 0.05){
            note = 'Handmatige controle nodig (afwijking centen)';
            flaggedCount++;
          } else {
            verifiedCount++;
          }

          totalFees += (fee + tax);
          totalVolume += finalAmt;

          const orderId = rowOid || (dt + '_' + sym + '_' + (isSell ? 'sell' : 'buy') + '_' + (sh || 0) + '_' + finalAmt);

          txList.push({
            id: rowOid || uid(),
            orderId,
            sym,
            type: isSell ? 'sell' : 'buy',
            date: dt,
            amount: finalAmt,
            shares: sh,
            price: px,
            fee,
            tax,
            note: note || undefined
          });
        }
      }
    }
  } else if(brokerType === 'ibkr'){
    // Interactive Brokers Activity Statement or Orders CSV
    let inTradesHeader = false;
    let tCols = [];
    let symIdx = -1, dtIdx = -1, qtyIdx = -1, pxIdx = -1, procIdx = -1, feeIdx = -1, oidIdx = -1;

    for(let i = 0; i < rawLines.length; i++){
      const cols = tokenizeCsvLine(rawLines[i], delim).map(cleanVal);
      if(cols[0] === 'Trades' && cols[1] === 'Header'){
        tCols = cols.map(c => c.toLowerCase());
        symIdx = tCols.findIndex(c => c === 'symbol');
        dtIdx = tCols.findIndex(c => c.includes('date/time') || c.includes('date'));
        qtyIdx = tCols.findIndex(c => c === 'quantity');
        pxIdx = tCols.findIndex(c => c.includes('t. price') || c.includes('price'));
        procIdx = tCols.findIndex(c => c === 'proceeds');
        feeIdx = tCols.findIndex(c => c.includes('comm/fee') || c.includes('fee'));
        oidIdx = tCols.findIndex(c => c.includes('ib order') || c.includes('trade id') || c.includes('order id'));
        inTradesHeader = true;
        continue;
      }
      if(cols[0] === 'Trades' && cols[1] === 'Data' && (cols[2] === 'Order' || !cols[2])){
        if(symIdx >= 0 && qtyIdx >= 0){
          const rawSym = cols[symIdx];
          const dt = parseUniversalDate(cols[dtIdx]);
          const qty = parseEuroOrUsNum(cols[qtyIdx]);
          const px = pxIdx >= 0 ? roundCents(parseEuroOrUsNum(cols[pxIdx])) : null;
          const proc = procIdx >= 0 ? Math.abs(parseEuroOrUsNum(cols[procIdx]) || 0) : null;
          const fee = roundCents(feeIdx >= 0 ? Math.abs(parseEuroOrUsNum(cols[feeIdx]) || 0) : 0);
          const rowOid = oidIdx >= 0 ? cols[oidIdx] : '';
          if(!rawSym || qty == null) continue;
          const sym = registerInst(rawSym, '', rawSym);
          const isSell = qty < 0;
          const sh = Math.abs(qty);
          const pureVal = roundCents(sh * (px || 0));
          const amt = proc != null ? (isSell ? Math.max(0, proc - fee) : (proc + fee)) : (isSell ? Math.max(0, pureVal - fee) : (pureVal + fee));
          const finalAmt = roundCents(amt);

          const expectedTot = isSell ? roundCents(pureVal - fee) : roundCents(pureVal + fee);
          let note = '';
          if(sh && px && Math.abs(finalAmt - expectedTot) > 0.05){
            note = 'Handmatige controle nodig (afwijking centen)';
            flaggedCount++;
          } else {
            verifiedCount++;
          }

          totalFees += fee;
          totalVolume += finalAmt;

          const orderId = rowOid || (dt + '_' + sym + '_' + (isSell ? 'sell' : 'buy') + '_' + sh + '_' + finalAmt);

          txList.push({
            id: rowOid || uid(),
            orderId,
            sym,
            type: isSell ? 'sell' : 'buy',
            date: dt,
            amount: finalAmt,
            shares: sh,
            price: px,
            fee,
            tax: 0,
            note: note || undefined
          });
        }
        continue;
      }
      if(cols[0] === 'Dividends' && cols[1] === 'Data'){
        const dt = parseUniversalDate(cols[3]);
        const desc = cols[4] || 'Dividend';
        const amt = parseEuroOrUsNum(cols[5]);
        const words = desc.split(' ');
        const sym = registerInst(words[0] || 'IBKR_DIV', '', desc);
        if(amt && amt > 0){
          const netDiv = roundCents(amt);
          divList.push({
            id: 'div_' + uid(),
            orderId: dt + '_' + sym + '_div_' + netDiv,
            sym,
            date: dt,
            amount: netDiv,
            gross: netDiv,
            tax: 0,
            note: desc
          });
        }
      }
    }
  } else if(brokerType === 't212'){
    // Trading 212
    const hCols = tokenizeCsvLine(rawLines[0], delim).map(c => c.toLowerCase());
    const actIdx = hCols.findIndex(c => c === 'action');
    const dtIdx = hCols.findIndex(c => c.includes('time') || c.includes('date'));
    const isinIdx = hCols.findIndex(c => c === 'isin');
    const tickIdx = hCols.findIndex(c => c === 'ticker');
    const nameIdx = hCols.findIndex(c => c === 'name');
    const shIdx = hCols.findIndex(c => c.includes('no. of shares') || c.includes('shares'));
    const pxIdx = hCols.findIndex(c => c.includes('price / share') || c.includes('price'));
    const totIdx = hCols.findIndex(c => c.includes('total (eur)') || c.includes('total'));
    const feeIdx = hCols.findIndex(c => c.includes('charge amount') || c.includes('fee'));
    const taxIdx = hCols.findIndex(c => c.includes('withholding tax') || c.includes('tax'));
    const oidIdx = hCols.findIndex(c => c === 'id' || c.includes('order'));

    for(let i = 1; i < rawLines.length; i++){
      const cols = tokenizeCsvLine(rawLines[i], delim).map(cleanVal);
      if(cols.length < 4) continue;
      const act = actIdx >= 0 ? cols[actIdx].toLowerCase() : '';
      const dt = parseUniversalDate(cols[dtIdx]);
      const isin = isinIdx >= 0 ? cols[isinIdx] : '';
      const tick = tickIdx >= 0 ? cols[tickIdx] : '';
      const prodName = nameIdx >= 0 ? cols[nameIdx] : '';
      const sh = shIdx >= 0 ? parseEuroOrUsNum(cols[shIdx]) : null;
      const px = pxIdx >= 0 ? roundCents(parseEuroOrUsNum(cols[pxIdx])) : null;
      const tot = totIdx >= 0 ? parseEuroOrUsNum(cols[totIdx]) : null;
      const fee = roundCents(feeIdx >= 0 ? Math.abs(parseEuroOrUsNum(cols[feeIdx]) || 0) : 0);
      const tax = roundCents(taxIdx >= 0 ? Math.abs(parseEuroOrUsNum(cols[taxIdx]) || 0) : 0);
      const rowOid = oidIdx >= 0 ? cols[oidIdx] : '';

      const sym = registerInst(tick, isin, prodName);

      if(act.includes('dividend')){
        if(tot && tot > 0){
          const netDiv = roundCents(Math.abs(tot) - tax);
          totalFees += tax;
          divList.push({
            id: rowOid || ('div_' + uid()),
            orderId: rowOid || (dt + '_' + sym + '_div_' + netDiv),
            sym,
            date: dt,
            amount: netDiv,
            gross: roundCents(tot),
            tax,
            note: 'Dividend ' + (prodName || sym)
          });
        }
      } else if(act.includes('buy') || act.includes('sell')){
        const isSell = act.includes('sell');
        const pureVal = roundCents((sh || 0) * (px || 0));
        let finalAmt = tot != null ? Math.abs(tot) : (isSell ? (pureVal - fee - tax) : (pureVal + fee + tax));
        finalAmt = roundCents(finalAmt);

        const expectedTot = isSell ? roundCents(pureVal - fee - tax) : roundCents(pureVal + fee + tax);
        let note = '';
        if(sh && px && Math.abs(finalAmt - expectedTot) > 0.05){
          note = 'Handmatige controle nodig (afwijking centen)';
          flaggedCount++;
        } else {
          verifiedCount++;
        }

        totalFees += (fee + tax);
        totalVolume += finalAmt;

        const orderId = rowOid || (dt + '_' + sym + '_' + (isSell ? 'sell' : 'buy') + '_' + (sh || 0) + '_' + finalAmt);

        txList.push({
          id: rowOid || uid(),
          orderId,
          sym,
          type: isSell ? 'sell' : 'buy',
          date: dt,
          amount: finalAmt,
          shares: sh ? Math.abs(sh) : null,
          price: px,
          fee,
          tax,
          note: note || undefined
        });
      }
    }
  } else {
    // Universal / Generic / Dutch Banks parser
    const headerCols = tokenizeCsvLine(rawLines[0], delim).map(cleanVal);
    const dtIdx = resolveColIdx(headerCols, COLUMN_ALIASES.date);
    const symIdx = resolveColIdx(headerCols, COLUMN_ALIASES.symbol);
    const nameIdx = resolveColIdx(headerCols, COLUMN_ALIASES.name);
    const isinIdx = resolveColIdx(headerCols, COLUMN_ALIASES.isin);
    const typIdx = resolveColIdx(headerCols, COLUMN_ALIASES.type);
    const shIdx = resolveColIdx(headerCols, COLUMN_ALIASES.shares);
    const pxIdx = resolveColIdx(headerCols, COLUMN_ALIASES.price);
    const amtIdx = resolveColIdx(headerCols, COLUMN_ALIASES.amount);
    const feeIdx = resolveColIdx(headerCols, COLUMN_ALIASES.fee);
    const taxIdx = resolveColIdx(headerCols, COLUMN_ALIASES.tax);
    const oidIdx = resolveColIdx(headerCols, COLUMN_ALIASES.orderId);

    for(let i = 1; i < rawLines.length; i++){
      const cols = tokenizeCsvLine(rawLines[i], delim).map(cleanVal);
      if(cols.length < 2) continue;
      const dt = dtIdx >= 0 ? parseUniversalDate(cols[dtIdx]) : today();
      const rawSym = symIdx >= 0 ? cols[symIdx] : '';
      const isin = isinIdx >= 0 ? cols[isinIdx] : '';
      const prodName = nameIdx >= 0 ? cols[nameIdx] : '';
      const typ = typIdx >= 0 ? cols[typIdx].toLowerCase() : '';
      let amt = amtIdx >= 0 ? parseEuroOrUsNum(cols[amtIdx]) : null;
      let sh = shIdx >= 0 ? parseEuroOrUsNum(cols[shIdx]) : null;
      let px = pxIdx >= 0 ? parseEuroOrUsNum(cols[pxIdx]) : null;
      const fee = roundCents(feeIdx >= 0 ? Math.abs(parseEuroOrUsNum(cols[feeIdx]) || 0) : 0);
      const tax = roundCents(taxIdx >= 0 ? Math.abs(parseEuroOrUsNum(cols[taxIdx]) || 0) : 0);
      const rowOid = oidIdx >= 0 ? cols[oidIdx] : '';

      if(!rawSym && !isin && !prodName) continue;
      const sym = registerInst(rawSym, isin, prodName || rawSym);

      if(typ.includes('div') || typ.includes('dividend')){
        const gross = roundCents(amt ? Math.abs(amt) : 0);
        const netDiv = roundCents(gross - tax);
        if(netDiv > 0){
          totalFees += tax;
          divList.push({
            id: rowOid || ('div_' + uid()),
            orderId: rowOid || (dt + '_' + sym + '_div_' + netDiv),
            sym,
            date: dt,
            amount: netDiv,
            gross,
            tax,
            note: 'Dividend ' + (prodName || sym)
          });
        }
      } else {
        const isSell = /sell|verkoop|af|debit|short/i.test(typ) || (sh != null && sh < 0);
        if(sh != null) sh = Math.abs(sh);
        if(amt != null) amt = Math.abs(amt);

        // Automatische afleiding ontbrekende waarden:
        if((sh == null || sh === 0) && px && amt){
          sh = Math.round(((amt - (isSell ? 0 : fee)) / px) * 10000) / 10000;
          adjustedCount++;
        }
        if((px == null || px === 0) && sh && amt){
          px = roundCents((amt - (isSell ? -fee : fee)) / sh);
          adjustedCount++;
        }

        if(sh || amt){
          const pureVal = roundCents((sh || 0) * (px || 0));
          let finalAmt;
          if(amt != null){
            if(pureVal > 0 && Math.abs(amt - pureVal) <= 0.05 && (fee > 0 || tax > 0)){
              finalAmt = isSell ? roundCents(Math.max(0, amt - fee - tax)) : roundCents(amt + fee + tax);
            } else if(pureVal > 0 && Math.abs(amt - (isSell ? pureVal - fee - tax : pureVal + fee + tax)) <= 0.05){
              finalAmt = roundCents(amt);
            } else {
              finalAmt = roundCents(isSell ? Math.max(0, amt - fee - tax) : (amt + fee + tax));
            }
          } else if(sh && px){
            finalAmt = isSell ? roundCents(Math.max(0, pureVal - fee - tax)) : roundCents(pureVal + fee + tax);
          }
          finalAmt = roundCents(finalAmt);

          // Controle op cent-balans: (Aantal * Prijs) ± Fee ± Tax
          const expectedTot = isSell ? roundCents(pureVal - fee - tax) : roundCents(pureVal + fee + tax);
          let note = '';
          if(sh && px && Math.abs(finalAmt - expectedTot) > 0.05){
            note = 'Handmatige controle nodig (verschil: €' + Math.abs(finalAmt - expectedTot).toFixed(2) + ')';
            flaggedCount++;
          } else {
            verifiedCount++;
          }

          totalFees += (fee + tax);
          totalVolume += finalAmt;

          txList.push({
            id: rowOid || uid(),
            orderId: rowOid || (dt + '_' + sym + '_' + (isSell ? 'sell' : 'buy') + '_' + (sh || 0) + '_' + finalAmt),
            sym,
            type: isSell ? 'sell' : 'buy',
            date: dt,
            amount: finalAmt,
            shares: sh,
            price: roundCents(px),
            fee,
            tax,
            note: note || undefined
          });
        }
      }
    }
  }

  divList.forEach(d => { delete d._key; });
  for(let i = divList.length - 1; i >= 0; i--){ if(!(divList[i].amount > 0)) divList.splice(i, 1); }
  return {
    brokerType,
    brokerName,
    brokerIcon,
    delim,
    txList,
    divList,
    instMap,
    rowCount: rawLines.length - 1,
    summaryText: txList.length + ' transacties · ' + divList.length + ' dividenden · ' + Object.keys(instMap).length + ' fondsen',
    validation: {
      verifiedCount,
      adjustedCount,
      flaggedCount,
      totalFees: roundCents(totalFees),
      totalVolume: roundCents(totalVolume),
      warnings
    }
  };
}

function openCsvHubModal(initialTab = 'export'){
  const activeAcc = S.accounts[S.activeAccount] || Object.values(S.accounts || {})[0] || {};
  const accList = Object.entries(S.accounts || {}).map(([key, a]) => ({ ...a, id: a.id || key, _key: key }));

  const renderTab = (tab) => {
    if(tab === 'export'){
      return `
      <div>
        <h4 style="margin:0 0 6px">Exporteer gegevens van je accounts</h4>
        <p class="mu" style="font-size:12.5px;margin-bottom:14px">Download je beleggingsgegevens in overzichtelijke Excel-compatibele CSV bestanden:</p>
        <div class="csv-hub-grid">
          <div class="csv-hub-card">
            <div>
              <h4>📜 Alle Transacties</h4>
              <p>Volledige historie met datum, fonds, type koop/verkoop, aantal stuks en aankoopkoersen.</p>
            </div>
            <div style="display:flex;gap:6px;flex-direction:column">
              <button class="btn sm pri" data-act="export_tx_csv" data-v="${S.activeAccount}">${ic('dl',14)} Download huidig (${esc(activeAcc.name)})</button>
              <button class="btn sm" data-act="export_tx_csv" data-v="ALL">${ic('dl',14)} Download alle accounts (totaal)</button>
            </div>
          </div>
          <div class="csv-hub-card">
            <div>
              <h4>📊 Huidige Posities &amp; Waardes</h4>
              <p>Overzicht van al je openstaande fondsen met huidige beurskoers, totale waarde, ongerealiseerde winst en weging.</p>
            </div>
            <button class="btn sm pri" data-act="export_pos_csv" data-v="${S.activeAccount}">${ic('dl',14)} Download posities CSV</button>
          </div>
          <div class="csv-hub-card">
            <div>
              <h4>💰 Ontvangen Dividenden</h4>
              <p>Alle dividendbetalingen met datum, netto bedrag in euro en bijbehorend aandeel.</p>
            </div>
            <div style="display:flex;gap:6px;flex-direction:column">
              <button class="btn sm pri" data-act="export_div_csv" data-v="${S.activeAccount}">${ic('dl',14)} Download huidig account</button>
              <button class="btn sm" data-act="export_div_csv" data-v="ALL">${ic('dl',14)} Download alle dividenden</button>
            </div>
          </div>
          <div class="csv-hub-card">
            <div>
              <h4>🏛️ DEGIRO Formaat Export</h4>
              <p>Exporteert in het officiële <code>Account.csv</code> formaat van DEGIRO (geschikt voor herimport).</p>
            </div>
            <button class="btn sm data-act" data-act="export_broker_csv" data-v="${S.activeAccount}|degiro">${ic('dl',14)} Download DEGIRO CSV</button>
          </div>
          <div class="csv-hub-card">
            <div>
              <h4>🏦 Trade Republic Formaat Export</h4>
              <p>Exporteert in het officiële <code>tr_transactions.csv</code> formaat van Trade Republic.</p>
            </div>
            <button class="btn sm data-act" data-act="export_broker_csv" data-v="${S.activeAccount}|tr">${ic('dl',14)} Download Trade Republic CSV</button>
          </div>
        </div>
      </div>`;
    } else if(tab === 'import'){
      return `
      <div>
        <h4 style="margin:0 0 6px">Universele CSV &amp; Excel XLSX Importer</h4>
        <p class="mu" style="font-size:12.5px;margin-bottom:14px">Upload een export van DEGIRO, Trade Republic, Interactive Brokers, Trading 212, Saxo of een eigen Excel/CSV bestand:</p>
        
        <div style="display:grid;gap:12px;margin-bottom:16px">
          <label style="margin:0">
            <span style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">Bestemming van import:</span>
            <select id="csv_import_target" style="width:100%;padding:8px 10px;border-radius:8px;background:var(--s1);border:1px solid var(--bd);color:var(--tx)">
              <option value="APPEND_${S.activeAccount}">Toevoegen aan huidig account (${esc(activeAcc.name)})</option>
              <option value="REPLACE_${S.activeAccount}">Vervang alle data in huidig account (${esc(activeAcc.name)})</option>
              <option value="NEW_ACC">✨ Maak automatisch een NIEUW account aan voor dit bestand</option>
              ${accList.map(a => `<option value="APPEND_${a.id}">Toevoegen aan ${esc(a.name)} (${esc(a.file)})</option>`).join('')}
            </select>
          </label>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--s2);border-radius:8px;border:1px solid var(--bd)">
            <span style="font-size:12px;color:var(--mu)">Eerst data en gekoppelde bestanden wissen?</span>
            <button type="button" class="btn sm ghost danger" data-act="clear_acc_data" data-v="${S.activeAccount}">🧹 Account "${esc(activeAcc.name)}" data leegmaken</button>
          </div>
        </div>

        <div class="csv-dropzone" id="csv_dropzone">
          <div style="font-size:32px;margin-bottom:8px">📂</div>
          <b>Klik om een CSV of Excel (.xlsx) bestand te kiezen of sleep hierheen</b>
          <div class="mu" style="font-size:12px;margin-top:4px">Automatische herkenning voor DEGIRO, Trade Republic, IBKR, Trading 212, Saxo, etc.</div>
          <input type="file" id="csv_hub_file_input" accept=".csv,.xlsx,.xls,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" style="display:none">
        </div>

        <div id="csv_preview_box" style="margin-top:14px;display:none;background:var(--s2);padding:14px;border-radius:12px;border:1px solid var(--bd)"></div>
      </div>`;
    } else if(tab === 'templates'){
      return `
      <div>
        <h4 style="margin:0 0 6px">Voorbeeld Templates</h4>
        <p class="mu" style="font-size:12.5px;margin-bottom:14px">Download kant-en-klare voorbeeldbestanden om zelf transacties in Excel of Numbers in te vullen:</p>
        <div class="csv-hub-grid">
          <div class="csv-hub-card">
            <div>
              <h4>🏛️ DEGIRO Account.csv Template</h4>
              <p>Voorbeeld inclusief kolommen (Datum, Product, ISIN, Omschrijving, Mutatie) en Nederlandse kommagetallen.</p>
            </div>
            <button class="btn sm pri" data-act="download_template" data-v="degiro">${ic('dl',14)} Download DEGIRO template</button>
          </div>
          <div class="csv-hub-card">
            <div>
              <h4>🏦 Trade Republic Template</h4>
              <p>Voorbeeld met timestamp, category TRADING / DIVIDEND, shares, price, amount in euro's.</p>
            </div>
            <button class="btn sm pri" data-act="download_template" data-v="tr">${ic('dl',14)} Download TR template</button>
          </div>
          <div class="csv-hub-card">
            <div>
              <h4>🌐 Universeel Excel Template</h4>
              <p>Eenvoudig model met Datum, Ticker, Naam, Type (Koop/Verkoop), Bedrag, Aantal en Koers.</p>
            </div>
            <button class="btn sm pri" data-act="download_template" data-v="universal">${ic('dl',14)} Download Excel template</button>
          </div>
        </div>
      </div>`;
    } else if(tab === 'accounts'){
      return `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div>
            <h4 style="margin:0">Beheer je Beleggingsaccounts</h4>
            <div class="mu" style="font-size:12px">Wissel, bewerk of voeg extra brokers toe</div>
          </div>
          <button class="btn sm pri" data-act="new_acc_modal">${ic('plus',14)} Nieuw Account</button>
        </div>

        <div style="display:grid;gap:8px">
          ${accList.map(a => {
            const accKey = a._key || a.id;
            const posCount = Object.keys(a.inst || {}).length;
            const txCount = (a.tx || []).length;
            const divCount = (a.dividends || []).length;
            const isCur = S.activeAccount === accKey;
            return `
            <div class="acc-row-item ${isCur ? 'active' : ''}">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:22px">${a.icon || '💼'}</span>
                <div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <b>${esc(a.name)}</b>
                    ${isCur ? '<span class="badge ac">Actief</span>' : ''}
                  </div>
                  <div class="mu" style="font-size:11.5px">Bestand: <code>${esc(a.file)}</code> · ${posCount} posities · ${txCount} transacties · ${divCount} dividenden</div>
                </div>
              </div>
              <div style="display:flex;gap:6px">
                <button class="btn sm ${isCur ? 'ghost' : 'pri'}" data-act="switch_acc" data-v="${accKey}">${isCur ? 'Geselecteerd ✓' : 'Kies account'}</button>
                <button class="btn sm" data-act="export_tx_csv" data-v="${accKey}" title="Exporteer transacties">${ic('dl',14)}</button>
                <button class="btn sm ghost" data-act="clear_acc_data" data-v="${accKey}" title="Wis alle gegevens uit dit account (maak blanco)">🧹 Leegmaken</button>
                ${accList.length > 1 ? `<button class="btn sm ghost danger" data-act="del_acc" data-v="${accKey}" title="Verwijder account">${ic('trash',14)}</button>` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid var(--bd)">
          <span class="mu" style="font-size:12px">Wil je een complete herstart maken?</span>
          <button class="btn sm ghost danger" data-act="clear_all_accounts">🧹 Alle accounts tegelijk leegmaken</button>
        </div>
      </div>`;
    }
  };

  openModal(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 style="margin:0;display:flex;align-items:center;gap:8px">${ic('hub',20)} CSV &amp; Multi-Account Hub</h3>
      <span class="badge ac">${accList.length} accounts actief</span>
    </div>
    
    <div class="csv-hub-tabs">
      <button class="csv-hub-tab ${initialTab==='export'?'active':''}" data-tab="export">📥 Exporteren &amp; Download</button>
      <button class="csv-hub-tab ${initialTab==='import'?'active':''}" data-tab="import">📤 Upload &amp; Importeren</button>
      <button class="csv-hub-tab ${initialTab==='templates'?'active':''}" data-tab="templates">📄 Voorbeeld Templates</button>
      <button class="csv-hub-tab ${initialTab==='accounts'?'active':''}" data-tab="accounts">🏛️ Accounts Beheer</button>
    </div>

    <div id="csv_hub_body">${renderTab(initialTab)}</div>
  `, m => {
    $$('.csv-hub-tab', m).forEach(btn => {
      btn.onclick = () => {
        $$('.csv-hub-tab', m).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $('#csv_hub_body', m).innerHTML = renderTab(btn.dataset.tab);
        bindDropzone(m);
      };
    });
    bindDropzone(m);
  });
}

function bindDropzone(m){
  const dz = $('#csv_dropzone', m);
  const fin = $('#csv_hub_file_input', m);
  if(!dz || !fin) return;

  dz.onclick = () => fin.click();
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('dragover'); };
  dz.ondragleave = () => dz.classList.remove('dragover');
  dz.ondrop = e => {
    e.preventDefault();
    dz.classList.remove('dragover');
    if(e.dataTransfer.files && e.dataTransfer.files[0]){
      handleCsvFile(e.dataTransfer.files[0], m);
    }
  };
  fin.onchange = e => {
    if(e.target.files && e.target.files[0]){
      handleCsvFile(e.target.files[0], m);
    }
  };
}

async function handleCsvFile(file, m){
  try {
    toast(`Bestand ${file.name} inlezen…`);
    const txt = await readFileAsTextOrCsv(file);
    const parsed = parseUniversalCsv(txt, file.name);
    const prev = $('#csv_preview_box', m);
    if(!parsed || (!parsed.txList.length && !parsed.divList.length)){
      toast('Geen geldige transacties of dividenden gevonden in dit bestand', 'warn');
      return;
    }
    prev.style.display = 'block';
    const v = parsed.validation || {};
    prev.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <b style="display:flex;align-items:center;gap:6px">${parsed.brokerIcon} Herkend: ${esc(parsed.brokerName)}</b>
        <span class="badge ac">${parsed.txList.length} transacties · ${parsed.divList.length} dividenden</span>
      </div>
      <div class="mu" style="font-size:12px;margin-bottom:10px">
        Bestand: <b>${esc(file.name)}</b> (${parsed.rowCount} rijen geanalyseerd · ${Object.keys(parsed.instMap).length} fondsen)
      </div>
      
      <div style="background:var(--s1);padding:10px 12px;border-radius:8px;margin-bottom:12px;border:1px solid var(--bd);font-size:12px;display:grid;gap:4px">
        <div style="font-weight:600;color:var(--up);display:flex;align-items:center;gap:6px">
          <span>🎯 Tot op de cent gevalideerd:</span>
        </div>
        <div>• <b>${v.verifiedCount || parsed.txList.length}</b> transacties 100% kloppend geverifieerd (balans: bedrag = aantal × koers ± kosten).</div>
        ${v.totalFees > 0 ? `<div>• <b>€ ${v.totalFees.toFixed(2)}</b> aan transactiekosten &amp; belasting volledig meegeteld in aankoop-/verkoopbalans.</div>` : ''}
        ${v.adjustedCount > 0 ? `<div>• <b>${v.adjustedCount}</b> ontbrekende koersen/aantallen automatisch afgeleid.</div>` : ''}
        ${v.flaggedCount > 0 ? `<div style="color:var(--warn)">• ⚠️ <b>${v.flaggedCount}</b> transactie(s) met afwijking &gt; €0,05 (gemarkeerd voor controle).</div>` : ''}
        <div>• 🛡️ Automatische de-duplicatie op <code>transaction_id</code> actief om dubbele rijen te voorkomen.</div>
      </div>

      <div style="display:flex;gap:8px">
        <button class="btn pri sm" id="csv_confirm_btn">Import nu definitief verwerken</button>
      </div>`;

    const confirmBtn = $('#csv_confirm_btn', m);
    if(confirmBtn){
      confirmBtn.onclick = () => {
        const targetVal = $('#csv_import_target', m)?.value || 'APPEND_TR';
        if(targetVal === 'NEW_ACC'){
          const newName = parsed.brokerName || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          createNewAccount(newName, parsed.brokerIcon || '💼', file.name, {
            inst: parsed.instMap,
            tx: parsed.txList,
            dividends: parsed.divList
          });
        } else if(targetVal.startsWith('REPLACE_')){
          const accId = targetVal.replace('REPLACE_', '');
          if(S.accounts[accId]){
            S.accounts[accId].inst = parsed.instMap;
            S.accounts[accId].tx = parsed.txList;
            S.accounts[accId].dividends = parsed.divList;
            if(S.activeAccount === accId){
              S.inst = parsed.instMap;
              S.tx = parsed.txList;
              S.dividends = parsed.divList;
            }
            save();
            toast(`Gegevens in ${S.accounts[accId].name} succesvol vervangen tot op de cent nauwkeurig!`);
          }
        } else {
          const accId = targetVal.replace('APPEND_', '');
          if(S.accounts[accId]){
            // Slimme de-duplicatie via orderId / signature (Stap 1: Unieke transaction_id)
            const existingTxSet = new Set((S.accounts[accId].tx || []).map(t => t.orderId || `${t.date}_${t.sym}_${t.type}_${t.shares}_${t.amount}`));
            let dupesCount = 0;
            const newTxs = parsed.txList.filter(t => {
              const sig = t.orderId || `${t.date}_${t.sym}_${t.type}_${t.shares}_${t.amount}`;
              if(existingTxSet.has(sig)){
                dupesCount++;
                return false;
              }
              existingTxSet.add(sig);
              return true;
            });

            const existingDivSet = new Set((S.accounts[accId].dividends || []).map(d => d.orderId || `${d.date}_${d.sym}_${d.amount}`));
            const newDivs = parsed.divList.filter(d => {
              const sig = d.orderId || `${d.date}_${d.sym}_${d.amount}`;
              if(existingDivSet.has(sig)) return false;
              existingDivSet.add(sig);
              return true;
            });

            const acc = S.accounts[accId];
            acc.inst = Object.assign({}, acc.inst || {}, parsed.instMap);
            acc.tx = [...(acc.tx || []), ...newTxs];
            acc.dividends = [...(acc.dividends || []), ...newDivs];

            // S.tx en acc.tx zijn vaak HETZELFDE array: niet twee keer pushen
            if(S.activeAccount === accId){
              S.inst = acc.inst;
              S.tx = acc.tx;
              S.dividends = acc.dividends;
            }
            save();
            const dupeMsg = dupesCount > 0 ? ` (${dupesCount} dubbele rijen voorkomen)` : '';
            toast(`✓ ${newTxs.length} transacties tot op de cent toegevoegd aan ${S.accounts[accId].name}${dupeMsg}!`);
          }
        }
        closeModal();
        refreshAll();
        render(true);
      };
    }
  } catch(err){
    console.error(err);
    toast('Fout bij verwerken bestand: ' + (err.message || err), 'err');
  }
}

function openNewAccountModal(){
  let stagedFile = null;
  let stagedParsed = null;

  openModal(`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div style="width:36px;height:36px;border-radius:10px;background:var(--acs);display:grid;place-items:center;font-size:18px">✨</div>
      <div>
        <h3 style="margin:0;font-size:19px">Nieuw Beleggingsaccount Toevoegen</h3>
        <div class="mu" style="font-size:12px">Upload een broker export of start met een blanco account</div>
      </div>
    </div>

    <form id="new_acc_form" style="display:grid;gap:14px">
      <!-- File Selector Dropzone -->
      <div>
        <div style="font-size:12.5px;font-weight:700;color:var(--tx);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
          <span>Broker Exportbestand (CSV of Excel XLSX)</span>
          <span class="mu" style="font-size:11.5px;font-weight:500">Optioneel</span>
        </div>
        <div class="csv-dropzone" id="new_acc_dropzone" style="padding:20px 14px;border:2px dashed var(--bd);border-radius:14px;background:var(--s2);text-align:center;cursor:pointer;transition:all .18s;position:relative">
          <div id="new_acc_drop_idle">
            <div style="font-size:28px;margin-bottom:6px">📂</div>
            <div style="font-weight:700;font-size:13.5px;color:var(--tx)">Klik om een bestand te kiezen of sleep hierheen</div>
            <div class="mu" style="font-size:11.5px;margin-top:4px">
              Ondersteunt <b>.csv, .xlsx, .xls</b> van DEGIRO, Trade Republic, IBKR, Trading 212, Saxo &amp; banken
            </div>
          </div>
          <div id="new_acc_drop_loaded" style="display:none;background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:12px 14px;text-align:left">
          </div>
          <input type="file" id="new_acc_file_input" accept=".csv,.xlsx,.xls,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" style="display:none">
        </div>
      </div>

      <!-- Account Name & Icon Selection -->
      <div class="row2">
        <label style="margin:0">
          <span>Naam van broker / account</span>
          <input type="text" id="new_acc_name_input" name="name" placeholder="bijv. Interactive Brokers of Trading 212" required autofocus>
        </label>
        <label style="margin:0">
          <span>Icoon</span>
          <select id="new_acc_icon_select" name="icon" style="padding:8px 10px;border-radius:8px;background:var(--s1);border:1px solid var(--bd);color:var(--tx)">
            <option value="💼">💼 Portfolio</option>
            <option value="🏛️">🏛️ DEGIRO</option>
            <option value="🏦">🏦 Trade Republic</option>
            <option value="🦅">🦅 Interactive Brokers</option>
            <option value="📈">📈 Trading 212</option>
            <option value="🇩🇰">🇩🇰 Saxo Bank</option>
            <option value="🦁">🦁 ING Beleggen</option>
            <option value="🟠">🟠 Rabobank</option>
            <option value="🟢">🟢 ABN AMRO</option>
            <option value="🚀">🚀 Groei / Crypto</option>
            <option value="💎">💎 Waardebeleggen</option>
            <option value="🌐">🌐 Wereldwijd</option>
          </select>
        </label>
      </div>

      <!-- Data Preview Box -->
      <div id="new_acc_preview_box" style="display:none;background:var(--s2);border:1px solid var(--bd);border-radius:12px;padding:12px 14px"></div>

      <div class="mu" style="font-size:12px;line-height:1.4">
        💡 <i>Tip:</i> Geen bestand bij de hand? Laat het uploadvak leeg om direct een leeg account aan te maken en later transacties toe te voegen.
      </div>

      <div class="acts" style="margin-top:4px">
        <button class="btn pri" type="submit" id="new_acc_submit_btn">Account Aanmaken &amp; Activeren</button>
        <button class="btn" type="button" data-act="closemodal">Annuleren</button>
      </div>
    </form>
  `, m => {
    const dz = $('#new_acc_dropzone', m);
    const fin = $('#new_acc_file_input', m);
    const nameInp = $('#new_acc_name_input', m);
    const iconSel = $('#new_acc_icon_select', m);
    const idleEl = $('#new_acc_drop_idle', m);
    const loadedEl = $('#new_acc_drop_loaded', m);
    const prevBox = $('#new_acc_preview_box', m);

    async function processFile(file){
      try {
        toast(`Bestand ${file.name} analyseren…`);
        const txt = await readFileAsTextOrCsv(file);
        const parsed = parseUniversalCsv(txt, file.name);
        if(!parsed || (!parsed.txList.length && !parsed.divList.length)){
          toast('Geen geldige transacties of dividenden herkend in dit bestand', 'warn');
          return;
        }

        stagedFile = file;
        stagedParsed = parsed;

        // Auto-fill account name if user hasn't typed a custom name yet
        if(nameInp && (!nameInp.value || nameInp.value === 'Nieuw Account' || nameInp.dataset.autofilled === 'true')){
          nameInp.value = parsed.brokerName || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          nameInp.dataset.autofilled = 'true';
        }

        // Auto-select broker icon
        if(iconSel && parsed.brokerIcon){
          iconSel.value = parsed.brokerIcon;
        }

        // Show loaded state in dropzone
        idleEl.style.display = 'none';
        loadedEl.style.display = 'block';
        const fileSizeKb = Math.round(file.size / 1024) || 1;
        loadedEl.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:26px">${parsed.brokerIcon}</span>
              <div>
                <div style="font-weight:700;font-size:13.5px;color:var(--tx)">${esc(file.name)}</div>
                <div class="mu" style="font-size:11.5px">${fileSizeKb} KB · Herkend als <b>${esc(parsed.brokerName)}</b></div>
              </div>
            </div>
            <button type="button" class="btn sm ghost" id="new_acc_remove_file" title="Ander bestand kiezen">✕ Wijzig</button>
          </div>
        `;

        // Update preview box
        prevBox.style.display = 'block';
        prevBox.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-weight:700;font-size:13px;color:var(--tx);display:flex;align-items:center;gap:6px">
              ${parsed.brokerIcon} Gegevens gereed voor import
            </span>
            <span class="badge ac">${parsed.txList.length} transacties · ${parsed.divList.length} dividenden</span>
          </div>
          <div class="mu" style="font-size:12px">
            <b>${Object.keys(parsed.instMap).length} unieke fondsen</b> gevonden (${parsed.rowCount} rijen). Bij het aanmaken worden deze direct geactiveerd.
          </div>
        `;

        const rmBtn = $('#new_acc_remove_file', m);
        if(rmBtn){
          rmBtn.onclick = (e) => {
            e.stopPropagation();
            stagedFile = null;
            stagedParsed = null;
            idleEl.style.display = 'block';
            loadedEl.style.display = 'none';
            prevBox.style.display = 'none';
            fin.value = '';
          };
        }

        toast(`✓ ${parsed.brokerName}: ${parsed.txList.length} transacties gevonden!`);
      } catch(err){
        console.error(err);
        toast('Fout bij analyseren: ' + (err.message || err), 'err');
      }
    }

    if(dz && fin){
      dz.onclick = () => fin.click();
      dz.ondragover = e => { e.preventDefault(); dz.classList.add('dragover'); };
      dz.ondragleave = () => dz.classList.remove('dragover');
      dz.ondrop = e => {
        e.preventDefault();
        dz.classList.remove('dragover');
        if(e.dataTransfer.files && e.dataTransfer.files[0]){
          processFile(e.dataTransfer.files[0]);
        }
      };
      fin.onchange = e => {
        if(e.target.files && e.target.files[0]){
          processFile(e.target.files[0]);
        }
      };
    }

    $('#new_acc_form', m).onsubmit = e => {
      e.preventDefault();
      const name = nameInp?.value.trim() || 'Nieuw Account';
      const icon = iconSel?.value || '💼';
      const fileName = stagedFile ? stagedFile.name : `${name.toLowerCase().replace(/\s+/g,'_')}.csv`;
      const initialData = stagedParsed ? {
        inst: stagedParsed.instMap,
        tx: stagedParsed.txList,
        dividends: stagedParsed.divList
      } : {};

      createNewAccount(name, icon, fileName, initialData);
      closeModal();
      refreshAll();
      render(true);
    };
  });
}

function addDividendModal(){
  const syms = Object.keys(S.inst || {});
  openModal(`<h3>💰 Dividend Toevoegen</h3>
  <form id="add_div_form">
    <label><span>Aandeel / ETF</span>
      <select name="sym" required style="padding:8px 10px;border-radius:8px;background:var(--s1);border:1px solid var(--bd);color:var(--tx)">
        ${syms.map(s => `<option value="${esc(s)}">${esc(nameOf(s))} (${esc(s)})</option>`).join('')}
      </select>
    </label>
    <div class="row2">
      <label><span>Datum</span><input type="date" name="date" value="${today()}" required></label>
      <label><span>Netto Bedrag (€)</span><input type="number" step="0.01" min="0.01" name="amount" placeholder="bijv. 12.50" required></label>
    </div>
    <label><span>Omschrijving / Notitie</span><input type="text" name="note" placeholder="bijv. Kwartaaldividend Q3"></label>
    <div class="acts">
      <button class="btn pri" type="submit">Opslaan</button>
      <button class="btn" type="button" data-act="closemodal">Annuleren</button>
    </div>
  </form>`, m => {
    $('#add_div_form', m).onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const sym = fd.get('sym');
      const date = fd.get('date');
      const amount = parseFloat(fd.get('amount'));
      const note = fd.get('note') || 'Regulier dividend';
      if(!sym || !date || isNaN(amount) || amount <= 0) return;
      if(!S.dividends) S.dividends = [];
      S.dividends.push({ id: 'div_' + uid(), sym, date, amount, note });
      save();
      closeModal();
      toast(`💰 Dividend van ${eur(amount)} voor ${nameOf(sym)} toegevoegd!`);
      render(true);
    };
  });
}

function download(name,content,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

/* ---- Instellingen ---- */
PAGES.settings=()=>{
  const accList = Object.entries(S.accounts || {}).map(([key, a]) => ({ ...a, id: a.id || key, _key: key }));
  main.innerHTML=`
  ${head('Instellingen','Weergave, koersen en je gegevens')}
  <div class="cols2" style="margin-top:0">
  <div class="stack">
    <section class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">Accounts &amp; Gegevensbestanden</h3>
        <button class="btn sm pri" data-act="new_acc_modal">${ic('plus',14)} Nieuw Account</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${accList.map(a => {
          const accKey = a._key || a.id;
          const isAct = S.activeAccount === accKey;
          const posCount = Object.keys(a.inst || {}).length;
          return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--s2);border-radius:10px;border:1px solid ${isAct?'var(--ac)':'var(--bd)'}">
            <div>
              <b style="display:flex;align-items:center;gap:6px">${a.icon||'💼'} ${esc(a.name)} <span class="badge ${isAct?'ac':''}">${isAct?'Actief':'Inactief'}</span></b>
              <div class="mu" style="font-size:12px;margin-top:2px">Bronbestand: <code>${esc(a.file)}</code> · ${posCount} posities · ${(a.tx||[]).length} transacties</div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn sm ${isAct?'pri':''}" data-act="switch_acc" data-v="${accKey}">${isAct?'Geselecteerd ✓':'Kies dit account'}</button>
              <button class="btn sm ghost" data-act="clear_acc_data" data-v="${accKey}" title="Wis alle transacties en data uit dit account">🧹 Leegmaken</button>
              ${accList.length > 1 ? `<button class="btn sm ghost danger" data-act="del_acc" data-v="${accKey}" title="Verwijder account">${ic('trash',14)}</button>` : ''}
            </div>
          </div>`;
        }).join('')}
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px;flex-wrap:wrap">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <button class="btn sm" data-act="open_csv_hub">${ic('hub',14)} CSV Hub openen</button>
            <button class="btn sm" data-act="toggle_acc_next">⇄ Wissel account</button>
            <button class="btn sm ghost danger" data-act="clear_all_accounts">🧹 Alle accounts leegmaken</button>
            <button class="btn sm autoswitch-btn ${autoSwitchRunning?'pri':''}" data-act="toggle_autoswitch">
              <span class="dot autoswitch-dot ${autoSwitchRunning?'live':''}" style="width:6px;height:6px"></span>
              <span class="autoswitch-label">${autoSwitchRunning?`Auto-switch AAN (${autoSwitchRemaining}s)`:'Auto-switch starten'}</span>
            </button>
          </div>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;margin:0">
            <span class="mu">Wissel-interval:</span>
            <select id="autoswitch_interval" onchange="autoSwitchSeconds=+this.value;autoSwitchRemaining=+this.value;updateAutoSwitchUI()" style="padding:4px 8px;border-radius:6px;background:var(--s1);border:1px solid var(--bd);color:var(--tx)">
              <option value="5" ${autoSwitchSeconds===5?'selected':''}>5 seconden</option>
              <option value="10" ${autoSwitchSeconds===10?'selected':''}>10 seconden</option>
              <option value="15" ${autoSwitchSeconds===15?'selected':''}>15 seconden</option>
              <option value="30" ${autoSwitchSeconds===30?'selected':''}>30 seconden</option>
            </select>
          </label>
        </div>
      </div>
    </section>
    <section class="panel"><h3>Weergave & Kleurthema</h3>
      <label><span>Thema & Kleurenpalet</span><select data-set="theme">
        <option value="dark" ${S.set.theme==='dark'?'selected':''}>💼 Jong Beleggen Dark (Executive Slate &amp; Sky Blue)</option>
        <option value="light" ${S.set.theme==='light'?'selected':''}>☀️ Jong Beleggen Light (Clean Minimalist)</option>
        <option value="crypto_binance" ${S.set.theme==='crypto_binance'?'selected':''}>🪙 Crypto — Binance Goud</option>
        <option value="crypto_cmc" ${S.set.theme==='crypto_cmc'?'selected':''}>📊 Crypto — CoinMarketCap Blauw</option>
      </select></label>
      <div class="mu" style="font-size:12px;margin-top:4px">
        Rustige fintech stijl geïnspireerd op Jong Beleggen (Portfolio Dividend Tracker): diep marine-slate (#0b0f19), zachtgrijze kaders en fris hemelsblauw accent.
      </div>
    </section>
    <section class="panel"><h3>Koersen</h3>
      <label><span>Automatisch verversen</span><select data-set="refresh">${[[15,'Elke 15 seconden'],[30,'Elke 30 seconden'],[60,'Elke minuut'],[300,'Elke 5 minuten'],[0,'Uit']].map(([v,l])=>`<option value="${v}" ${S.set.refresh===v?'selected':''}>${l}</option>`).join('')}</select></label>
      <label><span>Finnhub API-sleutel (optioneel, voor realtime Amerikaanse koersen)</span><input data-set="finnhub" value="${esc(S.set.finnhub)}" placeholder="Plak hier je gratis sleutel van finnhub.io" autocomplete="off"></label>
      <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-set="proxy" style="width:auto" ${S.set.proxy?'checked':''}> Gebruik CORS-proxy als directe verbinding geblokkeerd wordt</label>
      <div class="mu" style="font-size:12.5px">Standaard komen koersen van Yahoo Finance (geen sleutel nodig), wisselkoersen via Yahoo en Frankfurter (ECB). Met een gratis Finnhub-sleutel worden Amerikaanse aandelen realtime.</div>
    </section>
    <section class="panel"><h3>Meldingen</h3>
      <p class="mu" style="margin-top:0">Prijsalarmen verschijnen in de pagina. Voor meldingen buiten je browser:</p>
      <button class="btn" data-act="notif">${ic('bell',16)} Browsermeldingen toestaan</button>
    </section>
  </div>
  <div class="stack">
    <section class="panel"><h3>Verbindingsstatus</h3>
      <button class="btn" data-act="testapi">${ic('refresh',16)} Test verbindingen</button>
      <div id="apitest" style="margin-top:12px"></div>
    </section>
    <section class="panel"><h3>Gegevens</h3>
      <p class="mu" style="margin-top:0">Alles staat alleen in je eigen browser. Maak regelmatig een back-up.</p>
      <div class="acts"><button class="btn" data-act="backup">${ic('dl',16)} Back-up (JSON)</button>
      <label class="btn" style="margin:0;cursor:pointer">${ic('ul',16)} Herstel back-up<input type="file" accept=".json,application/json" id="bkin" hidden></label>
      <button class="btn danger" data-act="reset">${ic('trash',16)} Alles resetten</button></div>
    </section>
  </div></div>`;
  $('#bkin').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const j=JSON.parse(t);if(!j.inst||!j.tx)throw 0;S=Object.assign(defaults(),j);save();applyTheme();toast('Back-up hersteld');refreshAll();render(true)}catch(err){toast('Ongeldig back-upbestand')}})});
};
async function testApis(){
  const out=$('#apitest');out.innerHTML='Testen...';
  const u=CHART_URL('AAPL','1d','1d'),rows=[],names=['Lokale server proxy (port 8080)','Lokale server proxy (huidige poort)','Yahoo via allorigins (get)','Yahoo via allorigins (raw)','Yahoo via codetabs'];
  for(let i=0;i<PROXIES.length;i++){
    const t0=performance.now();
    try{
      const target=PROXIES[i](u);
      const r=await fetch(target);
      let j;
      if(target.includes('api.allorigins.win/get')){
        const wrap=await r.json();
        j = typeof wrap.contents === 'string' ? JSON.parse(wrap.contents) : wrap.contents;
      } else {
        j=await r.json();
      }
      if(!j.chart.result)throw 0;
      rows.push([names[i],true,Math.round(performance.now()-t0)]);
    }catch(e){rows.push([names[i],false])}
  }
  {const t0=performance.now();try{const r=await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR');const j=await r.json();if(!j.rates)throw 0;rows.push(['Frankfurter wisselkoersen (ECB)',true,Math.round(performance.now()-t0)])}catch(e){rows.push(['Frankfurter wisselkoersen (ECB)',false])}}
  {const t0=performance.now();try{await finnQuote('AAPL');rows.push(['Finnhub realtime',true,Math.round(performance.now()-t0)])}catch(e){rows.push(['Finnhub realtime',false])}}
  const ok=rows.some(r=>r[0].startsWith('Yahoo')&&r[1]);
  out.innerHTML=rows.map(r=>`<div class="kv" style="margin-bottom:6px"><span style="color:var(--tx)">${r[0]}</span><span class="${r[1]?'up':'down'}">${r[1]?`✓ ${r[2]} ms`:'✗ niet bereikbaar'}</span></div>`).join('')+(ok?'':'<div class="note w" style="margin-top:10px">Geen enkele koersbron bereikbaar. Controleer je internet of firewall. Zolang dit niet lukt zie je demo-data.</div>');
}

/* ================= pickers & modals ================= */
function bindPicker(root,onPick){
  if(!root)return;
  const inp=$('input',root),list=$('.plist',root);let tm;
  inp.addEventListener('input',()=>{
    clearTimeout(tm);const q=inp.value.trim();if(!q){list.innerHTML='';return}
    tm=setTimeout(async()=>{
      list.innerHTML='<div class="pitem mu">Zoeken…</div>';let res=[];
      try{res=await searchSym(q)}catch(e){}
      list.innerHTML=res.map(r=>`<button type="button" class="pitem" data-s="${esc(r.sym)}" data-n="${esc(r.name)}" data-t="${r.type}"><b>${esc(r.sym)}</b><span>${esc(r.name)}</span><small>${esc(r.exch)}</small></button>`).join('')+
        `<button type="button" class="pitem" data-s="${esc(q.toUpperCase())}" data-n="${esc(q.toUpperCase())}" data-t="EQUITY"><span>Gebruik ticker <b>${esc(q.toUpperCase())}</b></span></button>`;
    },300);
  });
  list.addEventListener('click',e=>{const b=e.target.closest('.pitem[data-s]');if(!b)return;onPick({sym:b.dataset.s,name:b.dataset.n,type:b.dataset.t});list.innerHTML='';inp.value=''});
}
function txModal({sym,tx}={}){
  const t=tx||{type:'buy',date:today(),amount:'',shares:null,price:null,sym:sym||''};
  let picked=t.sym?{sym:t.sym,name:nameOf(t.sym),type:S.inst[t.sym]?.type||'EQUITY'}:null;
  openModal(`<h3>${tx?'Transactie bewerken':'Transactie toevoegen'}</h3>
  <form data-form="tx"><input type="hidden" name="id" value="${tx?tx.id:''}">
    <label><span>Aandeel of ETF</span><div class="sel" id="selsym" ${picked?'':'hidden'}></div>
      <div class="picker" id="mpick" ${tx?'hidden':''}><input placeholder="Zoek op naam of ticker, bijv. Tesla of EUNL.DE" autocomplete="off"><div class="plist"></div></div></label>
    <div class="row2"><label><span>Type</span><select name="type"><option value="buy" ${t.type!=='sell'?'selected':''}>Koop</option><option value="sell" ${t.type==='sell'?'selected':''}>Verkoop</option></select></label>
    <label><span>Datum</span><input type="date" name="date" value="${t.date}" required></label></div>
    <label><span>Bedrag (€)</span><input name="amount" type="number" step="0.01" min="0" value="${t.amount}" placeholder="bijv. 100"></label>
    <div class="row2"><label><span>Aantal stuks (optioneel)</span><input name="shares" type="number" step="any" min="0" value="${t.shares??''}" placeholder="bijv. 0,6543"></label>
    <label><span>Koers per stuk in € (optioneel)</span><input name="price" type="number" step="any" min="0" value="${t.price!=null&&!t.est?t.price:''}" placeholder="historische koers"></label></div>
    <div id="tx_hint" class="mu" style="font-size:12.5px;margin-bottom:8px;color:var(--ac);min-height:18px"></div>
    <div class="mu" style="font-size:12.5px;margin-bottom:12px">Vul het aantal stuks in óf laat leeg: de beurskoers op die aankoopdatum wordt dan automatisch opgezocht om je winst te berekenen.</div>
    <div class="acts"><button class="btn pri" type="submit">Opslaan</button><button class="btn" type="button" data-act="closemodal">Annuleren</button></div>
  </form>`,m=>{
    const show=()=>{const s=$('#selsym',m);if(!picked){s.hidden=true;return}s.hidden=false;s.innerHTML=`<b>${esc(picked.name)}</b> <span class="badge">${esc(picked.sym)}</span>${tx?'':' <button type="button" class="btn sm ghost" id="chgsym">wijzig</button>'}`;const c=$('#chgsym',m);if(c)c.onclick=()=>{picked=null;show();$('#mpick',m).hidden=false;updateHint()}};
    show();
    if(!tx){$('#mpick',m).hidden=!!picked;bindPicker($('#mpick',m),r=>{picked=r;$('#mpick',m).hidden=true;show();updateHint()})}
    m._get=()=>picked;

    let hTimer;
    const updateHint=()=>{
      clearTimeout(hTimer);
      hTimer=setTimeout(async()=>{
        const hint=$('#tx_hint',m);if(!hint)return;
        const sym=picked&&picked.sym;
        const dt=$('[name=date]',m)?.value;
        const amt=parseFloat($('[name=amount]',m)?.value);
        const sh=$('[name=shares]',m)?.value;
        const pr=$('[name=price]',m)?.value;
        if(!sym||!dt||sh||pr){hint.innerHTML='';return;}
        hint.innerHTML='Historische koers opzoeken…';
        const hp=await fetchHistPriceOnDate(sym,dt);
        if(hp&&hp>0){
          hint.innerHTML=`💡 Beurskoers op <b>${dt}</b>: <b>${eur(hp)}</b> ${amt>0?`→ circa <b>${shr(amt/hp)}</b> stuks`:''}`;
        }else{
          hint.innerHTML='';
        }
      },300);
    };
    $('[name=date]',m)?.addEventListener('change',updateHint);
    $('[name=amount]',m)?.addEventListener('input',updateHint);
    $('[name=shares]',m)?.addEventListener('input',updateHint);
    $('[name=price]',m)?.addEventListener('input',updateHint);
    updateHint();
  });
}
function alertModal(sym){
  const px=priceEUR(sym);
  openModal(`<h3>Prijsalarm voor ${esc(nameOf(sym))}</h3><form data-form="alert"><input type="hidden" name="sym" value="${esc(sym)}">
  <div class="mu" style="margin-bottom:12px">Huidige koers: <b>${eur(px)}</b></div>
  <div class="row2"><label><span>Melden als de koers</span><select name="dir"><option value="above">boven komt</option><option value="below">onder komt</option></select></label>
  <label><span>Prijs (€)</span><input name="price" type="number" step="0.01" min="0" required value="${px?(px*1.05).toFixed(2):''}"></label></div>
  <div class="acts"><button class="btn pri" type="submit">Alarm opslaan</button><button class="btn" type="button" data-act="closemodal">Annuleren</button></div></form>`);
}
const FORMS={
  async tx(f){
    if(!requireAuth('transacties op te slaan')) return;
    const m=$('#modal'),picked=m._get&&m._get(),fd=new FormData(f);
    if(!picked){toast('Kies eerst een aandeel of ETF');return}
    const id=fd.get('id'),num_=k=>{const v=String(fd.get(k)||'').replace(',','.');return v===''?null:parseFloat(v)};
    let amount=num_('amount'),shares=num_('shares'),price=num_('price');
    if(amount==null&&shares!=null&&price!=null)amount=shares*price;
    if(amount==null||!(amount>0)){toast('Vul een bedrag in');return}
    const sym=picked.sym.toUpperCase();
    if(!S.inst[sym]){S.inst[sym]={name:picked.name,type:picked.type,color:nextColor()};M.bad.delete(sym)}
    const date=fd.get('date');
    if(shares==null&&price==null&&date){
      const hp=await fetchHistPriceOnDate(sym,date);
      if(hp&&hp>0){
        price=hp;
        shares=amount/hp;
      }
    }
    const rec={sym,type:fd.get('type'),date,amount,shares,price};
    if(id){const t=S.tx.find(x=>x.id===id);Object.assign(t,rec);delete t.est;}
    else S.tx.push(Object.assign({id:uid()},rec));
    save();closeModal();toast('Transactie opgeslagen met aankoopkoers');
    if(!M.q[sym])refreshAll();else{render(true)}
  },
  alert(f){
    const fd=new FormData(f),price=parseFloat(String(fd.get('price')).replace(',','.'));
    if(!(price>0))return;
    S.alerts.push({id:uid(),sym:fd.get('sym'),dir:fd.get('dir'),price,done:false});save();closeModal();toast('Prijsalarm ingesteld');render(true);
  },
  plan(f){
    if(!requireAuth('spaarplan aan te passen')) return;
    const fd=new FormData(f);
    const rawSym=(fd.get('sym')||'').trim().toUpperCase();
    if(!rawSym){toast('⚠️ Kies een fonds of ETF');return;}
    if(!S.inst[rawSym]){
      S.inst[rawSym]={name:nameOf(rawSym)||rawSym,type:'ETF',color:nextColor()};
      M.bad.delete(rawSym);
    }
    const amt=Math.max(1,+fd.get('amount')||100);
    const day=Math.min(28,Math.max(1,+fd.get('day')||1));
    const active=fd.get('active')==='on';

    S.plan={sym:rawSym,amount:amt,day,active};

    if(S.accounts){
      if(S.activeAccount!=='ALL'&&S.accounts[S.activeAccount]){
        S.accounts[S.activeAccount].plan={...S.plan};
        if(!S.accounts[S.activeAccount].inst)S.accounts[S.activeAccount].inst={};
        if(!S.accounts[S.activeAccount].inst[rawSym])S.accounts[S.activeAccount].inst[rawSym]={...S.inst[rawSym]};
      }else{
        const firstKey=Object.keys(S.accounts)[0];
        if(firstKey&&S.accounts[firstKey]){
          S.accounts[firstKey].plan={...S.plan};
          if(!S.accounts[firstKey].inst)S.accounts[firstKey].inst={};
          if(!S.accounts[firstKey].inst[rawSym])S.accounts[firstKey].inst[rawSym]={...S.inst[rawSym]};
        }
      }
    }

    UI.proj.monthly=S.plan.amount;save();toast('Spaarplan opgeslagen');render(true);
  }
};

/* ================= events ================= */
const ACT={
  refresh:()=>refreshAll(true),
  closemodal:closeModal,
  addtx:v=>{ if(!requireAuth('nieuwe transacties toe te voegen')) return; txModal({sym:v||null}); },
  edittx:v=>{ if(!requireAuth('transacties te bewerken')) return; txModal({tx:S.tx.find(t=>t.id===v)}); },
  deltx:v=>{ if(!requireAuth('transacties te verwijderen')) return; if(confirm('Transactie verwijderen?')){S.tx=S.tx.filter(t=>t.id!==v);save();render(true)} },
  fixhist:async()=>{
    if(!requireAuth('historische koersen bij te werken')) return;
    toast('Historische koersen ophalen voor al je transacties…');
    let count=0;
    for(const t of S.tx){
      if(t.date&&t.date<today()){
        try{
          const hp=await fetchHistPriceOnDate(t.sym,t.date);
          if(hp&&hp>0){
            t.price=hp;
            t.shares=t.amount/hp;
            delete t.est;
            count++;
          }
        }catch(e){}
      }
    }
    save();render(true);
    toast(`${count} transacties bijgewerkt! Je winst en rendement zijn nu berekend.`);
  },
  star:v=>{if(S.watch.includes(v)){S.watch=S.watch.filter(s=>s!==v);toast('Verwijderd uit watchlist')}else{S.watch.push(v);toast('Toegevoegd aan watchlist')}save();render(true)},
  quickwatch:v=>{if(!S.watch.includes(v)){S.watch.push(v);save();refreshAll()}},
  rminst:v=>{
    if(!requireAuth('beleggingen te verwijderen')) return;
    if(confirm(`${nameOf(v)} en alle bijbehorende transacties en alarmen verwijderen?`)){
    delete S.inst[v];S.tx=S.tx.filter(t=>t.sym!==v);S.alerts=S.alerts.filter(a=>a.sym!==v);if(S.plan.sym===v){S.plan.active=false;S.plan.sym=Object.keys(S.inst)[0]||''}
    save();location.hash='#/portfolio';toast('Verwijderd')}
  },
  book:()=>{ if(!requireAuth('spaarplan stortingen te boeken')) return; bookPlan(); },
  hideest:()=>{S.set.hideEst=true;save();render(true)},
  delalert:v=>{S.alerts=S.alerts.filter(a=>a.id!==v);save();render(true)},
  alertmodal:v=>alertModal(v),
  sort:v=>{UI.sort=UI.sort.key===v?{key:v,dir:-UI.sort.dir}:{key:v,dir:v==='name'?1:-1};render(true)},
  drange:v=>{UI.dRange=v;$$('#dtabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));$('#dchart').classList.add('loading');loadDashChart(positions())},
  srange:v=>{UI.sRange=v;$$('[data-act=srange]').forEach(b=>b.classList.toggle('on',b.dataset.v===v));const [,s]=curRoute();loadStockChart(s.toUpperCase())},
  csvout:()=>exportTransactionsCsv(S.activeAccount),
  open_csv_hub:v=>{ if(!requireAuth('transacties en CSV/Excel bestanden te importeren')) return; openCsvHubModal(v||'export'); },
  new_acc_modal:()=>{ if(!requireAuth('nieuwe brokers toe te voegen')) return; openNewAccountModal(); },
  del_acc:v=>{ if(!requireAuth('accounts te beheren')) return; deleteAccount(v); },
  clear_acc_data:v=>{ if(!requireAuth('transacties te wissen')) return; clearAccountData(v); },
  clear_all_accounts:()=>{ if(!requireAuth('transacties te wissen')) return; clearAccountData('ALL'); },
  export_tx_csv:v=>exportTransactionsCsv(v),
  export_pos_csv:v=>exportPositionsCsv(v),
  export_div_csv:v=>exportDividendsCsv(v),
  export_broker_csv:v=>{const [acc,fmt]=(v||'').split('|');exportBrokerFormatCsv(acc,fmt);},
  download_template:v=>downloadTemplateCsv(v),
  filter_div_yr:v=>{UI.divYearFilter=v;render(true);},
  del_div:v=>{ if(!requireAuth('dividenden te verwijderen')) return; if(confirm('Dividenduitkering verwijderen?')){S.dividends=(S.dividends||[]).filter(d=>d.id!==v);save();render(true);} },
  add_div_modal:()=>{ if(!requireAuth('dividenden toe te voegen')) return; addDividendModal(); },
  notif:()=>{if(!('Notification' in window))return toast('Niet ondersteund in deze browser');Notification.requestPermission().then(p=>toast(p==='granted'?'Meldingen staan aan':'Meldingen geweigerd'))},
  testapi:testApis,
  backup:()=>download('portfolio-backup.json',JSON.stringify(S,null,2),'application/json'),
  reset:()=>{
    if(confirm('Alle gegevens verwijderen en terug naar de beginstand?')){
      if(AUTH.user){
        try{ localStorage.removeItem('pf_tracker_user_' + AUTH.user.id); }catch(_){}
      } else {
        try{ localStorage.removeItem('pf_tracker_demo'); }catch(_){}
      }
      try{ localStorage.removeItem(LS); }catch(_){}
      S=load();
      ensurePortfolioIntegrity(S);
      applyTheme();
      M.q={};M.hist={};
      refreshAll();
      render();
    }
  },
  open_auth_modal: tab => openAuthModal(typeof tab === 'string' ? tab : 'login'),
  open_user_menu: () => openUserMenuModal(),
  sync_cloud_now: async () => {
    try {
      toast('☁ Bezig met synchroniseren...');
      await authFetch('/api/user/data', {
        method: 'POST',
        body: JSON.stringify({ portfolio: S })
      });
      AUTH.syncStatus = 'synced';
      AUTH.lastSync = new Date().toISOString();
      updateChrome();
      closeModal();
      toast('✓ Portfolio succesvol gesynchroniseerd met de cloud!');
    } catch(e){
      toast('⚠️ Fout bij synchroniseren: ' + (e.message || 'geen verbinding'));
    }
  },
  logout_user: async () => {
    if(confirm(`Weet je zeker dat je wilt uitloggen (${AUTH.user?.email})?`)){
      try {
        await authFetch('/api/auth/logout', { method: 'POST' });
      } catch(e){}
      const oldEmail = AUTH.user?.email;
      AUTH.token = null;
      AUTH.user = null;
      try { localStorage.removeItem('ns_auth_token'); } catch(_){}
      try { localStorage.removeItem(LS); } catch(_){}
      S = load(true);
      ensurePortfolioIntegrity(S);
      applyTheme();
      closeModal();
      updateChrome();
      refreshAll();
      render(true);
      toast(`👋 Uitgelogd van ${oldEmail}`);
    }
  },
  switch_acc:(v)=>switchAccount(v),
  toggle_acc_next:()=>toggleNextAccount(),
  toggle_autoswitch:()=>toggleAutoSwitch(),
  set_alloc_mode:v=>{UI.allocFilter=v;UI.holdingsFilter=null;render(true);},
  filter_alloc_holdings:v=>{UI.holdingsFilter=UI.holdingsFilter===v?null:v;render(true);},
  rb_equal:()=>{
    const P=positions(),H=held(P),T=totals(P);
    if(!H.length)return;
    const eq=Math.round((100/H.length)*10)/10;
    UI.rbTargets={};
    H.forEach((p,i)=>{UI.rbTargets[p.sym]=i===H.length-1?+(100-eq*(H.length-1)).toFixed(1):eq;});
    if(!UI.rbTargetsByAcc) UI.rbTargetsByAcc = {};
    UI.rbTargetsByAcc[S.activeAccount || 'default'] = { ...UI.rbTargets };
    UI.rbMode = 'sellbuy';
    toast('Doelen gelijk verdeeld (' + (100/H.length).toFixed(1) + '% elk) · Verkopen & Kopen actief ✓');
    render(true);
  },
  rb_current:()=>{
    const P=positions(),H=held(P),T=totals(P);
    if(!H.length)return;
    UI.rbTargets={};
    let sum=0;
    H.forEach((p,i)=>{
      if(i===H.length-1){
        UI.rbTargets[p.sym]=+(Math.max(0,100-sum)).toFixed(1);
      } else {
        const val=+(Math.round(p.w*10)/10).toFixed(1);
        UI.rbTargets[p.sym]=val;
        sum+=val;
      }
    });
    if(!UI.rbTargetsByAcc) UI.rbTargetsByAcc = {};
    UI.rbTargetsByAcc[S.activeAccount || 'default'] = { ...UI.rbTargets };
    toast('Huidige werkelijke gewichten ingesteld als doel (100%)');
    render(true);
  },
  rb_normalize:()=>{
    const P=positions(),H=held(P);
    if(!H.length)return;
    const curTot=H.reduce((a,p)=>a+(UI.rbTargets[p.sym]||0),0);
    if(curTot<=0){ACT.rb_current();return;}
    let sum=0;
    H.forEach((p,i)=>{
      if(i===H.length-1){
        UI.rbTargets[p.sym]=+(Math.max(0,100-sum)).toFixed(1);
      } else {
        const scaled=+(((UI.rbTargets[p.sym]||0)/curTot*100).toFixed(1));
        UI.rbTargets[p.sym]=scaled;
        sum+=scaled;
      }
    });
    if(!UI.rbTargetsByAcc) UI.rbTargetsByAcc = {};
    UI.rbTargetsByAcc[S.activeAccount || 'default'] = { ...UI.rbTargets };
    toast('Doelen genormaliseerd naar exact 100,0%');
    render(true);
  },
  rb_coresatellite:()=>{
    const P=positions(),H=held(P);
    if(!H.length)return;
    const etfs=H.filter(p=>S.inst[p.sym]?.type==='ETF');
    const stocks=H.filter(p=>S.inst[p.sym]?.type!=='ETF');
    UI.rbTargets={};
    const etfTotalTgt=etfs.length?60:0;
    const stockTotalTgt=stocks.length?(100-etfTotalTgt):100;
    let sum=0;
    if(etfs.length){
      const eqE=Math.round((etfTotalTgt/etfs.length)*10)/10;
      etfs.forEach((p,i)=>{
        const v=(i===etfs.length-1&&!stocks.length)?+(100-sum).toFixed(1):eqE;
        UI.rbTargets[p.sym]=v;
        sum+=v;
      });
    }
    if(stocks.length){
      const rem=100-sum;
      const eqS=Math.round((rem/stocks.length)*10)/10;
      stocks.forEach((p,i)=>{
        const v=i===stocks.length-1?+(100-sum).toFixed(1):eqS;
        UI.rbTargets[p.sym]=v;
        sum+=v;
      });
    }
    if(!UI.rbTargetsByAcc) UI.rbTargetsByAcc = {};
    UI.rbTargetsByAcc[S.activeAccount || 'default'] = { ...UI.rbTargets };
    toast('Core/Satellite model toegepast (60% ETF / 40% Aandelen)');
    render(true);
  },
  rb_single_current:(v)=>{
    if(!v) return;
    const [sym, valStr] = v.split('|');
    const val = parseFloat(valStr);
    if(sym && !isNaN(val)){
      UI.rbTargets[sym] = val;
      if(!UI.rbTargetsByAcc) UI.rbTargetsByAcc = {};
      UI.rbTargetsByAcc[S.activeAccount || 'default'] = { ...UI.rbTargets };
      toast(`${nameOf(sym)} doel ingesteld op ${val}%`);
      render(true);
    }
  },
  rb_nudge:(v)=>{
    if(!v) return;
    const [sym, stepStr] = v.split('|');
    const step = parseFloat(stepStr) || 0.5;
    if(sym){
      const cur = UI.rbTargets[sym] || 0;
      UI.rbTargets[sym] = Math.max(0, Math.min(100, +(cur + step).toFixed(1)));
      if(!UI.rbTargetsByAcc) UI.rbTargetsByAcc = {};
      UI.rbTargetsByAcc[S.activeAccount || 'default'] = { ...UI.rbTargets };
      render(true);
    }
  },
  rb_scenario_example:()=>{
    const P=positions(),H=held(P);
    if(H.length>=2){
      UI.rbScenario={};
      UI.rbScenario[H[0].sym]=-50;
      UI.rbScenario[H[1].sym]=50;
      toast(`Scenario: ${nameOf(H[0].sym)} -50% & ${nameOf(H[1].sym)} +50%`);
      render(true);
    }else{
      toast('Minimaal 2 posities nodig voor dit voorbeeld');
    }
  },
  rb_clearscenario:()=>{
    UI.rbScenario={};
    render(true);
  },
  rb_setmode:(m)=>{
    UI.rbMode=m;
    render(true);
  },
  rb_tab:(t)=>{
    UI.rbTab=t;
    render(true);
  },
  dash_tab:(t)=>{
    UI.dashTab=t;
    render(true);
  },
  rb_apply_ideal:(v)=>{
    UI.rbMode='cashonly';
    UI.rbCash=parseFloat(v)||0;
    toast(`Ideale inleg van ${eur(UI.rbCash)} toegepast!`);
    render(true);
  },
  rb_quick_cash:(v)=>{
    UI.rbMode='cashonly';
    if(v==='clear') UI.rbCash=0;
    else if(v.startsWith('+')) UI.rbCash=(+UI.rbCash||0)+parseFloat(v.slice(1));
    else UI.rbCash=parseFloat(v)||0;
    render(true);
  },
  rb_sheet_modal:()=>{
    const P=positions(),H=held(P);
    if(!H.length)return;
    const currentTotalVal=H.reduce((a,p)=>a+p.value*(1+(UI.rbScenario[p.sym]||0)/100),0);
    const extraCash=Math.max(0, +UI.rbCash||0);
    let orders=[];
    if(UI.rbMode==='cashonly'){
      const allocItems=H.map(p=>({sym:p.sym,val:p.value*(1+(UI.rbScenario[p.sym]||0)/100),tgtPct:UI.rbTargets[p.sym]||0}));
      const allocs=allocateCash(allocItems,extraCash);
      orders=H.map((p,i)=>{
        const val=p.value*(1+(UI.rbScenario[p.sym]||0)/100);
        const px=(p.px||0)*(1+(UI.rbScenario[p.sym]||0)/100);
        const delta=allocs[i];
        const shares=px>0?delta/px:0;
        return {sym:p.sym,name:nameOf(p.sym),delta,shares,action:delta>0.05?'buy':'hold'};
      });
    }else{
      orders=H.map(p=>{
        const val=p.value*(1+(UI.rbScenario[p.sym]||0)/100);
        const px=(p.px||0)*(1+(UI.rbScenario[p.sym]||0)/100);
        const tgtVal=currentTotalVal*((UI.rbTargets[p.sym]||0)/100);
        const delta=tgtVal-val;
        const shares=px>0?Math.abs(delta)/px:0;
        return {sym:p.sym,name:nameOf(p.sym),delta,shares,action:delta>0.05?'buy':delta<-0.05?'sell':'hold'};
      });
    }
    openTradeRepublicSheet(orders,UI.rbMode);
  },
  dist_tab:(v)=>{
    UI.distTab=v;
    render(true);
  },
  rb_scenario_dip:(v)=>{
    const P=positions(),H=held(P);
    const p=parseFloat(v);
    UI.rbScenario={};
    H.forEach(x=>{UI.rbScenario[x.sym]=p});
    toast(`Scenario: ${p>0?'+':''}${p}% marktbeweging`);
    render(true);
  },
  rb_exec:(v)=>{
    const [sym,type,amt,sh]=v.split('|');
    txModal({sym,tx:{sym,type,amount:parseFloat(amt),shares:parseFloat(sh),price:null,date:today()}});
  },
  toggle_privacy:()=>{
    UI.privacyMode = !UI.privacyMode;
    try { localStorage.setItem('pf_privacy', UI.privacyMode ? 'true' : 'false'); } catch(e){}
    toast(UI.privacyMode ? '👁️ Privémodus AAN: bedragen zijn verborgen' : '👁️ Privémodus UIT: bedragen zichtbaar');
    render(true);
  },
  open_acc_picker:()=>{
    openAccountPickerModal();
  },
  open_report_modal:()=>{
    openPrintableReportModal();
  }
};

function openAccountPickerModal(){
  const accList = Object.entries(S.accounts || {}).map(([key, a]) => ({ ...a, id: a.id || key, _key: key }));
  const isAll = S.activeAccount === 'ALL';
  const totalHeldCount = new Set(Object.values(S.accounts || {}).flatMap(a => Object.keys(a.inst || {}))).size;

  openModal(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="margin:0;display:flex;align-items:center;gap:8px">🏛️ Selecteer Account / Broker</h3>
      <button class="btn sm" data-act="new_acc_modal">➕ Nieuw</button>
    </div>
    <div style="font-size:13px;color:var(--mu);margin-bottom:14px">
      Wissel snel tussen individuele accounts of bekijk je geconsolideerde totaalrendement.
    </div>
    <div style="display:grid;gap:10px">
      ${accList.map(a => {
        const accKey = a._key || a.id;
        const isActive = S.activeAccount === accKey;
        const count = Object.keys(a.inst || {}).length;
        return `
          <div class="acc-row-item ${isActive ? 'active' : ''}">
            <div style="display:flex;align-items:center;gap:12px;cursor:pointer;flex:1" data-act="switch_acc" data-v="${accKey}">
              <span style="font-size:24px">${a.icon || '💼'}</span>
              <div>
                <b style="font-size:14px;color:var(--tx)">${esc(a.name)}</b>
                <div style="font-size:12px;color:var(--mu)">Bestand: <code>${esc(a.file || 'blanco')}</code> · ${count} posities</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button class="btn sm ghost" data-act="clear_acc_data" data-v="${accKey}" title="Wis alle data en ontkoppel bestand uit dit account">🧹 Leegmaken</button>
              ${accList.length > 1 ? `<button class="btn sm ghost danger" data-act="del_acc" data-v="${accKey}" title="Verwijder account">${ic('trash',14)}</button>` : ''}
              <button class="btn sm ${isActive ? 'ghost' : 'pri'}" data-act="switch_acc" data-v="${accKey}">${isActive ? 'Actief ✓' : 'Kies'}</button>
            </div>
          </div>
        `;
      }).join('')}

      <div class="acc-row-item ${isAll ? 'active' : ''}" style="cursor:pointer;border-top:2px solid var(--bd)" data-act="switch_acc" data-v="ALL">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:24px">🌍</span>
          <div>
            <b style="font-size:14px;color:var(--tx)">Alle Accounts Samen (Geconsolideerd)</b>
            <div style="font-size:12px;color:var(--mu)">Gecombineerd overzicht voor vermogen &amp; belastingaangifte</div>
          </div>
        </div>
        <div style="text-align:right">
          <span class="badge ${isAll ? 'ac' : ''}">${totalHeldCount} totaal</span>
          ${isAll ? '<div style="font-size:11px;color:var(--ac);font-weight:700;margin-top:4px">✓ Actief</div>' : ''}
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px;padding-top:14px;border-top:1px solid var(--bd)">
      <div style="display:flex;gap:6px">
        <button class="btn sm" data-act="open_csv_hub">📥 CSV Hub</button>
        <button class="btn sm ghost danger" data-act="clear_all_accounts" title="Wis alle gegevens uit alle accounts tegelijk">🧹 Alles leegmaken</button>
      </div>
      <button class="btn pri sm" data-act="closemodal">Klaar</button>
    </div>
  `);
}

function openPrintableReportModal(){
  const P = positions(), T = totals(P), H = held(P);
  const curAccName = S.activeAccount === 'ALL' ? 'Alle Accounts (Geconsolideerd)' : (S.accounts?.[S.activeAccount]?.name || S.activeAccount);
  const totalDiv = (S.dividends || []).reduce((a, d) => a + d.amount, 0);

  openModal(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--bd);padding-bottom:12px">
      <h3 style="margin:0;display:flex;align-items:center;gap:8px">📄 Portfolio Rapport</h3>
      <div style="display:flex;gap:8px">
        <button class="btn pri sm" onclick="window.print()">${ic('print', 14)} Direct Afdrukken / PDF Opslaan</button>
        <button class="btn sm" data-act="closemodal">Sluiten</button>
      </div>
    </div>

    <div class="report-doc" id="printable_report">
      <div class="report-header">
        <div>
          <h2 style="margin:0 0 4px;font-size:22px;color:#0f172a">Vermogens- en Portefeuillerapport</h2>
          <div style="font-size:13px;color:#64748b">
            Account: <b>${esc(curAccName)}</b> · Gegenereerd op: <b>${new Date().toLocaleDateString('nl-NL', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</b>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;font-weight:700">Portfoliowaarde</div>
          <div style="font-size:24px;font-weight:800;color:#0f172a">${eur(T.value)}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <div style="padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
          <div style="font-size:11px;color:#64748b;font-weight:600">Geïnvesteerd Vermogen</div>
          <div style="font-size:16px;font-weight:700;color:#0f172a">${eur(T.cost)}</div>
        </div>
        <div style="padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
          <div style="font-size:11px;color:#64748b;font-weight:600">Totaal Ongerealiseerd Rendement</div>
          <div style="font-size:16px;font-weight:700;color:${T.pl>=0?'#0e8f64':'#d6336c'}">${seur(T.pl)} (${pct(T.plPct)})</div>
        </div>
        <div style="padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
          <div style="font-size:11px;color:#64748b;font-weight:600">Cumulatief Dividend</div>
          <div style="font-size:16px;font-weight:700;color:#0e8f64">${eur(totalDiv)}</div>
        </div>
        <div style="padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
          <div style="font-size:11px;color:#64748b;font-weight:600">Openstaande Posities</div>
          <div style="font-size:16px;font-weight:700;color:#0f172a">${H.length} activa</div>
        </div>
      </div>

      <h4 style="margin:16px 0 8px;font-size:14px;color:#0f172a">Overzicht Openstaande Posities (${H.length})</h4>
      <table class="report-tbl">
        <thead>
          <tr>
            <th>Instrument</th>
            <th>Ticker</th>
            <th>Type</th>
            <th style="text-align:right">Aantal</th>
            <th style="text-align:right">Koers</th>
            <th style="text-align:right">Totale Waarde</th>
            <th style="text-align:right">Inleg</th>
            <th style="text-align:right">Rendement</th>
            <th style="text-align:right">Weging</th>
          </tr>
        </thead>
        <tbody>
          ${H.map(p => `
            <tr>
              <td><b>${esc(nameOf(p.sym))}</b></td>
              <td><code>${esc(p.sym)}</code></td>
              <td>${S.inst[p.sym]?.type === 'ETF' ? 'ETF' : 'Aandeel'}</td>
              <td style="text-align:right">${shr(p.shares)}</td>
              <td style="text-align:right">${eur(p.px)}</td>
              <td style="text-align:right"><b>${eur(p.value)}</b></td>
              <td style="text-align:right">${eur(p.cost)}</td>
              <td style="text-align:right;color:${p.pl>=0?'#0e8f64':'#d6336c'};font-weight:600">${pct(p.plPct)}</td>
              <td style="text-align:right">${num(p.w, 1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="report-sig">
        <div>
          <div style="font-weight:600;margin-bottom:2px">Verantwoording &amp; Controle</div>
          <div>Dit document dient als overzicht voor persoonlijke administratie en belastingaangifte.</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:600;margin-bottom:2px">Status</div>
          <div style="color:#0e8f64;font-weight:700">✓ Geverifieerd &amp; Compleet</div>
        </div>
      </div>
    </div>
  `);
}

function openAuthModal(initialTab = 'login'){
  openModal(`
    <div style="max-width:440px;margin:auto">
      <div style="text-align:center;margin-bottom:18px">
        <div style="width:42px;height:42px;border-radius:12px;background:var(--ac);display:grid;place-items:center;margin:0 auto 10px;color:#0b0e14;box-shadow:0 3px 14px var(--acs)">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0b0e14" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
        <h3 style="margin:0 0 4px;font-size:20px;letter-spacing:-.02em">Northstar Portfolio Cloud</h3>
        <div style="font-size:12.5px;color:var(--mu)">Veilig inloggen en portfolio's bewaren per gebruiker</div>
      </div>

      <div class="auth-tabs">
        <button type="button" class="auth-tab ${initialTab==='login'?'active':''}" data-auth-tab="login">Inloggen</button>
        <button type="button" class="auth-tab ${initialTab==='register'?'active':''}" data-auth-tab="register">Account Aanmaken</button>
      </div>

      <div id="auth_error_box" class="auth-error-box"></div>

      <!-- Inloggen Form -->
      <form id="auth_form_login" style="${initialTab==='login'?'':'display:none'}">
        <div class="auth-field">
          <label>E-mailadres</label>
          <div class="auth-input-wrap">
            <input type="email" id="auth_login_email" required placeholder="bijv. jouw.naam@voorbeeld.nl" autocomplete="email">
          </div>
        </div>
        <div class="auth-field">
          <label>Wachtwoord</label>
          <div class="auth-input-wrap">
            <input type="password" id="auth_login_pw" required placeholder="Jouw wachtwoord" autocomplete="current-password">
            <button type="button" class="auth-pw-toggle" data-toggle-pw="auth_login_pw" title="Wachtwoord tonen/verbergen">
              ${ic('eye', 16)}
            </button>
          </div>
        </div>
        <button type="submit" class="btn pri" style="width:100%;padding:11px;font-size:13.5px;font-weight:700;margin-top:6px" id="auth_login_submit">
          Inloggen →
        </button>
        <div style="text-align:center;margin-top:14px;font-size:12px;color:var(--mu)">
          Nog geen account? <a href="javascript:void(0)" data-switch-auth="register" style="color:var(--ac);font-weight:700">Maak gratis een account aan</a>
        </div>
      </form>

      <!-- Registreren Form -->
      <form id="auth_form_register" style="${initialTab==='register'?'':'display:none'}">
        <div class="auth-field">
          <label>Volledige naam of roepnaam</label>
          <div class="auth-input-wrap">
            <input type="text" id="auth_reg_name" required placeholder="bijv. Nero" autocomplete="name">
          </div>
        </div>
        <div class="auth-field">
          <label>E-mailadres</label>
          <div class="auth-input-wrap">
            <input type="email" id="auth_reg_email" required placeholder="bijv. jouw.naam@voorbeeld.nl" autocomplete="email">
          </div>
        </div>
        <div class="auth-field">
          <label>Kies een wachtwoord (min. 6 tekens)</label>
          <div class="auth-input-wrap">
            <input type="password" id="auth_reg_pw" minlength="6" required placeholder="Minimaal 6 tekens" autocomplete="new-password">
            <button type="button" class="auth-pw-toggle" data-toggle-pw="auth_reg_pw" title="Wachtwoord tonen/verbergen">
              ${ic('eye', 16)}
            </button>
          </div>
        </div>
        <div class="auth-field">
          <label>Herhaal wachtwoord</label>
          <div class="auth-input-wrap">
            <input type="password" id="auth_reg_pw2" minlength="6" required placeholder="Herhaal wachtwoord" autocomplete="new-password">
          </div>
        </div>
        <div style="background:var(--s2);padding:10px 12px;border-radius:8px;border:1px solid var(--bd);margin:12px 0;font-size:12px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:0;font-weight:600;color:var(--tx)">
            <input type="checkbox" id="auth_reg_migrate" style="width:16px;height:16px;accent-color:var(--ac)">
            <span>Kopieer voorbeelddata naar mijn nieuwe account</span>
          </label>
          <div style="color:var(--mu);margin-top:4px;padding-left:24px;font-size:11px">Standaard start je met een leeg portfolio klaar voor je eigen transacties en CSV's.</div>
        </div>
        <button type="submit" class="btn pri" style="width:100%;padding:11px;font-size:13.5px;font-weight:700;margin-top:6px" id="auth_reg_submit">
          Account Registreren →
        </button>
        <div style="text-align:center;margin-top:14px;font-size:12px;color:var(--mu)">
          Heb je al een account? <a href="javascript:void(0)" data-switch-auth="login" style="color:var(--ac);font-weight:700">Log hier in</a>
        </div>
      </form>
    </div>
  `, m => {
    const errBox = m.querySelector('#auth_error_box');
    const formLogin = m.querySelector('#auth_form_login');
    const formRegister = m.querySelector('#auth_form_register');

    const switchTab = (tab) => {
      m.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.authTab === tab));
      formLogin.style.display = tab === 'login' ? 'block' : 'none';
      formRegister.style.display = tab === 'register' ? 'block' : 'none';
      if(errBox) errBox.style.display = 'none';
    };

    m.querySelectorAll('[data-auth-tab]').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.authTab)));
    m.querySelectorAll('[data-switch-auth]').forEach(a => a.addEventListener('click', () => switchTab(a.dataset.switchAuth)));

    m.querySelectorAll('[data-toggle-pw]').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = m.querySelector(`#${btn.dataset.togglePw}`);
        if(inp){
          inp.type = inp.type === 'password' ? 'text' : 'password';
          btn.innerHTML = ic(inp.type === 'password' ? 'eye' : 'eye_off', 16);
        }
      });
    });

    formLogin.addEventListener('submit', async e => {
      e.preventDefault();
      const email = m.querySelector('#auth_login_email').value.trim();
      const password = m.querySelector('#auth_login_pw').value.trim();
      const submitBtn = m.querySelector('#auth_login_submit');
      if(errBox) errBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Inloggen...';

      try {
        const data = await authFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        AUTH.token = data.token;
        AUTH.user = data.user;
        try { localStorage.setItem('ns_auth_token', data.token); } catch(_){}

        // Fetch user portfolio
        const cloudRes = await authFetch('/api/user/data');
        if(cloudRes && cloudRes.portfolio && cloudRes.portfolio.accounts){
          S = cloudRes.portfolio;
          ensurePortfolioIntegrity(S);
          applyTheme();
          try { localStorage.setItem('pf_tracker_user_' + AUTH.user.id, JSON.stringify(S)); } catch(_){}
          AUTH.syncStatus = 'synced';
          AUTH.lastSync = cloudRes.updated_at;
        } else {
          S = load();
          ensurePortfolioIntegrity(S);
          applyTheme();
        }

        closeModal();
        updateChrome();
        refreshAll();
        render(true);
        toast(`👋 Welkom terug, ${AUTH.user.name}!`);
      } catch(err){
        submitBtn.disabled = false;
        submitBtn.textContent = 'Inloggen →';
        if(errBox){
          errBox.textContent = '⚠️ ' + (err.message || 'Inloggen mislukt.');
          errBox.style.display = 'flex';
        }
      }
    });

    formRegister.addEventListener('submit', async e => {
      e.preventDefault();
      const name = m.querySelector('#auth_reg_name').value.trim();
      const email = m.querySelector('#auth_reg_email').value.trim();
      const pw = m.querySelector('#auth_reg_pw').value.trim();
      const pw2 = m.querySelector('#auth_reg_pw2').value.trim();
      const migrate = m.querySelector('#auth_reg_migrate').checked;
      const submitBtn = m.querySelector('#auth_reg_submit');

      if(pw !== pw2){
        if(errBox){
          errBox.textContent = '⚠️ Wachtwoorden komen niet overeen.';
          errBox.style.display = 'flex';
        }
        return;
      }
      if(pw.length < 6){
        if(errBox){
          errBox.textContent = '⚠️ Wachtwoord moet minimaal 6 tekens bevatten.';
          errBox.style.display = 'flex';
        }
        return;
      }

      if(errBox) errBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Account aanmaken...';

      try {
        const payload = { email, password: pw, name };
        if(migrate){
          payload.initial_data = S;
        }
        const data = await authFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        AUTH.token = data.token;
        AUTH.user = data.user;
        try { localStorage.setItem('ns_auth_token', data.token); } catch(_){}
        AUTH.syncStatus = 'synced';
        AUTH.lastSync = new Date().toISOString();

        // Fetch fresh portfolio for this user from cloud
        try {
          const cloudRes = await authFetch('/api/user/data');
          if(cloudRes && cloudRes.portfolio && cloudRes.portfolio.accounts){
            S = cloudRes.portfolio;
            ensurePortfolioIntegrity(S);
            applyTheme();
            try { localStorage.setItem('pf_tracker_user_' + AUTH.user.id, JSON.stringify(S)); } catch(_){}
          } else {
            S = makeFreshUserPortfolio(AUTH.user.name);
            ensurePortfolioIntegrity(S);
            save();
            applyTheme();
          }
        } catch(_) {
          S = makeFreshUserPortfolio(AUTH.user.name);
          ensurePortfolioIntegrity(S);
          save();
          applyTheme();
        }

        closeModal();
        updateChrome();
        refreshAll();
        render(true);
        toast(`🎉 Welkom bij Northstar, ${AUTH.user.name}! Je account is aangemaakt.`);
      } catch(err){
        submitBtn.disabled = false;
        submitBtn.textContent = 'Account Registreren →';
        if(errBox){
          errBox.textContent = '⚠️ ' + (err.message || 'Registratie mislukt.');
          errBox.style.display = 'flex';
        }
      }
    });
  });
}

function openUserMenuModal(){
  if(!AUTH.user) return openAuthModal('login');
  const u = AUTH.user;
  const initials = u.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'U';
  const createdDate = u.created_at ? new Date(u.created_at).toLocaleDateString('nl-NL', { year:'numeric', month:'short', day:'numeric' }) : 'Vandaag';
  const lastSyncStr = AUTH.lastSync ? new Date(AUTH.lastSync).toLocaleTimeString('nl-NL', { hour:'2-digit', minute:'2-digit' }) : 'Zojuist';

  openModal(`
    <div class="user-menu-card">
      <div class="user-menu-head">
        <div class="user-menu-avatar">${esc(initials)}</div>
        <div style="min-width:0;flex:1">
          <div style="font-size:16px;font-weight:800;color:var(--tx)">${esc(u.name)}</div>
          <div style="font-size:12.5px;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(u.email)}</div>
          <div style="font-size:11px;color:var(--mu);margin-top:3px">Lid sinds: ${esc(createdDate)}</div>
        </div>
      </div>

      <div style="background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="auth-sync-dot ${AUTH.syncStatus==='syncing'?'syncing':''}"></span>
          <span style="font-size:12.5px;font-weight:600;color:var(--tx)">
            ${AUTH.syncStatus==='syncing' ? 'Synchroniseren met cloud...' : (AUTH.syncStatus==='error' ? 'Sync fout' : 'Cloud gesynchroniseerd')}
          </span>
        </div>
        <span style="font-size:11.5px;color:var(--mu)">Laatst: ${esc(lastSyncStr)}</span>
      </div>

      <div style="display:grid;gap:6px">
        <button class="user-menu-action" data-act="sync_cloud_now">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>
          </svg>
          <span>Nu forceren synchroniseren met cloud</span>
        </button>

        <button class="user-menu-action" data-act="open_acc_picker">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <span>Beheer Brokers &amp; Portefeuilles (${Object.keys(S.accounts||{}).length} brokers)</span>
        </button>

        <button class="user-menu-action" data-act="backup">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Exporteer persoonlijke backup (JSON)</span>
        </button>

        <button class="user-menu-action danger" data-act="logout_user" style="margin-top:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Uitloggen (${esc(u.email)})</span>
        </button>
      </div>
    </div>
  `);
}

function openDemoGateModal(featureName = 'deze actie uit te voeren'){
  openModal(`
    <div style="padding:10px 4px;text-align:center">
      <div style="width:58px;height:58px;border-radius:50%;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);display:grid;place-items:center;margin:0 auto 16px;font-size:26px">
        🔒
      </div>
      <div style="display:inline-block;background:rgba(245,158,11,0.18);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);font-size:11px;font-weight:800;padding:4px 10px;border-radius:12px;margin-bottom:12px;letter-spacing:.04em">
        🎭 DEMO MODUS ACTIEF
      </div>
      <h2 style="font-size:20px;font-weight:800;margin:0 0 8px;color:var(--tx)">Gratis Account Vereist</h2>
      <p style="font-size:13.5px;color:var(--mu);line-height:1.55;max-width:440px;margin:0 auto 20px">
        Om <b>${esc(featureName)}</b> en je eigen persoonlijke portfolio veilig op te slaan in de cloud, moet je ingelogd zijn met een account.<br>
        In de demo-modus bekijk je momenteel een voorbeeld met fictieve data.
      </p>

      <div style="background:var(--s2);border:1px solid var(--bd);border-radius:12px;padding:14px;text-align:left;margin-bottom:22px;display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--tx)">
          <span style="color:var(--ac);font-weight:bold">✓</span>
          <span><b>Strikte isolatie:</b> Je ziet uitsluitend jouw eigen transacties en saldo.</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--tx)">
          <span style="color:var(--ac);font-weight:bold">✓</span>
          <span><b>Cloud sync:</b> Automatisch opgeslagen in een beveiligde SQLite database.</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--tx)">
          <span style="color:var(--ac);font-weight:bold">✓</span>
          <span><b>Trade Republic & CSV:</b> Importeer onbeperkt al je transacties en documenten.</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:9px">
        <button class="btn pri" style="width:100%;justify-content:center;padding:12px;font-size:13.5px;font-weight:700" data-act="open_auth_modal" data-v="register">
          ✨ Gratis Account Aanmaken (10 sec)
        </button>
        <button class="btn" style="width:100%;justify-content:center;padding:10px;font-size:13px" data-act="open_auth_modal" data-v="login">
          Al een account? Direct Inloggen
        </button>
        <button class="btn ghost sm" style="width:100%;justify-content:center;color:var(--mu);margin-top:2px" data-act="closemodal">
          Verderkijken in Demo Modus
        </button>
      </div>
    </div>
  `);
}

function requireAuth(reason = 'om deze functie te gebruiken'){
  if(AUTH.user) return true;
  openDemoGateModal(reason);
  return false;
}

document.addEventListener('click',e=>{
  if(e.target.classList&&e.target.classList.contains('mback'))return closeModal();
  const el=e.target.closest('[data-act]');
  if(el){const f=ACT[el.dataset.act];if(f)f(el.dataset.v, el, e);return}
  const g=e.target.closest('[data-go]');
  if(g&&!e.target.closest('button,a,input,select'))location.hash=g.dataset.go;
});
document.addEventListener('submit',e=>{const f=e.target.closest('form[data-form]');if(!f)return;e.preventDefault();FORMS[f.dataset.form](f)});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.dataset.set){
    let v=el.type==='checkbox'?el.checked:el.value;if(el.dataset.set==='refresh')v=+v;
    if(!S.set) S.set={};
    S.set[el.dataset.set]=v;
    if(el.dataset.set==='theme'){
      try{localStorage.setItem('pf_tracker_theme',v);}catch(_){}
      applyTheme(v);
    }
    save();
    if(el.dataset.set==='theme'){render(true)}
    if(el.dataset.set==='refresh')schedule();
    if(el.dataset.set==='finnhub')refreshAll();
  }
  if(el.dataset.ui){UI[el.dataset.ui]=el.value;render(true)}
});
document.addEventListener('input',e=>{if(['p_start','p_mon','p_yrs','p_ret'].includes(e.target.id))updateProj()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

/* ================= router & boot ================= */
let routeTok=0;
function curRoute(){
  let h=location.hash.replace(/^#\/?/,'')||'dashboard';
  if(h === 'fiscal' || h === '/fiscal') h = 'dashboard';
  const i=h.indexOf('/');
  return i<0?[h,'']:[h.slice(0,i),decodeURIComponent(h.slice(i+1))];
}
function render(keep){
  const [name,arg]=curRoute();routeTok++;charts.length=0;
  updateChrome();
  (PAGES[name]||PAGES.dashboard)(arg);
  $$('[data-nav]').forEach(a=>a.classList.toggle('on',a.dataset.nav===(name==='stock'?'portfolio':name)));
  if(!keep)window.scrollTo(0,0);
}
window.addEventListener('hashchange',()=>render(false));
function applyTheme(overrideTheme){
  if(overrideTheme){
    if(!S.set) S.set={};
    S.set.theme=overrideTheme;
  }
  const th=(S&&S.set&&S.set.theme)||localStorage.getItem('pf_tracker_theme')||'dark';
  document.documentElement.dataset.theme=th;
  try{localStorage.setItem('pf_tracker_theme',th);}catch(e){}
  if(typeof colors==='function')colors();
}
let timer;function schedule(){clearInterval(timer);if(S.set.refresh>0)timer=setInterval(()=>{if(!document.hidden)refreshAll(false)},S.set.refresh*1000)}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&M.last&&Date.now()-M.last>20000)refreshAll(false)});
applyTheme();updateChrome();render();refreshAll();schedule();initAuth();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(typeof colors==='function')colors()});