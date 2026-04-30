window.addEventListener('error', e => console.error('[SPHERE]', e.message, e.filename, e.lineno));
function bootWhenReady(fn){
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}

// 티커 카탈로그 — data/tickers.json 에서 ASSET_DB 확장 (KOSPI/KOSDAQ + S&P500 + ETF 700+)
window.SPHERE_CATALOG_META = null;
async function applyTickerCatalog(){
  try {
    const candidates = ['./data/tickers.json', '../data/tickers.json'];
    let res = null;
    for (const url of candidates){
      try {
        res = await fetch(url + '?t=' + Date.now(), { cache:'no-cache' });
        if (res && res.ok) break;
      } catch(e){ /* 다음 후보 시도 */ }
    }
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (!data.tickers || !Array.isArray(data.tickers)) return null;
    const DB = window.ASSET_DB, BY = window.ASSET_BY_TICKER;
    if (!DB || !BY) return null;
    let added = 0;
    data.tickers.forEach(item => {
      if (!item.ticker || BY[item.ticker]) return; // 핵심 ASSET_DB 우선
      // 기본값으로 안전 채움
      const entry = {
        ticker: item.ticker,
        name: item.name || item.ticker,
        name_en: item.name_en || item.name || item.ticker,
        sector: item.sector || 'ETC',
        current_price: item.current_price || 0,
        market_cap: item.market_cap || 0,
        volatility_30d: item.volatility_30d != null ? item.volatility_30d : 0.25,
        beta: item.beta != null ? item.beta : 1.0,
        debt_ratio: item.debt_ratio != null ? item.debt_ratio : 0.30,
        liquidity_volume: item.liquidity_volume || 0,
        is_etf: !!item.is_etf,
        alias: (item.alias || item.name_en || item.name || '').toLowerCase(),
        _fromCatalog: true
      };
      DB.push(entry);
      BY[entry.ticker] = entry;
      added++;
    });
    window.SPHERE_CATALOG_META = { added, total: DB.length, generatedAt: data.generated_at };
    return window.SPHERE_CATALOG_META;
  } catch (e){
    console.warn('[SPHERE] Ticker catalog load failed:', e);
    return null;
  }
}

// 일별 시세 로딩 — data/prices.json 에서 ASSET_DB 덮어쓰기
window.SPHERE_PRICE_META = null;
async function applyDailyPrices(){
  try {
    const candidates = ['./data/prices.json', '../data/prices.json'];
    let res = null;
    for (const url of candidates){
      try {
        res = await fetch(url + '?t=' + Date.now(), { cache:'no-cache' });
        if (res && res.ok) break;
      } catch(e){ /* 다음 후보 시도 */ }
    }
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (!data.prices || !data.updated_at) return null;
    let updated = 0;
    const BY = window.ASSET_BY_TICKER;
    if (!BY) return null;
    Object.entries(data.prices).forEach(([ticker, info]) => {
      const a = BY[ticker];
      if (a && info.price){
        a.current_price = info.price;
        if (info.volatility_30d != null) a.volatility_30d = info.volatility_30d;
        if (info.beta != null) a.beta = info.beta;
        if (info.volume != null) a.liquidity_volume = info.volume;
        if (info.dividend_yield != null) a.dividend_yield = info.dividend_yield;
        updated++;
      }
    });
    window.SPHERE_PRICE_META = { updated, updatedAt: data.updated_at };
    return window.SPHERE_PRICE_META;
  } catch (e){
    console.warn('[SPHERE] Daily price load failed:', e);
    return null;
  }
}

bootWhenReady(function(){
  if (typeof THREE === 'undefined'){
    document.body.insertAdjacentHTML('afterbegin',
      '<div style="position:fixed;inset:0;background:#05070d;color:#FF8C42;display:flex;align-items:center;justify-content:center;font-family:monospace;padding:40px;z-index:9999;text-align:center;">' +
      '<div><div style="color:#e8ecf5;font-size:18px;letter-spacing:4px;margin-bottom:14px;">SPHERE</div>' +
      '<div>three.min.js를 찾을 수 없습니다.</div>' +
      '<div style="color:#9aa4bc;font-size: 12px;margin-top:10px;line-height:1.6;">sphere.html과 같은 폴더에 three.min.js 파일이 함께 있어야 합니다.</div></div></div>');
    return;
  }
  try { initSphere(); } catch(e){ console.error(e); alert('SPHERE init error: ' + e.message); }
});

