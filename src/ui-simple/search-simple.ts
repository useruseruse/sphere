// @ts-nocheck
/* =========================================================
   SPHERE Simple — 검색 (Pro 의 search.ts 단순화 버전)
   - 자유 텍스트 + 해시태그 (#삼성, #반도체, …) 만 지원
   - 빠른 칩 (samsung/반도체/배당/ETF/채권) 클릭 시 자동 채움
   ========================================================= */

import { CURRENT_LANG, getName, sectorLabel } from '../i18n.js';
import { riskColor } from '../core/pipeline.js';
import { ASSET_DB } from '../data/assetDb.js';
import { activePortfolio } from '../state/portfolio.js';
import { addHoldingFromSearch } from './holdings-simple.js';

let _onAdded = () => {};
let searchInput: HTMLInputElement;
let searchResults: HTMLElement;

export function installSimpleSearch(opts: { onAdded: () => void }){
  _onAdded = opts.onAdded;
  searchInput = document.getElementById('searchInput') as HTMLInputElement;
  searchResults = document.getElementById('searchResults');
  if (!searchInput || !searchResults) return;

  searchInput.addEventListener('input', e => render((e.target as HTMLInputElement).value));
  searchInput.addEventListener('focus', e => { if ((e.target as HTMLInputElement).value) render((e.target as HTMLInputElement).value); });
  document.addEventListener('click', e => {
    if (!(e.target as HTMLElement).closest('.search-wrap')) searchResults.classList.remove('show');
  });

  // 빠른 칩
  document.querySelectorAll('.s-quick-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = (btn as HTMLElement).dataset.q || '';
      searchInput.value = q;
      searchInput.focus();
      render(q);
    });
  });
}

function normalize(s: string){ return (s || '').toLowerCase().replace(/\s+/g, ''); }

function search(q: string){
  const ownedTickers = new Set(activePortfolio().holdings.map(h => h.ticker));
  q = q.trim();
  if (!q) return [];

  // 해시태그 — 단순화: 일부 키워드만
  if (q.startsWith('#')){
    const tag = q.slice(1).toLowerCase();
    return ASSET_DB.filter(a => {
      const blob = ((a.name || '') + ' ' + (a.name_en || '') + ' ' + (a.alias || '') + ' ' + a.ticker + ' ' + a.sector).toLowerCase();
      return blob.includes(tag);
    }).slice(0, 30);
  }

  const nq = normalize(q);
  return ASSET_DB.filter(a => {
    const t1 = normalize(a.ticker);
    const t2 = normalize(a.name || '');
    const t3 = normalize(a.name_en || '');
    const t4 = normalize(a.alias || '');
    return t1.includes(nq) || t2.includes(nq) || t3.includes(nq) || t4.includes(nq);
  }).slice(0, 30);
}

function render(q: string){
  if (!q.trim()){
    searchResults.classList.remove('show');
    return;
  }
  const results = search(q);
  if (results.length === 0){
    searchResults.innerHTML = `<div class="s-search-empty">😅 ${CURRENT_LANG === 'en' ? 'No matches. Try another keyword.' : '결과가 없어요. 다른 키워드를 시도해보세요.'}</div>`;
    searchResults.classList.add('show');
    return;
  }
  const ownedTickers = new Set(activePortfolio().holdings.map(h => h.ticker));
  searchResults.innerHTML = results.map(a => {
    const owned = ownedTickers.has(a.ticker);
    const c = riskColor(a.is_etf ? 35 : 60);  // 대략적 — 정식 risk 는 pipeline 후
    return `
      <div class="s-search-result ${owned ? 'owned' : ''}" data-ticker="${a.ticker}">
        <div class="s-search-dot" style="background:${c}"></div>
        <div class="s-search-info">
          <div class="s-search-name">${getName(a)}</div>
          <div class="s-search-sub">${a.ticker} · ${sectorLabel(a.sector)}${a.is_etf ? ' · ETF' : ''}</div>
        </div>
        <div class="s-search-action">${owned ? '✓' : '+'}</div>
      </div>
    `;
  }).join('');
  searchResults.classList.add('show');

  searchResults.querySelectorAll('.s-search-result').forEach(el => {
    if (el.classList.contains('owned')) return;
    el.addEventListener('click', () => {
      const ticker = (el as HTMLElement).dataset.ticker!;
      addHoldingFromSearch(ticker);
      searchInput.value = '';
      searchResults.classList.remove('show');
      _onAdded();
    });
  });
}
