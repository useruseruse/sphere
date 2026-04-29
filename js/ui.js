/* =========================================================
   SPHERE — UI Layer
   DOM 렌더링 · 이벤트 핸들링 · 검색 · 모달 · 인포 툴팁
   ========================================================= */

import { ASSET_DB, ASSET_BY_TICKER, SECTOR_DEF } from './data.js';
import { riskColor, riskLabel, balanceGrade } from './pipeline.js';
import {
  STATE, MAX_PORTFOLIOS,
  activePortfolio, saveState,
  createPortfolio, deletePortfolio, renamePortfolio, setActivePortfolio,
  addHoldingToActive, removeHoldingFromActive, updateHoldingQuantityActive
} from './state.js';

// 콜백 (main.js에서 주입)
let _onRebuild = () => {};
let _onSelect = () => {};
let _latestBalance = {};
let _latestTotal = 0;

export function initUI(opts){
  _onRebuild = opts.onRebuild;
  _onSelect = opts.onSelect;
  bindPortfolioDropdown();
  bindPortfolioButtons();
  bindSearch();
  bindModal();
  bindInfoTooltips();
  updateClock();
  setInterval(updateClock, 30000);
}

// ---------- 전체 렌더 (main에서 호출) ----------
export function renderAll(items, balance, insights, totalValue){
  _latestBalance = balance;
  _latestTotal = totalValue;
  renderPortfolioSelect();
  renderHoldings(items);
  renderSectorBars(items);
  renderRiskDist(items);
  renderBalance(balance);
  renderInsights(insights);
  document.getElementById('totalValue').textContent = Math.round(totalValue).toLocaleString();
  document.getElementById('avgRiskBig').textContent = balance.avgRisk ?? '--';
  document.getElementById('sphericity').textContent = balance.sphericity ?? '--';
  // 알림 배너
  const top = (insights||[]).find(i=>i.level==='alert') || (insights||[]).find(i=>i.level==='warn');
  const alertBanner = document.getElementById('alertBanner');
  const alertText = document.getElementById('alertText');
  if (top){
    alertBanner.classList.add('show');
    alertText.textContent = top.title.replace(/[⚠✓]/g,'').trim();
  } else {
    alertBanner.classList.remove('show');
  }
}

// ---------- Holdings ----------
function renderHoldings(items){
  const el = document.getElementById('holdingsList');
  const empty = document.getElementById('holdingsEmpty');
  el.innerHTML = '';
  const sorted = [...items].sort((a,b)=>b.weight-a.weight);
  empty.style.display = sorted.length === 0 ? 'block' : 'none';

  sorted.forEach(it=>{
    const d = document.createElement('div');
    d.className = 'holding';
    d.dataset.ticker = it.ticker;
    d.innerHTML = `
      <div class="holding-dot" style="background:${riskColor(it.risk_score)};color:${riskColor(it.risk_score)}"></div>
      <div class="holding-info">
        <div class="holding-name">${escapeHtml(it.name)}</div>
        <div class="holding-sub">
          <span>${it.ticker}</span><span>·</span>
          <input type="number" class="qty-edit" value="${it.quantity}" min="1" step="1" data-ticker="${it.ticker}" title="보유 수량 (Enter로 저장)">
          <span style="color:var(--text-2);">주</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:4px;">
        <div style="text-align:right;">
          <div class="holding-value" title="평가금액 (수량 × 현재가)">${Math.round(it.market_value).toLocaleString()}</div>
          <div class="holding-meta">
            <span style="color:var(--text-1);">${(it.weight*100).toFixed(1)}%</span>
            <span class="${it.return_pct>=0?'pos':'neg'}">${it.return_pct>=0?'+':''}${(it.return_pct*100).toFixed(2)}%</span>
          </div>
        </div>
        <button class="holding-del" data-ticker="${it.ticker}" title="포트폴리오에서 제거">×</button>
      </div>
    `;
    d.addEventListener('click', e=>{
      if (e.target.classList.contains('holding-del') || e.target.classList.contains('qty-edit')) return;
      _onSelect(it.ticker);
    });
    d.querySelector('.holding-del').addEventListener('click', e=>{
      e.stopPropagation();
      removeHoldingFromActive(it.ticker);
      _onRebuild();
    });
    const qInput = d.querySelector('.qty-edit');
    qInput.addEventListener('click', e=> e.stopPropagation());
    qInput.addEventListener('keydown', e=>{
      if (e.key === 'Enter'){ qInput.blur(); }
      else if (e.key === 'Escape'){ qInput.value = it.quantity; qInput.blur(); }
    });
    qInput.addEventListener('blur', ()=>{
      const v = parseInt(qInput.value, 10);
      if (!isNaN(v) && v > 0){
        if (v !== it.quantity){
          updateHoldingQuantityActive(it.ticker, v);
          _onRebuild();
        }
      } else {
        qInput.value = it.quantity;
      }
    });
    el.appendChild(d);
  });
  document.getElementById('holdingCount').textContent = items.length;
}