function initSphere(){
/* =========================================================
   SPHERE — Skills.md v1.0.0 구현
   Layer 1: 표준화  Layer 2: 리스크  Layer 3: 좌표
   Layer 4: 밸런스  Layer 5: 시각화
   ========================================================= */

// =========================================================
// I18N — 한국어 (기본) / English
// =========================================================
const I18N = {
  ko: {
    logoSub:'PORTFOLIO RISK SPHERE', aboutTitle:'이용 약관 / 면책 고지',
    update:'UPDATE', status:'STATUS',
    pfNew:'+ NEW', pfNewTitle:'새 포트폴리오 만들기', pfRenameTitle:'이름 변경', pfDeleteTitle:'포트폴리오 삭제',
    addAsset:'Add Asset', searchBadge:'SEARCH',
    searchPlaceholder:'종목명·티커·ETF 검색 (예: 삼성전자, AAPL, QQQ)',
    holdings:'Holdings', totalValue:'총 평가액',
    emptyHoldings:'보유 종목이 없습니다.<br>위 검색창에서 종목을 추가해보세요.',
    sectorAllocation:'Sector Allocation', riskDistribution:'Risk Distribution',
    sphere3D:'3D RISK SPHERE', sphereView:'SPHERE VIEW', clusterView:'CLUSTER VIEW',
    portfolioRisk:'PORTFOLIO RISK', avgScore:'avg score · 0–100',
    growth:'GROWTH', growthSub:'성장주 · 북반구', value:'VALUE', valueSub:'가치주 · 남반구',
    legendRisk:'LEGEND · RISK',
    legendSafe:'SAFE 0-29', legendMod:'MOD 30-54', legendCaution:'CAUTION 55-74', legendHigh:'HIGH 75-89', legendExtreme:'EXTREME 90+',
    sphericity:'SPHERICITY', perfectSphere:'100 = perfect sphere',
    btnSphere:'SPHERE', btnCluster:'CLUSTER', btnRotate:'⟳ AUTO-ROTATE', btnReset:'RESET',
    balanceIndex:'Balance Index', balanceFormulaTitle:'산출 공식 보기',
    calculating:'계산 중...',
    metricDiverse:'섹터 분산', metricDeviation:'리스크 편차', metricSphericity:'구형도', metricHHI:'HHI 집중도',
    riskMetrics:'Risk Metrics', riskMetricsBadge:'QUANT',
    metricVaR:'VaR 95% (1일)', metricCVaR:'CVaR 95% (1일)', metricSharpe:'Sharpe 비율', metricSortino:'Sortino 비율',
    metricDR:'분산효과 (위험감소)', metricPortVol:'포트폴리오 변동성', metricDividend:'예상 연배당',
    stressTest:'스트레스 테스트', stressTestBadge:'시나리오', stressTestEmpty:'좌측에서 시나리오를 선택하세요',
    stressTestExpected:'예상 손익', stressTestSummary:(p,v)=>`${(p*100).toFixed(1)}% (${v})`,
    navSphere:'구체', navSearch:'검색', navHoldings:'보유', navMetrics:'지표', navInsights:'인사이트',
    insights:'Insights', auto:'AUTO',
    selectedAsset:'Selected Asset',
    sdQty:'보유 수량', sdValue:'평가금액', sdWeight:'비중', sdSector:'섹터',
    sdPrice:'현재가', sdAvg:'평균 매수가', sdReturn:'수익률', sdVol:'변동성 30D',
    sdBeta:'베타', sdDebt:'부채비율', sdRisk:'리스크 스코어',
    selectHint:'구체의 노드를 클릭하면<br>상세 정보가 표시됩니다',
    sharesUnit:'주', etfTag:'ETF', addedTag:'✓ 추가됨', noSearchResults:'검색 결과가 없습니다',
    confirmDelete:(n)=>`"${n}" 포트폴리오를 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`,
    alertMaxPortfolios:(n)=>`포트폴리오는 최대 ${n}개까지 만들 수 있습니다.`,
    alertLastPortfolio:'마지막 포트폴리오는 삭제할 수 없습니다.',
    portfolioCount:(n)=>`${n}종목`, updatedAt:(d)=>`업데이트 ${d}`,
    modalNewPfTitle:'새 포트폴리오',
    modalNewPfDesc:(curr,max)=>`포트폴리오 이름을 입력하세요. (${curr}/${max})`,
    modalNewPfPh:'예: 안정형 포트폴리오',
    modalNewPfDefault:(n)=>`포트폴리오 ${n}`,
    modalRenameTitle:'이름 변경', modalRenameDesc:'포트폴리오 이름을 수정합니다.', modalRenamePh:'포트폴리오 이름',
    modalCancel:'취소', modalOK:'확인',
    portfoliosFooter:(c,m)=>`${c} / ${m} portfolios`,
    assetsCount:(c,m)=>`${c} ASSETS · ${m}/${20}`,
    insightConcentrationTitle:'⚠ 집중 투자 경고',
    insightConcentrationBody:(n,p,b1,b2)=>`${n}의 비중이 ${p}%로 전체 포트폴리오 리스크를 좌우합니다. 비중을 30% 이하로 조정하면 밸런스가 ${b1} → ${b2}점으로 개선됩니다.`,
    insightRebalanceTitle:'⚠ 리밸런싱 필요',
    insightRebalanceBody:(s,d)=>`현재 구형도 ${s}점, 섹터 분산 ${d}점. 저비중 섹터(소비재·금융 등) 편입을 통해 균형 회복이 필요합니다.`,
    insightHighRiskTitle:'⚠ 고위험 포트폴리오',
    insightHighRiskBody:(avg,n,sc)=>`평균 리스크 스코어 ${avg}점. 특히 ${n} (score ${sc})의 변동성이 섹터 평균 대비 높습니다.`,
    insightSectorTitle:'⚠ 섹터 편중 경고',
    insightSectorBody:(s,p,h)=>`${s} 섹터가 ${p}%를 차지합니다. HHI ${h}로 분산도가 낮습니다.`,
    insightExtremeRiskTitle:(n)=>`⚠ ${n} 리스크 매우 높음`,
    insightExtremeRiskBody:(sc,v,b)=>`리스크 스코어 ${sc}점. 변동성 ${v}%, 베타 ${b}로 시장 평균 대비 민감도가 큽니다.`,
    insightBalancedTitle:'✓ 균형잡힌 포트폴리오',
    insightBalancedBody:(s)=>`밸런스 지수 ${s}점. 모든 핵심 지표가 양호한 범위에 있습니다. 지속적인 모니터링을 권장합니다.`,
    insightEmptyTitle:'포트폴리오가 비어있음',
    insightEmptyBody:'좌측 검색창에서 종목을 추가해주세요.',
    balanceGradeOptimal:'✅ 최적 분산 — 리밸런싱 불필요',
    balanceGradeGood:'🔵 양호 — 소폭 조정 고려',
    balanceGradeWarn:'🟡 편중 주의 — 리밸런싱 권장',
    balanceGradeRisk:'🔴 편중 위험 — 리밸런싱 필요',
    balanceGradeSevere:'🟣 심각한 쏠림 — 즉각 리밸런싱',
    riskSafe:'SAFE', riskModerate:'MODERATE', riskCaution:'CAUTION', riskHigh:'HIGH', riskExtreme:'EXTREME',
    tooltipQtyWeight:(q,w)=>`${q.toLocaleString()}주 · ${w}%`,
    tooltipValue:'평가금액', tooltipRisk:'리스크', tooltipReturn:'수익률', tooltipSector:'섹터',
    qtyEditTitle:'보유 수량 (클릭하여 수정 · Enter로 저장)',
    delTitle:'포트폴리오에서 제거', valueTooltipTitle:'평가금액 (수량 × 현재가)',
    legalBannerTitle:'SPHERE — 이용 약관 및 면책 고지',
    legalBannerText:'본 서비스는 교육·시연 목적의 시각화 도구이며, 투자 자문이 아닙니다. 종목 데이터는 정적 스냅샷입니다. 모든 투자 결정과 손익은 사용자 본인의 책임입니다.',
    legalBannerView:'전체보기', legalBannerClose:'배너 닫기',
    btnRebalance:'REBALANCE',
    rbIndicator:'리밸런싱 시뮬레이션 중',
    rbTitle:'리밸런싱 시뮬레이터',
    rbCancel:'취소하고 닫기',
    rbCurrent:'현재', rbTarget:'목표',
    rbInsightsTitle:'목표 인사이트', rbInsightsBadge:'SIM',
    rbApply:'적용하기', rbResetBtn:'초기화', rbResetArmed:'정말로?', rbCancelBtn:'취소',
    rbRecsTitle:'추천 액션', rbRecsBadge:'AI',
    rbRecAdd:'추가', rbRecReduce:'축소',
    rbRecApplyAdd:(q)=>`+${q}주 추가`, rbRecApplyReduce:(q)=>`${q}주로 줄이기`,
    rbRecSkip:'건너뛰기',
    rbRecEmptyTitle:'완벽하게 균형잡혔어요',
    rbRecEmpty:'현재 포트폴리오는 큰 약점이 보이지 않습니다. 직접 수량을 편집해서 시뮬레이션 해볼 수 있어요.',
    rbRecAllSkippedTitle:'추천을 모두 건너뛰셨어요',
    rbRecAllSkipped:'좌측 보유 목록에서 직접 수량을 편집해 시뮬레이션하거나, [초기화] 버튼을 눌러 추천을 다시 불러올 수 있어요.',
    rbReasonW1:(domSec,domPct,targetSec)=>`현재 <b>${domSec}</b> 섹터가 ${domPct}%로 편중 — 부족한 <b>${targetSec}</b> 섹터를 채워 분산도 개선`,
    rbReasonW2:(n,p)=>`<b>${n}</b>의 비중이 ${p}%로 너무 큼 — 25% 수준으로 줄이면 HHI 개선`,
    rbReasonW3:(targetSec)=>`평균 리스크가 높음 — 안전자산 <b>${targetSec}</b> 편입 권장`,
    rbReasonW4:(targetSec)=>`포트폴리오 분산 부족 — 부족한 <b>${targetSec}</b> 섹터 편입 권장`,
    rbReasonW5:(targetSec)=>`리스크 편차 큼 — <b>${targetSec}</b> 추가로 평탄화 권장`,
    rbReasonW6:(region,name)=>`지역 편중 — ${region} 시장 노출 추가로 환율·국가 리스크 분산 (${name})`,
    rbReasonW7:(name)=>`헷지 자산 부재 — <b>${name}</b> 같은 채권/금 편입으로 하락장 방어력 확보`,
    weaknessW1:'섹터 편중', weaknessW2:'종목 집중', weaknessW3:'리스크 ↓', weaknessW4:'분산 부족',
    weaknessW5:'편차 ↓', weaknessW6:'지역 분산', weaknessW7:'헷지 편입',
    rbImpactBalance:'밸런스', rbImpactHHI:'HHI', rbImpactDiverse:'섹터 분산', rbImpactRisk:'평균 리스크',
    rbReduceSold:(v)=>`약 ${v} 회수`,
    dialogAlert:'알림', dialogConfirm:'확인 필요',
    tourSkip:'건너뛰기', tourPrev:'이전', tourNext:'다음', tourFinish:'시작하기',
    tourReplay:'사용법 다시보기',
    savedToast:'변경사항이 저장되었습니다', saveFailToast:'저장에 실패했습니다',
    rbMetricBalance:'밸런스 지수', rbMetricDiverse:'섹터 분산', rbMetricDeviation:'리스크 편차',
    rbMetricSphericity:'구형도', rbMetricHHI:'HHI 집중도', rbMetricRisk:'평균 리스크',
    rbApplyConfirm:(b1,b2)=>`현재 포트폴리오를 시뮬레이션 결과로 변경하시겠어요?\n\n밸런스 지수: ${b1} → ${b2}\n좌측 보유 종목의 수량이 시뮬레이션한 값으로 갱신됩니다.`,
    rbResetConfirm:'타겟을 현재 포트폴리오로 되돌립니다. 시뮬레이션 변경사항이 모두 사라져요. 계속할까요?',
    rbInsightUnchanged:'변경사항이 없습니다.',
    rbDeltaImproved:(d)=>`개선 ${d}점`, rbDeltaWorsened:(d)=>`악화 ${d}점`, rbDeltaSame:'변화 없음',
    btnNetwork:'NETWORK',
    netLegendTitle:'CORRELATION',
    netStrong:'강 ≥ 0.85', netMed:'중 0.70–0.85', netWeak:'약 0.50–0.70',
    netMeta:'섹터 + 베타 + 변동성 기반 추정',
    collapseTitle:'검색창 접기', searchExpand:'종목 검색 열기',
    leftToggleTitle:'좌측 패널 접기/펼치기', rightToggleTitle:'우측 패널 접기/펼치기'
  },
  en: {
    logoSub:'PORTFOLIO RISK SPHERE', aboutTitle:'Terms / Disclaimer',
    update:'UPDATE', status:'STATUS',
    pfNew:'+ NEW', pfNewTitle:'Create new portfolio', pfRenameTitle:'Rename', pfDeleteTitle:'Delete portfolio',
    addAsset:'Add Asset', searchBadge:'SEARCH',
    searchPlaceholder:'Search ticker, name, ETF (e.g., AAPL, Samsung, QQQ)',
    holdings:'Holdings', totalValue:'Total Value',
    emptyHoldings:'No holdings yet.<br>Add assets via the search box above.',
    sectorAllocation:'Sector Allocation', riskDistribution:'Risk Distribution',
    sphere3D:'3D RISK SPHERE', sphereView:'SPHERE VIEW', clusterView:'CLUSTER VIEW',
    portfolioRisk:'PORTFOLIO RISK', avgScore:'avg score · 0–100',
    growth:'GROWTH', growthSub:'Growth · Northern', value:'VALUE', valueSub:'Value · Southern',
    legendRisk:'LEGEND · RISK',
    legendSafe:'SAFE 0-29', legendMod:'MOD 30-54', legendCaution:'CAUTION 55-74', legendHigh:'HIGH 75-89', legendExtreme:'EXTREME 90+',
    sphericity:'SPHERICITY', perfectSphere:'100 = perfect sphere',
    btnSphere:'SPHERE', btnCluster:'CLUSTER', btnRotate:'⟳ AUTO-ROTATE', btnReset:'RESET',
    balanceIndex:'Balance Index', balanceFormulaTitle:'View formula',
    calculating:'Calculating...',
    metricDiverse:'Sector Diversity', metricDeviation:'Risk Deviation', metricSphericity:'Sphericity', metricHHI:'HHI Concentration',
    riskMetrics:'Risk Metrics', riskMetricsBadge:'QUANT',
    metricVaR:'VaR 95% (1d)', metricCVaR:'CVaR 95% (1d)', metricSharpe:'Sharpe', metricSortino:'Sortino',
    metricDR:'Diversification', metricPortVol:'Portfolio Vol', metricDividend:'Annual Dividend',
    stressTest:'Stress Test', stressTestBadge:'SCENARIO', stressTestEmpty:'Select a scenario',
    stressTestExpected:'Expected P&L', stressTestSummary:(p,v)=>`${(p*100).toFixed(1)}% (${v})`,
    navSphere:'SPHERE', navSearch:'SEARCH', navHoldings:'HOLDINGS', navMetrics:'METRICS', navInsights:'INSIGHTS',
    insights:'Insights', auto:'AUTO',
    selectedAsset:'Selected Asset',
    sdQty:'Quantity', sdValue:'Market Value', sdWeight:'Weight', sdSector:'Sector',
    sdPrice:'Current Price', sdAvg:'Avg Buy Price', sdReturn:'Return', sdVol:'Volatility 30D',
    sdBeta:'Beta', sdDebt:'Debt Ratio', sdRisk:'Risk Score',
    selectHint:'Click a node on the sphere<br>to see asset details',
    sharesUnit:'sh', etfTag:'ETF', addedTag:'✓ Added', noSearchResults:'No results',
    confirmDelete:(n)=>`Delete portfolio "${n}"?\nThis cannot be undone.`,
    alertMaxPortfolios:(n)=>`You can create up to ${n} portfolios.`,
    alertLastPortfolio:'Cannot delete the last remaining portfolio.',
    portfolioCount:(n)=>`${n} assets`, updatedAt:(d)=>`Updated ${d}`,
    modalNewPfTitle:'New Portfolio',
    modalNewPfDesc:(curr,max)=>`Enter portfolio name. (${curr}/${max})`,
    modalNewPfPh:'e.g., Conservative Portfolio',
    modalNewPfDefault:(n)=>`Portfolio ${n}`,
    modalRenameTitle:'Rename', modalRenameDesc:'Edit portfolio name.', modalRenamePh:'Portfolio name',
    modalCancel:'Cancel', modalOK:'Confirm',
    portfoliosFooter:(c,m)=>`${c} / ${m} portfolios`,
    assetsCount:(c,m)=>`${c} ASSETS · ${m}/20`,
    insightConcentrationTitle:'⚠ Concentration Warning',
    insightConcentrationBody:(n,p,b1,b2)=>`${n} accounts for ${p}% of weight, dominating overall risk. Reducing to under 30% would improve balance from ${b1} → ${b2}.`,
    insightRebalanceTitle:'⚠ Rebalance Needed',
    insightRebalanceBody:(s,d)=>`Sphericity ${s}, sector diversity ${d}. Adding low-weight sectors (consumer, financial) would restore balance.`,
    insightHighRiskTitle:'⚠ High-Risk Portfolio',
    insightHighRiskBody:(avg,n,sc)=>`Average risk score ${avg}. Especially ${n} (score ${sc}) shows high volatility relative to its sector.`,
    insightSectorTitle:'⚠ Sector Concentration',
    insightSectorBody:(s,p,h)=>`${s} sector accounts for ${p}%. HHI ${h} indicates low diversity.`,
    insightExtremeRiskTitle:(n)=>`⚠ ${n} extremely risky`,
    insightExtremeRiskBody:(sc,v,b)=>`Risk score ${sc}. Volatility ${v}%, beta ${b} — much higher than market average.`,
    insightBalancedTitle:'✓ Balanced Portfolio',
    insightBalancedBody:(s)=>`Balance index ${s}. All key metrics are within healthy ranges. Continue monitoring.`,
    insightEmptyTitle:'Portfolio is empty',
    insightEmptyBody:'Add assets from the search panel on the left.',
    balanceGradeOptimal:'✅ Optimal — no rebalancing needed',
    balanceGradeGood:'🔵 Good — minor adjustments',
    balanceGradeWarn:'🟡 Concentration risk — rebalance recommended',
    balanceGradeRisk:'🔴 Imbalanced — rebalance required',
    balanceGradeSevere:'🟣 Severely concentrated — rebalance immediately',
    riskSafe:'SAFE', riskModerate:'MODERATE', riskCaution:'CAUTION', riskHigh:'HIGH', riskExtreme:'EXTREME',
    tooltipQtyWeight:(q,w)=>`${q.toLocaleString()} sh · ${w}%`,
    tooltipValue:'Value', tooltipRisk:'Risk', tooltipReturn:'Return', tooltipSector:'Sector',
    qtyEditTitle:'Quantity (click to edit · Enter to save)',
    delTitle:'Remove from portfolio', valueTooltipTitle:'Market value (qty × price)',
    legalBannerTitle:'SPHERE — Terms & Disclaimer',
    legalBannerText:'This is an educational visualization tool, not investment advice. Asset data is a static snapshot. All investment decisions and outcomes are the user\'s sole responsibility.',
    legalBannerView:'View full', legalBannerClose:'Dismiss banner',
    btnRebalance:'REBALANCE',
    rbIndicator:'REBALANCE SIMULATION',
    rbTitle:'REBALANCE SIMULATOR',
    rbCancel:'Cancel and close',
    rbCurrent:'CURRENT', rbTarget:'TARGET',
    rbInsightsTitle:'Target Insights', rbInsightsBadge:'SIM',
    rbApply:'Apply', rbResetBtn:'Reset', rbResetArmed:'Sure?', rbCancelBtn:'Cancel',
    rbRecsTitle:'Recommended Actions', rbRecsBadge:'AI',
    rbRecAdd:'ADD', rbRecReduce:'REDUCE',
    rbRecApplyAdd:(q)=>`Add ${q} shares`, rbRecApplyReduce:(q)=>`Reduce to ${q}`,
    rbRecSkip:'Skip',
    rbRecEmptyTitle:'Perfectly balanced',
    rbRecEmpty:'No major weakness detected. You can still manually edit quantities to simulate.',
    rbRecAllSkippedTitle:'All recommendations skipped',
    rbRecAllSkipped:'Edit quantities manually on the left, or click Reset to bring recommendations back.',
    rbReasonW1:(domSec,domPct,targetSec)=>`<b>${domSec}</b> dominates at ${domPct}% — fill the underweight <b>${targetSec}</b> to improve diversity`,
    rbReasonW2:(n,p)=>`<b>${n}</b> is ${p}% of portfolio — reducing to ~25% improves HHI`,
    rbReasonW3:(targetSec)=>`Average risk is high — adding defensive <b>${targetSec}</b> assets recommended`,
    rbReasonW4:(targetSec)=>`Diversification insufficient — adding <b>${targetSec}</b> sector recommended`,
    rbReasonW5:(targetSec)=>`Risk deviation is large — <b>${targetSec}</b> additions flatten distribution`,
    rbReasonW6:(region,name)=>`Geographic concentration — adding ${region} exposure reduces currency/country risk (${name})`,
    rbReasonW7:(name)=>`No hedge assets — <b>${name}</b> (bond/gold) cushions downside`,
    weaknessW1:'Concentration', weaknessW2:'Top heavy', weaknessW3:'Lower risk', weaknessW4:'Diversify',
    weaknessW5:'Flatten', weaknessW6:'Geo split', weaknessW7:'Add hedge',
    rbImpactBalance:'Balance', rbImpactHHI:'HHI', rbImpactDiverse:'Diversity', rbImpactRisk:'Avg Risk',
    rbReduceSold:(v)=>`~${v} freed`,
    dialogAlert:'Notice', dialogConfirm:'Confirmation',
    tourSkip:'Skip', tourPrev:'Previous', tourNext:'Next', tourFinish:'Start',
    tourReplay:'Show tour again',
    savedToast:'Changes saved', saveFailToast:'Save failed',
    rbMetricBalance:'Balance Index', rbMetricDiverse:'Sector Diversity', rbMetricDeviation:'Risk Deviation',
    rbMetricSphericity:'Sphericity', rbMetricHHI:'HHI Concentration', rbMetricRisk:'Avg Risk',
    rbApplyConfirm:(b1,b2)=>`Apply simulation result to your active portfolio?\n\nBalance Index: ${b1} → ${b2}\nThe holdings quantities will be updated to your simulated values.`,
    rbResetConfirm:'Reset target to current portfolio. All simulation edits will be lost. Continue?',
    rbInsightUnchanged:'No changes yet.',
    rbDeltaImproved:(d)=>`Improved by ${d}`, rbDeltaWorsened:(d)=>`Worsened by ${d}`, rbDeltaSame:'No change',
    btnNetwork:'NETWORK',
    netLegendTitle:'CORRELATION',
    netStrong:'High ≥ 0.85', netMed:'Med 0.70–0.85', netWeak:'Low 0.50–0.70',
    netMeta:'Estimated from sector + beta + volatility',
    collapseTitle:'Collapse search', searchExpand:'Open asset search',
    leftToggleTitle:'Toggle left panel', rightToggleTitle:'Toggle right panel'
  }
};

let CURRENT_LANG = localStorage.getItem('sphere_lang') || 'ko';
function t(key, ...args){
  const v = (I18N[CURRENT_LANG]&&I18N[CURRENT_LANG][key]) ?? I18N.ko[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
}
function applyI18n(){
  document.documentElement.lang = CURRENT_LANG;
  document.querySelectorAll('[data-i18n]').forEach(el=>{ el.innerHTML = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{ el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('#langSwitch button').forEach(b=> b.classList.toggle('active', b.dataset.lang===CURRENT_LANG));
}
function setLang(lang){
  CURRENT_LANG = lang;
  localStorage.setItem('sphere_lang', lang);
  applyI18n();
  if (typeof rebuildAll === 'function') rebuildAll();
}
// 종목명 언어 헬퍼 (영문 토글 시 name_en 우선)
function getName(asset){
  if (CURRENT_LANG === 'en' && asset.name_en) return asset.name_en;
  return asset.name;
}

// 한국어 단위 변환 — 30,427,000 → "약 3,042만원" / 350,000,000 → "약 3.5억원"
function formatKRWUnit(amount){
  amount = Math.round(amount);
  if (amount === 0) return '';
  if (amount >= 100_000_000){
    const eok = amount / 100_000_000;
    return `약 ${eok % 1 === 0 ? eok : eok.toFixed(1)}억원`;
  }
  if (amount >= 10_000){
    const man = Math.round(amount / 10_000);
    return `약 ${man.toLocaleString()}만원`;
  }
  return `약 ${amount.toLocaleString()}원`;
}

// 섹터 라벨 — 한글 모드에서 한글로 표시
const SECTOR_LABELS = {
  ko: {
    IT:'IT', BIO:'바이오', AUTO:'자동차', GLOBAL_ETF:'글로벌 ETF',
    INDUSTRIAL:'산업/제조', ETC:'기타', FIN:'금융', ENERGY:'에너지',
    CONSUMER:'소비재', REALESTATE:'부동산'
  },
  en: {
    IT:'IT', BIO:'BIO', AUTO:'AUTO', GLOBAL_ETF:'GLOBAL ETF',
    INDUSTRIAL:'INDUSTRIAL', ETC:'ETC', FIN:'FIN', ENERGY:'ENERGY',
    CONSUMER:'CONSUMER', REALESTATE:'REAL ESTATE'
  }
};
function sectorLabel(sec){
  return (SECTOR_LABELS[CURRENT_LANG] && SECTOR_LABELS[CURRENT_LANG][sec]) || sec;
}

// ---------- 종목/ETF 마스터 DB ----------
// 검색 가능한 자산 데이터. 실제 시세 API 차단 환경 대비 정적 스냅샷.
const ASSET_DB = [
  // === 한국 IT ===
  { ticker:'005930.KS', name:'삼성전자',         name_en:'Samsung Electronics',   sector:'IT',         current_price:71200,  market_cap:425e12, volatility_30d:0.24, beta:1.05, debt_ratio:0.32, liquidity_volume:18500000, is_etf:false, alias:'samsung electronics' },
  { ticker:'000660.KS', name:'SK하이닉스',       name_en:'SK Hynix',              sector:'IT',         current_price:182000, market_cap:132e12, volatility_30d:0.36, beta:1.32, debt_ratio:0.45, liquidity_volume:5400000,  is_etf:false, alias:'sk hynix' },
  { ticker:'035420.KS', name:'NAVER',            name_en:'NAVER',                 sector:'IT',         current_price:212000, market_cap:34e12,  volatility_30d:0.30, beta:1.20, debt_ratio:0.22, liquidity_volume:680000,   is_etf:false, alias:'naver' },
  { ticker:'035720.KS', name:'카카오',           name_en:'Kakao',                 sector:'IT',         current_price:48500,  market_cap:21e12,  volatility_30d:0.34, beta:1.28, debt_ratio:0.41, liquidity_volume:2100000,  is_etf:false, alias:'kakao' },
  { ticker:'377300.KS', name:'카카오페이',       name_en:'KakaoPay',              sector:'IT',         current_price:32000,  market_cap:4.2e12, volatility_30d:0.45, beta:1.45, debt_ratio:0.18, liquidity_volume:920000,   is_etf:false, alias:'kakaopay' },
  { ticker:'251270.KS', name:'넷마블',           name_en:'Netmarble',             sector:'IT',         current_price:55800,  market_cap:4.8e12, volatility_30d:0.38, beta:1.22, debt_ratio:0.35, liquidity_volume:340000,   is_etf:false, alias:'netmarble' },
  // === 한국 BIO ===
  { ticker:'207940.KS', name:'삼성바이오로직스', name_en:'Samsung Biologics',     sector:'BIO',        current_price:835000, market_cap:59e12,  volatility_30d:0.28, beta:0.92, debt_ratio:0.20, liquidity_volume:140000,   is_etf:false, alias:'samsung biologics' },
  { ticker:'068270.KS', name:'셀트리온',         name_en:'Celltrion',             sector:'BIO',        current_price:185000, market_cap:38e12,  volatility_30d:0.42, beta:1.18, debt_ratio:0.28, liquidity_volume:1200000,  is_etf:false, alias:'celltrion' },
  { ticker:'196170.KS', name:'알테오젠',         name_en:'Alteogen',              sector:'BIO',        current_price:312000, market_cap:16e12,  volatility_30d:0.55, beta:1.55, debt_ratio:0.15, liquidity_volume:580000,   is_etf:false, alias:'alteogen' },
  { ticker:'128940.KS', name:'한미약품',         name_en:'Hanmi Pharmaceutical',  sector:'BIO',        current_price:328000, market_cap:4.1e12, volatility_30d:0.38, beta:1.05, debt_ratio:0.42, liquidity_volume:78000,    is_etf:false, alias:'hanmi pharm' },
  // === 한국 FIN ===
  { ticker:'105560.KS', name:'KB금융',           name_en:'KB Financial',          sector:'FIN',        current_price:78400,  market_cap:31e12,  volatility_30d:0.18, beta:0.85, debt_ratio:0.78, liquidity_volume:1800000,  is_etf:false, alias:'kb financial' },
  { ticker:'055550.KS', name:'신한지주',         name_en:'Shinhan Financial',     sector:'FIN',        current_price:52800,  market_cap:27e12,  volatility_30d:0.17, beta:0.82, debt_ratio:0.81, liquidity_volume:1900000,  is_etf:false, alias:'shinhan' },
  { ticker:'086790.KS', name:'하나금융지주',     name_en:'Hana Financial',        sector:'FIN',        current_price:62100,  market_cap:18e12,  volatility_30d:0.19, beta:0.88, debt_ratio:0.82, liquidity_volume:1100000,  is_etf:false, alias:'hana financial' },
  { ticker:'316140.KS', name:'우리금융지주',     name_en:'Woori Financial',       sector:'FIN',        current_price:14850,  market_cap:11e12,  volatility_30d:0.18, beta:0.84, debt_ratio:0.83, liquidity_volume:3200000,  is_etf:false, alias:'woori' },
  { ticker:'138930.KS', name:'BNK금융지주',      name_en:'BNK Financial',         sector:'FIN',        current_price:8420,   market_cap:2.7e12, volatility_30d:0.21, beta:0.92, debt_ratio:0.84, liquidity_volume:1400000,  is_etf:false, alias:'bnk' },
  // === 한국 AUTO ===
  { ticker:'005380.KS', name:'현대차',           name_en:'Hyundai Motor',         sector:'AUTO',       current_price:248000, market_cap:52e12,  volatility_30d:0.26, beta:1.08, debt_ratio:0.62, liquidity_volume:850000,   is_etf:false, alias:'hyundai motor' },
  { ticker:'000270.KS', name:'기아',             name_en:'Kia',                   sector:'AUTO',       current_price:108000, market_cap:43e12,  volatility_30d:0.27, beta:1.10, debt_ratio:0.55, liquidity_volume:1600000,  is_etf:false, alias:'kia' },
  { ticker:'012330.KS', name:'현대모비스',       name_en:'Hyundai Mobis',         sector:'AUTO',       current_price:235000, market_cap:22e12,  volatility_30d:0.24, beta:1.02, debt_ratio:0.45, liquidity_volume:280000,   is_etf:false, alias:'mobis' },
  // === 한국 INDUSTRIAL ===
  { ticker:'006400.KS', name:'삼성SDI',          name_en:'Samsung SDI',           sector:'INDUSTRIAL', current_price:325000, market_cap:22e12,  volatility_30d:0.36, beta:1.40, debt_ratio:0.48, liquidity_volume:380000,   is_etf:false, alias:'samsung sdi' },
  { ticker:'051910.KS', name:'LG화학',           name_en:'LG Chem',               sector:'INDUSTRIAL', current_price:368000, market_cap:26e12,  volatility_30d:0.38, beta:1.42, debt_ratio:0.51, liquidity_volume:340000,   is_etf:false, alias:'lg chem' },
  { ticker:'373220.KS', name:'LG에너지솔루션',   name_en:'LG Energy Solution',    sector:'INDUSTRIAL', current_price:392000, market_cap:92e12,  volatility_30d:0.40, beta:1.48, debt_ratio:0.52, liquidity_volume:520000,   is_etf:false, alias:'lg energy solution' },
  { ticker:'010130.KS', name:'고려아연',         name_en:'Korea Zinc',            sector:'INDUSTRIAL', current_price:858000, market_cap:18e12,  volatility_30d:0.34, beta:1.18, debt_ratio:0.32, liquidity_volume:48000,    is_etf:false, alias:'korea zinc' },
  { ticker:'009540.KS', name:'HD한국조선해양',   name_en:'HD Hyundai Shipbuilding',sector:'INDUSTRIAL', current_price:188000, market_cap:13e12,  volatility_30d:0.42, beta:1.55, debt_ratio:0.65, liquidity_volume:380000,   is_etf:false, alias:'hd shipbuilding' },
  // === 한국 ENERGY ===
  { ticker:'015760.KS', name:'한국전력',         name_en:'KEPCO',                 sector:'ENERGY',     current_price:23800,  market_cap:15e12,  volatility_30d:0.22, beta:0.62, debt_ratio:0.88, liquidity_volume:6800000,  is_etf:false, alias:'kepco' },
  { ticker:'034730.KS', name:'SK',               name_en:'SK Holdings',           sector:'ENERGY',     current_price:142000, market_cap:11e12,  volatility_30d:0.28, beta:0.95, debt_ratio:0.55, liquidity_volume:120000,   is_etf:false, alias:'sk holdings' },
  { ticker:'096770.KS', name:'SK이노베이션',     name_en:'SK Innovation',         sector:'ENERGY',     current_price:118000, market_cap:11e12,  volatility_30d:0.34, beta:1.25, debt_ratio:0.62, liquidity_volume:480000,   is_etf:false, alias:'sk innovation' },
  // === 한국 CONSUMER ===
  { ticker:'097950.KS', name:'CJ제일제당',       name_en:'CJ CheilJedang',        sector:'CONSUMER',   current_price:295000, market_cap:4.4e12, volatility_30d:0.16, beta:0.72, debt_ratio:0.58, liquidity_volume:62000,    is_etf:false, alias:'cj cheiljedang' },
  { ticker:'271560.KS', name:'오리온',           name_en:'Orion',                 sector:'CONSUMER',   current_price:128000, market_cap:5.1e12, volatility_30d:0.18, beta:0.65, debt_ratio:0.32, liquidity_volume:140000,   is_etf:false, alias:'orion' },
  { ticker:'139480.KS', name:'이마트',           name_en:'E-Mart',                sector:'CONSUMER',   current_price:62800,  market_cap:1.7e12, volatility_30d:0.22, beta:0.78, debt_ratio:0.62, liquidity_volume:280000,   is_etf:false, alias:'emart' },
  { ticker:'282330.KS', name:'BGF리테일',        name_en:'BGF Retail',            sector:'CONSUMER',   current_price:118000, market_cap:2.0e12, volatility_30d:0.20, beta:0.68, debt_ratio:0.45, liquidity_volume:78000,    is_etf:false, alias:'bgf retail cu' },
  // === 한국 INDUSTRIAL/etc ===
  { ticker:'028260.KS', name:'삼성물산',         name_en:'Samsung C&T',           sector:'INDUSTRIAL', current_price:158000, market_cap:30e12,  volatility_30d:0.20, beta:0.95, debt_ratio:0.42, liquidity_volume:380000,   is_etf:false, alias:'samsung c&t' },
  { ticker:'003550.KS', name:'LG',               name_en:'LG Holdings',           sector:'IT',         current_price:81200,  market_cap:13e12,  volatility_30d:0.22, beta:1.05, debt_ratio:0.38, liquidity_volume:340000,   is_etf:false, alias:'lg holdings' },

  // === 한국 통신 (Telecom) ===
  { ticker:'030200.KS', name:'KT',               name_en:'KT Corporation',        sector:'IT',         current_price:42850,  market_cap:11e12,  volatility_30d:0.16, beta:0.55, debt_ratio:0.62, liquidity_volume:680000,   is_etf:false, alias:'kt 케이티 통신' },
  { ticker:'017670.KS', name:'SK텔레콤',         name_en:'SK Telecom',            sector:'IT',         current_price:55400,  market_cap:12e12,  volatility_30d:0.14, beta:0.48, debt_ratio:0.65, liquidity_volume:520000,   is_etf:false, alias:'sk telecom skt 통신' },
  { ticker:'032640.KS', name:'LG유플러스',       name_en:'LG U+',                 sector:'IT',         current_price:9820,   market_cap:4.3e12, volatility_30d:0.16, beta:0.58, debt_ratio:0.68, liquidity_volume:1100000,  is_etf:false, alias:'lg uplus lgu 통신' },
  // === 한국 게임 (Game) ===
  { ticker:'036570.KS', name:'엔씨소프트',       name_en:'NCsoft',                sector:'IT',         current_price:215000, market_cap:4.7e12, volatility_30d:0.34, beta:1.15, debt_ratio:0.18, liquidity_volume:120000,   is_etf:false, alias:'ncsoft 엔씨' },
  { ticker:'259960.KS', name:'크래프톤',         name_en:'Krafton',               sector:'IT',         current_price:298000, market_cap:14.5e12,volatility_30d:0.40, beta:1.32, debt_ratio:0.12, liquidity_volume:280000,   is_etf:false, alias:'krafton 배그 pubg' },
  { ticker:'112040.KS', name:'위메이드',         name_en:'Wemade',                sector:'IT',         current_price:38500,  market_cap:1.3e12, volatility_30d:0.55, beta:1.55, debt_ratio:0.35, liquidity_volume:480000,   is_etf:false, alias:'wemade 위메이드' },
  // === 한국 철강 (Steel) ===
  { ticker:'005490.KS', name:'POSCO홀딩스',      name_en:'POSCO Holdings',        sector:'INDUSTRIAL', current_price:298000, market_cap:25e12,  volatility_30d:0.32, beta:1.28, debt_ratio:0.42, liquidity_volume:280000,   is_etf:false, alias:'posco 포스코 철강' },
  { ticker:'003670.KS', name:'포스코퓨처엠',     name_en:'POSCO Future M',        sector:'INDUSTRIAL', current_price:185000, market_cap:14e12,  volatility_30d:0.46, beta:1.62, debt_ratio:0.55, liquidity_volume:380000,   is_etf:false, alias:'posco future m 양극재' },
  // === 한국 2차전지 ===
  { ticker:'086520.KS', name:'에코프로',         name_en:'EcoPro',                sector:'INDUSTRIAL', current_price:62800,  market_cap:8.4e12, volatility_30d:0.62, beta:1.85, debt_ratio:0.42, liquidity_volume:1200000,  is_etf:false, alias:'ecopro 에코프로 2차전지' },
  { ticker:'247540.KS', name:'에코프로비엠',     name_en:'EcoPro BM',             sector:'INDUSTRIAL', current_price:158000, market_cap:15.5e12,volatility_30d:0.58, beta:1.78, debt_ratio:0.48, liquidity_volume:680000,   is_etf:false, alias:'ecopro bm 양극재' },
  // === 한국 해운/항공 ===
  { ticker:'011200.KS', name:'HMM',              name_en:'HMM',                   sector:'INDUSTRIAL', current_price:18800,  market_cap:11e12,  volatility_30d:0.42, beta:1.22, debt_ratio:0.38, liquidity_volume:3800000,  is_etf:false, alias:'hmm 현대상선 해운' },
  { ticker:'003490.KS', name:'대한항공',         name_en:'Korean Air',            sector:'INDUSTRIAL', current_price:23150,  market_cap:8.5e12, volatility_30d:0.36, beta:1.18, debt_ratio:0.72, liquidity_volume:680000,   is_etf:false, alias:'korean air 대한항공' },
  // === 한국 기타 대형주 ===
  { ticker:'010140.KS', name:'삼성중공업',       name_en:'Samsung Heavy',         sector:'INDUSTRIAL', current_price:9820,   market_cap:8.5e12, volatility_30d:0.42, beta:1.55, debt_ratio:0.78, liquidity_volume:5200000,  is_etf:false, alias:'samsung heavy 조선' },
  { ticker:'161390.KS', name:'한국타이어앤테크놀로지', name_en:'Hankook Tire',     sector:'AUTO',       current_price:48800,  market_cap:6.0e12, volatility_30d:0.28, beta:1.12, debt_ratio:0.42, liquidity_volume:380000,   is_etf:false, alias:'hankook tire 타이어' },
  { ticker:'035250.KS', name:'강원랜드',         name_en:'Kangwon Land',          sector:'CONSUMER',   current_price:14850,  market_cap:3.2e12, volatility_30d:0.24, beta:0.88, debt_ratio:0.32, liquidity_volume:480000,   is_etf:false, alias:'kangwon land 강원랜드 카지노' },

  // === 한국 방산/우주항공 ===
  { ticker:'047810.KS', name:'한국항공우주',     name_en:'Korea Aerospace Industries (KAI)', sector:'INDUSTRIAL', current_price:58200,  market_cap:5.7e12, volatility_30d:0.32, beta:1.18, debt_ratio:0.55, liquidity_volume:680000, is_etf:false, alias:'kai aerospace 방산 우주 항공우주' },
  { ticker:'012450.KS', name:'한화에어로스페이스', name_en:'Hanwha Aerospace',              sector:'INDUSTRIAL', current_price:218000, market_cap:11e12,  volatility_30d:0.36, beta:1.22, debt_ratio:0.58, liquidity_volume:340000, is_etf:false, alias:'hanwha aerospace 한화 방산 우주' },
  { ticker:'064350.KS', name:'현대로템',         name_en:'Hyundai Rotem',                 sector:'INDUSTRIAL', current_price:48900,  market_cap:4.1e12, volatility_30d:0.34, beta:1.15, debt_ratio:0.62, liquidity_volume:520000, is_etf:false, alias:'hyundai rotem 현대로템 방산 전차' },
  { ticker:'079550.KS', name:'LIG넥스원',        name_en:'LIG Nex1',                      sector:'INDUSTRIAL', current_price:178500, market_cap:3.9e12, volatility_30d:0.30, beta:1.08, debt_ratio:0.42, liquidity_volume:180000, is_etf:false, alias:'lig nex1 방산 미사일' },
  { ticker:'042660.KS', name:'한화오션',         name_en:'Hanwha Ocean',                  sector:'INDUSTRIAL', current_price:32400,  market_cap:9.5e12, volatility_30d:0.42, beta:1.45, debt_ratio:0.72, liquidity_volume:1800000, is_etf:false, alias:'hanwha ocean 방산 잠수함 조선 dsme' },

  // === 한국 화장품/뷰티 ===
  { ticker:'090430.KS', name:'아모레퍼시픽',     name_en:'AmorePacific',                  sector:'CONSUMER',   current_price:148000, market_cap:8.6e12, volatility_30d:0.28, beta:0.92, debt_ratio:0.32, liquidity_volume:280000, is_etf:false, alias:'amorepacific 아모레 화장품 뷰티 cosmetics' },
  { ticker:'161890.KS', name:'한국콜마',         name_en:'Kolmar Korea',                  sector:'CONSUMER',   current_price:62800,  market_cap:1.5e12, volatility_30d:0.32, beta:0.95, debt_ratio:0.45, liquidity_volume:180000, is_etf:false, alias:'kolmar 한국콜마 화장품 oem' },
  { ticker:'214450.KS', name:'파마리서치',       name_en:'Pharma Research',               sector:'BIO',        current_price:208000, market_cap:1.8e12, volatility_30d:0.36, beta:1.05, debt_ratio:0.18, liquidity_volume:78000,  is_etf:false, alias:'pharma research 파마리서치 화장품 의료' },

  // === 한국 의료기기/제약 ===
  { ticker:'145020.KS', name:'휴젤',             name_en:'Hugel',                          sector:'BIO',        current_price:295000, market_cap:3.6e12, volatility_30d:0.34, beta:1.05, debt_ratio:0.18, liquidity_volume:78000,  is_etf:false, alias:'hugel 휴젤 보톡스 의료기기' },
  { ticker:'085660.KS', name:'차바이오텍',       name_en:'CHA Biotech',                    sector:'BIO',        current_price:14200,  market_cap:0.85e12,volatility_30d:0.55, beta:1.45, debt_ratio:0.42, liquidity_volume:380000, is_etf:false, alias:'cha biotech 차바이오 줄기세포' },

  // === 미국 방산 ===
  { ticker:'LMT',  name:'Lockheed Martin',  sector:'INDUSTRIAL', current_price:482, market_cap:118e9, volatility_30d:0.20, beta:0.62, debt_ratio:0.55, liquidity_volume:1200000, is_etf:false, alias:'lockheed martin 방산 lmt defense' },
  { ticker:'RTX',  name:'RTX (Raytheon)',   sector:'INDUSTRIAL', current_price:118, market_cap:158e9, volatility_30d:0.22, beta:0.72, debt_ratio:0.48, liquidity_volume:6800000, is_etf:false, alias:'raytheon rtx 방산 defense' },
  { ticker:'NOC',  name:'Northrop Grumman', sector:'INDUSTRIAL', current_price:512, market_cap:75e9,  volatility_30d:0.20, beta:0.58, debt_ratio:0.52, liquidity_volume:680000,  is_etf:false, alias:'northrop grumman 방산 noc defense' },

  // === 미국 빅캡 추가 ===
  { ticker:'BRK.B',name:'Berkshire Hathaway',sector:'FIN',       current_price:432, market_cap:935e9, volatility_30d:0.14, beta:0.85, debt_ratio:0.32, liquidity_volume:3800000, is_etf:false, alias:'berkshire hathaway buffett brk' },
  { ticker:'COST', name:'Costco',           sector:'CONSUMER',   current_price:912, market_cap:404e9, volatility_30d:0.16, beta:0.78, debt_ratio:0.42, liquidity_volume:2100000, is_etf:false, alias:'costco 코스트코' },
  { ticker:'NKE',  name:'Nike',             sector:'CONSUMER',   current_price:78,  market_cap:118e9, volatility_30d:0.26, beta:1.08, debt_ratio:0.48, liquidity_volume:8200000, is_etf:false, alias:'nike 나이키' },

  // === 한국 추가 종목 (인프라·중공업·반도체장비) ===
  { ticker:'010950.KS', name:'S-Oil',          name_en:'S-Oil',                    sector:'ENERGY',     current_price:62800,  market_cap:7.1e12, volatility_30d:0.30, beta:1.18, debt_ratio:0.55, liquidity_volume:380000, is_etf:false, alias:'s oil sk-1 정유' },
  { ticker:'011170.KS', name:'롯데케미칼',     name_en:'Lotte Chemical',           sector:'INDUSTRIAL', current_price:88500,  market_cap:3.8e12, volatility_30d:0.34, beta:1.32, debt_ratio:0.62, liquidity_volume:280000, is_etf:false, alias:'lotte chemical 롯데케미칼 화학' },
  { ticker:'042700.KS', name:'한미반도체',     name_en:'Hanmi Semiconductor',      sector:'IT',         current_price:138000, market_cap:13e12,  volatility_30d:0.52, beta:1.78, debt_ratio:0.28, liquidity_volume:680000, is_etf:false, alias:'hanmi semi 한미반도체 hbm 반도체장비' },
  { ticker:'009150.KS', name:'삼성전기',       name_en:'Samsung Electro-Mechanics',sector:'IT',         current_price:148000, market_cap:11e12,  volatility_30d:0.28, beta:1.22, debt_ratio:0.42, liquidity_volume:480000, is_etf:false, alias:'samsung electro 전자부품 mlcc' },
  { ticker:'011070.KS', name:'LG이노텍',       name_en:'LG Innotek',                sector:'IT',         current_price:198000, market_cap:4.7e12, volatility_30d:0.34, beta:1.28, debt_ratio:0.45, liquidity_volume:240000, is_etf:false, alias:'lg innotek 카메라모듈 부품' },
  { ticker:'034020.KS', name:'두산에너빌리티', name_en:'Doosan Enerbility',         sector:'ENERGY',     current_price:24800,  market_cap:15.8e12,volatility_30d:0.42, beta:1.55, debt_ratio:0.65, liquidity_volume:5200000,is_etf:false, alias:'doosan enerbility 두산 원전 풍력' },
  { ticker:'021240.KS', name:'코웨이',         name_en:'Coway',                     sector:'CONSUMER',   current_price:62500,  market_cap:4.6e12, volatility_30d:0.20, beta:0.78, debt_ratio:0.42, liquidity_volume:180000, is_etf:false, alias:'coway 코웨이 정수기 렌탈' },
  { ticker:'029780.KS', name:'삼성카드',       name_en:'Samsung Card',              sector:'FIN',        current_price:42500,  market_cap:4.9e12, volatility_30d:0.18, beta:0.85, debt_ratio:0.82, liquidity_volume:120000, is_etf:false, alias:'samsung card 삼성카드 카드' },
  { ticker:'000720.KS', name:'현대건설',       name_en:'Hyundai E&C',               sector:'INDUSTRIAL', current_price:38200,  market_cap:4.3e12, volatility_30d:0.32, beta:1.18, debt_ratio:0.62, liquidity_volume:580000, is_etf:false, alias:'hyundai engineering 현대건설 건설' },
  { ticker:'051600.KS', name:'한전KPS',        name_en:'KEPCO KPS',                 sector:'ENERGY',     current_price:48500,  market_cap:2.2e12, volatility_30d:0.22, beta:0.72, debt_ratio:0.32, liquidity_volume:120000, is_etf:false, alias:'kepco kps 한전 원전 정비' },

  // === 미국 추가 종목 ===
  { ticker:'INTC', name:'Intel',                 sector:'IT',         current_price:24.5,  market_cap:106e9, volatility_30d:0.38, beta:1.15, debt_ratio:0.42, liquidity_volume:62000000, is_etf:false, alias:'intel 인텔 반도체' },
  { ticker:'IBM',  name:'IBM',                   sector:'IT',         current_price:218,   market_cap:202e9, volatility_30d:0.18, beta:0.82, debt_ratio:0.72, liquidity_volume:5800000,  is_etf:false, alias:'ibm 클라우드' },
  { ticker:'BA',   name:'Boeing',                sector:'INDUSTRIAL', current_price:178,   market_cap:108e9, volatility_30d:0.34, beta:1.42, debt_ratio:0.85, liquidity_volume:8200000,  is_etf:false, alias:'boeing 보잉 항공 방산' },
  { ticker:'CAT',  name:'Caterpillar',           sector:'INDUSTRIAL', current_price:392,   market_cap:194e9, volatility_30d:0.24, beta:1.05, debt_ratio:0.62, liquidity_volume:2800000,  is_etf:false, alias:'caterpillar 캐터필러 건설장비' },
  { ticker:'UNH',  name:'UnitedHealth',          sector:'BIO',        current_price:582,   market_cap:548e9, volatility_30d:0.18, beta:0.62, debt_ratio:0.48, liquidity_volume:3200000,  is_etf:false, alias:'unitedhealth unh 헬스케어 의료보험' },
  { ticker:'COIN', name:'Coinbase',              sector:'FIN',        current_price:218,   market_cap:55e9,  volatility_30d:0.78, beta:2.45, debt_ratio:0.32, liquidity_volume:8200000,  is_etf:false, alias:'coinbase 코인베이스 crypto 암호화폐' },
  { ticker:'PYPL', name:'PayPal',                sector:'FIN',        current_price:78,    market_cap:78e9,  volatility_30d:0.32, beta:1.42, debt_ratio:0.45, liquidity_volume:14000000, is_etf:false, alias:'paypal 페이팔 결제' },
  { ticker:'UBER', name:'Uber',                  sector:'IT',         current_price:74,    market_cap:154e9, volatility_30d:0.36, beta:1.32, debt_ratio:0.52, liquidity_volume:18000000, is_etf:false, alias:'uber 우버 모빌리티' },
  { ticker:'ABNB', name:'Airbnb',                sector:'CONSUMER',   current_price:142,   market_cap:88e9,  volatility_30d:0.32, beta:1.18, debt_ratio:0.28, liquidity_volume:5800000,  is_etf:false, alias:'airbnb 에어비앤비' },

  // === 미국 섹터 ETF 추가 ===
  { ticker:'XLP',  name:'Consumer Staples Select', sector:'CONSUMER',  current_price:82,   market_cap:18e9,  volatility_30d:0.12, beta:0.55, debt_ratio:0.00, liquidity_volume:7200000,  is_etf:true, alias:'xlp consumer staples 필수소비재' },
  { ticker:'XLY',  name:'Consumer Discretionary',  sector:'CONSUMER',  current_price:208,  market_cap:22e9,  volatility_30d:0.20, beta:1.18, debt_ratio:0.00, liquidity_volume:4200000,  is_etf:true, alias:'xly consumer discretionary 임의소비재' },
  { ticker:'XLU',  name:'Utilities Select',        sector:'ENERGY',    current_price:78,   market_cap:16e9,  volatility_30d:0.16, beta:0.55, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'xlu utilities 유틸리티' },
  { ticker:'XLI',  name:'Industrial Select',       sector:'INDUSTRIAL',current_price:138,  market_cap:18e9,  volatility_30d:0.18, beta:1.10, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'xli industrials 산업' },
  { ticker:'VNQ',  name:'Vanguard Real Estate',    sector:'REALESTATE',current_price:94,   market_cap:32e9,  volatility_30d:0.22, beta:0.85, debt_ratio:0.00, liquidity_volume:3800000,  is_etf:true, alias:'vnq real estate 부동산 reit' },
  { ticker:'EWJ',  name:'iShares MSCI Japan',      sector:'GLOBAL_ETF',current_price:74,   market_cap:14e9,  volatility_30d:0.16, beta:0.78, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'ewj japan 일본' },
  { ticker:'INDA', name:'iShares MSCI India',      sector:'GLOBAL_ETF',current_price:54,   market_cap:9e9,   volatility_30d:0.20, beta:0.92, debt_ratio:0.00, liquidity_volume:5800000,  is_etf:true, alias:'inda india 인도' },

  // === 한국 추가 — 금융·식품·엔터·바이오 ===
  { ticker:'032830.KS', name:'삼성생명',        name_en:'Samsung Life',         sector:'FIN',        current_price:118500, market_cap:23e12,  volatility_30d:0.20, beta:0.88, debt_ratio:0.78, liquidity_volume:280000, is_etf:false, alias:'samsung life 삼성생명 보험' },
  { ticker:'000810.KS', name:'삼성화재',        name_en:'Samsung Fire',         sector:'FIN',        current_price:332000, market_cap:16e12,  volatility_30d:0.18, beta:0.72, debt_ratio:0.65, liquidity_volume:38000,  is_etf:false, alias:'samsung fire 삼성화재 보험' },
  { ticker:'088350.KS', name:'한화생명',        name_en:'Hanwha Life',          sector:'FIN',        current_price:3420,   market_cap:2.9e12, volatility_30d:0.22, beta:0.95, debt_ratio:0.82, liquidity_volume:780000, is_etf:false, alias:'hanwha life 한화생명 보험' },
  { ticker:'138040.KS', name:'메리츠금융지주',  name_en:'Meritz Financial',     sector:'FIN',        current_price:78900,  market_cap:14e12,  volatility_30d:0.22, beta:0.92, debt_ratio:0.78, liquidity_volume:380000, is_etf:false, alias:'meritz 메리츠 금융' },
  { ticker:'323410.KS', name:'카카오뱅크',      name_en:'Kakao Bank',           sector:'FIN',        current_price:24800,  market_cap:11e12,  volatility_30d:0.30, beta:1.18, debt_ratio:0.85, liquidity_volume:2200000,is_etf:false, alias:'kakao bank 카카오뱅크 인터넷은행' },
  { ticker:'293490.KS', name:'카카오게임즈',    name_en:'Kakao Games',          sector:'IT',         current_price:18500,  market_cap:1.6e12, volatility_30d:0.42, beta:1.42, debt_ratio:0.32, liquidity_volume:680000, is_etf:false, alias:'kakao games 카카오게임즈 게임' },
  { ticker:'263750.KS', name:'펄어비스',        name_en:'Pearl Abyss',          sector:'IT',         current_price:38200,  market_cap:2.5e12, volatility_30d:0.45, beta:1.38, debt_ratio:0.18, liquidity_volume:480000, is_etf:false, alias:'pearl abyss 펄어비스 검은사막 게임' },
  { ticker:'352820.KS', name:'HYBE',            name_en:'HYBE',                  sector:'CONSUMER',   current_price:218000, market_cap:9.2e12, volatility_30d:0.36, beta:1.25, debt_ratio:0.32, liquidity_volume:240000, is_etf:false, alias:'hybe bts 하이브 엔터' },
  { ticker:'041510.KS', name:'SM',              name_en:'SM Entertainment',     sector:'CONSUMER',   current_price:78500,  market_cap:1.9e12, volatility_30d:0.40, beta:1.25, debt_ratio:0.35, liquidity_volume:280000, is_etf:false, alias:'sm entertainment 에스엠 sm 엔터' },
  { ticker:'035900.KS', name:'JYP',             name_en:'JYP Entertainment',    sector:'CONSUMER',   current_price:62800,  market_cap:2.2e12, volatility_30d:0.38, beta:1.22, debt_ratio:0.18, liquidity_volume:380000, is_etf:false, alias:'jyp entertainment jyp 엔터' },
  { ticker:'051900.KS', name:'LG생활건강',      name_en:'LG H&H',               sector:'CONSUMER',   current_price:325000, market_cap:5.1e12, volatility_30d:0.24, beta:0.78, debt_ratio:0.38, liquidity_volume:62000,  is_etf:false, alias:'lg h&h 생활건강 화장품' },
  { ticker:'003230.KS', name:'삼양식품',        name_en:'Samyang Foods',         sector:'CONSUMER',   current_price:625000, market_cap:4.7e12, volatility_30d:0.42, beta:0.95, debt_ratio:0.32, liquidity_volume:62000,  is_etf:false, alias:'samyang foods 삼양 불닭 식품' },
  { ticker:'004370.KS', name:'농심',            name_en:'Nongshim',             sector:'CONSUMER',   current_price:418000, market_cap:2.5e12, volatility_30d:0.20, beta:0.62, debt_ratio:0.25, liquidity_volume:14000,  is_etf:false, alias:'nongshim 농심 라면 식품' },
  { ticker:'008770.KS', name:'호텔신라',        name_en:'Hotel Shilla',         sector:'CONSUMER',   current_price:48500,  market_cap:1.9e12, volatility_30d:0.30, beta:1.12, debt_ratio:0.62, liquidity_volume:280000, is_etf:false, alias:'shilla hotel 호텔신라 면세' },
  { ticker:'302440.KS', name:'SK바이오사이언스',name_en:'SK Bioscience',        sector:'BIO',        current_price:62800,  market_cap:4.8e12, volatility_30d:0.42, beta:1.18, debt_ratio:0.18, liquidity_volume:380000, is_etf:false, alias:'sk bioscience 백신 바이오' },
  { ticker:'091990.KS', name:'셀트리온헬스케어',name_en:'Celltrion Healthcare', sector:'BIO',        current_price:78500,  market_cap:11e12,  volatility_30d:0.40, beta:1.18, debt_ratio:0.32, liquidity_volume:580000, is_etf:false, alias:'celltrion healthcare 셀트리온헬스' },
  { ticker:'006400.KS', name:'삼성SDI',         name_en:'Samsung SDI',          sector:'INDUSTRIAL', current_price:325000, market_cap:22e12,  volatility_30d:0.36, beta:1.40, debt_ratio:0.48, liquidity_volume:380000, is_etf:false, alias:'samsung sdi 삼성에스디아이 배터리' },
  { ticker:'018260.KS', name:'삼성에스디에스',  name_en:'Samsung SDS',          sector:'IT',         current_price:148000, market_cap:11e12,  volatility_30d:0.22, beta:0.88, debt_ratio:0.32, liquidity_volume:78000,  is_etf:false, alias:'samsung sds 삼성에스디에스 it서비스' },
  { ticker:'180640.KS', name:'한진칼',          name_en:'Hanjin KAL',           sector:'INDUSTRIAL', current_price:65800,  market_cap:4.4e12, volatility_30d:0.34, beta:1.22, debt_ratio:0.55, liquidity_volume:120000, is_etf:false, alias:'hanjin kal 한진칼 한진' },
  { ticker:'028670.KS', name:'팬오션',          name_en:'Pan Ocean',            sector:'INDUSTRIAL', current_price:3850,   market_cap:2.1e12, volatility_30d:0.34, beta:1.18, debt_ratio:0.52, liquidity_volume:6800000,is_etf:false, alias:'pan ocean 팬오션 해운 벌크' },

  // === 미국 추가 — 빅캡·중국 ADR·반도체·소프트웨어·EV ===
  { ticker:'BABA', name:'Alibaba',                  sector:'IT',       current_price:118,  market_cap:298e9, volatility_30d:0.34, beta:1.18, debt_ratio:0.32, liquidity_volume:14000000, is_etf:false, alias:'alibaba 알리바바 baba 중국' },
  { ticker:'JD',   name:'JD.com',                   sector:'CONSUMER', current_price:38,   market_cap:58e9,  volatility_30d:0.36, beta:1.25, debt_ratio:0.42, liquidity_volume:18000000, is_etf:false, alias:'jd 징둥 중국' },
  { ticker:'BIDU', name:'Baidu',                    sector:'IT',       current_price:88,   market_cap:31e9,  volatility_30d:0.38, beta:1.32, debt_ratio:0.28, liquidity_volume:2200000,  is_etf:false, alias:'baidu 바이두 중국 검색' },
  { ticker:'TSM',  name:'Taiwan Semiconductor',     sector:'IT',       current_price:198,  market_cap:1020e9,volatility_30d:0.30, beta:1.18, debt_ratio:0.18, liquidity_volume:18000000, is_etf:false, alias:'tsmc taiwan semi 대만 반도체 파운드리' },
  { ticker:'ASML', name:'ASML',                     sector:'IT',       current_price:728,  market_cap:298e9, volatility_30d:0.32, beta:1.32, debt_ratio:0.22, liquidity_volume:1200000,  is_etf:false, alias:'asml 노광장비 반도체' },
  { ticker:'AVGO', name:'Broadcom',                 sector:'IT',       current_price:1782, market_cap:825e9, volatility_30d:0.32, beta:1.18, debt_ratio:0.55, liquidity_volume:2200000,  is_etf:false, alias:'broadcom avgo 반도체' },
  { ticker:'MU',   name:'Micron',                   sector:'IT',       current_price:108,  market_cap:118e9, volatility_30d:0.45, beta:1.62, debt_ratio:0.32, liquidity_volume:18000000, is_etf:false, alias:'micron 마이크론 메모리 반도체' },
  { ticker:'ADBE', name:'Adobe',                    sector:'IT',       current_price:548,  market_cap:248e9, volatility_30d:0.28, beta:1.18, debt_ratio:0.28, liquidity_volume:2400000,  is_etf:false, alias:'adobe 어도비 소프트웨어' },
  { ticker:'INTU', name:'Intuit',                   sector:'IT',       current_price:642,  market_cap:178e9, volatility_30d:0.24, beta:1.25, debt_ratio:0.32, liquidity_volume:1100000,  is_etf:false, alias:'intuit 인튜이트 quickbooks' },
  { ticker:'CRWD', name:'CrowdStrike',              sector:'IT',       current_price:328,  market_cap:78e9,  volatility_30d:0.42, beta:1.45, debt_ratio:0.18, liquidity_volume:3200000,  is_etf:false, alias:'crowdstrike crwd 사이버보안' },
  { ticker:'NET',  name:'Cloudflare',               sector:'IT',       current_price:88,   market_cap:30e9,  volatility_30d:0.48, beta:1.52, debt_ratio:0.22, liquidity_volume:5200000,  is_etf:false, alias:'cloudflare 클라우드플레어 cdn' },
  { ticker:'DDOG', name:'Datadog',                  sector:'IT',       current_price:128,  market_cap:42e9,  volatility_30d:0.42, beta:1.55, debt_ratio:0.18, liquidity_volume:3800000,  is_etf:false, alias:'datadog 데이터독 모니터링' },
  { ticker:'SNOW', name:'Snowflake',                sector:'IT',       current_price:172,  market_cap:55e9,  volatility_30d:0.45, beta:1.65, debt_ratio:0.22, liquidity_volume:6500000,  is_etf:false, alias:'snowflake 스노우플레이크 데이터' },
  { ticker:'PLTR', name:'Palantir',                 sector:'IT',       current_price:78,   market_cap:175e9, volatility_30d:0.55, beta:1.85, debt_ratio:0.12, liquidity_volume:78000000, is_etf:false, alias:'palantir 팔란티어' },
  { ticker:'NIO',  name:'NIO',                      sector:'AUTO',     current_price:6.2,  market_cap:13e9,  volatility_30d:0.65, beta:2.15, debt_ratio:0.62, liquidity_volume:48000000, is_etf:false, alias:'nio 니오 중국 전기차' },
  { ticker:'RIVN', name:'Rivian',                   sector:'AUTO',     current_price:12.8, market_cap:13e9,  volatility_30d:0.72, beta:2.25, debt_ratio:0.45, liquidity_volume:38000000, is_etf:false, alias:'rivian 리비안 전기차' },
  { ticker:'BLK',  name:'BlackRock',                sector:'FIN',      current_price:932,  market_cap:138e9, volatility_30d:0.20, beta:1.18, debt_ratio:0.55, liquidity_volume:680000,   is_etf:false, alias:'blackrock 블랙록 자산운용' },
  { ticker:'C',    name:'Citigroup',                sector:'FIN',      current_price:62,   market_cap:118e9, volatility_30d:0.24, beta:1.42, debt_ratio:0.88, liquidity_volume:14000000, is_etf:false, alias:'citi citigroup 시티 은행' },
  { ticker:'WFC',  name:'Wells Fargo',              sector:'FIN',      current_price:62,   market_cap:215e9, volatility_30d:0.22, beta:1.18, debt_ratio:0.85, liquidity_volume:18000000, is_etf:false, alias:'wells fargo 웰스파고 은행' },
  { ticker:'AXP',  name:'American Express',         sector:'FIN',      current_price:268,  market_cap:195e9, volatility_30d:0.20, beta:1.18, debt_ratio:0.72, liquidity_volume:2800000,  is_etf:false, alias:'amex american express 아멕스 카드' },
  { ticker:'ABBV', name:'AbbVie',                   sector:'BIO',      current_price:178,  market_cap:315e9, volatility_30d:0.18, beta:0.62, debt_ratio:0.78, liquidity_volume:5800000,  is_etf:false, alias:'abbvie 애브비 제약' },
  { ticker:'TMO',  name:'Thermo Fisher',            sector:'BIO',      current_price:582,  market_cap:222e9, volatility_30d:0.20, beta:0.88, debt_ratio:0.42, liquidity_volume:1400000,  is_etf:false, alias:'thermo fisher 써모피셔' },
  { ticker:'AMGN', name:'Amgen',                    sector:'BIO',      current_price:282,  market_cap:152e9, volatility_30d:0.18, beta:0.62, debt_ratio:0.85, liquidity_volume:2400000,  is_etf:false, alias:'amgen 암젠 제약' },
  { ticker:'UPS',  name:'United Parcel Service',    sector:'INDUSTRIAL',current_price:128, market_cap:108e9, volatility_30d:0.22, beta:0.92, debt_ratio:0.75, liquidity_volume:4200000,  is_etf:false, alias:'ups 유피에스 물류' },
  { ticker:'FDX',  name:'FedEx',                    sector:'INDUSTRIAL',current_price:268, market_cap:65e9,  volatility_30d:0.24, beta:1.05, debt_ratio:0.72, liquidity_volume:1200000,  is_etf:false, alias:'fedex 페덱스 물류' },

  // === ETF 추가 — 인컴·총시장·반도체·바이오·테마 ===
  { ticker:'AGG',  name:'iShares Core US Bond',     sector:'GLOBAL_ETF',current_price:98,   market_cap:118e9, volatility_30d:0.06, beta:0.10, debt_ratio:0.00, liquidity_volume:7500000,  is_etf:true, alias:'agg us bond 채권 종합' },
  { ticker:'SCHD', name:'Schwab US Dividend',       sector:'GLOBAL_ETF',current_price:78,   market_cap:62e9,  volatility_30d:0.13, beta:0.85, debt_ratio:0.00, liquidity_volume:5200000,  is_etf:true, alias:'schd schwab dividend 배당' },
  { ticker:'VYM',  name:'Vanguard High Dividend',   sector:'GLOBAL_ETF',current_price:122,  market_cap:55e9,  volatility_30d:0.13, beta:0.85, debt_ratio:0.00, liquidity_volume:1100000,  is_etf:true, alias:'vym high dividend 고배당 vanguard' },
  { ticker:'VIG',  name:'Vanguard Dividend Apprec', sector:'GLOBAL_ETF',current_price:188,  market_cap:88e9,  volatility_30d:0.14, beta:0.92, debt_ratio:0.00, liquidity_volume:780000,   is_etf:true, alias:'vig dividend appreciation 배당성장' },
  { ticker:'IEFA', name:'iShares Core MSCI EAFE',   sector:'GLOBAL_ETF',current_price:78,   market_cap:118e9, volatility_30d:0.14, beta:0.78, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'iefa eafe international' },
  { ticker:'IEMG', name:'iShares Core Emerging',    sector:'GLOBAL_ETF',current_price:54,   market_cap:78e9,  volatility_30d:0.18, beta:0.92, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'iemg emerging markets 신흥국' },
  { ticker:'FXI',  name:'iShares China Large-Cap',  sector:'GLOBAL_ETF',current_price:32,   market_cap:5.5e9, volatility_30d:0.32, beta:1.12, debt_ratio:0.00, liquidity_volume:55000000, is_etf:true, alias:'fxi china 중국' },
  { ticker:'KWEB', name:'KraneShares China Internet',sector:'IT',       current_price:30,   market_cap:5.2e9, volatility_30d:0.42, beta:1.42, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'kweb china internet 중국 인터넷' },
  { ticker:'SOXX', name:'iShares Semiconductor',    sector:'IT',        current_price:218,  market_cap:11e9,  volatility_30d:0.32, beta:1.55, debt_ratio:0.00, liquidity_volume:1800000,  is_etf:true, alias:'soxx semiconductor 반도체' },
  { ticker:'SMH',  name:'VanEck Semiconductor',     sector:'IT',        current_price:248,  market_cap:25e9,  volatility_30d:0.32, beta:1.55, debt_ratio:0.00, liquidity_volume:5800000,  is_etf:true, alias:'smh semiconductor 반도체' },
  { ticker:'IBB',  name:'iShares Biotech',          sector:'BIO',       current_price:138,  market_cap:7.2e9, volatility_30d:0.22, beta:0.92, debt_ratio:0.00, liquidity_volume:2200000,  is_etf:true, alias:'ibb biotech 바이오' },
  { ticker:'KRE',  name:'SPDR Regional Banking',    sector:'FIN',       current_price:58,   market_cap:3.8e9, volatility_30d:0.32, beta:1.42, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'kre regional bank 지역은행' },
  { ticker:'IYR',  name:'iShares US Real Estate',   sector:'REALESTATE',current_price:92,   market_cap:4.2e9, volatility_30d:0.22, beta:0.85, debt_ratio:0.00, liquidity_volume:6800000,  is_etf:true, alias:'iyr real estate reit 부동산' },
  { ticker:'JEPI', name:'JPMorgan Equity Premium',  sector:'GLOBAL_ETF',current_price:58,   market_cap:38e9,  volatility_30d:0.10, beta:0.65, debt_ratio:0.00, liquidity_volume:5200000,  is_etf:true, alias:'jepi income premium 인컴' },
  { ticker:'EFA',  name:'iShares MSCI EAFE',        sector:'GLOBAL_ETF',current_price:82,   market_cap:48e9,  volatility_30d:0.14, beta:0.78, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'efa eafe developed 선진국' },

  // === 미국 IT (BIG TECH) ===
  { ticker:'AAPL',  name:'Apple',           sector:'IT',         current_price:228,    market_cap:3500e9, volatility_30d:0.22, beta:1.18, debt_ratio:0.40, liquidity_volume:55000000, is_etf:false, alias:'apple aapl' },
  { ticker:'MSFT',  name:'Microsoft',       sector:'IT',         current_price:432,    market_cap:3200e9, volatility_30d:0.20, beta:0.95, debt_ratio:0.32, liquidity_volume:24000000, is_etf:false, alias:'microsoft msft' },
  { ticker:'GOOGL', name:'Alphabet',        sector:'IT',         current_price:175,    market_cap:2200e9, volatility_30d:0.24, beta:1.05, debt_ratio:0.12, liquidity_volume:32000000, is_etf:false, alias:'alphabet google googl' },
  { ticker:'AMZN',  name:'Amazon',          sector:'IT',         current_price:185,    market_cap:1900e9, volatility_30d:0.30, beta:1.22, debt_ratio:0.46, liquidity_volume:45000000, is_etf:false, alias:'amazon amzn' },
  { ticker:'META',  name:'Meta Platforms',  sector:'IT',         current_price:548,    market_cap:1380e9, volatility_30d:0.32, beta:1.30, debt_ratio:0.18, liquidity_volume:18000000, is_etf:false, alias:'meta facebook fb' },
  { ticker:'NVDA',  name:'NVIDIA',          sector:'IT',         current_price:138,    market_cap:3400e9, volatility_30d:0.48, beta:1.65, debt_ratio:0.20, liquidity_volume:285000000,is_etf:false, alias:'nvidia nvda' },
  { ticker:'NFLX',  name:'Netflix',         sector:'IT',         current_price:712,    market_cap:305e9,  volatility_30d:0.30, beta:1.18, debt_ratio:0.42, liquidity_volume:4200000,  is_etf:false, alias:'netflix nflx' },
  { ticker:'AMD',   name:'AMD',             sector:'IT',         current_price:165,    market_cap:268e9,  volatility_30d:0.45, beta:1.72, debt_ratio:0.22, liquidity_volume:48000000, is_etf:false, alias:'amd advanced micro' },
  { ticker:'CRM',   name:'Salesforce',      sector:'IT',         current_price:285,    market_cap:275e9,  volatility_30d:0.30, beta:1.25, debt_ratio:0.28, liquidity_volume:5800000,  is_etf:false, alias:'salesforce crm' },
  { ticker:'ORCL',  name:'Oracle',          sector:'IT',         current_price:148,    market_cap:412e9,  volatility_30d:0.24, beta:1.05, debt_ratio:0.65, liquidity_volume:8200000,  is_etf:false, alias:'oracle orcl' },
  // === 미국 AUTO ===
  { ticker:'TSLA',  name:'Tesla',           sector:'AUTO',       current_price:218,    market_cap:695e9,  volatility_30d:0.55, beta:1.85, debt_ratio:0.18, liquidity_volume:95000000, is_etf:false, alias:'tesla tsla' },
  { ticker:'F',     name:'Ford',            sector:'AUTO',       current_price:11.2,   market_cap:44e9,   volatility_30d:0.28, beta:1.42, debt_ratio:0.78, liquidity_volume:62000000, is_etf:false, alias:'ford' },
  { ticker:'GM',    name:'General Motors',  sector:'AUTO',       current_price:48.5,   market_cap:54e9,   volatility_30d:0.30, beta:1.45, debt_ratio:0.72, liquidity_volume:18000000, is_etf:false, alias:'gm general motors' },
  // === 미국 FIN ===
  { ticker:'JPM',   name:'JPMorgan Chase',  sector:'FIN',        current_price:218,    market_cap:625e9,  volatility_30d:0.18, beta:1.05, debt_ratio:0.85, liquidity_volume:9200000,  is_etf:false, alias:'jpmorgan chase jpm' },
  { ticker:'BAC',   name:'Bank of America', sector:'FIN',        current_price:42.8,   market_cap:330e9,  volatility_30d:0.22, beta:1.32, debt_ratio:0.86, liquidity_volume:38000000, is_etf:false, alias:'bank of america bac' },
  { ticker:'V',     name:'Visa',            sector:'FIN',        current_price:282,    market_cap:545e9,  volatility_30d:0.18, beta:0.95, debt_ratio:0.32, liquidity_volume:5600000,  is_etf:false, alias:'visa v' },
  { ticker:'MA',    name:'Mastercard',      sector:'FIN',        current_price:498,    market_cap:462e9,  volatility_30d:0.20, beta:1.08, debt_ratio:0.42, liquidity_volume:2900000,  is_etf:false, alias:'mastercard ma' },
  { ticker:'GS',    name:'Goldman Sachs',   sector:'FIN',        current_price:495,    market_cap:160e9,  volatility_30d:0.24, beta:1.40, debt_ratio:0.88, liquidity_volume:1800000,  is_etf:false, alias:'goldman sachs gs' },
  // === 미국 BIO ===
  { ticker:'JNJ',   name:'Johnson & Johnson',sector:'BIO',       current_price:158,    market_cap:380e9,  volatility_30d:0.14, beta:0.55, debt_ratio:0.52, liquidity_volume:7800000,  is_etf:false, alias:'johnson jnj' },
  { ticker:'PFE',   name:'Pfizer',          sector:'BIO',        current_price:28.2,   market_cap:160e9,  volatility_30d:0.22, beta:0.68, debt_ratio:0.62, liquidity_volume:38000000, is_etf:false, alias:'pfizer pfe' },
  { ticker:'LLY',   name:'Eli Lilly',       sector:'BIO',        current_price:792,    market_cap:752e9,  volatility_30d:0.28, beta:0.55, debt_ratio:0.48, liquidity_volume:3200000,  is_etf:false, alias:'eli lilly lly' },
  { ticker:'MRNA',  name:'Moderna',         sector:'BIO',        current_price:38.5,   market_cap:14.7e9, volatility_30d:0.62, beta:1.45, debt_ratio:0.18, liquidity_volume:6800000,  is_etf:false, alias:'moderna mrna' },
  // === 미국 ENERGY ===
  { ticker:'XOM',   name:'ExxonMobil',      sector:'ENERGY',     current_price:118,    market_cap:520e9,  volatility_30d:0.22, beta:0.85, debt_ratio:0.45, liquidity_volume:15000000, is_etf:false, alias:'exxon mobil xom' },
  { ticker:'CVX',   name:'Chevron',         sector:'ENERGY',     current_price:158,    market_cap:295e9,  volatility_30d:0.24, beta:1.10, debt_ratio:0.42, liquidity_volume:7800000,  is_etf:false, alias:'chevron cvx' },
  // === 미국 CONSUMER ===
  { ticker:'WMT',   name:'Walmart',         sector:'CONSUMER',   current_price:84.5,   market_cap:680e9,  volatility_30d:0.16, beta:0.55, debt_ratio:0.62, liquidity_volume:18000000, is_etf:false, alias:'walmart wmt' },
  { ticker:'KO',    name:'Coca-Cola',       sector:'CONSUMER',   current_price:71.5,   market_cap:308e9,  volatility_30d:0.14, beta:0.55, debt_ratio:0.65, liquidity_volume:14000000, is_etf:false, alias:'coca cola ko' },
  { ticker:'PG',    name:'Procter & Gamble',sector:'CONSUMER',   current_price:172,    market_cap:405e9,  volatility_30d:0.14, beta:0.42, debt_ratio:0.58, liquidity_volume:6500000,  is_etf:false, alias:'procter gamble pg' },
  { ticker:'HD',    name:'Home Depot',      sector:'CONSUMER',   current_price:402,    market_cap:398e9,  volatility_30d:0.20, beta:1.05, debt_ratio:0.68, liquidity_volume:3800000,  is_etf:false, alias:'home depot hd' },
  { ticker:'DIS',   name:'Disney',          sector:'CONSUMER',   current_price:96.5,   market_cap:175e9,  volatility_30d:0.26, beta:1.18, debt_ratio:0.45, liquidity_volume:8800000,  is_etf:false, alias:'disney dis' },
  { ticker:'MCD',   name:"McDonald's",      sector:'CONSUMER',   current_price:295,    market_cap:212e9,  volatility_30d:0.16, beta:0.62, debt_ratio:0.78, liquidity_volume:2400000,  is_etf:false, alias:'mcdonalds mcd' },
  { ticker:'SBUX',  name:'Starbucks',       sector:'CONSUMER',   current_price:96.5,   market_cap:110e9,  volatility_30d:0.22, beta:1.08, debt_ratio:0.72, liquidity_volume:5800000,  is_etf:false, alias:'starbucks sbux' },
  // === 미국 REALESTATE ===
  { ticker:'O',     name:'Realty Income',   sector:'REALESTATE', current_price:58.4,   market_cap:51e9,   volatility_30d:0.18, beta:0.78, debt_ratio:0.55, liquidity_volume:5200000,  is_etf:false, alias:'realty income reit' },
  { ticker:'AMT',   name:'American Tower',  sector:'REALESTATE', current_price:218,    market_cap:101e9,  volatility_30d:0.22, beta:0.85, debt_ratio:0.78, liquidity_volume:1800000,  is_etf:false, alias:'american tower amt reit' },

  // === ETF — 미국 광역지수 ===
  { ticker:'SPY',  name:'SPDR S&P500',                  sector:'GLOBAL_ETF', current_price:558,  market_cap:1500e9, volatility_30d:0.14, beta:1.00, debt_ratio:0.00, liquidity_volume:75000000, is_etf:true, alias:'spy s&p 500 sp500' },
  { ticker:'VOO',  name:'Vanguard S&P500',              sector:'GLOBAL_ETF', current_price:512,  market_cap:1200e9, volatility_30d:0.14, beta:1.00, debt_ratio:0.00, liquidity_volume:5200000,  is_etf:true, alias:'voo vanguard sp500' },
  { ticker:'VTI',  name:'Vanguard Total Stock Market',  sector:'GLOBAL_ETF', current_price:282,  market_cap:1700e9, volatility_30d:0.15, beta:1.02, debt_ratio:0.00, liquidity_volume:3800000,  is_etf:true, alias:'vti vanguard total stock' },
  { ticker:'QQQ',  name:'Invesco QQQ Trust',            sector:'GLOBAL_ETF', current_price:485,  market_cap:312e9,  volatility_30d:0.20, beta:1.18, debt_ratio:0.00, liquidity_volume:38000000, is_etf:true, alias:'qqq nasdaq 100 invesco' },
  { ticker:'DIA',  name:'SPDR Dow Jones',               sector:'GLOBAL_ETF', current_price:425,  market_cap:35e9,   volatility_30d:0.13, beta:0.95, debt_ratio:0.00, liquidity_volume:3200000,  is_etf:true, alias:'dia dow jones djia' },
  { ticker:'IWM',  name:'iShares Russell 2000',         sector:'GLOBAL_ETF', current_price:218,  market_cap:62e9,   volatility_30d:0.22, beta:1.18, debt_ratio:0.00, liquidity_volume:42000000, is_etf:true, alias:'iwm russell 2000 small cap' },
  // === ETF — 섹터/테마 ===
  { ticker:'ARKK', name:'ARK Innovation ETF',           sector:'GLOBAL_ETF', current_price:48,   market_cap:5.8e9,  volatility_30d:0.42, beta:1.65, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'arkk ark innovation cathie wood' },
  { ticker:'XLK',  name:'Tech Select Sector SPDR',      sector:'IT',         current_price:218,  market_cap:72e9,   volatility_30d:0.22, beta:1.20, debt_ratio:0.00, liquidity_volume:5800000,  is_etf:true, alias:'xlk tech etf' },
  { ticker:'XLF',  name:'Financial Select Sector SPDR', sector:'FIN',        current_price:46,   market_cap:48e9,   volatility_30d:0.18, beta:1.10, debt_ratio:0.00, liquidity_volume:38000000, is_etf:true, alias:'xlf financial etf' },
  { ticker:'XLE',  name:'Energy Select Sector SPDR',    sector:'ENERGY',     current_price:92,   market_cap:38e9,   volatility_30d:0.26, beta:1.18, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'xle energy etf' },
  { ticker:'XLV',  name:'Health Care Select Sector',    sector:'BIO',        current_price:152,  market_cap:42e9,   volatility_30d:0.16, beta:0.72, debt_ratio:0.00, liquidity_volume:8200000,  is_etf:true, alias:'xlv health bio etf' },
  // === ETF — 글로벌/채권 ===
  { ticker:'VEA',  name:'Vanguard FTSE Developed',      sector:'GLOBAL_ETF', current_price:52,   market_cap:120e9,  volatility_30d:0.16, beta:0.82, debt_ratio:0.00, liquidity_volume:8200000,  is_etf:true, alias:'vea vanguard developed international' },
  { ticker:'VWO',  name:'Vanguard FTSE Emerging',       sector:'GLOBAL_ETF', current_price:48,   market_cap:78e9,   volatility_30d:0.20, beta:0.92, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'vwo emerging markets' },
  { ticker:'BND',  name:'Vanguard Total Bond',          sector:'GLOBAL_ETF', current_price:73,   market_cap:115e9,  volatility_30d:0.06, beta:0.10, debt_ratio:0.00, liquidity_volume:6800000,  is_etf:true, alias:'bnd bond vanguard 채권 본드 종합채권' },
  { ticker:'TLT',  name:'iShares 20+ Year Treasury',    sector:'GLOBAL_ETF', current_price:92,   market_cap:62e9,   volatility_30d:0.14, beta:0.05, debt_ratio:0.00, liquidity_volume:42000000, is_etf:true, alias:'tlt treasury bond long 채권 미국채 국채 장기채' },
  { ticker:'IEF',  name:'iShares 7-10 Year Treasury',   sector:'GLOBAL_ETF', current_price:96,   market_cap:32e9,   volatility_30d:0.08, beta:0.04, debt_ratio:0.00, liquidity_volume:8200000,  is_etf:true, alias:'ief 채권 중기채 미국채' },
  { ticker:'LQD',  name:'iShares Investment Grade Bond',sector:'GLOBAL_ETF', current_price:108,  market_cap:32e9,   volatility_30d:0.10, beta:0.20, debt_ratio:0.00, liquidity_volume:14000000, is_etf:true, alias:'lqd 회사채 채권 corporate bond' },
  { ticker:'HYG',  name:'iShares High Yield Corporate', sector:'GLOBAL_ETF', current_price:78,   market_cap:18e9,   volatility_30d:0.14, beta:0.45, debt_ratio:0.00, liquidity_volume:32000000, is_etf:true, alias:'hyg 하이일드 채권 정크본드 high yield' },
  { ticker:'GLD',  name:'SPDR Gold Trust',              sector:'GLOBAL_ETF', current_price:248,  market_cap:78e9,   volatility_30d:0.14, beta:0.05, debt_ratio:0.00, liquidity_volume:9500000,  is_etf:true, alias:'gld gold 금 원자재 골드' },
  { ticker:'SLV',  name:'iShares Silver Trust',         sector:'GLOBAL_ETF', current_price:30,   market_cap:13e9,   volatility_30d:0.28, beta:0.30, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'slv silver 은 원자재' },
  { ticker:'USO',  name:'United States Oil Fund',       sector:'ENERGY',     current_price:78,   market_cap:1.4e9,  volatility_30d:0.32, beta:1.05, debt_ratio:0.00, liquidity_volume:3200000,  is_etf:true, alias:'uso oil 원유 원자재 crude' },
  { ticker:'DBC',  name:'Invesco DB Commodity Index',   sector:'GLOBAL_ETF', current_price:24,   market_cap:1.6e9,  volatility_30d:0.18, beta:0.55, debt_ratio:0.00, liquidity_volume:2200000,  is_etf:true, alias:'dbc commodity 원자재 종합원자재' },
  { ticker:'DBA',  name:'Invesco DB Agriculture',       sector:'GLOBAL_ETF', current_price:25,   market_cap:0.7e9,  volatility_30d:0.16, beta:0.42, debt_ratio:0.00, liquidity_volume:1800000,  is_etf:true, alias:'dba agriculture 농산물 원자재' },
  // === ETF — 한국 ===
  { ticker:'069500.KS', name:'KODEX 200',           name_en:'KODEX 200 (KOSPI200)',  sector:'GLOBAL_ETF', current_price:38500, market_cap:7.2e12, volatility_30d:0.18, beta:1.00, debt_ratio:0.00, liquidity_volume:8200000,  is_etf:true, alias:'kodex 200 kospi' },
  { ticker:'102110.KS', name:'TIGER 200',           name_en:'TIGER 200 (KOSPI200)',  sector:'GLOBAL_ETF', current_price:38400, market_cap:2.8e12, volatility_30d:0.18, beta:1.00, debt_ratio:0.00, liquidity_volume:1800000,  is_etf:true, alias:'tiger 200 kospi' },
  { ticker:'305720.KS', name:'KODEX 2차전지산업',   name_en:'KODEX Battery Industry',sector:'INDUSTRIAL', current_price:18200, market_cap:0.9e12, volatility_30d:0.42, beta:1.55, debt_ratio:0.00, liquidity_volume:3200000,  is_etf:true, alias:'kodex 2차전지 battery' },
  { ticker:'360750.KS', name:'TIGER 미국S&P500',    name_en:'TIGER US S&P500',       sector:'GLOBAL_ETF', current_price:21800, market_cap:5.1e12, volatility_30d:0.14, beta:1.00, debt_ratio:0.00, liquidity_volume:4200000,  is_etf:true, alias:'tiger 미국 s&p500' },
  { ticker:'379800.KS', name:'KODEX 미국S&P500TR',  name_en:'KODEX US S&P500 TR',    sector:'GLOBAL_ETF', current_price:18900, market_cap:2.2e12, volatility_30d:0.14, beta:1.00, debt_ratio:0.00, liquidity_volume:1800000,  is_etf:true, alias:'kodex 미국 s&p500 tr' },
  { ticker:'381180.KS', name:'TIGER 미국필라델피아반도체나스닥', name_en:'TIGER US Philadelphia Semiconductor', sector:'IT', current_price:14200, market_cap:1.8e12, volatility_30d:0.34, beta:1.45, debt_ratio:0.00, liquidity_volume:2800000, is_etf:true, alias:'tiger 미국 반도체 nasdaq' }
];

const ASSET_BY_TICKER = {};
ASSET_DB.forEach(a => ASSET_BY_TICKER[a.ticker] = a);
// 외부 비동기 로더(applyTickerCatalog/applyDailyPrices)에서 접근하기 위해 window에 노출
window.ASSET_DB = ASSET_DB;
window.ASSET_BY_TICKER = ASSET_BY_TICKER;

// ---------- 기본 샘플 포트폴리오 (수량 기반) ----------
const SAMPLE_HOLDINGS = [
  { ticker:'005930.KS', quantity:120, avg_price:65000 },   // 삼성전자
  { ticker:'000660.KS', quantity:30,  avg_price:140000 },  // SK하이닉스
  { ticker:'068270.KS', quantity:20,  avg_price:200000 },  // 셀트리온
  { ticker:'105560.KS', quantity:40,  avg_price:72000 },   // KB금융
  { ticker:'015760.KS', quantity:100, avg_price:21500 },   // 한국전력
  { ticker:'051910.KS', quantity:6,   avg_price:520000 },  // LG화학
  { ticker:'005380.KS', quantity:8,   avg_price:185000 },  // 현대차
  { ticker:'097950.KS', quantity:5,   avg_price:312000 },  // CJ제일제당
  { ticker:'069500.KS', quantity:40,  avg_price:35000 }    // KODEX 200
];

// 구버전 holdings(weight 기반) → 수량 기반 자동 변환
function migrateHoldings(holdings){
  return holdings.map(h=>{
    if (h.quantity != null) return h; // 이미 신버전
    const a = ASSET_BY_TICKER[h.ticker];
    if (!a) return { ticker:h.ticker, quantity:1, avg_price: h.avg_price ?? 0 };
    // 가격 자릿수로 KRW/USD 추정
    const totalRef = a.current_price > 1000 ? 10_000_000 : 10_000;
    const value = (h.weight || 0) * totalRef;
    return {
      ticker: h.ticker,
      quantity: Math.max(1, Math.round(value / a.current_price)),
      avg_price: h.avg_price ?? a.current_price
    };
  });
}

// ---------- 포트폴리오 상태 (localStorage) ----------
const STORAGE_KEY = 'sphere_portfolios_v1';
const MAX_PORTFOLIOS = 20;
let STATE = loadState();

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw){
      const parsed = JSON.parse(raw);
      if (parsed.portfolios && parsed.portfolios.length){
        // 구버전 데이터 자동 마이그레이션
        parsed.portfolios.forEach(p => { p.holdings = migrateHoldings(p.holdings || []); });
        return parsed;
      }
    }
  } catch(e){ console.warn('localStorage read failed', e); }
  // 첫 실행: 기본 포트폴리오 생성
  const defaultPf = {
    id: 'pf_' + Date.now(),
    name: '포트폴리오 1',
    holdings: SAMPLE_HOLDINGS.slice(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  return { portfolios:[defaultPf], activeId: defaultPf.id };
}

// 수량 → 평가금액 → 비중 자동 계산
function computeWeights(holdings){
  const enriched = holdings.map(h=>{
    const a = ASSET_BY_TICKER[h.ticker];
    const value = (h.quantity || 0) * (a ? a.current_price : 0);
    return { ...h, market_value: value };
  });
  const total = enriched.reduce((s,h)=> s + h.market_value, 0);
  return { items: enriched.map(h => ({ ...h, weight: total>0 ? h.market_value/total : 0 })), totalValue: total };
}
function saveState(showFeedback = false){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
    const totalHoldings = STATE.portfolios.reduce((s,p)=> s + (p.holdings||[]).length, 0);
    console.info(`[SPHERE] State saved · ${STATE.portfolios.length} portfolios · ${totalHoldings} total holdings`);
    if (showFeedback) showToast(t('savedToast'), 'safe');
  }
  catch(e){
    console.warn('localStorage write failed', e);
    if (showFeedback) showToast(t('saveFailToast'), 'high');
  }
}

// 토스트 알림 — 화면 우하단에 잠깐 떴다가 사라짐
function showToast(message, kind = 'safe'){
  const t = document.createElement('div');
  t.className = 'sphere-toast ' + kind;
  t.innerHTML = '<span class="toast-dot"></span>' + message;
  document.body.appendChild(t);
  // mount → animate in
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 350);
  }, 1800);
}
function activePortfolio(){
  return STATE.portfolios.find(p => p.id === STATE.activeId) || STATE.portfolios[0];
}

