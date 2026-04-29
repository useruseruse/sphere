/* =========================================================
   SPHERE — Analysis Pipeline (Skills.md Layer 1~5)
   Pure functions. No global state, no DOM.
   ========================================================= */

import { SECTOR_DEF } from './data.js';

// ---------- Layer 1: 표준화 ----------
export function standardize(raw){
  const sumW = raw.reduce((s,r)=>s+(r.weight||0),0);
  return raw.map(r=>{
    const sec = SECTOR_DEF[r.sector] ? r.sector : 'ETC';
    const def = SECTOR_DEF[sec];
    return {
      ticker: r.ticker,
      name: r.name,
      sector: sec,
      weight: (r.weight||0)/sumW,
      quantity: r.quantity,
      market_value: r.market_value,
      current_price: r.current_price ?? 0,
      avg_price: r.avg_price ?? r.current_price ?? 0,
      return_pct: r.avg_price ? (r.current_price - r.avg_price) / r.avg_price : 0,
      market_cap: r.market_cap ?? 0,
      volatility_30d: r.volatility_30d ?? def.vol_avg,
      beta: r.beta ?? def.beta_avg,
      debt_ratio: Math.min(1, r.debt_ratio ?? 0.5),
      liquidity_volume: r.liquidity_volume ?? null,
      risk_score: null,
      sphere_coord: null
    };
  });
}

// ---------- Layer 2: 리스크 스코어 (가중합 0~100) ----------
export function computeRiskScores(items){
  const vols = items.map(i=>i.liquidity_volume).filter(v=>v!=null).sort((a,b)=>a-b);
  const liqMedian = vols.length ? vols[Math.floor(vols.length/2)] : 1;

  items.forEach(i=>{
    const volN = Math.max(0, Math.min(1, (i.volatility_30d - 0.05)/(0.80 - 0.05)));
    const betaN = Math.max(0, Math.min(1, i.beta / 2.5));
    const debtN = Math.max(0, Math.min(1, i.debt_ratio));
    let liqN = 0;
    if (i.liquidity_volume!=null && liqMedian>0){
      const inv = 1 / (i.liquidity_volume / liqMedian);
      liqN = Math.max(0, Math.min(1, inv));
    }
    const secR = SECTOR_DEF[i.sector].base_risk;
    const W = { vol:0.35, beta:0.25, debt:0.20, liq:0.10, sec:0.10 };
    let score;
    if (i.liquidity_volume==null){
      const total = W.vol + W.beta + W.debt + W.sec;
      score = (volN*W.vol + betaN*W.beta + debtN*W.debt + secR*W.sec) / total;
    } else {
      score = volN*W.vol + betaN*W.beta + debtN*W.debt + liqN*W.liq + secR*W.sec;
    }
    i.risk_score = Math.round(Math.max(0, Math.min(1, score)) * 100);
  });
  return items;
}

export function riskColor(score){
  if (score < 30) return '#00E5A0';
  if (score < 55) return '#00D4FF';
  if (score < 75) return '#FF8C42';
  if (score < 90) return '#FF4560';
  return '#7B61FF';
}
export function riskLabel(score){
  if (score < 30) return 'SAFE';
  if (score < 55) return 'MODERATE';
  if (score < 75) return 'CAUTION';
  if (score < 90) return 'HIGH';
  return 'EXTREME';
}

// ---------- Layer 3: 3D 구체 좌표 ----------
export function mapSphereCoords(items){
  const bySector = {};
  items.forEach(i=>{
    if (!bySector[i.sector]) bySector[i.sector] = [];
    bySector[i.sector].push(i);
  });
  let lngOffset = 0;
  Object.keys(bySector).forEach((sec)=>{
    const arr = bySector[sec].sort((a,b)=>b.weight-a.weight);
    const def = SECTOR_DEF[sec];
    const latMin = def.lat_min, latMax = def.lat_max;
    arr.forEach((it,k)=>{
      const t = arr.length===1 ? 0.5 : k/(arr.length-1);
      const lat = latMin + t*(latMax - latMin);
      const lng = (lngOffset + k * (360/Math.max(arr.length,1)) * 0.4) % 360;
      const r = 1.0 + (it.risk_score/100)*0.5;
      it.sphere_coord = { lat, lng, r };
    });
    lngOffset += 360 / Object.keys(bySector).length;
  });
  return items;
}

