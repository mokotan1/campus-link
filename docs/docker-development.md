# Docker 개발환경 가이드

이 프로젝트는 팀원별 로컬 환경 차이를 줄이기 위해 Docker Compose 개발환경을 제공합니다.

## MVP runtime boundary

The current MVP runs as `frontend/` (Next.js) against Supabase Auth and Supabase Postgres.
`frontend/supabase/migrations/` is the only authoritative MVP schema history.
`backend/` and its Flyway migrations are retained only for Phase 2 evaluation and are not run by Docker Compose or CI.

`docker-compose.yml`은 `frontend` 서비스만 정의합니다. 로컬 Postgres 컨테이너와 Spring Boot 컨테이너는 존재하지 않습니다.

## 필요한 도구

- Docker Desktop
- Git
- Supabase Cloud 프로젝트 (URL, publishable key)

Node.js를 직접 설치하지 않아도 Docker 컨테이너 안에서 실행할 수 있습니다.

## 환경 변수

호스트에 아래 값을 설정한 뒤 `docker compose up`을 실행합니다. 값은 `frontend` 컨테이너로만 전달됩니다.

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

서비스 역할 키(`SUPABASE_SERVICE_ROLE_KEY`)는 브라우저에 노출되는 `NEXT_PUBLIC_*` 값으로 절대 전달하지 않습니다. `frontend/` 폴더가 컨테이너에 그대로 마운트되므로, 서버 전용 값은 `frontend/.env.local`에 두면 컨테이너 안의 Next.js가 그대로 읽습니다.

Docker Compose는 레포 루트의 `.env` 파일도 자동으로 불러와 `${VAR}` 치환에 사용합니다. 루트에 `.env`를 두면 `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 매번 셸 환경변수로 export하지 않아도 됩니다.

## 첫 실행

레포 루트에서 실행합니다.

```bash
docker compose up --build
```

실행 후 접속 주소:

```txt
frontend: http://localhost:3000
```

## 종료

```bash
docker compose down
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

## 컨테이너 구성

| 서비스 | 역할 | 포트 |
| --- | --- | --- |
| `frontend` | Next.js 개발 서버 (Supabase Cloud에 연결) | `3000` |

`backend`와 `db` 서비스는 존재하지 않습니다. Spring Boot/PostgreSQL 스택은 Phase 2 평가용으로만 유지되며 자세한 내용은 `backend/PHASE_2_NOT_IN_MVP.md`를 확인합니다.

## 개발 방식

- 프론트엔드 코드는 `frontend/` 폴더에서 수정합니다.
- 데이터베이스는 Supabase Cloud의 Postgres를 사용합니다. 스키마 변경은 `frontend/supabase/migrations/`에 추가합니다.

## 주의사항

- `.env` 파일은 커밋하지 않습니다.
- Docker Desktop이 실행 중이어야 합니다.
- 처음 실행은 이미지 다운로드 때문에 시간이 걸릴 수 있습니다.