// ---------- Sector Allocation ----------
function renderSectorBars(items){
  const totals = {};
  items.forEach(i => totals[i.sector] = (totals[i.sector]||0) + i.weight);
  const arr = Object.entries(totals).sort((a,b)=>b[1]-a[1]);
  const el = document.getElementById('sectorBars');
  el.innerHTML = '';
  arr.forEach(([sec, w])=>{
    const c = SECTOR_DEF[sec].color;
    el.innerHTML += `
      <div class="sector-bar">
        <div class="sb-name">${sec}</div>
        <div class="sb-track"><div class="sb-fill" style="width:${(w*100).toFixed(0)}%; background:${c}; box-shadow:0 0 8px ${c}"></div></div>
        <div class="sb-pct">${(w*100).toFixed(1)}%</div>
      </div>
    `;
  });
}

// ---------- Risk Distribution ----------
function renderRiskDist(items){
  const buckets = [
    { lbl:'SAFE',     min:0,  max:30, c:'var(--safe)' },
    { lbl:'MODERATE', min:30, max:55, c:'var(--moderate)' },
    { lbl:'CAUTION',  min:55, max:75, c:'var(--caution)' },
    { lbl:'HIGH',     min:75, max:90, c:'var(--high)' },
    { lbl:'EXTREME',  min:90, max:101,c:'var(--extreme)' }
  ];
  const total = Math.max(items.length, 1);
  const el = document.getElementById('riskDist');
  el.innerHTML = '';
  buckets.forEach(b=>{
    const cnt = items.filter(i=>i.risk_score>=b.min && i.risk_score<b.max).length;
    const w = (cnt/total)*100;
    el.innerHTML += `
      <div class="sector-bar">
        <div class="sb-name" style="color:${b.c}">${b.lbl}</div>
        <div class="sb-track"><div class="sb-fill" style="width:${w}%; background:${b.c}"></div></div>
        <div class="sb-pct">${cnt}</div>
      </div>
    `;
  });
}

// ---------- Balance Card ----------
function renderBalance(B){
  document.getElementById('balanceScore').textContent = B.balance ?? '--';
  document.getElementById('balanceFill').style.width = (B.balance ?? 0) + '%';
  const g = balanceGrade(B.balance ?? 0);
  const grade = document.getElementById('balanceGrade');
  grade.textContent = g.txt;
  grade.style.color = g.color;
  document.getElementById('mDiverse').textContent = (B.diverse ?? '--') + ' / 100';
  document.getElementById('mDeviation').textContent = (B.deviation ?? '--') + ' / 100';
  document.getElementById('mSphericity').textContent = (B.sphericity ?? '--') + ' / 100';
  document.getElementById('mHHI').textContent = B.hhi ?? '--';

  const fill = document.getElementById('balanceFill');
  const score = document.getElementById('balanceScore');
  let g1, g2;
  if ((B.balance ?? 0) < 40){ g1='var(--high)'; g2='var(--extreme)'; }
  else if ((B.balance ?? 0) < 70){ g1='var(--caution)'; g2='var(--moderate)'; }
  else { g1='var(--safe)'; g2='var(--moderate)'; }
  fill.style.background = `linear-gradient(90deg, ${g1}, ${g2})`;
  score.style.background = `linear-gradient(90deg, ${g1}, ${g2})`;
  score.style.webkitBackgroundClip = 'text';
  score.style.webkitTextFillColor = 'transparent';
}

// ---------- Insights ----------
function renderInsights(insights){
  const el = document.getElementById('insights');
  el.innerHTML = '';
  insights.forEach(ins=>{
    el.innerHTML += `
      <div class="insight ${ins.level}">
        <div class="insight-title">${ins.title}</div>
        <div>${ins.body}</div>
      </div>
    `;
  });
}