// 위경도 → Three.js Vector3 (THREE는 전역에서 로드된 후 호출됨)
export function latLngToVec3(lat, lng, r){
  const phi = (90-lat) * Math.PI/180;
  const theta = lng * Math.PI/180;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// ---------- Layer 4: 밸런스 지수 ----------
export function computeBalance(items){
  const secW = {};
  items.forEach(i=> secW[i.sector] = (secW[i.sector]||0) + i.weight);
  const hhi = Object.values(secW).reduce((s,w)=>s+w*w,0);
  const nSec = Object.keys(secW).length;
  const minHHI = 1/Math.max(nSec,1);
  const diverseScore = nSec>1 ? Math.max(0, Math.min(100, ((1 - hhi)/(1 - minHHI))*100)) : 0;

  const scores = items.map(i=>i.risk_score);
  const mean = scores.reduce((s,v)=>s+v,0)/scores.length;
  const variance = scores.reduce((s,v)=>s+(v-mean)**2,0)/scores.length;
  const std = Math.sqrt(variance);
  const devScore = Math.max(0, Math.min(100, (1 - std/50)*100));

  const rs = items.map(i=>i.sphere_coord.r);
  const rMean = rs.reduce((s,v)=>s+v,0)/rs.length;
  const rStd = Math.sqrt(rs.reduce((s,v)=>s+(v-rMean)**2,0)/rs.length);
  const sphericityRaw = Math.max(0, Math.min(1, 1 - rStd/0.5));
  const sphericity = sphericityRaw * 100;

  const balance = diverseScore*0.4 + devScore*0.35 + sphericity*0.25;

  return {
    balance: Math.round(balance),
    diverse: Math.round(diverseScore),
    deviation: Math.round(devScore),
    sphericity: Math.round(sphericity),
    hhi: hhi.toFixed(3),
    avgRisk: Math.round(mean),
    sectorWeights: secW
  };
}

export function balanceGrade(score){
  if (score >= 90) return { txt:'✅ 최적 분산 — 리밸런싱 불필요', color:'var(--safe)' };
  if (score >= 70) return { txt:'🔵 양호 — 소폭 조정 고려',     color:'var(--moderate)' };
  if (score >= 50) return { txt:'🟡 편중 주의 — 리밸런싱 권장', color:'var(--caution)' };
  if (score >= 30) return { txt:'🔴 편중 위험 — 리밸런싱 필요', color:'var(--high)' };
  return { txt:'🟣 심각한 쏠림 — 즉각 리밸런싱', color:'var(--extreme)' };
}

// ---------- Layer 5: 인사이트 자동 생성 ----------
export function generateInsights(items, balance){
  const insights = [];
  if (items.length === 0) return insights;

  const top = [...items].sort((a,b)=>b.weight-a.weight)[0];
  if (top.weight > 0.40){
    insights.push({
      level:'alert', title:'⚠ 집중 투자 경고',
      body:`${top.name}의 비중이 ${(top.weight*100).toFixed(1)}%로 전체 포트폴리오 리스크를 좌우합니다. 비중을 30% 이하로 조정하면 밸런스가 ${balance.balance} → ${Math.min(100, balance.balance+15)}점으로 개선됩니다.`
    });
  }

  if (balance.balance < 40){
    insights.push({
      level:'alert', title:'⚠ 리밸런싱 필요',
      body:`현재 구형도 ${balance.sphericity}점, 섹터 분산 ${balance.diverse}점. 저비중 섹터(소비재·금융 등) 편입을 통해 균형 회복이 필요합니다.`
    });
  }

  if (balance.avgRisk > 70){
    const hi = [...items].sort((a,b)=>b.risk_score-a.risk_score)[0];
    insights.push({
      level:'warn', title:'⚠ 고위험 포트폴리오',
      body:`평균 리스크 스코어 ${balance.avgRisk}점. 특히 ${hi.name} (score ${hi.risk_score})의 변동성이 섹터 평균 대비 높습니다.`
    });
  }

  if (parseFloat(balance.hhi) > 0.45){
    const topSec = Object.entries(balance.sectorWeights).sort((a,b)=>b[1]-a[1])[0];
    insights.push({
      level:'warn', title:'⚠ 섹터 편중 경고',
      body:`${topSec[0]} 섹터가 ${(topSec[1]*100).toFixed(1)}%를 차지합니다. HHI ${balance.hhi}로 분산도가 낮습니다.`
    });
  }

  const xtreme = items.filter(i=>i.risk_score>85);
  xtreme.forEach(i=>{
    insights.push({
      level:'warn', title:`⚠ ${i.name} 리스크 매우 높음`,
      body:`리스크 스코어 ${i.risk_score}점. 변동성 ${(i.volatility_30d*100).toFixed(0)}%, 베타 ${i.beta.toFixed(2)}로 시장 평균 대비 민감도가 큽니다.`
    });
  });

  if (insights.length === 0){
    insights.push({
      level:'ok', title:'✓ 균형잡힌 포트폴리오',
      body:`밸런스 지수 ${balance.balance}점. 모든 핵심 지표가 양호한 범위에 있습니다. 지속적인 모니터링을 권장합니다.`
    });
  }
  return insights;
}
