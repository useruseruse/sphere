# 06. 처음부터 만들기 — 단계별 재현 가이드

이 문서를 따라 하면 SPHERE를 백지에서 동일하게 만들 수 있습니다. 각 단계는 독립적으로 검증 가능 — 한 단계 끝낼 때마다 브라우저에서 동작 확인.

## 사전 준비

```bash
# 텍스트 에디터 (VSCode 추천) + 브라우저(Chrome/Safari)만 있으면 됨
mkdir sphere && cd sphere
```

빌드 도구·Node·npm 필요 없음.

---

## 단계별 로드맵

| 단계 | 시간 | 결과물 | 검증 방법 |
|---|---|---|---|
| 1 | 30분 | "Hello SPHERE" — 빈 구체 표시 | 브라우저에 회전하는 구 |
| 2 | 1시간 | 노드 표시 + 마우스 회전 | 구 위에 점 5개 |
| 3 | 2시간 | 5-Layer Pipeline | 위험 점수 계산 |
| 4 | 2시간 | 좌·우 사이드바 + 보유 관리 | 종목 추가/삭제 |
| 5 | 2시간 | 검색 + 해시태그 | 종목 검색 동작 |
| 6 | 2시간 | Balance Index + 인사이트 | 약점 진단 표시 |
| 7 | 3시간 | Risk Metrics (VaR/Sharpe/DR) | 메트릭 카드 |
| 8 | 3시간 | 스트레스 테스트 + 매크로 | 시나리오 적용 |
| 9 | 2시간 | 다크/라이트 + 반응형 | 테마 토글 |
| 10 | 2시간 | 모바일 섹션 + 바텀 네비 | 모바일 동작 |
| 11 | 2시간 | yfinance 자동화 + GH Actions | 매일 갱신 |
| 12 | 30분 | GitHub Pages 배포 | 라이브 URL |

총 약 22시간. 한 번에 만들기보다 단계별로 검증하면서 진행 권장.

---

## 단계 1 — Hello SPHERE (30분)

### 목표

빈 검은 화면에 회전하는 구 하나.

### 파일 만들기

`index.html`:
```html
<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>SPHERE</title>
<style>
  body { margin:0; background:#05070d; overflow:hidden; }
  canvas { display:block; }
</style>
</head><body>
<canvas id="canvas"></canvas>
<script src="https://unpkg.com/three@0.128.0/build/three.min.js"></script>
<script>
const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 0, 4.2);
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setSize(innerWidth, innerHeight);

scene.add(new THREE.AmbientLight(0x6080a0, 0.4));
const light = new THREE.DirectionalLight(0x00d4ff, 0.8);
light.position.set(3, 4, 5);
scene.add(light);

const geo = new THREE.SphereGeometry(1.0, 32, 24);
const mat = new THREE.MeshPhongMaterial({ color:0x00d4ff, wireframe:true });
const sphere = new THREE.Mesh(geo, mat);
scene.add(sphere);

function animate(){
  requestAnimationFrame(animate);
  sphere.rotation.y += 0.005;
  renderer.render(scene, camera);
}
animate();
</script>
</body></html>
```

### 실행

```bash
python3 -m http.server 8000
```

`http://localhost:8000` → 회전하는 시안색 구 보임. ✅

---

## 단계 2 — 노드 + 회전 (1시간)

### 목표

구 표면 위에 5개 노드(다른 색) + 마우스로 회전.

### 변경 사항

위 코드의 `<script>` 블록에 추가:

