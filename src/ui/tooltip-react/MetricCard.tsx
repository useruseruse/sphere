/* =========================================================
   tooltip-react — Generic MetricCard
   - 14개 메트릭이 공통으로 쓰는 레이아웃
     header? · desc · formula? · thresholds? · calc rows · footer? · meta
   - HTML 문자열 필드(desc/formula/ref) 는 우리가 직접 작성한 정적 마크업
     이라 dangerouslySetInnerHTML 로 단순 출력. 동적 사용자 입력 없음.
   ========================================================= */

import type { ReactNode } from 'react';
import type { MetricThreshold } from './data';

export interface CalcRow {
  label: ReactNode;
  value: ReactNode;
  isTotal?: boolean;
  muted?: boolean;
}

interface Props {
  desc?: string;
  formula?: string;
  thresholds?: MetricThreshold[];
  rows?: CalcRow[];
  meta?: string;
  header?: ReactNode;
  footer?: ReactNode;
}

export function MetricCard({ desc, formula, thresholds, rows, meta, header, footer }: Props) {
  return (
    <>
      {header}
      {desc && <div className="info-body" dangerouslySetInnerHTML={{ __html: desc }} />}
      {formula && <div className="info-formula" dangerouslySetInnerHTML={{ __html: formula }} />}
      {thresholds && thresholds.length > 0 && (
        <div className="info-thresholds">
          {thresholds.map((t, i) => (
            <div key={i}>
              <span style={{ color: `var(--${t.tone})` }}>{t.range}</span> {t.label}
            </div>
          ))}
        </div>
      )}
      {rows && rows.length > 0 && (
        <div className="info-calc">
          {rows.map((r, i) => (
            <div
              key={i}
              className={r.isTotal ? 'info-total' : ''}
              style={r.muted ? { opacity: 0.4 } : undefined}
            >
              <span>{r.label}</span>
              <span>{r.value}</span>
            </div>
          ))}
        </div>
      )}
      {footer}
      {meta && <div className="info-meta" dangerouslySetInnerHTML={{ __html: meta }} />}
    </>
  );
}
