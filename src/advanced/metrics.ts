// @ts-nocheck
/* =========================================================
   SPHERE — Advanced Metrics
   - VaR, CVaR, Sharpe, Sortino, 분산효과(DR)
   - Stress test (preset 시나리오) + Macro factor 합성 (custom)
   ========================================================= */

import { CURRENT_LANG } from '../i18n.js';

// =========================================================
// Advanced Metrics — VaR, CVaR, Sharpe, Sortino, 분산효과(DR)
// =========================================================
// 무위험수익률·시장프리미엄·환산상수
const RISK_FREE_ANNUAL = 0.035;       // 3.5% (한국+미국 가중 근사)
const MARKET_PREMIUM   = 0.060;       // 연 6% — Damodaran 2024 기준 중간값
const TRADING_DAYS     = 252;
const Z95              = 1.6449;      // 95% 정규분위
const Z99              = 2.3263;      // 99%
const ES95_ADJ         = 2.0627;      // E[Z | Z<-1.6449] ≈ -2.0627 (CVaR 95%)

// 자산쌍 상관계수 — 동일 섹터/지역에 따라 휴리스틱
function pairwiseCorr(a, b){
  if (a.ticker === b.ticker) return 1.0;
  const sameSector = a.sector === b.sector;
  const aKR = /\.(KS|KQ)$/.test(a.ticker), bKR = /\.(KS|KQ)$/.test(b.ticker);
  const sameRegion = (aKR === bKR);
  const aETF = !!a.is_etf || a.sector === 'GLOBAL_ETF';
  const bETF = !!b.is_etf || b.sector === 'GLOBAL_ETF';
  // ETF는 시장 전체와 0.85 정도 상관
  if (aETF && bETF) return 0.85;
  if (aETF || bETF) return 0.55;
  if (sameSector && sameRegion) return 0.68;
  if (sameSector) return 0.50;
  if (sameRegion) return 0.32;
  return 0.18;
}

// 포트폴리오 변동성 — Markowitz: σ_p² = ΣΣ w_i w_j σ_i σ_j ρ_ij
function portfolioVol(items){
  let s2 = 0;
  for (let i=0;i<items.length;i++){
    for (let j=0;j<items.length;j++){
      const a = items[i], b = items[j];
      const rho = (i===j) ? 1.0 : pairwiseCorr(a, b);
      s2 += a.weight * b.weight * a.volatility_30d * b.volatility_30d * rho;
    }
  }
  return Math.sqrt(Math.max(0, s2));
}

// 포트폴리오 기대수익률 — CAPM 가중합
function portfolioBeta(items){
  return items.reduce((s, it) => s + it.weight * it.beta, 0);
}
function portfolioExpectedReturn(items){
  const beta = portfolioBeta(items);
  return RISK_FREE_ANNUAL + beta * MARKET_PREMIUM;
}

// VaR/CVaR — 패러메트릭 정규성 가정 (1일 95%/99%)
export function computeAdvancedMetrics(items, balance){
  if (!items || items.length === 0){
    return {
      portVol:0, portReturn:0, portBeta:0,
      sharpe:0, sortino:0, var95:0, cvar95:0, var99:0,
      dr:1, riskReduction:0,
      totalValue:0
    };
  }
  const totalValue = items.reduce((s,i)=> s + (i.market_value||0), 0);
  const sigmaA = portfolioVol(items);                                     // 연환산
  const sigmaD = sigmaA / Math.sqrt(TRADING_DAYS);                        // 일환산
  const expRet = portfolioExpectedReturn(items);                          // 연환산
  const beta   = portfolioBeta(items);

  // VaR/CVaR — 평균 수익률 무시(보수적), 손실 = z * σ_D * V
  const var95  = Z95     * sigmaD * totalValue;
  const var99  = Z99     * sigmaD * totalValue;
  const cvar95 = ES95_ADJ * sigmaD * totalValue;

  // Sharpe = (μ − rf) / σ
  const sharpe  = sigmaA > 0 ? (expRet - RISK_FREE_ANNUAL) / sigmaA : 0;
  // Sortino — 하방변동성 ≈ σ × 0.71 (Sortino/Sharpe 경험적 비율)
  // 동일 분자, 분모만 하방 σ 로 교체
  const downside = sigmaA * 0.71;
  const sortino = downside > 0 ? (expRet - RISK_FREE_ANNUAL) / downside : 0;

  // Diversification Ratio = Σ(w_i × σ_i) / σ_p
  const weightedVolSum = items.reduce((s,i)=> s + i.weight * i.volatility_30d, 0);
  const dr = sigmaA > 0 ? weightedVolSum / sigmaA : 1;
  const riskReduction = weightedVolSum > 0 ? (1 - sigmaA / weightedVolSum) : 0;

  // 연간 배당 추정 = Σ(market_value × dividend_yield)
  const annualDividend = items.reduce((s,i)=> s + (i.market_value||0) * (i.dividend_yield||0), 0);
  const dividendYieldPort = totalValue > 0 ? annualDividend / totalValue : 0;

  return {
    totalValue,
    portBeta: beta,
    portVol: sigmaA,            // 연환산 표준편차
    portVolDaily: sigmaD,
    portReturn: expRet,         // 연환산 기대수익률
    sharpe, sortino,
    var95, var99, cvar95,
    dr, riskReduction,
    annualDividend, dividendYieldPort
  };
}