```javascript
// 마우스 회전
let rotation = { x: 0.2, y: 0 };
let isDragging = false, prev = { x: 0, y: 0 };
let autoRotate = true;

canvas.addEventListener('mousedown', e => {
  isDragging = true; prev = {x:e.clientX, y:e.clientY}; autoRotate = false;
});
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', e => {
  if (isDragging){
    rotation.y += (e.clientX - prev.x) * 0.005;
    rotation.x = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, rotation.x + (e.clientY - prev.y) * 0.005));
    prev = {x:e.clientX, y:e.clientY};
  }
});

// 위경도 → 3D
function latLngToVec3(lat, lng, r){
  const phi = (90-lat) * Math.PI/180;
  const theta = lng * Math.PI/180;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// 5개 노드
const sphereGroup = new THREE.Group();
scene.add(sphereGroup);
sphereGroup.add(sphere);

const nodes = [
  { lat: 70, lng: 0, r: 1.3, color: 0xFF4560 },
  { lat: 50, lng: 60, r: 1.2, color: 0xFF8C42 },
  { lat: 0, lng: 120, r: 1.1, color: 0x00D4FF },
  { lat: -40, lng: 200, r: 1.15, color: 0x00E5A0 },
  { lat: -70, lng: 280, r: 1.25, color: 0x7B61FF },
];

nodes.forEach(n => {
  const ng = new THREE.SphereGeometry(0.08, 16, 12);
  const nm = new THREE.MeshPhongMaterial({ color: n.color, emissive: n.color, emissiveIntensity:0.6 });
  const mesh = new THREE.Mesh(ng, nm);
  mesh.position.copy(latLngToVec3(n.lat, n.lng, n.r));
  sphereGroup.add(mesh);
});

// 애니메이션 루프 갱신
function animate(){
  requestAnimationFrame(animate);
  if (autoRotate) rotation.y += 0.005;
  sphereGroup.rotation.x = rotation.x;
  sphereGroup.rotation.y = rotation.y;
  renderer.render(scene, camera);
}
animate();
```

### 검증

마우스 드래그로 구가 회전. 5개 색깔 노드가 표면 위 분포. ✅

---

## 단계 3 — 5-Layer Pipeline (2시간)

### 목표

가짜 종목 데이터 → 위험 점수 → sphere coords → balance score 까지.

### 코드 추가

```javascript
// 1. ASSET_DB (마스터)
const SECTOR_DEF = {
  IT:        { lat_min:60, lat_max:80, base_risk:0.75, vol_avg:0.30, beta_avg:1.20, color:'#00D4FF' },
  BIO:       { lat_min:40, lat_max:60, base_risk:0.85, vol_avg:0.42, beta_avg:1.15, color:'#7B61FF' },
  AUTO:      { lat_min:20, lat_max:40, base_risk:0.60, vol_avg:0.28, beta_avg:1.10, color:'#FF8C42' },
  FIN:       { lat_min:-60, lat_max:-40, base_risk:0.50, vol_avg:0.20, beta_avg:0.85, color:'#FFB088' },
  CONSUMER:  { lat_min:-80, lat_max:-60, base_risk:0.45, vol_avg:0.18, beta_avg:0.75, color:'#A8CFFF' },
  // 나머지 섹터도 추가
};

const ASSET_DB = [
  { ticker:'AAPL', name:'Apple', sector:'IT', current_price:195, volatility_30d:0.21, beta:1.18, debt_ratio:0.32, liquidity_volume:52000000, is_etf:false },
  { ticker:'MRNA', name:'Moderna', sector:'BIO', current_price:120, volatility_30d:0.55, beta:1.40, debt_ratio:0.20, liquidity_volume:8000000, is_etf:false },
  { ticker:'F', name:'Ford', sector:'AUTO', current_price:11, volatility_30d:0.32, beta:1.15, debt_ratio:0.65, liquidity_volume:60000000, is_etf:false },
  { ticker:'JPM', name:'JPMorgan', sector:'FIN', current_price:200, volatility_30d:0.18, beta:0.95, debt_ratio:0.85, liquidity_volume:9000000, is_etf:false },
  { ticker:'KO', name:'Coca-Cola', sector:'CONSUMER', current_price:62, volatility_30d:0.14, beta:0.55, debt_ratio:0.62, liquidity_volume:14000000, is_etf:false },
];
const ASSET_BY_TICKER = {};
ASSET_DB.forEach(a => ASSET_BY_TICKER[a.ticker] = a);

// 가짜 보유
const HOLDINGS = [
  { ticker:'AAPL', quantity:50 },
  { ticker:'MRNA', quantity:20 },
  { ticker:'F', quantity:300 },
  { ticker:'JPM', quantity:30 },
  { ticker:'KO', quantity:80 },
];

// 2. 표준화
function standardize(holdings){
  const enriched = holdings.map(h => {
    const a = ASSET_BY_TICKER[h.ticker];
    return { ...a, quantity: h.quantity, market_value: h.quantity * a.current_price };
  });
  const total = enriched.reduce((s, h) => s + h.market_value, 0);
  return enriched.map(h => ({ ...h, weight: h.market_value / total }));
}

// 3. 리스크 점수
function computeRiskScores(items){
  const vols = items.map(i => i.liquidity_volume).sort((a,b) => a-b);
  const liqMedian = vols[Math.floor(vols.length/2)];
  items.forEach(i => {
    const volN = Math.max(0, Math.min(1, (i.volatility_30d - 0.05)/0.75));
    const betaN = Math.max(0, Math.min(1, i.beta / 2.5));
    const debtN = Math.min(1, i.debt_ratio);
    const liqN = Math.min(1, 1 / (i.liquidity_volume / liqMedian));
    const secR = SECTOR_DEF[i.sector].base_risk;
    const score = volN*0.35 + betaN*0.25 + debtN*0.20 + liqN*0.10 + secR*0.10;
    i.risk_score = Math.round(score * 100);
  });
  return items;
}

// 4. 좌표 매핑
function mapCoords(items){
  const bySector = {};
  items.forEach(i => {
    if (!bySector[i.sector]) bySector[i.sector] = [];
    bySector[i.sector].push(i);
  });
  let lngOffset = 0;
  Object.keys(bySector).forEach(sec => {
    const arr = bySector[sec].sort((a,b) => b.weight - a.weight);
    const def = SECTOR_DEF[sec];
    arr.forEach((it, k) => {
      const t = arr.length === 1 ? 0.5 : k / (arr.length - 1);
      it.sphere_coord = {
        lat: def.lat_min + t * (def.lat_max - def.lat_min),
        lng: (lngOffset + k * (360 / arr.length) * 0.4) % 360,
        r: 1.0 + (it.risk_score / 100) * 0.5
      };
    });
    lngOffset += 360 / Object.keys(bySector).length;
  });
  return items;
}

// 5. 밸런스
function computeBalance(items){
  const secW = {};
  items.forEach(i => secW[i.sector] = (secW[i.sector] || 0) + i.weight);
  const hhi = Object.values(secW).reduce((s,w) => s + w*w, 0);
  const nSec = Object.keys(secW).length;
  const diverse = nSec > 1 ? ((1 - hhi) / (1 - 1/nSec)) * 100 : 0;
  const scores = items.map(i => i.risk_score);
  const mean = scores.reduce((s,v) => s+v, 0) / scores.length;
  const std = Math.sqrt(scores.reduce((s,v) => s + (v-mean)**2, 0) / scores.length);
  const deviation = Math.max(0, (1 - std/50) * 100);
  return { balance: Math.round(diverse*0.4 + deviation*0.4 + 60*0.2), avgRisk: Math.round(mean), hhi: hhi.toFixed(3) };
}

// 실행
const ITEMS = mapCoords(computeRiskScores(standardize(HOLDINGS)));
const BALANCE = computeBalance(ITEMS);
console.log('ITEMS', ITEMS);
console.log('BALANCE', BALANCE);
```

