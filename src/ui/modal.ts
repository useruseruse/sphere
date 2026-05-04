// @ts-nocheck
/* =========================================================
   SPHERE — 모달 다이얼로그
   - openModal/closeModal       : input prompt 모달
   - customAlert/customConfirm  : alert/confirm 대체
   - openAbout/closeAbout       : 면책고지
   ========================================================= */

import { t } from '../i18n.js';

let modal, modalTitle, modalDesc, modalInput;
let aboutModal;
let modalOnOK = null;
let _showTour = () => {};

export function openModal(opts){
  modalTitle.textContent = opts.title || '';
  modalDesc.textContent = opts.desc || '';
  modalDesc.style.whiteSpace = 'pre-line';
  modalInput.placeholder = opts.placeholder || '';
  modalInput.value = opts.initial || '';
  modalInput.type = opts.type || 'text';
  modalInput.min = opts.type === 'number' ? '1' : '';
  modalOnOK = opts.onOK;
  modal.classList.add('show');
  setTimeout(() => { modalInput.focus(); modalInput.select(); }, 50);
}

export function closeModal(){
  modal.classList.remove('show');
  modalOnOK = null;
}

// 커스텀 알림/확인 다이얼로그 (네이티브 alert/confirm 대체)
export function customDialog({ message, title, isConfirm = false }){
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

export function customAlert(message, title){
  return customDialog({ message, title, isConfirm: false });
}

export function customConfirm(message, title){
  return customDialog({ message, title, isConfirm: true });
}

export function openAbout(){ aboutModal.classList.add('show'); }
export function closeAbout(){ aboutModal.classList.remove('show'); }

/**
 * DOM 이 준비된 시점에 부트스트랩에서 호출.
 * @param {{ showTour?: () => void }} [opts]
 */
export function installModal(opts = {}){
  modal = document.getElementById('modal');
  modalTitle = document.getElementById('modalTitle');
  modalDesc = document.getElementById('modalDesc');
  modalInput = document.getElementById('modalInput');
  aboutModal = document.getElementById('aboutModal');
  if (opts.showTour) _showTour = opts.showTour;

  document.getElementById('modalCancel')?.addEventListener('click', closeModal);
  document.getElementById('modalOK')?.addEventListener('click', () => {
    const v = modalInput.value.trim();
    if (modalOnOK) modalOnOK(v);
    closeModal();
  });
  modalInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter'){ document.getElementById('modalOK').click(); }
    else if (e.key === 'Escape'){ closeModal(); }
  });
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // 면책고지 모달
  document.getElementById('aboutIcon')?.addEventListener('click', openAbout);
  document.getElementById('aboutClose')?.addEventListener('click', closeAbout);
  document.getElementById('aboutReplayTour')?.addEventListener('click', () => {
    closeAbout();
    setTimeout(_showTour, 250);
  });
  aboutModal?.addEventListener('click', e => { if (e.target === aboutModal) closeAbout(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && aboutModal?.classList.contains('show')) closeAbout();
  });

  document.getElementById('legalBannerView')?.addEventListener('click', openAbout);
}
