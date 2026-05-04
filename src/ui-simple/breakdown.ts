// @ts-nocheck
/* =========================================================
   SPHERE Simple — 점수 풀이
   diverse / deviation / sphericity 3개 컴포넌트를
   친근한 한두 줄 한국어/영어로 풀어줌
   ========================================================= */

import { CURRENT_LANG } from '../i18n.js';
import { RUNTIME } from '../runtime.js';

interface Bullet {
  emoji: string;
  text: string;
  /** 'good' | 'okay' | 'warn' — 색조 */
  tone: 'good' | 'okay' | 'warn';
}

function diverseBullet(score: number): Bullet {
  const isKO = CURRENT_LANG !== 'en';
  if (score >= 70) return { emoji: '✨', tone: 'good',
    text: isKO
      ? `여러 분야에 잘 나뉘어 있어요 (분산 점수 ${score}점)`
      : `Spread across many sectors (diversity score: ${score})` };
  if (score >= 40) return { emoji: '👍', tone: 'okay',
    text: isKO
      ? `분야가 어느 정도 분산돼있어요 (분산 점수 ${score}점)`
      : `Decently spread (diversity score: ${score})` };
  return { emoji: '⚠️', tone: 'warn',
    text: isKO
      ? `한두 분야에 몰려있어요 (분산 점수 ${score}점) — 다른 분야 종목을 더해보세요`
      : `Concentrated in 1-2 sectors (${score}) — try adding other sectors` };
}

function deviationBullet(score: number): Bullet {
  const isKO = CURRENT_LANG !== 'en';
  if (score >= 70) return { emoji: '⚖️', tone: 'good',
    text: isKO
      ? `종목별 위험도가 비슷해서 균형 좋아요 (편차 점수 ${score}점)`
      : `Risk levels are well-balanced across stocks (${score})` };
  if (score >= 40) return { emoji: '🤝', tone: 'okay',
    text: isKO
      ? `종목별 위험도 차이가 좀 있어요 (편차 점수 ${score}점)`
      : `Some risk variance between stocks (${score})` };
  return { emoji: '⚠️', tone: 'warn',
    text: isKO
      ? `한두 종목이 전체 위험을 좌우해요 (편차 점수 ${score}점)`
      : `1-2 stocks dominate the portfolio risk (${score})` };
}

function sphericityBullet(score: number): Bullet {
  const isKO = CURRENT_LANG !== 'en';
  if (score >= 70) return { emoji: '🌐', tone: 'good',
    text: isKO
      ? `구체 모양이 매끈해요 — 튀어나온 종목 거의 없음 (구형도 ${score}점)`
      : `Sphere shape is smooth — few outliers (sphericity ${score})` };
  if (score >= 40) return { emoji: '⚪️', tone: 'okay',
    text: isKO
      ? `약간 튀어나온 종목이 있어요 (구형도 ${score}점)`
      : `Some protruding (high-risk) stocks (sphericity ${score})` };
  return { emoji: '⚠️', tone: 'warn',
    text: isKO
      ? `심하게 튀어나온 위험 종목이 있어요 (구형도 ${score}점)`
      : `Strong outliers with high risk (sphericity ${score})` };
}

export function renderBreakdown(){
  const card = document.getElementById('sBreakdownCard');
  const list = document.getElementById('sBreakdownList');
  if (!card || !list) return;

  if (!RUNTIME.ITEMS.length){
    card.style.display = 'none';
    return;
  }
  card.style.display = '';

  const B = RUNTIME.BALANCE;
  const bullets: Bullet[] = [
    diverseBullet(B.diverse ?? 0),
    deviationBullet(B.deviation ?? 0),
    sphericityBullet(B.sphericity ?? 0),
  ];
  list.innerHTML = bullets.map(b => `
    <li class="s-breakdown-item s-bd-${b.tone}">
      <span class="s-bd-emoji">${b.emoji}</span>
      <span class="s-bd-text">${b.text}</span>
    </li>
  `).join('');
}
