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
