# Supabase 전환 준비

이 문서는 Campus Link를 Supabase 중심으로 가져갈 때 필요한 최소 설치와 초기 세팅을 정리합니다.

## 1. 미리 설치할 것

- Docker Desktop
- Node.js / npm
- Supabase CLI
- 프론트엔드용 Supabase JavaScript SDK (`@supabase/supabase-js`)

## 2. 권장 설치 순서

### Supabase CLI

macOS에서는 보통 Homebrew로 설치합니다.

```bash
brew install supabase/tap/supabase
supabase --version
```

CLI를 전역 설치하지 않고 1회성으로 실행할 때는 `npx supabase` 형태도 사용할 수 있습니다.

### 프론트엔드 SDK

`frontend/` 폴더에서 설치합니다.

```bash
cd frontend
npm install @supabase/supabase-js
```

## 3. 환경 변수

다음 파일을 복사해서 로컬 값을 채웁니다.

```txt
frontend/.env.example -> frontend/.env.local
```

필수 값:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

프로젝트 대시보드의 `Project Settings -> API`에서 확인할 수 있습니다.

`SUPABASE_SERVICE_ROLE_KEY`는 브라우저에 노출되면 안 되므로 `frontend/.env.local`에만 넣고 커밋하지 않습니다.

## 3-1. 회원가입용 테이블 연결 준비

현재 레포의 MVP `users`, `profiles` 테이블은 Spring Boot 기준으로 먼저 만들어져 있어서 Supabase Auth 사용자와 바로 연결되지 않습니다.
회원가입 테스트 전에 아래 SQL을 Supabase SQL Editor에서 한 번 실행합니다.

```sql
alter table public.users
  add column if not exists auth_user_id uuid unique;

alter table public.users
  alter column password_hash drop not null,
  alter column name drop not null;

alter table public.users
  alter column role set default 'STUDENT',
  alter column auth_provider set default 'SUPABASE';

update public.users
set auth_provider = 'SUPABASE'
where auth_provider is null;
```

같은 SQL은 `frontend/supabase/migrations/20260706_auth_user_bridge.sql`에도 저장되어 있습니다.

## 4. 로컬 Supabase 시작

레포 루트에서 진행합니다.

```bash
supabase init
supabase start
```

로컬 스택이 올라가면 CLI가 로컬 URL과 키를 보여줍니다.

## 5. 현재 레포에서 이미 준비된 것

- 프론트엔드용 Supabase 환경 변수 예시 파일
- `frontend/src/lib/supabase/env.ts` 환경 변수 헬퍼

## 6. 팀에서 먼저 결정할 것

- 인증: Supabase Auth 사용 여부
- 포트폴리오: 파일 업로드 vs 외부 링크 only
- P0 기능 범위: 온보딩, 프로젝트 목록, 지원 흐름 중 어디까지를 필수로 볼지

## 7. 다음 추천 작업

1. 팀에서 Supabase 전환 여부 확정
2. Supabase 프로젝트 생성
3. `frontend/.env.local` 값 입력
4. `@supabase/supabase-js`, `@supabase/ssr` 설치
5. 로그인/회원가입을 Supabase Auth 기준으로 설계
