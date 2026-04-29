/* =========================================================
   SPHERE — State Management
   localStorage · 포트폴리오 CRUD · 종목 CRUD · 마이그레이션
   ========================================================= */

import { ASSET_BY_TICKER, SAMPLE_HOLDINGS } from './data.js';

const STORAGE_KEY = 'sphere_portfolios_v1';
export const MAX_PORTFOLIOS = 20;

// ---------- 마이그레이션 (구버전 weight 기반 → 수량 기반) ----------
function migrateHoldings(holdings){
  return holdings.map(h=>{
    if (h.quantity != null) return h;
    const a = ASSET_BY_TICKER[h.ticker];
    if (!a) return { ticker:h.ticker, quantity:1, avg_price: h.avg_price ?? 0 };
    const totalRef = a.current_price > 1000 ? 10_000_000 : 10_000;
    const value = (h.weight || 0) * totalRef;
    return {
      ticker: h.ticker,
      quantity: Math.max(1, Math.round(value / a.current_price)),
      avg_price: h.avg_price ?? a.current_price
    };
  });
}

// ---------- 로드/저장 ----------
function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw){
      const parsed = JSON.parse(raw);
      if (parsed.portfolios && parsed.portfolios.length){
        parsed.portfolios.forEach(p => { p.holdings = migrateHoldings(p.holdings || []); });
        return parsed;
      }
    }
  } catch(e){ console.warn('localStorage read failed', e); }
  const defaultPf = {
    id: 'pf_' + Date.now(),
    name: '포트폴리오 1',
    holdings: SAMPLE_HOLDINGS.slice(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  return { portfolios:[defaultPf], activeId: defaultPf.id };
}

export const STATE = loadState();

export function saveState(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); }
  catch(e){ console.warn('localStorage write failed', e); }
}

export function activePortfolio(){
  return STATE.portfolios.find(p => p.id === STATE.activeId) || STATE.portfolios[0];
}

// ---------- 수량 → 비중 자동 계산 ----------
export function computeWeights(holdings){
  const enriched = holdings.map(h=>{
    const a = ASSET_BY_TICKER[h.ticker];
    const value = (h.quantity || 0) * (a ? a.current_price : 0);
    return { ...h, market_value: value };
  });
  const total = enriched.reduce((s,h)=> s + h.market_value, 0);
  return {
    items: enriched.map(h => ({ ...h, weight: total>0 ? h.market_value/total : 0 })),
    totalValue: total
  };
}

// 포트폴리오 → pipeline 입력용 raw 변환
export function portfolioToRaw(pf){
  const { items, totalValue } = computeWeights(pf.holdings);
  const raws = items.map(h => {
    const a = ASSET_BY_TICKER[h.ticker];
    if (!a) return null;
    return {
      ticker: a.ticker,
      name: a.name,
      sector: a.sector,
      weight: h.weight,
      quantity: h.quantity,
      market_value: h.market_value,
      current_price: a.current_price,
      avg_price: h.avg_price ?? a.current_price,
      market_cap: a.market_cap,
      volatility_30d: a.volatility_30d,
      beta: a.beta,
      debt_ratio: a.debt_ratio,
      liquidity_volume: a.liquidity_volume
    };
  }).filter(Boolean);
  return { raws, totalValue };
}

// ---------- 포트폴리오 CRUD ----------
export function createPortfolio(name){
  if (STATE.portfolios.length >= MAX_PORTFOLIOS) return null;
  const pf = {
    id: 'pf_' + Date.now(),
    name: name || '무제 포트폴리오',
    holdings: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  STATE.portfolios.push(pf);
  STATE.activeId = pf.id;
  saveState();
  return pf;
}

export function deletePortfolio(id){
  if (STATE.portfolios.length <= 1) return false;
  STATE.portfolios = STATE.portfolios.filter(p => p.id !== id);
  STATE.activeId = STATE.portfolios[0].id;
  saveState();
  return true;
}

export function renamePortfolio(id, name){
  const p = STATE.portfolios.find(x => x.id === id);
  if (!p) return false;
  p.name = (name || '').trim() || p.name;
  p.updatedAt = Date.now();
  saveState();
  return true;
}

export function setActivePortfolio(id){
  STATE.activeId = id;
  saveState();
}

// ---------- 종목 CRUD ----------
export function addHoldingToActive(ticker){
  const pf = activePortfolio();
  if (pf.holdings.some(h => h.ticker === ticker)) return false;
  const a = ASSET_BY_TICKER[ticker];
  if (!a) return false;
  pf.holdings.push({ ticker, quantity: 1, avg_price: a.current_price });
  pf.updatedAt = Date.now();
  saveState();
  return true;
}

export function removeHoldingFromActive(ticker){
  const pf = activePortfolio();
  pf.holdings = pf.holdings.filter(h => h.ticker !== ticker);
  pf.updatedAt = Date.now();
  saveState();
}

export function updateHoldingQuantityActive(ticker, newQty){
  const pf = activePortfolio();
  const target = pf.holdings.find(h => h.ticker === ticker);
  if (!target) return;
  target.quantity = Math.max(1, Math.floor(newQty));
  pf.updatedAt = Date.now();
  saveState();
}
