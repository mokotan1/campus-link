# 로컬 개발 환경 설정

## MVP runtime boundary

The current MVP runs as `frontend/` (Next.js) against Supabase Auth and Supabase Postgres.
`frontend/supabase/migrations/` is the only authoritative MVP schema history.
`backend/` and its Flyway migrations are retained only for Phase 2 evaluation and are not run by Docker Compose or CI.

## 필요 도구

- Node.js 24 또는 호환 LTS 버전
- npm
- Git
- Supabase Cloud 프로젝트 (URL, anon/publishable key, service role key)

## 프론트엔드 설정

```bash
cd frontend
npm install
npm run dev
```

프론트엔드 실행 주소:

```txt
http://localhost:3000
```

환경 변수 파일:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

`frontend/.env.local`에 최소 아래 값을 채웁니다.

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 값입니다. `NEXT_PUBLIC_*` 접두사를 붙이거나 브라우저로 노출하지 않습니다.

## 백엔드 (Phase 2, MVP 실행에 불필요)

`backend/`는 현재 MVP 실행 경로가 아닙니다. Phase 2 검토 목적으로만 유지되며, 로컬에서 직접 실행하려면 `backend/README.md`와 `backend/PHASE_2_NOT_IN_MVP.md`를 확인합니다.

## 로컬 환경 변수

프론트엔드:

```txt
frontend/.env.local
```

실제 환경 변수 파일은 커밋하지 않습니다. `.env.example`만 커밋합니다.

## 참고

프론트엔드는 Supabase Cloud 자격 증명만으로 로컬에서 실행하고 확인할 수 있습니다. 로컬 Postgres나 JDK는 MVP 실행에 필요하지 않습니다.
