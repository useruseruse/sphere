// @ts-nocheck
/* =========================================================
   SPHERE Simple — "가장 먼저 할 일" 한 줄
   여러 인사이트 중 가장 심각한 것 하나만 친근하게 풀어서 표시
   ========================================================= */

import { CURRENT_LANG } from '../i18n.js';
import { RUNTIME } from '../runtime.js';

interface TipContent {
  emoji: string;
  title: string;
  text: string;
}

function pickInsightLevel(level: string): number {
  return level === 'alert' ? 3 : level === 'warn' ? 2 : level === 'ok' ? 1 : 0;
}

function tipFromInsight(): TipContent {
  if (!RUNTIME.ITEMS.length){
    return CURRENT_LANG === 'en'
      ? { emoji: '🌱', title: 'Start with one stock', text: 'Add a stock above to see your portfolio score.' }
      : { emoji: '🌱', title: '첫 종목을 추가해보세요', text: '위 검색창에서 좋아하는 종목을 하나 추가하면 점수가 나타나요.' };
  }
  // 가장 심각한 인사이트 1개만
  const sorted = [...RUNTIME.INSIGHTS].sort((a, b) => pickInsightLevel(b.level) - pickInsightLevel(a.level));
  const top = sorted[0];
  if (!top) return defaultTip();
  return {
    emoji: top.level === 'alert' ? '⚠️' : top.level === 'warn' ? '🔔' : '✨',
    title: top.title.replace(/[⚠✓]/g, '').trim(),
    text: top.body,
  };
}

function defaultTip(): TipContent {
  return CURRENT_LANG === 'en'
    ? { emoji: '✨', title: 'Looking good', text: 'Your portfolio looks balanced. Keep an eye on it monthly.' }
    : { emoji: '✨', title: '좋아요!', text: '포트폴리오가 잘 분산돼있어요. 월 1회 정도 점검만 해주세요.' };
}

export function renderTopTip(){
  const t = tipFromInsight();
  const e = document.getElementById('sTipEmoji');
  const ti = document.getElementById('sTipTitle');
  const tx = document.getElementById('sTipText');
  if (e) e.textContent = t.emoji;
  if (ti) ti.textContent = t.title;
  if (tx) tx.innerHTML = t.text;  // body 에 <b> 등 i18n 인터폴레이션 포함될 수 있음
}