### 검증

브라우저 콘솔에 ITEMS·BALANCE 로그. 위험 점수와 밸런스 숫자가 합리적이면 ✅

다음 단계에서 이 데이터로 노드 동적 생성.

---

## 단계 4 — 사이드바 + 보유 관리 (2시간)

### 목표

좌측 사이드바에 보유 종목 목록 표시. 수량 +/- 버튼으로 변경.

### HTML 추가

```html
<style>
  body { display: grid; grid-template-columns: 320px 1fr; height: 100vh; }
  aside { background: rgba(10,15,28,0.5); padding: 16px; overflow-y: auto; color: #e8ecf5; font-family: sans-serif; }
  .holding-row { display: flex; gap: 8px; padding: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .holding-name { flex: 1; }
  button { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: white; padding: 4px 10px; cursor: pointer; }
</style>

<aside>
  <h3>보유 종목</h3>
  <div id="holdingsList"></div>
</aside>
<canvas id="canvas"></canvas>
```

### JS — 렌더 + 이벤트

```javascript
function renderHoldings(){
  const el = document.getElementById('holdingsList');
  el.innerHTML = HOLDINGS.map(h => {
    const a = ASSET_BY_TICKER[h.ticker];
    return `
      <div class="holding-row">
        <span class="holding-name">${a.name}</span>
        <button data-act="dec" data-ticker="${h.ticker}">−</button>
        <span>${h.quantity}</span>
        <button data-act="inc" data-ticker="${h.ticker}">+</button>
        <button data-act="del" data-ticker="${h.ticker}">×</button>
      </div>`;
  }).join('');
}

document.getElementById('holdingsList').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const ticker = btn.dataset.ticker;
  const act = btn.dataset.act;
  const idx = HOLDINGS.findIndex(h => h.ticker === ticker);
  if (act === 'inc') HOLDINGS[idx].quantity++;
  else if (act === 'dec' && HOLDINGS[idx].quantity > 1) HOLDINGS[idx].quantity--;
  else if (act === 'del') HOLDINGS.splice(idx, 1);
  rebuildAll();
});

function rebuildAll(){
  const items = mapCoords(computeRiskScores(standardize(HOLDINGS)));
  rebuildNodes(items);    // sphere 노드 재생성
  renderHoldings();
}

renderHoldings();
```

