// @ts-nocheck
/* =========================================================
   SPHERE — Balance / Sector / Risk distribution 렌더링
   ========================================================= */

import { sectorLabel, t } from '../i18n.js';
import { SECTOR_DEF, balanceGrade } from '../core/pipeline.js';
import { RUNTIME } from '../runtime.js';

export function renderSectorBars(){
  const items = RUNTIME.ITEMS;
  const totals = {};
  items.forEach(i => totals[i.sector] = (totals[i.sector] || 0) + i.weight);
  const arr = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const el = document.getElementById('sectorBars');
  el.innerHTML = '';
  arr.forEach(([sec, w]) => {
    const c = SECTOR_DEF[sec].color;
    el.innerHTML += `
      <div class="sector-bar">
        <div class="sb-name">${sectorLabel(sec)}</div>
        <div class="sb-track"><div class="sb-fill" style="width:${(w * 100).toFixed(0)}%; background:${c}; box-shadow:0 0 8px ${c}"></div></div>
        <div class="sb-pct">${(w * 100).toFixed(1)}%</div>
      </div>
    `;
  });
}

export function renderRiskDist(){
  const items = RUNTIME.ITEMS;
  const buckets = [
    { lbl: t('riskSafe'),     min: 0,  max: 30,  c:'var(--safe)' },
    { lbl: t('riskModerate'), min: 30, max: 55,  c:'var(--moderate)' },
    { lbl: t('riskCaution'),  min: 55, max: 75,  c:'var(--caution)' },
    { lbl: t('riskHigh'),     min: 75, max: 90,  c:'var(--high)' },
    { lbl: t('riskExtreme'),  min: 90, max: 101, c:'var(--extreme)' }
  ];
  const total = items.length;
  const el = document.getElementById('riskDist');
  el.innerHTML = '';
  buckets.forEach(b => {
    const cnt = items.filter(i => i.risk_score >= b.min && i.risk_score < b.max).length;
    const w = total > 0 ? (cnt / total) * 100 : 0;
    el.innerHTML += `
      <div class="sector-bar">
        <div class="sb-name" style="color:${b.c}">${b.lbl}</div>
        <div class="sb-track"><div class="sb-fill" style="width:${w}%; background:${b.c}"></div></div>
        <div class="sb-pct">${cnt}</div>
      </div>
    `;
  });
}

export function renderBalance(){
  const B = RUNTIME.BALANCE;
  document.getElementById('balanceScore').textContent = B.balance;
  document.getElementById('balanceFill').style.width = B.balance + '%';
  const g = balanceGrade(B.balance);
  const grade = document.getElementById('balanceGrade');
  grade.textContent = g.txt;
  grade.style.color = g.color;
  document.getElementById('mDiverse').textContent = B.diverse + ' / 100';
  document.getElementById('mDeviation').textContent = B.deviation + ' / 100';
  document.getElementById('mSphericity').textContent = B.sphericity + ' / 100';
  document.getElementById('mHHI').textContent = B.hhi;
  document.getElementById('avgRiskBig').textContent = B.avgRisk;
  document.getElementById('sphericity').textContent = B.sphericity;

  // 밸런스 색상
  const fill = document.getElementById('balanceFill');
  if (B.balance < 40) fill.style.background = 'linear-gradient(90deg, var(--high), var(--extreme))';
  else if (B.balance < 70) fill.style.background = 'linear-gradient(90deg, var(--caution), var(--moderate))';
  else fill.style.background = 'linear-gradient(90deg, var(--safe), var(--moderate))';

  // 큰 숫자 색
  const score = document.getElementById('balanceScore');
  if (B.balance < 40) score.style.background = 'linear-gradient(90deg, var(--high), var(--extreme))';
  else if (B.balance < 70) score.style.background = 'linear-gradient(90deg, var(--caution), var(--moderate))';
  else score.style.background = 'linear-gradient(90deg, var(--safe), var(--moderate))';
  score.style.webkitBackgroundClip = 'text';
  score.style.webkitTextFillColor = 'transparent';
}
