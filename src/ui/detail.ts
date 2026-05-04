// @ts-nocheck
/* =========================================================
   SPHERE — 우측 종목 상세 패널 (선택된 노드)
   ========================================================= */

import { getName, sectorLabel } from '../i18n.js';
import { riskColor, riskLabel } from '../core/pipeline.js';

export function renderStockDetail(it){
  if (!it) return;
  document.getElementById('noSelect').style.display = 'none';
  const card = document.getElementById('stockDetail');
  card.classList.add('show');

  const c = riskColor(it.risk_score);
  document.getElementById('sdDot').style.background = c;
  document.getElementById('sdDot').style.color = c;
  document.getElementById('sdName').textContent = getName(it);
  document.getElementById('sdTicker').textContent = it.ticker;

  const pill = document.getElementById('sdPill');
  pill.textContent = riskLabel(it.risk_score);
  pill.style.background = c + '25';
  pill.style.color = c;

  document.getElementById('sdQty').textContent = (it.quantity ?? 1).toLocaleString() + '주';
  document.getElementById('sdValue').textContent = Math.round(it.market_value || 0).toLocaleString();
  document.getElementById('sdWeight').textContent = (it.weight * 100).toFixed(2) + '%';
  document.getElementById('sdSector').textContent = sectorLabel(it.sector);
  document.getElementById('sdPrice').textContent = it.current_price.toLocaleString();
  document.getElementById('sdAvg').textContent = Math.round(it.avg_price).toLocaleString();

  const rt = document.getElementById('sdReturn');
  rt.textContent = (it.return_pct >= 0 ? '+' : '') + (it.return_pct * 100).toFixed(2) + '%';
  rt.style.color = it.return_pct >= 0 ? 'var(--safe)' : 'var(--high)';

  document.getElementById('sdVol').textContent = (it.volatility_30d * 100).toFixed(1) + '%';
  document.getElementById('sdBeta').textContent = it.beta.toFixed(2);
  document.getElementById('sdDebt').textContent = (it.debt_ratio * 100).toFixed(0) + '%';

  const r = document.getElementById('sdRisk');
  r.textContent = it.risk_score + ' / 100';
  r.style.color = c;
}
