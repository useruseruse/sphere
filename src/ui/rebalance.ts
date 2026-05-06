// @ts-nocheck
/* =========================================================
   SPHERE — 리밸런싱 시뮬레이터 + 추천 엔진
   - 약점 진단 (W1~W7) → 후보 선별 → 시뮬레이션 → 상위 5개 추천
   - 사용자: 추천 적용/건너뛰기/수동 편집 → TARGET_* 갱신 → 시뮬레이션 점수 비교
   ========================================================= */

import { CURRENT_LANG, t, getName, sectorLabel, formatKRWUnit } from '../i18n.js';
import {
  SECTOR_DEF, standardize, computeRiskScores, mapSphereCoords,
  computeBalance, balanceGrade, generateInsights, riskColor
} from '../core/pipeline.js';
import { ASSET_DB, ASSET_BY_TICKER } from '../data/assetDb.js';
import { activePortfolio, saveState, computeWeights } from '../state/portfolio.js';
import { showToast } from './toast-react/index.js';
import { customConfirm } from './modal.js';
import { renderHoldings } from './holdings.js';
import { renderInsights } from './insights.js';
import * as scene from '../scene/sphere.js';
import { latLngToVec3 } from '../scene/sphere.js';
import { RUNTIME } from '../runtime.js';
import { renderPortfolioSelect } from './portfolio-select.js';
import * as THREE from 'three';

let _recBuffer = [];               // 백로그 — 건너뛰면 여기서 다음 추천을 가져옴
let _initialRecCount = 0;          // 진단 시 처음 생성된 추천 총 개수
const APPLIED_RECS = new Set();   // 적용된 추천 인덱스
const VISIBLE_RECS_COUNT = 5;

let _onRebuildAll = () => {};

/** 부트스트랩에서 호출 — rebuildAll 콜백 등록 + 패널 버튼 핸들러 */
export function installRebalance(opts: { onRebuildAll: () => void }){
  _onRebuildAll = opts.onRebuildAll;
  document.getElementById('rbApply')?.addEventListener('click', applyTargetToActive);
  document.getElementById('rbReset')?.addEventListener('click', resetTarget);
  document.getElementById('rbCancel')?.addEventListener('click', () => exitRebalance(false));
  document.getElementById('rbClose')?.addEventListener('click', () => exitRebalance(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && RUNTIME.rebalanceMode) exitRebalance(false);
  });
}

/* =========================================================
   리밸런싱 추천 엔진
   진단 (W1~W5) → 후보 선별 → 시뮬레이션 → 상위 5개 추천
   ========================================================= */

// 약점 진단
function diagnoseWeaknesses(items, balance){
  const weaknesses = [];
  const sorted = [...items].sort((a,b)=>b.weight - a.weight);
  const sectors = balance.sectorWeights || {};

  // W1: 섹터 편중 (HHI > 0.25 또는 단일 섹터 > 35%)
  const topSec = Object.entries(sectors).sort((a,b)=>b[1]-a[1])[0];
  if ((parseFloat(balance.hhi) > 0.25) || (topSec && topSec[1] > 0.35)){
    weaknesses.push({ code:'W1', priority:1,
      detail:{ dominantSector: topSec[0], dominantWeight: topSec[1], hhi: parseFloat(balance.hhi) }
    });
  }
  // W2: 단일 종목 집중 (>35%)
  if (sorted[0] && sorted[0].weight > 0.35){
    weaknesses.push({ code:'W2', priority:2,
      detail:{ ticker:sorted[0].ticker, name:sorted[0].name, name_en:sorted[0].name_en,
               weight:sorted[0].weight, quantity:sorted[0].quantity }
    });
  }
  // W3: 고위험 (avgRisk > 65)
  if (balance.avgRisk > 65){
    weaknesses.push({ code:'W3', priority:3, detail:{ avgRisk: balance.avgRisk } });
  }
  // W4: 분산 부족 (섹터 < 4개 또는 ETF 미보유)
  const sectorCount = Object.keys(sectors).length;
  const hasETF = items.some(it => it.sector === 'GLOBAL_ETF');
  if (sectorCount < 4 || !hasETF){
    weaknesses.push({ code:'W4', priority:4, detail:{ sectorCount, hasETF } });
  }
  // W5: 리스크 편차 (deviation < 50)
  if (balance.deviation < 50){
    weaknesses.push({ code:'W5', priority:5, detail:{ deviation: balance.deviation } });
  }
  // W6: 지역 편중 (모든 종목이 KR 또는 모두 US)
  const krCount = items.filter(i => i.ticker.endsWith('.KS')).length;
  const usCount = items.length - krCount;
  if (items.length >= 3 && (krCount === 0 || usCount === 0)){
    weaknesses.push({ code:'W6', priority:3, detail:{ allKR: usCount === 0, allUS: krCount === 0 } });
  }
  // W7: 헷지 자산 부재 (변동성 평균 > 0.25, 채권/금 미보유)
  const hasHedge = items.some(it => /BND|TLT|IEF|LQD|GLD|SLV/i.test(it.ticker));
  const avgVol = items.reduce((s,i)=>s+i.volatility_30d, 0) / items.length;
  if (avgVol > 0.25 && !hasHedge && items.length >= 3){
    weaknesses.push({ code:'W7', priority:4, detail:{ avgVol } });
  }
  return weaknesses;
}