// =========================================================
// 스트레스 테스트 시나리오 — 섹터별 충격 배수
// =========================================================
export const STRESS_SCENARIOS = {
  'gfc2008': {
    label_ko: '2008 글로벌 금융위기',
    label_en: '2008 Global Financial Crisis',
    period: '2008-09-15 ~ 2009-03-09 (약 6개월)',
    benchmark: 'S&P 500 −56%',
    desc_ko: 'Lehman 파산 후 6개월. 미국 섹터 ETF (XLF·XLRE 전신·XLE·XLK 등) 누적 수익률 기반.',
    desc_en: 'Lehman to S&P trough (6 mo). Sector returns from XLF/XLE/XLK etc.',
    source: 'Yahoo Finance · SPDR Sector ETFs',
    shocks: { IT:-0.52, BIO:-0.34, AUTO:-0.55, FIN:-0.82, ENERGY:-0.46,
              CONSUMER:-0.35, REALESTATE:-0.71, INDUSTRIAL:-0.57,
              GLOBAL_ETF:-0.50, ETC:-0.40 }
  },
  'covid2020': {
    label_ko: '2020 코로나 셧다운',
    label_en: '2020 COVID Shutdown',
    period: '2020-02-19 ~ 2020-03-23 (35일)',
    benchmark: 'S&P 500 −34%',
    desc_ko: '2020.2~3 패닉 35일. WHO 팬데믹 선언 전후. 에너지·여행 직격, 헬스케어/IT 회복.',
    desc_en: 'Feb–Mar 2020 panic (35 days). Energy/travel hit, healthcare/IT rebounded.',
    source: 'Yahoo Finance · SPDR Sector ETFs',
    shocks: { IT:-0.22, BIO:-0.19, AUTO:-0.45, FIN:-0.41, ENERGY:-0.56,
              CONSUMER:-0.28, REALESTATE:-0.42, INDUSTRIAL:-0.35,
              GLOBAL_ETF:-0.34, ETC:-0.30 }
  },
  'inflation2022': {
    label_ko: '2022 인플레이션·금리쇼크',
    label_en: '2022 Inflation/Rate Shock',
    period: '2022-01-03 ~ 2022-10-12 (약 9개월)',
    benchmark: 'S&P 500 −25% / NASDAQ −36%',
    desc_ko: 'Fed 425bp 인상. 성장주·REIT·암호자산 큰 손실, 에너지 +52% 수혜.',
    desc_en: 'Fed +425bp hikes. Growth/REIT/crypto down, Energy +52% benefited.',
    source: 'Yahoo Finance · SPDR Sector ETFs · 2022 YTD',
    shocks: { IT:-0.32, BIO:-0.18, AUTO:-0.39, FIN:-0.19, ENERGY:+0.52,
              CONSUMER:-0.34, REALESTATE:-0.33, INDUSTRIAL:-0.18,
              GLOBAL_ETF:-0.25, ETC:-0.20 }
  },
  'dotcom2000': {
    label_ko: '2000 닷컴 버블 붕괴',
    label_en: '2000 Dotcom Bubble Burst',
    period: '2000-03-10 ~ 2002-10-09 (약 31개월)',
    benchmark: 'NASDAQ −78% / S&P 500 −49%',
    desc_ko: '2000.3~2002.10 베어마켓. IT 폭락, 에너지·소비재는 상대적 선방.',
    desc_en: 'Mar 2000 – Oct 2002 bear. Tech crushed, defensives held up.',
    source: 'Yahoo Finance · S&P/NASDAQ historical',
    shocks: { IT:-0.78, BIO:-0.50, AUTO:-0.30, FIN:-0.25, ENERGY:+0.05,
              CONSUMER:+0.05, REALESTATE:-0.10, INDUSTRIAL:-0.30,
              GLOBAL_ETF:-0.49, ETC:-0.25 }
  }
};

