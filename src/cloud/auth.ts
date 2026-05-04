/* =========================================================
   SPHERE — Supabase 인증
   - signInWithGoogle / signInWithGitHub / signOut
   - getSession / onAuthStateChange
   ========================================================= */

import { supabase, cloudEnabled } from './supabase.js';
import type { Session, User } from '@supabase/supabase-js';

export type AuthProvider = 'google' | 'github';

export async function signInWith(provider: AuthProvider): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * 세션 상태 변화 구독 (로그인/로그아웃/토큰 갱신).
 * @returns unsubscribe 함수
 */
export function onAuthStateChange(
  cb: (session: Session | null) => void
): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export { cloudEnabled };