// ---------- Selected Asset ----------
export function selectAssetUI(ticker, item){
  document.querySelectorAll('.holding').forEach(el=>{
    el.classList.toggle('active', el.dataset.ticker === ticker);
  });
  if (!item) return;
  document.getElementById('noSelect').style.display = 'none';
  const card = document.getElementById('stockDetail');
  card.classList.add('show');
  const c = riskColor(item.risk_score);
  document.getElementById('sdDot').style.background = c;
  document.getElementById('sdDot').style.color = c;
  document.getElementById('sdName').textContent = item.name;
  document.getElementById('sdTicker').textContent = item.ticker;
  const pill = document.getElementById('sdPill');
  pill.textContent = riskLabel(item.risk_score);
  pill.style.background = c+'25';
  pill.style.color = c;
  document.getElementById('sdQty').textContent = (item.quantity ?? 1).toLocaleString() + '주';
  document.getElementById('sdValue').textContent = Math.round(item.market_value || 0).toLocaleString();
  document.getElementById('sdWeight').textContent = (item.weight*100).toFixed(2) + '%';
  document.getElementById('sdSector').textContent = item.sector;
  document.getElementById('sdPrice').textContent = item.current_price.toLocaleString();
  document.getElementById('sdAvg').textContent = Math.round(item.avg_price).toLocaleString();
  const rt = document.getElementById('sdReturn');
  rt.textContent = (item.return_pct>=0?'+':'') + (item.return_pct*100).toFixed(2) + '%';
  rt.style.color = item.return_pct>=0 ? 'var(--safe)' : 'var(--high)';
  document.getElementById('sdVol').textContent = (item.volatility_30d*100).toFixed(1) + '%';
  document.getElementById('sdBeta').textContent = item.beta.toFixed(2);
  document.getElementById('sdDebt').textContent = (item.debt_ratio*100).toFixed(0) + '%';
  const r = document.getElementById('sdRisk');
  r.textContent = item.risk_score + ' / 100';
  r.style.color = c;
}

export function clearSelectionUI(){
  document.querySelectorAll('.holding').forEach(el => el.classList.remove('active'));
  document.getElementById('stockDetail').classList.remove('show');
  document.getElementById('noSelect').style.display = 'block';
}

