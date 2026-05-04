// @ts-nocheck
/* =========================================================
   SPHERE — 모바일 섹션 시스템
   바텀 네비가 활성 섹션 토글 (search / holdings / metrics / insights)
   ========================================================= */

export const M_SECTIONS = ['search', 'holdings', 'metrics', 'insights'] as const;
export type MobileSection = typeof M_SECTIONS[number];

export function setMobileSection(name: MobileSection): void {
  if (!M_SECTIONS.includes(name)) return;
  M_SECTIONS.forEach(s => document.body.classList.remove('m-section-' + s));
  document.body.classList.add('m-section-' + name);
  document.querySelectorAll('#bottomNav .bottom-nav-item').forEach(b => {
    (b as HTMLElement).classList.toggle('active', (b as HTMLElement).dataset.section === name);
  });
  // 스크롤 맨 위로 (sphere 보이게)
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** DOM 준비 후 부트스트랩에서 호출 — 바텀 네비 이벤트 위임 + 초기 섹션 + 리사이즈 핸들러 */
export function installMobileNav(): void {
  // window 노출 (selectAsset 등에서 typeof 체크 호환)
  (window as any).setMobileSection = setMobileSection;

  const nav = document.getElementById('bottomNav');
  if (!nav) return;

  nav.addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest('.bottom-nav-item') as HTMLElement | null;
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const sec = btn.dataset.section as MobileSection | undefined;
    if (sec) setMobileSection(sec);
  });

  // 초기 섹션 — metrics
  if (window.innerWidth <= 768){
    setMobileSection('metrics');
  }

  // 화면 리사이즈 — 데스크탑으로 넘어가면 모든 m-section 클래스 제거
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768){
      M_SECTIONS.forEach(s => document.body.classList.remove('m-section-' + s));
    } else if (!M_SECTIONS.some(s => document.body.classList.contains('m-section-' + s))){
      setMobileSection('metrics');
    }
  });
}
