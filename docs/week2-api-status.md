# Week 2 API Status

## 기준

- 현재 작업 브랜치는 `codex/week2-auth-profile-portfolio`
- 구현 방식은 `Next.js App Router + Supabase` 기준
- 기존 프론트 화면은 최대한 유지하고, 내부 API 연결만 붙이는 방향으로 진행
- 이번 정리에서는 새 Supabase migration 파일을 추가하지 않음

## 완료된 흐름

### 1. 인증 / 사용자 식별

- `GET /api/auth/me`
- `POST /api/auth/bootstrap`
- Supabase Auth 세션 기준 현재 사용자 확인
- `users.auth_user_id` 기준 앱 사용자 식별
- 학교 이메일(`kmu.ac.kr`) 정책 적용

#### 인증 기준 확정

- MVP 인증 방식은 `Supabase Auth` 기준으로 사용
- Supabase 사용자 원본 ID는 `auth.users.id`
- 앱 내부 사용자 식별자는 `public.users.id`
- 두 값은 `public.users.auth_user_id = auth.users.id`로 연결
- 프로필은 `public.profiles.user_id = public.users.id` 기준으로 연결
- 즉, 서버 로직에서 최종 사용자 식별은 `auth -> users -> profiles` 순서로 따라감

#### 현재 사용자 확인 흐름

1. 브라우저에서 Supabase 세션 확인
2. 서버에서 `GET /api/auth/me` 호출
3. 세션의 `auth.users.id`로 `public.users.auth_user_id` 조회
4. 필요 시 `POST /api/auth/bootstrap`으로 `users` / `profiles` 기본 행 생성
5. 이후 프로필, 포트폴리오, 프로젝트, 지원/제안 API는 모두 이 앱 사용자 기준으로 동작

#### 학교 이메일 정책

- 현재 MVP 정책은 `kmu.ac.kr` 계열 학교 이메일만 허용
- 로그인 후 bootstrap 단계에서도 학교 이메일 여부를 다시 확인
- 학교 이메일이 아니면 앱 사용자/프로필 생성이 차단됨

### 2. 프로필 API

- `GET /api/profiles/me`
- `POST /api/profiles`
- `PUT /api/profiles/me`
- 온보딩 화면에서 실제 API 저장/조회 연결
- 현재 로그인 계정 기준 본인 프로필만 수정 가능

### 3. 포트폴리오 API

- `GET /api/portfolios/me`
- `POST /api/portfolios`
- `GET /api/profiles/{profileId}/portfolios`
- 외부 링크 URL 검증
- 포트폴리오 화면과 온보딩 단계에서 실제 데이터 연결

### 4. 프로젝트 API

- `GET /api/projects`
- `GET /api/projects/{projectId}`
- `POST /api/projects`
- `PUT /api/projects/{projectId}`
- 검색어, 캠퍼스, 역할, 상태 필터 처리
- 본인이 등록한 프로젝트만 수정 가능하도록 서버 권한 검증

### 5. 지원 / 제안 API

- `POST /api/applications`
- `GET /api/applications/me`
- `GET /api/applications/received`
- `PATCH /api/applications/{applicationId}`
- `POST /api/proposals`
- `GET /api/proposals/me`
- `PATCH /api/proposals/{proposalId}`
- 자기 프로젝트 지원 방지
- 중복 지원 방지
- 자기 자신에게 제안 방지
- 같은 프로젝트로 같은 사용자에게 중복 제안 방지
- 학교 이메일 / 프로필 생성 / 온보딩 완료 기준으로 지원·제안 자격 검증
- 모집 중인 프로젝트에만 제안 가능하도록 서버 검증

### 6. 추천 인재

- `GET /api/recommendations/talents`
- 프로젝트 화면의 추천 인재 영역을 실제 API 데이터 기준으로 연결

## 2주차 기준 완료/미완료

### 완료