// 포트폴리오 → ITEMS 변환 (마스터 DB 조회 + 수량→비중 자동 계산)
let TOTAL_PORTFOLIO_VALUE = 0;
function portfolioToRaw(pf){
  const { items, totalValue } = computeWeights(pf.holdings);
  TOTAL_PORTFOLIO_VALUE = totalValue;
  return items.map(h => {
    const a = ASSET_BY_TICKER[h.ticker];
    if (!a) return null;
    return {
      ticker: a.ticker,
      name: a.name,
      name_en: a.name_en,
      sector: a.sector,
      weight: h.weight,
      quantity: h.quantity,
      market_value: h.market_value,
      current_price: a.current_price,
      avg_price: h.avg_price ?? a.current_price,
      market_cap: a.market_cap,
      volatility_30d: a.volatility_30d,
      beta: a.beta,
      debt_ratio: a.debt_ratio,
      liquidity_volume: a.liquidity_volume,
      is_etf: a.is_etf,
      dividend_yield: a.dividend_yield ?? 0
    };
  }).filter(Boolean);
}

// ---------- Layer 1: 섹터 정의 ----------
const SECTOR_DEF = {
  IT:        { base_risk:0.75, lat_min:60,  lat_max:80,  vol_avg:0.30, beta_avg:1.20, color:'#00D4FF' },
  BIO:       { base_risk:0.85, lat_min:40,  lat_max:60,  vol_avg:0.42, beta_avg:1.15, color:'#7B61FF' },
  AUTO:      { base_risk:0.60, lat_min:20,  lat_max:40,  vol_avg:0.28, beta_avg:1.10, color:'#FF8C42' },
  GLOBAL_ETF:{ base_risk:0.40, lat_min:10,  lat_max:20,  vol_avg:0.16, beta_avg:1.00, color:'#9B6EFF' },
  INDUSTRIAL:{ base_risk:0.55, lat_min:-10, lat_max:10,  vol_avg:0.32, beta_avg:1.25, color:'#F4D35E' },
  ETC:       { base_risk:0.55, lat_min:0,   lat_max:0,   vol_avg:0.30, beta_avg:1.00, color:'#9aa4bc' },
  FIN:       { base_risk:0.50, lat_min:-40, lat_max:-20, vol_avg:0.20, beta_avg:0.90, color:'#00E5A0' },
  ENERGY:    { base_risk:0.65, lat_min:-55, lat_max:-40, vol_avg:0.25, beta_avg:0.75, color:'#FF4560' },
  CONSUMER:  { base_risk:0.35, lat_min:-70, lat_max:-55, vol_avg:0.18, beta_avg:0.70, color:'#A8E5C2' },
  REALESTATE:{ base_risk:0.45, lat_min:-80, lat_max:-70, vol_avg:0.22, beta_avg:0.85, color:'#FFA8B6' }
};

