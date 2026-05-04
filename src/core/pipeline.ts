/* =========================================================
   SPHERE — 5-Layer Pipeline
     L1 standardize         (raw → 정규화 + 결측값 채움)
     L2 computeRiskScores   (변동성·베타·부채·유동성·섹터 가중합 0~100)
     L3 mapSphereCoords     ((lat, lng, r) 구체 좌표)
     L4 computeBalance      (HHI, 편차, 구형도, 밸런스 지수)
     L5 generateInsights    (W1~W7 약점 진단)
   + SECTOR_DEF, riskColor/Label, balanceGrade 보조
   ========================================================= */

import { t } from '../i18n.js';
import type { Item, BalanceMetrics, Insight, Sector } from '../types.js';

interface SectorMeta {
  base_risk: number;
  lat_min: number;
  lat_max: number;
  vol_avg: number;
  beta_avg: number;
  color: string;
}

// ---------- Layer 1: 섹터 정의 ----------
export const SECTOR_DEF: Record<Sector, SectorMeta> = {
  IT:        { base_risk:0.75, lat_min:60,  lat_max:80,  vol_avg:0.30, beta_avg:1.20, color:'#00D4FF' },
  BIO:       { base_risk:0.85, lat_min:40,  lat_max:60,  vol_avg:0.42, beta_avg:1.15, color:'#7B61FF' },
  AUTO:      { base_risk:0.60, lat_min:20,  lat_max:40,  vol_avg:0.28, beta_avg:1.10, color:'#FF8C42' },
  GLOBAL_ETF:{ base_risk:0.40, lat_min:10,  lat_max:20,  vol_avg:0.16, beta_avg:1.00, color:'#9B6EFF' },
  INDUSTRIAL:{ base_risk:0.55, lat_min:-10, lat_max:10,  vol_avg:0.32, beta_avg:1.25, color:'#F4D35E' },
  ETC:       { base_risk:0.55, lat_min:0,   lat_max:0,   vol_avg:0.30, beta_avg:1.00, color:'#9aa4bc' },
  FIN:       { base_risk:0.50, lat_min:-40, lat_max:-20, vol_avg:0.20, beta_avg:0.90, color:'#00E5A0' },
  ENERGY:    { base_risk:0.65, lat_min:-55, lat_max:-40, vol_avg:0.25, beta_avg:0.75, color:'#FF4560' },
  CONSUMER:  { base_risk:0.35, lat_min:-70, lat_max:-55, vol_avg:0.18, beta_avg:0.70, color:'#A8E5C2' },
  REALESTATE:{ base_risk:0.45, lat_min:-80, lat_max:-70, vol_avg:0.22, beta_avg:0.85, color:'#FFA8B6' }
};

// ---------- Layer 1: 표준화 + 결측값 처리 ----------
export function standardize(raw: any[]): Item[] {
  // weight 합계 1.0으로 정규화
  const sumW = raw.reduce((s,r)=>s+(r.weight||0),0);
  const items = raw.map(r=>{
    const sec = SECTOR_DEF[r.sector] ? r.sector : 'ETC';
    const def = SECTOR_DEF[sec];
    return {
      ticker: r.ticker,
      name: r.name,
      name_en: r.name_en,
      sector: sec,
      weight: (r.weight||0)/sumW,
      quantity: r.quantity,           // ← 통과
      market_value: r.market_value,   // ← 통과
      current_price: r.current_price ?? 0,
      avg_price: r.avg_price ?? r.current_price ?? 0,
      return_pct: r.avg_price ? (r.current_price - r.avg_price) / r.avg_price : 0,
      market_cap: r.market_cap ?? 0,
      volatility_30d: r.volatility_30d ?? def.vol_avg,
      beta: r.beta ?? def.beta_avg,
      debt_ratio: Math.min(1, r.debt_ratio ?? 0.5),
      liquidity_volume: r.liquidity_volume ?? null,
      is_etf: !!r.is_etf,
      dividend_yield: r.dividend_yield ?? 0,
      risk_score: null,
      sphere_coord: null
    };
  });
  return items;
}

