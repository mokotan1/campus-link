# Week 2 Merge Notes

이 문서는 `feature/fend` 화면 작업과 `codex/week2-auth-profile-portfolio`의 API 연결 작업을 합칠 때 확인할 내용을 정리한 메모입니다.

## 현재 방향

- 화면은 프론트 담당자가 만든 기존 UI를 최대한 유지
- 데이터 흐름은 `Next.js App Router + Supabase` 기준으로 연결
- 큰 UI 개편보다 "기존 화면에 API 붙이기"가 현재 기준

## 이번 작업에서 바뀐 핵심 성격

### 화면 파일

아래 파일은 기존 화면 위에 실제 API 연결, 로그인 상태 처리, 로딩 상태 처리를 얹은 파일입니다.

- `frontend/src/app/page.tsx`
- `frontend/src/app/onboarding/page.tsx`
- `frontend/src/app/projects/page.tsx`
- `frontend/src/app/projects/[id]/page.tsx`
- `frontend/src/app/projects/new/page.tsx`
- `frontend/src/app/projects/portfolio/new/page.tsx`
- `frontend/src/app/applications/page.tsx`
- `frontend/src/shared/components/site-header.tsx`

### 서버/API 파일

아래 파일들은 화면이 아니라 실제 데이터 처리 로직입니다.

- `frontend/src/app/api/auth/*`
- `frontend/src/app/api/profiles/*`
- `frontend/src/app/api/portfolios/*`
- `frontend/src/app/api/projects/*`
- `frontend/src/app/api/applications/*`
- `frontend/src/app/api/proposals/*`
- `frontend/src/app/api/recommendations/*`
- `frontend/src/features/*/server/*`
- `frontend/src/lib/api/response.ts`

## 합칠 때 우선 확인할 것

### 1. 로그인 진입 동선

- 메인 화면 CTA
- 헤더 로그인 버튼
- 온보딩 진입 시 로그인 필요 처리
- `/auth` 페이지 노출 방식

이 부분은 프론트 담당 UI 의도와 현재 API 연결 방식이 만나는 지점이라 먼저 맞추는 게 좋습니다.

### 2. 온보딩 화면

- 단계 UI는 유지
- 저장 시점에 `profiles` / `portfolios` API 호출
- 로그인 안 된 경우 `AuthPanel` 노출

프론트 담당자가 입력 필드나 단계 UI를 더 다듬었다면 화면은 프론트 기준, 저장 로직은 현재 API 기준으로 맞추면 됩니다.

### 3. 프로젝트 화면

- 목록 / 상세 / 등록 / 포트폴리오 등록 화면은 현재 API와 연결됨
- 버튼 동선은 프론트 UI 기준으로 남기되, 실제 액션은 현재 API 기준으로 유지하는 쪽이 안전함

### 4. 지원 / 제안 현황

- `/applications`는 내가 보낸 것 / 받은 것을 나눠서 보여줌
- 수락 / 거절 액션도 이미 연결됨

여기는 화면 수정이 있더라도 상태 구조와 액션은 지금 로직을 재사용하는 쪽이 좋습니다.

## 이번 작업에서 의도적으로 안 건드린 것

- 프론트 전체 레이아웃 구조 대개편
- 콘솔 디버그 로그 추가
- 운영 Supabase DB에 새 migration 강제 추가
- 로그인 완료 후 최종 네비게이션 UX 확정

## 팀 공지용 한 줄 설명

기존 프론트 화면을 최대한 유지한 채, Next.js 내부 API와 Supabase를 붙여서 온보딩/포트폴리오/프로젝트/지원·제안 흐름이 실제 데이터 기준으로 동작하게 연결한 상태입니다.
