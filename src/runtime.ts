// @ts-nocheck
/* =========================================================
   SPHERE — 런타임 가변 상태 (single source)
   - 파이프라인이 mutate, UI 모듈이 read
   - ESM live binding 으로는 재할당 export 불가하므로 단일 객체로 노출
   ========================================================= */

import type { Item, BalanceMetrics, Insight, Holding } from './types.js';

interface Runtime {
  /** 현재 활성 포트폴리오의 표준화·리스크 계산된 종목들 */
  ITEMS: Item[];
  BALANCE: BalanceMetrics;
  INSIGHTS: Insight[];
  ADVANCED: any;

  /** 리밸런싱 시뮬레이션 모드 — true 면 UI 가 TARGET_* 를 표시 */
  rebalanceMode: boolean;
  TARGET_HOLDINGS: Holding[] | null;
  TARGET_ITEMS: Item[];
  TARGET_BALANCE: BalanceMetrics;
  TARGET_INSIGHTS: Insight[];
  RECOMMENDATIONS: any[];

  /** 활성화된 스트레스 시나리오 키 (null = 평상시) */
  CURRENT_STRESS: string | null;

  /** 상관관계 네트워크 라인 표시 여부 */
  networkMode: boolean;
  /** 라인을 그릴 최소 상관계수 (0~1) */
  networkThreshold: number;
}

export const RUNTIME: Runtime = {
  ITEMS: [],
  BALANCE: { balance:0, diverse:0, deviation:0, sphericity:0, hhi:'0.000', avgRisk:0, sectorWeights:{} } as BalanceMetrics,
  INSIGHTS: [],
  ADVANCED: {},

  rebalanceMode: false,
  TARGET_HOLDINGS: null,
  TARGET_ITEMS: [],
  TARGET_BALANCE: {} as BalanceMetrics,
  TARGET_INSIGHTS: [],
  RECOMMENDATIONS: [],

  CURRENT_STRESS: null,

  networkMode: false,
  networkThreshold: 0.5,
};