// 임시 holdings로 RUNTIME.BALANCE 계산
function computeBalanceFor(holdings){
  const raws = targetPortfolioToRaw(holdings);
  if (raws.length === 0) return null;
  const items = mapSphereCoords(computeRiskScores(standardize(raws)));
  return computeBalance(items);
}

// 단일 추천 적용 시뮬레이션 (현재 RUNTIME.TARGET_HOLDINGS에 액션 적용 후 결과 비교)
function simulateAction(action, baseHoldings){
  const cloned = baseHoldings.map(h => ({ ...h }));
  if (action.type === 'add'){
    cloned.push({ ticker:action.asset.ticker, quantity:action.quantity, avg_price:action.asset.current_price });
  } else if (action.type === 'reduce'){
    const t = cloned.find(h => h.ticker === action.ticker);
    if (t) t.quantity = action.newQty;
  }
  const newBal = computeBalanceFor(cloned);
  if (!newBal) return null;
  return {
    holdings: cloned,
    balance: newBal,
    deltaBalance: newBal.balance_raw - (RUNTIME.BALANCE.balance_raw || 0),
    deltaHHI: parseFloat(newBal.hhi) - parseFloat(RUNTIME.BALANCE.hhi || 0),
    deltaDiverse: newBal.diverse_raw - (RUNTIME.BALANCE.diverse_raw || 0),
    deltaRisk: newBal.avgRisk_raw - (RUNTIME.BALANCE.avgRisk_raw || 0)
  };
}

