/* =========================================================
   React 데모 — 엔트리포인트
   동일한 5-Layer 도메인 로직(src/core/pipeline.ts)을 그대로 가져와
   React 컴포넌트로 리포팅 카드를 재구현했음을 보여주는 데모.
   ========================================================= */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './demo.css';

const container = document.getElementById('react-root');
if (!container) throw new Error('#react-root not found');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
