/* =========================================================
   SPHERE — 공유 도메인 타입
   - Asset / Holding / Portfolio / Item / Balance / Insight
   - 카탈로그·시세 JSON 스키마
   ========================================================= */

export type Sector =
  | 'IT' | 'BIO' | 'AUTO' | 'GLOBAL_ETF' | 'INDUSTRIAL'
  | 'ETC' | 'FIN' | 'ENERGY' | 'CONSUMER' | 'REALESTATE';

/** 마스터 DB 의 종목/ETF 한 개 */
export interface Asset {
  ticker: string;
  name: string;
  name_en?: string;
  sector: Sector;
  current_price: number;
  market_cap: number;
  volatility_30d: number;
  beta: number;
  debt_ratio: number;
  liquidity_volume: number;
  is_etf: boolean;
  alias?: string;
  dividend_yield?: number;
  /** catalog 로더가 채운 항목 표시 */
  _fromCatalog?: boolean;
}

/** 사용자가 보유한 한 종목 — 수량 기반 */
export interface Holding {
  ticker: string;
  quantity: number;
  avg_price: number;
  /** computeWeights 가 추가 */
  market_value?: number;
  /** computeWeights 가 추가 */
  weight?: number;
}

/** 포트폴리오 (localStorage 저장 단위) */
export interface Portfolio {
  id: string;
  name: string;
  holdings: Holding[];
  createdAt: number;
  updatedAt: number;
}

/** 5-layer pipeline 이 만들어내는 한 종목 */
export interface Item {
  ticker: string;
  name: string;
  name_en?: string;
  sector: Sector;
  weight: number;
  quantity?: number;
  market_value?: number;
  current_price: number;
  avg_price: number;
  return_pct: number;
  market_cap: number;
  volatility_30d: number;
  beta: number;
  debt_ratio: number;
  liquidity_volume: number;
  is_etf: boolean;
  dividend_yield: number;
  /** computeRiskScores 가 채움 */
  risk_score: number;
  /** mapSphereCoords 가 채움 */
  sphere_coord: { lat: number; lng: number; r: number };
}

export interface BalanceMetrics {
  balance: number;
  balance_raw?: number;
  diverse: number;
  diverse_raw?: number;
  deviation: number;
  deviation_raw?: number;
  sphericity: number;
  sphericity_raw?: number;
  hhi: string;
  hhi_raw?: number;
  avgRisk: number;
  avgRisk_raw?: number;
  sectorWeights: Partial<Record<Sector, number>>;
}

export type InsightLevel = 'ok' | 'warn' | 'alert';

export interface Insight {
  level: InsightLevel;
  title: string;
  body: string;
}

/** data/tickers.json 스키마 */
export interface TickersJSON {
  generated_at?: string;
  tickers: Partial<Asset>[];
}

/** data/prices.json 스키마 */
export interface PricesJSON {
  updated_at: string;
  count?: number;
  failed?: string[];
  prices: Record<string, {
    price?: number;
    volatility_30d?: number;
    beta?: number;
    volume?: number;
    dividend_yield?: number;
  }>;
}

export interface CatalogMeta {
  added: number;
  total: number;
  generatedAt?: string;
}

export interface PriceMeta {
  updated: number;
  updatedAt: string;
}

/** STATE — localStorage 의 단일 객체 */
export interface SphereState {
  portfolios: Portfolio[];
  activeId: string;
}