// ---------- Layer 1: 표준화 + 결측값 처리 ----------
function standardize(raw){
  // weight 합계 1.0으로 정규화
  const sumW = raw.reduce((s,r)=>s+(r.weight||0),0);
  const items = raw.map(r=>{
    const sec = SECTOR_DEF[r.sector] ? r.sector : 'ETC';
    const def = SECTOR_DEF[sec];
    return {
      ticker: r.ticker,
      name: r.name,
      name_en: r.name_en,
      sector: sec,
      weight: (r.weight||0)/sumW,
      quantity: r.quantity,           // ← 통과
      market_value: r.market_value,   // ← 통과
      current_price: r.current_price ?? 0,
      avg_price: r.avg_price ?? r.current_price ?? 0,
      return_pct: r.avg_price ? (r.current_price - r.avg_price) / r.avg_price : 0,
      market_cap: r.market_cap ?? 0,
      volatility_30d: r.volatility_30d ?? def.vol_avg,
      beta: r.beta ?? def.beta_avg,
      debt_ratio: Math.min(1, r.debt_ratio ?? 0.5),
      liquidity_volume: r.liquidity_volume ?? null,
      is_etf: !!r.is_etf,
      dividend_yield: r.dividend_yield ?? 0,
      risk_score: null,
      sphere_coord: null
    };
  });
  return items;
}

// ---------- Layer 2: 리스크 스코어 산출 ----------
function computeRiskScores(items){
  const vols = items.map(i=>i.liquidity_volume).filter(v=>v!=null).sort((a,b)=>a-b);
  const liqMedian = vols.length ? vols[Math.floor(vols.length/2)] : 1;

  items.forEach(i=>{
    // 변동성 정규화 0.05~0.80 -> 0~1
    const volN = Math.max(0, Math.min(1, (i.volatility_30d - 0.05)/(0.80 - 0.05)));
    // 베타 정규화 0~2.5 -> 0~1
    const betaN = Math.max(0, Math.min(1, i.beta / 2.5));
    // 부채비율 그대로
    const debtN = Math.max(0, Math.min(1, i.debt_ratio));
    // 유동성 역수
    let liqN = 0;
    if (i.liquidity_volume!=null && liqMedian>0){
      const inv = 1 / (i.liquidity_volume / liqMedian);
      liqN = Math.max(0, Math.min(1, inv));
    }
    // 섹터 기본 리스크
    const secR = SECTOR_DEF[i.sector].base_risk;

    // 가중치
    const W = { vol:0.35, beta:0.25, debt:0.20, liq:0.10, sec:0.10 };
    let score;
    if (i.liquidity_volume==null){
      // 유동성 없을 시 가중치 재분배
      const total = W.vol + W.beta + W.debt + W.sec;
      score = (volN*W.vol + betaN*W.beta + debtN*W.debt + secR*W.sec) / total;
    } else {
      score = volN*W.vol + betaN*W.beta + debtN*W.debt + liqN*W.liq + secR*W.sec;
    }
    i.risk_score = Math.round(Math.max(0, Math.min(1, score)) * 100);
  });
  return items;
}

function riskColor(score){
  if (score < 30) return '#00E5A0';
  if (score < 55) return '#00D4FF';
  if (score < 75) return '#FF8C42';
  if (score < 90) return '#FF4560';
  return '#7B61FF';
}
function riskLabel(score){
  if (score < 30) return t('riskSafe');
  if (score < 55) return t('riskModerate');
  if (score < 75) return t('riskCaution');
  if (score < 90) return t('riskHigh');
  return t('riskExtreme');
}

// ---------- Layer 3: 3D 구체 좌표 ----------
function mapSphereCoords(items){
  // 섹터별로 그룹화, 비중 큰 순서로 경도 분산
  const bySector = {};
  items.forEach(i=>{
    if (!bySector[i.sector]) bySector[i.sector] = [];
    bySector[i.sector].push(i);
  });
  // 섹터마다 위도 범위 내 균등 분포, 경도는 비중 순
  let lngOffset = 0;
  Object.keys(bySector).forEach((sec,si)=>{
    const arr = bySector[sec].sort((a,b)=>b.weight-a.weight);
    const def = SECTOR_DEF[sec];
    const latMin = def.lat_min, latMax = def.lat_max;
    arr.forEach((it,k)=>{
      const t = arr.length===1 ? 0.5 : k/(arr.length-1);
      const lat = latMin + t*(latMax - latMin);
      // 경도: 섹터당 영역 분리 + 비중 비례
      const lng = (lngOffset + k * (360/Math.max(arr.length,1)) * 0.4) % 360;
      const r = 1.0 + (it.risk_score/100)*0.5;
      it.sphere_coord = { lat, lng, r };
    });
    lngOffset += 360 / Object.keys(bySector).length;
  });
  return items;
}

function latLngToVec3(lat, lng, r){
  const phi = (90-lat) * Math.PI/180;
  const theta = lng * Math.PI/180;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// ---------- Layer 4: 밸런스 지수 ----------
function computeBalance(items){
  // 섹터 HHI
  const secW = {};
  items.forEach(i=> secW[i.sector] = (secW[i.sector]||0) + i.weight);
  const hhi = Object.values(secW).reduce((s,w)=>s+w*w,0);
  const nSec = Object.keys(secW).length;
  const minHHI = 1/Math.max(nSec,1);
  const diverseScore = nSec>1 ? Math.max(0, Math.min(100, ((1 - hhi)/(1 - minHHI))*100)) : 0;

  // 리스크 편차
  const scores = items.map(i=>i.risk_score);
  const mean = scores.reduce((s,v)=>s+v,0)/scores.length;
  const variance = scores.reduce((s,v)=>s+(v-mean)**2,0)/scores.length;
  const std = Math.sqrt(variance);
  const devScore = Math.max(0, Math.min(100, (1 - std/50)*100));

  // 구형도
  const rs = items.map(i=>i.sphere_coord.r);
  const rMean = rs.reduce((s,v)=>s+v,0)/rs.length;
  const rStd = Math.sqrt(rs.reduce((s,v)=>s+(v-rMean)**2,0)/rs.length);
  const sphericityRaw = Math.max(0, Math.min(1, 1 - rStd/0.5));
  const sphericity = sphericityRaw * 100;

  const balance = diverseScore*0.4 + devScore*0.35 + sphericity*0.25;

  return {
    balance: Math.round(balance),
    balance_raw: balance,           // 미세 변화 표시용 float
    diverse: Math.round(diverseScore),
    diverse_raw: diverseScore,
    deviation: Math.round(devScore),
    deviation_raw: devScore,
    sphericity: Math.round(sphericity),
    sphericity_raw: sphericity,
    hhi: hhi.toFixed(3),
    hhi_raw: hhi,
    avgRisk: Math.round(mean),
    avgRisk_raw: mean,
    sectorWeights: secW
  };
}

function balanceGrade(score){
  if (score >= 90) return { txt:t('balanceGradeOptimal'), color:'var(--safe)' };
  if (score >= 70) return { txt:t('balanceGradeGood'),    color:'var(--moderate)' };
  if (score >= 50) return { txt:t('balanceGradeWarn'),    color:'var(--caution)' };
  if (score >= 30) return { txt:t('balanceGradeRisk'),    color:'var(--high)' };
  return { txt:t('balanceGradeSevere'), color:'var(--extreme)' };
}

// =========================================================
// Advanced Metrics — VaR, CVaR, Sharpe, Sortino, 분산효과(DR)
// =========================================================
// 무위험수익률·시장프리미엄·환산상수
const RISK_FREE_ANNUAL = 0.035;       // 3.5% (한국+미국 가중 근사)
const MARKET_PREMIUM   = 0.060;       // 연 6% — Damodaran 2024 기준 중간값
const TRADING_DAYS     = 252;
const Z95              = 1.6449;      // 95% 정규분위
const Z99              = 2.3263;      // 99%
const ES95_ADJ         = 2.0627;      // E[Z | Z<-1.6449] ≈ -2.0627 (CVaR 95%)

// 자산쌍 상관계수 — 동일 섹터/지역에 따라 휴리스틱
function pairwiseCorr(a, b){
  if (a.ticker === b.ticker) return 1.0;
  const sameSector = a.sector === b.sector;
  const aKR = /\.(KS|KQ)$/.test(a.ticker), bKR = /\.(KS|KQ)$/.test(b.ticker);
  const sameRegion = (aKR === bKR);
  const aETF = !!a.is_etf || a.sector === 'GLOBAL_ETF';
  const bETF = !!b.is_etf || b.sector === 'GLOBAL_ETF';
  // ETF는 시장 전체와 0.85 정도 상관
  if (aETF && bETF) return 0.85;
  if (aETF || bETF) return 0.55;
  if (sameSector && sameRegion) return 0.68;
  if (sameSector) return 0.50;
  if (sameRegion) return 0.32;
  return 0.18;
}

// 포트폴리오 변동성 — Markowitz: σ_p² = ΣΣ w_i w_j σ_i σ_j ρ_ij
function portfolioVol(items){
  let s2 = 0;
  for (let i=0;i<items.length;i++){
    for (let j=0;j<items.length;j++){
      const a = items[i], b = items[j];
      const rho = (i===j) ? 1.0 : pairwiseCorr(a, b);
      s2 += a.weight * b.weight * a.volatility_30d * b.volatility_30d * rho;
    }
  }
  return Math.sqrt(Math.max(0, s2));
}

// 포트폴리오 기대수익률 — CAPM 가중합
function portfolioBeta(items){
  return items.reduce((s, it) => s + it.weight * it.beta, 0);
}
function portfolioExpectedReturn(items){
  const beta = portfolioBeta(items);
  return RISK_FREE_ANNUAL + beta * MARKET_PREMIUM;
}

// VaR/CVaR — 패러메트릭 정규성 가정 (1일 95%/99%)
function computeAdvancedMetrics(items, balance){
  if (!items || items.length === 0){
    return {
      portVol:0, portReturn:0, portBeta:0,
      sharpe:0, sortino:0, var95:0, cvar95:0, var99:0,
      dr:1, riskReduction:0,
      totalValue:0
    };
  }
  const totalValue = items.reduce((s,i)=> s + (i.market_value||0), 0);
  const sigmaA = portfolioVol(items);                                     // 연환산
  const sigmaD = sigmaA / Math.sqrt(TRADING_DAYS);                        // 일환산
  const expRet = portfolioExpectedReturn(items);                          // 연환산
  const beta   = portfolioBeta(items);

  // VaR/CVaR — 평균 수익률 무시(보수적), 손실 = z * σ_D * V
  const var95  = Z95     * sigmaD * totalValue;
  const var99  = Z99     * sigmaD * totalValue;
  const cvar95 = ES95_ADJ * sigmaD * totalValue;

  // Sharpe = (μ − rf) / σ
  const sharpe  = sigmaA > 0 ? (expRet - RISK_FREE_ANNUAL) / sigmaA : 0;
  // Sortino — 하방변동성 ≈ σ × 0.71 (Sortino/Sharpe 경험적 비율)
  // 동일 분자, 분모만 하방 σ 로 교체
  const downside = sigmaA * 0.71;
  const sortino = downside > 0 ? (expRet - RISK_FREE_ANNUAL) / downside : 0;

  // Diversification Ratio = Σ(w_i × σ_i) / σ_p
  const weightedVolSum = items.reduce((s,i)=> s + i.weight * i.volatility_30d, 0);
  const dr = sigmaA > 0 ? weightedVolSum / sigmaA : 1;
  const riskReduction = weightedVolSum > 0 ? (1 - sigmaA / weightedVolSum) : 0;

  // 연간 배당 추정 = Σ(market_value × dividend_yield)
  const annualDividend = items.reduce((s,i)=> s + (i.market_value||0) * (i.dividend_yield||0), 0);
  const dividendYieldPort = totalValue > 0 ? annualDividend / totalValue : 0;

  return {
    totalValue,
    portBeta: beta,
    portVol: sigmaA,            // 연환산 표준편차
    portVolDaily: sigmaD,
    portReturn: expRet,         // 연환산 기대수익률
    sharpe, sortino,
    var95, var99, cvar95,
    dr, riskReduction,
    annualDividend, dividendYieldPort
  };
}

// =========================================================
// 스트레스 테스트 시나리오 — 섹터별 충격 배수
// =========================================================
const STRESS_SCENARIOS = {
  'gfc2008': {
    label_ko: '2008 글로벌 금융위기',
    label_en: '2008 Global Financial Crisis',
    desc_ko: 'Lehman 파산 후 6개월간의 누적 하락. 금융·부동산이 진앙.',
    desc_en: 'Cumulative drop in 6 months post-Lehman. Financials & RE epicenter.',
    shocks: { IT:-0.42, BIO:-0.28, AUTO:-0.55, FIN:-0.55, ENERGY:-0.45,
              CONSUMER:-0.32, REALESTATE:-0.62, INDUSTRIAL:-0.48,
              GLOBAL_ETF:-0.40, ETC:-0.35 }
  },
  'covid2020': {
    label_ko: '2020 코로나 셧다운',
    label_en: '2020 COVID Shutdown',
    desc_ko: '2020.02~03 한 달간의 패닉 매도. 에너지·항공·소비재 직격, IT/바이오 회복.',
    desc_en: 'Mar 2020 panic. Energy/airline/consumer hit hardest, IT/Bio rebounded.',
    shocks: { IT:-0.18, BIO:-0.08, AUTO:-0.42, FIN:-0.36, ENERGY:-0.58,
              CONSUMER:-0.30, REALESTATE:-0.34, INDUSTRIAL:-0.32,
              GLOBAL_ETF:-0.32, ETC:-0.25 }
  },
  'inflation2022': {
    label_ko: '2022 인플레이션·금리쇼크',
    label_en: '2022 Inflation/Rate Shock',
    desc_ko: 'Fed 급격 금리인상. 성장주·장기채 큰 손실, 에너지는 수혜.',
    desc_en: 'Fed aggressive hikes. Growth & long bonds hit, energy benefited.',
    shocks: { IT:-0.34, BIO:-0.22, AUTO:-0.40, FIN:-0.18, ENERGY:+0.32,
              CONSUMER:-0.24, REALESTATE:-0.26, INDUSTRIAL:-0.16,
              GLOBAL_ETF:-0.20, ETC:-0.18 }
  },
  'dotcom2000': {
    label_ko: '2000 닷컴 버블 붕괴',
    label_en: '2000 Dotcom Bubble Burst',
    desc_ko: '2000.03~2002.10. 나스닥 -78%, IT 직격, 가치주는 상대적 선방.',
    desc_en: 'Mar 2000–Oct 2002. Nasdaq −78%, IT crushed, value held up.',
    shocks: { IT:-0.78, BIO:-0.55, AUTO:-0.35, FIN:-0.25, ENERGY:+0.05,
              CONSUMER:-0.18, REALESTATE:-0.10, INDUSTRIAL:-0.30,
              GLOBAL_ETF:-0.45, ETC:-0.25 }
  }
};

// 시나리오 적용 — 종목별 손익과 포트폴리오 합계 반환
function computeStressTest(items, scenarioKey){
  const scn = STRESS_SCENARIOS[scenarioKey];
  if (!scn || !items.length) return null;
  let portLoss = 0;
  const breakdown = items.map(it => {
    const shock = scn.shocks[it.sector] ?? scn.shocks.ETC ?? -0.30;
    const value = it.market_value || 0;
    const loss  = value * shock;       // 음수면 손실, 양수면 이익
    portLoss += loss;
    return { ticker: it.ticker, name: it.name, sector: it.sector,
             value, shock, loss };
  });
  const totalValue = items.reduce((s,i)=> s + (i.market_value||0), 0);
  return {
    key: scenarioKey, scenario: scn,
    totalValue, portLoss,
    portLossPct: totalValue > 0 ? portLoss / totalValue : 0,
    breakdown
  };
}

// ---------- Layer 5 + 인사이트 생성 ----------
function generateInsights(items, balance){
  const insights = [];
  if (items.length === 0) return insights;

  const top = [...items].sort((a,b)=>b.weight-a.weight)[0];
  if (top.weight > 0.40){
    insights.push({ level:'alert', title:t('insightConcentrationTitle'),
      body:t('insightConcentrationBody', top.name, (top.weight*100).toFixed(1), balance.balance, Math.min(100, balance.balance+15))
    });
  }
  if (balance.balance < 40){
    insights.push({ level:'alert', title:t('insightRebalanceTitle'),
      body:t('insightRebalanceBody', balance.sphericity, balance.diverse) });
  }
  if (balance.avgRisk > 70){
    const hi = [...items].sort((a,b)=>b.risk_score-a.risk_score)[0];
    insights.push({ level:'warn', title:t('insightHighRiskTitle'),
      body:t('insightHighRiskBody', balance.avgRisk, hi.name, hi.risk_score) });
  }
  if (parseFloat(balance.hhi) > 0.45){
    const topSec = Object.entries(balance.sectorWeights).sort((a,b)=>b[1]-a[1])[0];
    insights.push({ level:'warn', title:t('insightSectorTitle'),
      body:t('insightSectorBody', topSec[0], (topSec[1]*100).toFixed(1), balance.hhi) });
  }
  const xtreme = items.filter(i=>i.risk_score>85);
  xtreme.forEach(i=>{
    insights.push({ level:'warn', title:t('insightExtremeRiskTitle', i.name),
      body:t('insightExtremeRiskBody', i.risk_score, (i.volatility_30d*100).toFixed(0), i.beta.toFixed(2)) });
  });
  if (insights.length === 0){
    insights.push({ level:'ok', title:t('insightBalancedTitle'), body:t('insightBalancedBody', balance.balance) });
  }
  return insights;
}

/* =========================================================
   파이프라인 실행 (포트폴리오 변경 시 다시 호출됨)
   ========================================================= */
let ITEMS = [], BALANCE = {}, INSIGHTS = [], ADVANCED = {};

function runPipeline(){
  const pf = activePortfolio();
  const raw = portfolioToRaw(pf);
  if (raw.length === 0){
    ITEMS = [];
    BALANCE = { balance:0, diverse:0, deviation:0, sphericity:0, hhi:'0.000', avgRisk:0, sectorWeights:{} };
    INSIGHTS = [{ level:'ok', title:'포트폴리오가 비어있음', body:'좌측 검색창에서 종목을 추가해주세요.' }];
    ADVANCED = computeAdvancedMetrics([], BALANCE);
    return;
  }
  ITEMS = mapSphereCoords(computeRiskScores(standardize(raw)));
  BALANCE = computeBalance(ITEMS);
  INSIGHTS = generateInsights(ITEMS, BALANCE);
  ADVANCED = computeAdvancedMetrics(ITEMS, BALANCE);
}
runPipeline();

/* =========================================================
   THREE.JS 3D 렌더링
   ========================================================= */
const canvas = document.getElementById('canvas');
const main = canvas.parentElement;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070d, 0.06);

const camera = new THREE.PerspectiveCamera(50, main.clientWidth/main.clientHeight, 0.1, 100);
camera.position.set(0, 0.6, 4.2);

const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(main.clientWidth, main.clientHeight);

// 조명
scene.add(new THREE.AmbientLight(0x6080a0, 0.4));
const keyLight = new THREE.DirectionalLight(0x00d4ff, 0.8);
keyLight.position.set(3,4,5); scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x7b61ff, 0.5);
rimLight.position.set(-4,-2,-3); scene.add(rimLight);

// 별 배경
function makeStarfield(){
  const g = new THREE.BufferGeometry();
  const pos = [];
  for (let i=0;i<800;i++){
    const r = 30 + Math.random()*15;
    const t = Math.random()*Math.PI*2;
    const p = Math.acos(2*Math.random()-1);
    pos.push(r*Math.sin(p)*Math.cos(t), r*Math.cos(p), r*Math.sin(p)*Math.sin(t));
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color:0x4a6080, size:0.04, transparent:true, opacity:0.5 });
  return new THREE.Points(g, m);
}
scene.add(makeStarfield());

// 와이어프레임 베이스 구
const sphereGroup = new THREE.Group();
scene.add(sphereGroup);

const baseGeo = new THREE.SphereGeometry(1, 36, 24);
const baseMat = new THREE.MeshBasicMaterial({ color:0x1a2540, wireframe:true, transparent:true, opacity:0.18 });
const baseMesh = new THREE.Mesh(baseGeo, baseMat);
sphereGroup.add(baseMesh);

// 반구별 색상 (북=성장주 쿨톤 / 남=가치주 웜톤)
// SphereGeometry(radius, widthSeg, heightSeg, phiStart, phiLength, thetaStart, thetaLength)
const northGeo = new THREE.SphereGeometry(0.998, 64, 32, 0, Math.PI*2, 0, Math.PI/2);
const northMat = new THREE.MeshPhongMaterial({
  color: 0x0a1f3a,
  emissive: 0x051a30,
  transparent: true,
  opacity: 0.42,
  shininess: 90,
  side: THREE.DoubleSide
});
sphereGroup.add(new THREE.Mesh(northGeo, northMat));

const southGeo = new THREE.SphereGeometry(0.998, 64, 32, 0, Math.PI*2, Math.PI/2, Math.PI/2);
const southMat = new THREE.MeshPhongMaterial({
  color: 0x2a1a08,
  emissive: 0x2a1500,
  transparent: true,
  opacity: 0.42,
  shininess: 90,
  side: THREE.DoubleSide
});
sphereGroup.add(new THREE.Mesh(southGeo, southMat));

// 적도 강조 라인
const equatorGeo = new THREE.RingGeometry(1.001, 1.005, 128);
const equatorMat = new THREE.MeshBasicMaterial({
  color: 0x00d4ff, transparent:true, opacity:0.5, side:THREE.DoubleSide
});
const equatorRing = new THREE.Mesh(equatorGeo, equatorMat);
equatorRing.rotation.x = Math.PI/2;
sphereGroup.add(equatorRing);

// 위도 적도선
function makeLatLine(lat, color, opacity){
  const pts = [];
  const r = 1.0;
  for (let lng=0; lng<=360; lng+=2){
    pts.push(latLngToVec3(lat, lng, r));
  }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent:true, opacity }));
}
sphereGroup.add(makeLatLine(0, 0x00d4ff, 0.4));
[60, 30, -30, -60].forEach(l=> sphereGroup.add(makeLatLine(l, 0x335577, 0.15)));

// 노드 + 돌출 라인 (rebuild 가능)
let nodeMeshes = [];
const dynamicGroup = new THREE.Group();
sphereGroup.add(dynamicGroup);

function disposeDynamic(){
  // 기존 노드/라인/헤일로 제거
  while (dynamicGroup.children.length){
    const c = dynamicGroup.children[0];
    dynamicGroup.remove(c);
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
  }
  nodeMeshes = [];
}

function rebuildNodes(){
  disposeDynamic();
  ITEMS.forEach(it=>{
    const pos = latLngToVec3(it.sphere_coord.lat, it.sphere_coord.lng, it.sphere_coord.r);
    const surfPos = latLngToVec3(it.sphere_coord.lat, it.sphere_coord.lng, 1.0);

    // 돌출 라인
    const lineGeo = new THREE.BufferGeometry().setFromPoints([surfPos, pos]);
    const lineMat = new THREE.LineBasicMaterial({ color: riskColor(it.risk_score), transparent:true, opacity:0.4 });
    dynamicGroup.add(new THREE.Line(lineGeo, lineMat));

    // 노드 본체
    const radius = it.weight * 0.5 + 0.02;
    const sphereGeo = new THREE.SphereGeometry(radius, 24, 18);
    const color = new THREE.Color(riskColor(it.risk_score));
    const mat = new THREE.MeshPhongMaterial({
      color, emissive:color, emissiveIntensity:0.6, shininess:120, transparent:true, opacity:0.85
    });
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.copy(pos);
    mesh.userData.item = it;
    dynamicGroup.add(mesh);

    // 글로 헤일로
    const haloGeo = new THREE.SphereGeometry(radius*1.6, 16, 12);
    const haloMat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.18 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(pos);
    dynamicGroup.add(halo);

    nodeMeshes.push({ mesh, halo, item: it, baseColor: color, baseRadius: radius });
  });
  // 스트레스 시나리오 활성 상태면 재적용
  if (CURRENT_STRESS) applyStressVisuals();
}
rebuildNodes();

// 인터랙션
let autoRotate = true;
let viewMode = 'sphere';
let selectedTicker = null;
let cameraTarget = new THREE.Vector3(0,0,4.2);

const raycaster = new THREE.Raycaster();
const mouseV = new THREE.Vector2();

function onResize(){
  let w = main.clientWidth, h = main.clientHeight;
  if (!w || !h){
    const isMobile = window.innerWidth <= 768;
    if (isMobile){
      w = window.innerWidth;
      h = Math.round(window.innerHeight * 0.5);
    } else {
      w = window.innerWidth - 320 - 360;
      h = window.innerHeight - 56;
    }
  }
  if (w < 100) w = 100;
  if (h < 100) h = 100;
  renderer.setSize(w, h, true);
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(onResize, 200));

// 마우스 회전
let isDragging = false;
let prevMouse = { x:0, y:0 };
let rotation = { x: 0.2, y: 0 };
canvas.addEventListener('mousedown', e=>{ isDragging=true; prevMouse={x:e.clientX,y:e.clientY}; autoRotate=false; setActive('rotate', false); });
window.addEventListener('mouseup', ()=> isDragging=false );
window.addEventListener('mousemove', e=>{
  if (isDragging){
    const dx = e.clientX-prevMouse.x, dy = e.clientY-prevMouse.y;
    rotation.y += dx*0.005;
    rotation.x = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, rotation.x + dy*0.005));
    prevMouse = { x:e.clientX, y:e.clientY };
  }
});
canvas.addEventListener('wheel', e=>{
  e.preventDefault();
  cameraTarget.z = Math.max(2.5, Math.min(8, cameraTarget.z + e.deltaY*0.002));
}, { passive:false });

// 모바일 터치 지원 — 1손가락 회전, 2손가락 핀치줌
let _touchPrev = null;
let _pinchPrev = null;
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1){
    _touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    autoRotate = false;
    setActive('rotate', false);
  } else if (e.touches.length === 2){
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    _pinchPrev = Math.sqrt(dx*dx + dy*dy);
  }
}, { passive: true });
canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && _touchPrev){
    e.preventDefault();
    const x = e.touches[0].clientX, y = e.touches[0].clientY;
    rotation.y += (x - _touchPrev.x) * 0.006;
    rotation.x = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, rotation.x + (y - _touchPrev.y) * 0.006));
    _touchPrev = { x, y };
  } else if (e.touches.length === 2 && _pinchPrev != null){
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const delta = (_pinchPrev - dist) * 0.012;
    cameraTarget.z = Math.max(2.5, Math.min(8, cameraTarget.z + delta));
    _pinchPrev = dist;
  }
}, { passive: false });
canvas.addEventListener('touchend', () => {
  _touchPrev = null;
  _pinchPrev = null;
}, { passive: true });
// 캔버스 자체에서는 페이지 스크롤 차단 (밖에선 정상 스크롤)
canvas.style.touchAction = 'none';

// 호버 툴팁
const tooltip = document.getElementById('tooltip');
canvas.addEventListener('mousemove', e=>{
  const rect = canvas.getBoundingClientRect();
  mouseV.x = ((e.clientX-rect.left)/rect.width)*2 - 1;
  mouseV.y = -((e.clientY-rect.top)/rect.height)*2 + 1;
  raycaster.setFromCamera(mouseV, camera);
  const hits = raycaster.intersectObjects(nodeMeshes.map(n=>n.mesh));
  if (hits.length){
    const it = hits[0].object.userData.item;
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
    tooltip.style.top = (e.clientY - rect.top + 12) + 'px';
    tooltip.innerHTML = `
      <div class="tooltip-name" style="color:${riskColor(it.risk_score)}">${getName(it)}</div>
      <div class="tooltip-row"><span>${it.ticker}</span><b>${t('tooltipQtyWeight', (it.quantity ?? 1), (it.weight*100).toFixed(1))}</b></div>
      <div class="tooltip-row"><span>${t('tooltipValue')}</span><b>${Math.round(it.market_value || 0).toLocaleString()}</b></div>
      <div class="tooltip-row"><span>${t('tooltipRisk')}</span><b style="color:${riskColor(it.risk_score)}">${it.risk_score} · ${riskLabel(it.risk_score)}</b></div>
      <div class="tooltip-row"><span>${t('tooltipReturn')}</span><b class="${it.return_pct>=0?'pos':'neg'}">${(it.return_pct*100).toFixed(2)}%</b></div>
      <div class="tooltip-row"><span>${t('tooltipSector')}</span><b>${sectorLabel(it.sector)}</b></div>
    `;
    canvas.style.cursor = 'pointer';
  } else {
    tooltip.style.display = 'none';
    canvas.style.cursor = 'grab';
  }
});

// 클릭 선택
canvas.addEventListener('click', e=>{
  if (isDragging) return;
  const rect = canvas.getBoundingClientRect();
  mouseV.x = ((e.clientX-rect.left)/rect.width)*2 - 1;
  mouseV.y = -((e.clientY-rect.top)/rect.height)*2 + 1;
  raycaster.setFromCamera(mouseV, camera);
  const hits = raycaster.intersectObjects(nodeMeshes.map(n=>n.mesh));
  if (hits.length){
    selectAsset(hits[0].object.userData.item.ticker);
  }
});

function selectAsset(ticker){
  selectedTicker = ticker;
  document.querySelectorAll('.holding').forEach(el=>{
    el.classList.toggle('active', el.dataset.ticker === ticker);
  });
  // 노드 강조
  nodeMeshes.forEach(n=>{
    const isSel = n.item.ticker === ticker;
    n.mesh.material.opacity = selectedTicker ? (isSel ? 1.0 : 0.3) : 0.85;
    n.halo.material.opacity = selectedTicker ? (isSel ? 0.4 : 0.06) : 0.18;
    n.mesh.material.emissiveIntensity = isSel ? 1.2 : 0.6;
  });
  renderStockDetail(ITEMS.find(i=>i.ticker === ticker));
}

// 컨트롤 버튼
document.querySelectorAll('.ctrl-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const m = btn.dataset.mode;
    if (m === 'rotate'){ autoRotate = !autoRotate; btn.classList.toggle('active', autoRotate); return; }
    if (m === 'rebalance'){
      if (rebalanceMode) exitRebalance(false);
      else enterRebalance();
      return;
    }
    if (m === 'network'){
      networkMode = !networkMode;
      btn.classList.toggle('network-active', networkMode);
      document.getElementById('networkLegend').classList.toggle('show', networkMode);
      buildCorrelationLines();
      return;
    }
    if (m === 'reset'){
      rotation = { x:0.2, y:0 }; cameraTarget.z = 4.2; autoRotate=true;
      document.querySelector('[data-mode=rotate]').classList.add('active');
      selectedTicker = null;
      nodeMeshes.forEach(n=>{ n.mesh.material.opacity=0.85; n.halo.material.opacity=0.18; n.mesh.material.emissiveIntensity=0.6; });
      document.querySelectorAll('.holding').forEach(el=> el.classList.remove('active'));
      document.getElementById('stockDetail').classList.remove('show');
      document.getElementById('noSelect').style.display = 'block';
      viewMode = 'sphere';
      document.querySelectorAll('[data-mode=sphere],[data-mode=cluster]').forEach(b=> b.classList.toggle('active', b.dataset.mode==='sphere'));
      document.getElementById('viewMode').textContent = 'SPHERE VIEW';
      return;
    }
    if (m === 'sphere' || m === 'cluster'){
      viewMode = m;
      document.querySelectorAll('[data-mode=sphere],[data-mode=cluster]').forEach(b=> b.classList.toggle('active', b.dataset.mode===m));
      document.getElementById('viewMode').textContent = m === 'sphere' ? t('sphereView') : t('clusterView');
      animateView(m);
    }
  });
});

function setActive(name, on){
  const btn = document.querySelector(`[data-mode=${name}]`);
  if (btn) btn.classList.toggle('active', on);
}

function animateView(mode){
  // Cluster mode: 섹터별로 노드를 분리해 각각 작은 클러스터 형태로
  if (mode === 'cluster'){
    const sectors = [...new Set(ITEMS.map(i=>i.sector))];
    const ringR = 2.0;
    sectors.forEach((sec, si)=>{
      const ang = (si/sectors.length)*Math.PI*2;
      const center = new THREE.Vector3(Math.cos(ang)*ringR, Math.sin(ang)*ringR*0.4, 0);
      const items = ITEMS.filter(i=>i.sector===sec);
      items.forEach((it,k)=>{
        const t = (k/Math.max(items.length-1,1)) * Math.PI*2;
        const lr = 0.35;
        const target = center.clone().add(new THREE.Vector3(Math.cos(t)*lr, Math.sin(t)*lr, 0));
        const node = nodeMeshes.find(n=>n.item.ticker===it.ticker);
        animateMeshTo(node.mesh, target);
        animateMeshTo(node.halo, target);
      });
    });
  } else {
    nodeMeshes.forEach(n=>{
      const target = latLngToVec3(n.item.sphere_coord.lat, n.item.sphere_coord.lng, n.item.sphere_coord.r);
      animateMeshTo(n.mesh, target);
      animateMeshTo(n.halo, target);
    });
  }
}

function animateMeshTo(mesh, target){
  const start = mesh.position.clone();
  const dur = 800;
  const t0 = performance.now();
  function step(){
    const t = Math.min(1, (performance.now()-t0)/dur);
    const e = 1 - Math.pow(1-t, 3);
    mesh.position.lerpVectors(start, target, e);
    if (t < 1) requestAnimationFrame(step);
  }
  step();
}

// 애니메이션 루프
function animate(){
  requestAnimationFrame(animate);
  if (autoRotate && !isDragging) rotation.y += 0.0028;
  sphereGroup.rotation.x = rotation.x;
  sphereGroup.rotation.y = rotation.y;

  // 펄스: 고위험 노드
  const t = performance.now()*0.003;
  nodeMeshes.forEach(n=>{
    if (n.item.risk_score > 85){
      const s = 1 + Math.sin(t)*0.15;
      n.halo.scale.setScalar(s);
    }
    if (n.item.weight > 0.4){
      const s = 1 + Math.sin(t*1.5)*0.2;
      n.halo.scale.setScalar(s);
    }
  });

  // 카메라 줌 보간
  camera.position.z += (cameraTarget.z - camera.position.z) * 0.08;
  renderer.render(scene, camera);
}
animate();
onResize();

