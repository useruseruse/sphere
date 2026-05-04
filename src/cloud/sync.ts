/* =========================================================
   SPHERE — Supabase 포트폴리오 동기화
   - pullPortfolios : 서버 → STATE 로 가져오기 (로그인 직후)
   - pushPortfolios : STATE → 서버로 밀어넣기 (saveState 후 debounce)
   - migrateLocalToCloud : 첫 로그인 시 localStorage 데이터를 서버로 1회 push
   스키마 / RLS 는 SUPABASE_SETUP.md 참고.
   ========================================================= */

import { supabase } from './supabase.js';
import { getUser } from './auth.js';
import { STATE } from '../state/portfolio.js';
import type { Portfolio, Holding } from '../types.js';

interface RemotePortfolio {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface RemoteHolding {
  id: string;
  portfolio_id: string;
  ticker: string;
  quantity: number;
  avg_price: number;
}

/** 서버 portfolios + holdings → 로컬 STATE 로 덮어씀 */
export async function pullPortfolios(): Promise<boolean> {
  if (!supabase) return false;
  const user = await getUser();
  if (!user) return false;

  const { data: pfs, error: pfErr } = await supabase
    .from('portfolios')
    .select('id, name, created_at, updated_at')
    .order('created_at', { ascending: true });
  if (pfErr || !pfs) {
    console.warn('[cloud] pullPortfolios:', pfErr);
    return false;
  }
  if (pfs.length === 0) return false;  // 빈 클라우드 → 로컬 유지

  const ids = (pfs as RemotePortfolio[]).map(p => p.id);
  const { data: hs, error: hErr } = await supabase
    .from('holdings')
    .select('id, portfolio_id, ticker, quantity, avg_price')
    .in('portfolio_id', ids);
  if (hErr) {
    console.warn('[cloud] pullPortfolios holdings:', hErr);
    return false;
  }

  const byPortfolio: Record<string, Holding[]> = {};
  (hs as RemoteHolding[] || []).forEach(h => {
    if (!byPortfolio[h.portfolio_id]) byPortfolio[h.portfolio_id] = [];
    byPortfolio[h.portfolio_id].push({
      ticker: h.ticker,
      quantity: h.quantity,
      avg_price: h.avg_price,
    });
  });

  const portfolios: Portfolio[] = (pfs as RemotePortfolio[]).map(p => ({
    id: p.id,
    name: p.name,
    holdings: byPortfolio[p.id] || [],
    createdAt: new Date(p.created_at).getTime(),
    updatedAt: new Date(p.updated_at).getTime(),
  }));

  STATE.portfolios = portfolios;
  STATE.activeId = portfolios[0]?.id ?? '';
  return true;
}

/** STATE 의 모든 포트폴리오 + holdings 를 upsert. 단순 전체 덮어쓰기 — 더 정교한 diff 는 향후. */
export async function pushPortfolios(): Promise<void> {
  if (!supabase) return;
  const user = await getUser();
  if (!user) return;

  // portfolios upsert
  const pfRows = STATE.portfolios.map(p => ({
    id: p.id,
    user_id: user.id,
    name: p.name,
    created_at: new Date(p.createdAt).toISOString(),
    updated_at: new Date(p.updatedAt).toISOString(),
  }));
  const { error: pfErr } = await supabase
    .from('portfolios')
    .upsert(pfRows, { onConflict: 'id' });
  if (pfErr) {
    console.warn('[cloud] pushPortfolios:', pfErr);
    return;
  }

  // holdings: 단순 전략 — 사용자의 모든 holdings 삭제 후 재삽입
  // (포트폴리오 단위로 cascade 가 동작하지만 row id 안정성 신경쓰지 않음)
  const pfIds = STATE.portfolios.map(p => p.id);
  if (pfIds.length === 0) return;
  await supabase.from('holdings').delete().in('portfolio_id', pfIds);

  const hRows = STATE.portfolios.flatMap(p =>
    p.holdings.map(h => ({
      portfolio_id: p.id,
      ticker: h.ticker,
      quantity: h.quantity,
      avg_price: h.avg_price,
    }))
  );
  if (hRows.length === 0) return;
  const { error: hErr } = await supabase.from('holdings').insert(hRows);
  if (hErr) console.warn('[cloud] pushPortfolios holdings:', hErr);
}

let _pushTimer: number | null = null;
/** saveState() 후 호출 — 1초 debounce 후 서버로 동기화 */
export function schedulePush(): void {
  if (!supabase) return;
  if (_pushTimer != null) clearTimeout(_pushTimer);
  _pushTimer = window.setTimeout(() => {
    _pushTimer = null;
    pushPortfolios();
  }, 1000);
}

/** 첫 로그인 시: 서버에 데이터가 없으면 localStorage 의 포트폴리오를 서버로 밀어넣음 */
export async function migrateLocalToCloud(): Promise<void> {
  if (!supabase) return;
  const user = await getUser();
  if (!user) return;

  const { count, error } = await supabase
    .from('portfolios')
    .select('id', { count: 'exact', head: true });
  if (error) {
    console.warn('[cloud] migrate check:', error);
    return;
  }
  if (count && count > 0) return;  // 이미 클라우드 데이터 있음 — 마이그 안 함

  // localStorage 의 STATE 를 그대로 push
  if (STATE.portfolios.length > 0) {
    await pushPortfolios();
    console.info('[cloud] migrated', STATE.portfolios.length, 'portfolios from localStorage');
  }
}
