// @ts-nocheck
/* =========================================================
   SPHERE — Simple 진입 (입문자용)
   - 코어 모듈 (pipeline / state / data / scene / advanced) 재사용
   - 단순 UI 만 별도: ui-simple/
   ========================================================= */

import * as THREE from 'three';
(globalThis as any).THREE = THREE;

import {
  CURRENT_LANG, t, applyI18n, setLang, getName, sectorLabel, formatKRWUnit, onLangChange
} from './i18n.js';
import { ASSET_DB, ASSET_BY_TICKER } from './data/assetDb.js';
import { applyTickerCatalog, applyDailyPrices } from './data/catalog.js';
import { activePortfolio, saveState, portfolioToRaw } from './state/portfolio.js';
import {
  standardize, computeRiskScores, mapSphereCoords,
  computeBalance, balanceGrade, generateInsights, riskColor, riskLabel
} from './core/pipeline.js';
import { computeAdvancedMetrics } from './advanced/metrics.js';
import * as scene from './scene/sphere.js';
import { RUNTIME } from './runtime.js';

import { renderScoreCard } from './ui-simple/score-card.js';
import { renderTopTip } from './ui-simple/top-tip.js';
import { renderBreakdown } from './ui-simple/breakdown.js';
import { renderSimpleHoldings, installSimpleHoldings } from './ui-simple/holdings-simple.js';
import { installSimpleSearch } from './ui-simple/search-simple.js';
import { installSimpleHeader } from './ui-simple/header-simple.js';

// 디버그 편의
(window as any).ASSET_DB = ASSET_DB;
(window as any).ASSET_BY_TICKER = ASSET_BY_TICKER;
window.addEventListener('error', e => console.error('[SPHERE-simple]', e.message, e.filename, e.lineno));

function bootWhenReady(fn){
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}

bootWhenReady(function(){
  try { initSimple(); } catch(e){ console.error(e); alert('SPHERE init error: ' + e.message); }
});

function initSimple(){
  runPipeline();
  scene.initScene({ onSelect: () => {} });   // simple 은 클릭으로 종목 상세 안 띄움
  scene.rebuildNodes(RUNTIME.ITEMS);

  // 인사 메시지 — 시각 친근감
  greet();

  // UI 모듈 install
  installSimpleHeader({ onLangChange: rebuildAll });
  installSimpleSearch({ onAdded: rebuildAll });
  installSimpleHoldings({ onChanged: rebuildAll });

  // 언어 토글 → UI 갱신
  onLangChange(rebuildAll);

  // 첫 렌더
  applyI18n();
  renderAll();

  // 카탈로그·시세 비동기 로드 → 끝나면 한번 더 rebuild
  applyTickerCatalog().then(() => applyDailyPrices()).then(() => rebuildAll());

  // 모바일 리사이즈 감지
  window.addEventListener('resize', () => scene.onResize());
  setTimeout(() => scene.onResize(), 200);

  // 도움말 / 면책
  document.getElementById('sHelpBtn')?.addEventListener('click', () => {
    alert(
      'SPHERE 쉬운 버전 사용법\n\n' +
      '1) 위 검색창에서 종목 추가\n' +
      '2) 점수 카드에 0~100점 표시 — 100에 가까울수록 균형 잡힘\n' +
      '3) "💡 잠깐만요" 카드가 가장 먼저 살펴볼 점을 알려줘요\n' +
      '4) 더 깊이 분석하고 싶다면 헤더 우측 "고급 모드 →"\n\n' +
      '데이터는 브라우저에만 저장돼요. 외부 전송 없음.'
    );
  });
  document.getElementById('aboutIcon')?.addEventListener('click', () => {
    document.getElementById('aboutModal')?.classList.add('show');
  });
  document.getElementById('aboutClose')?.addEventListener('click', () => {
    document.getElementById('aboutModal')?.classList.remove('show');
  });

  // 테마 토글
  initTheme();
}

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

function rebuildAll(){
  runPipeline();
  scene.rebuildNodes(RUNTIME.ITEMS);
  renderAll();
}

function renderAll(){
  renderScoreCard();
  renderBreakdown();
  renderTopTip();
  renderSimpleHoldings();
}

function greet(){
  const hour = new Date().getHours();
  const isKO = CURRENT_LANG !== 'en';
  let msg;
  if (isKO){
    if (hour < 6)  msg = '🌙 늦은 시간 수고하세요';
    else if (hour < 12) msg = '☀️ 좋은 아침입니다';
    else if (hour < 18) msg = '🌤 안녕하세요';
    else msg = '🌆 좋은 저녁입니다';
  } else {
    if (hour < 12) msg = '☀️ Good morning';
    else if (hour < 18) msg = '🌤 Hello';
    else msg = '🌆 Good evening';
  }
  const el = document.getElementById('sGreeting');
  if (el) el.textContent = msg;
}

function initTheme(){
  const btn = document.getElementById('themeToggle');
  const STORAGE = 'sphere_theme_v1';
  const root = document.documentElement;
  function apply(theme){
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    if (btn) btn.textContent = theme === 'light' ? '☀' : '🌙';
    try { localStorage.setItem(STORAGE, theme); } catch(e){}
    scene.applyThemeBg();
  }
  let saved = null;
  try { saved = localStorage.getItem(STORAGE); } catch(e){}
  const sysLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  apply(saved || (sysLight ? 'light' : 'dark'));
  if (btn){
    btn.addEventListener('click', () => {
      const cur = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      apply(cur === 'light' ? 'dark' : 'light');
    });
  }
}
