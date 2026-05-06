/* =========================================================
   tooltip-react — install entry point
   - main.ts 가 호출하던 installTooltip() 의 React 버전
   - body 끝에 #tooltip-react-root div 를 만들고 React root 마운트
   - imperative DOM 에 흩뿌려진 .info-icon 들은 그대로 — 부모 안 건드림
   ========================================================= */

import { createRoot } from 'react-dom/client';
import { TooltipPortal } from './TooltipPortal';

let mounted = false;

export function installTooltipReact(): void {
  if (mounted) return;
  mounted = true;

  // main.ts 가 부트할 때 한 번만 호출됨
  let host = document.getElementById('tooltip-react-root');
  if (!host) {
    host = document.createElement('div');
    host.id = 'tooltip-react-root';
    document.body.appendChild(host);
  }
  createRoot(host).render(<TooltipPortal />);
}
