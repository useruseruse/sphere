// @ts-nocheck
/* =========================================================
   SPHERE — Holdings 패널
   - renderHoldings : 보유 종목 리스트 + 수량 인라인 편집
   - addHolding / removeHolding : 좌측 검색·X 버튼
   - updateHoldingQuantity / updateHoldingAvgPrice : qty / avg-price 변경
   ========================================================= */

import { t, getName, sectorLabel, formatKRWUnit } from '../i18n.js';
import { riskColor } from '../core/pipeline.js';
import { ASSET_BY_TICKER } from '../data/assetDb.js';
import { activePortfolio, saveState, TOTAL_PORTFOLIO_VALUE } from '../state/portfolio.js';
import { RUNTIME } from '../runtime.js';
import { renderPortfolioSelect } from './portfolio-select.js';

let _onRebuildAll = () => {};
let _onSelectAsset = (_ticker: string) => {};
let _onTargetQtyChange = (_ticker: string, _qty: number) => {};

/** 부트스트랩에서 콜백 등록 */
export function installHoldings(opts: {
  onRebuildAll: () => void;
  onSelectAsset: (ticker: string) => void;
  onTargetQtyChange: (ticker: string, qty: number) => void;
}){
  _onRebuildAll = opts.onRebuildAll;
  _onSelectAsset = opts.onSelectAsset;
  _onTargetQtyChange = opts.onTargetQtyChange;
}

export function renderHoldings(){
  const el = document.getElementById('holdingsList');
  const empty = document.getElementById('holdingsEmpty');
  el.innerHTML = '';
  // 리밸런싱 모드면 TARGET_ITEMS, 아니면 ITEMS 사용
  const sourceItems = RUNTIME.rebalanceMode && RUNTIME.TARGET_ITEMS.length ? RUNTIME.TARGET_ITEMS : RUNTIME.ITEMS;
  const sorted = [...sourceItems].sort((a, b) => b.weight - a.weight);
  empty.style.display = sorted.length === 0 ? 'block' : 'none';

  // 총 평가액 표시 (모드별)
  const totalEl = document.getElementById('totalValue');
  const totalKrEl = document.getElementById('totalValueKr');
  if (totalEl){
    let total = TOTAL_PORTFOLIO_VALUE;
    if (RUNTIME.rebalanceMode && RUNTIME.TARGET_ITEMS.length){
      total = RUNTIME.TARGET_ITEMS.reduce((s, it) => s + (it.market_value || 0), 0);
    }
    totalEl.textContent = Math.round(total).toLocaleString();
    if (totalKrEl) totalKrEl.textContent = formatKRWUnit(total);
  }

  sorted.forEach(it => {
    const d = document.createElement('div');
    d.className = 'holding' + (RUNTIME.rebalanceMode ? ' rb-mode' : '');
    d.dataset.ticker = it.ticker;
    // 리밸런싱 모드에서 현재 보유량 힌트
    let currentHint = '';
    if (RUNTIME.rebalanceMode){
      const original = activePortfolio().holdings.find(h => h.ticker === it.ticker);
      if (original && original.quantity !== it.quantity){
        const diff = it.quantity - original.quantity;
        const sign = diff > 0 ? '+' : '';
        const color = diff > 0 ? 'var(--safe)' : 'var(--high)';
        currentHint = t('holdingCurrentHint', original.quantity, sign, diff, color);
      }
    }
    d.innerHTML = `
      <div class="holding-dot" style="background:${riskColor(it.risk_score)};color:${riskColor(it.risk_score)}"></div>
      <div class="holding-info">
        <div class="holding-name">${getName(it)}</div>
        <div class="holding-sub" title="${it.ticker} · ${sectorLabel(it.sector)}">${it.ticker}<span class="sub-sep">·</span>${sectorLabel(it.sector)}</div>
        ${currentHint}
      </div>
      <div class="holding-right">
        <div class="holding-qty-line">
          <input type="number" class="qty-edit" value="${it.quantity}" min="1" step="1" data-ticker="${it.ticker}" title="${t('qtyEditTitle')}">
          <span class="qty-suffix">${t('sharesUnit')}</span>
        </div>
        <div class="holding-value" title="${t('valueTooltipTitle')}">${Math.round(it.market_value).toLocaleString()}</div>
        <div class="holding-meta">
          <span class="weight-pct">${(it.weight*100).toFixed(1)}%</span>
          <span class="${it.return_pct>=0?'pos':'neg'}">${it.return_pct>=0?'+':''}${(it.return_pct*100).toFixed(2)}%</span>
        </div>
      </div>
      <button class="holding-del" data-ticker="${it.ticker}" title="${t('delTitle')}">×</button>
    `;
    d.addEventListener('click', e => {
      if ((e.target as HTMLElement).classList.contains('holding-del') ||
          (e.target as HTMLElement).classList.contains('qty-edit')) return;
      _onSelectAsset(it.ticker);
    });
    d.querySelector('.holding-del').addEventListener('click', e => {
      e.stopPropagation();
      removeHolding(it.ticker);
    });
    const qInput = d.querySelector('.qty-edit') as HTMLInputElement;
    qInput.addEventListener('click', e => e.stopPropagation());
    qInput.addEventListener('keydown', e => {
      if (e.key === 'Enter'){ qInput.blur(); }
      else if (e.key === 'Escape'){ qInput.value = it.quantity; qInput.blur(); }
    });
    qInput.addEventListener('blur', () => {
      const v = parseInt(qInput.value, 10);
      if (!isNaN(v) && v > 0){
        if (v !== it.quantity) updateHoldingQuantity(it.ticker, v);
      } else {
        qInput.value = it.quantity;
      }
    });
    el.appendChild(d);
  });
  document.getElementById('holdingCount').textContent = RUNTIME.ITEMS.length;
}

