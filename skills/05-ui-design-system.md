# 05. UI 디자인 시스템 — 모바일·다크모드·인터랙션

## 핵심 원칙

1. **CSS 변수가 진실의 원천** — 색상은 변수, 변수는 테마별 분기
2. **모바일은 별개 앱처럼** — 데스크탑과 다른 정보 구조 (섹션 시스템)
3. **터치는 마우스가 아니다** — 호버 의존 X, 탭 토글 + FAB
4. **CSS만으로 안 되는 건 JS 위임** — 동적 max-height 등

---

## 목차

1. [CSS 변수 시스템](#1-css-변수-시스템)
2. [라이트/다크 모드](#2-라이트다크-모드)
3. [반응형 — 데스크탑·모바일 분기](#3-반응형)
4. [모바일 섹션 시스템](#4-모바일-섹션-시스템)
5. [드래그 리사이즈 패널](#5-드래그-리사이즈)
6. [info 툴팁 — 호버 vs 탭](#6-info-툴팁)
7. [FAB·바텀 네비 패턴](#7-fab바텀-네비)
8. [정보 위계 — 컨트롤 분리](#8-정보-위계)
9. [접근성](#9-접근성)

---

## 1. CSS 변수 시스템

### 변수가 풀어주는 두 가지 문제

**문제 1**: 다크/라이트 모드를 만드려면 모든 색상을 두 벌 써야 한다 → 유지보수 지옥

**해결**: `:root`에 변수만 정의, 실제 사용처는 `var(--token)` 만. 테마 바뀌면 변수만 swap.

**문제 2**: 같은 색이 여러 곳에서 다르게 들어가면 일관성 깨짐

**해결**: 토큰 시스템. 색상에 의미 부여:
- `--text-0`: 가장 진한 (헤드라인)
- `--text-1`: 본문
- `--text-2`: 보조
- `--text-3`: 거의 안 보임 (캡션)
- `--accent`: 브랜드 색
- `--safe / moderate / caution / high / extreme`: 5단계 위험

### 전체 변수 정의

```css
:root {
  /* 배경 */
  --bg-0: #05070d;      /* 가장 깊은 어둠 */
  --bg-1: #0a0f1c;
  --bg-2: #111829;
  --bg-grad: radial-gradient(ellipse at top, #0c1426 0%, var(--bg-0) 70%);

  /* 텍스트 */
  --text-0: #e8ecf5;
  --text-1: #9aa4bc;
  --text-2: #5d6783;
  --text-3: rgba(255,255,255,0.35);

  /* 라인·구분선 */
  --line: rgba(255,255,255,0.08);
  --line-soft: rgba(255,255,255,0.06);

  /* 표면 (오버레이·카드) */
  --overlay-soft: rgba(255,255,255,0.025);
  --overlay-hover: rgba(255,255,255,0.04);
  --overlay-hover-strong: rgba(255,255,255,0.08);
  --panel-bg: rgba(10,15,28,0.4);
  --header-bg: rgba(5,7,13,0.6);
  --surface-3: rgba(8,12,22,0.92);    /* 컨트롤바 */
  --surface-4: rgba(10,15,28,0.95);   /* 툴팁·드롭다운 */

  /* 그림자 */
  --shadow-strong: 0 8px 32px rgba(0,0,0,0.5);
  --shadow-soft: 0 4px 16px rgba(0,0,0,0.4);
  --shadow-modal: 0 20px 60px rgba(0,0,0,0.6);

  /* 위험 단계 */
  --safe: #00E5A0;
  --moderate: #00D4FF;
  --caution: #FF8C42;
  --high: #FF4560;
  --extreme: #7B61FF;

  /* 강조 */
  --accent: #00D4FF;

  /* 동적 — JS가 설정 */
  --left-w: 340px;
  --right-w: 340px;
  --mobile-dd-max: 320px;
}
```

### 사용 원칙

1. **hex 직접 쓰지 말고 변수**: `color: #e8ecf5` ❌ → `color: var(--text-0)` ✅
2. **rgba(255,255,255,*)는 OK**: 다크 테마에선 그대로, 라이트는 `data-theme` 오버라이드
3. **위험 색상은 항상 변수**: `var(--safe)` ↔ `var(--high)` 가 테마별로 약간 다름 (라이트 모드는 채도 낮춤)

---

## 2. 라이트/다크 모드

### 토글 메커니즘

`<html>` (또는 `:root`) 에 `data-theme="light"` 속성 추가/제거:

```javascript
function apply(theme){
  if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
  localStorage.setItem('sphere_theme_v1', theme);
}
```

### CSS 오버라이드

```css
:root[data-theme="light"] {
  --bg-0: #f4f6fb;
  --bg-1: #ffffff;
  --bg-2: #eef2f8;
  --bg-grad: radial-gradient(ellipse at top, #e8f0fb 0%, #f4f6fb 70%);
  --line: rgba(0,0,0,0.10);
  --line-soft: rgba(0,0,0,0.06);
  --text-0: #0f1729;
  --text-1: #49526e;
  --text-2: #7f8aa6;
  --text-3: rgba(0,0,0,0.35);
  --panel-bg: rgba(255,255,255,0.7);
  --header-bg: rgba(255,255,255,0.85);
  /* 위험 색상은 채도 약간 낮춤 — 흰 배경에서 너무 튀지 않게 */
  --safe: #00B27D;
  --moderate: #0099D4;
  --caution: #E07336;
  --high: #DD3654;
  --extreme: #6249C9;
  --accent: #0099D4;
}
```

### 패널·카드별 추가 분기

`rgba(255,255,255,*)` 같이 다크 가정한 색상은 라이트 모드에서 따로 처리:

```css
:root[data-theme="light"] aside.left,
:root[data-theme="light"] aside.right {
  background: var(--panel-bg);
}
:root[data-theme="light"] .panel { background: rgba(255,255,255,0.4); }
:root[data-theme="light"] .holding-row,
:root[data-theme="light"] .rm-card { background: rgba(255,255,255,0.35); }
:root[data-theme="light"] .info-tooltip,
:root[data-theme="light"] .modal,
:root[data-theme="light"] .bottom-nav {
  background: rgba(255,255,255,0.96);
}
```

### 시스템 prefers-color-scheme 자동 감지

```javascript
const sysLight = window.matchMedia('(prefers-color-scheme: light)').matches;
const saved = localStorage.getItem('sphere_theme_v1');
apply(saved || (sysLight ? 'light' : 'dark'));
```

저장된 값이 있으면 그것 우선. 없으면 시스템 설정 따라감.

### 캔버스(3D 구체)는 항상 어둡게

3D 시각화는 어두운 배경에서 가장 선명하기에, 라이트 모드에서도 stage 영역은 어둡게 유지하거나 약간만 변경. 사용자에게 일관된 시각화 경험 제공.

---

## 3. 반응형

### 단일 브레이크포인트

```css
@media (max-width: 768px) { ... }   /* 태블릿·모바일 */
@media (max-width: 380px) { ... }   /* 갤럭시 폴드 등 작은 화면 추가 보정 */
```

기본 디자인은 데스크탑 기준 (1280px+), 768px 이하에서 재배치.

### 데스크탑 레이아웃

CSS Grid 3컬럼:
```css
#app {
  display: grid;
  grid-template-columns: var(--left-w) 1fr var(--right-w);
  grid-template-rows: 56px 1fr auto;
  height: 100vh;
}
```

좌우 너비는 `--left-w / --right-w` 변수로 드래그 리사이즈 가능.

### 모바일 레이아웃

Grid → Flex 컬럼:
```css
@media (max-width: 768px) {
  #app {
    display: flex !important;
    flex-direction: column;
    height: auto;
    min-height: 100vh;
  }
  header { order: 1; }
  main { order: 2; }          /* 구체를 첫 화면 */
  aside.right { order: 3; }   /* 그 다음 메트릭 */
  aside.left { order: 4; }    /* 검색·보유 */
  .legal-banner { order: 5; }
}
```

`order` 속성으로 HTML 순서와 다른 표시 순서 부여.

### 헤더 — Grid → Flex

데스크탑은 grid 3컬럼, 모바일은 flex (빈 공간 안 생기게):
```css
@media (max-width: 768px) {
  header {
    display: flex !important;
    grid-template-columns: none !important;
    align-items: center;
    padding: 0 10px;
    gap: 8px;
  }
  header > .logo { flex-shrink: 0; }
  header > .portfolio-bar { flex: 1; min-width: 0; justify-content: flex-end; }
  header > .header-meta { display: none !important; }
}
```

### iOS Safari 100vh 흔들림 — `dvh` 사용

iOS Safari는 주소창 표시/숨김에 따라 `100vh` 흔들립니다. `dvh` (dynamic viewport height)는 안정:

```css
@supports (height: 100dvh) {
  #app { min-height: 100dvh; }
  main { min-height: 50dvh; max-height: 70dvh; }
  .stage { min-height: 50dvh; }
}
```

`@supports` 가드로 미지원 브라우저는 100vh로 폴백.

---

## 4. 모바일 섹션 시스템

### 문제 — 정보 과부하

데스크탑은 좌우 사이드바에 정보가 많아도 한눈에 들어오지만, 모바일은 좁은 세로 화면이라 모든 정보가 위에서 아래로 쭉 쌓이면:
1. 스크롤 길이 미친듯이 증가
2. 같은 정보가 탭 vs 바텀네비에 중복 표시
3. Holdings 같은 것이 매번 보여서 산만

### 해결 — 한 번에 한 섹션만

각 패널에 `data-m-section` 속성 부여:
```html
<div class="panel" data-m-section="search">검색</div>
<div class="panel" data-m-section="holdings">보유 종목</div>
<div class="panel" data-m-section="holdings">섹터 분배</div>
<div class="balance-card" data-m-section="metrics">밸런스 + 메트릭</div>
<div class="rp-pane" data-m-section="insights">인사이트</div>
<div class="rp-pane" data-m-section="insights">종목상세</div>
```

`<body>`에 `m-section-{name}` 클래스 토글:
```javascript
function setMobileSection(name){
  M_SECTIONS.forEach(s => document.body.classList.remove('m-section-' + s));
  document.body.classList.add('m-section-' + name);
}
```

CSS — 비활성 섹션 숨김 (모바일만):
```css
@media (max-width: 768px) {
  body.m-section-search   [data-m-section]:not([data-m-section="search"])   { display: none !important; }
  body.m-section-holdings [data-m-section]:not([data-m-section="holdings"]) { display: none !important; }
  body.m-section-metrics  [data-m-section]:not([data-m-section="metrics"])  { display: none !important; }
  body.m-section-insights [data-m-section]:not([data-m-section="insights"]) { display: none !important; }
}
```

### 효과

```
모바일에서 "지표" 섹션 활성:
[헤더] → [구체] → [Balance + Risk + Stress] → [푸터]
        ↑ 이외의 섹션은 모두 hidden
```

스크롤 길이 1/4로 단축 + 정보 과부하 해소.

### 데스크탑 영향 X

데스크탑은 `@media` 안의 규칙만 영향받지 않음. body 클래스 있어도 시각적 변화 없음.

### 종목 클릭 → 인사이트 섹션 자동 전환

```javascript
function selectAsset(ticker){
  selectedTicker = ticker;
  renderStockDetail(ITEMS.find(i => i.ticker === ticker));
  if (window.innerWidth <= 768){
    setMobileSection('insights');
    // 종목상세 위치까지 스크롤
    setTimeout(() => {
      const detail = document.getElementById('stockDetail');
      const top = detail.getBoundingClientRect().top + window.scrollY - 56 - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 100);
  }
}
```

---

## 5. 드래그 리사이즈

### 패턴 — 보이지 않는 핸들

```html
<div class="resize-handle left" id="resizeLeft"></div>
<div class="resize-handle right" id="resizeRight"></div>
```

CSS:
```css
.resize-handle {
  position: fixed;
  top: 56px;
  bottom: 0;
  width: 6px;
  z-index: 150;
  cursor: col-resize;
}
.resize-handle.left  { left: var(--left-w); margin-left: -3px; }
.resize-handle.right { right: var(--right-w); margin-right: -3px; }
.resize-handle:hover { background: rgba(0,212,255,0.25); }
```

핸들은 너비 6px로 마우스가 닿기 쉽지만, 호버 전엔 투명. 호버 시 시안색.

### JS — 드래그 핸들링

```javascript
function bindHandle(el, side){
  let dragging = false, startX = 0, startW = 0;

  function start(clientX){
    if (window.innerWidth <= 768) return;
    dragging = true;
    startX = clientX;
    const cur = getComputedStyle(root).getPropertyValue(side === 'left' ? '--left-w' : '--right-w');
    startW = parseInt(cur, 10) || 320;
    document.body.classList.add('is-resizing');
  }
  function move(clientX){
    if (!dragging) return;
    const dx = clientX - startX;
    const newW = side === 'left'
      ? Math.max(240, Math.min(window.innerWidth * 0.5, startW + dx))
      : Math.max(240, Math.min(window.innerWidth * 0.5, startW - dx));
    root.style.setProperty(side === 'left' ? '--left-w' : '--right-w', newW + 'px');
  }
  function end(){
    dragging = false;
    document.body.classList.remove('is-resizing');
    saveWidths();
    onResize();   // canvas 재계산
  }

  el.addEventListener('mousedown', e => { e.preventDefault(); start(e.clientX); });
  window.addEventListener('mousemove', e => move(e.clientX));
  window.addEventListener('mouseup', end);

  el.addEventListener('dblclick', () => {
    root.style.setProperty(side === 'left' ? '--left-w' : '--right-w',
                           side === 'left' ? '320px' : '360px');
    saveWidths(); onResize();
  });
}
```

### 드래그 중 transition 끄기

```css
body.is-resizing #app { transition: none; }
body.is-resizing { cursor: col-resize; user-select: none; }
body.is-resizing * { user-select: none; pointer-events: none; }
body.is-resizing .resize-handle { pointer-events: auto; }
```

평소엔 transition으로 부드럽지만, 드래그 중엔 그게 잔상 남기므로 끔.

### localStorage 영속화

```javascript
function saveWidths(){
  const left = parseInt(getComputedStyle(root).getPropertyValue('--left-w'), 10);
  const right = parseInt(getComputedStyle(root).getPropertyValue('--right-w'), 10);
  localStorage.setItem('sphere_panel_widths_v1', JSON.stringify({ left, right }));
}
```

---

## 6. info 툴팁 — 호버 vs 탭

### 데스크탑: 호버 + 갭 건너기

```javascript
let _infoHideTimer = null;
function scheduleHideInfo(delay){
  clearTimeout(_infoHideTimer);
  _infoHideTimer = setTimeout(hideInfo, delay);
}
function cancelHideInfo(){ clearTimeout(_infoHideTimer); }

document.body.addEventListener('mouseover', e => {
  const t = e.target.closest('.info-icon');
  if (t){ cancelHideInfo(); showInfo(t, t.dataset.info); return; }
  // 툴팁 본문 위로 들어오면 hide 예약 취소
  if (e.target.closest('.info-tooltip')){ cancelHideInfo(); }
});

document.body.addEventListener('mouseout', e => {
  const fromIcon = e.target.closest('.info-icon');
  const fromTip = e.target.closest('.info-tooltip');
  if (!fromIcon && !fromTip) return;
  const intoIcon = e.relatedTarget?.closest?.('.info-icon');
  const intoTip = e.relatedTarget?.closest?.('.info-tooltip');
  if (intoIcon || intoTip){ cancelHideInfo(); return; }
  scheduleHideInfo(180);   // 갭 건너는 시간
});
```

호버 → 툴팁 표시 → 사용자가 툴팁으로 마우스 옮김 → 갭(아이콘과 툴팁 사이) 건넘 → 180ms 안에 도착하면 유지.

### 모바일: 탭 토글

```javascript
let _tipPinned = null;
document.body.addEventListener('click', e => {
  const ic = e.target.closest('.info-icon');
  if (ic){
    e.preventDefault(); e.stopPropagation();
    if (_tipPinned === ic){ hideInfo(); _tipPinned = null; }
    else { showInfo(ic, ic.dataset.info); _tipPinned = ic; }
    return;
  }
  // 툴팁 외부 탭 시 닫기
  if (_tipPinned && !e.target.closest('.info-tooltip')){
    hideInfo(); _tipPinned = null;
  }
});
```

### 툴팁 본문 텍스트 선택 가능

```css
.info-tooltip {
  pointer-events: auto;       /* 호버·탭 가능 */
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
}
.info-tooltip ::selection {
  background: rgba(0,212,255,0.35);
}
```

수식·숫자를 복사해서 다른 곳에 붙여넣기 가능.

### 모바일 툴팁 위치 — 풀폭 + 바텀 네비 위

```css
@media (max-width: 768px) {
  .info-tooltip {
    position: fixed !important;
    left: 12px !important;
    right: 12px !important;
    top: auto !important;
    bottom: 80px !important;     /* 바텀 네비(60) + 여유(20) */
    max-width: none !important;
    max-height: 60vh;
    overflow-y: auto;
  }
}
```

작은 화면에서 가장 읽기 좋은 위치.

---

## 7. FAB·바텀 네비

### FAB (Floating Action Button)

```html
<button class="fab-search" id="fabSearch">
  <span class="fab-search-icon">+</span>
</button>
```

```css
.fab-search {
  display: none;
  position: fixed;
  bottom: 76px;          /* 바텀 네비 60 + 여유 16 */
  right: 16px;
  width: 52px; height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #7B61FF);
  box-shadow: 0 4px 16px rgba(0,212,255,0.4);
  z-index: 110;
}
@media (max-width: 768px) {
  .fab-search { display: flex; align-items: center; justify-content: center; }
}
```

데스크탑에선 hidden, 모바일에서만 표시. 검색 같은 핵심 액션을 항상 한 손가락 거리에 둠.

### 바텀 네비

```html
<nav class="bottom-nav" id="bottomNav">
  <button class="bottom-nav-item active" data-section="metrics">▣ METRICS</button>
  <button class="bottom-nav-item" data-section="holdings">≡ HOLDINGS</button>
  <button class="bottom-nav-item" data-section="insights">★ INSIGHTS</button>
  <button class="bottom-nav-item" data-section="search">⌕ SEARCH</button>
</nav>
```

```css
.bottom-nav {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 60px;
  background: rgba(5,7,13,0.96);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--line);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);   /* 노치 폰 대응 */
}
@media (max-width: 768px) {
  .bottom-nav { display: flex; justify-content: space-around; }
}
```

이벤트 위임으로 핸들링:
```javascript
document.getElementById('bottomNav').addEventListener('click', e => {
  const btn = e.target.closest('.bottom-nav-item');
  if (!btn) return;
  e.preventDefault();
  const sec = btn.dataset.section;
  if (sec) setMobileSection(sec);
});
```

### 4개가 마법 숫자

iOS HIG 권장 5개 이내, 안드로이드 Material 3~5개. 4개가 가장 균형 — 화면 1/4씩 차지해서 터치 영역 충분 + 인지부담 적음.

---

## 8. 정보 위계

### 컨트롤 분리 — 같은 곳에 다른 성격 X

초기 SPHERE는 controls-bar에 [SPHERE / CLUSTER / NETWORK / REBALANCE / RESET] 5개 버튼. 사용자가 "탭 같다"고 인식. 실제로는:
- SPHERE / CLUSTER: 시각화 모드 변경
- RESET: 시각화 리셋
- **NETWORK**: 다른 정보 오버레이 (구체 위에 라인 추가)
- **REBALANCE**: 완전히 다른 모드 진입 (UI 절반 교체)

성격이 다르면 위치도 다르게:

| 액션 | 위치 | 형태 |
|---|---|---|
| 뷰 전환 | controls-bar 중앙 | segmented control [SPHERE | CLUSTER] |
| 리셋 | controls-bar 우측 | 텍스트 버튼 [RESET] |
| 네트워크 토글 | 캔버스 우하단 | floating pill [⌬ NETWORK] |
| 리밸런싱 진입 | Balance card 안 | CTA [⟳ 리밸런싱 시뮬레이터] |

### Segmented control

```html
<div class="view-segment">
  <button class="ctrl-btn active" data-mode="sphere">SPHERE</button>
  <button class="ctrl-btn" data-mode="cluster">CLUSTER</button>
</div>
```

```css
.view-segment {
  display: inline-flex;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 3px;
}
.view-segment .ctrl-btn { border: none !important; background: transparent !important; }
.view-segment .ctrl-btn.active {
  background: rgba(0,212,255,0.18) !important;
  color: var(--accent) !important;
}
```

iOS의 segmented control 패턴 — "둘 중 하나만 선택"의 시각적 명확성.

### Canvas overlay toggle

```css
.canvas-toggle {
  position: absolute;
  right: 16px; bottom: 16px;
  z-index: 6;
  background: rgba(8,12,22,0.85);
  border: 1px solid var(--line);
  border-radius: 999px;     /* pill */
  padding: 8px 12px;
  pointer-events: auto;
}
.canvas-toggle.network-active {
  background: rgba(0,229,160,0.18);
  color: var(--safe);
  border-color: rgba(0,229,160,0.55);
}
@media (max-width: 768px) {
  .canvas-toggle { width: 36px; height: 36px; padding: 0; }
  .ct-label { display: none; }   /* 모바일은 아이콘만 */
}
```

캔버스 위 floating — 시각화에 추가되는 레이어임을 시각적으로 표현.

### Balance card CTA

```css
.balance-cta {
  display: flex; justify-content: center;
  width: 100%;
  margin-top: 14px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(0,212,255,0.12), rgba(123,97,255,0.12));
  border: 1px solid rgba(0,212,255,0.3);
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
}
.balance-cta:hover { transform: translateY(-1px); }
```

밸런스 점수 바로 아래 = "이 점수를 개선하려면 → 시뮬레이터 진입" 의 자연스러운 연결.

---

## 9. 접근성

### 시맨틱 HTML

- `<button>` 사용 (div + onclick X)
- `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`
- 모달은 `role="dialog"` + `aria-modal="true"`
- 메뉴는 `role="menu"` + items `role="menuitem"`

### ARIA

```html
<button aria-label="검색" title="종목 검색">+</button>
<button aria-haspopup="true" aria-expanded="false">≡</button>
<input aria-describedby="search-help" placeholder="...">
```

특히 아이콘만 있는 버튼은 반드시 `aria-label`. 스크린리더가 "검색 버튼"이라 읽어줌.

### 키보드 네비게이션

기본 동작 활용:
- Tab: 포커스 이동
- Enter/Space: 버튼 활성화
- Esc: 모달 닫기

추가 처리:
```javascript
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){
    closeAllModals();
  }
});
```

### 색맹 대응

위험 단계는 색만으로 구분하지 않고 라벨도 함께:
- `🟢 SAFE` (초록 + 라벨)
- `🔵 MODERATE`
- `🟡 CAUTION`
- `🔴 HIGH`
- `🟣 EXTREME`

색맹 사용자도 라벨로 구분 가능.

### 터치 타겟 ≥ 44px

iOS HIG, Material Design 모두 44px 권장. SPHERE 모바일:
- 바텀 네비 아이템: 60px 높이
- FAB: 52px
- 컨트롤 버튼: `min-height: 44px`
- 보유 종목 행: `min-height: 56px`
- info-icon: 18px (터치 영역은 padding 포함 28px+)

### 모션 감소 대응

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
  .logo-mark { animation: none !important; }
}
```

전정 장애 사용자 등을 위한 시스템 설정 존중.

---

## 다음 읽을 문서

- 처음부터 만들기 → `06-rebuild-from-scratch.md`
