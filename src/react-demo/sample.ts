/* =========================================================
   React 데모용 샘플 포트폴리오
   - 표준 모드의 ASSET_DB / catalog 로더 의존 없이 자급자족
   - pipeline.standardize 가 누락 필드를 SECTOR_DEF 평균값으로 채움
   ========================================================= */

import type { Sector } from '../types';

export interface SampleRow {
  ticker: string;
  name: string;
  name_en: string;
  sector: Sector;
  weight: number;
  current_price: number;
  volatility_30d?: number;
  beta?: number;
  debt_ratio?: number;
  liquidity_volume?: number;
}

export const SAMPLE_PORTFOLIO: SampleRow[] = [
  { ticker: 'AAPL',      name: '애플',       name_en: 'Apple',       sector: 'IT',         weight: 0.22, current_price: 182.5, volatility_30d: 0.26, beta: 1.20, debt_ratio: 0.55, liquidity_volume: 65_000_000 },
  { ticker: '005930.KS', name: '삼성전자',   name_en: 'Samsung',     sector: 'IT',         weight: 0.18, current_price: 71_200, volatility_30d: 0.24, beta: 1.05, debt_ratio: 0.30, liquidity_volume: 18_000_000 },
  { ticker: 'TSLA',      name: '테슬라',     name_en: 'Tesla',       sector: 'AUTO',       weight: 0.10, current_price: 245.0, volatility_30d: 0.55, beta: 1.95, debt_ratio: 0.45, liquidity_volume: 90_000_000 },
  { ticker: 'JPM',       name: 'JP모건',     name_en: 'JPMorgan',    sector: 'FIN',        weight: 0.13, current_price: 195.3, volatility_30d: 0.18, beta: 1.05, debt_ratio: 0.85, liquidity_volume: 12_000_000 },
  { ticker: 'KO',        name: '코카콜라',   name_en: 'Coca-Cola',   sector: 'CONSUMER',   weight: 0.10, current_price: 62.4,  volatility_30d: 0.14, beta: 0.65, debt_ratio: 0.45, liquidity_volume: 13_000_000 },
  { ticker: 'VOO',       name: 'S&P 500',    name_en: 'Vanguard S&P 500 ETF', sector: 'GLOBAL_ETF', weight: 0.20, current_price: 450.0, volatility_30d: 0.16, beta: 1.00, debt_ratio: 0.0, liquidity_volume: 5_000_000 },
  { ticker: 'XOM',       name: '엑손모빌',   name_en: 'ExxonMobil',  sector: 'ENERGY',     weight: 0.07, current_price: 112.0, volatility_30d: 0.22, beta: 0.90, debt_ratio: 0.25, liquidity_volume: 14_000_000 },
];
