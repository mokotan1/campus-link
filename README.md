# Campus Link

Campus Link는 대명캠의 아트/영상/애니메이션 인력과 성서캠의 개발/기획 인력을 연결하는 캠퍼스 협업 매칭 서비스입니다.

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
| 레포 루트 | `docker compose up --build` | 프론트엔드/백엔드/DB를 한 번에 실행 |
| 레포 루트 | `docker compose down` | Docker 개발환경 종료 |
| 레포 루트 | `docker compose down -v` | Docker 개발환경 종료 및 DB 데이터 초기화 |
| `frontend` | `npm install` | 프론트엔드 의존성 설치 |
| `frontend` | `npm run dev` | 3000번 포트에서 Next.js 개발 서버 실행 |
| `frontend` | `npm run build` | 프론트엔드 프로덕션 빌드 |
| `frontend` | `npm run lint` | 프론트엔드 린트 검사 |
| `frontend` | `npm run typecheck` | TypeScript 타입 검사 |
| `backend` | `gradlew.bat bootRun` | Windows에서 Spring Boot 백엔드 실행 |
| `backend` | `./gradlew bootRun` | macOS/Linux에서 Spring Boot 백엔드 실행 |
| `backend` | `gradlew.bat test` | Windows에서 백엔드 테스트 실행 |
| `backend` | `./gradlew test` | macOS/Linux에서 백엔드 테스트 실행 |

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

팀원별 Node.js, JDK, PostgreSQL 버전 차이를 줄이기 위해 Docker Compose 실행을 권장합니다.

```bash
docker compose up --build
```

기본 주소:

```txt
frontend: http://localhost:3000
backend:  http://localhost:8080
db:       localhost:5432
```

자세한 내용은 `docs/docker-development.md`를 확인합니다.

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

### 백엔드

먼저 JDK 21을 설치해야 합니다.

```bash
cd backend
./gradlew bootRun
```

Windows에서는 아래 명령어를 사용합니다.

```bat
cd backend
gradlew.bat bootRun
```

기본 주소:

```txt
http://localhost:8080
```

## GitHub Actions (자동 검사)

이 레포는 GitHub에 코드를 올릴 때(Push) 또는 Pull Request를 만들 때, GitHub Actions가 자동으로 코드 품질을 검사합니다.  
로컬 PC 환경과 상관없이 **같은 기준**으로 프론트엔드/백엔드가 정상 빌드되는지 확인하는 안전망입니다.

### 왜 필요한가?

- 팀원 A의 PC에서는 되는데, main 브랜치에 merge하면 B의 PC에서 깨지는 상황을 줄입니다.
- PR을 merge하기 전에 lint, 타입, 빌드, 테스트를 자동으로 돌려 실수를 미리 잡습니다.
- 3주 MVP처럼 여러 사람/AI가 동시에 작업할 때, main 브랜치를 안정적으로 유지하는 데 도움이 됩니다.

### 설정 파일 위치

```txt
.github/
  workflows/
    ci.yml           PR/Push 시 자동 검사
  dependabot.yml     의존성 업데이트 PR 자동 생성
```

GitHub 웹에서 확인하는 방법:

1. 레포 페이지 상단 **Actions** 탭 클릭
2. 왼쪽에서 **CI** 워크플로 선택
3. 각 실행(Run)을 클릭하면 단계별 로그 확인 가능

### CI 워크플로 (`ci.yml`) — 언제 실행되나?

아래 경우에 자동 실행됩니다.

| 이벤트 | 설명 |
| --- | --- |
| `push` → `main` | main 브랜치에 직접 push할 때 |
| `pull_request` → `main` | main으로 향하는 PR을 만들거나 PR에 commit을 추가할 때 |

같은 PR에 commit을 여러 번 올리면, **이전 실행 중인 CI는 자동 취소**되고 최신 commit만 검사합니다. (Actions 분 절약)

### CI가 하는 일 — Job별 설명

CI는 3개의 Job으로 구성됩니다.

#### 1) 변경 파일 확인 (`changes`)

- 먼저 **어떤 폴더가 바뀌었는지** 확인합니다.
- `frontend/**`만 바뀌면 Frontend Job만 실행
- `backend/**`만 바뀌면 Backend Job만 실행
- `.github/workflows/**`가 바뀌면 양쪽 모두 실행 (워크플로 자체 변경 검증)
- `docs/**`나 README만 바뀌면 CI Job이 skip될 수 있음

#### 2) Frontend 검사 (`frontend`)

`frontend/` 코드가 변경되었을 때 Ubuntu 가상 머신에서 아래를 순서대로 실행합니다.

| 단계 | 명령어 | 하는 일 |
| --- | --- | --- |
| 의존성 설치 | `npm ci` | `package-lock.json` 기준으로 정확히 같은 버전 설치 |
| ESLint 검사 | `npm run lint` | 코드 스타일·잠재 버그 패턴 검사 |
| 타입 검사 | `npm run typecheck` | TypeScript 타입 오류 검사 (`tsc --noEmit`) |
| 빌드 | `npm run build` | Next.js 프로덕션 빌드가 성공하는지 확인 |

사용 환경: **Node.js 24** (프론트 Dockerfile과 동일)

