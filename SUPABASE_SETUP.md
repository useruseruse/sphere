# Supabase 연동 설정 (선택)

SPHERE는 기본으로 **localStorage 단독 모드**로 동작합니다. 클라우드 동기화 + Google/GitHub 로그인을 활성화하려면 아래 단계를 따라하세요.

env 변수가 비어있으면 모든 cloud 코드가 no-op이 되므로, 설정 안 하셔도 앱은 정상 동작합니다.

## 1. Supabase 프로젝트 생성

1. https://app.supabase.com 가입 (GitHub 로그인 권장)
2. **New project** → 이름·DB 비밀번호·리전(서울 권장 — Northeast Asia) 선택
3. 프로젝트 준비 ~2분 대기
4. **Project Settings → API** 탭에서 다음 두 값 복사:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `Project API keys` → `anon` `public` → `VITE_SUPABASE_ANON_KEY`

## 2. 로컬 env 설정

```bash
cp .env.example .env.local
# .env.local 을 열어서 1번에서 복사한 두 값 채우기
```

`.env.local` 은 `.gitignore`에 포함되어 있어 커밋되지 않습니다.

## 3. DB 스키마 + RLS 정책

Supabase 대시보드 → **SQL Editor** → New query → 아래 붙여넣고 Run:

```sql
-- 포트폴리오 테이블
create table portfolios (
  id text primary key,
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 보유 종목 테이블
create table holdings (
  id uuid primary key default gen_random_uuid(),
  portfolio_id text not null references portfolios on delete cascade,
  ticker text not null,
  quantity numeric not null,
  avg_price numeric not null
);

create index holdings_portfolio_idx on holdings(portfolio_id);

-- Row Level Security 활성화
alter table portfolios enable row level security;
alter table holdings   enable row level security;

-- 사용자는 자기 행만 read/write 가능
create policy "own_portfolios_select" on portfolios for select using (auth.uid() = user_id);
create policy "own_portfolios_insert" on portfolios for insert with check (auth.uid() = user_id);
create policy "own_portfolios_update" on portfolios for update using (auth.uid() = user_id);
create policy "own_portfolios_delete" on portfolios for delete using (auth.uid() = user_id);

create policy "own_holdings_select" on holdings for select using (
  exists (select 1 from portfolios p where p.id = holdings.portfolio_id and p.user_id = auth.uid())
);
create policy "own_holdings_insert" on holdings for insert with check (
  exists (select 1 from portfolios p where p.id = holdings.portfolio_id and p.user_id = auth.uid())
);
create policy "own_holdings_update" on holdings for update using (
  exists (select 1 from portfolios p where p.id = holdings.portfolio_id and p.user_id = auth.uid())
);
create policy "own_holdings_delete" on holdings for delete using (
  exists (select 1 from portfolios p where p.id = holdings.portfolio_id and p.user_id = auth.uid())
);
```

> `portfolios.id`가 `text`인 이유: 로컬 STATE의 id 형식이 `pf_1234567890`이라 그대로 보존하기 위함. 향후 uuid로 마이그레이션하려면 클라이언트도 같이 수정 필요.

## 4. OAuth 공급자 설정

### Google
1. **Authentication → Providers → Google** Enable
2. Google Cloud Console 에서 OAuth 2.0 Client ID 생성:
   - 종류: Web application
   - Authorized redirect URIs: Supabase가 알려주는 콜백 URL (예: `https://<프로젝트>.supabase.co/auth/v1/callback`)
3. Client ID / Secret 을 Supabase Provider 설정에 입력
4. Save

### GitHub (선택)
1. **Authentication → Providers → GitHub** Enable
2. GitHub Settings → Developer settings → OAuth Apps → New OAuth App:
   - Authorization callback URL: Supabase 콜백 URL
3. Client ID / Secret 을 Supabase에 입력

## 5. 로컬에서 테스트

```bash
npm run dev
# 헤더 우측에 "Sign in" 버튼이 나타남
```

로그인 → localStorage 의 포트폴리오가 자동으로 클라우드에 푸시됩니다 (1회). 이후 변경사항은 자동 동기화 (1초 debounce).

## 6. GitHub Pages 배포 시 env 주입

`.env.local`은 깃에 안 올라가므로, 배포할 때 GitHub Actions secret으로 주입해야 합니다:

1. GitHub repo → Settings → Secrets and variables → Actions
2. **New repository secret** 두 개 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. `.github/workflows/deploy.yml`의 build step 에 다음 추가:

```yaml
- name: Build (Vite, gh-pages base)
  run: npm run build
  env:
    DEPLOY_TARGET: gh-pages
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

> **주의**: anon key는 public key라서 빌드 산출물에 포함되어도 안전합니다. RLS 정책이 실제 보호 장치입니다.

## 데이터 흐름

```
[로그인 직전]
localStorage  ↔  STATE (메모리)

[Sign in 클릭 → OAuth 콜백]
  1. session 발급
  2. migrateLocalToCloud():
       서버 portfolios 비어있으면 STATE 를 push
  3. pullPortfolios():
       서버에 데이터 있으면 STATE 덮어쓰기 (서버 우선)
  4. rebuildAll() 으로 UI 갱신

[로그인 중 사용자 액션 (포트폴리오 수정)]
  STATE mutation
  → saveState() 가 localStorage 에 저장
  → schedulePush() 가 1초 debounce 후 서버 upsert

[Sign out]
  세션 클리어 — 다음 새로고침엔 localStorage 단독 모드
```

## 문제 해결

- **로그인 버튼이 안 보임** → `.env.local` 또는 GitHub Action secret 미설정. `import.meta.env.VITE_SUPABASE_URL`이 빌드 시점에 비어있으면 cloud 모드 비활성.
- **OAuth redirect 후 다시 익명 상태** → Supabase Provider 의 redirect URI 가 정확한지, 로컬은 `http://127.0.0.1:5173` 이 등록되어 있는지 확인.
- **RLS 위반 (42501) 에러** → SQL 정책이 모두 생성됐는지 확인. 또한 `portfolios.user_id` 가 `auth.uid()` 와 일치해야 함.
- **무료 티어 일시정지** → 7일 무활동이면 프로젝트가 paused 됨. 대시보드에서 Resume.
