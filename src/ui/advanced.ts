// @ts-nocheck
/* =========================================================
   SPHERE — Advanced metrics 패널
   VaR / CVaR / Sharpe / Sortino / DR / 변동성 / 배당
   각 지표마다 등급 뱃지 + 한국어/영문 hint 텍스트
   ========================================================= */

import { CURRENT_LANG, t, formatKRWUnit } from '../i18n.js';
import { RUNTIME } from '../runtime.js';
import { gradeBadge } from './format.js';

export function renderAdvanced(){
  const A = RUNTIME.ADVANCED || {};
  const empty = !RUNTIME.ITEMS.length;
  const isKO = CURRENT_LANG !== 'en';

  const setRow = (id, val, hint, gradeId, badge, valIsHTML) => {
    const valEl = document.getElementById(id);
    const hintEl = document.getElementById(id + 'Hint');
    const gradeEl = gradeId ? document.getElementById(gradeId) : null;
    if (valEl) {
      if (valIsHTML) valEl.innerHTML = val;
      else valEl.textContent = val;
    }
    if (hintEl) hintEl.textContent = hint || '';
    if (gradeEl) gradeEl.innerHTML = badge || '';
  };

  if (empty){
    ['mVaR','mCVaR','mSharpe','mSortino','mDR','mPortVol','mDividend'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '--';
      const hint = document.getElementById(id + 'Hint');
      if (hint) hint.textContent = t('addHoldingsShort');
    });
    ['mVaRGrade','mSharpeGrade','mSortinoGrade','mDRGrade','mPortVolGrade'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
    return;
  }

  const totalValue = A.totalValue || 0;

  // KR 보조 단위는 작고 흐리게 분리 표시
  const krSpan = (amt) => (isKO && amt >= 10000) ? ` <span class="rm-sub">${formatKRWUnit(amt)}</span>` : '';

  // ── 1. VaR — 1일 최대 손실 (95%) ──
  const var95 = A.var95 || 0;
  const varPct = totalValue > 0 ? var95 / totalValue : 0;
  const varAmt = Math.round(var95);
  const varGrade = varPct < 0.015 ? 'safe' : varPct < 0.025 ? 'moderate' : varPct < 0.04 ? 'caution' : 'high';
  const varHint = isKO
    ? `20거래일 중 19일은 손실이 이 금액보다 적거나 오히려 이익. 1일 정도는 이보다 더 잃을 수 있음.`
    : `On 19 of every 20 trading days, losses stay below this. But ~1 day in 20 will be worse.`;
  setRow('mVaR', '−' + varAmt.toLocaleString() + krSpan(varAmt), varHint, 'mVaRGrade',
    gradeBadge(isKO ? ({safe:'안정', moderate:'보통', caution:'주의', high:'위험'}[varGrade]) :
                       ({safe:'STABLE', moderate:'NORMAL', caution:'CAUTION', high:'RISKY'}[varGrade]), varGrade), true);

  // ── 2. CVaR — 최악 5% 평균 손실 ──
  const cvar95 = A.cvar95 || 0;
  const cvarAmt = Math.round(cvar95);
  const cvarHint = isKO
    ? `정말 안 좋은 날(20일 중 가장 안 좋은 1일)에는 평균 ${cvarAmt.toLocaleString()}원 정도 잃을 수 있어요.`
    : `On the very worst day out of 20, you'd lose around ${cvarAmt.toLocaleString()} on average.`;
  setRow('mCVaR', '−' + cvarAmt.toLocaleString() + krSpan(cvarAmt), cvarHint, null, '', true);

  // ── 3. Sharpe — 위험 대비 수익 효율 ──
  const sharpe = A.sharpe || 0;
  const sharpeGrade = sharpe > 1 ? 'safe' : sharpe > 0.5 ? 'moderate' : sharpe > 0 ? 'caution' : 'high';
  const sharpeHint = isKO
    ? (sharpe > 1 ? `값이 클수록 좋아요. 1보다 크면 위험을 감수한 보람이 충분히 있는 수준이에요.` :
       sharpe > 0.5 ? `값이 클수록 좋아요. 0.5~1은 평균적인 수준 — 무난해요.` :
       sharpe > 0  ? `값이 작아요. 위험을 감수한 만큼 충분히 벌고 있지 못해요.` :
                     `값이 0보다 작아요. 차라리 적금이 나을 수 있는 상태예요.`)
    : (sharpe > 1 ? `Higher is better. Above 1 means good payoff for the risk.` :
       sharpe > 0.5 ? `Higher is better. 0.5–1.0 is average.` :
       sharpe > 0  ? `Low — return doesn't justify the risk well.` :
                     `Below 0 — a savings account would do better.`);
  const sharpeBadge = isKO
    ? ({safe:'⭐ 우수', moderate:'⭐ 양호', caution:'△ 부족', high:'✕ 비효율'}[sharpeGrade])
    : ({safe:'⭐ STRONG', moderate:'⭐ OK', caution:'△ WEAK', high:'✕ POOR'}[sharpeGrade]);
  setRow('mSharpe', sharpe.toFixed(2), sharpeHint, 'mSharpeGrade', gradeBadge(sharpeBadge, sharpeGrade));

  // ── 4. Sortino — 하락 위험만 따진 효율 ──
  const sortino = A.sortino || 0;
  const sortinoGrade = sortino > 2 ? 'safe' : sortino > 1 ? 'moderate' : sortino > 0 ? 'caution' : 'high';
  const sortinoHint = isKO
    ? (sortino > 2 ? '값이 클수록 좋아요. 떨어질 위험만 따져도 수익이 매우 좋은 편이에요.' :
       sortino > 1 ? '값이 클수록 좋아요. 1을 넘으면 하락 위험에 비해 수익이 괜찮은 편.' :
       sortino > 0 ? '값이 작아요. 떨어질 위험에 비해 버는 게 적어요.' :
                    '값이 0보다 작아요. 손실 위험에 비해 수익이 부족해요.')
    : (sortino > 2 ? 'Higher is better. Strong even when only counting drops.' :
       sortino > 1 ? 'Higher is better. Above 1 = decent for downside risk.' :
       sortino > 0 ? 'Low for the downside risk taken.' :
                    'Below 0 — losing more than the downside risk justifies.');
  const sortinoBadge = isKO
    ? ({safe:'⭐ 우수', moderate:'⭐ 양호', caution:'△ 부족', high:'✕ 비효율'}[sortinoGrade])
    : ({safe:'⭐ STRONG', moderate:'⭐ OK', caution:'△ WEAK', high:'✕ POOR'}[sortinoGrade]);
  setRow('mSortino', sortino.toFixed(2), sortinoHint, 'mSortinoGrade', gradeBadge(sortinoBadge, sortinoGrade));

  // ── 5. 분산효과 (Diversification Ratio) ──
  const reduction = (A.riskReduction || 0) * 100;
  const drGrade = reduction > 25 ? 'safe' : reduction > 12 ? 'moderate' : reduction > 5 ? 'caution' : 'high';
  const drHint = isKO
    ? `종목들을 따로 들 때보다 합쳐 들면 위험이 ${reduction.toFixed(1)}% 줄어듦. ${
        drGrade === 'safe' ? '분산투자 잘 작동 중.' :
        drGrade === 'moderate' ? '분산은 되고 있음.' :
        drGrade === 'caution' ? '비슷한 종목들이 많음.' :
                                 '거의 한 곳에 몰려있음.'}`
    : `Risk is ${reduction.toFixed(1)}% lower than holding each stock alone. ${
        drGrade === 'safe' ? 'Excellent diversification.' :
        drGrade === 'moderate' ? 'OK diversification.' :
        drGrade === 'caution' ? 'Holdings are too similar.' :
                                 'Highly concentrated.'}`;
  const drBadge = isKO
    ? ({safe:'⭐ 잘 분산됨', moderate:'⭐ 양호', caution:'△ 보통', high:'✕ 편중'}[drGrade])
    : ({safe:'⭐ DIVERSIFIED', moderate:'⭐ OK', caution:'△ FAIR', high:'✕ CONCENTRATED'}[drGrade]);
  setRow('mDR', `${reduction.toFixed(1)}%↓`, drHint, 'mDRGrade', gradeBadge(drBadge, drGrade));

  // ── 6. 변동성 — 연 σ ──
  const volPct = (A.portVol || 0) * 100;
  const volGrade = volPct < 15 ? 'safe' : volPct < 25 ? 'moderate' : volPct < 35 ? 'caution' : 'high';
  const volHint = isKO
    ? (volPct < 15 ? '주가가 잔잔. 채권 같은 안정형.' :
       volPct < 25 ? '시장 평균 수준의 흔들림.' :
       volPct < 35 ? '꽤 출렁임. 성장주 비중 큼.' :
                    '매우 격렬. 단기 손실 클 수 있음.')
    : (volPct < 15 ? 'Calm — bond-like.' :
       volPct < 25 ? 'Average market volatility.' :
       volPct < 35 ? 'Choppy — growth-heavy.' :
                    'Wild — large short-term swings possible.');
  const volBadge = isKO
    ? ({safe:'잔잔', moderate:'보통', caution:'들썩', high:'격렬'}[volGrade])
    : ({safe:'CALM', moderate:'NORMAL', caution:'CHOPPY', high:'WILD'}[volGrade]);
  setRow('mPortVol', `${volPct.toFixed(1)}%`, volHint, 'mPortVolGrade', gradeBadge(volBadge, volGrade));

  // ── 7. 배당 ──
  const divRow = document.getElementById('dividendRow');
  if (divRow){
    if (A.annualDividend > 0){
      divRow.style.display = '';
      const yieldPct = (A.dividendYieldPort || 0) * 100;
      const annual = Math.round(A.annualDividend);
      const monthly = Math.round(annual / 12);
      const divHint = isKO
        ? `연 ${yieldPct.toFixed(2)}% 배당. 월 평균 약 ${monthly.toLocaleString()}원 입금 추정.`
        : `${yieldPct.toFixed(2)}% annual yield. About ${monthly.toLocaleString()}/month estimated.`;
      setRow('mDividend', `+${annual.toLocaleString()}${krSpan(annual)}`, divHint, null, '', true);
    } else {
      divRow.style.display = 'none';
    }
  }
}