/* =========================================================
   UI 렌더링
   ========================================================= */
function renderHoldings(){
  const el = document.getElementById('holdingsList');
  const empty = document.getElementById('holdingsEmpty');
  el.innerHTML = '';
  // 리밸런싱 모드면 TARGET_ITEMS, 아니면 ITEMS 사용
  const sourceItems = rebalanceMode && TARGET_ITEMS.length ? TARGET_ITEMS : ITEMS;
  const sorted = [...sourceItems].sort((a,b)=>b.weight-a.weight);
  empty.style.display = sorted.length === 0 ? 'block' : 'none';

  // 총 평가액 표시 (모드별)
  const totalEl = document.getElementById('totalValue');
  const totalKrEl = document.getElementById('totalValueKr');
  if (totalEl){
    let total = TOTAL_PORTFOLIO_VALUE;
    if (rebalanceMode && TARGET_ITEMS.length){
      total = TARGET_ITEMS.reduce((s,it)=> s + (it.market_value || 0), 0);
    }
    totalEl.textContent = Math.round(total).toLocaleString();
    if (totalKrEl) totalKrEl.textContent = CURRENT_LANG === 'ko' ? formatKRWUnit(total) : '';
  }

  sorted.forEach(it=>{
    const d = document.createElement('div');
    d.className = 'holding' + (rebalanceMode ? ' rb-mode' : '');
    d.dataset.ticker = it.ticker;
    // 리밸런싱 모드에서 현재 보유량 힌트
    let currentHint = '';
    if (rebalanceMode){
      const original = activePortfolio().holdings.find(h => h.ticker === it.ticker);
      if (original && original.quantity !== it.quantity){
        const diff = it.quantity - original.quantity;
        const sign = diff > 0 ? '+' : '';
        const color = diff > 0 ? 'var(--safe)' : 'var(--high)';
        currentHint = `<div class="holding-current-hint">현재 ${original.quantity}주 <span style="color:${color}">(${sign}${diff})</span></div>`;
      }
    }
    d.innerHTML = `
      <div class="holding-dot" style="background:${riskColor(it.risk_score)};color:${riskColor(it.risk_score)}"></div>
      <div class="holding-info">
        <div class="holding-name">${getName(it)}</div>
        <div class="holding-sub" title="${it.ticker} · ${sectorLabel(it.sector)}">${it.ticker}<span class="sub-sep">·</span>${sectorLabel(it.sector)}</div>
        ${currentHint}
      </div>
      <div class="holding-right">
        <div class="holding-qty-line">
          <input type="number" class="qty-edit" value="${it.quantity}" min="1" step="1" data-ticker="${it.ticker}" title="${t('qtyEditTitle')}">
          <span class="qty-suffix">${t('sharesUnit')}</span>
        </div>
        <div class="holding-value" title="${t('valueTooltipTitle')}">${Math.round(it.market_value).toLocaleString()}</div>
        <div class="holding-meta">
          <span class="weight-pct">${(it.weight*100).toFixed(1)}%</span>
          <span class="${it.return_pct>=0?'pos':'neg'}">${it.return_pct>=0?'+':''}${(it.return_pct*100).toFixed(2)}%</span>
        </div>
      </div>
      <button class="holding-del" data-ticker="${it.ticker}" title="${t('delTitle')}">×</button>
    `;
    d.addEventListener('click', e=>{
      if (e.target.classList.contains('holding-del') || e.target.classList.contains('qty-edit')) return;
      selectAsset(it.ticker);
    });
    d.querySelector('.holding-del').addEventListener('click', e=>{
      e.stopPropagation();
      removeHolding(it.ticker);
    });
    const qInput = d.querySelector('.qty-edit');
    qInput.addEventListener('click', e=> e.stopPropagation());
    qInput.addEventListener('keydown', e=>{
      if (e.key === 'Enter'){ qInput.blur(); }
      else if (e.key === 'Escape'){ qInput.value = it.quantity; qInput.blur(); }
    });
    qInput.addEventListener('blur', ()=>{
      const v = parseInt(qInput.value, 10);
      if (!isNaN(v) && v > 0){
        if (v !== it.quantity) updateHoldingQuantity(it.ticker, v);
      } else {
        qInput.value = it.quantity;
      }
    });
    el.appendChild(d);
  });
  document.getElementById('holdingCount').textContent = ITEMS.length;
}

function renderSectorBars(){
  const totals = {};
  ITEMS.forEach(i=> totals[i.sector] = (totals[i.sector]||0) + i.weight);
  const arr = Object.entries(totals).sort((a,b)=>b[1]-a[1]);
  const el = document.getElementById('sectorBars');
  el.innerHTML = '';
  arr.forEach(([sec, w])=>{
    const c = SECTOR_DEF[sec].color;
    el.innerHTML += `
      <div class="sector-bar">
        <div class="sb-name">${sectorLabel(sec)}</div>
        <div class="sb-track"><div class="sb-fill" style="width:${(w*100).toFixed(0)}%; background:${c}; box-shadow:0 0 8px ${c}"></div></div>
        <div class="sb-pct">${(w*100).toFixed(1)}%</div>
      </div>
    `;
  });
}

function renderRiskDist(){
  const buckets = [
    { lbl:'SAFE',     min:0,  max:30, c:'var(--safe)' },
    { lbl:'MODERATE', min:30, max:55, c:'var(--moderate)' },
    { lbl:'CAUTION',  min:55, max:75, c:'var(--caution)' },
    { lbl:'HIGH',     min:75, max:90, c:'var(--high)' },
    { lbl:'EXTREME',  min:90, max:101, c:'var(--extreme)' }
  ];
  const total = ITEMS.length;
  const el = document.getElementById('riskDist');
  el.innerHTML = '';
  buckets.forEach(b=>{
    const cnt = ITEMS.filter(i=>i.risk_score>=b.min && i.risk_score<b.max).length;
    const w = (cnt/total)*100;
    el.innerHTML += `
      <div class="sector-bar">
        <div class="sb-name" style="color:${b.c}">${b.lbl}</div>
        <div class="sb-track"><div class="sb-fill" style="width:${w}%; background:${b.c}"></div></div>
        <div class="sb-pct">${cnt}</div>
      </div>
    `;
  });
}

function renderBalance(){
  document.getElementById('balanceScore').textContent = BALANCE.balance;
  document.getElementById('balanceFill').style.width = BALANCE.balance + '%';
  const g = balanceGrade(BALANCE.balance);
  const grade = document.getElementById('balanceGrade');
  grade.textContent = g.txt;
  grade.style.color = g.color;
  document.getElementById('mDiverse').textContent = BALANCE.diverse + ' / 100';
  document.getElementById('mDeviation').textContent = BALANCE.deviation + ' / 100';
  document.getElementById('mSphericity').textContent = BALANCE.sphericity + ' / 100';
  document.getElementById('mHHI').textContent = BALANCE.hhi;
  document.getElementById('avgRiskBig').textContent = BALANCE.avgRisk;
  document.getElementById('sphericity').textContent = BALANCE.sphericity;

  // 밸런스 색상
  const fill = document.getElementById('balanceFill');
  if (BALANCE.balance < 40) fill.style.background = 'linear-gradient(90deg, var(--high), var(--extreme))';
  else if (BALANCE.balance < 70) fill.style.background = 'linear-gradient(90deg, var(--caution), var(--moderate))';
  else fill.style.background = 'linear-gradient(90deg, var(--safe), var(--moderate))';

  // 큰 숫자 색
  const score = document.getElementById('balanceScore');
  if (BALANCE.balance < 40) score.style.background = 'linear-gradient(90deg, var(--high), var(--extreme))';
  else if (BALANCE.balance < 70) score.style.background = 'linear-gradient(90deg, var(--caution), var(--moderate))';
  else score.style.background = 'linear-gradient(90deg, var(--safe), var(--moderate))';
  score.style.webkitBackgroundClip = 'text';
  score.style.webkitTextFillColor = 'transparent';
}

function fmtSignedNum(v, digits=2){
  const sign = v >= 0 ? '+' : '';
  return sign + v.toFixed(digits);
}
function fmtMoneySigned(v){
  const sign = v < 0 ? '-' : (v > 0 ? '+' : '');
  return sign + Math.round(Math.abs(v)).toLocaleString();
}
function fmtMoneyKR(v){
  return CURRENT_LANG === 'ko' ? formatKRWUnit(Math.abs(v)) : '';
}

function renderAdvanced(){
  const A = ADVANCED || {};
  const empty = !ITEMS.length;
  const dash = '--';

  const setVal = (id, val, color) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = empty ? dash : val;
    if (color) el.style.color = color;
    else el.style.color = '';
  };

  // VaR/CVaR — 손실은 항상 음수로 표시
  const varText  = !empty && A.var95  ? '-' + Math.round(A.var95).toLocaleString()  : dash;
  const cvarText = !empty && A.cvar95 ? '-' + Math.round(A.cvar95).toLocaleString() : dash;
  setVal('mVaR',  varText,  empty ? '' : 'var(--high)');
  setVal('mCVaR', cvarText, empty ? '' : 'var(--high)');

  // Sharpe — > 1 좋음, 0 ~ 1 보통, < 0 나쁨
  const sharpe = A.sharpe || 0;
  const sharpeColor = empty ? '' : (sharpe > 1 ? 'var(--safe)' : sharpe > 0.5 ? 'var(--moderate)' : sharpe > 0 ? 'var(--caution)' : 'var(--high)');
  setVal('mSharpe', empty ? dash : fmtSignedNum(sharpe), sharpeColor);

  // Sortino — > 1 좋음, > 2 매우 좋음
  const sortino = A.sortino || 0;
  const sortinoColor = empty ? '' : (sortino > 2 ? 'var(--safe)' : sortino > 1 ? 'var(--moderate)' : sortino > 0 ? 'var(--caution)' : 'var(--high)');
  setVal('mSortino', empty ? dash : fmtSignedNum(sortino), sortinoColor);

  // DR — 1.0 = 분산효과 없음, > 1.3 좋음
  const drVal = A.dr || 1;
  const reduction = (A.riskReduction || 0) * 100;
  const drText = empty ? dash : `${reduction.toFixed(1)}% ↓ (DR ${drVal.toFixed(2)})`;
  const drColor = empty ? '' : (reduction > 25 ? 'var(--safe)' : reduction > 12 ? 'var(--moderate)' : 'var(--text-1)');
  setVal('mDR', drText, drColor);

  // 포트폴리오 변동성 — 연환산
  const volPct = (A.portVol || 0) * 100;
  setVal('mPortVol', empty ? dash : `${volPct.toFixed(1)}% (연)`,
    empty ? '' : (volPct < 15 ? 'var(--safe)' : volPct < 25 ? 'var(--moderate)' : volPct < 35 ? 'var(--caution)' : 'var(--high)'));

  // 배당 — 0 이면 행 자체 숨김
  const divRow = document.getElementById('dividendRow');
  if (divRow){
    if (!empty && A.annualDividend > 0){
      divRow.style.display = '';
      const yieldPct = (A.dividendYieldPort || 0) * 100;
      const annualText = Math.round(A.annualDividend).toLocaleString();
      const krSuffix = CURRENT_LANG === 'ko' && A.annualDividend >= 10000 ? ` (${formatKRWUnit(A.annualDividend)})` : '';
      setVal('mDividend', `${annualText}${krSuffix} · ${yieldPct.toFixed(2)}%`, 'var(--safe)');
    } else {
      divRow.style.display = 'none';
    }
  }
}

let CURRENT_STRESS = null;
function applyStressVisuals(){
  if (typeof nodeMeshes === 'undefined' || !nodeMeshes) return;
  if (!CURRENT_STRESS){
    // 원래 색상 복원
    nodeMeshes.forEach(n => {
      n.mesh.material.color.copy(n.baseColor);
      n.mesh.material.emissive.copy(n.baseColor);
      n.halo.material.color.copy(n.baseColor);
    });
    return;
  }
  const scn = STRESS_SCENARIOS[CURRENT_STRESS];
  if (!scn) return;
  // 손실 강도에 따라 색상 매핑: 큰 손실=빨강, 이익=초록
  nodeMeshes.forEach(n => {
    const shock = scn.shocks[n.item.sector] ?? scn.shocks.ETC ?? -0.30;
    let hex;
    if (shock > 0.05) hex = '#00E5A0';            // 이익
    else if (shock > -0.15) hex = '#FFD66B';      // 약한 손실
    else if (shock > -0.30) hex = '#FF8C42';      // 중간 손실
    else if (shock > -0.50) hex = '#FF4560';      // 큰 손실
    else hex = '#7B61FF';                          // 극단 손실
    const c = new THREE.Color(hex);
    n.mesh.material.color.copy(c);
    n.mesh.material.emissive.copy(c);
    n.halo.material.color.copy(c);
  });
}

function renderStress(){
  const cont = document.getElementById('stressScenarios');
  const result = document.getElementById('stressResult');
  if (!cont || !result) return;

  const labelKey = CURRENT_LANG === 'en' ? 'label_en' : 'label_ko';
  const descKey  = CURRENT_LANG === 'en' ? 'desc_en'  : 'desc_ko';
  const yearMap  = { gfc2008:'2008', covid2020:'2020', inflation2022:'2022', dotcom2000:'2000' };

  cont.innerHTML = Object.entries(STRESS_SCENARIOS).map(([k, scn]) => `
    <button class="stress-btn ${CURRENT_STRESS===k?'active':''}" data-key="${k}">
      <div class="stress-btn-year">${yearMap[k] || ''}</div>
      <div>${scn[labelKey].replace(/^\d{4}\s*/, '')}</div>
    </button>
  `).join('');
  cont.querySelectorAll('.stress-btn').forEach(b => {
    b.addEventListener('click', () => {
      CURRENT_STRESS = (CURRENT_STRESS === b.dataset.key) ? null : b.dataset.key;
      renderStress();
      applyStressVisuals();
    });
  });

  if (!CURRENT_STRESS || !ITEMS.length){
    result.innerHTML = `<div class="stress-empty">${ITEMS.length ? t('stressTestEmpty') : (CURRENT_LANG==='en'?'Add holdings to run scenarios':'종목을 추가하면 시나리오를 실행할 수 있습니다')}</div>`;
    return;
  }
  const r = computeStressTest(ITEMS, CURRENT_STRESS);
  if (!r){ result.innerHTML = ''; return; }

  const isGain = r.portLoss >= 0;
  const sign = isGain ? '+' : '-';
  const lossAbs = Math.round(Math.abs(r.portLoss));
  const krSuffix = CURRENT_LANG === 'ko' && lossAbs >= 10000 ? `<div class="stress-headline-pct">${formatKRWUnit(lossAbs)}</div>` : '';

  // 종목별 손익 — 손실 큰 순으로 정렬
  const rows = [...r.breakdown].sort((a,b)=>a.loss-b.loss).slice(0,10);

  result.innerHTML = `
    <div class="stress-headline">
      <div class="stress-headline-loss ${isGain?'gain':''}">${sign}${lossAbs.toLocaleString()}</div>
      <div class="stress-headline-pct">${(r.portLossPct * 100).toFixed(1)}%</div>
      ${krSuffix}
      <div class="stress-headline-desc">${r.scenario[descKey]}</div>
    </div>
    <div class="stress-rows">
      ${rows.map(b => {
        const up = b.shock > 0;
        return `
          <div class="stress-row">
            <span class="stress-row-name" title="${b.name}">${b.name}</span>
            <span class="stress-row-shock ${up?'up':'down'}">${(b.shock*100).toFixed(0)}%</span>
            <span class="stress-row-loss ${up?'up':'down'}">${b.loss>=0?'+':'-'}${Math.round(Math.abs(b.loss)).toLocaleString()}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderInsights(){
  const el = document.getElementById('insights');
  el.innerHTML = '';
  INSIGHTS.forEach(ins=>{
    el.innerHTML += `
      <div class="insight ${ins.level}">
        <div class="insight-title">${ins.title}</div>
        <div>${ins.body}</div>
      </div>
    `;
  });
  // 알림 배너 (가장 심각한 인사이트)
  const top = INSIGHTS.find(i=>i.level==='alert') || INSIGHTS.find(i=>i.level==='warn');
  if (top){
    document.getElementById('alertBanner').classList.add('show');
    document.getElementById('alertText').textContent = top.title.replace(/[⚠✓]/g,'').trim();
  }
}

function renderStockDetail(it){
  if (!it) return;
  document.getElementById('noSelect').style.display = 'none';
  const card = document.getElementById('stockDetail');
  card.classList.add('show');
  const c = riskColor(it.risk_score);
  document.getElementById('sdDot').style.background = c;
  document.getElementById('sdDot').style.color = c;
  document.getElementById('sdName').textContent = getName(it);
  document.getElementById('sdTicker').textContent = it.ticker;
  const pill = document.getElementById('sdPill');
  pill.textContent = riskLabel(it.risk_score);
  pill.style.background = c+'25';
  pill.style.color = c;
  document.getElementById('sdQty').textContent = (it.quantity ?? 1).toLocaleString() + '주';
  document.getElementById('sdValue').textContent = Math.round(it.market_value || 0).toLocaleString();
  document.getElementById('sdWeight').textContent = (it.weight*100).toFixed(2) + '%';
  document.getElementById('sdSector').textContent = sectorLabel(it.sector);
  document.getElementById('sdPrice').textContent = it.current_price.toLocaleString();
  document.getElementById('sdAvg').textContent = Math.round(it.avg_price).toLocaleString();
  const rt = document.getElementById('sdReturn');
  rt.textContent = (it.return_pct>=0?'+':'') + (it.return_pct*100).toFixed(2) + '%';
  rt.style.color = it.return_pct>=0 ? 'var(--safe)' : 'var(--high)';
  document.getElementById('sdVol').textContent = (it.volatility_30d*100).toFixed(1) + '%';
  document.getElementById('sdBeta').textContent = it.beta.toFixed(2);
  document.getElementById('sdDebt').textContent = (it.debt_ratio*100).toFixed(0) + '%';
  const r = document.getElementById('sdRisk');
  r.textContent = it.risk_score + ' / 100';
  r.style.color = c;
}

function updateClock(){
  const d = new Date();
  document.getElementById('updateTime').textContent =
    d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
}

function renderAllUI(){
  renderHoldings();
  renderSectorBars();
  renderRiskDist();
  renderBalance();
  renderAdvanced();
  renderStress();
  renderInsights();
  // REBALANCE 버튼 — 보유 종목 0이면 disabled + 툴팁
  const btnReb = document.getElementById('btnRebalance');
  if (btnReb){
    const empty = !ITEMS || ITEMS.length === 0;
    btnReb.disabled = empty;
    btnReb.title = empty ? (CURRENT_LANG==='en' ? 'Add at least one holding to use rebalancer' : '보유 종목을 먼저 추가하세요') : '';
  }
}

// 알림 배너 초기화 (포트폴리오 변경 시 사라지게)
function clearAlert(){ document.getElementById('alertBanner').classList.remove('show'); }

/* =========================================================
   상관관계 네트워크 (Tier 1 C)
   섹터 상관계수 매트릭스 + 베타·변동성 유사도 보정
   학술 출처: 산업 분류별 상관관계는 KOSPI 200 / S&P 500 실증 연구 평균값 참조
   ========================================================= */
const SECTOR_CORR = {
  IT:        { IT:0.78, BIO:0.32, FIN:0.42, ENERGY:0.28, AUTO:0.52, INDUSTRIAL:0.48, CONSUMER:0.32, REALESTATE:0.30, GLOBAL_ETF:0.75, ETC:0.40 },
  BIO:       { BIO:0.72, FIN:0.22, ENERGY:0.18, AUTO:0.22, INDUSTRIAL:0.28, CONSUMER:0.32, REALESTATE:0.22, GLOBAL_ETF:0.42, ETC:0.30 },
  FIN:       { FIN:0.82, ENERGY:0.45, AUTO:0.52, INDUSTRIAL:0.55, CONSUMER:0.38, REALESTATE:0.68, GLOBAL_ETF:0.62, ETC:0.42 },
  ENERGY:    { ENERGY:0.80, AUTO:0.42, INDUSTRIAL:0.52, CONSUMER:0.32, REALESTATE:0.42, GLOBAL_ETF:0.50, ETC:0.38 },
  AUTO:      { AUTO:0.78, INDUSTRIAL:0.62, CONSUMER:0.42, REALESTATE:0.35, GLOBAL_ETF:0.55, ETC:0.42 },
  INDUSTRIAL:{ INDUSTRIAL:0.78, CONSUMER:0.42, REALESTATE:0.48, GLOBAL_ETF:0.55, ETC:0.45 },
  CONSUMER:  { CONSUMER:0.74, REALESTATE:0.45, GLOBAL_ETF:0.48, ETC:0.40 },
  REALESTATE:{ REALESTATE:0.82, GLOBAL_ETF:0.55, ETC:0.42 },
  GLOBAL_ETF:{ GLOBAL_ETF:0.85, ETC:0.50 },
  ETC:       { ETC:0.50 }
};

function correlationOf(secA, secB){
  return SECTOR_CORR[secA]?.[secB] ?? SECTOR_CORR[secB]?.[secA] ?? 0.30;
}

function pairCorrelation(a, b){
  if (a.ticker === b.ticker) return 1.0;
  let base = correlationOf(a.sector, b.sector);
  // 베타 유사도 보정 (CAPM 시스템 위험 동조성)
  const betaDiff = Math.abs(a.beta - b.beta);
  const betaAdj = Math.max(0, 0.10 - betaDiff * 0.06);
  // 변동성 유사도 보정 (ARCH/GARCH 동조성)
  const volDiff = Math.abs(a.volatility_30d - b.volatility_30d);
  const volAdj = Math.max(0, 0.06 - volDiff * 0.12);
  return Math.min(0.95, base + betaAdj + volAdj);
}

let networkMode = false;
let networkThreshold = 0.5;
const networkGroup = new THREE.Group();
sphereGroup.add(networkGroup);

function disposeNetworkLines(){
  while (networkGroup.children.length){
    const c = networkGroup.children[0];
    networkGroup.remove(c);
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
  }
}

function buildCorrelationLines(){
  disposeNetworkLines();
  if (!networkMode) return;
  const items = rebalanceMode && TARGET_ITEMS.length ? TARGET_ITEMS : ITEMS;
  if (items.length < 2) return;

  // 모든 쌍에 대해 상관계수 계산
  for (let i = 0; i < items.length; i++){
    for (let j = i+1; j < items.length; j++){
      const a = items[i], b = items[j];
      const corr = pairCorrelation(a, b);
      if (corr < networkThreshold) continue;

      const posA = latLngToVec3(a.sphere_coord.lat, a.sphere_coord.lng, a.sphere_coord.r);
      const posB = latLngToVec3(b.sphere_coord.lat, b.sphere_coord.lng, b.sphere_coord.r);

      // 곡선으로 만들기 (구 표면 위로 살짝 들어올림)
      const mid = posA.clone().lerp(posB, 0.5);
      const liftScale = 1 + (1 - mid.length()/2) * 0.15;
      mid.normalize().multiplyScalar(mid.length() * liftScale + 0.1);
      const curve = new THREE.QuadraticBezierCurve3(posA, mid, posB);
      const points = curve.getPoints(20);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

      // 강도별 색상
      let color;
      if (corr >= 0.85) color = 0xFF4560;       // 매우 강함 (빨강)
      else if (corr >= 0.70) color = 0xFF8C42;  // 강함 (주황)
      else color = 0x00D4FF;                     // 보통 (시안)
      const opacity = Math.min(0.85, 0.20 + (corr - networkThreshold) * 1.5);
      const lineMat = new THREE.LineBasicMaterial({ color, transparent:true, opacity });
      const line = new THREE.Line(lineGeo, lineMat);
      line.userData = { corr, a:a.ticker, b:b.ticker };
      networkGroup.add(line);
    }
  }
}

/* =========================================================
   리밸런싱 추천 엔진
   진단 (W1~W5) → 후보 선별 → 시뮬레이션 → 상위 5개 추천
   ========================================================= */

// 약점 진단
function diagnoseWeaknesses(items, balance){
  const weaknesses = [];
  const sorted = [...items].sort((a,b)=>b.weight - a.weight);
  const sectors = balance.sectorWeights || {};

  // W1: 섹터 편중 (HHI > 0.25 또는 단일 섹터 > 35%)
  const topSec = Object.entries(sectors).sort((a,b)=>b[1]-a[1])[0];
  if ((parseFloat(balance.hhi) > 0.25) || (topSec && topSec[1] > 0.35)){
    weaknesses.push({ code:'W1', priority:1,
      detail:{ dominantSector: topSec[0], dominantWeight: topSec[1], hhi: parseFloat(balance.hhi) }
    });
  }
  // W2: 단일 종목 집중 (>35%)
  if (sorted[0] && sorted[0].weight > 0.35){
    weaknesses.push({ code:'W2', priority:2,
      detail:{ ticker:sorted[0].ticker, name:sorted[0].name, name_en:sorted[0].name_en,
               weight:sorted[0].weight, quantity:sorted[0].quantity }
    });
  }
  // W3: 고위험 (avgRisk > 65)
  if (balance.avgRisk > 65){
    weaknesses.push({ code:'W3', priority:3, detail:{ avgRisk: balance.avgRisk } });
  }
  // W4: 분산 부족 (섹터 < 4개 또는 ETF 미보유)
  const sectorCount = Object.keys(sectors).length;
  const hasETF = items.some(it => it.sector === 'GLOBAL_ETF');
  if (sectorCount < 4 || !hasETF){
    weaknesses.push({ code:'W4', priority:4, detail:{ sectorCount, hasETF } });
  }
  // W5: 리스크 편차 (deviation < 50)
  if (balance.deviation < 50){
    weaknesses.push({ code:'W5', priority:5, detail:{ deviation: balance.deviation } });
  }
  // W6: 지역 편중 (모든 종목이 KR 또는 모두 US)
  const krCount = items.filter(i => i.ticker.endsWith('.KS')).length;
  const usCount = items.length - krCount;
  if (items.length >= 3 && (krCount === 0 || usCount === 0)){
    weaknesses.push({ code:'W6', priority:3, detail:{ allKR: usCount === 0, allUS: krCount === 0 } });
  }
  // W7: 헷지 자산 부재 (변동성 평균 > 0.25, 채권/금 미보유)
  const hasHedge = items.some(it => /BND|TLT|IEF|LQD|GLD|SLV/i.test(it.ticker));
  const avgVol = items.reduce((s,i)=>s+i.volatility_30d, 0) / items.length;
  if (avgVol > 0.25 && !hasHedge && items.length >= 3){
    weaknesses.push({ code:'W7', priority:4, detail:{ avgVol } });
  }
  return weaknesses;
}

// 임시 holdings로 BALANCE 계산
function computeBalanceFor(holdings){
  const raws = targetPortfolioToRaw(holdings);
  if (raws.length === 0) return null;
  const items = mapSphereCoords(computeRiskScores(standardize(raws)));
  return computeBalance(items);
}

// 단일 추천 적용 시뮬레이션 (현재 TARGET_HOLDINGS에 액션 적용 후 결과 비교)
function simulateAction(action, baseHoldings){
  const cloned = baseHoldings.map(h => ({ ...h }));
  if (action.type === 'add'){
    cloned.push({ ticker:action.asset.ticker, quantity:action.quantity, avg_price:action.asset.current_price });
  } else if (action.type === 'reduce'){
    const t = cloned.find(h => h.ticker === action.ticker);
    if (t) t.quantity = action.newQty;
  }
  const newBal = computeBalanceFor(cloned);
  if (!newBal) return null;
  return {
    holdings: cloned,
    balance: newBal,
    deltaBalance: newBal.balance_raw - (BALANCE.balance_raw || 0),
    deltaHHI: parseFloat(newBal.hhi) - parseFloat(BALANCE.hhi || 0),
    deltaDiverse: newBal.diverse_raw - (BALANCE.diverse_raw || 0),
    deltaRisk: newBal.avgRisk_raw - (BALANCE.avgRisk_raw || 0)
  };
}

// 약점별 후보 액션 생성
function buildActionsForWeakness(weakness, items, ownedSet, totalValue){
  const targetPct = 0.05; // 신규 종목은 자산의 5% 비중으로
  const actions = [];

  if (weakness.code === 'W1' || weakness.code === 'W4'){
    // 부족한 섹터에서 종목 후보 — 섹터당 최대 3개
    const sectorWeights = {};
    items.forEach(it => sectorWeights[it.sector] = (sectorWeights[it.sector]||0) + it.weight);
    const candidateSectors = Object.keys(SECTOR_DEF).filter(sec =>
      (sectorWeights[sec] || 0) < 0.10 && sec !== 'ETC'
    );
    candidateSectors.forEach(sec => {
      const inSec = ASSET_DB.filter(a => a.sector === sec && !ownedSet.has(a.ticker));
      const ranked = inSec
        .map(a => ({ a, s: Math.log(1 + (a.liquidity_volume || 1)) / Math.max(a.volatility_30d, 0.01) }))
        .sort((x,y)=>y.s-x.s);
      ranked.slice(0, 3).forEach(({ a }) => {
        const qty = Math.max(1, Math.round(totalValue * targetPct / a.current_price));
        actions.push({ type:'add', asset:a, quantity:qty, weakness:weakness.code, weakness_priority:weakness.priority });
      });
    });
  }

  if (weakness.code === 'W2'){
    // 종목 집중 → 비중 25%로 축소
    const d = weakness.detail;
    const item = items.find(it => it.ticker === d.ticker);
    if (item){
      const targetWeight = 0.25;
      const newQty = Math.max(1, Math.floor(item.quantity * (targetWeight / item.weight)));
      if (newQty < item.quantity){
        actions.push({
          type:'reduce', ticker:item.ticker, name:item.name, name_en:item.name_en,
          currentQty:item.quantity, newQty,
          weakness:weakness.code, weakness_priority:weakness.priority
        });
      }
    }
  }

  if (weakness.code === 'W3' || weakness.code === 'W5'){
    // 안전 자산 추천 — ETF + 방어주 + 채권 (다양한 옵션 5개)
    const safeETFs = ASSET_DB.filter(a =>
      !ownedSet.has(a.ticker) && a.is_etf &&
      a.beta < 0.7 &&
      ['GLOBAL_ETF','CONSUMER'].includes(a.sector)
    ).sort((a,b) => a.volatility_30d - b.volatility_30d).slice(0, 3);
    const defensives = ASSET_DB.filter(a =>
      !ownedSet.has(a.ticker) && !a.is_etf &&
      a.beta < 0.65 &&
      ['CONSUMER','BIO','REALESTATE','FIN'].includes(a.sector)
    ).sort((a,b) => a.volatility_30d - b.volatility_30d).slice(0, 2);
    [...safeETFs, ...defensives].forEach(asset => {
      const qty = Math.max(1, Math.round(totalValue * targetPct / asset.current_price));
      actions.push({ type:'add', asset, quantity:qty, weakness:weakness.code, weakness_priority:weakness.priority });
    });
  }

  if (weakness.code === 'W6'){
    // 지역 편중 — 반대 지역 광역 ETF 추천
    const targets = weakness.detail.allKR
      ? ['VOO','SPY','VTI','QQQ','VEA']     // KR만 → 미국·선진국
      : ['069500.KS','102110.KS','360750.KS']; // US만 → 한국·아시아
    const candidates = ASSET_DB.filter(a => targets.includes(a.ticker) && !ownedSet.has(a.ticker));
    candidates.slice(0,3).forEach(asset => {
      const qty = Math.max(1, Math.round(totalValue * targetPct / asset.current_price));
      actions.push({ type:'add', asset, quantity:qty, weakness:weakness.code, weakness_priority:weakness.priority });
    });
  }

  if (weakness.code === 'W7'){
    // 헷지 부재 — 채권/금/안전자산 추천
    const hedges = ['BND','TLT','GLD','IEF','LQD'];
    const candidates = ASSET_DB.filter(a => hedges.includes(a.ticker) && !ownedSet.has(a.ticker));
    candidates.slice(0,3).forEach(asset => {
      const qty = Math.max(1, Math.round(totalValue * targetPct / asset.current_price));
      actions.push({ type:'add', asset, quantity:qty, weakness:weakness.code, weakness_priority:weakness.priority });
    });
  }

  return actions;
}

// 추천 생성 (상위 5개)
function generateRecommendations(items, balance){
  if (!items || items.length === 0) return [];
  const ownedSet = new Set(items.map(it => it.ticker));
  const totalValue = items.reduce((s,it)=>s+(it.market_value||0), 0);
  const baseHoldings = items.map(it => ({ ticker:it.ticker, quantity:it.quantity, avg_price:it.avg_price }));

  const weaknesses = diagnoseWeaknesses(items, balance);
  if (weaknesses.length === 0) return []; // 균형 잡혀있으면 추천 없음

  // 모든 약점에 대해 액션 후보 생성
  const allActions = [];
  weaknesses.forEach(w => {
    const acts = buildActionsForWeakness(w, items, ownedSet, totalValue);
    allActions.push(...acts);
  });

  // 각 액션에 대해 시뮬레이션
  const simulated = [];
  allActions.forEach(action => {
    const impact = simulateAction(action, baseHoldings);
    if (!impact) return;
    simulated.push({ ...action, impact });
  });

  // 약점 타입별로 그룹화 + 각 그룹 내 deltaBalance 큰 순 정렬
  const groups = {};
  simulated.forEach(r => {
    if (!groups[r.weakness]) groups[r.weakness] = [];
    groups[r.weakness].push(r);
  });
  Object.values(groups).forEach(arr =>
    arr.sort((a,b) => b.impact.deltaBalance - a.impact.deltaBalance)
  );
  // 약점 우선순위 순서로 그룹 정렬 + 그룹당 최대 4개로 제한 (특정 약점 도배 방지)
  const sortedGroups = Object.values(groups)
    .sort((a,b) => (a[0]?.weakness_priority || 99) - (b[0]?.weakness_priority || 99))
    .map(g => g.slice(0, 4));
  // 라운드로빈 인터리브 — 같은 약점 타입이 연속되지 않도록
  const interleaved = [];
  let added = true;
  while (added){
    added = false;
    for (const group of sortedGroups){
      if (group.length > 0){
        interleaved.push(group.shift());
        added = true;
      }
    }
  }

  // 중복 제거 (같은 종목은 한 번만)
  const seen = new Set();
  const filtered = interleaved.filter(rec => {
    const key = rec.type === 'add' ? rec.asset.ticker : rec.ticker;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return filtered.slice(0, 30);  // 최대 30개 후보 (5개 표시 + 25개 백로그)
}

/* =========================================================
   리밸런싱 시뮬레이터 (추천 엔진 + 수동 편집 통합)
   ========================================================= */
let rebalanceMode = false;
let TARGET_HOLDINGS = null;
let TARGET_ITEMS = [], TARGET_BALANCE = {}, TARGET_INSIGHTS = [];
let RECOMMENDATIONS = [];          // 화면에 표시되는 추천 (최대 5)
let _recBuffer = [];               // 백로그 — 건너뛰면 여기서 다음 추천을 가져옴
let _initialRecCount = 0;          // 진단 시 처음 생성된 추천 총 개수
const APPLIED_RECS = new Set();   // 적용된 추천 인덱스
const VISIBLE_RECS_COUNT = 5;

function targetPortfolioToRaw(holdings){
  const { items, totalValue } = computeWeights(holdings);
  return items.map(h => {
    const a = ASSET_BY_TICKER[h.ticker];
    if (!a) return null;
    return {
      ticker:a.ticker, name:a.name, name_en:a.name_en, sector:a.sector,
      weight:h.weight, quantity:h.quantity, market_value:h.market_value,
      current_price:a.current_price, avg_price:h.avg_price ?? a.current_price,
      market_cap:a.market_cap, volatility_30d:a.volatility_30d,
      beta:a.beta, debt_ratio:a.debt_ratio, liquidity_volume:a.liquidity_volume
    };
  }).filter(Boolean);
}

function recomputeTarget(){
  if (!TARGET_HOLDINGS) return;
  const raw = targetPortfolioToRaw(TARGET_HOLDINGS);
  if (raw.length === 0){
    TARGET_ITEMS = [];
    TARGET_BALANCE = { balance:0, diverse:0, deviation:0, sphericity:0, hhi:'0.000', avgRisk:0, sectorWeights:{} };
    TARGET_INSIGHTS = [];
    return;
  }
  TARGET_ITEMS = mapSphereCoords(computeRiskScores(standardize(raw)));
  TARGET_BALANCE = computeBalance(TARGET_ITEMS);
  TARGET_INSIGHTS = generateInsights(TARGET_ITEMS, TARGET_BALANCE);
}

function enterRebalance(){
  if (rebalanceMode) return;
  // 빈 포트폴리오면 버튼이 이미 disabled — 별도 안내 불필요
  if (!ITEMS || ITEMS.length === 0) return;
  rebalanceMode = true;
  TARGET_HOLDINGS = JSON.parse(JSON.stringify(activePortfolio().holdings));
  recomputeTarget();
  // 추천 생성 — 최대 15개 후보 → 5개 표시 + 10개 백로그
  const allRecs = generateRecommendations(ITEMS, BALANCE);
  RECOMMENDATIONS = allRecs.slice(0, VISIBLE_RECS_COUNT);
  _recBuffer = allRecs.slice(VISIBLE_RECS_COUNT);
  _initialRecCount = allRecs.length;
  APPLIED_RECS.clear();
  document.body.classList.add('rebalance-mode');
  document.getElementById('rebalancePanel').classList.add('show');
  document.getElementById('rbIndicator').classList.add('show');
  document.getElementById('btnRebalance').classList.add('rebalance-active');
  clearAlert();
  selectedTicker = null;
  document.getElementById('stockDetail').classList.remove('show');
  document.getElementById('noSelect').style.display = 'block';
  rebuildNodesForCurrentMode();
  renderHoldings();
  renderRebalancePanel();
}

function exitRebalance(apply = false){
  if (!rebalanceMode) return;
  if (apply && TARGET_HOLDINGS){
    activePortfolio().holdings = TARGET_HOLDINGS;
    activePortfolio().updatedAt = Date.now();
    saveState(true);  // 리밸런싱 적용 → 토스트 노출
  }
  rebalanceMode = false;
  TARGET_HOLDINGS = null;
  TARGET_ITEMS = [];
  TARGET_BALANCE = {};
  TARGET_INSIGHTS = [];
  RECOMMENDATIONS = [];
  APPLIED_RECS.clear();
  document.body.classList.remove('rebalance-mode');
  document.getElementById('rebalancePanel').classList.remove('show');
  document.getElementById('rbIndicator').classList.remove('show');
  document.getElementById('btnRebalance').classList.remove('rebalance-active');
  rebuildAll();
}

// 추천 액션을 TARGET_HOLDINGS에 반영
function applyRecommendation(idx){
  const rec = RECOMMENDATIONS[idx];
  if (!rec || APPLIED_RECS.has(idx)) return;
  if (rec.type === 'add'){
    // 이미 보유 중이면 수량 합산
    const existing = TARGET_HOLDINGS.find(h => h.ticker === rec.asset.ticker);
    if (existing) existing.quantity += rec.quantity;
    else TARGET_HOLDINGS.push({
      ticker: rec.asset.ticker, quantity: rec.quantity, avg_price: rec.asset.current_price
    });
  } else if (rec.type === 'reduce'){
    const t = TARGET_HOLDINGS.find(h => h.ticker === rec.ticker);
    if (t) t.quantity = rec.newQty;
  }
  APPLIED_RECS.add(idx);
  recomputeTarget();
  rebuildNodesForCurrentMode();
  renderHoldings();
  renderRebalancePanel();
}

function skipRecommendation(idx){
  if (APPLIED_RECS.has(idx)) return; // 이미 적용된 건 skip 불가
  // 해당 추천 제거
  RECOMMENDATIONS.splice(idx, 1);
  // APPLIED_RECS의 인덱스 재조정
  const newApplied = new Set();
  APPLIED_RECS.forEach(i => { if (i < idx) newApplied.add(i); else if (i > idx) newApplied.add(i-1); });
  APPLIED_RECS.clear();
  newApplied.forEach(i => APPLIED_RECS.add(i));
  // 백로그에서 다음 추천 가져와 채움
  if (_recBuffer.length > 0){
    RECOMMENDATIONS.push(_recBuffer.shift());
  }
  renderRebalancePanel();
}

// 초기화 — 한 번 클릭으로 즉시 실행
function resetTarget(){
  if (!rebalanceMode) return;
  TARGET_HOLDINGS = JSON.parse(JSON.stringify(activePortfolio().holdings));
  APPLIED_RECS.clear();
  recomputeTarget();
  // 초기화 시 추천도 다시 생성 (건너뛴 것들 복원, 백로그도 재구성)
  const allRecs = generateRecommendations(ITEMS, BALANCE);
  RECOMMENDATIONS = allRecs.slice(0, VISIBLE_RECS_COUNT);
  _recBuffer = allRecs.slice(VISIBLE_RECS_COUNT);
  _initialRecCount = allRecs.length;
  rebuildNodesForCurrentMode();
  renderHoldings();
  renderRebalancePanel();
}

async function applyTargetToActive(){
  if (!rebalanceMode || !TARGET_HOLDINGS) return;
  if (!await customConfirm(t('rbApplyConfirm', BALANCE.balance, TARGET_BALANCE.balance))) return;
  exitRebalance(true);
}

// rebalance 모드일 때는 TARGET_HOLDINGS 수량을 편집
function updateTargetQuantity(ticker, newQty){
  if (!TARGET_HOLDINGS) return;
  const target = TARGET_HOLDINGS.find(h => h.ticker === ticker);
  if (!target) return;
  target.quantity = Math.max(1, Math.floor(newQty));
  recomputeTarget();
  rebuildNodesForCurrentMode();
  renderRebalancePanel();
  renderHoldings();
}

// 모드에 따라 ITEMS 또는 TARGET_ITEMS 사용
function rebuildNodesForCurrentMode(){
  const items = rebalanceMode ? TARGET_ITEMS : ITEMS;
  // 기존 disposeDynamic + 노드 재생성 로직 재사용
  disposeDynamic();
  items.forEach(it=>{
    const pos = latLngToVec3(it.sphere_coord.lat, it.sphere_coord.lng, it.sphere_coord.r);
    const surfPos = latLngToVec3(it.sphere_coord.lat, it.sphere_coord.lng, 1.0);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([surfPos, pos]);
    const lineMat = new THREE.LineBasicMaterial({ color: riskColor(it.risk_score), transparent:true, opacity:0.4 });
    dynamicGroup.add(new THREE.Line(lineGeo, lineMat));
    const radius = it.weight * 0.5 + 0.02;
    const sphereGeo = new THREE.SphereGeometry(radius, 24, 18);
    const color = new THREE.Color(riskColor(it.risk_score));
    const mat = new THREE.MeshPhongMaterial({ color, emissive:color, emissiveIntensity:0.6, shininess:120, transparent:true, opacity:0.85 });
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.copy(pos);
    mesh.userData.item = it;
    dynamicGroup.add(mesh);
    const haloGeo = new THREE.SphereGeometry(radius*1.6, 16, 12);
    const haloMat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.18 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(pos);
    dynamicGroup.add(halo);
    nodeMeshes.push({ mesh, halo, item: it, baseColor: color, baseRadius: radius });
  });
  // 네트워크 라인도 새로 그려야 함 (노드 위치가 바뀌었을 수 있음)
  buildCorrelationLines();
}

function renderRebalancePanel(){
  if (!rebalanceMode) return;
  const C = BALANCE, T = TARGET_BALANCE;
  // 큰 점수는 정수, 델타는 소수점 1자리
  document.getElementById('rbCurrentScore').textContent = (C.balance_raw ?? 0).toFixed(1);
  document.getElementById('rbTargetScore').textContent = (T.balance_raw ?? 0).toFixed(1);
  document.getElementById('rbCurrentGrade').textContent = balanceGrade(C.balance ?? 0).txt;
  document.getElementById('rbTargetGrade').textContent = balanceGrade(T.balance ?? 0).txt;

  // 타겟 점수 색상 (개선=녹색, 악화=빨강) — float 기반 비교로 미세 차이도 감지
  const targetEl = document.getElementById('rbTargetScore');
  const delta = (T.balance_raw ?? 0) - (C.balance_raw ?? 0);
  const grad = delta > 0.05 ? 'linear-gradient(90deg, var(--safe), var(--moderate))'
             : delta < -0.05 ? 'linear-gradient(90deg, var(--high), var(--extreme))'
             : 'linear-gradient(90deg, var(--text-1), var(--text-2))';
  targetEl.style.background = grad;
  targetEl.style.webkitBackgroundClip = 'text';
  targetEl.style.webkitTextFillColor = 'transparent';

  // 델타 표시 (소수점 1자리)
  const deltaEl = document.getElementById('rbDelta');
  const dStr = Math.abs(delta).toFixed(1);
  if (delta > 0.05) deltaEl.innerHTML = `<span class="rb-delta-up">▲ ${t('rbDeltaImproved', dStr)}</span>`;
  else if (delta < -0.05) deltaEl.innerHTML = `<span class="rb-delta-down">▼ ${t('rbDeltaWorsened', dStr)}</span>`;
  else deltaEl.innerHTML = `<span class="rb-delta-zero">${t('rbDeltaSame')}</span>`;

  // 메트릭 비교 테이블 — raw float 사용해서 미세 변화도 보이게
  const metrics = [
    [t('rbMetricBalance'),     C.balance_raw,    T.balance_raw,    true,  1, ''],
    [t('rbMetricDiverse'),     C.diverse_raw,    T.diverse_raw,    true,  1, ''],
    [t('rbMetricDeviation'),   C.deviation_raw,  T.deviation_raw,  true,  1, ''],
    [t('rbMetricSphericity'),  C.sphericity_raw, T.sphericity_raw, true,  1, ''],
    [t('rbMetricHHI'),         C.hhi_raw,        T.hhi_raw,        false, 3, ''],
    [t('rbMetricRisk'),        C.avgRisk_raw,    T.avgRisk_raw,    false, 1, '']
  ];
  document.getElementById('rbMetrics').innerHTML = metrics.map(([name, c, ta, betterUp, dec, suf])=>{
    const d = ta - c;
    const isBetter = betterUp ? d > 0 : d < 0;
    const isWorse  = betterUp ? d < 0 : d > 0;
    const cls = isBetter ? 'up' : (isWorse ? 'down' : '');
    const fmt = v => Number(v).toFixed(dec) + suf;
    return `
      <div class="rb-metric">
        <span class="rb-metric-name">${name}</span>
        <span class="rb-metric-from">${fmt(c)}</span>
        <span class="rb-metric-arrow">→</span>
        <span class="rb-metric-to ${cls}">${fmt(ta)}</span>
      </div>`;
  }).join('');

  // 추천 카드 렌더
  renderRecommendations();

  // 변경사항 없으면 [적용하기] 비활성화
  const applyBtn = document.getElementById('rbApply');
  if (applyBtn){
    const changed = hasTargetChanged();
    applyBtn.disabled = !changed;
    applyBtn.title = changed ? '' : (CURRENT_LANG==='en' ? 'No changes to apply' : '변경사항이 없습니다');
  }
}

// TARGET이 실제 STATE와 다른지 비교
function hasTargetChanged(){
  if (!TARGET_HOLDINGS) return false;
  const current = activePortfolio().holdings;
  if (current.length !== TARGET_HOLDINGS.length) return true;
  // ticker → quantity 매핑 비교
  const cMap = new Map(current.map(h => [h.ticker, h.quantity]));
  for (const t of TARGET_HOLDINGS){
    if (cMap.get(t.ticker) !== t.quantity) return true;
  }
  return false;
}

function renderRecommendations(){
  const el = document.getElementById('rbRecommendations');
  if (!el) return;
  if (!RECOMMENDATIONS || RECOMMENDATIONS.length === 0){
    // 처음부터 0개 = 진짜 균형 / 시작은 있었는데 다 건너뜀 = 다른 메시지
    const isAllSkipped = _initialRecCount > 0;
    const titleKey = isAllSkipped ? 'rbRecAllSkippedTitle' : 'rbRecEmptyTitle';
    const bodyKey  = isAllSkipped ? 'rbRecAllSkipped'      : 'rbRecEmpty';
    el.innerHTML = `
      <div class="rec-empty ${isAllSkipped ? 'skipped' : ''}">
        <strong>${t(titleKey)}</strong>
        ${t(bodyKey)}
      </div>
    `;
    return;
  }
  el.innerHTML = RECOMMENDATIONS.map((rec, idx) => {
    const applied = APPLIED_RECS.has(idx);
    const head = rec.type === 'add' ? `
      <span class="rec-badge add">${t('rbRecAdd')}</span>
      <span class="rec-name">${getName(rec.asset)} <span style="color:var(--text-2);font-weight:300;">${rec.asset.ticker}</span></span>
    ` : `
      <span class="rec-badge reduce">${t('rbRecReduce')}</span>
      <span class="rec-name">${rec.name_en && CURRENT_LANG==='en' ? rec.name_en : rec.name} <span style="color:var(--text-2);font-weight:300;">${rec.ticker}</span></span>
    `;
    const formatMoney = v => Math.round(v).toLocaleString();
    const krwSuffix = (amt) => CURRENT_LANG === 'ko' ? ` <span style="color:var(--text-2); font-size:10.5px;">(${formatKRWUnit(amt)})</span>` : '';
    let meta;
    if (rec.type === 'add'){
      const unit = rec.asset.current_price.toLocaleString();
      const totalAmt = rec.asset.current_price * rec.quantity;
      meta = `${sectorLabel(rec.asset.sector)} · <b>${unit}</b> × ${rec.quantity}${t('sharesUnit')} = <b style="color:var(--text-0);">${formatMoney(totalAmt)}</b>${krwSuffix(totalAmt)}`;
    } else {
      // 축소: 현재 평가금액 → 변경 후 평가금액
      const item = ITEMS.find(it => it.ticker === rec.ticker);
      const price = item ? item.current_price : 0;
      const beforeAmt = rec.currentQty * price;
      const afterAmt = rec.newQty * price;
      const soldAmt = (rec.currentQty - rec.newQty) * price;
      meta = `<b>${rec.currentQty}</b>${t('sharesUnit')} (${formatMoney(beforeAmt)}) → <b>${rec.newQty}</b>${t('sharesUnit')} (${formatMoney(afterAmt)})${krwSuffix(afterAmt)}<br><span style="color:var(--caution); font-size: 11px;">${t('rbReduceSold', formatMoney(soldAmt))}${krwSuffix(soldAmt)}</span>`;
    }
    const reason = renderReason(rec);
    const impact = rec.impact;
    const arrow = (cur, next, dec=1, betterUp=true) => {
      const d = next - cur;
      const cls = (betterUp ? d > 0 : d < 0) ? 'delta-up' : ((betterUp ? d < 0 : d > 0) ? 'delta-down' : '');
      return `<span class="${cls}">${cur.toFixed(dec)} → <b>${next.toFixed(dec)}</b></span>`;
    };
    const impactRows = `
      <div class="rec-impact-row"><span class="lbl">${t('rbImpactBalance')}</span><span class="val">${arrow(BALANCE.balance_raw||0, impact.balance.balance_raw||0, 1, true)}</span></div>
      <div class="rec-impact-row"><span class="lbl">${t('rbImpactHHI')}</span><span class="val">${arrow(parseFloat(BALANCE.hhi||0), parseFloat(impact.balance.hhi||0), 3, false)}</span></div>
      <div class="rec-impact-row"><span class="lbl">${t('rbImpactDiverse')}</span><span class="val">${arrow(BALANCE.diverse_raw||0, impact.balance.diverse_raw||0, 1, true)}</span></div>
      <div class="rec-impact-row"><span class="lbl">${t('rbImpactRisk')}</span><span class="val">${arrow(BALANCE.avgRisk_raw||0, impact.balance.avgRisk_raw||0, 1, false)}</span></div>
    `;
    const applyLabel = rec.type === 'add' ? t('rbRecApplyAdd', rec.quantity) : t('rbRecApplyReduce', rec.newQty);
    const weaknessTag = `<span class="rec-weakness-tag">${t('weakness' + rec.weakness)}</span>`;
    return `
      <div class="rec-card ${rec.type} w-${rec.weakness} ${applied?'applied':''}" data-idx="${idx}">
        ${weaknessTag}
        <div class="rec-head">${head}</div>
        <div class="rec-meta">${meta}</div>
        <div class="rec-reason">${reason}</div>
        <div class="rec-impact">${impactRows}</div>
        <div class="rec-actions">
          <button class="rec-btn apply" data-action="apply" data-idx="${idx}">${applyLabel}</button>
          <button class="rec-btn skip" data-action="skip" data-idx="${idx}">${t('rbRecSkip')}</button>
        </div>
      </div>
    `;
  }).join('');

  // 이벤트 위임
  el.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.idx, 10);
      if (btn.dataset.action === 'apply') applyRecommendation(idx);
      else if (btn.dataset.action === 'skip') skipRecommendation(idx);
    });
  });
}

