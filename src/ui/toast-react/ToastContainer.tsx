/* =========================================================
   toast-react — ToastContainer
   - 모듈-스코프 store 가 toast 배열을 보관, 컴포넌트가 구독
   - showToast(msg, kind) 호출 → store push → 자동으로 페이드인/아웃
   - body 에 portal — 어디서 호출하든 바닥에서 뜨게
   ========================================================= */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ToastKind = 'safe' | 'mod' | 'caution' | 'high' | 'extreme';

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
  show: boolean;
}

/* ---------- store ---------- */
let toasts: Toast[] = [];
let nextId = 1;
const subs = new Set<() => void>();

function notify() {
  subs.forEach((s) => s());
}

const SHOW_MS = 1800;
const FADE_MS = 350;

export function pushToast(message: string, kind: ToastKind = 'safe'): void {
  const id = nextId++;
  const toast: Toast = { id, message, kind, show: false };
  toasts = [...toasts, toast];
  notify();

  // 다음 프레임에 .show 부여 → CSS transition 발동
  requestAnimationFrame(() => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, show: true } : t));
    notify();
  });

  // 1.8s 뒤 .show 제거 (페이드아웃 시작)
  setTimeout(() => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, show: false } : t));
    notify();

    // +350ms 뒤 DOM 제거
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notify();
    }, FADE_MS);
  }, SHOW_MS);
}

/* ---------- component ---------- */
export function ToastContainer() {
  const [, force] = useState(0);

  useEffect(() => {
    const fn = () => force((t) => t + 1);
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  }, []);

  return createPortal(
    <>
      {toasts.map((t) => (
        <div key={t.id} className={`sphere-toast ${t.kind}${t.show ? ' show' : ''}`}>
          <span className="toast-dot" />
          {t.message}
        </div>
      ))}
    </>,
    document.body
  );
}
