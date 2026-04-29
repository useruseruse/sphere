/* =========================================================
   SPHERE — Data Module
   종목/ETF 마스터 DB · 섹터 정의 · 샘플 포트폴리오
   ========================================================= */

// ---------- 종목/ETF 마스터 DB ----------
// 검색 가능한 자산 데이터. 정적 스냅샷 (실시간 시세 아님 — 교육·시연용).
export const ASSET_DB = [
  // === 한국 IT ===
  { ticker:'005930.KS', name:'삼성전자',         sector:'IT',         current_price:71200,  market_cap:425e12, volatility_30d:0.24, beta:1.05, debt_ratio:0.32, liquidity_volume:18500000, is_etf:false, alias:'samsung electronics' },
  { ticker:'000660.KS', name:'SK하이닉스',       sector:'IT',         current_price:182000, market_cap:132e12, volatility_30d:0.36, beta:1.32, debt_ratio:0.45, liquidity_volume:5400000,  is_etf:false, alias:'sk hynix' },
  { ticker:'035420.KS', name:'NAVER',           sector:'IT',         current_price:212000, market_cap:34e12,  volatility_30d:0.30, beta:1.20, debt_ratio:0.22, liquidity_volume:680000,   is_etf:false, alias:'naver' },
  { ticker:'035720.KS', name:'카카오',           sector:'IT',         current_price:48500,  market_cap:21e12,  volatility_30d:0.34, beta:1.28, debt_ratio:0.41, liquidity_volume:2100000,  is_etf:false, alias:'kakao' },
  { ticker:'377300.KS', name:'카카오페이',       sector:'IT',         current_price:32000,  market_cap:4.2e12, volatility_30d:0.45, beta:1.45, debt_ratio:0.18, liquidity_volume:920000,   is_etf:false, alias:'kakaopay' },
  { ticker:'251270.KS', name:'넷마블',           sector:'IT',         current_price:55800,  market_cap:4.8e12, volatility_30d:0.38, beta:1.22, debt_ratio:0.35, liquidity_volume:340000,   is_etf:false, alias:'netmarble' },
  // === 한국 BIO ===
  { ticker:'207940.KS', name:'삼성바이오로직스', sector:'BIO',        current_price:835000, market_cap:59e12,  volatility_30d:0.28, beta:0.92, debt_ratio:0.20, liquidity_volume:140000,   is_etf:false, alias:'samsung biologics' },
  { ticker:'068270.KS', name:'셀트리온',         sector:'BIO',        current_price:185000, market_cap:38e12,  volatility_30d:0.42, beta:1.18, debt_ratio:0.28, liquidity_volume:1200000,  is_etf:false, alias:'celltrion' },
  { ticker:'196170.KS', name:'알테오젠',         sector:'BIO',        current_price:312000, market_cap:16e12,  volatility_30d:0.55, beta:1.55, debt_ratio:0.15, liquidity_volume:580000,   is_etf:false, alias:'alteogen' },
  { ticker:'128940.KS', name:'한미약품',         sector:'BIO',        current_price:328000, market_cap:4.1e12, volatility_30d:0.38, beta:1.05, debt_ratio:0.42, liquidity_volume:78000,    is_etf:false, alias:'hanmi pharm' },
  // === 한국 FIN ===
  { ticker:'105560.KS', name:'KB금융',           sector:'FIN',        current_price:78400,  market_cap:31e12,  volatility_30d:0.18, beta:0.85, debt_ratio:0.78, liquidity_volume:1800000,  is_etf:false, alias:'kb financial' },
  { ticker:'055550.KS', name:'신한지주',         sector:'FIN',        current_price:52800,  market_cap:27e12,  volatility_30d:0.17, beta:0.82, debt_ratio:0.81, liquidity_volume:1900000,  is_etf:false, alias:'shinhan' },
  { ticker:'086790.KS', name:'하나금융지주',     sector:'FIN',        current_price:62100,  market_cap:18e12,  volatility_30d:0.19, beta:0.88, debt_ratio:0.82, liquidity_volume:1100000,  is_etf:false, alias:'hana financial' },
  { ticker:'316140.KS', name:'우리금융지주',     sector:'FIN',        current_price:14850,  market_cap:11e12,  volatility_30d:0.18, beta:0.84, debt_ratio:0.83, liquidity_volume:3200000,  is_etf:false, alias:'woori' },
  { ticker:'138930.KS', name:'BNK금융지주',      sector:'FIN',        current_price:8420,   market_cap:2.7e12, volatility_30d:0.21, beta:0.92, debt_ratio:0.84, liquidity_volume:1400000,  is_etf:false, alias:'bnk' },
  // === 한국 AUTO ===
  { ticker:'005380.KS', name:'현대차',           sector:'AUTO',       current_price:248000, market_cap:52e12,  volatility_30d:0.26, beta:1.08, debt_ratio:0.62, liquidity_volume:850000,   is_etf:false, alias:'hyundai motor' },
  { ticker:'000270.KS', name:'기아',             sector:'AUTO',       current_price:108000, market_cap:43e12,  volatility_30d:0.27, beta:1.10, debt_ratio:0.55, liquidity_volume:1600000,  is_etf:false, alias:'kia' },
  { ticker:'012330.KS', name:'현대모비스',       sector:'AUTO',       current_price:235000, market_cap:22e12,  volatility_30d:0.24, beta:1.02, debt_ratio:0.45, liquidity_volume:280000,   is_etf:false, alias:'mobis' },
  // === 한국 INDUSTRIAL ===
  { ticker:'006400.KS', name:'삼성SDI',          sector:'INDUSTRIAL', current_price:325000, market_cap:22e12,  volatility_30d:0.36, beta:1.40, debt_ratio:0.48, liquidity_volume:380000,   is_etf:false, alias:'samsung sdi' },
  { ticker:'051910.KS', name:'LG화학',           sector:'INDUSTRIAL', current_price:368000, market_cap:26e12,  volatility_30d:0.38, beta:1.42, debt_ratio:0.51, liquidity_volume:340000,   is_etf:false, alias:'lg chem' },
  { ticker:'373220.KS', name:'LG에너지솔루션',   sector:'INDUSTRIAL', current_price:392000, market_cap:92e12,  volatility_30d:0.40, beta:1.48, debt_ratio:0.52, liquidity_volume:520000,   is_etf:false, alias:'lg energy solution' },
  { ticker:'010130.KS', name:'고려아연',         sector:'INDUSTRIAL', current_price:858000, market_cap:18e12,  volatility_30d:0.34, beta:1.18, debt_ratio:0.32, liquidity_volume:48000,    is_etf:false, alias:'korea zinc' },
  { ticker:'009540.KS', name:'HD한국조선해양',   sector:'INDUSTRIAL', current_price:188000, market_cap:13e12,  volatility_30d:0.42, beta:1.55, debt_ratio:0.65, liquidity_volume:380000,   is_etf:false, alias:'hd shipbuilding' },
  // === 한국 ENERGY ===
  { ticker:'015760.KS', name:'한국전력',         sector:'ENERGY',     current_price:23800,  market_cap:15e12,  volatility_30d:0.22, beta:0.62, debt_ratio:0.88, liquidity_volume:6800000,  is_etf:false, alias:'kepco' },
  { ticker:'034730.KS', name:'SK',               sector:'ENERGY',     current_price:142000, market_cap:11e12,  volatility_30d:0.28, beta:0.95, debt_ratio:0.55, liquidity_volume:120000,   is_etf:false, alias:'sk holdings' },
  { ticker:'096770.KS', name:'SK이노베이션',     sector:'ENERGY',     current_price:118000, market_cap:11e12,  volatility_30d:0.34, beta:1.25, debt_ratio:0.62, liquidity_volume:480000,   is_etf:false, alias:'sk innovation' },
  // === 한국 CONSUMER ===
  { ticker:'097950.KS', name:'CJ제일제당',       sector:'CONSUMER',   current_price:295000, market_cap:4.4e12, volatility_30d:0.16, beta:0.72, debt_ratio:0.58, liquidity_volume:62000,    is_etf:false, alias:'cj cheiljedang' },
  { ticker:'271560.KS', name:'오리온',           sector:'CONSUMER',   current_price:128000, market_cap:5.1e12, volatility_30d:0.18, beta:0.65, debt_ratio:0.32, liquidity_volume:140000,   is_etf:false, alias:'orion' },
  { ticker:'139480.KS', name:'이마트',           sector:'CONSUMER',   current_price:62800,  market_cap:1.7e12, volatility_30d:0.22, beta:0.78, debt_ratio:0.62, liquidity_volume:280000,   is_etf:false, alias:'emart' },
  { ticker:'282330.KS', name:'BGF리테일',        sector:'CONSUMER',   current_price:118000, market_cap:2.0e12, volatility_30d:0.20, beta:0.68, debt_ratio:0.45, liquidity_volume:78000,    is_etf:false, alias:'bgf retail cu' },
  // === 한국 INDUSTRIAL/etc ===
  { ticker:'028260.KS', name:'삼성물산',         sector:'INDUSTRIAL', current_price:158000, market_cap:30e12,  volatility_30d:0.20, beta:0.95, debt_ratio:0.42, liquidity_volume:380000,   is_etf:false, alias:'samsung c&t' },
  { ticker:'003550.KS', name:'LG',               sector:'IT',         current_price:81200,  market_cap:13e12,  volatility_30d:0.22, beta:1.05, debt_ratio:0.38, liquidity_volume:340000,   is_etf:false, alias:'lg holdings' },

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
  { ticker:'BND',  name:'Vanguard Total Bond',          sector:'GLOBAL_ETF', current_price:73,   market_cap:115e9,  volatility_30d:0.06, beta:0.10, debt_ratio:0.00, liquidity_volume:6800000,  is_etf:true, alias:'bnd bond vanguard' },
  { ticker:'TLT',  name:'iShares 20+ Year Treasury',    sector:'GLOBAL_ETF', current_price:92,   market_cap:62e9,   volatility_30d:0.14, beta:0.05, debt_ratio:0.00, liquidity_volume:42000000, is_etf:true, alias:'tlt treasury bond long' },
  { ticker:'GLD',  name:'SPDR Gold Trust',              sector:'GLOBAL_ETF', current_price:248,  market_cap:78e9,   volatility_30d:0.14, beta:0.05, debt_ratio:0.00, liquidity_volume:9500000,  is_etf:true, alias:'gld gold' },
  // === ETF — 한국 ===
  { ticker:'069500.KS', name:'KODEX 200',           sector:'GLOBAL_ETF', current_price:38500, market_cap:7.2e12, volatility_30d:0.18, beta:1.00, debt_ratio:0.00, liquidity_volume:8200000,  is_etf:true, alias:'kodex 200 kospi' },
  { ticker:'102110.KS', name:'TIGER 200',           sector:'GLOBAL_ETF', current_price:38400, market_cap:2.8e12, volatility_30d:0.18, beta:1.00, debt_ratio:0.00, liquidity_volume:1800000,  is_etf:true, alias:'tiger 200 kospi' },
  { ticker:'305720.KS', name:'KODEX 2차전지산업',   sector:'INDUSTRIAL', current_price:18200, market_cap:0.9e12, volatility_30d:0.42, beta:1.55, debt_ratio:0.00, liquidity_volume:3200000,  is_etf:true, alias:'kodex 2차전지 battery' },
  { ticker:'360750.KS', name:'TIGER 미국S&P500',    sector:'GLOBAL_ETF', current_price:21800, market_cap:5.1e12, volatility_30d:0.14, beta:1.00, debt_ratio:0.00, liquidity_volume:4200000,  is_etf:true, alias:'tiger 미국 s&p500' },
  { ticker:'379800.KS', name:'KODEX 미국S&P500TR',  sector:'GLOBAL_ETF', current_price:18900, market_cap:2.2e12, volatility_30d:0.14, beta:1.00, debt_ratio:0.00, liquidity_volume:1800000,  is_etf:true, alias:'kodex 미국 s&p500 tr' },
  { ticker:'381180.KS', name:'TIGER 미국필라델피아반도체나스닥', sector:'IT', current_price:14200, market_cap:1.8e12, volatility_30d:0.34, beta:1.45, debt_ratio:0.00, liquidity_volume:2800000, is_etf:true, alias:'tiger 미국 반도체 nasdaq' }
];

