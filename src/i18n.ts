/* =========================================================
   SPHERE — i18n (KO/EN) + 통화/섹터 라벨
   ========================================================= */

import type { Asset, Sector } from './types.js';

export type Lang = 'ko' | 'en';

/** I18N 사전 — 키별로 string 또는 (...args) => string */
type DictEntry = string | ((...args: any[]) => string);
type Dict = Record<string, DictEntry>;

export const I18N: Record<Lang, Dict> = {
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
    riskMetrics:'위험 분석', riskMetricsBadge:'리스크',
    metricVaR:'내일 최대 손실', metricCVaR:'최악의 날 평균 손실', metricSharpe:'위험 대비 수익 효율', metricSortino:'하락 위험 대비 효율',
    metricDR:'분산투자 효과', metricPortVol:'주가 흔들림 (연)', metricDividend:'예상 연배당',
    riskAdvancedToggle:'고급 지표 (Sortino · 분산효과 · 변동성 · 배당)',
    stressTest:'스트레스 테스트', stressTestBadge:'시나리오', stressTestEmpty:'좌측에서 시나리오를 선택하세요',
    stressTestExpected:'예상 손익', stressTestSummary:(p,v)=>`${(p*100).toFixed(1)}% (${v})`,
    navSphere:'구체', navSearch:'검색', navHoldings:'보유', navMetrics:'지표', navInsights:'인사이트',
    tabInsights:'인사이트', tabRisk:'위험분석', tabStress:'스트레스', tabDetail:'종목상세',
    restartTour:'투어 다시 보기',
    csvImportShort:'불러오기', csvExportShort:'내보내기',
    csvExportTitle:'CSV로 내보내기', csvImportTitle:'CSV에서 불러오기',
    csvExportEmpty:'내보낼 종목이 없습니다',
    csvExportOk:(n)=>`✓ ${n}개 종목을 CSV로 저장했습니다`,
    csvImportFailRead:'파일 읽기 실패',
    csvImportFailFormat:'CSV 형식 오류 — ticker / quantity 컬럼이 필요합니다',
    csvImportEmpty:'빈 CSV 파일입니다',
    csvImportNoneValid:(t)=>`인식된 종목이 없습니다 (예: ${t})`,
    csvImportNoRows:'유효한 데이터 행이 없습니다',
    csvImportPromptDesc:(n,sk)=>sk>0
      ? `${n}개 종목이 발견되었습니다 (${sk}개 미인식 스킵).\n새 포트폴리오 이름을 입력하세요.`
      : `${n}개 종목이 발견되었습니다.\n새 포트폴리오 이름을 입력하세요.`,
    csvImportOk:(n,sk)=>sk>0
      ? `✓ ${n}개 종목 추가됨 (${sk}개 미인식 스킵)`
      : `✓ ${n}개 종목으로 새 포트폴리오 생성됨`,
    pfMaxReached:'포트폴리오 한도(20개) 초과',
    insights:'Insights', auto:'AUTO',
    selectedAsset:'Selected Asset',
    sdQty:'보유 수량', sdValue:'평가금액', sdWeight:'비중', sdSector:'섹터',
    sdPrice:'현재가', sdAvg:'평균 매수가', sdReturn:'수익률', sdVol:'변동성 30D',
    sdBeta:'베타', sdDebt:'부채비율', sdRisk:'리스크 스코어',
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
    rbRecsDisclaimer:'시뮬레이션용 — 실제 매매 아님',
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
    rbApplyConfirm:(b1,b2)=>`현재 포트폴리오를 시뮬레이션 결과로 변경하시겠어요?\n\n밸런스 지수: ${b1} → ${b2}\n좌측 보유 종목의 수량이 시뮬레이션한 값으로 갱신됩니다.\n\n⚠ 실제 증권 계좌에서 매수/매도는 일어나지 않습니다. 실제 거래는 본인의 증권사 앱·홈트레이딩에서 직접 진행하세요.`,
    rbResetConfirm:'타겟을 현재 포트폴리오로 되돌립니다. 시뮬레이션 변경사항이 모두 사라져요. 계속할까요?',
    rbInsightUnchanged:'변경사항이 없습니다.',
    rbDeltaImproved:(d)=>`개선 ${d}점`, rbDeltaWorsened:(d)=>`악화 ${d}점`, rbDeltaSame:'변화 없음',
    btnNetwork:'NETWORK',
    netLegendTitle:'CORRELATION',
    netStrong:'강 ≥ 0.85', netMed:'중 0.70–0.85', netWeak:'약 0.50–0.70',
    netMeta:'섹터 + 베타 + 변동성 기반 추정',
    collapseTitle:'검색창 접기', searchExpand:'종목 검색 열기',
    leftToggleTitle:'좌측 패널 접기/펼치기', rightToggleTitle:'우측 패널 접기/펼치기',
    appTitle:'SPHERE — 포트폴리오 리스크 구체 분석기',
    resizeLeftAria:'좌측 패널 너비 조절', resizeLeftTitle:'드래그해서 너비 조절',
    resizeRightAria:'우측 패널 너비 조절', resizeRightTitle:'드래그해서 너비 조절',
    themeToggleAria:'테마 전환', themeToggleTitle:'라이트/다크 모드 전환',
    fabSearchAria:'검색', fabSearchTitle:'종목 검색',
    netToggleAria:'상관관계 네트워크',
    alertConcentration:'집중 위험 감지',
    selectHint:'구체의 노드를 클릭하면<br>상세 정보가 표시됩니다',
    modalNewPfDescDefault:'포트폴리오 이름을 입력하세요. (1인당 최대 20개)',
    aboutTitleHeader:'SPHERE — 이용 약관 및 면책 고지',
    aboutLegalWarn:'⚠ <strong>본 서비스는 자본시장법상 투자 자문업이 아니며, 어떠한 종목의 매수·매도·보유도 권유하지 않습니다.</strong>',
    aboutH1:'1. 서비스 목적',
    aboutP1:'SPHERE는 투자 포트폴리오의 리스크 구조를 시각적으로 학습하고 분석하는 <strong>교육·시연 목적의 도구</strong>입니다. 실제 투자 의사결정의 근거로 사용해서는 안 됩니다.',
    aboutH2:'2. 데이터 정확성 및 제한',
    aboutP2:'본 서비스에 표시되는 종목 정보(현재가, 변동성, 베타값, 부채비율, 거래량 등)는 <strong>정적 스냅샷</strong>이며, 실시간 시세가 아닙니다. 실제 시장 가격과 상당한 차이가 있을 수 있습니다. 사용자는 실제 거래 시 반드시 본인의 증권사 시스템 등 공식 출처를 통해 최신 정보를 확인해야 합니다.',
    aboutH3:'3. 분석 결과의 한계',
    aboutP3:'리스크 스코어, 밸런스 지수, 자동 인사이트 등 본 서비스의 모든 분석 결과는 알고리즘이 도출한 <strong>참고용 지표</strong>이며, 미래 수익을 보장하지 않습니다. 분석에 사용되는 변동성·베타·부채비율 등은 과거 데이터 기반이며, 향후 시장 변화를 반영하지 못할 수 있습니다.',
    aboutH4:'4. 사용자 책임',
    aboutP4:'모든 투자 결정 및 그에 따른 <strong>손익은 전적으로 사용자 본인의 책임</strong>입니다. SPHERE 운영자는 본 서비스의 사용 또는 사용 불가로 인해 발생한 어떠한 직접적·간접적 손실, 일실 이익, 데이터 손상, 명예 훼손에 대해서도 책임지지 않습니다.',
    aboutH5:'5. 개인정보 처리',
    aboutP5:'본 서비스는 사용자 개인정보를 수집·저장·전송하지 않습니다. 사용자가 입력한 포트폴리오 정보(보유 종목·수량 등)는 사용자 브라우저의 localStorage에만 저장되며, 외부 서버로 전송되지 않습니다.',
    aboutH6:'6. 저작권 및 상표',
    aboutP6:'본 서비스에 표시되는 종목명·티커·ETF명은 각 발행회사 및 운용사의 등록상표이며, 분석 목적의 <strong>명목적 사용(nominative use)</strong>입니다. 본 서비스는 해당 회사·기관과 어떠한 제휴·후원·인증 관계가 없습니다.',
    aboutH7:'7. 외부 라이브러리',
    aboutP7:'본 서비스는 Three.js (MIT License) 그래픽 라이브러리를 사용하여 3D 시각화를 구현합니다. Three.js의 저작권은 Three.js Authors에 있습니다.',
    aboutH8:'8. 약관 변경',
    aboutP8:'본 약관은 사전 통지 없이 변경될 수 있으며, 변경 사항은 본 페이지에 즉시 반영됩니다. 사용자는 본 서비스를 계속 이용함으로써 변경된 약관에 동의한 것으로 간주됩니다.',
    aboutMeta:'본 서비스를 사용함으로써 위 사항에 모두 동의한 것으로 간주됩니다.<br>SPHERE Project · DACON 월간 해커톤 출품작 · 마지막 갱신 2026-04-29',
    aboutAck:'확인했습니다',
    insightEmptyTitleNoPf:'포트폴리오가 비어있음',
    insightEmptyBodyNoPf:'좌측 검색창에서 종목을 추가해주세요.',
    holdingCurrentHint:(q,sign,diff,colorVar)=>`<div class="holding-current-hint">현재 ${q}주 <span style="color:${colorVar}">(${sign}${diff})</span></div>`,
    addHoldingsShort:'종목을 추가하세요',
    customScenarioName:'커스텀 시나리오',
    customScenarioFactors:(n)=>`${n}개 인자 조합`,
    customScenarioSource:'매크로 영향 행렬 (휴리스틱)'
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
    riskMetrics:'Risk Analysis', riskMetricsBadge:'RISK',
    metricVaR:'Tomorrow\'s max loss (95%)', metricCVaR:'Worst 5% avg loss', metricSharpe:'Return per unit risk', metricSortino:'Return per downside risk',
    metricDR:'Diversification benefit', metricPortVol:'Price swings (annual)', metricDividend:'Estimated annual dividend',
    riskAdvancedToggle:'Advanced metrics (Sortino · DR · σ · Dividend)',
    stressTest:'Stress Test', stressTestBadge:'SCENARIO', stressTestEmpty:'Select a scenario',
    stressTestExpected:'Expected P&L', stressTestSummary:(p,v)=>`${(p*100).toFixed(1)}% (${v})`,
    navSphere:'SPHERE', navSearch:'SEARCH', navHoldings:'HOLDINGS', navMetrics:'METRICS', navInsights:'INSIGHTS',
    tabInsights:'Insights', tabRisk:'Risk', tabStress:'Stress', tabDetail:'Detail',
    restartTour:'Restart tour',
    csvImportShort:'Import', csvExportShort:'Export',
    csvExportTitle:'Export CSV', csvImportTitle:'Import CSV',
    csvExportEmpty:'No holdings to export',
    csvExportOk:(n)=>`✓ Exported ${n} holdings to CSV`,
    csvImportFailRead:'Failed to read file',
    csvImportFailFormat:'CSV format error — needs ticker / quantity columns',
    csvImportEmpty:'CSV file is empty',
    csvImportNoneValid:(t)=>`No recognized tickers (e.g. ${t})`,
    csvImportNoRows:'No valid data rows',
    csvImportPromptDesc:(n,sk)=>sk>0
      ? `Found ${n} holdings (${sk} unrecognized skipped).\nName the new portfolio.`
      : `Found ${n} holdings.\nName the new portfolio.`,
    csvImportOk:(n,sk)=>sk>0
      ? `✓ Imported ${n} holdings (${sk} skipped)`
      : `✓ Created new portfolio with ${n} holdings`,
    pfMaxReached:'Portfolio limit (20) reached',
    insights:'Insights', auto:'AUTO',
    selectedAsset:'Selected Asset',
    sdQty:'Quantity', sdValue:'Market Value', sdWeight:'Weight', sdSector:'Sector',
    sdPrice:'Current Price', sdAvg:'Avg Buy Price', sdReturn:'Return', sdVol:'Volatility 30D',
    sdBeta:'Beta', sdDebt:'Debt Ratio', sdRisk:'Risk Score',
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
    rbRecsDisclaimer:'Simulation only — no real trades',
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
    rbApplyConfirm:(b1,b2)=>`Apply simulation result to your active portfolio?\n\nBalance Index: ${b1} → ${b2}\nThe holdings quantities will be updated to your simulated values.\n\n⚠ No real buy/sell happens on your brokerage account. Execute actual trades manually through your brokerage app.`,
    rbResetConfirm:'Reset target to current portfolio. All simulation edits will be lost. Continue?',
    rbInsightUnchanged:'No changes yet.',
    rbDeltaImproved:(d)=>`Improved by ${d}`, rbDeltaWorsened:(d)=>`Worsened by ${d}`, rbDeltaSame:'No change',
    btnNetwork:'NETWORK',
    netLegendTitle:'CORRELATION',
    netStrong:'High ≥ 0.85', netMed:'Med 0.70–0.85', netWeak:'Low 0.50–0.70',
    netMeta:'Estimated from sector + beta + volatility',
    collapseTitle:'Collapse search', searchExpand:'Open asset search',
    leftToggleTitle:'Toggle left panel', rightToggleTitle:'Toggle right panel',
    appTitle:'SPHERE — Portfolio Risk Sphere Analyzer',
    resizeLeftAria:'Resize left panel', resizeLeftTitle:'Drag to resize',
    resizeRightAria:'Resize right panel', resizeRightTitle:'Drag to resize',
    themeToggleAria:'Toggle theme', themeToggleTitle:'Toggle light/dark mode',
    fabSearchAria:'Search', fabSearchTitle:'Search assets',
    netToggleAria:'Correlation network',
    alertConcentration:'Concentration risk detected',
    selectHint:'Tap a node on the sphere<br>to see asset details',
    modalNewPfDescDefault:'Enter portfolio name. (Up to 20 per user)',
    aboutTitleHeader:'SPHERE — Terms & Disclaimer',
    aboutLegalWarn:'⚠ <strong>This service is not investment advisory under capital markets law and does not solicit the buying, selling, or holding of any specific asset.</strong>',
    aboutH1:'1. Purpose',
    aboutP1:'SPHERE is an <strong>educational and demonstration tool</strong> that visualizes and analyzes the risk structure of investment portfolios. It must not be used as the basis for actual investment decisions.',
    aboutH2:'2. Data accuracy and limitations',
    aboutP2:'Asset information shown (current price, volatility, beta, debt ratio, volume, etc.) is a <strong>static snapshot</strong>, not real-time market data. Actual market prices may differ significantly. For real trades, always verify the latest information through official sources such as your brokerage system.',
    aboutH3:'3. Limitations of analysis results',
    aboutP3:'All analysis output (risk scores, balance index, automated insights) is an <strong>algorithmic reference indicator</strong> and does not guarantee future returns. Inputs (volatility, beta, debt ratio, etc.) are historical and may not reflect future market changes.',
    aboutH4:'4. User responsibility',
    aboutP4:'All investment decisions and resulting <strong>gains and losses are solely the user\'s responsibility</strong>. SPHERE operators are not liable for any direct or indirect losses, lost profits, data corruption, or reputational damage arising from use or inability to use this service.',
    aboutH5:'5. Privacy',
    aboutP5:'This service does not collect, store, or transmit personal user data. Portfolio information you enter (holdings, quantities) is stored only in your browser\'s localStorage and is never sent to external servers.',
    aboutH6:'6. Copyright and trademarks',
    aboutP6:'Asset names, tickers, and ETF names shown are registered trademarks of their respective issuers and operators, used here in <strong>nominative use</strong> for analysis. This service has no affiliation, sponsorship, or endorsement relationship with those companies or institutions.',
    aboutH7:'7. External libraries',
    aboutP7:'This service uses the Three.js (MIT License) graphics library for 3D visualization. Three.js copyright belongs to the Three.js Authors.',
    aboutH8:'8. Changes to terms',
    aboutP8:'These terms may change without prior notice; changes are reflected on this page immediately. Continued use of this service constitutes agreement to the revised terms.',
    aboutMeta:'By using this service you are deemed to have agreed to all of the above.<br>SPHERE Project · DACON Monthly Hackathon entry · last updated 2026-04-29',
    aboutAck:'Acknowledged',
    insightEmptyTitleNoPf:'Portfolio is empty',
    insightEmptyBodyNoPf:'Add assets via the search panel on the left.',
    holdingCurrentHint:(q,sign,diff,colorVar)=>`<div class="holding-current-hint">Currently ${q} sh <span style="color:${colorVar}">(${sign}${diff})</span></div>`,
    addHoldingsShort:'Add holdings',
    customScenarioName:'Custom scenario',
    customScenarioFactors:(n)=>`${n} factors`,
    customScenarioSource:'Macro factor matrix (heuristic)'
  }
};

