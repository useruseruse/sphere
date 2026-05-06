/* =========================================================
   tooltip-react — TooltipPortal
   - imperative DOM (.info-icon) 들에 React 를 도입하기 위한 브릿지
   - body 단일 listener 로 위임 (기존 패턴 유지) → 부모 컴포넌트 손 안 댐
   - useLayoutEffect 로 viewport-aware 위치 계산
   ========================================================= */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isKnownMetric, MetricBody, metricTitle } from './metrics';
import type { MetricKey } from './data';

interface State {
  visible: boolean;
  key: MetricKey | null;
  target: HTMLElement | null;
  pinned: boolean;
}

const HIDE_DELAY_MS = 180;

export function TooltipPortal() {
  const [state, setState] = useState<State>({
    visible: false,
    key: null,
    target: null,
    pinned: false,
  });
  const tipRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);

  const cancelHide = useCallback(() => {
    if (hideTimer.current != null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(
    (delay: number) => {
      cancelHide();
      hideTimer.current = window.setTimeout(() => {
        setState((s) => (s.pinned ? s : { ...s, visible: false }));
      }, delay);
    },
    [cancelHide]
  );

  /* ---------- event delegation on body ---------- */
  useEffect(() => {
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const icon = target.closest('.info-icon') as HTMLElement | null;
      if (icon) {
        cancelHide();
        const k = icon.dataset.info;
        if (k && isKnownMetric(k)) {
          setState((s) =>
            s.target === icon && s.visible ? s : { ...s, visible: true, key: k, target: icon, pinned: false }
          );
        }
        return;
      }
      // hovering inside the tooltip itself → cancel hide
      if (target.closest('.info-tooltip')) {
        cancelHide();
      }
    };

    const onOut = (e: MouseEvent) => {
      const fromIcon = (e.target as HTMLElement | null)?.closest('.info-icon');
      const fromTip = (e.target as HTMLElement | null)?.closest('.info-tooltip');
      if (!fromIcon && !fromTip) return;

      const intoIcon = (e.relatedTarget as HTMLElement | null)?.closest?.('.info-icon');
      const intoTip = (e.relatedTarget as HTMLElement | null)?.closest?.('.info-tooltip');
      if (intoIcon || intoTip) {
        cancelHide();
        return;
      }
      scheduleHide(HIDE_DELAY_MS);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const icon = target.closest('.info-icon') as HTMLElement | null;
      if (icon) {
        e.preventDefault();
        e.stopPropagation();
        cancelHide();
        const k = icon.dataset.info;
        if (!k || !isKnownMetric(k)) return;
        setState((s) => {
          // 같은 아이콘 다시 눌렀을 때 → 토글 닫기
          if (s.pinned && s.target === icon) {
            return { visible: false, key: null, target: null, pinned: false };
          }
          return { visible: true, key: k, target: icon, pinned: true };
        });
        return;
      }
      // pinned 상태에서 외부 클릭 → 닫기
      if (!target.closest('.info-tooltip')) {
        setState((s) => (s.pinned ? { visible: false, key: null, target: null, pinned: false } : s));
      }
    };

    document.body.addEventListener('mouseover', onOver);
    document.body.addEventListener('mouseout', onOut);
    document.body.addEventListener('click', onClick);
    return () => {
      document.body.removeEventListener('mouseover', onOver);
      document.body.removeEventListener('mouseout', onOut);
      document.body.removeEventListener('click', onClick);
      cancelHide();
    };
  }, [cancelHide, scheduleHide]);

  /* ---------- viewport-aware positioning ---------- */
  useLayoutEffect(() => {
    if (!state.visible || !state.target || !tipRef.current) return;
    const tip = tipRef.current;
    // 우선 0,0 으로 두고 측정 → 그래야 우측 / 하단 클램프 정확
    tip.style.left = '0px';
    tip.style.top = '0px';
    const targetRect = state.target.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();

    let left = targetRect.left;
    let top = targetRect.bottom + 8;
    if (left + tipRect.width > window.innerWidth - 12) {
      left = window.innerWidth - tipRect.width - 12;
    }
    if (left < 12) left = 12;
    if (top + tipRect.height > window.innerHeight - 12) {
      top = targetRect.top - tipRect.height - 8;
    }
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }, [state.visible, state.target, state.key]);

  /* ---------- render via portal ---------- */
  return createPortal(
    <div
      ref={tipRef}
      className={`info-tooltip${state.visible ? ' show' : ''}`}
      role="tooltip"
      aria-hidden={!state.visible}
    >
      {state.visible && state.key && (
        <>
          <div className="info-title">{metricTitle(state.key)}</div>
          <MetricBody k={state.key} />
        </>
      )}
    </div>,
    document.body
  );
}
