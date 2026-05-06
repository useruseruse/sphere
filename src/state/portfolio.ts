/* =========================================================
   SPHERE — 포트폴리오 상태 (localStorage)
   - STATE 단일 객체 + 마이그레이션 + 평가금액/비중 자동 계산
   - holdings 는 수량(quantity) 기반. 비중은 평가금액 합으로 도출.
   ========================================================= */

import { ASSET_BY_TICKER, SAMPLE_HOLDINGS } from '../data/assetDb.js';
import { t } from '../i18n.js';
import { showToast } from '../ui/toast-react/index.js';
import { schedulePush } from '../cloud/sync.js';
import type { Holding, Portfolio, SphereState } from '../types.js';

export const STORAGE_KEY = 'sphere_portfolios_v1';
export const MAX_PORTFOLIOS = 20;

/** 구버전 holdings(weight 기반) → 수량 기반 자동 변환 */
export function migrateHoldings(holdings: any[]): Holding[] {
  return holdings.map(h => {
    if (h.quantity != null) return h as Holding;
    const a = ASSET_BY_TICKER[h.ticker];
    if (!a) return { ticker: h.ticker, quantity: 1, avg_price: h.avg_price ?? 0 };
    // 가격 자릿수로 KRW/USD 추정
    const totalRef = a.current_price > 1000 ? 10_000_000 : 10_000;
    const value = (h.weight || 0) * totalRef;
    return {
      ticker: h.ticker,
      quantity: Math.max(1, Math.round(value / a.current_price)),
      avg_price: h.avg_price ?? a.current_price
    };
  });
}

function loadState(): SphereState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw){
      const parsed = JSON.parse(raw) as SphereState;
      if (parsed.portfolios && parsed.portfolios.length){
        parsed.portfolios.forEach(p => { p.holdings = migrateHoldings(p.holdings || []); });
        return parsed;
      }
    }
  } catch(e){ console.warn('localStorage read failed', e); }
  // 첫 실행: 기본 포트폴리오 생성
  const defaultPf: Portfolio = {
    id: 'pf_' + Date.now(),
    name: '포트폴리오 1',
    holdings: SAMPLE_HOLDINGS.slice(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  return { portfolios: [defaultPf], activeId: defaultPf.id };
}

// STATE 는 객체. 타 모듈은 mutation 으로만 갱신 (재할당 없음).
export const STATE: SphereState = loadState();

export function saveState(showFeedback = false): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
    const totalHoldings = STATE.portfolios.reduce((s, p) => s + (p.holdings || []).length, 0);
    console.info(`[SPHERE] State saved · ${STATE.portfolios.length} portfolios · ${totalHoldings} total holdings`);
    if (showFeedback) showToast(t('savedToast'), 'safe');
  } catch(e){
    console.warn('localStorage write failed', e);
    if (showFeedback) showToast(t('saveFailToast'), 'high');
  }
  // 로그인된 상태면 클라우드로 debounce push (비활성/비로그인이면 no-op)
  schedulePush();
}

export function activePortfolio(): Portfolio {
  return STATE.portfolios.find(p => p.id === STATE.activeId) || STATE.portfolios[0];
}

/** 수량 → 평가금액 → 비중 자동 계산 */
export function computeWeights(holdings: Holding[]): { items: Holding[]; totalValue: number } {
  const enriched = holdings.map(h => {
    const a = ASSET_BY_TICKER[h.ticker];
    const value = (h.quantity || 0) * (a ? a.current_price : 0);
    return { ...h, market_value: value };
  });
  const total = enriched.reduce((s, h) => s + h.market_value, 0);
  return {
    items: enriched.map(h => ({ ...h, weight: total > 0 ? h.market_value / total : 0 })),
    totalValue: total
  };
}

/** portfolioToRaw 호출 시 갱신되는 합계 — 라이브 바인딩으로 외부 노출 */
export let TOTAL_PORTFOLIO_VALUE = 0;

/** 포트폴리오 → 파이프라인 입력 (마스터 DB 조회 + 비중 + 시세 합성) */
export function portfolioToRaw(pf: Portfolio): any[] {
  const { items, totalValue } = computeWeights(pf.holdings);
  TOTAL_PORTFOLIO_VALUE = totalValue;
  return items.map(h => {
    const a = ASSET_BY_TICKER[h.ticker];
    if (!a) return null;
    return {
      ticker: a.ticker,
      name: a.name,
      name_en: a.name_en,
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
      liquidity_volume: a.liquidity_volume,
      is_etf: a.is_etf,
      dividend_yield: a.dividend_yield ?? 0
    };
  }).filter(Boolean);
}