### rebuildNodes 함수

`sphereGroup` 안의 노드를 모두 제거하고 ITEMS 기반으로 재생성:

```javascript
const dynamicGroup = new THREE.Group();
sphereGroup.add(dynamicGroup);

function rebuildNodes(items){
  while (dynamicGroup.children.length){
    const c = dynamicGroup.children[0];
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
    dynamicGroup.remove(c);
  }
  items.forEach(it => {
    const pos = latLngToVec3(it.sphere_coord.lat, it.sphere_coord.lng, it.sphere_coord.r);
    const radius = it.weight * 0.5 + 0.02;
    const geo = new THREE.SphereGeometry(radius, 24, 18);
    const colorHex = SECTOR_DEF[it.sector].color;
    const mat = new THREE.MeshPhongMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity:0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    dynamicGroup.add(mesh);
  });
}
```

### 검증

좌측에 5개 종목 + - × 버튼. 누르면 구체의 노드도 즉시 변경 ✅

---

## 단계 5 — 검색 + 해시태그 (2시간)

### 핵심 데이터 구조

`HASHTAG_MATCHERS`:
```javascript
const HASHTAG_MATCHERS = {
  '반도체': a => /AAPL|NVDA|AMD|005930|000660/.test(a.ticker),
  'IT': a => a.sector === 'IT',
  'ETF': a => a.is_etf,
  '배당': a => (a.dividend_yield || 0) > 0.03,
  '한국': a => /\.(KS|KQ)$/.test(a.ticker),
  // ... 130+
};
```

### 검색 함수

```javascript
function searchAssets(q){
  if (!q) return [];
  const lq = q.toLowerCase();
  if (q.startsWith('#')){
    const tag = q.slice(1);
    const m = HASHTAG_MATCHERS[tag];
    if (m) return ASSET_DB.filter(m).slice(0, 30);
  }
  return ASSET_DB.filter(a =>
    a.ticker.toLowerCase().includes(lq) ||
    a.name.toLowerCase().includes(lq) ||
    (a.alias || '').toLowerCase().includes(lq)
  ).slice(0, 30);
}
```

### UI

```html
<input type="text" id="searchInput" placeholder="종목·#태그 검색">
<div id="searchResults"></div>
```

```javascript
const input = document.getElementById('searchInput');
const results = document.getElementById('searchResults');
input.addEventListener('input', e => {
  const q = e.target.value;
  const matches = searchAssets(q);
  results.innerHTML = matches.map(a => `
    <div class="search-result" data-ticker="${a.ticker}">
      ${a.name} (${a.ticker}) — ${a.sector}
    </div>
  `).join('');
});
results.addEventListener('click', e => {
  const r = e.target.closest('.search-result');
  if (!r) return;
  const ticker = r.dataset.ticker;
  if (HOLDINGS.find(h => h.ticker === ticker)) return;
  HOLDINGS.push({ ticker, quantity: 10 });
  rebuildAll();
  input.value = '';
  results.innerHTML = '';
});
```

### 검증

"AAPL" 입력 → Apple 결과. 클릭 → 보유에 추가. 구체에 노드 생김 ✅

---

## 단계 6 — Balance + Insights (2시간)

### 우측 사이드바 추가

```html
<style>
  body { grid-template-columns: 320px 1fr 360px; }
</style>
<aside class="right">
  <h3>Balance Index</h3>
  <div class="balance-score" id="balanceScore">--</div>
  <div id="insights"></div>
</aside>
```

### generateInsights