export function addHolding(ticker: string){
  const pf = activePortfolio();
  if (pf.holdings.some(h => h.ticker === ticker)) return;
  const a = ASSET_BY_TICKER[ticker];
  if (!a) return;
  // 1주로 즉시 추가 — 수량은 보유 목록에서 인라인 편집
  pf.holdings.push({ ticker, quantity: 1, avg_price: a.current_price });
  pf.updatedAt = Date.now();
  saveState();
  renderPortfolioSelect();
  _onRebuildAll();
  // 검색창 초기화
  const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
  const searchResults = document.getElementById('searchResults');
  if (searchInput) searchInput.value = '';
  if (searchResults) searchResults.classList.remove('show');
  // 추가된 종목으로 스크롤 + 수량 칸 강조
  setTimeout(() => {
    const row = document.querySelector(`.holding[data-ticker="${ticker}"]`);
    if (row){
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const qty = row.querySelector('.qty-edit') as HTMLInputElement | null;
      if (qty){ qty.focus(); qty.select(); }
    }
  }, 100);
}

export function removeHolding(ticker: string){
  const pf = activePortfolio();
  pf.holdings = pf.holdings.filter(h => h.ticker !== ticker);
  pf.updatedAt = Date.now();
  saveState();
  renderPortfolioSelect();
  _onRebuildAll();
}

export function updateHoldingQuantity(ticker: string, newQty: number){
  // 리밸런싱 모드면 TARGET_HOLDINGS만 수정 (실제 상태 보존)
  if (RUNTIME.rebalanceMode){
    _onTargetQtyChange(ticker, newQty);
    return;
  }
  const pf = activePortfolio();
  const target = pf.holdings.find(h => h.ticker === ticker);
  if (!target) return;
  newQty = Math.max(1, Math.floor(newQty));
  target.quantity = newQty;
  pf.updatedAt = Date.now();
  saveState();
  _onRebuildAll();
}

export function updateHoldingAvgPrice(ticker: string, newPrice: number){
  const pf = activePortfolio();
  const target = pf.holdings.find(h => h.ticker === ticker);
  if (!target) return;
  if (newPrice > 0){
    target.avg_price = newPrice;
    pf.updatedAt = Date.now();
    saveState();
    _onRebuildAll();
  }
}
