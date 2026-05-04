/* =========================================================
   SPHERE — UI 포맷 헬퍼 (여러 패널에서 공유)
   ========================================================= */

import { formatKRWUnit } from '../i18n.js';

export function fmtSignedNum(v: number, digits = 2): string {
  const sign = v >= 0 ? '+' : '';
  return sign + v.toFixed(digits);
}

export function fmtMoneySigned(v: number): string {
  const sign = v < 0 ? '-' : (v > 0 ? '+' : '');
  return sign + Math.round(Math.abs(v)).toLocaleString();
}

export function fmtMoneyKR(v: number): string {
  return formatKRWUnit(Math.abs(v));
}

export type GradeLevel = 'safe' | 'moderate' | 'caution' | 'high' | 'extreme';

export function gradeBadge(label: string, level: GradeLevel): string {
  return `<span class="rm-badge ${level}">${label}</span>`;
}

/** 4-칸 dot 시각화 (안전 4 / 위험 0) */
export function gradeDots(level: GradeLevel): string {
  const fillCount = ({ safe: 4, moderate: 3, caution: 2, high: 1, extreme: 0 } as Record<GradeLevel, number>)[level] ?? 0;
  let html = '';
  for (let i = 0; i < 4; i++){
    html += `<span class="rm-dot ${i < fillCount ? level : ''}"></span>`;
  }
  return `<span class="rm-dots">${html}</span>`;
}
