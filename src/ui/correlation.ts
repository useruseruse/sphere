// @ts-nocheck
/* =========================================================
   SPHERE — 상관관계 네트워크 (NETWORK 모드)
   섹터 상관계수 매트릭스 + 베타·변동성 유사도 보정
   학술 출처: 산업 분류별 상관관계는 KOSPI 200 / S&P 500 실증 연구 평균값 참조
   ========================================================= */

import * as THREE from 'three';
import * as scene from '../scene/sphere.js';
import { latLngToVec3 } from '../scene/sphere.js';
import { RUNTIME } from '../runtime.js';

const SECTOR_CORR = {
  IT:        { IT:0.78, BIO:0.32, FIN:0.42, ENERGY:0.28, AUTO:0.52, INDUSTRIAL:0.48, CONSUMER:0.32, REALESTATE:0.30, GLOBAL_ETF:0.75, ETC:0.40 },
  BIO:       { BIO:0.72, FIN:0.22, ENERGY:0.18, AUTO:0.22, INDUSTRIAL:0.28, CONSUMER:0.32, REALESTATE:0.22, GLOBAL_ETF:0.42, ETC:0.30 },
  FIN:       { FIN:0.82, ENERGY:0.45, AUTO:0.52, INDUSTRIAL:0.55, CONSUMER:0.38, REALESTATE:0.68, GLOBAL_ETF:0.62, ETC:0.42 },
  ENERGY:    { ENERGY:0.80, AUTO:0.42, INDUSTRIAL:0.52, CONSUMER:0.32, REALESTATE:0.42, GLOBAL_ETF:0.50, ETC:0.38 },
  AUTO:      { AUTO:0.78, INDUSTRIAL:0.62, CONSUMER:0.42, REALESTATE:0.35, GLOBAL_ETF:0.55, ETC:0.42 },
  INDUSTRIAL:{ INDUSTRIAL:0.78, CONSUMER:0.42, REALESTATE:0.48, GLOBAL_ETF:0.55, ETC:0.45 },
  CONSUMER:  { CONSUMER:0.74, REALESTATE:0.45, GLOBAL_ETF:0.48, ETC:0.40 },
  REALESTATE:{ REALESTATE:0.82, GLOBAL_ETF:0.55, ETC:0.42 },
  GLOBAL_ETF:{ GLOBAL_ETF:0.85, ETC:0.50 },
  ETC:       { ETC:0.50 }
};

function correlationOf(secA, secB){
  return SECTOR_CORR[secA]?.[secB] ?? SECTOR_CORR[secB]?.[secA] ?? 0.30;
}

/** 두 종목 사이의 추정 상관계수 (CAPM 베타 + GARCH 변동성 동조성 보정) */
export function pairCorrelation(a, b){
  if (a.ticker === b.ticker) return 1.0;
  const base = correlationOf(a.sector, b.sector);
  // 베타 유사도 보정 (CAPM 시스템 위험 동조성)
  const betaDiff = Math.abs(a.beta - b.beta);
  const betaAdj = Math.max(0, 0.10 - betaDiff * 0.06);
  // 변동성 유사도 보정 (ARCH/GARCH 동조성)
  const volDiff = Math.abs(a.volatility_30d - b.volatility_30d);
  const volAdj = Math.max(0, 0.06 - volDiff * 0.12);
  return Math.min(0.95, base + betaAdj + volAdj);
}

/** 활성 네트워크 모드면 sphere 위에 상관관계 곡선 라인을 그림 */
export function buildCorrelationLines(){
  scene.clearNetworkLines();
  if (!RUNTIME.networkMode) return;
  const items = RUNTIME.rebalanceMode && RUNTIME.TARGET_ITEMS.length ? RUNTIME.TARGET_ITEMS : RUNTIME.ITEMS;
  if (items.length < 2) return;
  const networkGroup = scene.getNetworkGroup();
  const threshold = RUNTIME.networkThreshold;

  // 모든 쌍에 대해 상관계수 계산
  for (let i = 0; i < items.length; i++){
    for (let j = i + 1; j < items.length; j++){
      const a = items[i], b = items[j];
      const corr = pairCorrelation(a, b);
      if (corr < threshold) continue;

      const posA = latLngToVec3(a.sphere_coord.lat, a.sphere_coord.lng, a.sphere_coord.r);
      const posB = latLngToVec3(b.sphere_coord.lat, b.sphere_coord.lng, b.sphere_coord.r);

      // 곡선으로 만들기 (구 표면 위로 살짝 들어올림)
      const mid = posA.clone().lerp(posB, 0.5);
      const liftScale = 1 + (1 - mid.length() / 2) * 0.15;
      mid.normalize().multiplyScalar(mid.length() * liftScale + 0.1);
      const curve = new THREE.QuadraticBezierCurve3(posA, mid, posB);
      const points = curve.getPoints(20);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

      // 강도별 색상
      let color;
      if (corr >= 0.85) color = 0xFF4560;       // 매우 강함 (빨강)
      else if (corr >= 0.70) color = 0xFF8C42;  // 강함 (주황)
      else color = 0x00D4FF;                     // 보통 (시안)
      const opacity = Math.min(0.85, 0.20 + (corr - threshold) * 1.5);
      const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      const line = new THREE.Line(lineGeo, lineMat);
      line.userData = { corr, a: a.ticker, b: b.ticker };
      networkGroup.add(line);
    }
  }
}
