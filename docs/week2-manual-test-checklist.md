# Week 2 Manual Test Checklist

## 목적

- 프론트 화면을 크게 바꾸지 않고 붙인 `Next.js + Supabase` API 연결이 실제로 동작하는지 확인한다.
- 인증, 온보딩, 포트폴리오, 프로젝트, 지원, 제안 흐름을 손으로 빠르게 점검한다.

## 시작 전

### 1. 프론트 실행

`frontend` 폴더에서 실행:

```bash
npm run dev
```

정상이라면 브라우저에서 `http://localhost:3000` 접속 가능해야 한다.

### 2. 테스트 계정 준비

- Supabase Auth에 가입된 학교 메일 계정 사용
- 현재 정책상 `kmu.ac.kr` 메일만 허용

## 1. 인증 / 현재 사용자 확인

### 브라우저 확인

1. `http://localhost:3000/auth` 접속
2. 로그인 또는 회원가입
3. 성공 후 다시 원래 화면으로 이동되는지 확인

### API 확인

새 터미널에서:

```bash
curl http://localhost:3000/api/auth/me
```

### 성공 기준

- `success: true`
- `id`, `profileId`, `authUserId`, `email` 값이 내려온다
- 학교 메일이면 `schoolEmail: true`

## 2. 온보딩 / 프로필 저장 확인

### 브라우저 확인

1. `http://localhost:3000/onboarding` 접속
2. 5단계를 끝까지 입력
3. 마지막 저장 후 프로젝트 화면으로 이동
4. 다시 `/onboarding`으로 돌아와 입력값이 유지되는지 확인

### 성공 기준

- 저장 에러가 없어야 한다
- 새로고침 후에도 이름, 캠퍼스, 학과, 역할, 협업 가능 상태가 다시 채워진다
- 온보딩 완료 상태 기준으로 이후 프로젝트/지원 기능이 열려야 한다

## 3. 포트폴리오 등록 확인

### 브라우저 확인

1. `/projects?tab=portfolio` 또는 포트폴리오 작성 화면 진입
2. 링크, 작업물 내 역할 등 입력 후 저장
3. 다시 포트폴리오 탭에서 방금 등록한 항목 확인

### API 확인

브라우저 로그인 상태에서 개발자도구 콘솔:

```js
fetch("/api/portfolios/me").then((res) => res.json()).then(console.log)
```

### 성공 기준

- `success: true`
- 배열 형태 데이터가 내려온다
- 방금 입력한 링크/설명이 포함된다

## 4. 프로젝트 등록 / 조회 확인

### 브라우저 확인

1. `/projects/new` 접속
2. 프로젝트 등록
3. `/projects`에서 새 프로젝트가 보이는지 확인
4. 카드 클릭 후 상세 페이지 진입 확인

### API 확인

새 터미널:

```bash
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/projects/1
```

프로젝트 ID는 실제 등록된 값으로 바꿔도 된다.

### 성공 기준

- 목록 API에서 프로젝트 배열이 보인다
- 상세 API에서 제목, 요약, 캠퍼스, 모집 역할, 작성자 정보가 보인다

## 5. 지원하기 확인

### 브라우저 확인

1. 다른 사용자가 만든 프로젝트 상세 진입
2. 지원하기 실행
3. `/applications`에서 내가 보낸 지원으로 보이는지 확인

### 서버 규칙 확인

- 자기 프로젝트에는 지원 불가
- 같은 프로젝트 중복 지원 불가
- 학교 메일 / 프로필 생성 / 온보딩 완료 조건 필요

### 성공 기준

- 성공 시 `/applications`에 `지원` 항목이 추가된다
- 실패 시 이유가 문장으로 표시된다

## 6. 제안하기 확인

### 브라우저 확인

1. `/projects` 추천 인재 카드에서 제안하기 실행
2. `/applications`에서 내가 보낸 제안으로 보이는지 확인

### 서버 규칙 확인

- 내 프로젝트로만 제안 가능
- 모집 중인 프로젝트로만 제안 가능
- 자기 자신에게 제안 불가
- 같은 프로젝트로 같은 사용자에게 중복 제안 불가
- 학교 메일 / 프로필 생성 / 온보딩 완료 조건 필요

### 성공 기준

- 성공 시 `/applications`에 `제안` 항목이 추가된다
- 받은 쪽에서는 `received` 목록으로 확인 가능하다

## 7. 받은 지원 / 받은 제안 처리 확인

### 브라우저 확인

1. 내 프로젝트에 누군가 지원하거나 제안이 들어온 상태 준비
2. `/applications`에서 `내가 받은 응답` 탭 진입
3. 수락 / 거절 버튼 눌러 상태 변경

### 성공 기준

- 상태가 `대기`에서 `수락` 또는 `거절`로 변경
- 이미 처리된 항목은 다시 처리되지 않아야 함

## 8. 추천 인재 확인

### 브라우저 확인

1. `/projects` 진입
2. 추천 인재 카드 영역 확인

### 성공 기준

- 온보딩 완료 + 협업 가능 상태인 인재만 보여야 함
- 이름, 캠퍼스, 학과, 역할, 소개, 툴 정보가 카드에 보인다

