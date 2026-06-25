# Docker 개발환경 가이드

이 프로젝트는 팀원별 로컬 환경 차이를 줄이기 위해 Docker Compose 개발환경을 제공합니다.

## 필요한 도구

- Docker Desktop
- Git

Node.js, JDK 21, PostgreSQL을 직접 설치하지 않아도 Docker 컨테이너 안에서 실행할 수 있습니다.

## 첫 실행

레포 루트에서 실행합니다.

```bash
docker compose up --build
```

실행 후 접속 주소:

```txt
frontend: http://localhost:3000
backend:  http://localhost:8080
db:       localhost:5432
```

## 종료

```bash
docker compose down
```

## DB까지 초기화

DB 데이터를 모두 지우고 다시 시작하고 싶을 때만 사용합니다.

```bash
docker compose down -v
```

## 로그 확인

전체 로그:

```bash
docker compose logs -f
```

프론트엔드 로그:

```bash
docker compose logs -f frontend
```

백엔드 로그:

```bash
docker compose logs -f backend
```

DB 로그:

```bash
docker compose logs -f db
```

## 컨테이너 구성

| 서비스 | 역할 | 포트 |
| --- | --- | --- |
| `frontend` | Next.js 개발 서버 | `3000` |
| `backend` | Spring Boot API 서버 | `8080` |
| `db` | PostgreSQL 개발 DB | `5432` |

## 개발 방식

- 프론트엔드 코드는 `frontend/` 폴더에서 수정합니다.
- 백엔드 코드는 `backend/` 폴더에서 수정합니다.
- DB는 Docker Compose의 `db` 서비스가 제공합니다.
- 실제 Supabase 연동은 MVP 후반 또는 배포 단계에서 붙입니다.

## 주의사항

- `.env` 파일은 커밋하지 않습니다.
- Docker Desktop이 실행 중이어야 합니다.
- 처음 실행은 이미지 다운로드 때문에 시간이 걸릴 수 있습니다.
- 백엔드가 DB보다 먼저 뜨는 문제를 줄이기 위해 DB healthcheck를 사용합니다.
