// @ts-nocheck
/* =========================================================
   SPHERE — 로그인/로그아웃 버튼
   - cloudEnabled 면 헤더에 버튼 노출
   - 로그인: 드롭다운으로 Google / GitHub 선택
   - 로그인 후: 이메일 + 로그아웃
   ========================================================= */

import { cloudEnabled, signInWith, signOut, getSession, onAuthStateChange } from '../cloud/auth.js';
import { pullPortfolios, migrateLocalToCloud } from '../cloud/sync.js';

let _onSessionChange = () => {};

/** 부트스트랩에서 호출 — 헤더 슬롯에 버튼 mount + 세션 변화 감지 */
export function installAuthButton(opts: { onSessionChange: () => void }){
  _onSessionChange = opts.onSessionChange;

  // 클라우드 미설정 시: 버튼 자체를 안 보이게
  const slot = document.getElementById('authSlot');
  if (!slot) return;
  if (!cloudEnabled){
    slot.style.display = 'none';
    return;
  }

  // 초기 렌더 + 세션 구독
  renderButton();
  onAuthStateChange(async (session) => {
    renderButton();
    if (session){
      // 로그인 직후: localStorage → cloud 1회 마이그 → cloud → STATE pull
      await migrateLocalToCloud();
      const pulled = await pullPortfolios();
      if (pulled) _onSessionChange();
    } else {
      // 로그아웃: 현재 STATE 유지 (다음 새로고침엔 localStorage 단독 모드)
      _onSessionChange();
    }
  });
}

async function renderButton(){
  const slot = document.getElementById('authSlot');
  if (!slot) return;
  const session = await getSession();
  if (session){
    const email = session.user.email || 'signed in';
    slot.innerHTML = `
      <span class="auth-email" title="${email}">${email.split('@')[0]}</span>
      <button class="auth-btn" id="authSignOut" type="button" title="로그아웃">⤴</button>
    `;
    document.getElementById('authSignOut')?.addEventListener('click', signOut);
  } else {
    slot.innerHTML = `
      <button class="auth-btn auth-signin" id="authSignIn" type="button">Sign in</button>
      <div class="auth-menu" id="authMenu" hidden>
        <button data-provider="google" type="button">Continue with Google</button>
        <button data-provider="github" type="button">Continue with GitHub</button>
      </div>
    `;
    const btn = document.getElementById('authSignIn');
    const menu = document.getElementById('authMenu');
    btn?.addEventListener('click', e => {
      e.stopPropagation();
      menu?.toggleAttribute('hidden');
    });
    menu?.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        const p = (b as HTMLElement).dataset.provider as 'google' | 'github';
        signInWith(p);
      });
    });
    document.addEventListener('click', e => {
      if (!(e.target as HTMLElement).closest('#authSlot')) menu?.setAttribute('hidden', '');
    });
  }
}