```javascript
function generateInsights(items, balance){
  const out = [];
  if (!items.length) return out;

  // W1 — 섹터 편중
  const secW = {};
  items.forEach(i => secW[i.sector] = (secW[i.sector] || 0) + i.weight);
  const topSec = Object.entries(secW).sort((a,b) => b[1]-a[1])[0];
  if (topSec[1] > 0.35){
    out.push({ level:'warn', title:'섹터 편중',
               body:`${topSec[0]} 섹터에 ${(topSec[1]*100).toFixed(1)}% 집중. 다른 섹터 추가 권장.` });
  }

  // W2 — 종목 집중
  const top = [...items].sort((a,b) => b.weight - a.weight)[0];
  if (top.weight > 0.25){
    out.push({ level:'alert', title:'종목 집중',
               body:`${top.name} 비중 ${(top.weight*100).toFixed(1)}% — 분산 필요.` });
  }

  // W3 — 평균 리스크 과다
  if (balance.avgRisk > 70){
    out.push({ level:'warn', title:'고위험 포트폴리오',
               body:`평균 위험 ${balance.avgRisk}/100. 안전형 ETF·채권 비중 늘리기.` });
  }

  if (!out.length){
    out.push({ level:'ok', title:'균형 잡힌 포트폴리오',
               body:`밸런스 ${balance.balance}/100. 잘 분산되어 있어요.` });
  }
  return out;
}
```

### 렌더링

```javascript
function renderBalance(balance){
  document.getElementById('balanceScore').textContent = balance.balance;
}
function renderInsights(insights){
  document.getElementById('insights').innerHTML = insights.map(i => `
    <div class="insight ${i.level}">
      <strong>${i.title}</strong><br>${i.body}
    </div>
  `).join('');
}

function rebuildAll(){
  const items = mapCoords(computeRiskScores(standardize(HOLDINGS)));
  const balance = computeBalance(items);
  const insights = generateInsights(items, balance);
  rebuildNodes(items);
  renderHoldings();
  renderBalance(balance);
  renderInsights(insights);
}
```

### 검증

Balance Index 숫자 + 인사이트 카드 표시. Apple 비중 50% 만들면 "종목 집중" 알림 ✅

---

## 단계 7 — Risk Metrics (3시간)

### computeAdvancedMetrics

`01-financial-engineering.md` 의 수식을 코드로:

```javascript
const RISK_FREE = 0.035;
const ERP = 0.06;
const TRADING_DAYS = 252;
const Z95 = 1.6449;
const ES95 = 2.0627;

function pairwiseCorr(a, b){
  if (a.ticker === b.ticker) return 1;
  const aETF = !!a.is_etf, bETF = !!b.is_etf;
  if (aETF && bETF) return 0.85;
  if (aETF || bETF) return 0.55;
  if (a.sector === b.sector) return 0.50;
  return 0.18;
}

function portfolioVol(items){
  let s2 = 0;
  for (const a of items) for (const b of items){
    const rho = (a === b) ? 1 : pairwiseCorr(a, b);
    s2 += a.weight * b.weight * a.volatility_30d * b.volatility_30d * rho;
  }
  return Math.sqrt(s2);
}

function computeAdvancedMetrics(items){
  if (!items.length) return {};
  const totalValue = items.reduce((s, i) => s + i.market_value, 0);
  const portVol = portfolioVol(items);
  const portVolDaily = portVol / Math.sqrt(TRADING_DAYS);
  const portBeta = items.reduce((s, i) => s + i.weight * i.beta, 0);
  const portReturn = RISK_FREE + portBeta * ERP;
  const var95 = Z95 * portVolDaily * totalValue;
  const cvar95 = ES95 * portVolDaily * totalValue;
  const sharpe = portVol > 0 ? (portReturn - RISK_FREE) / portVol : 0;
  const sortino = portVol > 0 ? (portReturn - RISK_FREE) / (portVol * 0.71) : 0;
  const wsum = items.reduce((s, i) => s + i.weight * i.volatility_30d, 0);
  const dr = portVol > 0 ? wsum / portVol : 1;
  const riskReduction = wsum > 0 ? (1 - portVol / wsum) : 0;
  return { totalValue, portVol, portVolDaily, portBeta, portReturn, var95, cvar95, sharpe, sortino, dr, riskReduction };
}
```

### 카드 렌더링

각 지표는 `<카드> + <메인 값> + <한 줄 해설> + <등급 뱃지>`:

