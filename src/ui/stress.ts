// @ts-nocheck
/* =========================================================
   SPHERE — 스트레스 테스트 패널
   - 사전 시나리오 4개 + 커스텀 (매크로 인자 합성)
   - 시나리오 선택 → scene 색상 갱신
   ========================================================= */

import { CURRENT_LANG, t, formatKRWUnit } from '../i18n.js';
import {
  STRESS_SCENARIOS, MACRO_FACTORS, MACRO_AXES,
  SELECTED_MACROS, toggleMacro, rebuildCustomScenario, computeStressTest
} from '../advanced/metrics.js';
import { RUNTIME } from '../runtime.js';
import * as scene from '../scene/sphere.js';

export function renderStress(){
  const cont = document.getElementById('stressScenarios');
  const result = document.getElementById('stressResult');
  if (!cont || !result) return;

  const labelKey = CURRENT_LANG === 'en' ? 'label_en' : 'label_ko';
  const descKey  = CURRENT_LANG === 'en' ? 'desc_en'  : 'desc_ko';
  const yearMap  = { gfc2008:'2008', covid2020:'2020', inflation2022:'2022', dotcom2000:'2000' };

  // 사전 시나리오 4개 + 커스텀 1개
  const presetButtons = Object.entries(STRESS_SCENARIOS).map(([k, scn]) => `
    <button class="stress-btn ${RUNTIME.CURRENT_STRESS===k?'active':''}" data-key="${k}">
      <div class="stress-btn-year">${yearMap[k] || ''}</div>
      <div>${scn[labelKey].replace(/^\d{4}\s*/, '')}</div>
    </button>
  `).join('');
  const customLabel = CURRENT_LANG==='en' ? 'Custom Scenario' : '커스텀 시나리오';
  const customCount = SELECTED_MACROS.size;
  const customBtn = `
    <button class="stress-btn ${RUNTIME.CURRENT_STRESS==='custom'?'active':''}" data-key="custom" style="grid-column: 1 / -1;">
      <div class="stress-btn-year">${CURRENT_LANG==='en'?'BUILD':'직접 조합'} ${customCount>0?`· ${customCount}`:''}</div>
      <div>${customLabel}</div>
    </button>
  `;
  cont.innerHTML = presetButtons + customBtn;

  cont.querySelectorAll('.stress-btn').forEach(b => {
    b.addEventListener('click', () => {
      const key = b.dataset.key;
      RUNTIME.CURRENT_STRESS = (RUNTIME.CURRENT_STRESS === key) ? null : key;
      if (RUNTIME.CURRENT_STRESS === 'custom') rebuildCustomScenario();
      renderStress();
      scene.applyStressVisuals(RUNTIME.CURRENT_STRESS);
    });
  });

  // 커스텀 시나리오 모드 — 매크로 인자 (축 단위 그룹)
  let macroPicker = '';
  if (RUNTIME.CURRENT_STRESS === 'custom'){
    const isEN = CURRENT_LANG === 'en';
    const axesHtml = MACRO_AXES.map(axis => {
      const opts = axis.options.map(key => {
        const f = MACRO_FACTORS[key];
        if (!f) return '';
        const lbl = isEN ? f.label_en : f.label_ko;
        const isOn = SELECTED_MACROS.has(key);
        return `
          <button class="macro-opt ${isOn?'on':''}" data-macro="${key}" type="button" title="${isEN?f.desc_en:f.desc_ko}">
            <span class="macro-opt-mark">${isOn?'●':'○'}</span>${lbl}
          </button>
        `;
      }).join('');
      const axisLbl = isEN ? axis.label_en : axis.label_ko;
      const activeKey = axis.options.find(k => SELECTED_MACROS.has(k));
      const activeDesc = activeKey ? (isEN ? MACRO_FACTORS[activeKey].desc_en : MACRO_FACTORS[activeKey].desc_ko) : '';
      return `
        <div class="macro-axis ${activeKey?'has-active':''}">
          <div class="macro-axis-label">${axisLbl}</div>
          <div class="macro-axis-opts">${opts}</div>
          ${activeDesc ? `<div class="macro-axis-desc">${activeDesc}</div>` : ''}
        </div>
      `;
    }).join('');
    const titleText = isEN
      ? `Pick macro views — combine multiple axes`
      : `매크로 시나리오 — 축별로 한 가지씩 선택`;
    const helpText = isEN
      ? `Each row is mutually exclusive. Skip a row to leave it neutral.`
      : `같은 축의 옵션끼리는 양립 불가. 비워두면 그 축은 "중립".`;
    const resetBtn = SELECTED_MACROS.size > 0 ? `<button class="macro-reset" type="button">${isEN?'Clear':'전체 해제'}</button>` : '';
    macroPicker = `
      <div class="macro-picker">
        <div class="macro-picker-head">
          <div>
            <div class="macro-picker-title">${titleText}</div>
            <div class="macro-picker-help">${helpText}</div>
          </div>
          ${resetBtn}
        </div>
        <div class="macro-axes">${axesHtml}</div>
      </div>
    `;
  }

  if (!RUNTIME.CURRENT_STRESS || !RUNTIME.ITEMS.length){
    result.innerHTML = (macroPicker || '') + `<div class="stress-empty">${RUNTIME.ITEMS.length ? t('stressTestEmpty') : (CURRENT_LANG==='en'?'Add holdings to run scenarios':'종목을 추가하면 시나리오를 실행할 수 있습니다')}</div>`;
    bindMacroChips();
    return;
  }
  if (RUNTIME.CURRENT_STRESS === 'custom' && SELECTED_MACROS.size === 0){
    result.innerHTML = macroPicker + `<div class="stress-empty">${CURRENT_LANG==='en'?'Select one or more macro factors above':'위에서 매크로 인자를 1개 이상 선택하세요'}</div>`;
    bindMacroChips();
    return;
  }
  const r = computeStressTest(RUNTIME.ITEMS, RUNTIME.CURRENT_STRESS);
  if (!r){ result.innerHTML = macroPicker || ''; bindMacroChips(); return; }

  const isGain = r.portLoss >= 0;
  const sign = isGain ? '+' : '-';
  const lossAbs = Math.round(Math.abs(r.portLoss));
  const krSuffix = CURRENT_LANG === 'ko' && lossAbs >= 10000 ? `<div class="stress-headline-pct">${formatKRWUnit(lossAbs)}</div>` : '';

  // 종목별 손익 — 손실 큰 순으로 정렬
  const rows = [...r.breakdown].sort((a,b)=>a.loss-b.loss).slice(0,10);

  result.innerHTML = (macroPicker || '') + `
    <div class="stress-headline">
      <div class="stress-headline-loss ${isGain?'gain':''}">${sign}${lossAbs.toLocaleString()}</div>
      <div class="stress-headline-pct">${(r.portLossPct * 100).toFixed(1)}%</div>
      ${krSuffix}
      <div class="stress-period">📅 ${r.scenario.period} · ${r.scenario.benchmark}</div>
      <div class="stress-headline-desc">${r.scenario[descKey]}</div>
      <div class="stress-source">${CURRENT_LANG==='en'?'Source':'출처'}: ${r.scenario.source}</div>
    </div>
    <div class="stress-rows">
      ${rows.map(b => {
        const up = b.shock > 0;
        const betaTag = b.beta ? `<span class="stress-row-beta" title="베타 ${b.beta.toFixed(2)}">β${b.beta.toFixed(1)}</span>` : '';
        return `
          <div class="stress-row">
            <span class="stress-row-name" title="${b.name} · 섹터 ${(b.sectorShock*100).toFixed(0)}% × β${b.beta?b.beta.toFixed(2):'1.0'}">${b.name} ${betaTag}</span>
            <span class="stress-row-shock ${up?'up':'down'}">${(b.shock*100).toFixed(0)}%</span>
            <span class="stress-row-loss ${up?'up':'down'}">${b.loss>=0?'+':'-'}${Math.round(Math.abs(b.loss)).toLocaleString()}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
  bindMacroChips();
}

function bindMacroChips(){
  document.querySelectorAll('.macro-opt').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      toggleMacro((btn as HTMLElement).dataset.macro);
      rebuildCustomScenario();
      renderStress();
      scene.applyStressVisuals(RUNTIME.CURRENT_STRESS);
    });
  });
  const reset = document.querySelector('.macro-reset');
  if (reset){
    reset.addEventListener('click', e => {
      e.preventDefault();
      SELECTED_MACROS.clear();
      rebuildCustomScenario();
      renderStress();
      scene.applyStressVisuals(RUNTIME.CURRENT_STRESS);
    });
  }
}