// =========================================================
// 매크로 팩터 — 거시 인자 단위 섹터 영향 행렬 (학술/실무 컨센서스 근사)
// 사용자가 여러 매크로를 조합하면 합산해서 커스텀 시나리오 생성
// =========================================================
export const MACRO_FACTORS = {
  rateHike: {
    label_ko: '금리 인상 (+200bp)', label_en: 'Rate Hike (+200bp)',
    desc_ko: 'Fed/BOK 200bp 인상. 성장주·REIT·장기채 압박, 은행주 마진 개선.',
    desc_en: 'Fed/BOK +200bp hike. Hits growth/REIT/long bonds, helps bank margins.',
    impact: { IT:-0.12, BIO:-0.08, AUTO:-0.10, FIN:+0.05, ENERGY:-0.02,
              CONSUMER:-0.06, REALESTATE:-0.18, INDUSTRIAL:-0.05, GLOBAL_ETF:-0.07, ETC:-0.05 }
  },
  rateCut: {
    label_ko: '금리 인하 (-200bp)', label_en: 'Rate Cut (-200bp)',
    desc_ko: '경기부양형 인하. 성장주·REIT 호재, 은행 NIM 압박.',
    desc_en: 'Easing cycle. Boosts growth/REIT, pressures bank NIM.',
    impact: { IT:+0.12, BIO:+0.08, AUTO:+0.08, FIN:-0.05, ENERGY:+0.02,
              CONSUMER:+0.05, REALESTATE:+0.16, INDUSTRIAL:+0.05, GLOBAL_ETF:+0.07, ETC:+0.04 }
  },
  inflation: {
    label_ko: '인플레이션 ↑', label_en: 'Inflation Surge',
    desc_ko: 'CPI 6%+ 진입. 명목자산 가치 하락, 실물·에너지·금 수혜.',
    desc_en: 'CPI 6%+. Nominal assets pressured, energy/commodities benefit.',
    impact: { IT:-0.08, BIO:-0.04, AUTO:-0.06, FIN:-0.03, ENERGY:+0.18,
              CONSUMER:-0.06, REALESTATE:-0.04, INDUSTRIAL:+0.04, GLOBAL_ETF:-0.05, ETC:-0.02 }
  },
  recession: {
    label_ko: '경기 침체', label_en: 'Recession',
    desc_ko: '명목 GDP -2%, 실업 ↑. 경기민감주 하락, 방어주(생필품·헬스) 선방.',
    desc_en: 'GDP −2%, unemployment up. Cyclicals down, defensives (staples/health) hold.',
    impact: { IT:-0.18, BIO:-0.05, AUTO:-0.32, FIN:-0.22, ENERGY:-0.20,
              CONSUMER:-0.15, REALESTATE:-0.18, INDUSTRIAL:-0.25, GLOBAL_ETF:-0.18, ETC:-0.15 }
  },
  oilSurge: {
    label_ko: '유가 급등 (+50%)', label_en: 'Oil Surge (+50%)',
    desc_ko: 'WTI $50→$75. 에너지 직접 수혜, 항공/소비 직격.',
    desc_en: 'WTI $50→$75. Energy benefits, airlines/consumers hit.',
    impact: { IT:-0.04, BIO:-0.02, AUTO:-0.10, FIN:-0.02, ENERGY:+0.35,
              CONSUMER:-0.10, REALESTATE:-0.04, INDUSTRIAL:-0.06, GLOBAL_ETF:0, ETC:-0.04 }
  },
  oilCrash: {
    label_ko: '유가 급락 (-50%)', label_en: 'Oil Crash (-50%)',
    desc_ko: '에너지 손실, 소비재·항공 수혜.',
    desc_en: 'Energy loses, consumers/airlines benefit.',
    impact: { IT:+0.04, BIO:+0.02, AUTO:+0.08, FIN:+0.02, ENERGY:-0.35,
              CONSUMER:+0.08, REALESTATE:+0.04, INDUSTRIAL:+0.06, GLOBAL_ETF:0, ETC:+0.02 }
  },
  usdStrong: {
    label_ko: 'USD 강세 (+10%)', label_en: 'USD Strength (+10%)',
    desc_ko: '달러 인덱스 ↑. 미국 수출주·이머징 부담, 한국 수출주 환차익.',
    desc_en: 'DXY up. Hits US exporters/EM, KR exporters get FX gain.',
    impact: { IT:-0.06, BIO:-0.03, AUTO:+0.04, FIN:+0.02, ENERGY:-0.05,
              CONSUMER:-0.04, REALESTATE:-0.02, INDUSTRIAL:-0.03, GLOBAL_ETF:-0.04, ETC:-0.02 }
  },
  usdWeak: {
    label_ko: 'USD 약세 (-10%)', label_en: 'USD Weakness (-10%)',
    desc_ko: '달러 약세. 이머징·원자재 수혜, 한국 수출주 환차손.',
    desc_en: 'Dollar weakens. EM/commodities benefit, KR exporters lose FX.',
    impact: { IT:+0.06, BIO:+0.03, AUTO:-0.04, FIN:-0.02, ENERGY:+0.05,
              CONSUMER:+0.04, REALESTATE:+0.02, INDUSTRIAL:+0.03, GLOBAL_ETF:+0.04, ETC:+0.02 }
  },
  riskOff: {
    label_ko: '위험 회피', label_en: 'Risk-Off',
    desc_ko: 'VIX 35+, 금/채권 선호. 모든 주식 동반 하락, 베타 큰 종목 더 큰 하락.',
    desc_en: 'VIX 35+, flight to safety. All stocks down, high-beta hurt more.',
    impact: { IT:-0.15, BIO:-0.10, AUTO:-0.18, FIN:-0.12, ENERGY:-0.10,
              CONSUMER:-0.06, REALESTATE:-0.08, INDUSTRIAL:-0.12, GLOBAL_ETF:-0.12, ETC:-0.08 }
  },
  riskOn: {
    label_ko: '위험 선호', label_en: 'Risk-On',
    desc_ko: '경기 회복 기대. 성장주·고베타 강세.',
    desc_en: 'Recovery optimism. Growth/high-beta rally.',
    impact: { IT:+0.15, BIO:+0.10, AUTO:+0.18, FIN:+0.10, ENERGY:+0.08,
              CONSUMER:+0.06, REALESTATE:+0.06, INDUSTRIAL:+0.12, GLOBAL_ETF:+0.10, ETC:+0.06 }
  }
};