```javascript
function renderRiskCards(adv){
  const isEN = false;
  const sharpe = adv.sharpe || 0;
  const sharpeGrade = sharpe > 1 ? 'safe' : sharpe > 0.5 ? 'moderate' : sharpe > 0 ? 'caution' : 'high';
  const sharpeBadge = {safe:'⭐ 우수', moderate:'⭐ 양호', caution:'△ 부족', high:'✕ 비효율'}[sharpeGrade];

  document.getElementById('mSharpe').textContent = sharpe.toFixed(2);
  document.getElementById('mSharpeHint').textContent =
    sharpe > 1 ? '값이 클수록 좋아요. 1보다 크면 위험 감수한 보람 충분.' :
    sharpe > 0 ? '값이 작아요. 위험 대비 수익이 부족.' :
    '적금만도 못한 수준.';
  document.getElementById('mSharpeGrade').innerHTML = `<span class="rm-badge ${sharpeGrade}">${sharpeBadge}</span>`;

  // VaR, CVaR, Sortino, DR, PortVol도 동일 패턴...
}
```

### 검증

각 메트릭이 카드로 표시. 등급 뱃지 색상으로 즉시 판단 가능 ✅

---

## 단계 8 — 스트레스 테스트 + 매크로 (3시간)

### STRESS_SCENARIOS

`01-financial-engineering.md` §10 데이터:

```javascript
const STRESS_SCENARIOS = {
  gfc2008: {
    label_ko: '2008 글로벌 금융위기',
    period: '2008-09-15 ~ 2009-03-09 (6개월)',
    benchmark: 'S&P 500 −56%',
    desc_ko: 'Lehman 파산 후 6개월. 금융·부동산 진앙.',
    source: 'Yahoo Finance · SPDR Sector ETFs',
    shocks: { IT:-0.52, BIO:-0.34, AUTO:-0.55, FIN:-0.82, ENERGY:-0.46,
              CONSUMER:-0.35, REALESTATE:-0.71, INDUSTRIAL:-0.57,
              GLOBAL_ETF:-0.50, ETC:-0.40 }
  },
  // covid2020, inflation2022, dotcom2000도 추가
};

function adjustShockByBeta(sectorShock, beta){
  const m = Math.max(0.55, Math.min(1.55, beta));
  return sectorShock * m;
}

function computeStressTest(items, scenarioKey){
  const scn = STRESS_SCENARIOS[scenarioKey];
  if (!scn) return null;
  let portLoss = 0;
  const breakdown = items.map(it => {
    const baseShock = scn.shocks[it.sector] ?? -0.30;
    const shock = adjustShockByBeta(baseShock, it.beta);
    const loss = it.market_value * shock;
    portLoss += loss;
    return { name: it.name, shock, loss };
  });
  return { scenario: scn, portLoss, breakdown };
}
```

### 시각화 — 색상 변경

```javascript
function applyStressVisuals(scenarioKey){
  const scn = STRESS_SCENARIOS[scenarioKey];
  if (!scn){
    // 원래 색 복원
    nodeMeshes.forEach(n => {
      n.mesh.material.color.copy(n.baseColor);
    });
    return;
  }
  nodeMeshes.forEach(n => {
    const shock = scn.shocks[n.item.sector] ?? -0.30;
    let hex;
    if (shock > 0.05) hex = '#00E5A0';
    else if (shock > -0.15) hex = '#FFD66B';
    else if (shock > -0.30) hex = '#FF8C42';
    else if (shock > -0.50) hex = '#FF4560';
    else hex = '#7B61FF';
    n.mesh.material.color.set(hex);
  });
}
```

### 매크로 인자

```javascript
const MACRO_FACTORS = {
  rateHike: {
    label_ko: '금리 인상 (+200bp)',
    impact: { IT:-0.12, REALESTATE:-0.18, FIN:+0.05, ... }
  },
  oilSurge: { ... },
  // 10개 인자
};

const MACRO_AXES = [
  { id:'rate', label:'금리 정책', options:['rateHike','rateCut'] },
  { id:'infl', label:'물가', options:['inflation'] },
  // ...
];

let SELECTED_MACROS = new Set();
function rebuildCustom(){
  if (!SELECTED_MACROS.size) return null;
  const shocks = {};
  ['IT','BIO','AUTO',...].forEach(s => shocks[s] = 0);
  SELECTED_MACROS.forEach(key => {
    const f = MACRO_FACTORS[key];
    Object.entries(f.impact).forEach(([s, v]) => shocks[s] += v);
  });
  // ±90% 클립
  Object.keys(shocks).forEach(s => shocks[s] = Math.max(-0.9, Math.min(0.9, shocks[s])));
  return { shocks, label_ko: '커스텀', period: SELECTED_MACROS.size + '개 인자', ... };
}
```

