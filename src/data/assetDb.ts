/* =========================================================
   SPHERE — Asset master DB
   211개 핵심 종목/ETF 정적 스냅샷.
   추가 700+ 종목은 src/data/catalog.ts 의 비동기 로더가 채움.
   ========================================================= */

import type { Asset, Holding } from '../types.js';

export const ASSET_DB: Asset[] = [
  // === 한국 IT ===
  { ticker:'005930.KS', name:'삼성전자',         name_en:'Samsung Electronics',   sector:'IT',         current_price:71200,  market_cap:425e12, volatility_30d:0.24, beta:1.05, debt_ratio:0.32, liquidity_volume:18500000, is_etf:false, alias:'samsung electronics' },
  { ticker:'000660.KS', name:'SK하이닉스',       name_en:'SK Hynix',              sector:'IT',         current_price:182000, market_cap:132e12, volatility_30d:0.36, beta:1.32, debt_ratio:0.45, liquidity_volume:5400000,  is_etf:false, alias:'sk hynix' },
  { ticker:'035420.KS', name:'NAVER',            name_en:'NAVER',                 sector:'IT',         current_price:212000, market_cap:34e12,  volatility_30d:0.30, beta:1.20, debt_ratio:0.22, liquidity_volume:680000,   is_etf:false, alias:'naver' },
  { ticker:'035720.KS', name:'카카오',           name_en:'Kakao',                 sector:'IT',         current_price:48500,  market_cap:21e12,  volatility_30d:0.34, beta:1.28, debt_ratio:0.41, liquidity_volume:2100000,  is_etf:false, alias:'kakao' },
  { ticker:'377300.KS', name:'카카오페이',       name_en:'KakaoPay',              sector:'IT',         current_price:32000,  market_cap:4.2e12, volatility_30d:0.45, beta:1.45, debt_ratio:0.18, liquidity_volume:920000,   is_etf:false, alias:'kakaopay' },
  { ticker:'251270.KS', name:'넷마블',           name_en:'Netmarble',             sector:'IT',         current_price:55800,  market_cap:4.8e12, volatility_30d:0.38, beta:1.22, debt_ratio:0.35, liquidity_volume:340000,   is_etf:false, alias:'netmarble' },
  // === 한국 BIO ===
  { ticker:'207940.KS', name:'삼성바이오로직스', name_en:'Samsung Biologics',     sector:'BIO',        current_price:835000, market_cap:59e12,  volatility_30d:0.28, beta:0.92, debt_ratio:0.20, liquidity_volume:140000,   is_etf:false, alias:'samsung biologics' },
  { ticker:'068270.KS', name:'셀트리온',         name_en:'Celltrion',             sector:'BIO',        current_price:185000, market_cap:38e12,  volatility_30d:0.42, beta:1.18, debt_ratio:0.28, liquidity_volume:1200000,  is_etf:false, alias:'celltrion' },
  { ticker:'196170.KS', name:'알테오젠',         name_en:'Alteogen',              sector:'BIO',        current_price:312000, market_cap:16e12,  volatility_30d:0.55, beta:1.55, debt_ratio:0.15, liquidity_volume:580000,   is_etf:false, alias:'alteogen' },
  { ticker:'128940.KS', name:'한미약품',         name_en:'Hanmi Pharmaceutical',  sector:'BIO',        current_price:328000, market_cap:4.1e12, volatility_30d:0.38, beta:1.05, debt_ratio:0.42, liquidity_volume:78000,    is_etf:false, alias:'hanmi pharm' },
  // === 한국 FIN ===
  { ticker:'105560.KS', name:'KB금융',           name_en:'KB Financial',          sector:'FIN',        current_price:78400,  market_cap:31e12,  volatility_30d:0.18, beta:0.85, debt_ratio:0.78, liquidity_volume:1800000,  is_etf:false, alias:'kb financial' },
  { ticker:'055550.KS', name:'신한지주',         name_en:'Shinhan Financial',     sector:'FIN',        current_price:52800,  market_cap:27e12,  volatility_30d:0.17, beta:0.82, debt_ratio:0.81, liquidity_volume:1900000,  is_etf:false, alias:'shinhan' },
  { ticker:'086790.KS', name:'하나금융지주',     name_en:'Hana Financial',        sector:'FIN',        current_price:62100,  market_cap:18e12,  volatility_30d:0.19, beta:0.88, debt_ratio:0.82, liquidity_volume:1100000,  is_etf:false, alias:'hana financial' },
  { ticker:'316140.KS', name:'우리금융지주',     name_en:'Woori Financial',       sector:'FIN',        current_price:14850,  market_cap:11e12,  volatility_30d:0.18, beta:0.84, debt_ratio:0.83, liquidity_volume:3200000,  is_etf:false, alias:'woori' },
  { ticker:'138930.KS', name:'BNK금융지주',      name_en:'BNK Financial',         sector:'FIN',        current_price:8420,   market_cap:2.7e12, volatility_30d:0.21, beta:0.92, debt_ratio:0.84, liquidity_volume:1400000,  is_etf:false, alias:'bnk' },
  // === 한국 AUTO ===
  { ticker:'005380.KS', name:'현대차',           name_en:'Hyundai Motor',         sector:'AUTO',       current_price:248000, market_cap:52e12,  volatility_30d:0.26, beta:1.08, debt_ratio:0.62, liquidity_volume:850000,   is_etf:false, alias:'hyundai motor' },
  { ticker:'000270.KS', name:'기아',             name_en:'Kia',                   sector:'AUTO',       current_price:108000, market_cap:43e12,  volatility_30d:0.27, beta:1.10, debt_ratio:0.55, liquidity_volume:1600000,  is_etf:false, alias:'kia' },
  { ticker:'012330.KS', name:'현대모비스',       name_en:'Hyundai Mobis',         sector:'AUTO',       current_price:235000, market_cap:22e12,  volatility_30d:0.24, beta:1.02, debt_ratio:0.45, liquidity_volume:280000,   is_etf:false, alias:'mobis' },
  // === 한국 INDUSTRIAL ===
  { ticker:'006400.KS', name:'삼성SDI',          name_en:'Samsung SDI',           sector:'INDUSTRIAL', current_price:325000, market_cap:22e12,  volatility_30d:0.36, beta:1.40, debt_ratio:0.48, liquidity_volume:380000,   is_etf:false, alias:'samsung sdi' },
  { ticker:'051910.KS', name:'LG화학',           name_en:'LG Chem',               sector:'INDUSTRIAL', current_price:368000, market_cap:26e12,  volatility_30d:0.38, beta:1.42, debt_ratio:0.51, liquidity_volume:340000,   is_etf:false, alias:'lg chem' },
  { ticker:'373220.KS', name:'LG에너지솔루션',   name_en:'LG Energy Solution',    sector:'INDUSTRIAL', current_price:392000, market_cap:92e12,  volatility_30d:0.40, beta:1.48, debt_ratio:0.52, liquidity_volume:520000,   is_etf:false, alias:'lg energy solution' },
  { ticker:'010130.KS', name:'고려아연',         name_en:'Korea Zinc',            sector:'INDUSTRIAL', current_price:858000, market_cap:18e12,  volatility_30d:0.34, beta:1.18, debt_ratio:0.32, liquidity_volume:48000,    is_etf:false, alias:'korea zinc' },
  { ticker:'009540.KS', name:'HD한국조선해양',   name_en:'HD Hyundai Shipbuilding',sector:'INDUSTRIAL', current_price:188000, market_cap:13e12,  volatility_30d:0.42, beta:1.55, debt_ratio:0.65, liquidity_volume:380000,   is_etf:false, alias:'hd shipbuilding' },
  // === 한국 ENERGY ===
  { ticker:'015760.KS', name:'한국전력',         name_en:'KEPCO',                 sector:'ENERGY',     current_price:23800,  market_cap:15e12,  volatility_30d:0.22, beta:0.62, debt_ratio:0.88, liquidity_volume:6800000,  is_etf:false, alias:'kepco' },
  { ticker:'034730.KS', name:'SK',               name_en:'SK Holdings',           sector:'ENERGY',     current_price:142000, market_cap:11e12,  volatility_30d:0.28, beta:0.95, debt_ratio:0.55, liquidity_volume:120000,   is_etf:false, alias:'sk holdings' },
  { ticker:'096770.KS', name:'SK이노베이션',     name_en:'SK Innovation',         sector:'ENERGY',     current_price:118000, market_cap:11e12,  volatility_30d:0.34, beta:1.25, debt_ratio:0.62, liquidity_volume:480000,   is_etf:false, alias:'sk innovation' },
  // === 한국 CONSUMER ===
  { ticker:'097950.KS', name:'CJ제일제당',       name_en:'CJ CheilJedang',        sector:'CONSUMER',   current_price:295000, market_cap:4.4e12, volatility_30d:0.16, beta:0.72, debt_ratio:0.58, liquidity_volume:62000,    is_etf:false, alias:'cj cheiljedang' },
  { ticker:'271560.KS', name:'오리온',           name_en:'Orion',                 sector:'CONSUMER',   current_price:128000, market_cap:5.1e12, volatility_30d:0.18, beta:0.65, debt_ratio:0.32, liquidity_volume:140000,   is_etf:false, alias:'orion' },
  { ticker:'139480.KS', name:'이마트',           name_en:'E-Mart',                sector:'CONSUMER',   current_price:62800,  market_cap:1.7e12, volatility_30d:0.22, beta:0.78, debt_ratio:0.62, liquidity_volume:280000,   is_etf:false, alias:'emart' },
  { ticker:'282330.KS', name:'BGF리테일',        name_en:'BGF Retail',            sector:'CONSUMER',   current_price:118000, market_cap:2.0e12, volatility_30d:0.20, beta:0.68, debt_ratio:0.45, liquidity_volume:78000,    is_etf:false, alias:'bgf retail cu' },
  // === 한국 INDUSTRIAL/etc ===
  { ticker:'028260.KS', name:'삼성물산',         name_en:'Samsung C&T',           sector:'INDUSTRIAL', current_price:158000, market_cap:30e12,  volatility_30d:0.20, beta:0.95, debt_ratio:0.42, liquidity_volume:380000,   is_etf:false, alias:'samsung c&t' },
  { ticker:'003550.KS', name:'LG',               name_en:'LG Holdings',           sector:'IT',         current_price:81200,  market_cap:13e12,  volatility_30d:0.22, beta:1.05, debt_ratio:0.38, liquidity_volume:340000,   is_etf:false, alias:'lg holdings' },

  // === 한국 통신 (Telecom) ===
  { ticker:'030200.KS', name:'KT',               name_en:'KT Corporation',        sector:'IT',         current_price:42850,  market_cap:11e12,  volatility_30d:0.16, beta:0.55, debt_ratio:0.62, liquidity_volume:680000,   is_etf:false, alias:'kt 케이티 통신' },
  { ticker:'017670.KS', name:'SK텔레콤',         name_en:'SK Telecom',            sector:'IT',         current_price:55400,  market_cap:12e12,  volatility_30d:0.14, beta:0.48, debt_ratio:0.65, liquidity_volume:520000,   is_etf:false, alias:'sk telecom skt 통신' },
  { ticker:'032640.KS', name:'LG유플러스',       name_en:'LG U+',                 sector:'IT',         current_price:9820,   market_cap:4.3e12, volatility_30d:0.16, beta:0.58, debt_ratio:0.68, liquidity_volume:1100000,  is_etf:false, alias:'lg uplus lgu 통신' },
  // === 한국 게임 (Game) ===
  { ticker:'036570.KS', name:'엔씨소프트',       name_en:'NCsoft',                sector:'IT',         current_price:215000, market_cap:4.7e12, volatility_30d:0.34, beta:1.15, debt_ratio:0.18, liquidity_volume:120000,   is_etf:false, alias:'ncsoft 엔씨' },
  { ticker:'259960.KS', name:'크래프톤',         name_en:'Krafton',               sector:'IT',         current_price:298000, market_cap:14.5e12,volatility_30d:0.40, beta:1.32, debt_ratio:0.12, liquidity_volume:280000,   is_etf:false, alias:'krafton 배그 pubg' },
  { ticker:'112040.KS', name:'위메이드',         name_en:'Wemade',                sector:'IT',         current_price:38500,  market_cap:1.3e12, volatility_30d:0.55, beta:1.55, debt_ratio:0.35, liquidity_volume:480000,   is_etf:false, alias:'wemade 위메이드' },
  // === 한국 철강 (Steel) ===
  { ticker:'005490.KS', name:'POSCO홀딩스',      name_en:'POSCO Holdings',        sector:'INDUSTRIAL', current_price:298000, market_cap:25e12,  volatility_30d:0.32, beta:1.28, debt_ratio:0.42, liquidity_volume:280000,   is_etf:false, alias:'posco 포스코 철강' },
  { ticker:'003670.KS', name:'포스코퓨처엠',     name_en:'POSCO Future M',        sector:'INDUSTRIAL', current_price:185000, market_cap:14e12,  volatility_30d:0.46, beta:1.62, debt_ratio:0.55, liquidity_volume:380000,   is_etf:false, alias:'posco future m 양극재' },
  // === 한국 2차전지 ===
  { ticker:'086520.KS', name:'에코프로',         name_en:'EcoPro',                sector:'INDUSTRIAL', current_price:62800,  market_cap:8.4e12, volatility_30d:0.62, beta:1.85, debt_ratio:0.42, liquidity_volume:1200000,  is_etf:false, alias:'ecopro 에코프로 2차전지' },
  { ticker:'247540.KS', name:'에코프로비엠',     name_en:'EcoPro BM',             sector:'INDUSTRIAL', current_price:158000, market_cap:15.5e12,volatility_30d:0.58, beta:1.78, debt_ratio:0.48, liquidity_volume:680000,   is_etf:false, alias:'ecopro bm 양극재' },
  // === 한국 해운/항공 ===
  { ticker:'011200.KS', name:'HMM',              name_en:'HMM',                   sector:'INDUSTRIAL', current_price:18800,  market_cap:11e12,  volatility_30d:0.42, beta:1.22, debt_ratio:0.38, liquidity_volume:3800000,  is_etf:false, alias:'hmm 현대상선 해운' },
  { ticker:'003490.KS', name:'대한항공',         name_en:'Korean Air',            sector:'INDUSTRIAL', current_price:23150,  market_cap:8.5e12, volatility_30d:0.36, beta:1.18, debt_ratio:0.72, liquidity_volume:680000,   is_etf:false, alias:'korean air 대한항공' },
  // === 한국 기타 대형주 ===
  { ticker:'010140.KS', name:'삼성중공업',       name_en:'Samsung Heavy',         sector:'INDUSTRIAL', current_price:9820,   market_cap:8.5e12, volatility_30d:0.42, beta:1.55, debt_ratio:0.78, liquidity_volume:5200000,  is_etf:false, alias:'samsung heavy 조선' },
  { ticker:'161390.KS', name:'한국타이어앤테크놀로지', name_en:'Hankook Tire',     sector:'AUTO',       current_price:48800,  market_cap:6.0e12, volatility_30d:0.28, beta:1.12, debt_ratio:0.42, liquidity_volume:380000,   is_etf:false, alias:'hankook tire 타이어' },
  { ticker:'035250.KS', name:'강원랜드',         name_en:'Kangwon Land',          sector:'CONSUMER',   current_price:14850,  market_cap:3.2e12, volatility_30d:0.24, beta:0.88, debt_ratio:0.32, liquidity_volume:480000,   is_etf:false, alias:'kangwon land 강원랜드 카지노' },

  // === 한국 방산/우주항공 ===
  { ticker:'047810.KS', name:'한국항공우주',     name_en:'Korea Aerospace Industries (KAI)', sector:'INDUSTRIAL', current_price:58200,  market_cap:5.7e12, volatility_30d:0.32, beta:1.18, debt_ratio:0.55, liquidity_volume:680000, is_etf:false, alias:'kai aerospace 방산 우주 항공우주' },
  { ticker:'012450.KS', name:'한화에어로스페이스', name_en:'Hanwha Aerospace',              sector:'INDUSTRIAL', current_price:218000, market_cap:11e12,  volatility_30d:0.36, beta:1.22, debt_ratio:0.58, liquidity_volume:340000, is_etf:false, alias:'hanwha aerospace 한화 방산 우주' },
  { ticker:'064350.KS', name:'현대로템',         name_en:'Hyundai Rotem',                 sector:'INDUSTRIAL', current_price:48900,  market_cap:4.1e12, volatility_30d:0.34, beta:1.15, debt_ratio:0.62, liquidity_volume:520000, is_etf:false, alias:'hyundai rotem 현대로템 방산 전차' },
  { ticker:'079550.KS', name:'LIG넥스원',        name_en:'LIG Nex1',                      sector:'INDUSTRIAL', current_price:178500, market_cap:3.9e12, volatility_30d:0.30, beta:1.08, debt_ratio:0.42, liquidity_volume:180000, is_etf:false, alias:'lig nex1 방산 미사일' },
  { ticker:'042660.KS', name:'한화오션',         name_en:'Hanwha Ocean',                  sector:'INDUSTRIAL', current_price:32400,  market_cap:9.5e12, volatility_30d:0.42, beta:1.45, debt_ratio:0.72, liquidity_volume:1800000, is_etf:false, alias:'hanwha ocean 방산 잠수함 조선 dsme' },

  // === 한국 화장품/뷰티 ===
  { ticker:'090430.KS', name:'아모레퍼시픽',     name_en:'AmorePacific',                  sector:'CONSUMER',   current_price:148000, market_cap:8.6e12, volatility_30d:0.28, beta:0.92, debt_ratio:0.32, liquidity_volume:280000, is_etf:false, alias:'amorepacific 아모레 화장품 뷰티 cosmetics' },
  { ticker:'161890.KS', name:'한국콜마',         name_en:'Kolmar Korea',                  sector:'CONSUMER',   current_price:62800,  market_cap:1.5e12, volatility_30d:0.32, beta:0.95, debt_ratio:0.45, liquidity_volume:180000, is_etf:false, alias:'kolmar 한국콜마 화장품 oem' },
  { ticker:'214450.KS', name:'파마리서치',       name_en:'Pharma Research',               sector:'BIO',        current_price:208000, market_cap:1.8e12, volatility_30d:0.36, beta:1.05, debt_ratio:0.18, liquidity_volume:78000,  is_etf:false, alias:'pharma research 파마리서치 화장품 의료' },

  // === 한국 의료기기/제약 ===
  { ticker:'145020.KS', name:'휴젤',             name_en:'Hugel',                          sector:'BIO',        current_price:295000, market_cap:3.6e12, volatility_30d:0.34, beta:1.05, debt_ratio:0.18, liquidity_volume:78000,  is_etf:false, alias:'hugel 휴젤 보톡스 의료기기' },
  { ticker:'085660.KS', name:'차바이오텍',       name_en:'CHA Biotech',                    sector:'BIO',        current_price:14200,  market_cap:0.85e12,volatility_30d:0.55, beta:1.45, debt_ratio:0.42, liquidity_volume:380000, is_etf:false, alias:'cha biotech 차바이오 줄기세포' },

  // === 미국 방산 ===
  { ticker:'LMT',  name:'Lockheed Martin',  sector:'INDUSTRIAL', current_price:482, market_cap:118e9, volatility_30d:0.20, beta:0.62, debt_ratio:0.55, liquidity_volume:1200000, is_etf:false, alias:'lockheed martin 방산 lmt defense' },
  { ticker:'RTX',  name:'RTX (Raytheon)',   sector:'INDUSTRIAL', current_price:118, market_cap:158e9, volatility_30d:0.22, beta:0.72, debt_ratio:0.48, liquidity_volume:6800000, is_etf:false, alias:'raytheon rtx 방산 defense' },
  { ticker:'NOC',  name:'Northrop Grumman', sector:'INDUSTRIAL', current_price:512, market_cap:75e9,  volatility_30d:0.20, beta:0.58, debt_ratio:0.52, liquidity_volume:680000,  is_etf:false, alias:'northrop grumman 방산 noc defense' },

  // === 미국 빅캡 추가 ===
  { ticker:'BRK.B',name:'Berkshire Hathaway',sector:'FIN',       current_price:432, market_cap:935e9, volatility_30d:0.14, beta:0.85, debt_ratio:0.32, liquidity_volume:3800000, is_etf:false, alias:'berkshire hathaway buffett brk' },
  { ticker:'COST', name:'Costco',           sector:'CONSUMER',   current_price:912, market_cap:404e9, volatility_30d:0.16, beta:0.78, debt_ratio:0.42, liquidity_volume:2100000, is_etf:false, alias:'costco 코스트코' },
  { ticker:'NKE',  name:'Nike',             sector:'CONSUMER',   current_price:78,  market_cap:118e9, volatility_30d:0.26, beta:1.08, debt_ratio:0.48, liquidity_volume:8200000, is_etf:false, alias:'nike 나이키' },

  // === 한국 추가 종목 (인프라·중공업·반도체장비) ===
  { ticker:'010950.KS', name:'S-Oil',          name_en:'S-Oil',                    sector:'ENERGY',     current_price:62800,  market_cap:7.1e12, volatility_30d:0.30, beta:1.18, debt_ratio:0.55, liquidity_volume:380000, is_etf:false, alias:'s oil sk-1 정유' },
  { ticker:'011170.KS', name:'롯데케미칼',     name_en:'Lotte Chemical',           sector:'INDUSTRIAL', current_price:88500,  market_cap:3.8e12, volatility_30d:0.34, beta:1.32, debt_ratio:0.62, liquidity_volume:280000, is_etf:false, alias:'lotte chemical 롯데케미칼 화학' },
  { ticker:'042700.KS', name:'한미반도체',     name_en:'Hanmi Semiconductor',      sector:'IT',         current_price:138000, market_cap:13e12,  volatility_30d:0.52, beta:1.78, debt_ratio:0.28, liquidity_volume:680000, is_etf:false, alias:'hanmi semi 한미반도체 hbm 반도체장비' },
  { ticker:'009150.KS', name:'삼성전기',       name_en:'Samsung Electro-Mechanics',sector:'IT',         current_price:148000, market_cap:11e12,  volatility_30d:0.28, beta:1.22, debt_ratio:0.42, liquidity_volume:480000, is_etf:false, alias:'samsung electro 전자부품 mlcc' },
  { ticker:'011070.KS', name:'LG이노텍',       name_en:'LG Innotek',                sector:'IT',         current_price:198000, market_cap:4.7e12, volatility_30d:0.34, beta:1.28, debt_ratio:0.45, liquidity_volume:240000, is_etf:false, alias:'lg innotek 카메라모듈 부품' },
  { ticker:'034020.KS', name:'두산에너빌리티', name_en:'Doosan Enerbility',         sector:'ENERGY',     current_price:24800,  market_cap:15.8e12,volatility_30d:0.42, beta:1.55, debt_ratio:0.65, liquidity_volume:5200000,is_etf:false, alias:'doosan enerbility 두산 원전 풍력' },
  { ticker:'021240.KS', name:'코웨이',         name_en:'Coway',                     sector:'CONSUMER',   current_price:62500,  market_cap:4.6e12, volatility_30d:0.20, beta:0.78, debt_ratio:0.42, liquidity_volume:180000, is_etf:false, alias:'coway 코웨이 정수기 렌탈' },
  { ticker:'029780.KS', name:'삼성카드',       name_en:'Samsung Card',              sector:'FIN',        current_price:42500,  market_cap:4.9e12, volatility_30d:0.18, beta:0.85, debt_ratio:0.82, liquidity_volume:120000, is_etf:false, alias:'samsung card 삼성카드 카드' },
  { ticker:'000720.KS', name:'현대건설',       name_en:'Hyundai E&C',               sector:'INDUSTRIAL', current_price:38200,  market_cap:4.3e12, volatility_30d:0.32, beta:1.18, debt_ratio:0.62, liquidity_volume:580000, is_etf:false, alias:'hyundai engineering 현대건설 건설' },
  { ticker:'051600.KS', name:'한전KPS',        name_en:'KEPCO KPS',                 sector:'ENERGY',     current_price:48500,  market_cap:2.2e12, volatility_30d:0.22, beta:0.72, debt_ratio:0.32, liquidity_volume:120000, is_etf:false, alias:'kepco kps 한전 원전 정비' },

  // === 미국 추가 종목 ===
  { ticker:'INTC', name:'Intel',                 sector:'IT',         current_price:24.5,  market_cap:106e9, volatility_30d:0.38, beta:1.15, debt_ratio:0.42, liquidity_volume:62000000, is_etf:false, alias:'intel 인텔 반도체' },
  { ticker:'IBM',  name:'IBM',                   sector:'IT',         current_price:218,   market_cap:202e9, volatility_30d:0.18, beta:0.82, debt_ratio:0.72, liquidity_volume:5800000,  is_etf:false, alias:'ibm 클라우드' },
  { ticker:'BA',   name:'Boeing',                sector:'INDUSTRIAL', current_price:178,   market_cap:108e9, volatility_30d:0.34, beta:1.42, debt_ratio:0.85, liquidity_volume:8200000,  is_etf:false, alias:'boeing 보잉 항공 방산' },
  { ticker:'CAT',  name:'Caterpillar',           sector:'INDUSTRIAL', current_price:392,   market_cap:194e9, volatility_30d:0.24, beta:1.05, debt_ratio:0.62, liquidity_volume:2800000,  is_etf:false, alias:'caterpillar 캐터필러 건설장비' },
  { ticker:'UNH',  name:'UnitedHealth',          sector:'BIO',        current_price:582,   market_cap:548e9, volatility_30d:0.18, beta:0.62, debt_ratio:0.48, liquidity_volume:3200000,  is_etf:false, alias:'unitedhealth unh 헬스케어 의료보험' },
  { ticker:'COIN', name:'Coinbase',              sector:'FIN',        current_price:218,   market_cap:55e9,  volatility_30d:0.78, beta:2.45, debt_ratio:0.32, liquidity_volume:8200000,  is_etf:false, alias:'coinbase 코인베이스 crypto 암호화폐' },
  { ticker:'PYPL', name:'PayPal',                sector:'FIN',        current_price:78,    market_cap:78e9,  volatility_30d:0.32, beta:1.42, debt_ratio:0.45, liquidity_volume:14000000, is_etf:false, alias:'paypal 페이팔 결제' },
  { ticker:'UBER', name:'Uber',                  sector:'IT',         current_price:74,    market_cap:154e9, volatility_30d:0.36, beta:1.32, debt_ratio:0.52, liquidity_volume:18000000, is_etf:false, alias:'uber 우버 모빌리티' },
  { ticker:'ABNB', name:'Airbnb',                sector:'CONSUMER',   current_price:142,   market_cap:88e9,  volatility_30d:0.32, beta:1.18, debt_ratio:0.28, liquidity_volume:5800000,  is_etf:false, alias:'airbnb 에어비앤비' },

  // === 미국 섹터 ETF 추가 ===
  { ticker:'XLP',  name:'Consumer Staples Select', sector:'CONSUMER',  current_price:82,   market_cap:18e9,  volatility_30d:0.12, beta:0.55, debt_ratio:0.00, liquidity_volume:7200000,  is_etf:true, alias:'xlp consumer staples 필수소비재' },
  { ticker:'XLY',  name:'Consumer Discretionary',  sector:'CONSUMER',  current_price:208,  market_cap:22e9,  volatility_30d:0.20, beta:1.18, debt_ratio:0.00, liquidity_volume:4200000,  is_etf:true, alias:'xly consumer discretionary 임의소비재' },
  { ticker:'XLU',  name:'Utilities Select',        sector:'ENERGY',    current_price:78,   market_cap:16e9,  volatility_30d:0.16, beta:0.55, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'xlu utilities 유틸리티' },
  { ticker:'XLI',  name:'Industrial Select',       sector:'INDUSTRIAL',current_price:138,  market_cap:18e9,  volatility_30d:0.18, beta:1.10, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'xli industrials 산업' },
  { ticker:'VNQ',  name:'Vanguard Real Estate',    sector:'REALESTATE',current_price:94,   market_cap:32e9,  volatility_30d:0.22, beta:0.85, debt_ratio:0.00, liquidity_volume:3800000,  is_etf:true, alias:'vnq real estate 부동산 reit' },
  { ticker:'EWJ',  name:'iShares MSCI Japan',      sector:'GLOBAL_ETF',current_price:74,   market_cap:14e9,  volatility_30d:0.16, beta:0.78, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'ewj japan 일본' },
  { ticker:'INDA', name:'iShares MSCI India',      sector:'GLOBAL_ETF',current_price:54,   market_cap:9e9,   volatility_30d:0.20, beta:0.92, debt_ratio:0.00, liquidity_volume:5800000,  is_etf:true, alias:'inda india 인도' },

  // === 한국 추가 — 금융·식품·엔터·바이오 ===
  { ticker:'032830.KS', name:'삼성생명',        name_en:'Samsung Life',         sector:'FIN',        current_price:118500, market_cap:23e12,  volatility_30d:0.20, beta:0.88, debt_ratio:0.78, liquidity_volume:280000, is_etf:false, alias:'samsung life 삼성생명 보험' },
  { ticker:'000810.KS', name:'삼성화재',        name_en:'Samsung Fire',         sector:'FIN',        current_price:332000, market_cap:16e12,  volatility_30d:0.18, beta:0.72, debt_ratio:0.65, liquidity_volume:38000,  is_etf:false, alias:'samsung fire 삼성화재 보험' },
  { ticker:'088350.KS', name:'한화생명',        name_en:'Hanwha Life',          sector:'FIN',        current_price:3420,   market_cap:2.9e12, volatility_30d:0.22, beta:0.95, debt_ratio:0.82, liquidity_volume:780000, is_etf:false, alias:'hanwha life 한화생명 보험' },
  { ticker:'138040.KS', name:'메리츠금융지주',  name_en:'Meritz Financial',     sector:'FIN',        current_price:78900,  market_cap:14e12,  volatility_30d:0.22, beta:0.92, debt_ratio:0.78, liquidity_volume:380000, is_etf:false, alias:'meritz 메리츠 금융' },
  { ticker:'323410.KS', name:'카카오뱅크',      name_en:'Kakao Bank',           sector:'FIN',        current_price:24800,  market_cap:11e12,  volatility_30d:0.30, beta:1.18, debt_ratio:0.85, liquidity_volume:2200000,is_etf:false, alias:'kakao bank 카카오뱅크 인터넷은행' },
  { ticker:'293490.KS', name:'카카오게임즈',    name_en:'Kakao Games',          sector:'IT',         current_price:18500,  market_cap:1.6e12, volatility_30d:0.42, beta:1.42, debt_ratio:0.32, liquidity_volume:680000, is_etf:false, alias:'kakao games 카카오게임즈 게임' },
  { ticker:'263750.KS', name:'펄어비스',        name_en:'Pearl Abyss',          sector:'IT',         current_price:38200,  market_cap:2.5e12, volatility_30d:0.45, beta:1.38, debt_ratio:0.18, liquidity_volume:480000, is_etf:false, alias:'pearl abyss 펄어비스 검은사막 게임' },
  { ticker:'352820.KS', name:'HYBE',            name_en:'HYBE',                  sector:'CONSUMER',   current_price:218000, market_cap:9.2e12, volatility_30d:0.36, beta:1.25, debt_ratio:0.32, liquidity_volume:240000, is_etf:false, alias:'hybe bts 하이브 엔터' },
  { ticker:'041510.KS', name:'SM',              name_en:'SM Entertainment',     sector:'CONSUMER',   current_price:78500,  market_cap:1.9e12, volatility_30d:0.40, beta:1.25, debt_ratio:0.35, liquidity_volume:280000, is_etf:false, alias:'sm entertainment 에스엠 sm 엔터' },
  { ticker:'035900.KS', name:'JYP',             name_en:'JYP Entertainment',    sector:'CONSUMER',   current_price:62800,  market_cap:2.2e12, volatility_30d:0.38, beta:1.22, debt_ratio:0.18, liquidity_volume:380000, is_etf:false, alias:'jyp entertainment jyp 엔터' },
  { ticker:'051900.KS', name:'LG생활건강',      name_en:'LG H&H',               sector:'CONSUMER',   current_price:325000, market_cap:5.1e12, volatility_30d:0.24, beta:0.78, debt_ratio:0.38, liquidity_volume:62000,  is_etf:false, alias:'lg h&h 생활건강 화장품' },
  { ticker:'003230.KS', name:'삼양식품',        name_en:'Samyang Foods',         sector:'CONSUMER',   current_price:625000, market_cap:4.7e12, volatility_30d:0.42, beta:0.95, debt_ratio:0.32, liquidity_volume:62000,  is_etf:false, alias:'samyang foods 삼양 불닭 식품' },
  { ticker:'004370.KS', name:'농심',            name_en:'Nongshim',             sector:'CONSUMER',   current_price:418000, market_cap:2.5e12, volatility_30d:0.20, beta:0.62, debt_ratio:0.25, liquidity_volume:14000,  is_etf:false, alias:'nongshim 농심 라면 식품' },
  { ticker:'008770.KS', name:'호텔신라',        name_en:'Hotel Shilla',         sector:'CONSUMER',   current_price:48500,  market_cap:1.9e12, volatility_30d:0.30, beta:1.12, debt_ratio:0.62, liquidity_volume:280000, is_etf:false, alias:'shilla hotel 호텔신라 면세' },
  { ticker:'302440.KS', name:'SK바이오사이언스',name_en:'SK Bioscience',        sector:'BIO',        current_price:62800,  market_cap:4.8e12, volatility_30d:0.42, beta:1.18, debt_ratio:0.18, liquidity_volume:380000, is_etf:false, alias:'sk bioscience 백신 바이오' },
  { ticker:'091990.KS', name:'셀트리온헬스케어',name_en:'Celltrion Healthcare', sector:'BIO',        current_price:78500,  market_cap:11e12,  volatility_30d:0.40, beta:1.18, debt_ratio:0.32, liquidity_volume:580000, is_etf:false, alias:'celltrion healthcare 셀트리온헬스' },
  { ticker:'006400.KS', name:'삼성SDI',         name_en:'Samsung SDI',          sector:'INDUSTRIAL', current_price:325000, market_cap:22e12,  volatility_30d:0.36, beta:1.40, debt_ratio:0.48, liquidity_volume:380000, is_etf:false, alias:'samsung sdi 삼성에스디아이 배터리' },
  { ticker:'018260.KS', name:'삼성에스디에스',  name_en:'Samsung SDS',          sector:'IT',         current_price:148000, market_cap:11e12,  volatility_30d:0.22, beta:0.88, debt_ratio:0.32, liquidity_volume:78000,  is_etf:false, alias:'samsung sds 삼성에스디에스 it서비스' },
  { ticker:'180640.KS', name:'한진칼',          name_en:'Hanjin KAL',           sector:'INDUSTRIAL', current_price:65800,  market_cap:4.4e12, volatility_30d:0.34, beta:1.22, debt_ratio:0.55, liquidity_volume:120000, is_etf:false, alias:'hanjin kal 한진칼 한진' },
  { ticker:'028670.KS', name:'팬오션',          name_en:'Pan Ocean',            sector:'INDUSTRIAL', current_price:3850,   market_cap:2.1e12, volatility_30d:0.34, beta:1.18, debt_ratio:0.52, liquidity_volume:6800000,is_etf:false, alias:'pan ocean 팬오션 해운 벌크' },

  // === 미국 추가 — 빅캡·중국 ADR·반도체·소프트웨어·EV ===
  { ticker:'BABA', name:'Alibaba',                  sector:'IT',       current_price:118,  market_cap:298e9, volatility_30d:0.34, beta:1.18, debt_ratio:0.32, liquidity_volume:14000000, is_etf:false, alias:'alibaba 알리바바 baba 중국' },
  { ticker:'JD',   name:'JD.com',                   sector:'CONSUMER', current_price:38,   market_cap:58e9,  volatility_30d:0.36, beta:1.25, debt_ratio:0.42, liquidity_volume:18000000, is_etf:false, alias:'jd 징둥 중국' },
  { ticker:'BIDU', name:'Baidu',                    sector:'IT',       current_price:88,   market_cap:31e9,  volatility_30d:0.38, beta:1.32, debt_ratio:0.28, liquidity_volume:2200000,  is_etf:false, alias:'baidu 바이두 중국 검색' },
  { ticker:'TSM',  name:'Taiwan Semiconductor',     sector:'IT',       current_price:198,  market_cap:1020e9,volatility_30d:0.30, beta:1.18, debt_ratio:0.18, liquidity_volume:18000000, is_etf:false, alias:'tsmc taiwan semi 대만 반도체 파운드리' },
  { ticker:'ASML', name:'ASML',                     sector:'IT',       current_price:728,  market_cap:298e9, volatility_30d:0.32, beta:1.32, debt_ratio:0.22, liquidity_volume:1200000,  is_etf:false, alias:'asml 노광장비 반도체' },
  { ticker:'AVGO', name:'Broadcom',                 sector:'IT',       current_price:1782, market_cap:825e9, volatility_30d:0.32, beta:1.18, debt_ratio:0.55, liquidity_volume:2200000,  is_etf:false, alias:'broadcom avgo 반도체' },
  { ticker:'MU',   name:'Micron',                   sector:'IT',       current_price:108,  market_cap:118e9, volatility_30d:0.45, beta:1.62, debt_ratio:0.32, liquidity_volume:18000000, is_etf:false, alias:'micron 마이크론 메모리 반도체' },
  { ticker:'ADBE', name:'Adobe',                    sector:'IT',       current_price:548,  market_cap:248e9, volatility_30d:0.28, beta:1.18, debt_ratio:0.28, liquidity_volume:2400000,  is_etf:false, alias:'adobe 어도비 소프트웨어' },
  { ticker:'INTU', name:'Intuit',                   sector:'IT',       current_price:642,  market_cap:178e9, volatility_30d:0.24, beta:1.25, debt_ratio:0.32, liquidity_volume:1100000,  is_etf:false, alias:'intuit 인튜이트 quickbooks' },
  { ticker:'CRWD', name:'CrowdStrike',              sector:'IT',       current_price:328,  market_cap:78e9,  volatility_30d:0.42, beta:1.45, debt_ratio:0.18, liquidity_volume:3200000,  is_etf:false, alias:'crowdstrike crwd 사이버보안' },
  { ticker:'NET',  name:'Cloudflare',               sector:'IT',       current_price:88,   market_cap:30e9,  volatility_30d:0.48, beta:1.52, debt_ratio:0.22, liquidity_volume:5200000,  is_etf:false, alias:'cloudflare 클라우드플레어 cdn' },
  { ticker:'DDOG', name:'Datadog',                  sector:'IT',       current_price:128,  market_cap:42e9,  volatility_30d:0.42, beta:1.55, debt_ratio:0.18, liquidity_volume:3800000,  is_etf:false, alias:'datadog 데이터독 모니터링' },
  { ticker:'SNOW', name:'Snowflake',                sector:'IT',       current_price:172,  market_cap:55e9,  volatility_30d:0.45, beta:1.65, debt_ratio:0.22, liquidity_volume:6500000,  is_etf:false, alias:'snowflake 스노우플레이크 데이터' },
  { ticker:'PLTR', name:'Palantir',                 sector:'IT',       current_price:78,   market_cap:175e9, volatility_30d:0.55, beta:1.85, debt_ratio:0.12, liquidity_volume:78000000, is_etf:false, alias:'palantir 팔란티어' },
  { ticker:'NIO',  name:'NIO',                      sector:'AUTO',     current_price:6.2,  market_cap:13e9,  volatility_30d:0.65, beta:2.15, debt_ratio:0.62, liquidity_volume:48000000, is_etf:false, alias:'nio 니오 중국 전기차' },
  { ticker:'RIVN', name:'Rivian',                   sector:'AUTO',     current_price:12.8, market_cap:13e9,  volatility_30d:0.72, beta:2.25, debt_ratio:0.45, liquidity_volume:38000000, is_etf:false, alias:'rivian 리비안 전기차' },
  { ticker:'BLK',  name:'BlackRock',                sector:'FIN',      current_price:932,  market_cap:138e9, volatility_30d:0.20, beta:1.18, debt_ratio:0.55, liquidity_volume:680000,   is_etf:false, alias:'blackrock 블랙록 자산운용' },
  { ticker:'C',    name:'Citigroup',                sector:'FIN',      current_price:62,   market_cap:118e9, volatility_30d:0.24, beta:1.42, debt_ratio:0.88, liquidity_volume:14000000, is_etf:false, alias:'citi citigroup 시티 은행' },
  { ticker:'WFC',  name:'Wells Fargo',              sector:'FIN',      current_price:62,   market_cap:215e9, volatility_30d:0.22, beta:1.18, debt_ratio:0.85, liquidity_volume:18000000, is_etf:false, alias:'wells fargo 웰스파고 은행' },
  { ticker:'AXP',  name:'American Express',         sector:'FIN',      current_price:268,  market_cap:195e9, volatility_30d:0.20, beta:1.18, debt_ratio:0.72, liquidity_volume:2800000,  is_etf:false, alias:'amex american express 아멕스 카드' },
  { ticker:'ABBV', name:'AbbVie',                   sector:'BIO',      current_price:178,  market_cap:315e9, volatility_30d:0.18, beta:0.62, debt_ratio:0.78, liquidity_volume:5800000,  is_etf:false, alias:'abbvie 애브비 제약' },
  { ticker:'TMO',  name:'Thermo Fisher',            sector:'BIO',      current_price:582,  market_cap:222e9, volatility_30d:0.20, beta:0.88, debt_ratio:0.42, liquidity_volume:1400000,  is_etf:false, alias:'thermo fisher 써모피셔' },
  { ticker:'AMGN', name:'Amgen',                    sector:'BIO',      current_price:282,  market_cap:152e9, volatility_30d:0.18, beta:0.62, debt_ratio:0.85, liquidity_volume:2400000,  is_etf:false, alias:'amgen 암젠 제약' },
  { ticker:'UPS',  name:'United Parcel Service',    sector:'INDUSTRIAL',current_price:128, market_cap:108e9, volatility_30d:0.22, beta:0.92, debt_ratio:0.75, liquidity_volume:4200000,  is_etf:false, alias:'ups 유피에스 물류' },
  { ticker:'FDX',  name:'FedEx',                    sector:'INDUSTRIAL',current_price:268, market_cap:65e9,  volatility_30d:0.24, beta:1.05, debt_ratio:0.72, liquidity_volume:1200000,  is_etf:false, alias:'fedex 페덱스 물류' },

  // === ETF 추가 — 인컴·총시장·반도체·바이오·테마 ===
  { ticker:'AGG',  name:'iShares Core US Bond',     sector:'GLOBAL_ETF',current_price:98,   market_cap:118e9, volatility_30d:0.06, beta:0.10, debt_ratio:0.00, liquidity_volume:7500000,  is_etf:true, alias:'agg us bond 채권 종합' },
  { ticker:'SCHD', name:'Schwab US Dividend',       sector:'GLOBAL_ETF',current_price:78,   market_cap:62e9,  volatility_30d:0.13, beta:0.85, debt_ratio:0.00, liquidity_volume:5200000,  is_etf:true, alias:'schd schwab dividend 배당' },
  { ticker:'VYM',  name:'Vanguard High Dividend',   sector:'GLOBAL_ETF',current_price:122,  market_cap:55e9,  volatility_30d:0.13, beta:0.85, debt_ratio:0.00, liquidity_volume:1100000,  is_etf:true, alias:'vym high dividend 고배당 vanguard' },
  { ticker:'VIG',  name:'Vanguard Dividend Apprec', sector:'GLOBAL_ETF',current_price:188,  market_cap:88e9,  volatility_30d:0.14, beta:0.92, debt_ratio:0.00, liquidity_volume:780000,   is_etf:true, alias:'vig dividend appreciation 배당성장' },
  { ticker:'IEFA', name:'iShares Core MSCI EAFE',   sector:'GLOBAL_ETF',current_price:78,   market_cap:118e9, volatility_30d:0.14, beta:0.78, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'iefa eafe international' },
  { ticker:'IEMG', name:'iShares Core Emerging',    sector:'GLOBAL_ETF',current_price:54,   market_cap:78e9,  volatility_30d:0.18, beta:0.92, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'iemg emerging markets 신흥국' },
  { ticker:'FXI',  name:'iShares China Large-Cap',  sector:'GLOBAL_ETF',current_price:32,   market_cap:5.5e9, volatility_30d:0.32, beta:1.12, debt_ratio:0.00, liquidity_volume:55000000, is_etf:true, alias:'fxi china 중국' },
  { ticker:'KWEB', name:'KraneShares China Internet',sector:'IT',       current_price:30,   market_cap:5.2e9, volatility_30d:0.42, beta:1.42, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'kweb china internet 중국 인터넷' },
  { ticker:'SOXX', name:'iShares Semiconductor',    sector:'IT',        current_price:218,  market_cap:11e9,  volatility_30d:0.32, beta:1.55, debt_ratio:0.00, liquidity_volume:1800000,  is_etf:true, alias:'soxx semiconductor 반도체' },
  { ticker:'SMH',  name:'VanEck Semiconductor',     sector:'IT',        current_price:248,  market_cap:25e9,  volatility_30d:0.32, beta:1.55, debt_ratio:0.00, liquidity_volume:5800000,  is_etf:true, alias:'smh semiconductor 반도체' },
  { ticker:'IBB',  name:'iShares Biotech',          sector:'BIO',       current_price:138,  market_cap:7.2e9, volatility_30d:0.22, beta:0.92, debt_ratio:0.00, liquidity_volume:2200000,  is_etf:true, alias:'ibb biotech 바이오' },
  { ticker:'KRE',  name:'SPDR Regional Banking',    sector:'FIN',       current_price:58,   market_cap:3.8e9, volatility_30d:0.32, beta:1.42, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'kre regional bank 지역은행' },
  { ticker:'IYR',  name:'iShares US Real Estate',   sector:'REALESTATE',current_price:92,   market_cap:4.2e9, volatility_30d:0.22, beta:0.85, debt_ratio:0.00, liquidity_volume:6800000,  is_etf:true, alias:'iyr real estate reit 부동산' },
  { ticker:'JEPI', name:'JPMorgan Equity Premium',  sector:'GLOBAL_ETF',current_price:58,   market_cap:38e9,  volatility_30d:0.10, beta:0.65, debt_ratio:0.00, liquidity_volume:5200000,  is_etf:true, alias:'jepi income premium 인컴' },
  { ticker:'EFA',  name:'iShares MSCI EAFE',        sector:'GLOBAL_ETF',current_price:82,   market_cap:48e9,  volatility_30d:0.14, beta:0.78, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'efa eafe developed 선진국' },

  // === 미국 IT (BIG TECH) ===
  { ticker:'AAPL',  name:'Apple',           sector:'IT',         current_price:228,    market_cap:3500e9, volatility_30d:0.22, beta:1.18, debt_ratio:0.40, liquidity_volume:55000000, is_etf:false, alias:'apple aapl' },
  { ticker:'MSFT',  name:'Microsoft',       sector:'IT',         current_price:432,    market_cap:3200e9, volatility_30d:0.20, beta:0.95, debt_ratio:0.32, liquidity_volume:24000000, is_etf:false, alias:'microsoft msft' },
  { ticker:'GOOGL', name:'Alphabet',        sector:'IT',         current_price:175,    market_cap:2200e9, volatility_30d:0.24, beta:1.05, debt_ratio:0.12, liquidity_volume:32000000, is_etf:false, alias:'alphabet google googl' },
  { ticker:'AMZN',  name:'Amazon',          sector:'IT',         current_price:185,    market_cap:1900e9, volatility_30d:0.30, beta:1.22, debt_ratio:0.46, liquidity_volume:45000000, is_etf:false, alias:'amazon amzn' },
  { ticker:'META',  name:'Meta Platforms',  sector:'IT',         current_price:548,    market_cap:1380e9, volatility_30d:0.32, beta:1.30, debt_ratio:0.18, liquidity_volume:18000000, is_etf:false, alias:'meta facebook fb' },
  { ticker:'NVDA',  name:'NVIDIA',          sector:'IT',         current_price:138,    market_cap:3400e9, volatility_30d:0.48, beta:1.65, debt_ratio:0.20, liquidity_volume:285000000,is_etf:false, alias:'nvidia nvda' },
  { ticker:'NFLX',  name:'Netflix',         sector:'IT',         current_price:712,    market_cap:305e9,  volatility_30d:0.30, beta:1.18, debt_ratio:0.42, liquidity_volume:4200000,  is_etf:false, alias:'netflix nflx' },
  { ticker:'AMD',   name:'AMD',             sector:'IT',         current_price:165,    market_cap:268e9,  volatility_30d:0.45, beta:1.72, debt_ratio:0.22, liquidity_volume:48000000, is_etf:false, alias:'amd advanced micro' },
  { ticker:'CRM',   name:'Salesforce',      sector:'IT',         current_price:285,    market_cap:275e9,  volatility_30d:0.30, beta:1.25, debt_ratio:0.28, liquidity_volume:5800000,  is_etf:false, alias:'salesforce crm' },
  { ticker:'ORCL',  name:'Oracle',          sector:'IT',         current_price:148,    market_cap:412e9,  volatility_30d:0.24, beta:1.05, debt_ratio:0.65, liquidity_volume:8200000,  is_etf:false, alias:'oracle orcl' },
  // === 미국 AUTO ===
  { ticker:'TSLA',  name:'Tesla',           sector:'AUTO',       current_price:218,    market_cap:695e9,  volatility_30d:0.55, beta:1.85, debt_ratio:0.18, liquidity_volume:95000000, is_etf:false, alias:'tesla tsla' },
  { ticker:'F',     name:'Ford',            sector:'AUTO',       current_price:11.2,   market_cap:44e9,   volatility_30d:0.28, beta:1.42, debt_ratio:0.78, liquidity_volume:62000000, is_etf:false, alias:'ford' },
  { ticker:'GM',    name:'General Motors',  sector:'AUTO',       current_price:48.5,   market_cap:54e9,   volatility_30d:0.30, beta:1.45, debt_ratio:0.72, liquidity_volume:18000000, is_etf:false, alias:'gm general motors' },
  // === 미국 FIN ===
  { ticker:'JPM',   name:'JPMorgan Chase',  sector:'FIN',        current_price:218,    market_cap:625e9,  volatility_30d:0.18, beta:1.05, debt_ratio:0.85, liquidity_volume:9200000,  is_etf:false, alias:'jpmorgan chase jpm' },
  { ticker:'BAC',   name:'Bank of America', sector:'FIN',        current_price:42.8,   market_cap:330e9,  volatility_30d:0.22, beta:1.32, debt_ratio:0.86, liquidity_volume:38000000, is_etf:false, alias:'bank of america bac' },
  { ticker:'V',     name:'Visa',            sector:'FIN',        current_price:282,    market_cap:545e9,  volatility_30d:0.18, beta:0.95, debt_ratio:0.32, liquidity_volume:5600000,  is_etf:false, alias:'visa v' },
  { ticker:'MA',    name:'Mastercard',      sector:'FIN',        current_price:498,    market_cap:462e9,  volatility_30d:0.20, beta:1.08, debt_ratio:0.42, liquidity_volume:2900000,  is_etf:false, alias:'mastercard ma' },
  { ticker:'GS',    name:'Goldman Sachs',   sector:'FIN',        current_price:495,    market_cap:160e9,  volatility_30d:0.24, beta:1.40, debt_ratio:0.88, liquidity_volume:1800000,  is_etf:false, alias:'goldman sachs gs' },
  // === 미국 BIO ===
  { ticker:'JNJ',   name:'Johnson & Johnson',sector:'BIO',       current_price:158,    market_cap:380e9,  volatility_30d:0.14, beta:0.55, debt_ratio:0.52, liquidity_volume:7800000,  is_etf:false, alias:'johnson jnj' },
  { ticker:'PFE',   name:'Pfizer',          sector:'BIO',        current_price:28.2,   market_cap:160e9,  volatility_30d:0.22, beta:0.68, debt_ratio:0.62, liquidity_volume:38000000, is_etf:false, alias:'pfizer pfe' },
  { ticker:'LLY',   name:'Eli Lilly',       sector:'BIO',        current_price:792,    market_cap:752e9,  volatility_30d:0.28, beta:0.55, debt_ratio:0.48, liquidity_volume:3200000,  is_etf:false, alias:'eli lilly lly' },
  { ticker:'MRNA',  name:'Moderna',         sector:'BIO',        current_price:38.5,   market_cap:14.7e9, volatility_30d:0.62, beta:1.45, debt_ratio:0.18, liquidity_volume:6800000,  is_etf:false, alias:'moderna mrna' },
  // === 미국 ENERGY ===
  { ticker:'XOM',   name:'ExxonMobil',      sector:'ENERGY',     current_price:118,    market_cap:520e9,  volatility_30d:0.22, beta:0.85, debt_ratio:0.45, liquidity_volume:15000000, is_etf:false, alias:'exxon mobil xom' },
  { ticker:'CVX',   name:'Chevron',         sector:'ENERGY',     current_price:158,    market_cap:295e9,  volatility_30d:0.24, beta:1.10, debt_ratio:0.42, liquidity_volume:7800000,  is_etf:false, alias:'chevron cvx' },
  // === 미국 CONSUMER ===
  { ticker:'WMT',   name:'Walmart',         sector:'CONSUMER',   current_price:84.5,   market_cap:680e9,  volatility_30d:0.16, beta:0.55, debt_ratio:0.62, liquidity_volume:18000000, is_etf:false, alias:'walmart wmt' },
  { ticker:'KO',    name:'Coca-Cola',       sector:'CONSUMER',   current_price:71.5,   market_cap:308e9,  volatility_30d:0.14, beta:0.55, debt_ratio:0.65, liquidity_volume:14000000, is_etf:false, alias:'coca cola ko' },
  { ticker:'PG',    name:'Procter & Gamble',sector:'CONSUMER',   current_price:172,    market_cap:405e9,  volatility_30d:0.14, beta:0.42, debt_ratio:0.58, liquidity_volume:6500000,  is_etf:false, alias:'procter gamble pg' },
  { ticker:'HD',    name:'Home Depot',      sector:'CONSUMER',   current_price:402,    market_cap:398e9,  volatility_30d:0.20, beta:1.05, debt_ratio:0.68, liquidity_volume:3800000,  is_etf:false, alias:'home depot hd' },
  { ticker:'DIS',   name:'Disney',          sector:'CONSUMER',   current_price:96.5,   market_cap:175e9,  volatility_30d:0.26, beta:1.18, debt_ratio:0.45, liquidity_volume:8800000,  is_etf:false, alias:'disney dis' },
  { ticker:'MCD',   name:"McDonald's",      sector:'CONSUMER',   current_price:295,    market_cap:212e9,  volatility_30d:0.16, beta:0.62, debt_ratio:0.78, liquidity_volume:2400000,  is_etf:false, alias:'mcdonalds mcd' },
  { ticker:'SBUX',  name:'Starbucks',       sector:'CONSUMER',   current_price:96.5,   market_cap:110e9,  volatility_30d:0.22, beta:1.08, debt_ratio:0.72, liquidity_volume:5800000,  is_etf:false, alias:'starbucks sbux' },
  // === 미국 REALESTATE ===
  { ticker:'O',     name:'Realty Income',   sector:'REALESTATE', current_price:58.4,   market_cap:51e9,   volatility_30d:0.18, beta:0.78, debt_ratio:0.55, liquidity_volume:5200000,  is_etf:false, alias:'realty income reit' },
  { ticker:'AMT',   name:'American Tower',  sector:'REALESTATE', current_price:218,    market_cap:101e9,  volatility_30d:0.22, beta:0.85, debt_ratio:0.78, liquidity_volume:1800000,  is_etf:false, alias:'american tower amt reit' },

  // === ETF — 미국 광역지수 ===
  { ticker:'SPY',  name:'SPDR S&P500',                  sector:'GLOBAL_ETF', current_price:558,  market_cap:1500e9, volatility_30d:0.14, beta:1.00, debt_ratio:0.00, liquidity_volume:75000000, is_etf:true, alias:'spy s&p 500 sp500' },
  { ticker:'VOO',  name:'Vanguard S&P500',              sector:'GLOBAL_ETF', current_price:512,  market_cap:1200e9, volatility_30d:0.14, beta:1.00, debt_ratio:0.00, liquidity_volume:5200000,  is_etf:true, alias:'voo vanguard sp500' },
  { ticker:'VTI',  name:'Vanguard Total Stock Market',  sector:'GLOBAL_ETF', current_price:282,  market_cap:1700e9, volatility_30d:0.15, beta:1.02, debt_ratio:0.00, liquidity_volume:3800000,  is_etf:true, alias:'vti vanguard total stock' },
  { ticker:'QQQ',  name:'Invesco QQQ Trust',            sector:'GLOBAL_ETF', current_price:485,  market_cap:312e9,  volatility_30d:0.20, beta:1.18, debt_ratio:0.00, liquidity_volume:38000000, is_etf:true, alias:'qqq nasdaq 100 invesco' },
  { ticker:'DIA',  name:'SPDR Dow Jones',               sector:'GLOBAL_ETF', current_price:425,  market_cap:35e9,   volatility_30d:0.13, beta:0.95, debt_ratio:0.00, liquidity_volume:3200000,  is_etf:true, alias:'dia dow jones djia' },
  { ticker:'IWM',  name:'iShares Russell 2000',         sector:'GLOBAL_ETF', current_price:218,  market_cap:62e9,   volatility_30d:0.22, beta:1.18, debt_ratio:0.00, liquidity_volume:42000000, is_etf:true, alias:'iwm russell 2000 small cap' },
  // === ETF — 섹터/테마 ===
  { ticker:'ARKK', name:'ARK Innovation ETF',           sector:'GLOBAL_ETF', current_price:48,   market_cap:5.8e9,  volatility_30d:0.42, beta:1.65, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'arkk ark innovation cathie wood' },
  { ticker:'XLK',  name:'Tech Select Sector SPDR',      sector:'IT',         current_price:218,  market_cap:72e9,   volatility_30d:0.22, beta:1.20, debt_ratio:0.00, liquidity_volume:5800000,  is_etf:true, alias:'xlk tech etf' },
  { ticker:'XLF',  name:'Financial Select Sector SPDR', sector:'FIN',        current_price:46,   market_cap:48e9,   volatility_30d:0.18, beta:1.10, debt_ratio:0.00, liquidity_volume:38000000, is_etf:true, alias:'xlf financial etf' },
  { ticker:'XLE',  name:'Energy Select Sector SPDR',    sector:'ENERGY',     current_price:92,   market_cap:38e9,   volatility_30d:0.26, beta:1.18, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'xle energy etf' },
  { ticker:'XLV',  name:'Health Care Select Sector',    sector:'BIO',        current_price:152,  market_cap:42e9,   volatility_30d:0.16, beta:0.72, debt_ratio:0.00, liquidity_volume:8200000,  is_etf:true, alias:'xlv health bio etf' },
  // === ETF — 글로벌/채권 ===
  { ticker:'VEA',  name:'Vanguard FTSE Developed',      sector:'GLOBAL_ETF', current_price:52,   market_cap:120e9,  volatility_30d:0.16, beta:0.82, debt_ratio:0.00, liquidity_volume:8200000,  is_etf:true, alias:'vea vanguard developed international' },
  { ticker:'VWO',  name:'Vanguard FTSE Emerging',       sector:'GLOBAL_ETF', current_price:48,   market_cap:78e9,   volatility_30d:0.20, beta:0.92, debt_ratio:0.00, liquidity_volume:11000000, is_etf:true, alias:'vwo emerging markets' },
  { ticker:'BND',  name:'Vanguard Total Bond',          sector:'GLOBAL_ETF', current_price:73,   market_cap:115e9,  volatility_30d:0.06, beta:0.10, debt_ratio:0.00, liquidity_volume:6800000,  is_etf:true, alias:'bnd bond vanguard 채권 본드 종합채권' },
  { ticker:'TLT',  name:'iShares 20+ Year Treasury',    sector:'GLOBAL_ETF', current_price:92,   market_cap:62e9,   volatility_30d:0.14, beta:0.05, debt_ratio:0.00, liquidity_volume:42000000, is_etf:true, alias:'tlt treasury bond long 채권 미국채 국채 장기채' },
  { ticker:'IEF',  name:'iShares 7-10 Year Treasury',   sector:'GLOBAL_ETF', current_price:96,   market_cap:32e9,   volatility_30d:0.08, beta:0.04, debt_ratio:0.00, liquidity_volume:8200000,  is_etf:true, alias:'ief 채권 중기채 미국채' },
  { ticker:'LQD',  name:'iShares Investment Grade Bond',sector:'GLOBAL_ETF', current_price:108,  market_cap:32e9,   volatility_30d:0.10, beta:0.20, debt_ratio:0.00, liquidity_volume:14000000, is_etf:true, alias:'lqd 회사채 채권 corporate bond' },
  { ticker:'HYG',  name:'iShares High Yield Corporate', sector:'GLOBAL_ETF', current_price:78,   market_cap:18e9,   volatility_30d:0.14, beta:0.45, debt_ratio:0.00, liquidity_volume:32000000, is_etf:true, alias:'hyg 하이일드 채권 정크본드 high yield' },
  { ticker:'GLD',  name:'SPDR Gold Trust',              sector:'GLOBAL_ETF', current_price:248,  market_cap:78e9,   volatility_30d:0.14, beta:0.05, debt_ratio:0.00, liquidity_volume:9500000,  is_etf:true, alias:'gld gold 금 원자재 골드' },
  { ticker:'SLV',  name:'iShares Silver Trust',         sector:'GLOBAL_ETF', current_price:30,   market_cap:13e9,   volatility_30d:0.28, beta:0.30, debt_ratio:0.00, liquidity_volume:18000000, is_etf:true, alias:'slv silver 은 원자재' },
  { ticker:'USO',  name:'United States Oil Fund',       sector:'ENERGY',     current_price:78,   market_cap:1.4e9,  volatility_30d:0.32, beta:1.05, debt_ratio:0.00, liquidity_volume:3200000,  is_etf:true, alias:'uso oil 원유 원자재 crude' },
  { ticker:'DBC',  name:'Invesco DB Commodity Index',   sector:'GLOBAL_ETF', current_price:24,   market_cap:1.6e9,  volatility_30d:0.18, beta:0.55, debt_ratio:0.00, liquidity_volume:2200000,  is_etf:true, alias:'dbc commodity 원자재 종합원자재' },
  { ticker:'DBA',  name:'Invesco DB Agriculture',       sector:'GLOBAL_ETF', current_price:25,   market_cap:0.7e9,  volatility_30d:0.16, beta:0.42, debt_ratio:0.00, liquidity_volume:1800000,  is_etf:true, alias:'dba agriculture 농산물 원자재' },
  // === ETF — 한국 ===
  { ticker:'069500.KS', name:'KODEX 200',           name_en:'KODEX 200 (KOSPI200)',  sector:'GLOBAL_ETF', current_price:38500, market_cap:7.2e12, volatility_30d:0.18, beta:1.00, debt_ratio:0.00, liquidity_volume:8200000,  is_etf:true, alias:'kodex 200 kospi' },
  { ticker:'102110.KS', name:'TIGER 200',           name_en:'TIGER 200 (KOSPI200)',  sector:'GLOBAL_ETF', current_price:38400, market_cap:2.8e12, volatility_30d:0.18, beta:1.00, debt_ratio:0.00, liquidity_volume:1800000,  is_etf:true, alias:'tiger 200 kospi' },
  { ticker:'305720.KS', name:'KODEX 2차전지산업',   name_en:'KODEX Battery Industry',sector:'INDUSTRIAL', current_price:18200, market_cap:0.9e12, volatility_30d:0.42, beta:1.55, debt_ratio:0.00, liquidity_volume:3200000,  is_etf:true, alias:'kodex 2차전지 battery' },
  { ticker:'360750.KS', name:'TIGER 미국S&P500',    name_en:'TIGER US S&P500',       sector:'GLOBAL_ETF', current_price:21800, market_cap:5.1e12, volatility_30d:0.14, beta:1.00, debt_ratio:0.00, liquidity_volume:4200000,  is_etf:true, alias:'tiger 미국 s&p500' },
  { ticker:'379800.KS', name:'KODEX 미국S&P500TR',  name_en:'KODEX US S&P500 TR',    sector:'GLOBAL_ETF', current_price:18900, market_cap:2.2e12, volatility_30d:0.14, beta:1.00, debt_ratio:0.00, liquidity_volume:1800000,  is_etf:true, alias:'kodex 미국 s&p500 tr' },
  { ticker:'381180.KS', name:'TIGER 미국필라델피아반도체나스닥', name_en:'TIGER US Philadelphia Semiconductor', sector:'IT', current_price:14200, market_cap:1.8e12, volatility_30d:0.34, beta:1.45, debt_ratio:0.00, liquidity_volume:2800000, is_etf:true, alias:'tiger 미국 반도체 nasdaq' }
];

export const ASSET_BY_TICKER: Record<string, Asset> = {};
ASSET_DB.forEach(a => { ASSET_BY_TICKER[a.ticker] = a; });

// ---------- 기본 샘플 포트폴리오 (수량 기반) ----------
export const SAMPLE_HOLDINGS: Holding[] = [
  { ticker:'005930.KS', quantity:120, avg_price:65000 },   // 삼성전자
  { ticker:'000660.KS', quantity:30,  avg_price:140000 },  // SK하이닉스
  { ticker:'068270.KS', quantity:20,  avg_price:200000 },  // 셀트리온
  { ticker:'105560.KS', quantity:40,  avg_price:72000 },   // KB금융
  { ticker:'015760.KS', quantity:100, avg_price:21500 },   // 한국전력
  { ticker:'051910.KS', quantity:6,   avg_price:520000 },  // LG화학
  { ticker:'005380.KS', quantity:8,   avg_price:185000 },  // 현대차
  { ticker:'097950.KS', quantity:5,   avg_price:312000 },  // CJ제일제당
  { ticker:'069500.KS', quantity:40,  avg_price:35000 }    // KODEX 200
];
