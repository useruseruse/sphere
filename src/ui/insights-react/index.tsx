/* =========================================================
   insights-react — install + 외부 호환 API
   - 기존 main.ts 가 import 하던 renderInsights / clearAlert 시그니처 유지
   - #insights DOM 안에서 React root 1개 lazy-mount
   - alert banner 토글은 그대로 imperative — React 가 감쌀 가치 없음
   ========================================================= */

import { createRoot, type Root } from 'react-dom/client';
import { RUNTIME } from '../../runtime';
import { InsightsList, triggerRerender } from './InsightsList';

let root: Root | null = null;

function ensureMount(): void {
  if (root) return;
  const host = document.getElementById('insights');
  if (!host) return;
  root = createRoot(host);
  root.render(<InsightsList />);
}

/** 외부 호출 — 인사이트 재렌더 + 알림 배너 갱신 */
export function renderInsights(): void {
  ensureMount();
  // React 트리는 useEffect 가 다음 마이크로태스크에 등록 → 첫 호출은 InsightsList 자체가 mount 시 RUNTIME 읽음.
  // 이후 호출들은 트리거로 강제 재렌더.
  triggerRerender?.();

  // 알림 배너 — 기존 동작 유지 (imperative)
  const top =
    RUNTIME.INSIGHTS.find((i) => i.level === 'alert') ||
    RUNTIME.INSIGHTS.find((i) => i.level === 'warn');
  if (top) {
    document.getElementById('alertBanner')?.classList.add('show');
    const txt = document.getElementById('alertText');
    if (txt) txt.textContent = top.title.replace(/[⚠✓]/g, '').trim();
  }
}

/** 포트폴리오 변경 시 배너 초기화 */
export function clearAlert(): void {
  document.getElementById('alertBanner')?.classList.remove('show');
}
