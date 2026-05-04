// @ts-nocheck
/* =========================================================
   SPHERE — 레이아웃 컨트롤
   - installResize  : 좌·우 패널 드래그 리사이즈 + 너비 영속화
   - installRightTabs : 우측 패널 탭 (insights / risk / stress / detail)
   - installTheme   : Light/Dark 토글 + prefers-color-scheme 초기값
   ========================================================= */

import * as scene from '../scene/sphere.js';

export function installResize(){
  const STORAGE = 'sphere_panel_widths_v1';
  const MIN_W = 240, MAX_VW = 0.5;
  const root = document.documentElement;

  // 저장된 너비 복원
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || '{}');
    if (saved.left  && saved.left  >= MIN_W) root.style.setProperty('--left-w',  saved.left  + 'px');
    if (saved.right && saved.right >= MIN_W) root.style.setProperty('--right-w', saved.right + 'px');
  } catch(e){}

  function saveWidths(){
    const left  = parseInt(getComputedStyle(root).getPropertyValue('--left-w'),  10) || 320;
    const right = parseInt(getComputedStyle(root).getPropertyValue('--right-w'), 10) || 360;
    try { localStorage.setItem(STORAGE, JSON.stringify({ left, right })); } catch(e){}
  }

  function bindHandle(el, side){
    if (!el) return;
    let dragging = false;
    let startX = 0;
    let startW = 0;

    function start(clientX){
      if (window.innerWidth <= 768) return;   // 모바일 비활성
      dragging = true;
      startX = clientX;
      const cur = getComputedStyle(root).getPropertyValue(side === 'left' ? '--left-w' : '--right-w');
      startW = parseInt(cur, 10) || (side === 'left' ? 320 : 360);
      document.body.classList.add('is-resizing');
      el.classList.add('active');
    }
    function move(clientX){
      if (!dragging) return;
      const dx = clientX - startX;
      const maxW = window.innerWidth * MAX_VW;
      const newW = side === 'left'
        ? Math.max(MIN_W, Math.min(maxW, startW + dx))
        : Math.max(MIN_W, Math.min(maxW, startW - dx));
      root.style.setProperty(side === 'left' ? '--left-w' : '--right-w', newW + 'px');
    }
    function end(){
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove('is-resizing');
      el.classList.remove('active');
      saveWidths();
      scene.onResize();
    }

    el.addEventListener('mousedown', e => { e.preventDefault(); start(e.clientX); });
    window.addEventListener('mousemove', e => move(e.clientX));
    window.addEventListener('mouseup', end);

    // 더블클릭으로 기본 너비 복원
    el.addEventListener('dblclick', () => {
      root.style.setProperty(side === 'left' ? '--left-w' : '--right-w', side === 'left' ? '320px' : '360px');
      saveWidths();
      scene.onResize();
    });

    // 터치 (태블릿용 — 모바일에선 어차피 숨김)
    el.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      start(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchmove', e => {
      if (!dragging || e.touches.length !== 1) return;
      e.preventDefault();
      move(e.touches[0].clientX);
    }, { passive: false });
    window.addEventListener('touchend', end, { passive: true });
  }

  bindHandle(document.getElementById('resizeLeft'),  'left');
  bindHandle(document.getElementById('resizeRight'), 'right');
}

export function installRightTabs(){
  const tabs = document.querySelectorAll('#rpTabs .rp-tab');
  const panes = document.querySelectorAll('.rp-pane');
  if (!tabs.length || !panes.length) return;

  function activate(name){
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    panes.forEach(p => p.classList.toggle('active', p.dataset.pane === name));
  }
  tabs.forEach(t => t.addEventListener('click', () => activate(t.dataset.tab)));

  // 종목 클릭 시 자동으로 종목상세 탭 열기
  (window as any).openDetailTab = () => activate('detail');
}

export function installTheme(){
  const btn = document.getElementById('themeToggle');
  const STORAGE = 'sphere_theme_v1';
  const root = document.documentElement;

  function apply(theme){
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    if (btn) btn.textContent = theme === 'light' ? '☀' : '🌙';
    try { localStorage.setItem(STORAGE, theme); } catch(e){}
    // 캔버스 배경색을 테마에 맞춰 갱신
    scene.applyThemeBg();
  }

  // 초기 — localStorage > prefers-color-scheme
  let saved = null;
  try { saved = localStorage.getItem(STORAGE); } catch(e){}
  const sysLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  apply(saved || (sysLight ? 'light' : 'dark'));

  if (btn){
    btn.addEventListener('click', () => {
      const cur = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      apply(cur === 'light' ? 'dark' : 'light');
    });
  }
}