// 약점별 후보 액션 생성
function buildActionsForWeakness(weakness, items, ownedSet, totalValue){
  const targetPct = 0.05; // 신규 종목은 자산의 5% 비중으로
  const actions = [];

  if (weakness.code === 'W1' || weakness.code === 'W4'){
    // 부족한 섹터에서 종목 후보 — 섹터당 최대 3개
    const sectorWeights = {};
    items.forEach(it => sectorWeights[it.sector] = (sectorWeights[it.sector]||0) + it.weight);
    const candidateSectors = Object.keys(SECTOR_DEF).filter(sec =>
      (sectorWeights[sec] || 0) < 0.10 && sec !== 'ETC'
    );
    candidateSectors.forEach(sec => {
      const inSec = ASSET_DB.filter(a => a.sector === sec && !ownedSet.has(a.ticker));
      const ranked = inSec
        .map(a => ({ a, s: Math.log(1 + (a.liquidity_volume || 1)) / Math.max(a.volatility_30d, 0.01) }))
        .sort((x,y)=>y.s-x.s);
      ranked.slice(0, 3).forEach(({ a }) => {
        const qty = Math.max(1, Math.round(totalValue * targetPct / a.current_price));
        actions.push({ type:'add', asset:a, quantity:qty, weakness:weakness.code, weakness_priority:weakness.priority });
      });
    });
  }

  if (weakness.code === 'W2'){
    // 종목 집중 → 비중 25%로 축소
    const d = weakness.detail;
    const item = items.find(it => it.ticker === d.ticker);
    if (item){
      const targetWeight = 0.25;
      const newQty = Math.max(1, Math.floor(item.quantity * (targetWeight / item.weight)));
      if (newQty < item.quantity){
        actions.push({
          type:'reduce', ticker:item.ticker, name:item.name, name_en:item.name_en,
          currentQty:item.quantity, newQty,
          weakness:weakness.code, weakness_priority:weakness.priority
        });
      }
    }
  }

  if (weakness.code === 'W3' || weakness.code === 'W5'){
    // 안전 자산 추천 — ETF + 방어주 + 채권 (다양한 옵션 5개)
    const safeETFs = ASSET_DB.filter(a =>
      !ownedSet.has(a.ticker) && a.is_etf &&
      a.beta < 0.7 &&
      ['GLOBAL_ETF','CONSUMER'].includes(a.sector)
    ).sort((a,b) => a.volatility_30d - b.volatility_30d).slice(0, 3);
    const defensives = ASSET_DB.filter(a =>
      !ownedSet.has(a.ticker) && !a.is_etf &&
      a.beta < 0.65 &&
      ['CONSUMER','BIO','REALESTATE','FIN'].includes(a.sector)
    ).sort((a,b) => a.volatility_30d - b.volatility_30d).slice(0, 2);
    [...safeETFs, ...defensives].forEach(asset => {
      const qty = Math.max(1, Math.round(totalValue * targetPct / asset.current_price));
      actions.push({ type:'add', asset, quantity:qty, weakness:weakness.code, weakness_priority:weakness.priority });
    });
  }

  if (weakness.code === 'W6'){
    // 지역 편중 — 반대 지역 광역 ETF 추천
    const targets = weakness.detail.allKR
      ? ['VOO','SPY','VTI','QQQ','VEA']     // KR만 → 미국·선진국
      : ['069500.KS','102110.KS','360750.KS']; // US만 → 한국·아시아
    const candidates = ASSET_DB.filter(a => targets.includes(a.ticker) && !ownedSet.has(a.ticker));
    candidates.slice(0,3).forEach(asset => {
      const qty = Math.max(1, Math.round(totalValue * targetPct / asset.current_price));
      actions.push({ type:'add', asset, quantity:qty, weakness:weakness.code, weakness_priority:weakness.priority });
    });
  }

  if (weakness.code === 'W7'){
    // 헷지 부재 — 채권/금/안전자산 추천
    const hedges = ['BND','TLT','GLD','IEF','LQD'];
    const candidates = ASSET_DB.filter(a => hedges.includes(a.ticker) && !ownedSet.has(a.ticker));
    candidates.slice(0,3).forEach(asset => {
      const qty = Math.max(1, Math.round(totalValue * targetPct / asset.current_price));
      actions.push({ type:'add', asset, quantity:qty, weakness:weakness.code, weakness_priority:weakness.priority });
    });
  }

  return actions;
}

