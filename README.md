# SPHERE — 포트폴리오 리스크 구체 분석기

투자 포트폴리오의 리스크 구조를 3D 구체로 시각화하는 분석 도구.

## Features

- 3D 구체에 포트폴리오 매핑 (위도=섹터, 경도=비중, 돌출=리스크)
- Skills.md 5개 레이어 분석 파이프라인 (표준화 → 리스크 → 좌표 → 밸런스 → 인사이트)
- AI 추천 엔진 — 약점 진단(W1~W7) 후 종목 추가/축소 액션 자동 제안
- 상관관계 네트워크 — 섹터·베타·변동성 기반 종목 간 동조성 시각화
- 종목/ETF 검색 (KR/US 100여 종목, 한글·영문 별칭 지원, 130+ 해시태그)
- 포트폴리오 다중 관리 (최대 20개, localStorage 자동 저장)
- 한국어/English 양국어 지원
- 인포 툴팁 — 모든 지표의 산출 공식·임계값·학술 근거(Markowitz, Sharpe, HHI)
- 일별 자동 시세 갱신 (yfinance + GitHub Actions)
- 첫 방문자용 온보딩 투어

## Folder Structure

```
sphere/
├── index.html              # HTML 본문
├── css/
│   └── styles.css          # 전체 스타일
├── js/
│   └── app.js              # 전체 로직
├── lib/
│   └── three.min.js        # Three.js r128 (MIT)
├── data/
│   └── prices.json         # 일별 시세 (자동 갱신)
├── tools/
│   └── update_prices.py    # yfinance 갱신 스크립트
├── .github/
│   └── workflows/
│       └── update-prices.yml  # 매일 자동 실행
├── README.md
└── LICENSE
```

## 데이터 형식

```json
{
  "updated_at": "2026-04-30T23:00:00+00:00",
  "count": 96,
  "failed": [],
  "prices": {
    "005930.KS": {
      "price": 71200,
      "volatility_30d": 0.24,
      "beta": 1.05,
      "volume": 18500000
    },
    "AAPL": { ... }
  }
}
```

페이지 로드 시 `app.js`가 이 파일을 fetch해서 `ASSET_DB`의 기본값을 덮어씁니다. 실패 시 정적 폴백.

## Tech Stack

- Pure HTML / CSS / JavaScript (ES2020+)
- Three.js r128 (WebGL 3D 렌더링)
- localStorage (사용자 포트폴리오 영속화)
- Python 3.11 + yfinance (시세 갱신)
- 외부 의존성 빌드 단계 없음

## Disclaimer

본 서비스는 교육·시연 목적의 포트폴리오 시각화 도구이며, 투자 자문이 아닙니다.
종목 시세는 매일 전일 종가 기준으로 자동 갱신됩니다 (실시간 아님).
모든 투자 결정과 그에 따른 손익은 사용자 본인의 책임입니다.

## License

MIT License — see LICENSE file. Three.js (MIT) is bundled in `lib/`.
