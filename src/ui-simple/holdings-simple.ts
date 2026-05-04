// @ts-nocheck
/* =========================================================
   SPHERE Simple — 보유 종목 (컴팩트)
   - dot + 이름 + 수량(인라인 편집) + 비중 + 삭제
   - 평가금액·return·beta 등 숨김
   ========================================================= */

import { CURRENT_LANG, getName, sectorLabel } from '../i18n.js';
import { riskColor } from '../core/pipeline.js';
import { ASSET_BY_TICKER } from '../data/assetDb.js';
import { activePortfolio, saveState } from '../state/portfolio.js';
import { RUNTIME } from '../runtime.js';

let _onChanged = () => {};

export function installSimpleHoldings(opts: { onChanged: () => void }){
  _onChanged = opts.onChanged;
}

function riskLetter(score: number): string {
  if (score < 30) return 'S';
  if (score < 55) return 'M';
  if (score < 75) return 'C';
  if (score < 90) return 'H';
  return 'E';
}

export function renderSimpleHoldings(){
  const list = document.getElementById('holdingsList');
  const empty = document.getElementById('holdingsEmpty');
  const count = document.getElementById('holdingCount');
  if (!list) return;

  const items = [...RUNTIME.ITEMS].sort((a, b) => b.weight - a.weight);
  if (count) count.textContent = String(items.length);
  if (empty) empty.style.display = items.length === 0 ? 'block' : 'none';

  list.innerHTML = '';
  items.forEach(it => {
    const row = document.createElement('div');
    row.className = 's-holding';
    row.innerHTML = `
      <div class="s-holding-dot" style="background:${riskColor(it.risk_score)}" title="${riskLetter(it.risk_score)}">
        <span>${riskLetter(it.risk_score)}</span>
      </div>
      <div class="s-holding-info">
        <div class="s-holding-name">${getName(it)}</div>
        <div class="s-holding-sub">${it.ticker} · ${sectorLabel(it.sector)}</div>
      </div>
      <div class="s-holding-qty-wrap">
        <input type="number" class="s-qty-input" min="1" step="1" value="${it.quantity}" data-ticker="${it.ticker}">
        <span class="s-qty-suffix">${CURRENT_LANG === 'en' ? 'sh' : '주'}</span>
      </div>
      <div class="s-holding-pct">${(it.weight * 100).toFixed(0)}%</div>
      <button class="s-holding-del" data-ticker="${it.ticker}" title="삭제">×</button>
    `;
    list.appendChild(row);

    const qty = row.querySelector('.s-qty-input') as HTMLInputElement;
    qty.addEventListener('blur', () => {
      const v = parseInt(qty.value, 10);
      if (!isNaN(v) && v > 0 && v !== it.quantity){
        updateQuantity(it.ticker, v);
      } else {
        qty.value = String(it.quantity);
      }
    });
    qty.addEventListener('keydown', e => {
      if (e.key === 'Enter') qty.blur();
      else if (e.key === 'Escape'){ qty.value = String(it.quantity); qty.blur(); }
    });
    row.querySelector('.s-holding-del')?.addEventListener('click', e => {
      e.stopPropagation();
      removeHolding(it.ticker);
    });
  });
}

function updateQuantity(ticker: string, qty: number){
  const pf = activePortfolio();
  const h = pf.holdings.find(h => h.ticker === ticker);
  if (!h) return;
  h.quantity = Math.max(1, Math.floor(qty));
  pf.updatedAt = Date.now();
  saveState();
  _onChanged();
}

function removeHolding(ticker: string){
  const pf = activePortfolio();
  pf.holdings = pf.holdings.filter(h => h.ticker !== ticker);
  pf.updatedAt = Date.now();
  saveState();
  _onChanged();
}

/** Simple 검색 결과에서 호출 */
export function addHoldingFromSearch(ticker: string){
  const pf = activePortfolio();
  if (pf.holdings.some(h => h.ticker === ticker)) return;
  const a = ASSET_BY_TICKER[ticker];
  if (!a) return;
  pf.holdings.push({ ticker, quantity: 1, avg_price: a.current_price });
  pf.updatedAt = Date.now();
  saveState();
  _onChanged();
}