- 인증 기준을 Supabase Auth 기준으로 확정
- 로그인 사용자 식별 기준 확정 (`users.auth_user_id`)
- `users` 와 `profiles` 관계 확정 (`profiles.user_id`)
- 학교 이메일 정책 반영
- 로그인/부트스트랩 시 `users.email_verified` 동기화
- 프론트에서 현재 사용자 상태 확인 흐름 제공 (`/api/auth/me`)
- 내 프로필 조회 / 생성 / 수정
- 내 포트폴리오 조회 / 등록
- 특정 프로필 포트폴리오 조회
- 프로젝트 목록 / 상세 / 생성 / 수정
- 프로젝트 검색 / 캠퍼스 / 역할 / 상태 필터
- 지원 생성 / 내가 보낸 지원 조회 / 내가 받은 지원 조회 / 상태 변경
- 제안 생성 / 내가 받은 제안 조회 / 상태 변경
- 자기 지원 / 중복 지원 / 자기 자신 제안 / 중복 제안 방지
- 학교 이메일 / 프로필 / 온보딩 완료 기준의 지원·제안 권한 검증

### 아직 남아 있거나 팀 합류 전에 재확인할 것

- `/auth` 진입 동선을 프론트 최종 UI에 맞게 정리
- 기존 프론트 브랜치와 화면 기준으로 로그인 버튼 위치 최종 합의
- 운영용 Supabase 스키마 변경 전 팀원과 중복 migration 여부 확인
- 3주차 범위인 데모 데이터 대량 시드(프로젝트 10+, 포트폴리오 10+)는 아직 별도 정리 필요

## 화면 연결 상태

- `/auth`
  - 회원가입 / 로그인 테스트 가능
- `/onboarding`
  - 기존 단계형 화면 유지
  - 로그인 안 되어 있으면 인증 패널 표시
  - 로그인 후 저장된 프로필 / 포트폴리오 데이터 이어받기 가능
- `/projects`
  - 프로젝트 목록, 필터, 추천 인재, 포트폴리오 탭 연결
- `/projects/[id]`
  - 프로젝트 상세 조회 및 지원 연결
- `/projects/new`
  - 프로젝트 등록 연결
- `/projects/portfolio/new`
  - 포트폴리오 등록 연결
- `/applications`
  - 내가 보낸 지원/제안, 내가 받은 지원/제안 확인 및 수락/거절 연결

## 이번에 같이 정리한 보완점

- 로그인 상태가 바뀌면 앱 데이터 다시 불러오도록 정리
- 로딩 상태를 기존 화면 안에서 표시
- 로그인 없이 액션 버튼을 눌렀을 때 `/auth`로 자연스럽게 유도
- 로그인 후 원래 보던 화면으로 돌아가도록 `next` 동선 정리
- 공통 에러 응답 상태 코드 보정
- 소스 코드 내 디버깅용 `console.log` 미사용 상태 유지

## 아직 팀 합류 전에 확인할 것

- 프론트 담당 브랜치와 합칠 때 `/auth` 진입 동선 최종 정리
- 실제 로그인 버튼 위치 / 네비게이션 노출 방식은 프론트 화면 기준으로 최종 결정
- Supabase 운영 데이터는 이미 존재할 수 있으므로 스키마 변경 전 팀 확인 필요

## 빠른 수동 확인 방법

### 1. 현재 사용자 확인

- 로그인 후 `/api/auth/me` 호출 시 현재 앱 사용자 정보가 내려와야 함
- 응답에는 `id`, `profileId`, `authUserId`, `email`, `schoolEmail` 등이 포함됨

### 2. 온보딩 저장 확인

- `/onboarding`에서 5단계를 완료
- 저장 후 `/projects`로 이동
- 새로고침 후에도 프로필 / 포트폴리오 입력값이 다시 채워지면 정상

### 3. 프로젝트 확인

- `/projects`에서 목록이 보이고 필터가 동작해야 함
- 프로젝트 상세 `/projects/{id}` 진입 가능해야 함

### 4. 지원 / 제안 확인

- 프로젝트 상세에서 지원
- 추천 인재 카드에서 제안
- `/applications`에서 보낸 항목 / 받은 항목 상태가 보여야 함
