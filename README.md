# Campus Link

Campus Link는 대명캠의 아트/영상/애니메이션 인력과 성서캠의 개발/기획 인력을 연결하는 캠퍼스 협업 매칭 서비스입니다.

## MVP runtime boundary

The current MVP runs as `frontend/` (Next.js) against Supabase Auth and Supabase Postgres.
`frontend/supabase/migrations/` is the only authoritative MVP schema history.
`backend/` and its Flyway migrations are retained only for Phase 2 evaluation and are not run by Docker Compose or CI.

자세한 내용은 `backend/PHASE_2_NOT_IN_MVP.md`를 확인합니다.

## 레포지토리 구조

```txt
campus-link/
  frontend/  Next.js, TypeScript, Tailwind CSS
  backend/   Spring Boot, Java, Gradle
  docs/      기획서, DDD 설계, AI 작업 규칙
```

## 폴더 라벨

각 주요 폴더에는 개발자가 바로 볼 수 있는 README 라벨이 있습니다.

- `frontend/README.md`: 프론트엔드 역할, 실행 스크립트, UI 코드 위치
- `backend/README.md`: 백엔드 역할, Gradle 명령어, 도메인 패키지 맵
- `docs/README.md`: 기획/설계 문서의 위치와 사용 방법

## 스크립트 맵

명령어는 왼쪽 폴더로 이동한 뒤 실행합니다.

| 폴더 | 명령어 | 목적 |
| --- | --- | --- |
| 레포 루트 | `docker compose up --build` | Supabase Cloud에 연결되는 프론트엔드만 실행 |
| 레포 루트 | `docker compose down` | Docker 개발환경 종료 |
| `frontend` | `npm install` | 프론트엔드 의존성 설치 |
| `frontend` | `npm run dev` | 3000번 포트에서 Next.js 개발 서버 실행 |
| `frontend` | `npm run build` | 프론트엔드 프로덕션 빌드 |
| `frontend` | `npm run lint` | 프론트엔드 린트 검사 |

`backend`는 MVP 실행 경로에 포함되지 않습니다. 자세한 내용은 `backend/PHASE_2_NOT_IN_MVP.md`를 확인합니다.

## MVP 목표

3주 안에 아래 흐름이 작동하는 MVP를 만드는 것이 목표입니다.

1. 회원가입 또는 로그인
2. 온보딩 완료
3. 포트폴리오 정보 등록
4. 추천 프로젝트 탐색
5. 프로젝트 지원 또는 협업 제안
6. 지원 현황 확인

## 로컬 개발

### Docker Compose 권장

팀원별 Node.js 버전 차이를 줄이기 위해 Docker Compose 실행을 권장합니다. `docker-compose.yml`은 `frontend` 서비스만 정의하며, Supabase Cloud의 Auth/Postgres에 연결됩니다.

```bash
docker compose up --build
```

기본 주소:

```txt
frontend: http://localhost:3000
```

Supabase Cloud 프로젝트의 URL/공개 키가 필요합니다. 자세한 내용은 `docs/docker-development.md`와 `docs/development-setup.md`를 확인합니다.

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

기본 주소:

```txt
http://localhost:3000
```

### 백엔드 (Phase 2, MVP 실행에 불필요)

`backend/`는 현재 MVP 실행 경로가 아닙니다. Docker Compose와 CI 모두 `backend/`를 실행하지 않습니다. Phase 2 검토용으로 로컬에서 직접 실행해야 한다면 `backend/README.md`와 `backend/PHASE_2_NOT_IN_MVP.md`를 확인합니다.

## 개발 규칙

이 프로젝트는 도메인 주도 설계(DDD)를 기준으로 개발합니다. 하나의 작업은 가능하면 하나의 바운디드 컨텍스트만 수정해야 합니다.

바운디드 컨텍스트:

- Identity: 계정, 로그인, 학교 인증
- Profile: 온보딩, 역할, 툴, 협업 가능 상태
- Portfolio: 작업물, 외부 링크, 포트폴리오 검증
- Project: 프로젝트 등록, 모집, 검색, 필터
- Application: 지원하기, 제안하기, 지원 상태

개발 전에 아래 문서를 먼저 확인합니다.

- `AGENTS.md`
- `docs/architecture-ddd.md` (10장: MVP 품질 Tier)
- `docs/SECURITY_GUIDELINES.md`
- `docs/ai-task-template.md`
- `docs/feature-slices.md`

## 보안 지침

Campus Link는 학교 이메일, 프로필, 포트폴리오 자료를 다루는 서비스이므로 인증, 권한 관리, 개인정보 보호, 파일 업로드 보안을 필수 기준으로 둡니다.

주요 기준:

- 학교 이메일 인증
- 사용자별 프로필/프로젝트/지원 내역 권한 검증
- 비밀번호 해시 저장
- 서버 측 입력값 검증
- 파일 업로드 확장자와 용량 제한
- 환경변수와 API Key 커밋 금지
- 개인정보와 인증 토큰 로그 기록 금지

자세한 내용은 `docs/SECURITY_GUIDELINES.md`를 확인합니다.

## 현재 문서

- HTML 프로토타입: `docs/campus-link-ui.html`
- 기획 스펙: `docs/campus-link-spec.md`
- DDD 가이드: `docs/architecture-ddd.md`
- 보안 지침: `docs/SECURITY_GUIDELINES.md`
- AI 작업 템플릿: `docs/ai-task-template.md`
- 기능 단위 작업 목록: `docs/feature-slices.md`
- Docker 개발환경: `docs/docker-development.md`