// ---------- Layer 2: 리스크 스코어 산출 ----------
export function computeRiskScores(items: Item[]): Item[] {
  const vols = items.map(i=>i.liquidity_volume).filter(v=>v!=null).sort((a,b)=>a-b);
  const liqMedian = vols.length ? vols[Math.floor(vols.length/2)] : 1;

  items.forEach(i=>{
    // 변동성 정규화 0.05~0.80 -> 0~1
    const volN = Math.max(0, Math.min(1, (i.volatility_30d - 0.05)/(0.80 - 0.05)));
    // 베타 정규화 0~2.5 -> 0~1
    const betaN = Math.max(0, Math.min(1, i.beta / 2.5));
    // 부채비율 그대로
    const debtN = Math.max(0, Math.min(1, i.debt_ratio));
    // 유동성 역수
    let liqN = 0;
    if (i.liquidity_volume!=null && liqMedian>0){
      const inv = 1 / (i.liquidity_volume / liqMedian);
      liqN = Math.max(0, Math.min(1, inv));
    }
    // 섹터 기본 리스크
    const secR = SECTOR_DEF[i.sector].base_risk;

    // 가중치
    const W = { vol:0.35, beta:0.25, debt:0.20, liq:0.10, sec:0.10 };
    let score;
    if (i.liquidity_volume==null){
      // 유동성 없을 시 가중치 재분배
      const total = W.vol + W.beta + W.debt + W.sec;
      score = (volN*W.vol + betaN*W.beta + debtN*W.debt + secR*W.sec) / total;
    } else {
      score = volN*W.vol + betaN*W.beta + debtN*W.debt + liqN*W.liq + secR*W.sec;
    }
    i.risk_score = Math.round(Math.max(0, Math.min(1, score)) * 100);
  });
  return items;
}

export function riskColor(score: number): string {
  if (score < 30) return '#00E5A0';
  if (score < 55) return '#00D4FF';
  if (score < 75) return '#FF8C42';
  if (score < 90) return '#FF4560';
  return '#7B61FF';
}
export function riskLabel(score: number): string {
  if (score < 30) return t('riskSafe');
  if (score < 55) return t('riskModerate');
  if (score < 75) return t('riskCaution');
  if (score < 90) return t('riskHigh');
  return t('riskExtreme');
}

// ---------- Layer 3: 3D 구체 좌표 ----------
export function mapSphereCoords(items: Item[]): Item[] {
  // 섹터별로 그룹화, 비중 큰 순서로 경도 분산
  const bySector = {};
  items.forEach(i=>{
    if (!bySector[i.sector]) bySector[i.sector] = [];
    bySector[i.sector].push(i);
  });
  // 섹터마다 위도 범위 내 균등 분포, 경도는 비중 순
  let lngOffset = 0;
  Object.keys(bySector).forEach((sec,si)=>{
    const arr = bySector[sec].sort((a,b)=>b.weight-a.weight);
    const def = SECTOR_DEF[sec];
    const latMin = def.lat_min, latMax = def.lat_max;
    arr.forEach((it,k)=>{
      const t = arr.length===1 ? 0.5 : k/(arr.length-1);
      const lat = latMin + t*(latMax - latMin);
      // 경도: 섹터당 영역 분리 + 비중 비례
      const lng = (lngOffset + k * (360/Math.max(arr.length,1)) * 0.4) % 360;
      const r = 1.0 + (it.risk_score/100)*0.5;
      it.sphere_coord = { lat, lng, r };
    });
    lngOffset += 360 / Object.keys(bySector).length;
  });
  return items;
}

// latLngToVec3 → src/scene/sphere.ts (THREE 의존)

