/* =========================================================
   insights-react — RUNTIME.INSIGHTS 를 React 리스트로 렌더
   - body 텍스트는 i18n interpolation 결과 HTML 포함 → dangerouslySetInnerHTML
   - 외부 (renderInsights) 가 강제 재렌더를 트리거할 수 있도록 모듈 트리거 노출
   ========================================================= */

import { useEffect, useState } from 'react';
import { RUNTIME } from '../../runtime';

/** 모듈-스코프 강제 재렌더 트리거. ensureMount 후 InsightsList 가 등록. */
export let triggerRerender: (() => void) | null = null;

export function InsightsList() {
  const [, force] = useState(0);

  useEffect(() => {
    triggerRerender = () => force((t) => t + 1);
    return () => {
      triggerRerender = null;
    };
  }, []);

  if (!RUNTIME.INSIGHTS || RUNTIME.INSIGHTS.length === 0) return null;

  return (
    <>
      {RUNTIME.INSIGHTS.map((ins, i) => (
        <div key={i} className={`insight ${ins.level}`}>
          <div className="insight-title">{ins.title}</div>
          <div dangerouslySetInnerHTML={{ __html: ins.body }} />
        </div>
      ))}
    </>
  );
}
