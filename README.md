# SPHERE — 포트폴리오 리스크 구체 분석

투자 포트폴리오의 리스크 구조를 3D 구체로 시각화하는 분석 도구.
https://useruseruse.github.io/sphere/

## Features

- 3D 구체에 포트폴리오를 매핑 (위도=섹터, 경도=비중, 돌출=리스크)
- 5단계 분석 파이프라인: 표준화 → 리스크 스코어 → 좌표 매핑 → 밸런스 지수 → 자동 인사이트
- 종목/ETF 검색·추가·수량 편집·삭제 (80+ 자산 내장)
- 포트폴리오 다중 관리 (최대 20개, localStorage 자동 저장)
- 호버 인포 툴팁 — 모든 지표의 산출 공식·임계값을 실시간 확인
- 반구별 색상 (북=성장주 쿨톤 / 남=가치주 웜톤)
- Sphere · Cluster 두 가지 뷰 모드

## Folder Structure

```
sphere/
├── index.html         # HTML 본문
├── css/
│   └── styles.css     # 모든 스타일
├── js/
│   ├── data.js        # 종목/ETF DB · 섹터 정의 · 샘플
│   ├── pipeline.js    # 분석 파이프라인 (순수 함수)
│   ├── state.js       # localStorage · 포트폴리오/종목 CRUD
│   ├── scene.js       # Three.js 3D 씬 + 인터랙션
│   ├── ui.js          # DOM 렌더링 · 검색 · 모달 · 툴팁
│   └── main.js        # 진입점 · 오케스트레이션
├── lib/
│   └── three.min.js   # Three.js r128 (MIT)
├── README.md
└── LICENSE
```


## Tech Stack

- 순수 HTML / CSS / JavaScript (ES2020 모듈)
- Three.js r128 (WebGL 3D 렌더링)
- localStorage (영속화)
- 외부 의존성 없음 — 빌드 단계 없음

## Disclaimer

본 서비스는 교육·시연 목적의 포트폴리오 시각화 도구입니다.
표시되는 종목 데이터는 정적 스냅샷이며 실시간 시세가 아닙니다.
본 서비스의 분석 결과는 투자 자문이나 권유가 아니며,
모든 투자 결정과 그에 따른 손익은 사용자 본인의 책임입니다.

## License

MIT License — see LICENSE file.
