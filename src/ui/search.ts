// @ts-nocheck
/* =========================================================
   SPHERE — 종목 검색 + 해시태그 칩
   - HASHTAG_MATCHERS: 130+ 키워드 → 자산 매칭 함수
   - searchAssets / renderSearchResults : 자동완성
   - renderTagChips / shuffleHashtags    : 인기 태그 + 더보기
   ========================================================= */

import { CURRENT_LANG, t, getName, sectorLabel, formatKRWUnit } from '../i18n.js';
import { riskColor, riskLabel } from '../core/pipeline.js';
import { ASSET_DB } from '../data/assetDb.js';
import { addHolding } from './holdings.js';
import { activePortfolio } from '../state/portfolio.js';

let searchInput: HTMLInputElement;
let searchResults: HTMLElement;

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

/** 부트스트랩에서 호출 — DOM 참조 + 이벤트 위임 + 첫 칩 렌더 */
export function installSearch(){
  searchInput = document.getElementById('searchInput') as HTMLInputElement;
  searchResults = document.getElementById('searchResults');
  if (!searchInput || !searchResults) return;

  searchInput.addEventListener('input', e => renderSearchResults((e.target as HTMLInputElement).value));
  searchInput.addEventListener('focus', e => { if ((e.target as HTMLInputElement).value) renderSearchResults((e.target as HTMLInputElement).value); });
  document.addEventListener('click', e => {
    if (!(e.target as HTMLElement).closest('.search-wrap')) searchResults.classList.remove('show');
  });

  // 초기 인기 태그
  renderTagChips(POPULAR_HASHTAGS);
}

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
