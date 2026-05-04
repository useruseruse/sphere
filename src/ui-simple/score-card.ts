// @ts-nocheck
/* =========================================================
   SPHERE Simple — 점수 카드
   큰 숫자 + 등급 + 진행 바
   ========================================================= */

import { RUNTIME } from '../runtime.js';
import { balanceGrade } from '../core/pipeline.js';

export function renderScoreCard(){
  const score = RUNTIME.BALANCE.balance ?? 0;
  const empty = !RUNTIME.ITEMS.length;

  const num = document.getElementById('balanceScore');
  const grade = document.getElementById('balanceGrade');
  const fill = document.getElementById('balanceFill');

  if (empty){
    if (num) num.textContent = '--';
    if (grade) grade.textContent = '아직 종목이 없어요';
    if (fill) fill.style.width = '0%';
    return;
  }

  if (num) num.textContent = String(score);
  if (fill){
    fill.style.width = score + '%';
    if (score < 40) fill.style.background = 'linear-gradient(90deg, var(--high), var(--extreme))';
    else if (score < 70) fill.style.background = 'linear-gradient(90deg, var(--caution), var(--moderate))';
    else fill.style.background = 'linear-gradient(90deg, var(--safe), var(--moderate))';
  }
  if (grade){
    const g = balanceGrade(score);
    grade.textContent = g.txt;
    grade.style.color = g.color;
  }
  if (num){
    if (score < 40) num.style.color = 'var(--high)';
    else if (score < 70) num.style.color = 'var(--caution)';
    else num.style.color = 'var(--safe)';
  }
}
