// @ts-nocheck
import * as THREE from 'three';
// 레거시 코드는 전역 THREE 를 가정하므로 globalThis 에 노출
(globalThis as any).THREE = THREE;

import {
  I18N, CURRENT_LANG, t, applyI18n, setLang, getName,
  formatKRWUnit, SECTOR_LABELS, sectorLabel, onLangChange
} from './i18n.js';
import { ASSET_DB, ASSET_BY_TICKER, SAMPLE_HOLDINGS } from './data/assetDb.js';
import { applyTickerCatalog, applyDailyPrices } from './data/catalog.js';
import {
  STATE, STORAGE_KEY, MAX_PORTFOLIOS,
  saveState, activePortfolio, portfolioToRaw,
  computeWeights, migrateHoldings, TOTAL_PORTFOLIO_VALUE
} from './state/portfolio.js';
import { showToast } from './ui/toast-react/index.js';
import {
  SECTOR_DEF, standardize, computeRiskScores, riskColor, riskLabel,
  mapSphereCoords, computeBalance, balanceGrade, generateInsights
} from './core/pipeline.js';
import {
  computeAdvancedMetrics, STRESS_SCENARIOS, MACRO_FACTORS, MACRO_AXES,
  SELECTED_MACROS, toggleMacro, rebuildCustomScenario, computeStressTest
} from './advanced/metrics.js';
import * as scene from './scene/sphere.js';
import { latLngToVec3 } from './scene/sphere.js';
import {
  openModal, closeModal, customAlert, customConfirm, openAbout, installModal
} from './ui/modal.js';
import { setMobileSection, installMobileNav } from './ui/mobile.js';
import { showTour, installTour } from './ui/tour.js';
import { renderPortfolioSelect, installPortfolioSelect } from './ui/portfolio-select.js';
import { installResize, installRightTabs, installTheme } from './ui/layout.js';
import { RUNTIME } from './runtime.js';
import {
  renderHoldings, addHolding, removeHolding,
  updateHoldingQuantity, updateHoldingAvgPrice, installHoldings
} from './ui/holdings.js';
import { renderSectorBars, renderRiskDist, renderBalance } from './ui/balance.js';
import { gradeBadge, gradeDots, fmtSignedNum, fmtMoneySigned, fmtMoneyKR } from './ui/format.js';
import { renderAdvanced } from './ui/advanced.js';
import { renderStress } from './ui/stress.js';
import { renderInsights, clearAlert } from './ui/insights-react/index.js';
import { renderStockDetail } from './ui/detail.js';
import { buildCorrelationLines, pairCorrelation } from './ui/correlation.js';
import { installSearch } from './ui/search.js';
import { installTooltipReact } from './ui/tooltip-react/index.js';
import {
  installRebalance, recomputeTarget, enterRebalance, exitRebalance,
  updateTargetQuantity, rebuildNodesForCurrentMode, renderRebalancePanel
} from './ui/rebalance.js';
import { installAuthButton } from './ui/auth-button.js';

// 디버깅 편의: 콘솔에서 접근 가능하게 window 노출 (기능적 의존성 없음)
window.ASSET_DB = ASSET_DB;
window.ASSET_BY_TICKER = ASSET_BY_TICKER;

window.addEventListener('error', e => console.error('[SPHERE]', e.message, e.filename, e.lineno));
function bootWhenReady(fn){
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}


bootWhenReady(function(){
  try { initSphere(); } catch(e){ console.error(e); alert('SPHERE init error: ' + e.message); }
});