// 추천 생성 (상위 5개)
export function generateRecommendations(items, balance){
  if (!items || items.length === 0) return [];
  const ownedSet = new Set(items.map(it => it.ticker));
  const totalValue = items.reduce((s,it)=>s+(it.market_value||0), 0);
  const baseHoldings = items.map(it => ({ ticker:it.ticker, quantity:it.quantity, avg_price:it.avg_price }));

  const weaknesses = diagnoseWeaknesses(items, balance);
  if (weaknesses.length === 0) return []; // 균형 잡혀있으면 추천 없음

  // 모든 약점에 대해 액션 후보 생성
  const allActions = [];
  weaknesses.forEach(w => {
    const acts = buildActionsForWeakness(w, items, ownedSet, totalValue);
    allActions.push(...acts);
  });

  // 각 액션에 대해 시뮬레이션
  const simulated = [];
  allActions.forEach(action => {
    const impact = simulateAction(action, baseHoldings);
    if (!impact) return;
    simulated.push({ ...action, impact });
  });

  // 약점 타입별로 그룹화 + 각 그룹 내 deltaBalance 큰 순 정렬
  const groups = {};
  simulated.forEach(r => {
    if (!groups[r.weakness]) groups[r.weakness] = [];
    groups[r.weakness].push(r);
  });
  Object.values(groups).forEach(arr =>
    arr.sort((a,b) => b.impact.deltaBalance - a.impact.deltaBalance)
  );
  // 약점 우선순위 순서로 그룹 정렬 + 그룹당 최대 4개로 제한 (특정 약점 도배 방지)
  const sortedGroups = Object.values(groups)
    .sort((a,b) => (a[0]?.weakness_priority || 99) - (b[0]?.weakness_priority || 99))
    .map(g => g.slice(0, 4));
  // 라운드로빈 인터리브 — 같은 약점 타입이 연속되지 않도록
  const interleaved = [];
  let added = true;
  while (added){
    added = false;
    for (const group of sortedGroups){
      if (group.length > 0){
        interleaved.push(group.shift());
        added = true;
      }
    }
  }

  // 중복 제거 (같은 종목은 한 번만)
  const seen = new Set();
  const filtered = interleaved.filter(rec => {
    const key = rec.type === 'add' ? rec.asset.ticker : rec.ticker;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return filtered.slice(0, 30);  // 최대 30개 후보 (5개 표시 + 25개 백로그)
}

function targetPortfolioToRaw(holdings){
  const { items, totalValue } = computeWeights(holdings);
  return items.map(h => {
    const a = ASSET_BY_TICKER[h.ticker];
    if (!a) return null;
    return {
      ticker:a.ticker, name:a.name, name_en:a.name_en, sector:a.sector,
      weight:h.weight, quantity:h.quantity, market_value:h.market_value,
      current_price:a.current_price, avg_price:h.avg_price ?? a.current_price,
      market_cap:a.market_cap, volatility_30d:a.volatility_30d,
      beta:a.beta, debt_ratio:a.debt_ratio, liquidity_volume:a.liquidity_volume
    };
  }).filter(Boolean);
}

export function recomputeTarget(){
  if (!RUNTIME.TARGET_HOLDINGS) return;
  const raw = targetPortfolioToRaw(RUNTIME.TARGET_HOLDINGS);
  if (raw.length === 0){
    RUNTIME.TARGET_ITEMS = [];
    RUNTIME.TARGET_BALANCE = { balance:0, diverse:0, deviation:0, sphericity:0, hhi:'0.000', avgRisk:0, sectorWeights:{} };
    RUNTIME.TARGET_INSIGHTS = [];
    return;
  }
  RUNTIME.TARGET_ITEMS = mapSphereCoords(computeRiskScores(standardize(raw)));
  RUNTIME.TARGET_BALANCE = computeBalance(RUNTIME.TARGET_ITEMS);
  RUNTIME.TARGET_INSIGHTS = generateInsights(RUNTIME.TARGET_ITEMS, RUNTIME.TARGET_BALANCE);
}

export function enterRebalance(){
  if (RUNTIME.rebalanceMode) return;
  // 빈 포트폴리오면 버튼이 이미 disabled — 별도 안내 불필요
  if (!RUNTIME.ITEMS || RUNTIME.ITEMS.length === 0) return;
  RUNTIME.rebalanceMode = true;
  RUNTIME.TARGET_HOLDINGS = JSON.parse(JSON.stringify(activePortfolio().holdings));
  recomputeTarget();
  // 추천 생성 — 최대 15개 후보 → 5개 표시 + 10개 백로그
  const allRecs = generateRecommendations(RUNTIME.ITEMS, RUNTIME.BALANCE);
  RUNTIME.RECOMMENDATIONS = allRecs.slice(0, VISIBLE_RECS_COUNT);
  _recBuffer = allRecs.slice(VISIBLE_RECS_COUNT);
  _initialRecCount = allRecs.length;
  APPLIED_RECS.clear();
  document.body.classList.add('rebalance-mode');
  document.getElementById('rebalancePanel').classList.add('show');
  document.getElementById('rbIndicator').classList.add('show');
  document.getElementById('btnRebalance').classList.add('rebalance-active');
  clearAlert();
  scene.clearNodeHighlight();
  document.getElementById('stockDetail').classList.remove('show');
  document.getElementById('noSelect').style.display = 'block';
  rebuildNodesForCurrentMode();
  renderHoldings();
  renderRebalancePanel();
}

export function exitRebalance(apply = false){
  if (!RUNTIME.rebalanceMode) return;
  if (apply && RUNTIME.TARGET_HOLDINGS){
    activePortfolio().holdings = RUNTIME.TARGET_HOLDINGS;
    activePortfolio().updatedAt = Date.now();
    saveState(true);  // 리밸런싱 적용 → 토스트 노출
  }
  RUNTIME.rebalanceMode = false;
  RUNTIME.TARGET_HOLDINGS = null;
  RUNTIME.TARGET_ITEMS = [];
  RUNTIME.TARGET_BALANCE = {};
  RUNTIME.TARGET_INSIGHTS = [];
  RUNTIME.RECOMMENDATIONS = [];
  APPLIED_RECS.clear();
  document.body.classList.remove('rebalance-mode');
  document.getElementById('rebalancePanel').classList.remove('show');
  document.getElementById('rbIndicator').classList.remove('show');
  document.getElementById('btnRebalance').classList.remove('rebalance-active');
  _onRebuildAll();
}

// 추천 액션을 RUNTIME.TARGET_HOLDINGS에 반영
function applyRecommendation(idx){
  const rec = RUNTIME.RECOMMENDATIONS[idx];
  if (!rec || APPLIED_RECS.has(idx)) return;
  if (rec.type === 'add'){
    // 이미 보유 중이면 수량 합산
    const existing = RUNTIME.TARGET_HOLDINGS.find(h => h.ticker === rec.asset.ticker);
    if (existing) existing.quantity += rec.quantity;
    else RUNTIME.TARGET_HOLDINGS.push({
      ticker: rec.asset.ticker, quantity: rec.quantity, avg_price: rec.asset.current_price
    });
  } else if (rec.type === 'reduce'){
    const t = RUNTIME.TARGET_HOLDINGS.find(h => h.ticker === rec.ticker);
    if (t) t.quantity = rec.newQty;
  }
  APPLIED_RECS.add(idx);
  recomputeTarget();
  rebuildNodesForCurrentMode();
  renderHoldings();
  renderRebalancePanel();
}

function skipRecommendation(idx){
  if (APPLIED_RECS.has(idx)) return; // 이미 적용된 건 skip 불가
  // 해당 추천 제거
  RUNTIME.RECOMMENDATIONS.splice(idx, 1);
  // APPLIED_RECS의 인덱스 재조정
  const newApplied = new Set();
  APPLIED_RECS.forEach(i => { if (i < idx) newApplied.add(i); else if (i > idx) newApplied.add(i-1); });
  APPLIED_RECS.clear();
  newApplied.forEach(i => APPLIED_RECS.add(i));
  // 백로그에서 다음 추천 가져와 채움
  if (_recBuffer.length > 0){
    RUNTIME.RECOMMENDATIONS.push(_recBuffer.shift());
  }
  renderRebalancePanel();
}

// 초기화 — 한 번 클릭으로 즉시 실행
function resetTarget(){
  if (!RUNTIME.rebalanceMode) return;
  RUNTIME.TARGET_HOLDINGS = JSON.parse(JSON.stringify(activePortfolio().holdings));
  APPLIED_RECS.clear();
  recomputeTarget();
  // 초기화 시 추천도 다시 생성 (건너뛴 것들 복원, 백로그도 재구성)
  const allRecs = generateRecommendations(RUNTIME.ITEMS, RUNTIME.BALANCE);
  RUNTIME.RECOMMENDATIONS = allRecs.slice(0, VISIBLE_RECS_COUNT);
  _recBuffer = allRecs.slice(VISIBLE_RECS_COUNT);
  _initialRecCount = allRecs.length;
  rebuildNodesForCurrentMode();
  renderHoldings();
  renderRebalancePanel();
}

export async function applyTargetToActive(){
  if (!RUNTIME.rebalanceMode || !RUNTIME.TARGET_HOLDINGS) return;
  if (!await customConfirm(t('rbApplyConfirm', RUNTIME.BALANCE.balance, RUNTIME.TARGET_BALANCE.balance))) return;
  exitRebalance(true);
}

// rebalance 모드일 때는 RUNTIME.TARGET_HOLDINGS 수량을 편집
export function updateTargetQuantity(ticker, newQty){
  if (!RUNTIME.TARGET_HOLDINGS) return;
  const target = RUNTIME.TARGET_HOLDINGS.find(h => h.ticker === ticker);
  if (!target) return;
  target.quantity = Math.max(1, Math.floor(newQty));
  recomputeTarget();
  rebuildNodesForCurrentMode();
  renderRebalancePanel();
  renderHoldings();
}

// 모드에 따라 RUNTIME.ITEMS 또는 RUNTIME.TARGET_ITEMS 로 노드 재구성
export function rebuildNodesForCurrentMode(){
  const items = RUNTIME.rebalanceMode ? RUNTIME.TARGET_ITEMS : RUNTIME.ITEMS;
  scene.rebuildNodes(items);
  // 네트워크 라인은 노드 위치가 바뀌었으므로 재구성
  buildCorrelationLines();
}

export function renderRebalancePanel(){
  if (!RUNTIME.rebalanceMode) return;
  const C = RUNTIME.BALANCE, T = RUNTIME.TARGET_BALANCE;
  // 큰 점수는 정수, 델타는 소수점 1자리
  document.getElementById('rbCurrentScore').textContent = (C.balance_raw ?? 0).toFixed(1);
  document.getElementById('rbTargetScore').textContent = (T.balance_raw ?? 0).toFixed(1);
  document.getElementById('rbCurrentGrade').textContent = balanceGrade(C.balance ?? 0).txt;
  document.getElementById('rbTargetGrade').textContent = balanceGrade(T.balance ?? 0).txt;

  // 타겟 점수 색상 (개선=녹색, 악화=빨강) — float 기반 비교로 미세 차이도 감지
  const targetEl = document.getElementById('rbTargetScore');
  const delta = (T.balance_raw ?? 0) - (C.balance_raw ?? 0);
  const grad = delta > 0.05 ? 'linear-gradient(90deg, var(--safe), var(--moderate))'
             : delta < -0.05 ? 'linear-gradient(90deg, var(--high), var(--extreme))'
             : 'linear-gradient(90deg, var(--text-1), var(--text-2))';
  targetEl.style.background = grad;
  targetEl.style.webkitBackgroundClip = 'text';
  targetEl.style.webkitTextFillColor = 'transparent';

  // 델타 표시 (소수점 1자리)
  const deltaEl = document.getElementById('rbDelta');
  const dStr = Math.abs(delta).toFixed(1);
  if (delta > 0.05) deltaEl.innerHTML = `<span class="rb-delta-up">▲ ${t('rbDeltaImproved', dStr)}</span>`;
  else if (delta < -0.05) deltaEl.innerHTML = `<span class="rb-delta-down">▼ ${t('rbDeltaWorsened', dStr)}</span>`;
  else deltaEl.innerHTML = `<span class="rb-delta-zero">${t('rbDeltaSame')}</span>`;

  // 메트릭 비교 테이블 — raw float 사용해서 미세 변화도 보이게
  const metrics = [
    [t('rbMetricBalance'),     C.balance_raw,    T.balance_raw,    true,  1, ''],
    [t('rbMetricDiverse'),     C.diverse_raw,    T.diverse_raw,    true,  1, ''],
    [t('rbMetricDeviation'),   C.deviation_raw,  T.deviation_raw,  true,  1, ''],
    [t('rbMetricSphericity'),  C.sphericity_raw, T.sphericity_raw, true,  1, ''],
    [t('rbMetricHHI'),         C.hhi_raw,        T.hhi_raw,        false, 3, ''],
    [t('rbMetricRisk'),        C.avgRisk_raw,    T.avgRisk_raw,    false, 1, '']
  ];
  document.getElementById('rbMetrics').innerHTML = metrics.map(([name, c, ta, betterUp, dec, suf])=>{
    const d = ta - c;
    const isBetter = betterUp ? d > 0 : d < 0;
    const isWorse  = betterUp ? d < 0 : d > 0;
    const cls = isBetter ? 'up' : (isWorse ? 'down' : '');
    const fmt = v => Number(v).toFixed(dec) + suf;
    return `
      <div class="rb-metric">
        <span class="rb-metric-name">${name}</span>
        <span class="rb-metric-from">${fmt(c)}</span>
        <span class="rb-metric-arrow">→</span>
        <span class="rb-metric-to ${cls}">${fmt(ta)}</span>
      </div>`;
  }).join('');

  // 추천 카드 렌더
  renderRecommendations();

  // 변경사항 없으면 [적용하기] 비활성화
  const applyBtn = document.getElementById('rbApply');
  if (applyBtn){
    const changed = hasTargetChanged();
    applyBtn.disabled = !changed;
    applyBtn.title = changed ? '' : (CURRENT_LANG==='en' ? 'No changes to apply' : '변경사항이 없습니다');
  }
}

// TARGET이 실제 STATE와 다른지 비교
function hasTargetChanged(){
  if (!RUNTIME.TARGET_HOLDINGS) return false;
  const current = activePortfolio().holdings;
  if (current.length !== RUNTIME.TARGET_HOLDINGS.length) return true;
  // ticker → quantity 매핑 비교
  const cMap = new Map(current.map(h => [h.ticker, h.quantity]));
  for (const t of RUNTIME.TARGET_HOLDINGS){
    if (cMap.get(t.ticker) !== t.quantity) return true;
  }
  return false;
}

export function renderRecommendations(){
  const el = document.getElementById('rbRecommendations');
  if (!el) return;
  if (!RUNTIME.RECOMMENDATIONS || RUNTIME.RECOMMENDATIONS.length === 0){
    // 처음부터 0개 = 진짜 균형 / 시작은 있었는데 다 건너뜀 = 다른 메시지
    const isAllSkipped = _initialRecCount > 0;
    const titleKey = isAllSkipped ? 'rbRecAllSkippedTitle' : 'rbRecEmptyTitle';
    const bodyKey  = isAllSkipped ? 'rbRecAllSkipped'      : 'rbRecEmpty';
    el.innerHTML = `
      <div class="rec-empty ${isAllSkipped ? 'skipped' : ''}">
        <strong>${t(titleKey)}</strong>
        ${t(bodyKey)}
      </div>
    `;
    return;
  }
  el.innerHTML = RUNTIME.RECOMMENDATIONS.map((rec, idx) => {
    const applied = APPLIED_RECS.has(idx);
    const head = rec.type === 'add' ? `
      <span class="rec-badge add">${t('rbRecAdd')}</span>
      <span class="rec-name">${getName(rec.asset)} <span style="color:var(--text-2);font-weight:300;">${rec.asset.ticker}</span></span>
    ` : `
      <span class="rec-badge reduce">${t('rbRecReduce')}</span>
      <span class="rec-name">${rec.name_en && CURRENT_LANG==='en' ? rec.name_en : rec.name} <span style="color:var(--text-2);font-weight:300;">${rec.ticker}</span></span>
    `;
    const formatMoney = v => Math.round(v).toLocaleString();
    const krwSuffix = (amt) => CURRENT_LANG === 'ko' ? ` <span style="color:var(--text-2); font-size:10.5px;">(${formatKRWUnit(amt)})</span>` : '';
    let meta;
    if (rec.type === 'add'){
      const unit = rec.asset.current_price.toLocaleString();
      const totalAmt = rec.asset.current_price * rec.quantity;
      meta = `${sectorLabel(rec.asset.sector)} · <b>${unit}</b> × ${rec.quantity}${t('sharesUnit')} = <b style="color:var(--text-0);">${formatMoney(totalAmt)}</b>${krwSuffix(totalAmt)}`;
    } else {
      // 축소: 현재 평가금액 → 변경 후 평가금액
      const item = RUNTIME.ITEMS.find(it => it.ticker === rec.ticker);
      const price = item ? item.current_price : 0;
      const beforeAmt = rec.currentQty * price;
      const afterAmt = rec.newQty * price;
      const soldAmt = (rec.currentQty - rec.newQty) * price;
      meta = `<b>${rec.currentQty}</b>${t('sharesUnit')} (${formatMoney(beforeAmt)}) → <b>${rec.newQty}</b>${t('sharesUnit')} (${formatMoney(afterAmt)})${krwSuffix(afterAmt)}<br><span style="color:var(--caution); font-size: 11px;">${t('rbReduceSold', formatMoney(soldAmt))}${krwSuffix(soldAmt)}</span>`;
    }
    const reason = renderReason(rec);
    const impact = rec.impact;
    const arrow = (cur, next, dec=1, betterUp=true) => {
      const d = next - cur;
      const cls = (betterUp ? d > 0 : d < 0) ? 'delta-up' : ((betterUp ? d < 0 : d > 0) ? 'delta-down' : '');
      return `<span class="${cls}">${cur.toFixed(dec)} → <b>${next.toFixed(dec)}</b></span>`;
    };
    const impactRows = `
      <div class="rec-impact-row"><span class="lbl">${t('rbImpactBalance')}</span><span class="val">${arrow(RUNTIME.BALANCE.balance_raw||0, impact.balance.balance_raw||0, 1, true)}</span></div>
      <div class="rec-impact-row"><span class="lbl">${t('rbImpactHHI')}</span><span class="val">${arrow(parseFloat(RUNTIME.BALANCE.hhi||0), parseFloat(impact.balance.hhi||0), 3, false)}</span></div>
      <div class="rec-impact-row"><span class="lbl">${t('rbImpactDiverse')}</span><span class="val">${arrow(RUNTIME.BALANCE.diverse_raw||0, impact.balance.diverse_raw||0, 1, true)}</span></div>
      <div class="rec-impact-row"><span class="lbl">${t('rbImpactRisk')}</span><span class="val">${arrow(RUNTIME.BALANCE.avgRisk_raw||0, impact.balance.avgRisk_raw||0, 1, false)}</span></div>
    `;
    const applyLabel = rec.type === 'add' ? t('rbRecApplyAdd', rec.quantity) : t('rbRecApplyReduce', rec.newQty);
    const weaknessTag = `<span class="rec-weakness-tag">${t('weakness' + rec.weakness)}</span>`;
    return `
      <div class="rec-card ${rec.type} w-${rec.weakness} ${applied?'applied':''}" data-idx="${idx}">
        ${weaknessTag}
        <div class="rec-head">${head}</div>
        <div class="rec-meta">${meta}</div>
        <div class="rec-reason">${reason}</div>
        <div class="rec-impact">${impactRows}</div>
        <div class="rec-actions">
          <button class="rec-btn apply" data-action="apply" data-idx="${idx}">${applyLabel}</button>
          <button class="rec-btn skip" data-action="skip" data-idx="${idx}">${t('rbRecSkip')}</button>
        </div>
      </div>
    `;
  }).join('');

  // 이벤트 위임
  el.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.idx, 10);
      if (btn.dataset.action === 'apply') applyRecommendation(idx);
      else if (btn.dataset.action === 'skip') skipRecommendation(idx);
    });
  });
}