// 티커 → 자산 빠른 조회 맵
export const ASSET_BY_TICKER = {};
ASSET_DB.forEach(a => ASSET_BY_TICKER[a.ticker] = a);

// ---------- 섹터 정의 (Skills.md Layer 1.4) ----------
export const SECTOR_DEF = {
  IT:        { base_risk:0.75, lat_min:60,  lat_max:80,  vol_avg:0.30, beta_avg:1.20, color:'#00D4FF' },
  BIO:       { base_risk:0.85, lat_min:40,  lat_max:60,  vol_avg:0.42, beta_avg:1.15, color:'#7B61FF' },
  AUTO:      { base_risk:0.60, lat_min:20,  lat_max:40,  vol_avg:0.28, beta_avg:1.10, color:'#FF8C42' },
  GLOBAL_ETF:{ base_risk:0.40, lat_min:10,  lat_max:20,  vol_avg:0.16, beta_avg:1.00, color:'#9B6EFF' },
  INDUSTRIAL:{ base_risk:0.55, lat_min:-10, lat_max:10,  vol_avg:0.32, beta_avg:1.25, color:'#F4D35E' },
  ETC:       { base_risk:0.55, lat_min:0,   lat_max:0,   vol_avg:0.30, beta_avg:1.00, color:'#9aa4bc' },
  FIN:       { base_risk:0.50, lat_min:-40, lat_max:-20, vol_avg:0.20, beta_avg:0.90, color:'#00E5A0' },
  ENERGY:    { base_risk:0.65, lat_min:-55, lat_max:-40, vol_avg:0.25, beta_avg:0.75, color:'#FF4560' },
  CONSUMER:  { base_risk:0.35, lat_min:-70, lat_max:-55, vol_avg:0.18, beta_avg:0.70, color:'#A8E5C2' },
  REALESTATE:{ base_risk:0.45, lat_min:-80, lat_max:-70, vol_avg:0.22, beta_avg:0.85, color:'#FFA8B6' }
};

// ---------- 기본 샘플 포트폴리오 (수량 기반) ----------
export const SAMPLE_HOLDINGS = [
  { ticker:'005930.KS', quantity:120, avg_price:65000 },
  { ticker:'000660.KS', quantity:30,  avg_price:140000 },
  { ticker:'068270.KS', quantity:20,  avg_price:200000 },
  { ticker:'105560.KS', quantity:40,  avg_price:72000 },
  { ticker:'015760.KS', quantity:100, avg_price:21500 },
  { ticker:'051910.KS', quantity:6,   avg_price:520000 },
  { ticker:'005380.KS', quantity:8,   avg_price:185000 },
  { ticker:'097950.KS', quantity:5,   avg_price:312000 },
  { ticker:'069500.KS', quantity:40,  avg_price:35000 }
];