function initSphere(){
/* =========================================================
   SPHERE — Skills.md v1.0.0 구현
   Layer 1: 표준화  Layer 2: 리스크  Layer 3: 좌표
   Layer 4: 밸런스  Layer 5: 시각화
   ========================================================= */

// 런타임 상태(RUNTIME.ITEMS/RUNTIME.BALANCE/RUNTIME.INSIGHTS/RUNTIME.ADVANCED/RUNTIME.CURRENT_STRESS) → src/runtime.ts

function runPipeline(){
  const pf = activePortfolio();
  const raw = portfolioToRaw(pf);
  if (raw.length === 0){
    RUNTIME.ITEMS = [];
    RUNTIME.BALANCE = { balance:0, diverse:0, deviation:0, sphericity:0, hhi:'0.000', avgRisk:0, sectorWeights:{} };
    RUNTIME.INSIGHTS = [{ level:'ok', title:t('insightEmptyTitle'), body:t('insightEmptyBody') }];
    RUNTIME.ADVANCED = computeAdvancedMetrics([], RUNTIME.BALANCE);
    return;
  }
  RUNTIME.ITEMS = mapSphereCoords(computeRiskScores(standardize(raw)));
  RUNTIME.BALANCE = computeBalance(RUNTIME.ITEMS);
  RUNTIME.INSIGHTS = generateInsights(RUNTIME.ITEMS, RUNTIME.BALANCE);
  RUNTIME.ADVANCED = computeAdvancedMetrics(RUNTIME.ITEMS, RUNTIME.BALANCE);
}
runPipeline();

/* =========================================================
   3D 씬 부트스트랩 + UI 컨트롤 라우팅
   상세 3D 로직은 src/scene/sphere.ts
   ========================================================= */

// 네트워크 모드 (상관관계 라인 표시) — UI 상태

function selectAsset(ticker){
  // 3D 노드 강조
  scene.selectNode(ticker);
  // 좌측 보유 리스트 active 마킹
  document.querySelectorAll('.holding').forEach(el => {
    el.classList.toggle('active', el.dataset.ticker === ticker);
  });
  // 우측 종목상세 패널
  renderStockDetail(RUNTIME.ITEMS.find(i => i.ticker === ticker));
  // 데스크탑: 상세 탭으로
  if (window.innerWidth > 768 && typeof window.openDetailTab === 'function'){
    window.openDetailTab();
  }
  // 모바일: 인사이트 섹션으로 + 부드럽게 스크롤
  else if (window.innerWidth <= 768 && typeof setMobileSection === 'function'){
    setMobileSection('insights');
    setTimeout(() => {
      const detail = document.getElementById('stockDetail');
      if (detail){
        const headerH = (document.querySelector('header')?.offsetHeight || 56);
        const top = detail.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }, 100);
  }
}

// 컨트롤 버튼 — [data-mode] 이벤트 위임
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-mode]');
  if (!btn) return;
  const m = btn.dataset.mode;
  if (m === 'rotate'){
    const on = scene.toggleAutoRotate();
    btn.classList.toggle('active', on);
    return;
  }
  if (m === 'rebalance'){
    if (RUNTIME.rebalanceMode) exitRebalance(false);
    else enterRebalance();
    return;
  }
  if (m === 'network'){
    RUNTIME.networkMode = !RUNTIME.networkMode;
    btn.classList.toggle('network-active', RUNTIME.networkMode);
    document.getElementById('networkLegend').classList.toggle('show', RUNTIME.networkMode);
    document.body.classList.toggle('network-mode', RUNTIME.networkMode);
    buildCorrelationLines();
    return;
  }
  if (m === 'reset'){
    scene.resetView();
    document.querySelector('[data-mode=rotate]')?.classList.add('active');
    document.querySelectorAll('.holding').forEach(el => el.classList.remove('active'));
    document.getElementById('stockDetail').classList.remove('show');
    document.getElementById('noSelect').style.display = 'block';
    document.querySelectorAll('[data-mode=sphere],[data-mode=cluster]').forEach(b => b.classList.toggle('active', b.dataset.mode === 'sphere'));
    document.getElementById('viewMode').textContent = 'SPHERE VIEW';
    return;
  }
  if (m === 'sphere' || m === 'cluster'){
    scene.setViewMode(m, RUNTIME.ITEMS);
    document.querySelectorAll('[data-mode=sphere],[data-mode=cluster]').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    document.getElementById('viewMode').textContent = m === 'sphere' ? t('sphereView') : t('clusterView');
  }
});

// 씬 초기화 + 첫 노드 렌더
scene.initScene({ onSelect: selectAsset });
scene.rebuildNodes(RUNTIME.ITEMS);

// 모달 초기화 (showTour 콜백 — ui/tour.ts 에서 가져옴)
installModal({ showTour });
installMobileNav();
installTour();
installResize();
installRightTabs();
installTheme();