// 라이브 바인딩으로 export — 다른 모듈은 항상 최신 값을 봄
export let CURRENT_LANG: Lang = (localStorage.getItem('sphere_lang') as Lang) || 'ko';

export function t(key: string, ...args: any[]): string {
  const dict = I18N[CURRENT_LANG];
  const fallback = I18N.ko;
  const v: DictEntry | undefined = (dict && dict[key]) ?? fallback[key] ?? key;
  return typeof v === 'function' ? v(...args) : (v as string);
}

export function applyI18n(): void {
  document.documentElement.lang = CURRENT_LANG;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n!); });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle!); });
  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder!); });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria!)); });
  document.querySelectorAll<HTMLElement>('#langSwitch button').forEach(b => b.classList.toggle('active', b.dataset.lang === CURRENT_LANG));
  const appTitleKey = document.documentElement.dataset.i18nTitleKey;
  if (appTitleKey) document.title = t(appTitleKey);
}

// setLang 호출 후 실행될 콜백 — 부트 시 main.ts 가 rebuildAll 을 등록
let _onLangChange: (() => void) | null = null;
export function onLangChange(fn: () => void): void { _onLangChange = fn; }

export function setLang(lang: Lang): void {
  CURRENT_LANG = lang;
  localStorage.setItem('sphere_lang', lang);
  applyI18n();
  if (_onLangChange) _onLangChange();
}

