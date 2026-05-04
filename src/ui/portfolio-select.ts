// @ts-nocheck
/* =========================================================
   SPHERE — 포트폴리오 선택 드롭다운 + CRUD
   - 헤더의 활성 포트폴리오 표시 + 드롭다운 리스트
   - + NEW / RENAME / DELETE 버튼 → 모달
   ========================================================= */

import { t } from '../i18n.js';
import { STATE, MAX_PORTFOLIOS, activePortfolio, saveState } from '../state/portfolio.js';
import { openModal, customConfirm } from './modal.js';

let _onPortfolioChanged = () => {};

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function openDropdown(){
  document.getElementById('pfCurrent').classList.add('open');
  document.getElementById('pfList').classList.add('show');
}

function closeDropdown(){
  document.getElementById('pfCurrent').classList.remove('open');
  document.getElementById('pfList').classList.remove('show');
}

export function renderPortfolioSelect(){
  const active = activePortfolio();
  document.getElementById('pfCurrentName').textContent = active.name;
  document.getElementById('pfCurrentMeta').textContent =
    t('assetsCount', active.holdings.length, STATE.portfolios.length);

  const list = document.getElementById('pfList');
  list.innerHTML = '';
  STATE.portfolios.forEach(p => {
    const item = document.createElement('div');
    item.className = 'pf-item' + (p.id === STATE.activeId ? ' active' : '');
    const date = new Date(p.updatedAt);
    const dateStr = `${date.getMonth()+1}/${date.getDate()}`;
    item.innerHTML = `
      <div class="pf-item-dot"></div>
      <div class="pf-item-info">
        <div class="pf-item-name">${escapeHtml(p.name)}</div>
        <div class="pf-item-meta">
          <span>${t('portfolioCount', p.holdings.length)}</span>
          <span>·</span>
          <span>${t('updatedAt', dateStr)}</span>
        </div>
      </div>
      <span class="pf-item-count">${p.holdings.length}</span>
    `;
    item.addEventListener('click', () => {
      STATE.activeId = p.id;
      saveState();
      closeDropdown();
      _onPortfolioChanged();
    });
    list.appendChild(item);
  });

  // 푸터 (생성 한도 안내)
  const div = document.createElement('div');
  div.className = 'pf-list-divider';
  list.appendChild(div);
  const footer = document.createElement('div');
  footer.className = 'pf-list-footer';
  footer.textContent = `${STATE.portfolios.length} / ${MAX_PORTFOLIOS} portfolios`;
  list.appendChild(footer);

  document.getElementById('pfDelete').disabled = STATE.portfolios.length <= 1;
  const newBtn = document.getElementById('pfNew');
  newBtn.disabled = STATE.portfolios.length >= MAX_PORTFOLIOS;
  newBtn.title = newBtn.disabled
    ? `최대 ${MAX_PORTFOLIOS}개까지 만들 수 있습니다`
    : '새 포트폴리오 만들기';
}

/**
 * @param {{ onPortfolioChanged: () => void }} opts
 */
export function installPortfolioSelect(opts){
  if (opts?.onPortfolioChanged) _onPortfolioChanged = opts.onPortfolioChanged;

  document.getElementById('pfCurrent')?.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = document.getElementById('pfList').classList.contains('show');
    if (isOpen) closeDropdown(); else openDropdown();
  });
  document.addEventListener('click', e => {
    if (!(e.target as HTMLElement).closest('#pfDropdown')) closeDropdown();
  });

  document.getElementById('pfNew')?.addEventListener('click', () => {
    if (STATE.portfolios.length >= MAX_PORTFOLIOS) return;
    openModal({
      title: t('modalNewPfTitle'),
      desc: t('modalNewPfDesc', STATE.portfolios.length + 1, MAX_PORTFOLIOS),
      placeholder: t('modalNewPfPh'),
      initial: t('modalNewPfDefault', STATE.portfolios.length + 1),
      onOK: (name: string) => {
        const pf = {
          id: 'pf_' + Date.now(),
          name: name || 'Untitled',
          holdings: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        STATE.portfolios.push(pf);
        STATE.activeId = pf.id;
        saveState();
        renderPortfolioSelect();
        _onPortfolioChanged();
      }
    });
  });

  document.getElementById('pfRename')?.addEventListener('click', () => {
    const pf = activePortfolio();
    openModal({
      title: t('modalRenameTitle'),
      desc: t('modalRenameDesc'),
      placeholder: t('modalRenamePh'),
      initial: pf.name,
      onOK: (name: string) => {
        if (name && name.trim()){
          pf.name = name.trim();
          pf.updatedAt = Date.now();
          saveState();
          renderPortfolioSelect();
        }
      }
    });
  });

  document.getElementById('pfDelete')?.addEventListener('click', async () => {
    if (STATE.portfolios.length <= 1) return;
    const pf = activePortfolio();
    if (!await customConfirm(t('confirmDelete', pf.name))) return;
    STATE.portfolios = STATE.portfolios.filter(p => p.id !== pf.id);
    STATE.activeId = STATE.portfolios[0].id;
    saveState();
    renderPortfolioSelect();
    _onPortfolioChanged();
  });
}