/* =========================================================
   UI 렌더링
   ========================================================= */






function updateClock(){
  const d = new Date();
  document.getElementById('updateTime').textContent =
    d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}

function renderAllUI(){
  renderHoldings();
  renderSectorBars();
  renderRiskDist();
  renderBalance();
  renderAdvanced();
  renderStress();
  renderInsights();
  // REBALANCE 버튼 — 보유 종목 0이면 disabled + 툴팁
  const btnReb = document.getElementById('btnRebalance');
  if (btnReb){
    const empty = !RUNTIME.ITEMS || RUNTIME.ITEMS.length === 0;
    btnReb.disabled = empty;
    btnReb.title = empty ? (CURRENT_LANG==='en' ? 'Add at least one holding to use rebalancer' : '보유 종목을 먼저 추가하세요') : '';
  }
}




// 전체 리빌드 (포트폴리오 변경/추가/삭제/비중수정 시 호출)
function rebuildAll(){
  clearAlert();
  scene.clearNodeHighlight();
  document.getElementById('stockDetail').classList.remove('show');
  document.getElementById('noSelect').style.display = 'block';
  runPipeline();
  // 리밸런싱 모드면 TARGET을 그리고, 아니면 현재 RUNTIME.ITEMS를 그림
  if (RUNTIME.rebalanceMode){
    recomputeTarget();
    rebuildNodesForCurrentMode();
    renderRebalancePanel();
  } else {
    scene.rebuildNodes(RUNTIME.ITEMS);
  }
  // 네트워크 모드면 상관관계 라인도 갱신
  buildCorrelationLines();
  renderAllUI();
}


/* =========================================================
   종목 추가/삭제/비중수정
   ========================================================= */

/* =========================================================
   검색 (자산 DB 자동완성)
   ========================================================= */


// 하단 면책 배너 — X로 닫으면 localStorage에 저장되어 다음 방문에도 안 뜸
const legalBanner = document.getElementById('legalBanner');
if (localStorage.getItem('sphere_legal_dismissed') === '1') {
  legalBanner.classList.add('hidden');
}
document.getElementById('legalBannerClose')?.addEventListener('click', () => {
  legalBanner.classList.add('hidden');
  localStorage.setItem('sphere_legal_dismissed', '1');
});
document.getElementById('legalBannerView')?.addEventListener('click', openAbout);


/* =========================================================
   인포 툴팁 (각 지표의 산출 공식·의미 설명)
   ========================================================= */
// 학술 출처: Markowitz(1952) MPT, Sharpe(1964) CAPM, Herfindahl(1950)/Hirschman(1945) HHI

// =========================================================
// 모바일 바텀 네비 — Smooth scroll quick-jump
// =========================================================

// 모바일 검색 드롭다운 — 바텀 네비 위에서 멈추도록 max-height 동적 계산
(function setupMobileSearchDropdown(){
  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');
  if (!input || !results) return;

  function recalc(){
    if (window.innerWidth > 768) return;
    const rect = input.getBoundingClientRect();
    const navH = (document.querySelector('.bottom-nav')?.offsetHeight || 60);
    const buffer = 16;
    // 입력창 하단부터 바텀 네비 위까지의 공간
    const space = window.innerHeight - rect.bottom - navH - buffer;
    document.documentElement.style.setProperty('--mobile-dd-max', Math.max(180, space) + 'px');
  }
  input.addEventListener('focus', () => setTimeout(recalc, 100));
  input.addEventListener('input', recalc);
  window.addEventListener('resize', recalc);
  window.addEventListener('scroll', recalc, { passive: true });
  recalc();
})();

// 검색 칩 클릭 후 포커스 흔적 제거 (sticky outline 방지)
document.addEventListener('click', e => {
  const tag = e.target.closest('.search-tag, .sr-hashtag-suggestion');
  if (tag) setTimeout(() => tag.blur(), 50);
});

// 모바일 FAB — 검색 섹션으로 전환 + input focus
(function setupFabSearch(){
  const fab = document.getElementById('fabSearch');
  const input = document.getElementById('searchInput');
  if (!fab || !input) return;
  fab.addEventListener('click', () => {
    if (typeof setMobileSection === 'function') setMobileSection('search');
    setTimeout(() => input.focus(), 360);
  });
})();

