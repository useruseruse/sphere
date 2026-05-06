import { useMemo } from 'react';
import {
  standardize,
  computeRiskScores,
  mapSphereCoords,
  computeBalance,
} from '../core/pipeline';
import type { BalanceMetrics, Item, Sector } from '../types';
import { SAMPLE_PORTFOLIO } from './sample';
import { ScoreCard } from './ScoreCard';
import { HoldingsList } from './HoldingsList';

/**
 * 동일한 도메인 파이프라인을 React 컴포넌트 트리로 표현.
 *  - 기존 vanilla TS 모드는 imperative DOM 업데이트
 *  - 본 데모는 useMemo + props drilling 으로 동일 결과를 선언적으로 렌더
 *  - 비교 의도: 리포팅 UI는 React 컴포넌트로 깔끔하게 떨어진다는 시그널
 */
export default function App() {
  const { items, balance } = useMemo<{ items: Item[]; balance: BalanceMetrics }>(() => {
    const standardized = standardize(SAMPLE_PORTFOLIO);
    const scored = computeRiskScores(standardized);
    const placed = mapSphereCoords(scored);
    return { items: placed, balance: computeBalance(placed) };
  }, []);

  const sectorBreakdown = useMemo(
    () =>
      Object.entries(balance.sectorWeights)
        .map(([sector, weight]) => ({ sector: sector as Sector, weight: weight as number }))
        .sort((a, b) => b.weight - a.weight),
    [balance.sectorWeights]
  );

  return (
    <div className="react-demo">
      <header className="rd-header">
        <a href="./index.html" className="rd-back" aria-label="메인으로 돌아가기">
          ← SPHERE
        </a>
        <div>
          <h1 className="rd-title">React Component Demo</h1>
          <p className="rd-sub">
            동일한 5-Layer 도메인 로직 위에 React 컴포넌트로 리포팅 카드를 재구현
          </p>
        </div>
      </header>

      <main className="rd-grid">
        <ScoreCard balance={balance} />

        <section className="rd-card">
          <h2 className="rd-card-title">섹터 비중</h2>
          <ul className="rd-sector-list">
            {sectorBreakdown.map(({ sector, weight }) => (
              <li key={sector} className="rd-sector-row">
                <span className="rd-sector-name">{sector}</span>
                <span className="rd-sector-bar" aria-hidden>
                  <span
                    className="rd-sector-fill"
                    style={{ width: `${(weight * 100).toFixed(1)}%` }}
                  />
                </span>
                <span className="rd-sector-pct">{(weight * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rd-card rd-card-wide">
          <h2 className="rd-card-title">보유 종목 ({items.length})</h2>
          <HoldingsList items={items} />
        </section>
      </main>

      <footer className="rd-footer">
        <code>src/react-demo/</code> · React 19 · 동일한{' '}
        <code>src/core/pipeline.ts</code> 재사용
      </footer>
    </div>
  );
}