function renderReason(rec){
  const w = rec.weakness;
  const targetSec = rec.type === 'add' ? sectorLabel(rec.asset.sector) : '';
  if (w === 'W1' || w === 'W4'){
    const dom = Object.entries(BALANCE.sectorWeights || {}).sort((a,b)=>b[1]-a[1])[0];
    const domSec = dom ? sectorLabel(dom[0]) : '?';
    const domPct = dom ? ((dom[1]||0)*100).toFixed(0) : '0';
    if (w === 'W1') return t('rbReasonW1', domSec, domPct, targetSec);
    return t('rbReasonW4', targetSec);
  }
  if (w === 'W2'){
    const top = ITEMS.slice().sort((a,b)=>b.weight-a.weight)[0];
    return t('rbReasonW2', getName(top), (top.weight*100).toFixed(0));
  }
  if (w === 'W3') return t('rbReasonW3', targetSec);
  if (w === 'W5') return t('rbReasonW5', targetSec);
  if (w === 'W6'){
    const region = CURRENT_LANG==='en' ? (rec.asset.ticker.endsWith('.KS') ? 'Korea' : 'US') : (rec.asset.ticker.endsWith('.KS') ? '한국' : '미국');
    return t('rbReasonW6', region, getName(rec.asset));
  }
  if (w === 'W7') return t('rbReasonW7', getName(rec.asset));
  return '';
}

// 전체 리빌드 (포트폴리오 변경/추가/삭제/비중수정 시 호출)
function rebuildAll(){
  clearAlert();
  selectedTicker = null;
  document.getElementById('stockDetail').classList.remove('show');
  document.getElementById('noSelect').style.display = 'block';
  runPipeline();
  // 리밸런싱 모드면 TARGET을 그리고, 아니면 현재 ITEMS를 그림
  if (rebalanceMode){
    recomputeTarget();
    rebuildNodesForCurrentMode();
    renderRebalancePanel();
  } else {
    rebuildNodes();
  }
  // 네트워크 모드면 상관관계 라인도 갱신
  buildCorrelationLines();
  renderAllUI();
}

/* =========================================================
   포트폴리오 CRUD
   ========================================================= */