// 매크로 인자를 "축(axis)" 단위로 그룹화 — 같은 축 안에선 mutually exclusive
export const MACRO_AXES = [
  { id:'rate', label_ko:'금리 정책', label_en:'Monetary Policy',
    options:['rateHike','rateCut'] },
  { id:'infl', label_ko:'물가',     label_en:'Inflation',
    options:['inflation'] },
  { id:'oil',  label_ko:'유가',     label_en:'Oil',
    options:['oilSurge','oilCrash'] },
  { id:'usd',  label_ko:'환율 (USD)', label_en:'USD',
    options:['usdStrong','usdWeak'] },
  { id:'mood', label_ko:'시장 분위기', label_en:'Sentiment',
    options:['riskOff','riskOn'] },
  { id:'cycle', label_ko:'경기 사이클', label_en:'Business Cycle',
    options:['recession'] }
];

// 사용자가 선택한 매크로 인자들 — 한 축당 최대 1개
export const SELECTED_MACROS = new Set();
export function toggleMacro(key){
  // 같은 축 안에서는 한 번에 하나만
  const axis = MACRO_AXES.find(a => a.options.includes(key));
  if (axis){
    axis.options.forEach(other => {
      if (other !== key) SELECTED_MACROS.delete(other);
    });
  }
  if (SELECTED_MACROS.has(key)) SELECTED_MACROS.delete(key);
  else SELECTED_MACROS.add(key);
}
// 동적으로 합산된 커스텀 시나리오
let CUSTOM_SCENARIO = null;
export function rebuildCustomScenario(){
  if (SELECTED_MACROS.size === 0){ CUSTOM_SCENARIO = null; return; }
  const sectors = ['IT','BIO','AUTO','FIN','ENERGY','CONSUMER','REALESTATE','INDUSTRIAL','GLOBAL_ETF','ETC'];
  const shocks = {};
  sectors.forEach(s => shocks[s] = 0);
  const labels_ko = [], labels_en = [];
  SELECTED_MACROS.forEach(key => {
    const f = MACRO_FACTORS[key];
    if (!f) return;
    sectors.forEach(s => shocks[s] += (f.impact[s] || 0));
    labels_ko.push(f.label_ko);
    labels_en.push(f.label_en);
  });
  // 합산 클립 — ±90% 범위
  sectors.forEach(s => shocks[s] = Math.max(-0.90, Math.min(0.90, shocks[s])));
  CUSTOM_SCENARIO = {
    label_ko: '커스텀 시나리오',
    label_en: 'Custom Scenario',
    period: labels_ko.join(' + '),
    benchmark: SELECTED_MACROS.size + (CURRENT_LANG==='en' ? ' factors' : '개 인자 조합'),
    desc_ko: labels_ko.join(' + '),
    desc_en: labels_en.join(' + '),
    source: CURRENT_LANG==='en' ? 'Macro factor matrix (heuristic)' : '매크로 영향 행렬 (휴리스틱)',
    shocks
  };
}