#### 3) Backend 검사 (`backend`)

`backend/` 코드가 변경되었을 때 Ubuntu 가상 머신에서 아래를 실행합니다.

| 단계 | 명령어 | 하는 일 |
| --- | --- | --- |
| 테스트 + 빌드 | `./gradlew build --no-daemon` | JUnit 테스트 실행 후 JAR 빌드 |

사용 환경: **JDK 21** (백엔드 Gradle toolchain과 동일)

테스트 DB는 CI 전용 **H2 인메모리 DB**를 사용합니다.

- 설정 파일: `backend/src/test/resources/application.properties`
- 로컬 Docker PostgreSQL과 분리되어 있어, CI에서 DB를 따로 띄울 필요가 없습니다.
- `MODE=PostgreSQL` 옵션으로 PostgreSQL과 비슷한 SQL 문법을 사용합니다.

### Dependabot (`dependabot.yml`) — 무엇을 하나?

매주 자동으로 아래 의존성의 업데이트 PR을 만들어 줍니다.

| 대상 | 폴더 |
| --- | --- |
| npm 패키지 | `frontend/` |
| Gradle 라이브러리 | `backend/` |
| GitHub Actions 버전 | `.github/workflows/` |

Dependabot PR은 **자동 merge하지 않습니다.**  
팀원이 변경 내용을 확인한 뒤, CI가 통과하면 merge하면 됩니다.

### CI 실패 시 어떻게 하나?

1. GitHub **Actions** 탭 → 빨간 X 표시된 Run 클릭
2. 실패한 Job(`Frontend 검사` 또는 `Backend 검사`) 클릭
3. 빨간색으로 표시된 Step 로그 확인
4. 로컬에서 같은 명령어를 실행해 재현

로컬에서 CI와 동일하게 확인하는 명령어:

```bash
# Frontend
cd frontend
npm ci
npm run lint
npm run typecheck
npm run build

# Backend
cd backend
./gradlew build
```

Windows 백엔드:

```bat
cd backend
gradlew.bat build
```

### main 브랜치 보호 설정

`main` 브랜치 보호 규칙은 **CI 통과 후에만 merge** 되도록 GitHub에서 막아 주는 설정입니다.

> **중요:** 이 레포는 **Private + GitHub Free** 이면 브랜치 보호 규칙을 **아직 켤 수 없습니다.**  
> **GitHub Pro** 업그레이드 또는 레포 **Public 전환** 후 설정하세요.

자세한 단계별 설명: **`docs/branch-protection.md`**

#### 권장 규칙 (한 줄 요약)

| 설정 | 값 |
| --- | --- |
| merge 전 PR 필수 | 켜기 |
| 필수 상태 검사 | **`CI 통과`** |
| merge 전 main 최신 반영 | 켜기 |
| force push / 브랜치 삭제 | 금지 |

#### GitHub 웹 설정 경로

1. 레포 **Settings** → **Branches** (또는 **Rules → Rulesets**)
2. `main` 대상 규칙 추가
3. **Require status checks to pass before merging** → 검색 후 **`CI 통과`** 선택
4. **Require a pull request before merging** 켜기

#### Pro/Public 전환 전 팀 규칙

- `main`에 직접 push 하지 않기
- PR 생성 시 `.github/pull_request_template.md` 체크리스트 작성
- merge 전 Actions에서 CI 성공 확인

### 앞으로 추가할 수 있는 것

MVP가 진행되면 아래 워크플로를 추가할 수 있습니다.

| 워크플로 | 목적 |
| --- | --- |
| `docker.yml` | Dockerfile / docker-compose 변경 시 이미지 빌드 검증 |
| `deploy-frontend.yml` | Vercel 등 프론트 배포 자동화 |
| `deploy-backend.yml` | 백엔드 Docker production 배포 |

배포 환경(Vercel, Railway, Supabase 등)이 정해지면 그때 추가하는 것을 권장합니다.

## 개발 규칙

이 프로젝트는 도메인 주도 설계(DDD)를 기준으로 개발합니다. 하나의 작업은 가능하면 하나의 바운디드 컨텍스트만 수정해야 합니다.

바운디드 컨텍스트:

- Identity: 계정, 로그인, 학교 인증
- Profile: 온보딩, 역할, 툴, 협업 가능 상태
- Portfolio: 작업물, 외부 링크, 포트폴리오 검증
- Project: 프로젝트 등록, 모집, 검색, 필터
- Application: 지원하기, 제안하기, 지원 상태

개발 전에 아래 문서를 먼저 확인합니다.

- `docs/architecture-ddd.md`
- `docs/ai-task-template.md`
- `docs/feature-slices.md`

## 현재 문서

- HTML 프로토타입: `docs/campus-link-ui.html`
- 기획 스펙: `docs/campus-link-spec.md`
- DDD 가이드: `docs/architecture-ddd.md`
- AI 작업 템플릿: `docs/ai-task-template.md`
- 기능 단위 작업 목록: `docs/feature-slices.md`
- Docker 개발환경: `docs/docker-development.md`
- GitHub Actions CI: `.github/workflows/ci.yml` (설명은 이 README의 GitHub Actions 섹션)
- main 브랜치 보호: `docs/branch-protection.md`