// ---------- Portfolio Dropdown ----------
function renderPortfolioSelect(){
  const active = activePortfolio();
  document.getElementById('pfCurrentName').textContent = active.name;
  document.getElementById('pfCurrentMeta').textContent =
    active.holdings.length + ' ASSETS · ' + STATE.portfolios.length + '/' + MAX_PORTFOLIOS;

  const list = document.getElementById('pfList');
  list.innerHTML = '';
  STATE.portfolios.forEach(p=>{
    const item = document.createElement('div');
    item.className = 'pf-item' + (p.id === STATE.activeId ? ' active' : '');
    const date = new Date(p.updatedAt);
    const dateStr = `${date.getMonth()+1}/${date.getDate()}`;
    item.innerHTML = `
      <div class="pf-item-dot"></div>
      <div class="pf-item-info">
        <div class="pf-item-name">${escapeHtml(p.name)}</div>
        <div class="pf-item-meta">
          <span>${p.holdings.length}종목</span>
          <span>·</span>
          <span>업데이트 ${dateStr}</span>
        </div>
      </div>
      <span class="pf-item-count">${p.holdings.length}</span>
    `;
    item.addEventListener('click', ()=>{
      setActivePortfolio(p.id);
      closeDropdown();
      _onRebuild();
    });
    list.appendChild(item);
  });
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

function openDropdown(){
  document.getElementById('pfCurrent').classList.add('open');
  document.getElementById('pfList').classList.add('show');
}
function closeDropdown(){
  document.getElementById('pfCurrent').classList.remove('open');
  document.getElementById('pfList').classList.remove('show');
}

function bindPortfolioDropdown(){
  document.getElementById('pfCurrent').addEventListener('click', e=>{
    e.stopPropagation();
    const isOpen = document.getElementById('pfList').classList.contains('show');
    if (isOpen) closeDropdown(); else openDropdown();
  });
  document.addEventListener('click', e=>{
    if (!e.target.closest('#pfDropdown')) closeDropdown();
  });
}

function bindPortfolioButtons(){
  document.getElementById('pfNew').addEventListener('click', ()=>{
    if (STATE.portfolios.length >= MAX_PORTFOLIOS){
      alert(`포트폴리오는 최대 ${MAX_PORTFOLIOS}개까지 만들 수 있습니다.`);
      return;
    }
    openModal({
      title: '새 포트폴리오',
      desc: `포트폴리오 이름을 입력하세요. (${STATE.portfolios.length+1}/${MAX_PORTFOLIOS})`,
      placeholder: '예: 안정형 포트폴리오',
      initial: '포트폴리오 ' + (STATE.portfolios.length + 1),
      onOK: name => {
        createPortfolio(name);
        _onRebuild();
      }
    });
  });

  document.getElementById('pfRename').addEventListener('click', ()=>{
    const pf = activePortfolio();
    openModal({
      title: '이름 변경',
      desc: '포트폴리오 이름을 수정합니다.',
      placeholder: '포트폴리오 이름',
      initial: pf.name,
      onOK: name => {
        renamePortfolio(pf.id, name);
        renderPortfolioSelect();
      }
    });
  });

  document.getElementById('pfDelete').addEventListener('click', ()=>{
    if (STATE.portfolios.length <= 1){
      alert('마지막 포트폴리오는 삭제할 수 없습니다.');
      return;
    }
    const pf = activePortfolio();
    if (!confirm(`"${pf.name}" 포트폴리오를 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`)) return;
    deletePortfolio(pf.id);
    _onRebuild();
  });
}

// ---------- Search ----------
function bindSearch(){
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  function normalize(s){ return (s||'').toLowerCase().replace(/\s+/g,''); }

  function searchAssets(q){
    const nq = normalize(q);
    if (!nq) return [];
    const pf = activePortfolio();
    const owned = new Set(pf.holdings.map(h=>h.ticker));
    return ASSET_DB.filter(a => {
      const hay = normalize(a.name) + ' ' + normalize(a.ticker) + ' ' + normalize(a.alias);
      return hay.includes(nq);
    })
    .map(a => ({ ...a, _owned: owned.has(a.ticker) }))
    .sort((a,b) => {
      const aT = normalize(a.ticker).startsWith(nq) ? 0 : 1;
      const bT = normalize(b.ticker).startsWith(nq) ? 0 : 1;
      if (aT !== bT) return aT - bT;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 30);
  }

  function renderSearchResults(q){
    const results = searchAssets(q);
    if (!q){ searchResults.classList.remove('show'); return; }
    if (results.length === 0){
      searchResults.innerHTML = '<div class="sr-empty">검색 결과가 없습니다</div>';
      searchResults.classList.add('show');
      return;
    }
    searchResults.innerHTML = results.map(a => `
      <div class="search-result ${a._owned?'added':''}" data-ticker="${a.ticker}">
        <div class="sr-info">
          <div class="sr-name">${escapeHtml(a.name)}</div>
          <div class="sr-meta">
            <span>${a.ticker}</span>
            <span class="sr-tag sector">${a.sector}</span>
            ${a.is_etf ? '<span class="sr-tag etf">ETF</span>' : ''}
            ${a._owned ? '<span style="color:var(--safe)">✓ 추가됨</span>' : ''}
          </div>
        </div>
        <div style="font-size:11px; color:var(--text-2); font-variant-numeric:tabular-nums;">
          ${a.current_price.toLocaleString()}
        </div>
      </div>
    `).join('');
    searchResults.classList.add('show');
    searchResults.querySelectorAll('.search-result').forEach(el=>{
      if (el.classList.contains('added')) return;
      el.addEventListener('click', ()=>{
        const ticker = el.dataset.ticker;
        const ok = addHoldingToActive(ticker);
        if (ok){
          searchInput.value = '';
          searchResults.classList.remove('show');
          _onRebuild();
          // 추가 후 해당 행으로 스크롤 + 포커스
          setTimeout(()=>{
            const row = document.querySelector(`.holding[data-ticker="${ticker}"]`);
            if (row){
              row.scrollIntoView({ behavior:'smooth', block:'nearest' });
              const qty = row.querySelector('.qty-edit');
              if (qty){ qty.focus(); qty.select(); }
            }
          }, 100);
        }
      });
    });
  }

  searchInput.addEventListener('input', e => renderSearchResults(e.target.value));
  searchInput.addEventListener('focus', e => { if (e.target.value) renderSearchResults(e.target.value); });
  document.addEventListener('click', e=>{
    if (!e.target.closest('.search-wrap')) searchResults.classList.remove('show');
  });
}

// ---------- Modal ----------
let modalEl, modalTitleEl, modalDescEl, modalInputEl, _modalOnOK = null;

function bindModal(){
  modalEl = document.getElementById('modal');
  modalTitleEl = document.getElementById('modalTitle');
  modalDescEl = document.getElementById('modalDesc');
  modalInputEl = document.getElementById('modalInput');

  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalOK').addEventListener('click', ()=>{
    const v = modalInputEl.value.trim();
    if (_modalOnOK) _modalOnOK(v);
    closeModal();
  });
  modalInputEl.addEventListener('keydown', e=>{
    if (e.key === 'Enter') document.getElementById('modalOK').click();
    else if (e.key === 'Escape') closeModal();
  });
  modalEl.addEventListener('click', e=>{ if (e.target === modalEl) closeModal(); });
}