export function renderReason(rec){
  const w = rec.weakness;
  const targetSec = rec.type === 'add' ? sectorLabel(rec.asset.sector) : '';
  if (w === 'W1' || w === 'W4'){
    const dom = Object.entries(RUNTIME.BALANCE.sectorWeights || {}).sort((a,b)=>b[1]-a[1])[0];
    const domSec = dom ? sectorLabel(dom[0]) : '?';
    const domPct = dom ? ((dom[1]||0)*100).toFixed(0) : '0';
    if (w === 'W1') return t('rbReasonW1', domSec, domPct, targetSec);
    return t('rbReasonW4', targetSec);
  }
  if (w === 'W2'){
    const top = RUNTIME.ITEMS.slice().sort((a,b)=>b.weight-a.weight)[0];
    return t('rbReasonW2', getName(top), (top.weight*100).toFixed(0));
  }
  if (w === 'W3') return t('rbReasonW3', targetSec);
  if (w === 'W5') return t('rbReasonW5', targetSec);
  if (w === 'W6'){
    const region = CURRENT_LANG==='en' ? (rec.asset.ticker.endsWith('.KS') ? 'Korea' : 'US') : (rec.asset.ticker.endsWith('.KS') ? '한국' : '미국');
    return t('rbReasonW6', region, getName(rec.asset));
  }
  if (w === 'W7') return t('rbReasonW7', getName(rec.asset));
  return '';
}
