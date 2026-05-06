/* =========================================================
   toast-react — install + 외부 호환 API
   - 기존 showToast(message, kind) 시그니처 그대로 유지 (드롭인)
   - lazy mount: 첫 호출 시 ToastContainer 가 body 끝에 마운트
   ========================================================= */

import { createRoot } from 'react-dom/client';
import { pushToast, ToastContainer, type ToastKind } from './ToastContainer';

let mounted = false;

function ensureMount(): void {
  if (mounted) return;
  mounted = true;
  const host = document.createElement('div');
  host.id = 'toast-react-root';
  document.body.appendChild(host);
  createRoot(host).render(<ToastContainer />);
}

/** 기존 ui/toast.ts 의 showToast 와 동일 시그니처 — 호출 측 무수정 */
export function showToast(message: string, kind: ToastKind = 'safe'): void {
  ensureMount();
  pushToast(message, kind);
}

export type { ToastKind };
