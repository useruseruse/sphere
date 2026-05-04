// @ts-nocheck
/* =========================================================
   SPHERE — 인사이트 패널 + 상단 알림 배너
   ========================================================= */

import { RUNTIME } from '../runtime.js';

export function renderInsights(){
  const el = document.getElementById('insights');
  if (!el) return;
  el.innerHTML = '';
  RUNTIME.INSIGHTS.forEach(ins => {
    el.innerHTML += `
      <div class="insight ${ins.level}">
        <div class="insight-title">${ins.title}</div>
        <div>${ins.body}</div>
      </div>
    `;
  });
  // 알림 배너 (가장 심각한 인사이트)
  const top = RUNTIME.INSIGHTS.find(i => i.level === 'alert') || RUNTIME.INSIGHTS.find(i => i.level === 'warn');
  if (top){
    document.getElementById('alertBanner')?.classList.add('show');
    const txt = document.getElementById('alertText');
    if (txt) txt.textContent = top.title.replace(/[⚠✓]/g, '').trim();
  }
}

/** 포트폴리오 변경 시 배너 초기화 */
export function clearAlert(){
  document.getElementById('alertBanner')?.classList.remove('show');
}