// ---------- Layer 4: 밸런스 지수 ----------
export function computeBalance(items: Item[]): BalanceMetrics {
  // 섹터 HHI
  const secW: Partial<Record<Sector, number>> = {};
  items.forEach(i=> secW[i.sector] = (secW[i.sector] || 0) + i.weight);
  const hhi = Object.values(secW).reduce((s,w)=>s+w*w,0);
  const nSec = Object.keys(secW).length;
  const minHHI = 1/Math.max(nSec,1);
  const diverseScore = nSec>1 ? Math.max(0, Math.min(100, ((1 - hhi)/(1 - minHHI))*100)) : 0;

  // 리스크 편차
  const scores = items.map(i=>i.risk_score);
  const mean = scores.reduce((s,v)=>s+v,0)/scores.length;
  const variance = scores.reduce((s,v)=>s+(v-mean)**2,0)/scores.length;
  const std = Math.sqrt(variance);
  const devScore = Math.max(0, Math.min(100, (1 - std/50)*100));

  // 구형도
  const rs = items.map(i=>i.sphere_coord.r);
  const rMean = rs.reduce((s,v)=>s+v,0)/rs.length;
  const rStd = Math.sqrt(rs.reduce((s,v)=>s+(v-rMean)**2,0)/rs.length);
  const sphericityRaw = Math.max(0, Math.min(1, 1 - rStd/0.5));
  const sphericity = sphericityRaw * 100;

  const balance = diverseScore*0.4 + devScore*0.35 + sphericity*0.25;

  return {
    balance: Math.round(balance),
    balance_raw: balance,           // 미세 변화 표시용 float
    diverse: Math.round(diverseScore),
    diverse_raw: diverseScore,
    deviation: Math.round(devScore),
    deviation_raw: devScore,
    sphericity: Math.round(sphericity),
    sphericity_raw: sphericity,
    hhi: hhi.toFixed(3),
    hhi_raw: hhi,
    avgRisk: Math.round(mean),
    avgRisk_raw: mean,
    sectorWeights: secW
  };
}

export function balanceGrade(score: number): { txt: string; color: string } {
  if (score >= 90) return { txt:t('balanceGradeOptimal'), color:'var(--safe)' };
  if (score >= 70) return { txt:t('balanceGradeGood'),    color:'var(--moderate)' };
  if (score >= 50) return { txt:t('balanceGradeWarn'),    color:'var(--caution)' };
  if (score >= 30) return { txt:t('balanceGradeRisk'),    color:'var(--high)' };
  return { txt:t('balanceGradeSevere'), color:'var(--extreme)' };
}

export function generateInsights(items: Item[], balance: BalanceMetrics): Insight[] {
  const insights = [];
  if (items.length === 0) return insights;

  const top = [...items].sort((a,b)=>b.weight-a.weight)[0];
  if (top.weight > 0.40){
    insights.push({ level:'alert', title:t('insightConcentrationTitle'),
      body:t('insightConcentrationBody', top.name, (top.weight*100).toFixed(1), balance.balance, Math.min(100, balance.balance+15))
    });
  }
  if (balance.balance < 40){
    insights.push({ level:'alert', title:t('insightRebalanceTitle'),
      body:t('insightRebalanceBody', balance.sphericity, balance.diverse) });
  }
  if (balance.avgRisk > 70){
    const hi = [...items].sort((a,b)=>b.risk_score-a.risk_score)[0];
    insights.push({ level:'warn', title:t('insightHighRiskTitle'),
      body:t('insightHighRiskBody', balance.avgRisk, hi.name, hi.risk_score) });
  }
  if (parseFloat(balance.hhi) > 0.45){
    const topSec = Object.entries(balance.sectorWeights).sort((a,b)=>b[1]-a[1])[0];
    insights.push({ level:'warn', title:t('insightSectorTitle'),
      body:t('insightSectorBody', topSec[0], (topSec[1]*100).toFixed(1), balance.hhi) });
  }
  const xtreme = items.filter(i=>i.risk_score>85);
  xtreme.forEach(i=>{
    insights.push({ level:'warn', title:t('insightExtremeRiskTitle', i.name),
      body:t('insightExtremeRiskBody', i.risk_score, (i.volatility_30d*100).toFixed(0), i.beta.toFixed(2)) });
  });
  if (insights.length === 0){
    insights.push({ level:'ok', title:t('insightBalancedTitle'), body:t('insightBalancedBody', balance.balance) });
  }
  return insights;
}