function renderPortfolioSelect(){
  const active = activePortfolio();
  document.getElementById('pfCurrentName').textContent = active.name;
  document.getElementById('pfCurrentMeta').textContent =
    t('assetsCount', active.holdings.length, STATE.portfolios.length);

  const list = document.getElementById('pfList');
  list.innerHTML = '';
  STATE.portfolios.forEach(p=>{
    const item = document.createElement('div');
    item.className = 'pf-item' + (p.id === STATE.activeId ? ' active' : '');
    const date = new Date(p.updatedAt);
    const dateStr = `${date.getMonth()+1}/${date.getDate()}`;
    item.innerHTML = `
      <div class="pf-item-dot"></div>
      <div class="pf-item-info">
        <div class="pf-item-name">${escapeHtml(p.name)}</div>
        <div class="pf-item-meta">
          <span>${t('portfolioCount', p.holdings.length)}</span>
          <span>·</span>
          <span>${t('updatedAt', dateStr)}</span>
        </div>
      </div>
      <span class="pf-item-count">${p.holdings.length}</span>
    `;
    item.addEventListener('click', ()=>{
      STATE.activeId = p.id;
      saveState();
      closeDropdown();
      rebuildAll();
    });
    list.appendChild(item);
  });

  // 푸터 (생성 한도 안내)
  const div = document.createElement('div');
  div.className = 'pf-list-divider';
  list.appendChild(div);
  const footer = document.createElement('div');
  footer.className = 'pf-list-footer';
  footer.textContent = `${STATE.portfolios.length} / ${MAX_PORTFOLIOS} portfolios`;
  list.appendChild(footer);

  document.getElementById('pfDelete').disabled = STATE.portfolios.length <= 1;
  const newBtn = document.getElementById('pfNew');
  newBtn.disabled = STATE.portfolios.length >= MAX_PORTFOLIOS;
  newBtn.title = newBtn.disabled
    ? `최대 ${MAX_PORTFOLIOS}개까지 만들 수 있습니다`
    : '새 포트폴리오 만들기';
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function openDropdown(){
  document.getElementById('pfCurrent').classList.add('open');
  document.getElementById('pfList').classList.add('show');
}
function closeDropdown(){
  document.getElementById('pfCurrent').classList.remove('open');
  document.getElementById('pfList').classList.remove('show');
}
document.getElementById('pfCurrent').addEventListener('click', e=>{
  e.stopPropagation();
  const isOpen = document.getElementById('pfList').classList.contains('show');
  if (isOpen) closeDropdown(); else openDropdown();
});
document.addEventListener('click', e=>{
  if (!e.target.closest('#pfDropdown')) closeDropdown();
});

document.getElementById('pfNew').addEventListener('click', ()=>{
  // 한도 초과 시엔 버튼이 이미 disabled — 별도 안내 불필요
  if (STATE.portfolios.length >= MAX_PORTFOLIOS) return;
  openModal({
    title: t('modalNewPfTitle'),
    desc: t('modalNewPfDesc', STATE.portfolios.length+1, MAX_PORTFOLIOS),
    placeholder: t('modalNewPfPh'),
    initial: t('modalNewPfDefault', STATE.portfolios.length + 1),
    onOK: name => {
      const pf = { id:'pf_'+Date.now(), name:name||'Untitled', holdings:[], createdAt:Date.now(), updatedAt:Date.now() };
      STATE.portfolios.push(pf);
      STATE.activeId = pf.id;
      saveState();
      renderPortfolioSelect();
      rebuildAll();
    }
  });
});

document.getElementById('pfRename').addEventListener('click', ()=>{
  const pf = activePortfolio();
  openModal({
    title: t('modalRenameTitle'),
    desc: t('modalRenameDesc'),
    placeholder: t('modalRenamePh'),
    initial: pf.name,
    onOK: name => {
      if (name && name.trim()){
        pf.name = name.trim();
        pf.updatedAt = Date.now();
        saveState();
        renderPortfolioSelect();
      }
    }
  });
});

document.getElementById('pfDelete').addEventListener('click', async ()=>{
  // 마지막 1개 시엔 버튼이 이미 disabled — 별도 안내 불필요
  if (STATE.portfolios.length <= 1) return;
  const pf = activePortfolio();
  if (!await customConfirm(t('confirmDelete', pf.name))) return;
  STATE.portfolios = STATE.portfolios.filter(p=> p.id !== pf.id);
  STATE.activeId = STATE.portfolios[0].id;
  saveState();
  renderPortfolioSelect();
  rebuildAll();
});

/* =========================================================
   종목 추가/삭제/비중수정
   ========================================================= */
function addHolding(ticker){
  const pf = activePortfolio();
  if (pf.holdings.some(h => h.ticker === ticker)) return;
  const a = ASSET_BY_TICKER[ticker];
  if (!a) return;
  // 1주로 즉시 추가 — 수량은 보유 목록에서 인라인 편집 가능
  pf.holdings.push({ ticker, quantity: 1, avg_price: a.current_price });
  pf.updatedAt = Date.now();
  saveState();
  renderPortfolioSelect();
  rebuildAll();
  // 검색창 초기화
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').classList.remove('show');
  // 추가된 종목으로 살짝 스크롤 + 수량 칸 강조
  setTimeout(()=>{
    const row = document.querySelector(`.holding[data-ticker="${ticker}"]`);
    if (row){
      row.scrollIntoView({ behavior:'smooth', block:'nearest' });
      const qty = row.querySelector('.qty-edit');
      if (qty){ qty.focus(); qty.select(); }
    }
  }, 100);
}

function removeHolding(ticker){
  const pf = activePortfolio();
  pf.holdings = pf.holdings.filter(h => h.ticker !== ticker);
  pf.updatedAt = Date.now();
  saveState();
  renderPortfolioSelect();
  rebuildAll();
}

function updateHoldingQuantity(ticker, newQty){
  // 리밸런싱 모드일 땐 TARGET_HOLDINGS만 수정 (실제 상태는 보존)
  if (rebalanceMode){
    updateTargetQuantity(ticker, newQty);
    return;
  }
  const pf = activePortfolio();
  const target = pf.holdings.find(h => h.ticker === ticker);
  if (!target) return;
  newQty = Math.max(1, Math.floor(newQty));
  target.quantity = newQty;
  pf.updatedAt = Date.now();
  saveState();
  rebuildAll();
}

function updateHoldingAvgPrice(ticker, newPrice){
  const pf = activePortfolio();
  const target = pf.holdings.find(h => h.ticker === ticker);
  if (!target) return;
  if (newPrice > 0){
    target.avg_price = newPrice;
    pf.updatedAt = Date.now();
    saveState();
    rebuildAll();
  }
}

/* =========================================================
   검색 (자산 DB 자동완성)
   ========================================================= */
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

function normalize(s){ return (s||'').toLowerCase().replace(/\s+/g,''); }

// 해시태그 → 매칭 함수 (DB의 어떤 자산이 매칭되는지 결정)
const HASHTAG_MATCHERS = {
  // ─── 기본 카테고리 ───
  'etf':       a => a.is_etf,
  '주식':      a => !a.is_etf,
  // ─── 지역 ───
  '미국':      a => !a.ticker.endsWith('.KS'),
  '한국':      a => a.ticker.endsWith('.KS'),
  '코스피':    a => a.ticker.endsWith('.KS'),
  'us':        a => !a.ticker.endsWith('.KS'),
  'kr':        a => a.ticker.endsWith('.KS'),
  // ─── 섹터 ───
  'it':        a => a.sector === 'IT',
  '바이오':    a => a.sector === 'BIO',
  '제약':      a => a.sector === 'BIO',
  '헬스케어':  a => a.sector === 'BIO',
  '금융':      a => a.sector === 'FIN',
  '은행':      a => /bank|jpm|bac|105560|055550|086790|316140|138930/i.test(a.alias + a.ticker),
  '에너지':    a => a.sector === 'ENERGY',
  '소비재':    a => a.sector === 'CONSUMER',
  '자동차':    a => a.sector === 'AUTO',
  '산업':      a => a.sector === 'INDUSTRIAL',
  '제조':      a => a.sector === 'INDUSTRIAL',
  '부동산':    a => a.sector === 'REALESTATE',
  '리츠':      a => a.sector === 'REALESTATE',
  // ─── 한국 그룹 ───
  '삼성':      a => /samsung|005930|207940|028260|006400/i.test(a.alias + a.ticker),
  'lg':        a => /^lg|003550|051910|373220|032640/i.test((a.name||'') + ' ' + (a.alias||'') + ' ' + a.ticker),
  'sk':        a => /^sk|000660|034730|096770|017670/i.test((a.name||'') + ' ' + (a.alias||'') + ' ' + a.ticker),
  '현대':      a => /hyundai|005380|012330|009540/i.test(a.alias + a.ticker),
  'posco':     a => /posco|005490|003670/i.test(a.alias + a.ticker),
  '카카오':    a => /kakao|035720|377300/i.test(a.alias + a.ticker),
  '네이버':    a => /naver|035420/i.test(a.alias + a.ticker),
  // ─── 테마 ───
  '반도체':    a => /반도체|nvidia|nvda|amd|hynix|005930|000660|xlk|381180/i.test(a.alias + ' ' + a.name + ' ' + a.ticker),
  '메모리':    a => /005930|000660|samsung|hynix/i.test(a.alias + a.ticker),
  '디스플레이':a => /005930|003550/i.test(a.ticker),
  '2차전지':   a => /배터리|battery|2차전지|에코프로|ecopro|lg energy|samsung sdi/i.test(a.alias + ' ' + a.name) || ['006400.KS','051910.KS','373220.KS','086520.KS','247540.KS','305720.KS'].includes(a.ticker),
  '양극재':    a => ['003670.KS','247540.KS'].includes(a.ticker),
  '전기차':    a => /tesla|tsla|005380|hyundai|kia|0027/i.test(a.alias + a.ticker),
  '게임':      a => ['036570.KS','251270.KS','259960.KS','112040.KS'].includes(a.ticker),
  '통신':      a => ['030200.KS','017670.KS','032640.KS'].includes(a.ticker),
  '5g':        a => ['030200.KS','017670.KS','032640.KS'].includes(a.ticker),
  '인터넷':    a => /naver|kakao|alphabet|google|googl|meta|amazon|amzn|netflix/i.test(a.alias),
  'ai':        a => /nvidia|nvda|microsoft|msft|google|googl|alphabet|amazon|amzn|meta|amd/i.test(a.alias),
  '인공지능':  a => /nvidia|nvda|microsoft|msft|google|googl|alphabet|amazon|amzn|meta|amd/i.test(a.alias),
  '빅테크':    a => ['AAPL','MSFT','GOOGL','AMZN','META','NVDA','NFLX'].includes(a.ticker),
  'faang':     a => ['META','AAPL','AMZN','NFLX','GOOGL'].includes(a.ticker),
  'mag7':      a => ['AAPL','MSFT','GOOGL','AMZN','META','NVDA','TSLA'].includes(a.ticker),
  // ─── 자산 종류 ───
  '채권':      a => /bond|treasury|채권|국채|회사채|hyg|tlt|bnd|ief|lqd/i.test(a.alias + ' ' + a.name),
  '국채':      a => /treasury|국채|tlt|ief/i.test(a.alias + ' ' + a.name),
  '회사채':    a => /corporate|회사채|lqd/i.test(a.alias + ' ' + a.name),
  '하이일드':  a => /high yield|junk|hyg/i.test(a.alias + ' ' + a.name),
  '원자재':    a => /commodity|gold|silver|oil|원자재|금|은|원유|gld|slv|uso|dbc|dba/i.test(a.alias + ' ' + a.name),
  '금':        a => /^gold|gld|골드/i.test(a.name + ' ' + a.alias),
  '은':        a => /silver|slv/i.test(a.alias),
  '원유':      a => /oil|crude|uso|원유/i.test(a.alias),
  '농산물':    a => /agriculture|dba|농산물/i.test(a.alias),
  // ─── 전략 ───
  '배당':      a => ['JNJ','KO','PG','O','AMT','MCD','XOM','CVX','PFE','015760.KS','097950.KS','271560.KS'].includes(a.ticker),
  '고배당':    a => ['JNJ','KO','PG','O','AMT','MCD','XOM','CVX','PFE','015760.KS'].includes(a.ticker),
  '저변동성':  a => a.volatility_30d < 0.20,
  '고변동성':  a => a.volatility_30d > 0.40,
  '저베타':    a => a.beta < 0.7,
  '고베타':    a => a.beta > 1.4,
  '성장주':    a => ['IT','BIO','AUTO'].includes(a.sector) && !a.is_etf,
  '가치주':    a => ['FIN','ENERGY','CONSUMER','REALESTATE'].includes(a.sector),
  '대형주':    a => a.market_cap > 50e9,
  // ─── 광역 지수 ───
  's&p500':    a => /sp500|s&p|spy|voo|vti|360750|379800/i.test(a.alias + a.ticker),
  'sp500':     a => /sp500|s&p|spy|voo|vti|360750|379800/i.test(a.alias + a.ticker),
  'nasdaq':    a => /nasdaq|qqq/i.test(a.alias),
  '나스닥':    a => /nasdaq|qqq/i.test(a.alias),
  'kospi200':  a => /kospi|069500|102110/i.test(a.alias + a.ticker),
  '다우':      a => /dow|dia/i.test(a.alias),
  '러셀':      a => /russell|iwm/i.test(a.alias),
  '신흥국':    a => ['VWO'].includes(a.ticker),
  '선진국':    a => ['VEA'].includes(a.ticker),
  // ─── 산업 세부 ───
  '항공':      a => ['003490.KS'].includes(a.ticker),
  '해운':      a => ['011200.KS'].includes(a.ticker),
  '조선':      a => /shipbuilding|009540|010140/i.test(a.alias + a.ticker),
  '철강':      a => /posco|005490|003670/i.test(a.alias + a.ticker),
  '화학':      a => /chem|051910/i.test(a.alias + a.ticker),
  '카지노':    a => ['035250.KS'].includes(a.ticker),
  // ─── 방산·우주항공 ───
  '방산':      a => /방산|defense|lockheed|raytheon|northrop|lmt|rtx|noc|kai|aerospace|hanwha aero|로템|nex1|hanwha ocean/i.test(a.alias + ' ' + a.name + ' ' + a.ticker),
  '우주':      a => /aerospace|우주|항공우주|kai|aspace|lmt|noc/i.test(a.alias + ' ' + a.name),
  '우주항공':  a => /aerospace|우주|항공우주|kai|lmt|noc|rtx/i.test(a.alias + ' ' + a.name),
  'defense':   a => /defense|방산|lockheed|raytheon|northrop/i.test(a.alias + ' ' + a.name),
  // ─── 화장품·뷰티 ───
  '화장품':    a => /cosmetics|화장품|amorepacific|kolmar|pharma research|아모레|콜마/i.test(a.alias + ' ' + a.name),
  '뷰티':      a => /cosmetics|뷰티|amorepacific|kolmar|아모레/i.test(a.alias + ' ' + a.name),
  'beauty':    a => /cosmetics|amorepacific|kolmar/i.test(a.alias),
  // ─── 의료기기/줄기세포 ───
  '의료기기':  a => /medical|의료|hugel|보톡스|cha biotech|차바이오/i.test(a.alias + ' ' + a.name),
  '보톡스':    a => /hugel|보톡스/i.test(a.alias + ' ' + a.name),
  '줄기세포':  a => /cha biotech|stem|차바이오|줄기세포/i.test(a.alias + ' ' + a.name),
  // ─── 식품·소매 ───
  '식품':      a => /food|cj|orion|식품|cheiljedang|제일제당|오리온/i.test(a.alias + ' ' + a.name),
  '편의점':    a => /bgf|cu|gs25|편의점/i.test(a.alias + ' ' + a.name),
  '대형마트':  a => /emart|이마트|costco/i.test(a.alias + ' ' + a.name),
  // ─── 추가 미국 빅캡 ───
  '버크셔':    a => /berkshire|brk/i.test(a.alias + a.ticker),
  'buffett':   a => /berkshire|brk/i.test(a.alias + a.ticker),
  '코스트코':  a => /costco/i.test(a.alias),
  '나이키':    a => /nike/i.test(a.alias),
  '디즈니':    a => /disney/i.test(a.alias),
  '맥도날드':  a => /mcdonald/i.test(a.alias),
  '스타벅스':  a => /starbucks/i.test(a.alias),
  // ─── 인덱스 동의어 ───
  's&p':       a => /s&p|sp500|spy|voo|vti/i.test(a.alias + a.ticker),
  '미국주식':  a => !a.ticker.endsWith('.KS') && !a.is_etf,
  '한국주식':  a => a.ticker.endsWith('.KS') && !a.is_etf,
  '해외etf':   a => a.is_etf && !a.ticker.endsWith('.KS'),
  '국내etf':   a => a.is_etf && a.ticker.endsWith('.KS'),
  // ─── 주요 종목 단축어 ───
  '애플':      a => a.ticker === 'AAPL',
  '구글':      a => /alphabet|google/i.test(a.name),
  '테슬라':    a => a.ticker === 'TSLA',
  '엔비디아':  a => a.ticker === 'NVDA',
  'apple':     a => a.ticker === 'AAPL',
  'tesla':     a => a.ticker === 'TSLA',
  'nvidia':    a => a.ticker === 'NVDA',
  'amd':       a => a.ticker === 'AMD',
  '마소':      a => a.ticker === 'MSFT',
  '아마존':    a => a.ticker === 'AMZN',
  '메타':      a => a.ticker === 'META',
  '넷플릭스':  a => a.ticker === 'NFLX',
  // ─── 한국 대장주 ───
  '삼전':      a => a.ticker === '005930.KS',
  '하이닉스':  a => a.ticker === '000660.KS',
  '셀트리온2': a => a.ticker === '068270.KS',
  // ─── 위험 등급 ───
  'safe':      a => a.beta < 0.5 && a.volatility_30d < 0.18,
  'risky':     a => a.beta > 1.5 || a.volatility_30d > 0.40,
  // ─── 시총 ───
  '대장주':    a => a.market_cap > 100e9,
  '중소형':    a => a.market_cap < 5e9,
  // ─── 인덱스 ETF 지정 ───
  'qqq':       a => a.ticker === 'QQQ',
  'spy':       a => a.ticker === 'SPY',
  'voo':       a => a.ticker === 'VOO',
  'tlt':       a => a.ticker === 'TLT',
  'gld':       a => a.ticker === 'GLD',
  // ─── 한자 동의어 ───
  '제약':      a => a.sector === 'BIO',
  '바이오시밀러': a => /samsung biologics|celltrion/i.test(a.alias),
  '플랫폼':    a => /naver|kakao|google|alphabet|meta|amazon/i.test(a.alias),
  '클라우드':  a => /amazon|amzn|microsoft|msft|google|googl|oracle|orcl|crm/i.test(a.alias),
  // ─── 그린/친환경 ───
  '신재생':    a => /solar|wind|hydro|battery|2차전지/i.test(a.alias) || ['086520.KS','247540.KS','373220.KS'].includes(a.ticker),
  '친환경':    a => /eco|2차전지|battery/i.test(a.alias) || ['086520.KS','247540.KS'].includes(a.ticker),
  // ─── 부동산 ETF ───
  'reit':      a => a.sector === 'REALESTATE',
  // ─── 인플레이션 헷지 ───
  '인플레헷지':a => /gold|gld|tips|tlt|commodity|dbc/i.test(a.alias),
  '안전자산':  a => /bond|treasury|gold|tlt|bnd|gld|ief/i.test(a.alias)
};

function searchAssets(q){
  const nq = normalize(q);
  if (!nq) return [];
  const pf = activePortfolio();
  const owned = new Set(pf.holdings.map(h=>h.ticker));

  // 해시태그 검색 — '#'으로 시작하면 HASHTAG_MATCHERS 우선 적용
  if (nq.startsWith('#')){
    const tag = nq.slice(1);
    const matcher = HASHTAG_MATCHERS[tag];
    if (matcher){
      return ASSET_DB.filter(matcher)
        .map(a => ({ ...a, _owned: owned.has(a.ticker) }))
        .sort((a,b) => (a.is_etf === b.is_etf ? 0 : (a.is_etf ? -1 : 1)))
        .slice(0, 40);
    }
  }

  // 일반 검색 — 이름/티커/별칭 포함 매칭
  return ASSET_DB.filter(a => {
    const hay = normalize(a.name) + ' ' + normalize(a.ticker) + ' ' + normalize(a.alias);
    return hay.includes(nq);
  })
  .map(a => ({ ...a, _owned: owned.has(a.ticker) }))
  .sort((a,b) => {
    const aT = normalize(a.ticker).startsWith(nq) ? 0 : 1;
    const bT = normalize(b.ticker).startsWith(nq) ? 0 : 1;
    if (aT !== bT) return aT - bT;
    return a.name.localeCompare(b.name);
  })
  .slice(0, 30);
}

function renderSearchResults(q){
  if (!q){
    searchResults.classList.remove('show');
    return;
  }
  // 해시태그 자동완성 — '#'으로 시작하지만 완전 매칭이 없으면 관련 태그 제안
  if (q.startsWith('#')){
    const partial = q.slice(1).toLowerCase();
    const exact = HASHTAG_MATCHERS[partial];
    if (!exact && partial.length > 0){
      const suggestions = Object.keys(HASHTAG_MATCHERS)
        .filter(tag => tag.toLowerCase().includes(partial))
        .slice(0, 14);
      if (suggestions.length > 0){
        searchResults.innerHTML = `
          <div class="sr-section-header">${CURRENT_LANG==='en'?'Suggestions':'관련 태그'}</div>
          ${suggestions.map(tag => `
            <div class="sr-hashtag-suggestion" data-tag="#${tag}">#${tag}</div>
          `).join('')}
        `;
        searchResults.classList.add('show');
        searchResults.querySelectorAll('.sr-hashtag-suggestion').forEach(el => {
          el.addEventListener('click', e => {
            e.stopPropagation();
            const tag = el.dataset.tag;
            document.getElementById('searchInput').value = tag;
            renderSearchResults(tag);
          });
        });
        return;
      }
    }
  }
  const results = searchAssets(q);
  if (results.length === 0){
    searchResults.innerHTML = `<div class="sr-empty">${t('noSearchResults')}</div>`;
    searchResults.classList.add('show');
    return;
  }
  searchResults.innerHTML = results.map(a => {
    const noPrice = !a.current_price || a.current_price === 0;
    const priceLabel = noPrice
      ? (CURRENT_LANG==='en' ? 'no price' : '시세 미적용')
      : a.current_price.toLocaleString();
    return `
    <div class="search-result ${a._owned?'added':''}" data-ticker="${a.ticker}">
      <div class="sr-info">
        <div class="sr-name">${getName(a)}</div>
        <div class="sr-meta">
          <span>${a.ticker}</span>
          <span class="sr-tag sector">${sectorLabel(a.sector)}</span>
          ${a.is_etf ? `<span class="sr-tag etf">${t('etfTag')}</span>` : ''}
          ${a._owned ? `<span style="color:var(--safe)">${t('addedTag')}</span>` : ''}
        </div>
      </div>
      <div style="font-size: 12px; color:${noPrice?'var(--text-3)':'var(--text-2)'}; font-variant-numeric:tabular-nums;">
        ${priceLabel}
      </div>
    </div>`;
  }).join('');
  searchResults.classList.add('show');
  searchResults.querySelectorAll('.search-result').forEach(el=>{
    if (el.classList.contains('added')) return;
    el.addEventListener('click', ()=> addHolding(el.dataset.ticker));
  });
}

searchInput.addEventListener('input', e => renderSearchResults(e.target.value));
searchInput.addEventListener('focus', e => { if (e.target.value) renderSearchResults(e.target.value); });
document.addEventListener('click', e=>{
  if (!e.target.closest('.search-wrap')) searchResults.classList.remove('show');
});

/* =========================================================
   모달 다이얼로그
   ========================================================= */
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalInput = document.getElementById('modalInput');
let modalOnOK = null;

function openModal(opts){
  modalTitle.textContent = opts.title || '';
  modalDesc.textContent = opts.desc || '';
  modalDesc.style.whiteSpace = 'pre-line';
  modalInput.placeholder = opts.placeholder || '';
  modalInput.value = opts.initial || '';
  modalInput.type = opts.type || 'text';
  modalInput.min = opts.type === 'number' ? '1' : '';
  modalOnOK = opts.onOK;
  modal.classList.add('show');
  setTimeout(()=>{ modalInput.focus(); modalInput.select(); }, 50);
}
function closeModal(){ modal.classList.remove('show'); modalOnOK = null; }

document.getElementById('modalCancel').addEventListener('click', closeModal);
// ----- 커스텀 알림/확인 다이얼로그 (네이티브 alert·confirm 대체) -----
function customDialog({ message, title, isConfirm = false }){
  return new Promise(resolve => {
    const modalEl = document.getElementById('dialogModal');
    const titleEl = document.getElementById('dialogTitle');
    const msgEl = document.getElementById('dialogMessage');
    const okBtn = document.getElementById('dialogOK');
    const cancelBtn = document.getElementById('dialogCancel');
    titleEl.textContent = title || (isConfirm ? t('dialogConfirm') : t('dialogAlert'));
    msgEl.textContent = message;
    cancelBtn.style.display = isConfirm ? '' : 'none';

    const cleanup = () => {
      modalEl.classList.remove('show');
      okBtn.removeEventListener('click', onOK);
      cancelBtn.removeEventListener('click', onCancel);
      modalEl.removeEventListener('click', onBackdrop);
      document.removeEventListener('keydown', onKey);
    };
    const onOK = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    const onBackdrop = e => { if (e.target === modalEl) onCancel(); };
    const onKey = e => {
      if (e.key === 'Escape') onCancel();
      else if (e.key === 'Enter') onOK();
    };
    okBtn.addEventListener('click', onOK);
    cancelBtn.addEventListener('click', onCancel);
    modalEl.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);
    modalEl.classList.add('show');
    setTimeout(() => okBtn.focus(), 50);
  });
}
function customAlert(message, title){ return customDialog({ message, title, isConfirm:false }); }
function customConfirm(message, title){ return customDialog({ message, title, isConfirm:true }); }

// ----- 면책고지 모달 + 하단 배너 -----
const aboutModal = document.getElementById('aboutModal');
function openAbout(){ aboutModal.classList.add('show'); }
function closeAbout(){ aboutModal.classList.remove('show'); }
document.getElementById('aboutIcon')?.addEventListener('click', openAbout);
document.getElementById('aboutClose')?.addEventListener('click', closeAbout);
document.getElementById('aboutReplayTour')?.addEventListener('click', () => {
  closeAbout();
  setTimeout(showTour, 250);
});
aboutModal?.addEventListener('click', e => { if (e.target === aboutModal) closeAbout(); });
document.addEventListener('keydown', e => { if (e.key==='Escape' && aboutModal.classList.contains('show')) closeAbout(); });

// 하단 면책 배너 — X로 닫으면 localStorage에 저장되어 다음 방문에도 안 뜸
const legalBanner = document.getElementById('legalBanner');
if (localStorage.getItem('sphere_legal_dismissed') === '1') {
  legalBanner.classList.add('hidden');
}
document.getElementById('legalBannerClose')?.addEventListener('click', () => {
  legalBanner.classList.add('hidden');
  localStorage.setItem('sphere_legal_dismissed', '1');
});
document.getElementById('legalBannerView')?.addEventListener('click', openAbout);

document.getElementById('modalOK').addEventListener('click', ()=>{
  const v = modalInput.value.trim();
  if (modalOnOK) modalOnOK(v);
  closeModal();
});
modalInput.addEventListener('keydown', e=>{
  if (e.key === 'Enter'){ document.getElementById('modalOK').click(); }
  else if (e.key === 'Escape'){ closeModal(); }
});
modal.addEventListener('click', e=>{ if (e.target === modal) closeModal(); });

/* =========================================================
   인포 툴팁 (각 지표의 산출 공식·의미 설명)
   ========================================================= */
// 학술 출처: Markowitz(1952) MPT, Sharpe(1964) CAPM, Herfindahl(1950)/Hirschman(1945) HHI
const INFO_TXT = {
  ko: {
    balance:{ title:'밸런스 지수 산출 공식',
      desc:'포트폴리오 전체의 균형 상태를 0~100점으로 표현. <strong>100점 = 완벽한 구형(최적 분산), 0점 = 극단적 쏠림</strong>입니다.',
      formula:'밸런스 = 섹터분산 × 0.40<br>　　　　 + 리스크편차 × 0.35<br>　　　　 + 구형도 × 0.25',
      ref:'기반: Markowitz Modern Portfolio Theory (1952) — 분산투자가 위험을 줄인다는 기본 원리',
      sumLabel:'합계 (현재)' },
    diverse:{ title:'섹터 분산도',
      desc:'HHI(Herfindahl-Hirschman Index) 기반 섹터 집중도 점수. <strong>100점 = 모든 섹터 균등 분포 / 0점 = 한 섹터 100% 집중</strong>.',
      formula:'HHI = Σ(섹터 비중²)<br>분산도 = (1 − HHI) / (1 − 1/섹터수) × 100',
      ref:'기반: Herfindahl (1950) · Hirschman (1945) — 미국 법무부 반독점법(Antitrust) 시장집중도 평가 지표',
      labels:['현재 HHI','섹터 수','분산도 점수'], unit:'개' },
    deviation:{ title:'리스크 편차 점수',
      desc:'포트폴리오 내 종목들의 리스크 스코어 표준편차 기반. <strong>100점 = 모든 종목 비슷한 리스크 / 0점 = 극단적 편차</strong>. 편차가 클수록 일부 종목이 전체 리스크를 좌우합니다.',
      formula:'편차 점수 = (1 − σ/50) × 100<br>σ = 종목별 리스크 스코어의 표준편차',
      ref:'기반: 통계적 분산도(σ) — Modern Portfolio Theory의 핵심 위험 측정치',
      label:'편차 점수' },
    sphericity:{ title:'구형도 (Sphericity)',
      desc:'모든 종목의 리스크 돌출(r값) 분포의 균일성. <strong>100점 = 모든 노드가 같은 거리로 돌출 / 0점 = 특정 종목만 심하게 돌출</strong>.',
      formula:'구형도 = (1 − σ_r / 0.5) × 100<br>r = 1.0 + (risk_score / 100) × 0.5',
      ref:'SPHERE 자체 정의 지표 — 위험 분포의 시각적 균일성을 정량화',
      label:'구형도 점수' },
    hhi:{ title:'HHI 집중도',
      desc:'Herfindahl-Hirschman Index. 섹터별 비중을 제곱해서 모두 합한 값. <strong>0에 가까울수록 분산, 1에 가까울수록 집중</strong>.',
      formula:'HHI = Σ(섹터 비중²)',
      ref:'출처: U.S. DOJ Horizontal Merger Guidelines (2010) — HHI 임계값 0.15/0.25 인수합병 심사 기준',
      thresholds:[['< 0.15','분산 양호','safe'],['0.15 – 0.25','보통','moderate'],['0.25 – 0.45','집중 주의','caution'],['> 0.45','심각한 편중','high']],
      label:'현재 HHI' },
    riskScore:{ title:'평균 리스크 스코어',
      desc:'포트폴리오 내 모든 종목의 평균 리스크 점수 (0~100). 각 종목의 리스크는 5개 요소의 가중합으로 산출됩니다.',
      formula:'리스크 = 변동성 × 0.35<br>　　　　+ 베타 × 0.25<br>　　　　+ 부채비율 × 0.20<br>　　　　+ 유동성 역수 × 0.10<br>　　　　+ 섹터 기본값 × 0.10',
      ref:'기반: Sharpe (1964) CAPM — 베타로 시스템적 위험 측정 / Engle (1982) ARCH — 변동성 모형 / Altman (1968) Z-score — 부채 비율 신용 위험',
      thresholds:[['0–29','🟢 SAFE','safe'],['30–54','🔵 MODERATE','moderate'],['55–74','🟡 CAUTION','caution'],['75–89','🔴 HIGH','high'],['90–100','🟣 EXTREME','extreme']],
      label:'현재 평균' },
    assetRisk:{ title:'개별 종목 리스크 산출',
      desc:'선택한 종목의 리스크 스코어가 어떻게 계산되었는지 5개 요소별 기여도를 분해해서 보여줍니다.',
      noSelect:'먼저 보유 종목을 선택해주세요. (좌측 목록 또는 구체의 노드 클릭)',
      cols:['요소','정규화값 × 가중치 = 기여도'],
      labels:['변동성 30D','베타','부채비율','유동성 역수','섹터 기본값'],
      sumLabel:'합계 → 리스크 스코어',
      summary:(top)=>`이 종목은 <b>${top}</b> 요소가 리스크에 가장 크게 기여하고 있습니다.`,
      ref:'각 요소 정규화 방법: 변동성(0.05~0.80 범위 클리핑), 베타(0~2.5 클리핑), 부채비율(그대로), 유동성(거래량 ÷ 전체 중간값의 역수), 섹터 기본값(BIO 0.85 / IT 0.75 / FIN 0.50 등)' },
    var:{ title:'VaR 95% (1일 손실 한도)',
      desc:'<strong>Value at Risk</strong>. 95% 확률로 하루 손실이 이 금액을 넘지 않을 것으로 추정되는 한도. 정규분포 가정 패러메트릭 VaR.',
      formula:'VaR<sub>95%</sub> = z<sub>0.95</sub> × σ<sub>1일</sub> × V<br>z<sub>0.95</sub> = 1.6449<br>σ<sub>1일</sub> = σ<sub>연</sub> / √252',
      ref:'기반: J.P. Morgan RiskMetrics (1996). 정규성 가정의 한계 — 실제 꼬리는 더 두꺼움(Fat-tail), 극단 사건은 VaR 초과 가능' },
    cvar:{ title:'CVaR 95% (조건부 기대 손실)',
      desc:'<strong>Conditional VaR / Expected Shortfall</strong>. VaR를 초과하는 손실이 발생했다고 가정했을 때의 기대 손실. VaR보다 보수적·꼬리위험 반영.',
      formula:'CVaR<sub>95%</sub> = E[L | L > VaR<sub>95%</sub>]<br>≈ 2.0627 × σ<sub>1일</sub> × V',
      ref:'기반: Rockafellar & Uryasev (2000). Basel III 자본요건의 표준 위험지표로 채택' },
    sharpe:{ title:'Sharpe Ratio (위험조정 수익률)',
      desc:'위험 1단위당 초과수익. <strong>1 이상 우수, 2 이상 매우 우수, 음수면 무위험금리 미달</strong>. 변동성 전체를 위험으로 간주.',
      formula:'Sharpe = (μ<sub>p</sub> − r<sub>f</sub>) / σ<sub>p</sub><br>μ<sub>p</sub> = r<sub>f</sub> + β<sub>p</sub> × ERP (CAPM 추정)<br>r<sub>f</sub> = 3.5%, ERP = 6.0%',
      ref:'기반: Sharpe (1966). 1990년 노벨경제학상 수상자의 핵심 지표' },
    sortino:{ title:'Sortino Ratio (하방 위험 조정)',
      desc:'Sharpe와 동일하지만 분모가 <strong>하방 변동성만</strong> 사용 — 상승 변동성에 페널티를 주지 않음. 비대칭 수익 분포에 적합.',
      formula:'Sortino = (μ<sub>p</sub> − r<sub>f</sub>) / σ<sub>D</sub><br>σ<sub>D</sub> ≈ σ × 0.71 (Sortino/Sharpe 경험비)',
      ref:'기반: Sortino & Price (1994). 헤지펀드·연금펀드에서 Sharpe 대신 선호' },
    dr:{ title:'분산효과 (Diversification Ratio)',
      desc:'분산투자가 위험을 얼마나 깎았는지의 지표. <strong>DR > 1.0이면 분산효과 발생</strong>, 1.3 이상이면 우수. 옆에 표시된 % = 단순 합산 위험 대비 감소율.',
      formula:'DR = Σ(w<sub>i</sub> × σ<sub>i</sub>) / σ<sub>p</sub><br>σ<sub>p</sub> = √(ΣΣ w<sub>i</sub>w<sub>j</sub>σ<sub>i</sub>σ<sub>j</sub>ρ<sub>ij</sub>)<br>위험감소 = 1 − σ<sub>p</sub> / Σ(w<sub>i</sub>σ<sub>i</sub>)',
      ref:'기반: Choueifaty & Coignard (2008) "Most Diversified Portfolio". 상관계수 ρ는 동일섹터+동일지역 0.68, 동일섹터 0.50, 동일지역 0.32, 그 외 0.18로 휴리스틱 추정' },
    portVol:{ title:'포트폴리오 변동성 (연환산)',
      desc:'전체 포트폴리오의 1년 표준편차. <strong>15% 미만 안정, 25% 이상 공격적</strong>. 종목별 변동성을 상관계수로 가중합해 계산.',
      formula:'σ<sub>p</sub><sup>2</sup> = ΣΣ w<sub>i</sub>w<sub>j</sub>σ<sub>i</sub>σ<sub>j</sub>ρ<sub>ij</sub><br>(공분산 행렬 휴리스틱 — pairwiseCorr)',
      ref:'기반: Markowitz (1952) Modern Portfolio Theory의 핵심 — 위험은 단순 가중합이 아닌 공분산으로 결정됨' },
    dividend:{ title:'예상 연배당 수익',
      desc:'각 종목의 배당수익률(yield)에 평가금액을 곱한 합계. <strong>실제 배당 = 회사 정책에 따라 변동</strong>. 과거 배당이 미래를 보장하지 않음.',
      formula:'연배당 = Σ(평가금액<sub>i</sub> × 배당수익률<sub>i</sub>)<br>포트폴리오 yield = 연배당 / 총 평가금액',
      ref:'데이터 출처: yfinance dividendYield (TTM 기준)' }
  },
  en: {
    balance:{ title:'Balance Index Formula',
      desc:'Overall portfolio balance score (0–100). <strong>100 = perfect sphere (optimal diversification), 0 = extreme concentration</strong>.',
      formula:'Balance = SectorDiversity × 0.40<br>　　　　 + RiskDeviation × 0.35<br>　　　　 + Sphericity × 0.25',
      ref:'Based on: Markowitz Modern Portfolio Theory (1952) — diversification reduces risk',
      sumLabel:'Current total' },
    diverse:{ title:'Sector Diversity',
      desc:'Sector concentration score based on HHI (Herfindahl-Hirschman Index). <strong>100 = perfectly even sectors / 0 = single-sector concentration</strong>.',
      formula:'HHI = Σ(sector weight²)<br>Diversity = (1 − HHI) / (1 − 1/n) × 100',
      ref:'Based on: Herfindahl (1950) · Hirschman (1945) — adopted by US DOJ for antitrust market concentration analysis',
      labels:['Current HHI','Sector count','Diversity score'], unit:'sectors' },
    deviation:{ title:'Risk Deviation',
      desc:'Standard deviation of risk scores across holdings. <strong>100 = all holdings similar risk / 0 = extreme deviation</strong>. High deviation means a few holdings dominate overall risk.',
      formula:'Deviation = (1 − σ/50) × 100<br>σ = std. dev. of risk scores',
      ref:'Based on: statistical variance (σ) — core risk metric in Modern Portfolio Theory',
      label:'Deviation score' },
    sphericity:{ title:'Sphericity',
      desc:'Uniformity of risk protrusion (r-values) across all nodes. <strong>100 = all nodes equidistant / 0 = some nodes protrude severely</strong>.',
      formula:'Sphericity = (1 − σ_r / 0.5) × 100<br>r = 1.0 + (risk_score / 100) × 0.5',
      ref:'SPHERE-defined metric — quantifies visual uniformity of risk distribution',
      label:'Sphericity score' },
    hhi:{ title:'HHI Concentration',
      desc:'Herfindahl-Hirschman Index. Sum of squared sector weights. <strong>Closer to 0 = diversified, closer to 1 = concentrated</strong>.',
      formula:'HHI = Σ(sector weight²)',
      ref:'Source: U.S. DOJ Horizontal Merger Guidelines (2010) — HHI thresholds 0.15/0.25 for merger review',
      thresholds:[['< 0.15','Well diversified','safe'],['0.15 – 0.25','Moderate','moderate'],['0.25 – 0.45','Concentrated','caution'],['> 0.45','Severely concentrated','high']],
      label:'Current HHI' },
    riskScore:{ title:'Average Risk Score',
      desc:'Average risk score across all holdings (0–100). Each holding\'s risk is a weighted sum of 5 components.',
      formula:'Risk = Volatility × 0.35<br>　　　+ Beta × 0.25<br>　　　+ DebtRatio × 0.20<br>　　　+ LiquidityInverse × 0.10<br>　　　+ SectorBase × 0.10',
      ref:'Based on: Sharpe (1964) CAPM — beta for systematic risk / Engle (1982) ARCH — volatility modeling / Altman (1968) Z-score — debt ratio credit risk',
      thresholds:[['0–29','🟢 SAFE','safe'],['30–54','🔵 MODERATE','moderate'],['55–74','🟡 CAUTION','caution'],['75–89','🔴 HIGH','high'],['90–100','🟣 EXTREME','extreme']],
      label:'Current average' },
    assetRisk:{ title:'Individual Risk Breakdown',
      desc:'How the selected asset\'s risk score was calculated, broken down into 5 weighted components.',
      noSelect:'Select a holding first (click a row on the left or a node on the sphere).',
      cols:['Component','Normalized × Weight = Contribution'],
      labels:['Volatility 30D','Beta','Debt Ratio','Liquidity Inverse','Sector Base'],
      sumLabel:'Total → Risk Score',
      summary:(top)=>`<b>${top}</b> contributes the most to this asset\'s risk.`,
      ref:'Normalization: Volatility (clipped 0.05–0.80), Beta (clipped 0–2.5), Debt ratio (raw 0–1), Liquidity (inverse of volume / median), Sector base (BIO 0.85 / IT 0.75 / FIN 0.50, etc.)' },
    var:{ title:'VaR 95% (1-day loss limit)',
      desc:'<strong>Value at Risk</strong>. With 95% confidence, the daily loss should not exceed this amount. Parametric VaR assuming normal distribution.',
      formula:'VaR<sub>95%</sub> = z<sub>0.95</sub> × σ<sub>1d</sub> × V<br>z<sub>0.95</sub> = 1.6449<br>σ<sub>1d</sub> = σ<sub>annual</sub> / √252',
      ref:'Based on: J.P. Morgan RiskMetrics (1996). Caveat: normality understates fat tails — extreme events can exceed VaR' },
    cvar:{ title:'CVaR 95% (Expected Shortfall)',
      desc:'<strong>Conditional VaR / Expected Shortfall</strong>. Average loss given the loss exceeds VaR. More conservative; captures tail risk.',
      formula:'CVaR<sub>95%</sub> = E[L | L > VaR<sub>95%</sub>]<br>≈ 2.0627 × σ<sub>1d</sub> × V',
      ref:'Based on: Rockafellar & Uryasev (2000). Adopted as standard risk metric in Basel III capital requirements' },
    sharpe:{ title:'Sharpe Ratio (risk-adjusted return)',
      desc:'Excess return per unit of risk. <strong>>1 is good, >2 excellent, <0 underperforms risk-free</strong>. Treats total volatility as risk.',
      formula:'Sharpe = (μ<sub>p</sub> − r<sub>f</sub>) / σ<sub>p</sub><br>μ<sub>p</sub> = r<sub>f</sub> + β<sub>p</sub> × ERP (CAPM estimate)<br>r<sub>f</sub> = 3.5%, ERP = 6.0%',
      ref:'Based on: Sharpe (1966). Core metric of Nobel laureate W.F. Sharpe' },
    sortino:{ title:'Sortino Ratio (downside-adjusted)',
      desc:'Same as Sharpe, but uses <strong>downside volatility only</strong> — does not penalize upside swings. Better fits asymmetric returns.',
      formula:'Sortino = (μ<sub>p</sub> − r<sub>f</sub>) / σ<sub>D</sub><br>σ<sub>D</sub> ≈ σ × 0.71 (empirical ratio)',
      ref:'Based on: Sortino & Price (1994). Preferred over Sharpe in hedge funds and pension fund analysis' },
    dr:{ title:'Diversification Ratio',
      desc:'How much diversification reduced portfolio risk. <strong>DR > 1.0 means benefit, ≥1.3 is excellent</strong>. The % shown is reduction vs. simple weighted-vol sum.',
      formula:'DR = Σ(w<sub>i</sub> × σ<sub>i</sub>) / σ<sub>p</sub><br>σ<sub>p</sub> = √(ΣΣ w<sub>i</sub>w<sub>j</sub>σ<sub>i</sub>σ<sub>j</sub>ρ<sub>ij</sub>)<br>Reduction = 1 − σ<sub>p</sub> / Σ(w<sub>i</sub>σ<sub>i</sub>)',
      ref:'Based on: Choueifaty & Coignard (2008) "Toward Maximum Diversification". Correlations ρ heuristic: same sector+region 0.68, same sector 0.50, same region 0.32, otherwise 0.18' },
    portVol:{ title:'Portfolio Volatility (annualized)',
      desc:'1-year std. dev. of portfolio returns. <strong><15% conservative, >25% aggressive</strong>. Computed via covariance matrix, not simple weighted sum.',
      formula:'σ<sub>p</sub><sup>2</sup> = ΣΣ w<sub>i</sub>w<sub>j</sub>σ<sub>i</sub>σ<sub>j</sub>ρ<sub>ij</sub>',
      ref:'Based on: Markowitz (1952) Modern Portfolio Theory — portfolio risk depends on covariances, not just individual variances' },
    dividend:{ title:'Estimated Annual Dividend',
      desc:'Sum of (market value × yield) per holding. <strong>Actual dividends vary with company policy</strong>. Past does not guarantee future.',
      formula:'Annual = Σ(value<sub>i</sub> × yield<sub>i</sub>)<br>Portfolio yield = Annual / Total value',
      ref:'Source: yfinance dividendYield (TTM)' }
  }
};

function infoT(){ return INFO_TXT[CURRENT_LANG] || INFO_TXT.ko; }