// 모바일 섹션 시스템 → src/ui/mobile.ts

/* =========================================================
   초기 렌더
   ========================================================= */
// 언어 토글 이벤트 바인딩 + 초기 적용
document.querySelectorAll('#langSwitch button').forEach(b => {
  b.addEventListener('click', () => setLang(b.dataset.lang));
});
onLangChange(rebuildAll); // i18n.js 의 setLang 이 언어 전환 시 rebuildAll 을 호출
applyI18n();

// 1) 티커 카탈로그 로드 → 2) 일별 시세 적용 (양쪽 모두 비동기, 실패 시 폴백)
applyTickerCatalog().then(catMeta => {
  if (catMeta && catMeta.added > 0){
    console.log(`[SPHERE] Loaded ${catMeta.added} catalog tickers · total ${catMeta.total}`);
  }
  return applyDailyPrices();
}).then(meta => {
  if (!meta || meta.updated === 0) return;
  console.log(`[SPHERE] Loaded ${meta.updated} daily prices · ${meta.updatedAt}`);
  // 헤더 STATUS — "● UPDATED YYYY-MM-DD" 로 갱신
  const statusEls = document.querySelectorAll('.header-meta div');
  statusEls.forEach(el => {
    if (el.querySelector('[data-i18n="status"]')) {
      const d = new Date(meta.updatedAt);
      const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const b = el.querySelector('b');
      if (b) b.textContent = `● ${str}`;
    }
  });
  // 면책 배너 텍스트도 "전일 종가 기준" 으로 변경
  const dcText = document.getElementById('legalBanner')?.querySelector('.legal-banner-text');
  if (dcText){
    const dailyMsg = CURRENT_LANG === 'en'
      ? 'This is an educational visualization tool, not investment advice. Asset prices are auto-updated daily (previous-day close).'
      : '본 서비스는 교육·시연 목적의 시각화 도구이며, 투자 자문이 아닙니다. 종목 시세는 매일 전일 종가 기준으로 자동 갱신됩니다.';
    dcText.textContent = dailyMsg;
  }
  // 전체 파이프라인 재계산
  rebuildAll();
});


// 좌·우 사이드바 토글 — body 클래스 기반, 캔버스 자동 리사이즈
function togglePanel(side){
  const cls = side === 'left' ? 'left-collapsed' : 'right-collapsed';
  document.body.classList.toggle(cls);
  localStorage.setItem('sphere_' + cls, document.body.classList.contains(cls) ? '1' : '0');
  // 트랜지션 끝난 뒤 3D 캔버스 리사이즈
  setTimeout(scene.onResize, 360);
}
if (localStorage.getItem('sphere_left-collapsed') === '1') document.body.classList.add('left-collapsed');
if (localStorage.getItem('sphere_right-collapsed') === '1') document.body.classList.add('right-collapsed');
document.getElementById('leftPanelToggle')?.addEventListener('click', () => togglePanel('left'));
document.getElementById('rightPanelToggle')?.addEventListener('click', () => togglePanel('right'));

// 리밸런싱 패널 버튼 핸들러는 installRebalance() 내부에서 등록

installPortfolioSelect({ onPortfolioChanged: rebuildAll });
installHoldings({
  onRebuildAll: rebuildAll,
  onSelectAsset: selectAsset,
  onTargetQtyChange: updateTargetQuantity
});
installSearch();
installTooltipReact();
installRebalance({ onRebuildAll: rebuildAll });
installAuthButton({ onSessionChange: rebuildAll });
renderPortfolioSelect();
renderAllUI();
updateClock();
setInterval(updateClock, 30000);

// 레이아웃 변화 감지하여 캔버스 크기 갱신
if (window.ResizeObserver){
  const _canvasParent = document.getElementById("canvas")?.parentElement; if (_canvasParent) new ResizeObserver(scene.onResize).observe(_canvasParent);
}
// 첫 렌더 직후 한 번 더 사이즈 보정
setTimeout(scene.onResize, 50);
setTimeout(scene.onResize, 300);

} // end initSphere
