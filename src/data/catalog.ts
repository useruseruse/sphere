/* =========================================================
   SPHERE — 비동기 데이터 로더
   data/tickers.json → ASSET_DB 확장 (700+ 종목 추가)
   data/prices.json  → ASSET_DB 일별 시세 덮어쓰기
   ========================================================= */

import { ASSET_DB, ASSET_BY_TICKER } from './assetDb.js';
import type { Asset, CatalogMeta, PriceMeta, Sector, TickersJSON, PricesJSON } from '../types.js';

// 마지막 로드 결과 — 라이브 바인딩으로 외부에서 관찰 가능
export let SPHERE_CATALOG_META: CatalogMeta | null = null;
export let SPHERE_PRICE_META: PriceMeta | null = null;

// 디버깅 편의: window 에도 노출
if (typeof window !== 'undefined') {
  (window as any).SPHERE_CATALOG_META = null;
  (window as any).SPHERE_PRICE_META = null;
}

async function fetchFirstOk(candidates: string[]): Promise<Response | null> {
  for (const url of candidates) {
    try {
      const res = await fetch(url + '?t=' + Date.now(), { cache: 'no-cache' });
      if (res && res.ok) return res;
    } catch {
      // 다음 후보 시도
    }
  }
  return null;
}

// 티커 카탈로그 — ASSET_DB 확장 (KOSPI/KOSDAQ + S&P500 + ETF 700+)
export async function applyTickerCatalog(): Promise<CatalogMeta | null> {
  try {
    const res = await fetchFirstOk(['./data/tickers.json', '../data/tickers.json']);
    if (!res) return null;
    const data: TickersJSON = await res.json();
    if (!data.tickers || !Array.isArray(data.tickers)) return null;

    let added = 0;
    data.tickers.forEach(item => {
      if (!item.ticker || ASSET_BY_TICKER[item.ticker]) return;  // 핵심 ASSET_DB 우선
      const entry: Asset = {
        ticker: item.ticker,
        name: item.name || item.ticker,
        name_en: item.name_en || item.name || item.ticker,
        sector: (item.sector as Sector) || 'ETC',
        current_price: item.current_price || 0,
        market_cap: item.market_cap || 0,
        volatility_30d: item.volatility_30d != null ? item.volatility_30d : 0.25,
        beta: item.beta != null ? item.beta : 1.0,
        debt_ratio: item.debt_ratio != null ? item.debt_ratio : 0.30,
        liquidity_volume: item.liquidity_volume || 0,
        is_etf: !!item.is_etf,
        alias: (item.alias || item.name_en || item.name || '').toLowerCase(),
        _fromCatalog: true
      };
      ASSET_DB.push(entry);
      ASSET_BY_TICKER[entry.ticker] = entry;
      added++;
    });

    SPHERE_CATALOG_META = { added, total: ASSET_DB.length, generatedAt: data.generated_at };
    if (typeof window !== 'undefined') (window as any).SPHERE_CATALOG_META = SPHERE_CATALOG_META;
    return SPHERE_CATALOG_META;
  } catch (e) {
    console.warn('[SPHERE] Ticker catalog load failed:', e);
    return null;
  }
}

// 일별 시세 로딩 — ASSET_DB 덮어쓰기
export async function applyDailyPrices(): Promise<PriceMeta | null> {
  try {
    const res = await fetchFirstOk(['./data/prices.json', '../data/prices.json']);
    if (!res) return null;
    const data: PricesJSON = await res.json();
    if (!data.prices || !data.updated_at) return null;

    let updated = 0;
    Object.entries(data.prices).forEach(([ticker, info]) => {
      const a = ASSET_BY_TICKER[ticker];
      if (a && info.price) {
        a.current_price = info.price;
        if (info.volatility_30d != null) a.volatility_30d = info.volatility_30d;
        if (info.beta != null) a.beta = info.beta;
        if (info.volume != null) a.liquidity_volume = info.volume;
        if (info.dividend_yield != null) a.dividend_yield = info.dividend_yield;
        updated++;
      }
    });

    SPHERE_PRICE_META = { updated, updatedAt: data.updated_at };
    if (typeof window !== 'undefined') (window as any).SPHERE_PRICE_META = SPHERE_PRICE_META;
    return SPHERE_PRICE_META;
  } catch (e) {
    console.warn('[SPHERE] Daily price load failed:', e);
    return null;
  }
}
