/* =========================================================
   토스트 알림 — 화면 우하단에 잠깐 떴다가 사라짐
   ========================================================= */

export type ToastKind = 'safe' | 'mod' | 'caution' | 'high' | 'extreme';

export function showToast(message: string, kind: ToastKind = 'safe'): void {
  const el = document.createElement('div');
  el.className = 'sphere-toast ' + kind;
  el.innerHTML = '<span class="toast-dot"></span>' + message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }, 1800);
}
