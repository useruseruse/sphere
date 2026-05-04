// @ts-nocheck
/* =========================================================
   SPHERE Simple — 헤더 (언어 토글 등)
   ========================================================= */

import { setLang } from '../i18n.js';

export function installSimpleHeader(opts: { onLangChange: () => void }){
  document.querySelectorAll('#langSwitch button').forEach(b => {
    b.addEventListener('click', () => {
      setLang((b as HTMLElement).dataset.lang as 'ko' | 'en');
      opts.onLangChange();
    });
  });
}
