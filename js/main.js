/* =========================================================
   SPHERE — Main Entry Point
   파이프라인 오케스트레이션 + 모듈 부트스트랩
   ========================================================= */

import { activePortfolio, portfolioToRaw } from './state.js';
import {
  standardize, computeRiskScores, mapSphereCoords,
  computeBalance, generateInsights
} from './pipeline.js';
import { initScene, rebuildNodes, selectNode, clearSelection } from './scene.js';
import { initUI, renderAll, selectAssetUI, clearSelectionUI } from './ui.js';

let ITEMS = [], BALANCE = {}, INSIGHTS = [], TOTAL = 0;

function runPipeline(){
  const pf = activePortfolio();
  const { raws, totalValue } = portfolioToRaw(pf);
  TOTAL = totalValue;
  if (raws.length === 0){
    ITEMS = [];
    BALANCE = { balance:0, diverse:0, deviation:0, sphericity:0, hhi:'0.000', avgRisk:0, sectorWeights:{} };
    INSIGHTS = [{ level:'ok', title:'포트폴리오가 비어있음', body:'좌측 검색창에서 종목을 추가해주세요.' }];
    return;
  }
  ITEMS = mapSphereCoords(computeRiskScores(standardize(raws)));
  BALANCE = computeBalance(ITEMS);
  INSIGHTS = generateInsights(ITEMS, BALANCE);
}

function rebuildAll(){
  runPipeline();
  rebuildNodes(ITEMS);
  renderAll(ITEMS, BALANCE, INSIGHTS, TOTAL);
  // 선택 해제
  clearSelectionUI();
}

function selectAsset(ticker){
  if (!ticker){
    clearSelection();
    clearSelectionUI();
    return;
  }
  selectNode(ticker);
  const item = ITEMS.find(i => i.ticker === ticker);
  selectAssetUI(ticker, item);
}

// ---------- 부트스트랩 ----------
function boot(){
  if (typeof THREE === 'undefined'){
    document.body.insertAdjacentHTML('afterbegin',
      '<div style="position:fixed;inset:0;background:#05070d;color:#FF8C42;display:flex;align-items:center;justify-content:center;font-family:monospace;padding:40px;z-index:9999;text-align:center;">' +
      '<div><div style="color:#e8ecf5;font-size:18px;letter-spacing:4px;margin-bottom:14px;">SPHERE</div>' +
      '<div>three.min.js를 찾을 수 없습니다.</div>' +
      '<div style="color:#9aa4bc;font-size:11px;margin-top:10px;line-height:1.6;">lib/three.min.js 파일이 함께 있어야 합니다.</div></div></div>');
    return;
  }
  try {
    initScene({ onSelect: selectAsset });
    initUI({ onRebuild: rebuildAll, onSelect: selectAsset });
    rebuildAll();
  } catch(e){
    console.error('[SPHERE] init error:', e);
    alert('SPHERE 초기화 오류: ' + e.message);
  }
}

window.addEventListener('error', e => console.error('[SPHERE]', e.message, e.filename, e.lineno));
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
