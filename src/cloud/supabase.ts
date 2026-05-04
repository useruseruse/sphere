/* =========================================================
   SPHERE — Supabase 클라이언트 싱글턴
   - 환경변수 (VITE_SUPABASE_URL/ANON_KEY) 설정 시에만 활성화
   - 미설정 시 isCloudEnabled() === false → 모든 cloud 호출이 no-op
   ========================================================= */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const cloudEnabled: boolean = !!(URL && ANON);

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(URL!, ANON!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,  // OAuth redirect 콜백 처리
      },
    })
  : null;

export function isCloudEnabled(): boolean {
  return cloudEnabled;
}