function openModal(opts){
  modalTitleEl.textContent = opts.title || '';
  modalDescEl.textContent = opts.desc || '';
  modalDescEl.style.whiteSpace = 'pre-line';
  modalInputEl.placeholder = opts.placeholder || '';
  modalInputEl.value = opts.initial || '';
  modalInputEl.type = opts.type || 'text';
  modalInputEl.min = opts.type === 'number' ? '1' : '';
  _modalOnOK = opts.onOK;
  modalEl.classList.add('show');
  setTimeout(()=>{ modalInputEl.focus(); modalInputEl.select(); }, 50);
}
function closeModal(){ modalEl.classList.remove('show'); _modalOnOK = null; }

// ---------- Info Tooltips ----------
const INFO = {
  balance: {
    title: '밸런스 지수 산출 공식',
    bodyFn: () => {
      const B = _latestBalance;
      const d = B.diverse ?? 0, e = B.deviation ?? 0, s = B.sphericity ?? 0;
      return `
        <div class="info-body">
          포트폴리오 전체의 균형 상태를 0~100점으로 표현. <strong>100점 = 완벽한 구형(최적 분산), 0점 = 극단적 쏠림</strong>입니다.
        </div>
        <div class="info-formula">밸런스 = 섹터분산 × 0.40<br>　　　　 + 리스크편차 × 0.35<br>　　　　 + 구형도 × 0.25</div>
        <div class="info-calc">
          <div><span>섹터 분산</span><span>${d} × 0.40 = <b>${(d*0.40).toFixed(1)}</b></span></div>
          <div><span>리스크 편차</span><span>${e} × 0.35 = <b>${(e*0.35).toFixed(1)}</b></span></div>
          <div><span>구형도</span><span>${s} × 0.25 = <b>${(s*0.25).toFixed(1)}</b></span></div>
          <div class="info-total"><span>합계 (현재)</span><span><b>${B.balance ?? 0}</b> / 100</span></div>
        </div>
      `;
    }
  },
  diverse: {
    title: '섹터 분산도',
    bodyFn: () => {
      const B = _latestBalance;
      const nSec = Object.keys(B.sectorWeights || {}).length;
      return `
        <div class="info-body">
          HHI(Herfindahl-Hirschman Index) 기반 섹터 집중도 점수. <strong>100점 = 모든 섹터 균등 분포 / 0점 = 한 섹터 100% 집중</strong>.
        </div>
        <div class="info-formula">HHI = Σ(섹터 비중²)<br>분산도 = (1 − HHI) / (1 − 1/섹터수) × 100</div>
        <div class="info-calc">
          <div><span>현재 HHI</span><span><b>${B.hhi ?? '0'}</b></span></div>
          <div><span>섹터 수</span><span><b>${nSec}개</b></span></div>
          <div class="info-total"><span>분산도 점수</span><span><b>${B.diverse ?? 0}</b> / 100</span></div>
        </div>
      `;
    }
  },
  deviation: {
    title: '리스크 편차 점수',
    bodyFn: () => `
      <div class="info-body">
        포트폴리오 내 종목들의 리스크 스코어 표준편차 기반. <strong>100점 = 모든 종목 비슷한 리스크 / 0점 = 극단적 편차</strong>.
        편차가 클수록 일부 종목이 전체 리스크를 좌우합니다.
      </div>
      <div class="info-formula">편차 점수 = (1 − σ/50) × 100<br>σ = 종목별 리스크 스코어의 표준편차</div>
      <div class="info-calc">
        <div class="info-total"><span>편차 점수</span><span><b>${_latestBalance.deviation ?? 0}</b> / 100</span></div>
      </div>
    `
  },
  sphericity: {
    title: '구형도 (Sphericity)',
    bodyFn: () => `
      <div class="info-body">
        모든 종목의 리스크 돌출(r값) 분포의 균일성. <strong>100점 = 모든 노드가 같은 거리로 돌출 / 0점 = 특정 종목만 심하게 돌출</strong>.
      </div>
      <div class="info-formula">구형도 = (1 − σ_r / 0.5) × 100<br>r = 1.0 + (risk_score / 100) × 0.5</div>
      <div class="info-calc">
        <div class="info-total"><span>구형도 점수</span><span><b>${_latestBalance.sphericity ?? 0}</b> / 100</span></div>
      </div>
    `
  },
  hhi: {
    title: 'HHI 집중도',
    bodyFn: () => `
      <div class="info-body">
        Herfindahl-Hirschman Index. 섹터별 비중을 제곱해서 모두 합한 값. 미국 법무부가 시장 집중도 평가에 쓰는 지표를 차용했습니다.
        <strong>0에 가까울수록 분산, 1에 가까울수록 집중</strong>.
      </div>
      <div class="info-formula">HHI = Σ(섹터 비중²)</div>
      <div class="info-thresholds">
        <div><span style="color:var(--safe);">&lt; 0.15</span> 분산 양호</div>
        <div><span style="color:var(--moderate);">0.15 – 0.25</span> 보통</div>
        <div><span style="color:var(--caution);">0.25 – 0.45</span> 집중 주의</div>
        <div><span style="color:var(--high);">&gt; 0.45</span> 심각한 편중</div>
      </div>
      <div class="info-calc">
        <div class="info-total"><span>현재 HHI</span><span><b>${_latestBalance.hhi ?? '0'}</b></span></div>
      </div>
    `
  },
  riskScore: {
    title: '평균 리스크 스코어',
    bodyFn: () => `
      <div class="info-body">
        포트폴리오 내 모든 종목의 평균 리스크 점수 (0~100). 각 종목의 리스크는 5개 요소의 가중합으로 산출됩니다.
      </div>
      <div class="info-formula">리스크 = 변동성 × 0.35<br>　　　　+ 베타 × 0.25<br>　　　　+ 부채비율 × 0.20<br>　　　　+ 유동성 역수 × 0.10<br>　　　　+ 섹터 기본값 × 0.10</div>
      <div class="info-thresholds">
        <div><span style="color:var(--safe);">0–29</span> 🟢 SAFE</div>
        <div><span style="color:var(--moderate);">30–54</span> 🔵 MODERATE</div>
        <div><span style="color:var(--caution);">55–74</span> 🟡 CAUTION</div>
        <div><span style="color:var(--high);">75–89</span> 🔴 HIGH</div>
        <div><span style="color:var(--extreme);">90–100</span> 🟣 EXTREME</div>
      </div>
      <div class="info-calc">
        <div class="info-total"><span>현재 평균</span><span><b>${_latestBalance.avgRisk ?? 0}</b> / 100</span></div>
      </div>
    `
  }
};

