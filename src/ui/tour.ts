// @ts-nocheck
/* =========================================================
   SPHERE — 온보딩 투어
   첫 방문 자동 실행 + ⓘ 메뉴 / 면책고지 모달의 "다시 보기" 진입점
   ========================================================= */

import { CURRENT_LANG, t } from '../i18n.js';

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

export function showTour(){
  _tourIdx = 0;
  document.getElementById('tourOverlay').classList.add('show');
  const prog = document.getElementById('tourProgress');
  prog.innerHTML = TOUR_STEPS.map(() => '<span></span>').join('');
  renderTourStep();
}

export function endTour(){
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
  setTimeout(() => {
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    let left = rect.left + rect.width / 2 - bw / 2;
    let top = rect.bottom + 14;
    if (top + bh > window.innerHeight - 16){
      top = rect.top - bh - 14;
      if (top < 16) top = (window.innerHeight - bh) / 2;
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

function tourNext(){
  _tourIdx++;
  if (_tourIdx >= TOUR_STEPS.length) endTour();
  else renderTourStep();
}

function tourPrev(){
  if (_tourIdx > 0){ _tourIdx--; renderTourStep(); }
}

/** 부트스트랩에서 호출 — 버튼·키보드·리사이즈 핸들러 + 첫 방문 자동 실행 */
export function installTour(){
  document.getElementById('tourNext')?.addEventListener('click', tourNext);
  document.getElementById('tourPrev')?.addEventListener('click', tourPrev);
  document.getElementById('tourSkip')?.addEventListener('click', endTour);
  window.addEventListener('keydown', e => {
    if (!document.getElementById('tourOverlay')?.classList.contains('show')) return;
    if (e.key === 'Escape') endTour();
    else if (e.key === 'ArrowRight' || e.key === 'Enter') tourNext();
    else if (e.key === 'ArrowLeft') tourPrev();
  });
  window.addEventListener('resize', () => {
    if (document.getElementById('tourOverlay')?.classList.contains('show')) renderTourStep();
  });

  // 첫 방문 시 자동 실행
  if (!localStorage.getItem('sphere_tour_done')){
    setTimeout(showTour, 900);
  }
}