// 종목 베타로 섹터 충격을 차등 — 고베타는 더 크게, 저베타는 덜
// stock_shock = sector_shock × clamp(beta, 0.5, 1.6) [downside만]
// 단, sector_shock이 양수(이익)면 베타가 클수록 더 큰 이익 반영
function adjustShockByBeta(sectorShock, beta){
  if (sectorShock >= 0){
    // 상승장 — 고베타는 더 큰 상승, 저베타는 덜
    const m = Math.max(0.6, Math.min(1.5, beta));
    return sectorShock * m;
  } else {
    // 하락장 — 고베타는 더 큰 하락, 저베타·방어주는 덜
    // 하지만 너무 극단적이지 않도록 [0.55, 1.55] 범위 클립
    const m = Math.max(0.55, Math.min(1.55, beta));
    return sectorShock * m;
  }
}

// 시나리오 적용 — 종목별 손익과 포트폴리오 합계 반환
export function computeStressTest(items, scenarioKey){
  let scn;
  if (scenarioKey === 'custom'){
    scn = CUSTOM_SCENARIO;
  } else {
    scn = STRESS_SCENARIOS[scenarioKey];
  }
  if (!scn || !items.length) return null;
  let portLoss = 0;
  const breakdown = items.map(it => {
    const baseSec = scn.shocks[it.sector] ?? scn.shocks.ETC ?? -0.30;
    const shock = adjustShockByBeta(baseSec, it.beta);
    const value = it.market_value || 0;
    const loss  = value * shock;
    portLoss += loss;
    return { ticker: it.ticker, name: it.name, sector: it.sector,
             value, shock, loss, sectorShock: baseSec, beta: it.beta };
  });
  const totalValue = items.reduce((s,i)=> s + (i.market_value||0), 0);
  return {
    key: scenarioKey, scenario: scn,
    totalValue, portLoss,
    portLossPct: totalValue > 0 ? portLoss / totalValue : 0,
    breakdown
  };
}