// 종목명 언어 헬퍼 (영문 토글 시 name_en 우선)
export function getName(asset: Pick<Asset, 'name' | 'name_en'>): string {
  if (CURRENT_LANG === 'en' && asset.name_en) return asset.name_en;
  return asset.name;
}

// 통화 단위 변환 — 한국어: "약 3,042만원" / 영문: "≈ 30.4M KRW"
export function formatKRWUnit(amount: number): string {
  amount = Math.round(amount);
  if (amount === 0) return '';
  if (CURRENT_LANG === 'en'){
    if (amount >= 1_000_000_000){
      const b = amount / 1_000_000_000;
      return `≈ ${b % 1 === 0 ? b : b.toFixed(2)}B KRW`;
    }
    if (amount >= 1_000_000){
      const m = amount / 1_000_000;
      return `≈ ${m % 1 === 0 ? m : m.toFixed(1)}M KRW`;
    }
    if (amount >= 1_000){
      return `≈ ${(amount/1000).toFixed(0)}K KRW`;
    }
    return `≈ ${amount.toLocaleString()} KRW`;
  }
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
export const SECTOR_LABELS: Record<Lang, Record<Sector, string>> = {
  ko: {
    IT:'IT', BIO:'바이오', AUTO:'자동차', GLOBAL_ETF:'글로벌 ETF',
    INDUSTRIAL:'산업/제조', ETC:'기타', FIN:'금융', ENERGY:'에너지',
    CONSUMER:'소비재', REALESTATE:'부동산'
  },
  en: {
    IT:'IT', BIO:'BIO', AUTO:'AUTO', GLOBAL_ETF:'GLOBAL ETF',
    INDUSTRIAL:'INDUSTRIAL', ETC:'OTHERS', FIN:'FINANCE', ENERGY:'ENERGY',
    CONSUMER:'CONSUMER', REALESTATE:'REAL ESTATE'
  }
};

export function sectorLabel(sec: Sector): string {
  return (SECTOR_LABELS[CURRENT_LANG] && SECTOR_LABELS[CURRENT_LANG][sec]) || sec;
}