### 검증

시나리오 클릭 → 손실 표시 + 구체 색상 변경. 매크로 인자 조합 시 합산 동작 ✅

---

## 단계 9 — 다크/라이트 + 반응형 (2시간)

`05-ui-design-system.md` 의 CSS 변수 시스템 + 미디어 쿼리 적용. 별도 코드 반복 X.

### 검증

- 우측 상단 토글 클릭 → 라이트/다크 전환
- 브라우저 창 768px 이하로 줄임 → 단일 컬럼 + 바텀 네비
- iOS Safari에서 vh 흔들림 없음 (dvh)

---

## 단계 10 — 모바일 섹션 + 바텀 네비 (2시간)

`05-ui-design-system.md` §4 섹션 시스템 + §7 바텀 네비 + FAB 적용.

### 검증

- 바텀 네비 4개 탭 전환 시 한 섹션만 표시
- FAB 탭 → 검색 섹션 전환 + input focus
- 종목 클릭 → 인사이트 섹션 자동 전환

---

## 단계 11 — yfinance + GitHub Actions (2시간)

`04-data-pipeline.md` 의 `update_prices.py`, `generate_tickers.py`, 워크플로 yml 적용.

### 검증

```bash
pip install -r requirements.txt
python tools/update_prices.py
# data/prices.json 채워짐
```

GitHub에 push → Actions 탭에서 cron 트리거 동작 확인.

---

## 단계 12 — GitHub Pages 배포 (30분)

1. GitHub repo 생성 (public)
2. `git push`
3. Settings → Pages → Source: GitHub Actions
4. `.github/workflows/deploy.yml` 자동 트리거
5. URL: `https://{user}.github.io/{repo}/`

### 검증

배포된 URL을 모바일·데스크탑·다른 사람 노트북에서 모두 정상 동작.

---

## 트러블슈팅 빈출

### "Cannot access 'X' before initialization" — TDZ

`let X = ...` 가 실제 사용 줄보다 아래 있으면 발생. 변수 선언을 위로 올리거나 `var` 또는 함수 선언 사용.

### Three.js 노드가 안 보임

1. 카메라 거리 (`camera.position.z`) 가 충분한지
2. `light` 추가 했는지
3. material.opacity가 0이 아닌지
4. mesh.position이 origin 근처인지

### CSS 변수가 안 먹힘

`@media (max-width: 768px)` 안의 규칙은 미디어 쿼리 밖 규칙보다 specificity 같으면 후순위 상관없이 큰 화면에선 무시. `!important` 또는 더 구체적인 selector 사용.

### iOS에서 `position: fixed` 가 키보드 가림

iOS Safari는 가상 키보드 올라올 때 fixed 요소가 화면 밖으로 밀림. `bottom: env(safe-area-inset-bottom, 0)` 추가 + 모바일 키보드 올라올 때 클라이언트 코드로 위치 보정.

### localStorage quota 초과

브라우저별 5~10MB 한도. 포트폴리오 20개 정도면 ~50KB라 여유. 시세 데이터를 localStorage에 캐시하는 등 대용량 저장 시 IndexedDB로 이동.

---

## 마무리

여기까지 따라왔다면 SPHERE v1.0과 동일한 기능을 가진 사이트를 만든 것입니다. 추가 발전 방향:

- **Fama-French 5요인 모형**: CAPM 한계 보완
- **실시간 데이터**: WebSocket으로 분 단위 갱신
- **백테스팅**: "1년 전 이 포트폴리오라면?" 시뮬레이션
- **소셜**: 다른 사람의 SPHERE를 공유·비교
- **알림**: 임계값 도달 시 이메일·푸시

기존 코드를 base로 PR 형태로 발전시킬 수도, 별도 fork 만들 수도 있습니다. 행운을 빕니다.

---

## 다음 읽을 문서

- 처음 보러 → `README.md`
- 금융 깊이 → `01-financial-engineering.md`
- 시스템 설계 → `02-architecture.md`
- 시각화 디테일 → `03-3d-visualization.md`
- 데이터 자동화 → `04-data-pipeline.md`
- UI 패턴 → `05-ui-design-system.md`