let infoTooltipEl;
function bindInfoTooltips(){
  infoTooltipEl = document.createElement('div');
  infoTooltipEl.className = 'info-tooltip';
  document.body.appendChild(infoTooltipEl);

  document.body.addEventListener('mouseover', e=>{
    const t = e.target.closest && e.target.closest('.info-icon');
    if (t) showInfo(t, t.dataset.info);
  });
  document.body.addEventListener('mouseout', e=>{
    const t = e.target.closest && e.target.closest('.info-icon');
    if (t){
      const into = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.info-icon');
      if (into !== t) hideInfo();
    }
  });
}

function showInfo(targetEl, key){
  const cfg = INFO[key];
  if (!cfg) return;
  infoTooltipEl.innerHTML = `<div class="info-title">${cfg.title}</div>${cfg.bodyFn()}`;
  infoTooltipEl.classList.add('show');
  const rect = targetEl.getBoundingClientRect();
  infoTooltipEl.style.left = '0px';
  infoTooltipEl.style.top = '0px';
  const tipRect = infoTooltipEl.getBoundingClientRect();
  let left = rect.left;
  let top = rect.bottom + 8;
  if (left + tipRect.width > window.innerWidth - 12) left = window.innerWidth - tipRect.width - 12;
  if (left < 12) left = 12;
  if (top + tipRect.height > window.innerHeight - 12) top = rect.top - tipRect.height - 8;
  infoTooltipEl.style.left = left + 'px';
  infoTooltipEl.style.top = top + 'px';
}
function hideInfo(){ infoTooltipEl.classList.remove('show'); }

// ---------- Utils ----------
function updateClock(){
  const d = new Date();
  document.getElementById('updateTime').textContent =
    d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
