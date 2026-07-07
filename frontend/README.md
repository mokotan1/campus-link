# Frontend 폴더

이 폴더는 Next.js 프론트엔드를 담당합니다.

## 이 폴더에 들어가는 것

- 화면 라우트
- UI 컴포넌트
- 기능별 프론트엔드 로직
- API 클라이언트 코드
- 온보딩, 프로젝트, 포트폴리오, 지원 현황 화면 상태

## 주요 스크립트

아래 명령어는 `frontend/` 폴더에서 실행합니다.

```bash
npm install
npm run dev
npm run build
npm run lint
```

레포 루트에서 Docker로 실행할 수도 있습니다.

```bash
docker compose up frontend
```

## 로컬 주소

```txt
http://localhost:3000
```

## 스크립트 의미

| 명령어 | 목적 |
| --- | --- |
| `npm install` | 의존성 설치 |
| `npm run dev` | 로컬 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |

## Feature 폴더 맵

```txt
src/app/                  라우트 단위 페이지
src/features/onboarding   온보딩 UI와 로직
src/features/projects     프로젝트 목록/상세/등록 UI
src/features/portfolios   포트폴리오 UI와 로직
src/features/applications 지원/제안/상태 UI
src/features/profile      프로필 UI와 로직
src/shared/components     재사용 UI 컴포넌트
src/shared/lib            재사용 유틸리티
src/shared/types          공용 TypeScript 타입
src/shared/constants      공용 프론트엔드 상수
```

## 환경 변수

예시 파일을 복사해서 사용합니다.

```txt
.env.example -> .env.local
```

`.env.local`은 커밋하지 않습니다.

Supabase로 전환할 경우 아래 값도 사용합니다.

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

초기 설치와 로컬 실행 순서는 [docs/supabase-setup.md](/Users/hansol/campus-link/docs/supabase-setup.md)를 참고합니다.

## Auth 테스트 순서

1. `frontend/.env.local`에 아래 값을 채웁니다.

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

2. Supabase SQL Editor에서 `frontend/supabase/migrations/20260706_auth_user_bridge.sql` 내용을 실행합니다.
3. `frontend/` 폴더에서 `npm run dev`를 실행합니다.
4. `http://localhost:3000/auth`를 엽니다.
5. 새 이메일/비밀번호로 회원가입합니다.
6. 현재 세션 이메일이 보이는지 확인합니다.
7. 로그아웃 후 다시 로그인합니다.
8. Supabase 대시보드의 `users`, `profiles` 테이블에서 데이터가 생성됐는지 확인합니다.
