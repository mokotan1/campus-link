# Next.js Supabase Auth Design

## 목표

Campus Link를 Next.js + Supabase 기준으로 전환하면서, 오늘 안에 회원가입/로그인/세션 확인/로그아웃과 `users`, `profiles` 기본 데이터 생성을 끝낸다.

## 현재 상태

- `frontend/src/app/auth/page.tsx`에 인증 테스트 화면이 있다.
- `frontend/src/features/auth/components/auth-panel.tsx`에서 Supabase Auth 회원가입/로그인을 직접 호출하고 있다.
- `frontend/src/lib/supabase/client.ts`, `server.ts`, `env.ts`가 있어 Supabase 클라이언트 생성은 이미 가능하다.
- Supabase 프로젝트 생성과 환경 변수 입력은 완료되었다.
- Spring Boot 기반 인증 실험은 참고용으로 남아 있지만, 최종 진행 방향은 Next.js + Supabase다.

## 오늘 완료할 범위

1. 이메일/비밀번호 회원가입
2. 이메일/비밀번호 로그인
3. 현재 로그인 세션 표시
4. 로그아웃
5. 회원가입 성공 직후 `users`, `profiles` 기본 row 생성

## 오늘 하지 않을 범위

- 이메일 인증 메일 흐름
- 비밀번호 재설정
- 소셜 로그인
- `projects`, `portfolio_items`, `applications` CRUD
- 세부 온보딩 입력 폼
- 권한 정책(RLS) 고도화

## 추천 방식

### 방식 A: 프론트에서 Auth만 처리

- 장점: 가장 빠르다.
- 단점: 인증은 되지만 서비스 사용자 데이터가 비어 있게 된다.

### 방식 B: Auth + 기본 사용자 데이터 생성

- 장점: 내일 `projects`와 프로필 저장을 붙이기 쉽다.
- 단점: 오늘 작업량이 조금 늘어난다.

### 결정

오늘은 **방식 B**로 진행한다.

## 구조 설계

### 1. 인증 UI

기존 `/auth` 페이지와 `AuthPanel`을 재사용한다.

- 회원가입 모드
- 로그인 모드
- 현재 세션 이메일 표시
- 로그아웃 버튼
- 성공/실패 메시지 표시

이 화면은 오늘 검증용이므로, 복잡한 디자인보다 흐름 확인을 우선한다.

### 2. 인증 처리

회원가입과 로그인은 브라우저에서 Supabase Auth를 사용한다.

- 회원가입: `supabase.auth.signUp`
- 로그인: `supabase.auth.signInWithPassword`
- 로그아웃: `supabase.auth.signOut`
- 세션 조회: `supabase.auth.getSession`, `onAuthStateChange`

이메일 인증은 오늘 끄고, 가입 즉시 로그인 가능한 흐름으로 간다.

### 3. 사용자 기본 데이터 생성

회원가입 직후 별도 서버 경로를 호출해 `users`, `profiles` 기본 row를 만든다.

이유:

- 서비스 키는 브라우저에 두면 안 된다.
- DB 입력은 서버 쪽에서 처리하는 편이 안전하다.
- 이후 온보딩/프로필 저장과 연결하기 쉽다.

### 4. 서버 경로 역할

Next.js의 서버 라우트 하나를 추가한다.

이 라우트는 다음 일을 담당한다.

- 요청 바디에서 Supabase Auth `user.id`, 이메일을 받는다.
- `users` 테이블에 기본 사용자 row를 upsert한다.
- `profiles` 테이블에 기본 프로필 row를 upsert한다.
- 이미 존재하면 중복 생성 없이 통과시킨다.

오늘은 검증 속도를 위해 idempotent하게 동작하게 만든다.

### 5. 데이터 규칙

오늘은 최소 데이터만 넣는다.

`users`
- `id`: Supabase Auth user id와 동일
- `email`
- 필요한 기본 상태값

`profiles`
- `user_id`
- 표시 이름 초깃값은 이메일 앞부분 또는 빈 값
- 나머지는 null/기본값

세부 필드는 기존 migration 구조를 보고 맞춘다. 오늘은 절대 새 필드를 늘리지 않는다.

## 에러 처리

- 이미 가입된 이메일: Supabase 에러 메시지 표시
- 비밀번호 규칙 불일치: Supabase 에러 메시지 표시
- 사용자 기본 데이터 생성 실패: 화면에 명확한 실패 메시지 표시
- 로그아웃 실패: 재시도 가능하도록 메시지 표시

회원가입은 되었는데 `users/profiles` 생성이 실패하는 경우를 구분해서 보여줘야 한다.

## 보안 원칙

- `service_role` 키는 서버 전용으로만 사용한다.
- `NEXT_PUBLIC_` 환경 변수에는 publishable key만 둔다.
- 브라우저에서 직접 `users`, `profiles`를 쓰지 않는다.
- 오늘은 RLS 고도화까지 가지 않더라도, 최소한 브라우저에 비밀 키를 노출하지 않는다.

## 테스트 기준

### 브라우저 테스트

1. 새 이메일로 회원가입
2. 성공 메시지 확인
3. 현재 세션 이메일 표시 확인
4. 로그아웃
5. 같은 계정으로 로그인
6. 다시 세션 표시 확인

### Supabase 확인

1. Auth 사용자 생성 확인
2. `users` 테이블 row 생성 확인
3. `profiles` 테이블 row 생성 확인

## 완료 정의

다음 조건을 모두 만족하면 오늘 목표 완료다.

- `/auth`에서 회원가입 가능
- 가입 직후 로그인 상태 확인 가능
- 로그아웃 가능
- 다시 로그인 가능
- Supabase `users`, `profiles`에 기본 데이터가 들어감

## 내일 이어질 작업

오늘 인증/기본 사용자 생성이 끝나면 내일은 아래 순서가 자연스럽다.

1. `profiles` 상세 입력 저장
2. `projects` 기본 생성/조회
3. 온보딩 흐름 연결
4. 문서 정리

## 구현 메모

- 프론트엔드 담당자와 충돌을 줄이기 위해, 오늘 수정 범위는 인증 관련 파일에 최대한 한정한다.
- Spring Boot 인증 코드는 더 이상 기준 구현으로 확장하지 않는다.
- 오늘 결과는 “인증과 사용자 생성이 되는 MVP 뼈대”로 본다.