## 빠른 체크 명령 모음

```bash
curl http://localhost:3000/api/auth/me
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/projects/1
curl http://localhost:3000/api/applications/me
curl http://localhost:3000/api/proposals/me
```

로그인 세션이 필요한 API는 브라우저 콘솔 `fetch(...)`로 확인하는 편이 더 쉽다.

## 참고

- 이번 브랜치에서는 새 Supabase migration 파일을 추가하지 않았다.
- 소스 코드 안에 디버깅용 `console.log`는 넣지 않았다.
- 기존 프론트 화면을 유지하면서 API 연결 위주로 붙였다.

## 9. Backend rollout verification (B3 / B5 / B6 / B7 / B9)

Local automated evidence for Task 12 (2026-07-14). Remote migration push is **PENDING operator backup confirmation** (Tasks 3/5 remote blocked). Do not treat remote as live until push + smoke pass.

### Local verification status (this run)

| Check | Result |
| --- | --- |
| 
ode --test all src/**/*.test.mjs | PASS (52 tests, 0 fail) |
| 
pm run typecheck | PASS |
| 
pm run lint | PASS |
| 
pm run build | PASS |
| supabase/tests/rls-p0.sql (local Docker) | PASS |
| supabase/tests/project-recruitment-migration.sql (local Docker) | PASS |
| supabase/tests/remote-rollout-smoke.sql (local Docker) | PASS |
| Remote db push / advisors / two-account API against cloud | SKIPPED (awaiting operator) |

### B3 — Recruitment deadline / closed exposure

Smoke once remote is live (signed-in browser or etch with session cookie):

1. Create or use a project with project_status=RECRUITING and ecruitment_deadline in the past → apply / propose must fail (INVALID_STATE_TRANSITION or equivalent 4xx).
2. Same project with deadline = today or future → apply / propose allowed (other eligibility rules still apply).
3. Closed project → apply / propose rejected; must not appear in project recommendations.

`	ext
POST /api/applications          → future/today success; past/closed rejected
POST /api/proposals             → owned open project only; past/closed rejected
GET  /api/recommendations/projects → no closed/expired project IDs
`

### B5 — Application transition response contract

Owner-only accept/reject; applicant-only withdraw. Response must echo requested application id and exact terminal status.

`	ext
POST /api/applications/:id/accept   → owner only; body id + ACCEPTED
POST /api/applications/:id/reject   → owner only; body id + REJECTED
POST /api/applications/:id/withdraw → applicant only; body id + CANCELED
repeat any terminal transition      → 409 INVALID_STATE_TRANSITION
`

### B6 — Proposal create conditions

`	ext
POST /api/proposals
  - sender must own an open (non-expired) recruiting project
  - receiver must be email-verified, onboarding-complete, collaboration OPEN
  - sender ≠ receiver; duplicate project/sender/receiver rejected
`

### B7 — Mine list

`	ext
GET /api/projects/mine
  - signed out → 401
  - signed in  → only caller-owned rows; each item includes projectStatus + recruitmentDeadline
`

### Endpoints to smoke-test once remote is live

`ash
curl http://localhost:3000/api/auth/me
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/projects/mine
curl http://localhost:3000/api/applications/me
curl http://localhost:3000/api/proposals/sent
curl http://localhost:3000/api/proposals/received
curl http://localhost:3000/api/recommendations/projects
`

Session-required routes: prefer browser DevTools etch(...) while logged in.

Two-account matrix (after remote push):

`	ext
application create: future/today success; past/closed rejected
application accept/reject: owner only; response id/status correct
application withdraw: applicant only; response id/CANCELED correct
proposal create: owned open project + eligible receiver only
recommendations: no closed/expired project IDs
GET /api/projects/mine: 401 signed out; only caller-owned rows signed in
repeat transition: 409 INVALID_STATE_TRANSITION
`

### Type-generation handoff (after remote schema is authoritative)

Remote push is **PENDING operator backup confirmation**. After push succeeds through the required migration tail, regenerate types (separate worker commit). Do **not** hand-edit database.types.ts.

`	ext
project ref: cwbmfnenunqzwwypqipc
required migration tail after push: 20260714024052 (matching) or at least 20260714014555
output: frontend/src/lib/supabase/database.types.ts
command family: npx.cmd supabase gen types typescript --project-id cwbmfnenunqzwwypqipc
`

Expected generated surface: projects.project_status, projects.recruitment_deadline, proposals, transition RPCs (pplicant_withdraw_application, owner_decide_application, eceiver_decide_proposal, sender_cancel_proposal), and get_matching_eligibility.

### Operator remains

1. Confirm backup / PITR recovery point.
2. supabase link to cwbmfnenunqzwwypqipc if needed; repair history if cover-image mismatch.
3. Remote db push through 20260714024052 (or at least 20260714014555).
4. Run emote-rollout-smoke.sql read-only against remote; re-check advisors.
5. Two-account API smoke (section above).
6. Type-gen worker → commit updated rontend/src/lib/supabase/database.types.ts.