const INFO = {
  balance: {
    get title(){ return infoT().balance.title; },
    bodyFn: () => {
      const T = infoT().balance;
      const B = BALANCE;
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-calc">
          <div><span>${infoT().diverse.title}</span><span>${B.diverse} × 0.40 = <b>${(B.diverse*0.40).toFixed(1)}</b></span></div>
          <div><span>${infoT().deviation.title}</span><span>${B.deviation} × 0.35 = <b>${(B.deviation*0.35).toFixed(1)}</b></span></div>
          <div><span>${infoT().sphericity.title}</span><span>${B.sphericity} × 0.25 = <b>${(B.sphericity*0.25).toFixed(1)}</b></span></div>
          <div class="info-total"><span>${T.sumLabel}</span><span><b>${B.balance}</b> / 100</span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  diverse: {
    get title(){ return infoT().diverse.title; },
    bodyFn: () => {
      const T = infoT().diverse;
      const nSec = Object.keys(BALANCE.sectorWeights || {}).length;
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-calc">
          <div><span>${T.labels[0]}</span><span><b>${BALANCE.hhi}</b></span></div>
          <div><span>${T.labels[1]}</span><span><b>${nSec} ${T.unit}</b></span></div>
          <div class="info-total"><span>${T.labels[2]}</span><span><b>${BALANCE.diverse}</b> / 100</span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  deviation: {
    get title(){ return infoT().deviation.title; },
    bodyFn: () => {
      const T = infoT().deviation;
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-calc">
          <div class="info-total"><span>${T.label}</span><span><b>${BALANCE.deviation}</b> / 100</span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  sphericity: {
    get title(){ return infoT().sphericity.title; },
    bodyFn: () => {
      const T = infoT().sphericity;
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-calc">
          <div class="info-total"><span>${T.label}</span><span><b>${BALANCE.sphericity}</b> / 100</span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  hhi: {
    get title(){ return infoT().hhi.title; },
    bodyFn: () => {
      const T = infoT().hhi;
      const thr = T.thresholds.map(r=>`<div><span style="color:var(--${r[2]});">${r[0]}</span> ${r[1]}</div>`).join('');
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-thresholds">${thr}</div>
        <div class="info-calc">
          <div class="info-total"><span>${T.label}</span><span><b>${BALANCE.hhi}</b></span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  riskScore: {
    get title(){ return infoT().riskScore.title; },
    bodyFn: () => {
      const T = infoT().riskScore;
      const thr = T.thresholds.map(r=>`<div><span style="color:var(--${r[2]});">${r[0]}</span> ${r[1]}</div>`).join('');
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-thresholds">${thr}</div>
        <div class="info-calc">
          <div class="info-total"><span>${T.label}</span><span><b>${BALANCE.avgRisk}</b> / 100</span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  assetRisk: {
    get title(){ return infoT().assetRisk.title; },
    bodyFn: () => {
      const T = infoT().assetRisk;
      // 선택된 종목 가져오기
      const it = selectedTicker ? ITEMS.find(i => i.ticker === selectedTicker) : null;
      if (!it) return `<div class="info-body" style="color:var(--text-2)">${T.noSelect}</div>`;

      // 컴포넌트 정규화 (computeRiskScores와 동일 로직)
      const vols = ITEMS.map(i=>i.liquidity_volume).filter(v=>v!=null).sort((a,b)=>a-b);
      const liqMedian = vols.length ? vols[Math.floor(vols.length/2)] : 1;

      const volN = Math.max(0, Math.min(1, (it.volatility_30d - 0.05)/(0.80 - 0.05)));
      const betaN = Math.max(0, Math.min(1, it.beta / 2.5));
      const debtN = Math.max(0, Math.min(1, it.debt_ratio));
      const liqN = (it.liquidity_volume!=null && liqMedian>0)
        ? Math.max(0, Math.min(1, 1 / (it.liquidity_volume / liqMedian)))
        : null;
      const secR = SECTOR_DEF[it.sector].base_risk;

      // 가중치
      const W = { vol:0.35, beta:0.25, debt:0.20, liq:0.10, sec:0.10 };
      const hasLiq = liqN !== null;
      const totalW = hasLiq ? 1.0 : (W.vol+W.beta+W.debt+W.sec);
      const components = [
        { lbl:T.labels[0], raw:`${(it.volatility_30d*100).toFixed(1)}%`,        n:volN,  w:W.vol  },
        { lbl:T.labels[1], raw:it.beta.toFixed(2),                              n:betaN, w:W.beta },
        { lbl:T.labels[2], raw:`${(it.debt_ratio*100).toFixed(0)}%`,            n:debtN, w:W.debt },
        { lbl:T.labels[3], raw:hasLiq ? (it.liquidity_volume.toLocaleString()) : '—', n:liqN, w:W.liq },
        { lbl:T.labels[4], raw:`${it.sector} (${(secR*100).toFixed(0)})`,       n:secR,  w:W.sec  }
      ];
      // 기여도 계산
      let totalScore = 0;
      const rows = components.map(c=>{
        if (c.n === null) return `<div style="opacity:0.4"><span>${c.lbl}</span><span>${c.raw} · —</span></div>`;
        const contrib = (c.n * c.w) / totalW * 100;
        totalScore += contrib;
        const bar = Math.round(contrib);
        return `
          <div>
            <span>${c.lbl} <span style="color:var(--text-2);font-size: 11px;">(${c.raw})</span></span>
            <span>${c.n.toFixed(2)} × ${c.w} = <b>${contrib.toFixed(1)}</b></span>
          </div>
        `;
      }).join('');

      // 가장 큰 기여 요소
      const valid = components.filter(c=>c.n!==null);
      const top = valid.reduce((a,b)=> ((b.n*b.w) > (a.n*a.w) ? b : a));

      return `
        <div class="info-body" style="margin-bottom:6px;">
          <strong style="color:${riskColor(it.risk_score)}">${getName(it)}</strong> · ${it.ticker}
        </div>
        <div class="info-body">${T.desc}</div>
        <div class="info-calc">
          ${rows}
          <div class="info-total"><span>${T.sumLabel}</span><span><b style="color:${riskColor(it.risk_score)};font-size:14px;">${it.risk_score}</b> / 100</span></div>
        </div>
        <div class="info-body" style="margin-top:8px;">${T.summary(top.lbl)}</div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  // ── Phase 1·2·3·4 metric tooltips ──
  var: {
    get title(){ return infoT().var.title; },
    bodyFn: () => {
      const T = infoT().var;
      const A = ADVANCED || {};
      const tv = A.totalValue || 0;
      const sd = A.portVolDaily || 0;
      const var95 = A.var95 || 0;
      const fmt = v => Math.round(v).toLocaleString();
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-calc">
          <div><span>총 평가금액 V</span><span><b>${fmt(tv)}</b></span></div>
          <div><span>일변동성 σ<sub>1d</sub></span><span><b>${(sd*100).toFixed(2)}%</b></span></div>
          <div class="info-total"><span>VaR 95% (1일)</span><span><b style="color:var(--high)">−${fmt(var95)}</b></span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  cvar: {
    get title(){ return infoT().cvar.title; },
    bodyFn: () => {
      const T = infoT().cvar;
      const A = ADVANCED || {};
      const fmt = v => Math.round(v).toLocaleString();
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-calc">
          <div><span>VaR 95%</span><span><b>−${fmt(A.var95||0)}</b></span></div>
          <div class="info-total"><span>CVaR 95%</span><span><b style="color:var(--high)">−${fmt(A.cvar95||0)}</b></span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  sharpe: {
    get title(){ return infoT().sharpe.title; },
    bodyFn: () => {
      const T = infoT().sharpe;
      const A = ADVANCED || {};
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-calc">
          <div><span>포트폴리오 β</span><span><b>${(A.portBeta||0).toFixed(2)}</b></span></div>
          <div><span>기대수익률 μ<sub>p</sub></span><span><b>${((A.portReturn||0)*100).toFixed(2)}%</b></span></div>
          <div><span>변동성 σ<sub>p</sub></span><span><b>${((A.portVol||0)*100).toFixed(2)}%</b></span></div>
          <div class="info-total"><span>Sharpe</span><span><b>${(A.sharpe||0).toFixed(3)}</b></span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  sortino: {
    get title(){ return infoT().sortino.title; },
    bodyFn: () => {
      const T = infoT().sortino;
      const A = ADVANCED || {};
      const downside = (A.portVol||0) * 0.71;
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-calc">
          <div><span>기대수익률 μ<sub>p</sub></span><span><b>${((A.portReturn||0)*100).toFixed(2)}%</b></span></div>
          <div><span>하방변동성 σ<sub>D</sub></span><span><b>${(downside*100).toFixed(2)}%</b></span></div>
          <div class="info-total"><span>Sortino</span><span><b>${(A.sortino||0).toFixed(3)}</b></span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  dr: {
    get title(){ return infoT().dr.title; },
    bodyFn: () => {
      const T = infoT().dr;
      const A = ADVANCED || {};
      const wsum = ITEMS.reduce((s,i)=> s + i.weight * i.volatility_30d, 0);
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-calc">
          <div><span>Σ(w<sub>i</sub>σ<sub>i</sub>) — 단순합</span><span><b>${(wsum*100).toFixed(2)}%</b></span></div>
          <div><span>σ<sub>p</sub> — 공분산</span><span><b>${((A.portVol||0)*100).toFixed(2)}%</b></span></div>
          <div><span>DR</span><span><b>${(A.dr||1).toFixed(3)}</b></span></div>
          <div class="info-total"><span>위험 감소</span><span><b style="color:var(--safe)">${((A.riskReduction||0)*100).toFixed(1)}%</b></span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  portVol: {
    get title(){ return infoT().portVol.title; },
    bodyFn: () => {
      const T = infoT().portVol;
      const A = ADVANCED || {};
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-calc">
          <div><span>연환산 σ<sub>p</sub></span><span><b>${((A.portVol||0)*100).toFixed(2)}%</b></span></div>
          <div><span>일환산 σ<sub>1d</sub></span><span><b>${((A.portVolDaily||0)*100).toFixed(2)}%</b></span></div>
          <div class="info-total"><span>포트폴리오 β</span><span><b>${(A.portBeta||0).toFixed(2)}</b></span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  },
  dividend: {
    get title(){ return infoT().dividend.title; },
    bodyFn: () => {
      const T = infoT().dividend;
      const A = ADVANCED || {};
      const fmt = v => Math.round(v).toLocaleString();
      return `
        <div class="info-body">${T.desc}</div>
        <div class="info-formula">${T.formula}</div>
        <div class="info-calc">
          <div><span>총 평가금액</span><span><b>${fmt(A.totalValue||0)}</b></span></div>
          <div><span>포트폴리오 yield</span><span><b>${((A.dividendYieldPort||0)*100).toFixed(2)}%</b></span></div>
          <div class="info-total"><span>예상 연배당</span><span><b style="color:var(--safe)">+${fmt(A.annualDividend||0)}</b></span></div>
        </div>
        <div class="info-meta">${T.ref}</div>
      `;
    }
  }
};

const infoTooltipEl = document.createElement('div');
infoTooltipEl.className = 'info-tooltip';
document.body.appendChild(infoTooltipEl);

function showInfo(targetEl, key){
  const cfg = INFO[key];
  if (!cfg) return;
  infoTooltipEl.innerHTML = `<div class="info-title">${cfg.title}</div>${cfg.bodyFn()}`;
  infoTooltipEl.classList.add('show');
  // 위치 측정 후 화면 밖이면 보정
  const rect = targetEl.getBoundingClientRect();
  infoTooltipEl.style.left = '0px';
  infoTooltipEl.style.top = '0px';
  const tipRect = infoTooltipEl.getBoundingClientRect();
  let left = rect.left;
  let top = rect.bottom + 8;
  if (left + tipRect.width > window.innerWidth - 12){
    left = window.innerWidth - tipRect.width - 12;
  }
  if (left < 12) left = 12;
  if (top + tipRect.height > window.innerHeight - 12){
    top = rect.top - tipRect.height - 8;
  }
  infoTooltipEl.style.left = left + 'px';
  infoTooltipEl.style.top = top + 'px';
}
function hideInfo(){ infoTooltipEl.classList.remove('show'); }

// 툴팁 본문에 호버 가능 — 텍스트 선택/복사를 위해 잠깐 머물러도 안 사라지게
let _infoHideTimer = null;
function scheduleHideInfo(delay){
  clearTimeout(_infoHideTimer);
  _infoHideTimer = setTimeout(hideInfo, delay);
}
function cancelHideInfo(){
  clearTimeout(_infoHideTimer);
  _infoHideTimer = null;
}

// 이벤트 위임 — 동적으로 추가되는 info-icon 모두 자동 처리
document.body.addEventListener('mouseover', e=>{
  const t = e.target.closest && e.target.closest('.info-icon');
  if (t){
    cancelHideInfo();
    showInfo(t, t.dataset.info);
    return;
  }
  // 툴팁 본문 위로 들어오면 hide 예약 취소
  if (e.target.closest && e.target.closest('.info-tooltip')){
    cancelHideInfo();
  }
});
document.body.addEventListener('mouseout', e=>{
  const fromIcon = e.target.closest && e.target.closest('.info-icon');
  const fromTip  = e.target.closest && e.target.closest('.info-tooltip');
  if (!fromIcon && !fromTip) return;

  const intoIcon = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.info-icon');
  const intoTip  = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.info-tooltip');

  // 아이콘 → 툴팁 또는 다른 아이콘 → 유지
  if (intoIcon || intoTip){
    cancelHideInfo();
    return;
  }
  // 그 외에는 짧은 딜레이 후 닫기 (커서가 갭을 건널 시간)
  scheduleHideInfo(180);
});

// 모바일/터치 — info-icon 탭으로 툴팁 토글
let _tipPinned = null;
document.body.addEventListener('click', e => {
  const ic = e.target.closest && e.target.closest('.info-icon');
  if (ic){
    e.preventDefault();
    e.stopPropagation();
    cancelHideInfo();
    if (_tipPinned === ic){
      hideInfo();
      _tipPinned = null;
    } else {
      showInfo(ic, ic.dataset.info);
      _tipPinned = ic;
    }
    return;
  }
  // 툴팁 외부 탭 → 닫기
  if (_tipPinned && !(e.target.closest && e.target.closest('.info-tooltip'))){
    hideInfo();
    _tipPinned = null;
  }
});

// =========================================================
// 모바일 바텀 네비 — Smooth scroll quick-jump
// =========================================================
(function setupBottomNav(){
  const nav = document.getElementById('bottomNav');
  if (!nav) return;
  // 데스크탑이면 비활성 (CSS에서 display:none 처리됨)
  const items = nav.querySelectorAll('.bottom-nav-item');

  function targetEl(key){
    if (key === 'top') return document.querySelector('header');
    if (key === 'rightTop'){
      // 우측 사이드의 첫 패널(밸런스/메트릭)
      const right = document.querySelector('aside.right .panel');
      return right;
    }
    return document.getElementById(key);
  }

  items.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.target;
      const el = targetEl(key);
      if (!el) return;
      // 헤더 sticky 높이 보정
      const headerH = (document.querySelector('header')?.offsetHeight || 56);
      const top = el.getBoundingClientRect().top + window.scrollY - headerH - 6;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      items.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 스크롤에 따라 active 갱신 — IntersectionObserver
  const obsMap = new Map();
  items.forEach(btn => obsMap.set(btn.dataset.target, btn));
  const allTargets = ['searchPanel', 'holdingsList', 'insights'];
  allTargets.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting && en.intersectionRatio > 0.3){
          items.forEach(b => b.classList.remove('active'));
          obsMap.get(id)?.classList.add('active');
        }
      });
    }, { threshold: [0.3] });
    io.observe(el);
  });
})();

/* =========================================================
   초기 렌더
   ========================================================= */
// 언어 토글 이벤트 바인딩 + 초기 적용
document.querySelectorAll('#langSwitch button').forEach(b => {
  b.addEventListener('click', () => setLang(b.dataset.lang));
});
applyI18n();

// 1) 티커 카탈로그 로드 → 2) 일별 시세 적용 (양쪽 모두 비동기, 실패 시 폴백)
applyTickerCatalog().then(catMeta => {
  if (catMeta && catMeta.added > 0){
    console.log(`[SPHERE] Loaded ${catMeta.added} catalog tickers · total ${catMeta.total}`);
  }
  return applyDailyPrices();
}).then(meta => {
  if (!meta || meta.updated === 0) return;
  console.log(`[SPHERE] Loaded ${meta.updated} daily prices · ${meta.updatedAt}`);
  // 헤더 STATUS — "● UPDATED YYYY-MM-DD" 로 갱신
  const statusEls = document.querySelectorAll('.header-meta div');
  statusEls.forEach(el => {
    if (el.querySelector('[data-i18n="status"]')) {
      const d = new Date(meta.updatedAt);
      const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const b = el.querySelector('b');
      if (b) b.textContent = `● ${str}`;
    }
  });
  // 면책 배너 텍스트도 "전일 종가 기준" 으로 변경
  const dcText = document.getElementById('legalBanner')?.querySelector('.legal-banner-text');
  if (dcText){
    const dailyMsg = CURRENT_LANG === 'en'
      ? 'This is an educational visualization tool, not investment advice. Asset prices are auto-updated daily (previous-day close).'
      : '본 서비스는 교육·시연 목적의 시각화 도구이며, 투자 자문이 아닙니다. 종목 시세는 매일 전일 종가 기준으로 자동 갱신됩니다.';
    dcText.textContent = dailyMsg;
  }
  // 전체 파이프라인 재계산
  rebuildAll();
});

// =========================================================
// 온보딩 투어 — 첫 방문 자동 실행 + ⓘ 메뉴에서 다시 보기
// =========================================================
const TOUR_STEPS = [
  {
    selector: '.logo',
    title: { ko:'👋 포트폴리오를 한눈에', en:'👋 See your portfolio at a glance' },
    body: {
      ko:'여러 종목에 나눠서 투자한 묶음을 <strong>포트폴리오</strong>라고 해요. SPHERE는 그 묶음이 얼마나 균형 잡혔는지, 어디에 위험이 쏠려있는지를 <strong>3D 구</strong> 하나로 한눈에 보여줍니다.<br><br>3분만 둘러보면 사용법을 익히실 수 있어요.',
      en:'A <strong>portfolio</strong> is a basket of multiple investments. SPHERE shows you, in a single <strong>3D sphere</strong>, how balanced your basket is and where the risks are concentrated.<br><br>This 3-minute tour will get you started.'
    }
  },
  {
    selector: '#canvas',
    title: { ko:'🌐 이 동그란 게 뭐예요?', en:'🌐 What is this sphere?' },
    body: {
      ko:'<strong>점 하나하나가 당신이 보유한 종목</strong>입니다. 이상적인 모양은 완벽한 구체에 가까워야 해요.<br><br>점이 클수록 그 종목에 많이 투자했다는 뜻이고(비중), 한쪽이 일그러져 있다 = 위험이 거기 몰려있다는 신호예요.',
      en:'<strong>Each dot is a stock you hold</strong>. The ideal shape is close to a perfect sphere.<br><br>Bigger dot = more weight in that stock. A lopsided sphere means risk is concentrated on one side.'
    }
  },
  {
    selector: '.hemisphere-label.hemi-north',
    title: { ko:'📊 위 vs 아래 — 성장주 vs 가치주', en:'📊 North vs South — Growth vs Value' },
    body: {
      ko:'위쪽 반구(<span style="color:var(--accent)">파란빛</span>)는 IT·바이오 같은 <strong>성장주</strong> — 큰 수익을 노릴 수 있지만 등락이 큰 회사들.<br><br>아래쪽(<span style="color:#FFB088">주황빛</span>)은 금융·소비재 같은 <strong>가치주</strong> — 안정적으로 움직이는 회사들.<br><br>한쪽 반구에만 점들이 몰려있다 = 한쪽 성격으로만 치우친 상태입니다.',
      en:'Upper hemisphere (<span style="color:var(--accent)">cool tone</span>) = <strong>growth stocks</strong> like tech/biotech — high upside but volatile.<br><br>Lower (<span style="color:#FFB088">warm tone</span>) = <strong>value stocks</strong> like financials/consumer — slower but stable.<br><br>If all dots cluster in one hemisphere, your portfolio leans heavily one way.'
    }
  },
  {
    selector: '.stage-corner.corner-br',
    title: { ko:'📐 왜 어떤 점은 튀어나와 있나요?', en:'📐 Why are some dots protruding?' },
    body: {
      ko:'점이 표면에서 <strong>멀리 튀어나올수록 위험한 종목</strong>이라는 뜻이에요. 가격 변동이 크거나, 빚이 많거나, 작은 시장의 회사일 때 더 튀어나옵니다.<br><br><strong>구형도(SPHERICITY)</strong>는 모든 점이 얼마나 표면에 가깝게 붙어있는지 점수예요. 100점 = 완벽한 구.',
      en:'The further a dot protrudes, the <strong>riskier that stock</strong>. High price swings, heavy debt, or small market cap → more protrusion.<br><br><strong>SPHERICITY</strong> measures how close all dots stay to the surface. 100 = perfect sphere.'
    }
  },
  {
    selector: '.balance-card',
    title: { ko:'⚖️ 내 포트폴리오는 몇 점?', en:'⚖️ Your portfolio score' },
    body: {
      ko:'쏠림·튀어나옴·분산 정도를 종합해 <strong>0~100점</strong>으로 표시한 게 밸런스 지수예요.<br><br>• <span style="color:var(--safe)">90+</span> 거의 완벽 / <span style="color:var(--moderate)">70~89</span> 양호<br>• <span style="color:var(--caution)">50~69</span> 살짝 쏠림 / <span style="color:var(--high)">30~49</span> 조정 필요<br>• <span style="color:var(--extreme)">~29</span> 심각한 쏠림<br><br>옆의 ⓘ를 호버하면 어떻게 계산했는지 볼 수 있어요.',
      en:'A <strong>0–100 score</strong> combining concentration, protrusion, and diversity.<br><br>• <span style="color:var(--safe)">90+</span> nearly perfect / <span style="color:var(--moderate)">70~89</span> good<br>• <span style="color:var(--caution)">50~69</span> some skew / <span style="color:var(--high)">30~49</span> rebalance needed<br>• <span style="color:var(--extreme)">~29</span> severely skewed<br><br>Hover the ⓘ to see how it\'s calculated.'
    }
  },
  {
    selector: '.stage-corner.corner-bl',
    title: { ko:'🎨 점 색깔이 의미하는 것', en:'🎨 What the colors mean' },
    body: {
      ko:'종목마다 위험도에 따라 색이 달라요.<br><br>🟢 <strong>SAFE</strong> 안전 (큰 변동 거의 없음)<br>🔵 <strong>MODERATE</strong> 보통<br>🟡 <strong>CAUTION</strong> 주의 (변동성 있음)<br>🔴 <strong>HIGH</strong> 위험 (가격 변동 큼)<br>🟣 <strong>EXTREME</strong> 매우 위험<br><br>초록·파랑이 많은 포트폴리오일수록 안정적입니다.',
      en:'Each stock is colored by its risk level.<br><br>🟢 <strong>SAFE</strong> stable (low swings)<br>🔵 <strong>MODERATE</strong> normal<br>🟡 <strong>CAUTION</strong> moderate volatility<br>🔴 <strong>HIGH</strong> high volatility<br>🟣 <strong>EXTREME</strong> very risky<br><br>More green/blue = more stable portfolio.'
    }
  },
  {
    selector: '#btnNetwork',
    title: { ko:'🔗 종목들끼리 같이 움직여요?', en:'🔗 Do your stocks move together?' },
    body: {
      ko:'NETWORK 버튼을 누르면 점들 사이에 선이 그려져요.<br><br>선이 <strong style="color:var(--high)">굵고 빨갛다</strong> = 두 종목이 함께 오르내림 → <strong>분산 효과 없음</strong>.<br>예: 삼성전자와 SK하이닉스는 둘 다 반도체라 같이 움직여요.<br><br>선이 적거나 얇다 = 진짜로 다른 흐름 → <strong>좋은 분산</strong>.<br>"종목 수가 많아도 같이 움직이면 사실상 한 종목 산 것"이라는 통찰을 보여줍니다.',
      en:'Press NETWORK to see lines between stocks.<br><br><strong style="color:var(--high)">Thick red lines</strong> = the two move together → <strong>no diversification</strong>.<br>Example: Samsung Electronics and SK Hynix are both semis — they rise/fall together.<br><br>Few or thin lines = truly different patterns → <strong>real diversification</strong>.<br>This reveals when "many stocks" actually act like one.'
    }
  },
  {
    selector: '#btnRebalance',
    title: { ko:'🤖 AI가 추천해줘요', en:'🤖 AI recommendations' },
    body: {
      ko:'REBALANCE를 누르면 AI가 당신 포트폴리오의 약점을 진단합니다.<br><br>"한 섹터에 너무 몰림", "한 종목 비중이 너무 큼" 같은 약점을 자동으로 찾아서, <strong>"이 종목을 N주 사면 균형이 좋아져요"</strong>를 구체적으로 알려줘요.<br><br>실제 매매는 안 일어나고, 시뮬레이션으로만 미리 결과를 볼 수 있습니다.',
      en:'REBALANCE auto-diagnoses your portfolio\'s weaknesses.<br><br>It detects "sector concentration", "single-stock dominance" etc., then suggests <strong>"buy N shares of X to improve balance"</strong> with specific projected impact.<br><br>No real trades happen — pure simulation.'
    }
  },
  {
    selector: '#searchPanel',
    title: { ko:'➕ 내 포트폴리오 입력하기', en:'➕ Build your portfolio' },
    body: {
      ko:'좌측 검색창에서 종목명이나 티커를 입력 → 결과 클릭으로 추가됩니다.<br><br>"<strong>삼성전자</strong>", "<strong>AAPL</strong>", "<strong>QQQ</strong>", "<strong>채권</strong>", "<strong>원자재</strong>" 등 다양한 키워드 가능. 한국·미국 주식 + ETF 100여 종.<br><br>추가된 종목의 보유 수량은 우측에서 직접 편집할 수 있어요.',
      en:'Search by name or ticker in the left panel → click a result to add.<br><br>Try "<strong>samsung</strong>", "<strong>AAPL</strong>", "<strong>QQQ</strong>", "<strong>bond</strong>", "<strong>commodity</strong>" — over 100 KR/US stocks and ETFs.<br><br>Edit quantities on the right of each row.'
    }
  },
  {
    selector: '.header-meta',
    title: { ko:'🔒 안전하고 사적입니다', en:'🔒 Safe & private' },
    body: {
      ko:'당신의 포트폴리오 데이터는 <strong>브라우저에만 저장</strong>됩니다 — 외부 서버로 전송되지 않아요. 다른 사람이 볼 수 없고, 회원가입도 필요 없습니다.<br><br>최대 20개 포트폴리오를 만들 수 있고, ⓘ 아이콘에서 면책 고지·사용법을 언제든 다시 볼 수 있어요.<br><br>이제 시작해볼까요?',
      en:'Your portfolio data is <strong>stored only in your browser</strong> — never sent anywhere. No login, no tracking.<br><br>Up to 20 portfolios. Click ⓘ anytime to see terms or replay this tour.<br><br>Ready to start?'
    }
  }
];

let _tourIdx = 0;
function showTour(){
  _tourIdx = 0;
  document.getElementById('tourOverlay').classList.add('show');
  // 투어 진행률 점들
  const prog = document.getElementById('tourProgress');
  prog.innerHTML = TOUR_STEPS.map(()=>'<span></span>').join('');
  renderTourStep();
}
function endTour(){
  document.getElementById('tourOverlay').classList.remove('show');
  localStorage.setItem('sphere_tour_done', '1');
}
function renderTourStep(){
  const step = TOUR_STEPS[_tourIdx];
  if (!step){ endTour(); return; }
  const target = document.querySelector(step.selector);
  if (!target){ _tourIdx++; renderTourStep(); return; }

  const rect = target.getBoundingClientRect();
  const spot = document.getElementById('tourSpotlight');
  spot.style.left = Math.max(8, rect.left - 8) + 'px';
  spot.style.top = Math.max(8, rect.top - 8) + 'px';
  spot.style.width = Math.min(window.innerWidth - 16, rect.width + 16) + 'px';
  spot.style.height = Math.min(window.innerHeight - 16, rect.height + 16) + 'px';

  // bubble 콘텐츠
  const lang = CURRENT_LANG === 'en' ? 'en' : 'ko';
  document.getElementById('tourStepLabel').textContent = `STEP ${_tourIdx + 1}`;
  document.getElementById('tourTitle').textContent = step.title[lang] || step.title.ko;
  document.getElementById('tourBody').innerHTML = step.body[lang] || step.body.ko;

  // 진행 점 갱신
  const dots = document.querySelectorAll('#tourProgress span');
  dots.forEach((d, i) => {
    d.classList.toggle('done', i < _tourIdx);
    d.classList.toggle('current', i === _tourIdx);
  });

  // bubble 위치 (target 아래/위 자동 선택)
  const bubble = document.getElementById('tourBubble');
  bubble.style.visibility = 'hidden';
  setTimeout(()=>{
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    let left = rect.left + rect.width/2 - bw/2;
    let top = rect.bottom + 14;
    if (top + bh > window.innerHeight - 16){
      top = rect.top - bh - 14;
      if (top < 16) top = (window.innerHeight - bh)/2;
    }
    if (left + bw > window.innerWidth - 16) left = window.innerWidth - bw - 16;
    if (left < 16) left = 16;
    bubble.style.left = left + 'px';
    bubble.style.top = top + 'px';
    bubble.style.visibility = '';
  }, 30);

  // 버튼 상태
  document.getElementById('tourPrev').disabled = _tourIdx === 0;
  const nextBtn = document.getElementById('tourNext');
  nextBtn.textContent = _tourIdx === TOUR_STEPS.length - 1 ? t('tourFinish') : t('tourNext');
  document.getElementById('tourSkip').textContent = t('tourSkip');
  document.getElementById('tourPrev').textContent = t('tourPrev');
}
function tourNext(){ _tourIdx++; if (_tourIdx >= TOUR_STEPS.length) endTour(); else renderTourStep(); }
function tourPrev(){ if (_tourIdx > 0){ _tourIdx--; renderTourStep(); } }

document.getElementById('tourNext')?.addEventListener('click', tourNext);
document.getElementById('tourPrev')?.addEventListener('click', tourPrev);
document.getElementById('tourSkip')?.addEventListener('click', endTour);
window.addEventListener('keydown', e => {
  if (!document.getElementById('tourOverlay').classList.contains('show')) return;
  if (e.key === 'Escape') endTour();
  else if (e.key === 'ArrowRight' || e.key === 'Enter') tourNext();
  else if (e.key === 'ArrowLeft') tourPrev();
});
window.addEventListener('resize', () => {
  if (document.getElementById('tourOverlay').classList.contains('show')) renderTourStep();
});

// 첫 방문 시 자동 실행 (1초 지연 — 페이지 로드 안정 후)
if (!localStorage.getItem('sphere_tour_done')){
  setTimeout(showTour, 900);
}

// 좌·우 사이드바 토글 — body 클래스 기반, 캔버스 자동 리사이즈
function togglePanel(side){
  const cls = side === 'left' ? 'left-collapsed' : 'right-collapsed';
  document.body.classList.toggle(cls);
  localStorage.setItem('sphere_' + cls, document.body.classList.contains(cls) ? '1' : '0');
  // 트랜지션 끝난 뒤 3D 캔버스 리사이즈
  setTimeout(onResize, 360);
}
if (localStorage.getItem('sphere_left-collapsed') === '1') document.body.classList.add('left-collapsed');
if (localStorage.getItem('sphere_right-collapsed') === '1') document.body.classList.add('right-collapsed');
document.getElementById('leftPanelToggle')?.addEventListener('click', () => togglePanel('left'));
document.getElementById('rightPanelToggle')?.addEventListener('click', () => togglePanel('right'));

// 해시태그 칩 — 인기 + 랜덤 셔플 (더보기 버튼)
const POPULAR_HASHTAGS = ['#ETF','#반도체','#2차전지','#방산','#채권','#원자재','#배당','#금융'];
function getAllHashtags(){ return Object.keys(HASHTAG_MATCHERS).map(k => '#' + k); }
function shuffleHashtags(){
  const all = getAllHashtags().filter(t => !POPULAR_HASHTAGS.includes(t));
  return all.sort(() => Math.random() - 0.5).slice(0, 8);
}
function renderTagChips(tags){
  const container = document.getElementById('searchTags');
  const moreLabel = CURRENT_LANG === 'en' ? '+ More' : '+ 더보기';
  container.innerHTML = tags.map(tag =>
    `<button class="search-tag" data-q="${tag}">${tag}</button>`
  ).join('') + `<button class="search-tag more-tag" id="moreTagBtn">${moreLabel}</button>`;
  // 일반 칩 클릭
  container.querySelectorAll('.search-tag:not(.more-tag)').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const q = btn.dataset.q;
      const input = document.getElementById('searchInput');
      const results = document.getElementById('searchResults');
      input.value = q;
      input.focus();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      results.classList.add('show');
    });
  });
  // 더보기 → 랜덤 셔플
  const moreBtn = document.getElementById('moreTagBtn');
  moreBtn.addEventListener('click', e => {
    e.stopPropagation();
    renderTagChips(shuffleHashtags());
  });
}
// 초기는 인기 태그
renderTagChips(POPULAR_HASHTAGS);

// 리밸런싱 패널 버튼 핸들러
document.getElementById('rbApply')?.addEventListener('click', applyTargetToActive);
document.getElementById('rbReset')?.addEventListener('click', resetTarget);
document.getElementById('rbCancel')?.addEventListener('click', () => exitRebalance(false));
document.getElementById('rbClose')?.addEventListener('click', () => exitRebalance(false));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && rebalanceMode) exitRebalance(false);
});

renderPortfolioSelect();
renderAllUI();
updateClock();
setInterval(updateClock, 30000);

// 레이아웃 변화 감지하여 캔버스 크기 갱신
if (window.ResizeObserver){
  new ResizeObserver(onResize).observe(main);
}
// 첫 렌더 직후 한 번 더 사이즈 보정
setTimeout(onResize, 50);
setTimeout(onResize, 300);

} // end initSphere
