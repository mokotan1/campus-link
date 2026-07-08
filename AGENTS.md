# AI 에이전트 작업 지침

Campus Link에서 AI 에이전트가 코드를 작성하거나 수정할 때는 이 문서를 먼저 확인합니다. 세부 보안 기준은 `docs/SECURITY_GUIDELINES.md`를 따릅니다.

## 프로젝트 개요

Campus Link는 대명캠의 아트, 영상, 애니메이션 인력과 성서캠의 개발, 기획 인력을 연결하는 캠퍼스 협업 매칭 서비스입니다.

MVP 핵심 흐름은 다음과 같습니다.

1. 회원가입 또는 로그인
2. 온보딩 완료
3. 포트폴리오 정보 등록
4. 추천 프로젝트 탐색
5. 프로젝트 지원 또는 협업 제안
6. 지원 현황 확인

## 기본 원칙

- 기능 구현 전에 관련 도메인 경계를 확인합니다.
- 한 작업은 가능하면 하나의 바운디드 컨텍스트 안에서 처리합니다.
- 인증, 권한, 입력값 검증, 개인정보 보호는 선택 기능이 아니라 기본 구현 기준입니다.
- 비밀값, API Key, 토큰, 비밀번호는 소스 코드와 문서 예시에 직접 넣지 않습니다.
- 사용자 입력은 클라이언트와 서버에서 모두 검증하되, 최종 판단은 서버에서 수행합니다.
- 기존 사용자 변경사항을 되돌리지 않습니다.

## 바운디드 컨텍스트

백엔드는 DDD 기반 모듈러 모놀리스로 개발합니다.

```txt
identity     계정, 로그인, 학교 인증
profile      온보딩, 역할, 툴, 협업 가능 상태
portfolio    작업물, 외부 링크, 포트폴리오 검증
project      프로젝트 등록, 모집, 검색, 필터
application  지원하기, 제안하기, 지원 상태
common       공통 응답, 예외, 보안, 검증
```

프론트엔드는 기능 단위 구조를 사용합니다.

```txt
features/auth
features/onboarding
features/profile
features/portfolios
features/projects
features/applications
features/recommendations
shared/api
shared/components
shared/constants
shared/lib
shared/types
```

## 보안 구현 체크리스트

- 로그인 사용자 여부를 서버에서 확인합니다.
- 사용자가 해당 프로필, 프로젝트, 포트폴리오, 지원 내역을 수정할 권한이 있는지 확인합니다.
- 비밀번호는 평문 저장하지 않습니다.
- 인증 토큰과 개인정보를 로그에 남기지 않습니다.
- 파일 업로드는 확장자, MIME 타입, 파일 크기를 제한합니다.
- Supabase Service Role Key 같은 서버 전용 키를 프론트엔드에 노출하지 않습니다.
- 에러 응답에 DB 정보, 서버 경로, 스택트레이스를 노출하지 않습니다.
- CORS는 필요한 프론트엔드 출처만 허용합니다.

## 백엔드 작업 규칙

- API 그룹은 바운디드 컨텍스트 기준으로 나눕니다.
- Controller는 DB에 직접 접근하지 않습니다.
- Service 계층에서 인증, 권한, 도메인 규칙을 검증합니다.
- Repository 계층만 DB 접근을 담당합니다.
- JPA Entity를 API 응답으로 직접 반환하지 않습니다.
- DB 변경은 Flyway migration으로 관리합니다.
- enum 값은 `docs`의 enum 기준표와 프론트엔드 상수에 맞춥니다.

권장 API 그룹:

```txt
/api/auth
/api/profiles
/api/portfolios
/api/projects
/api/applications
/api/proposals
/api/recommendations
```

## 프론트엔드 작업 규칙

- Next.js App Router와 TypeScript를 기준으로 작업합니다.
- 페이지 파일은 조립 역할만 하고, 실제 UI와 로직은 `features` 또는 `shared`로 분리합니다.
- API 호출은 공통 client와 feature별 API 모듈을 통해 수행합니다.
- 폼은 React Hook Form과 Zod 기준으로 설계합니다.
- 프론트엔드는 권한 판단을 보조할 수 있지만, 최종 권한 검증은 백엔드가 수행합니다.
- loading, empty, error, unauthorized, forbidden 상태를 주요 화면에 포함합니다.
- enum 문자열을 화면마다 하드코딩하지 않고 `shared/constants`에서 관리합니다.

## 문서 우선순위

작업 전 아래 문서를 우선순위대로 확인합니다.

1. `docs/SECURITY_GUIDELINES.md`
2. `docs/architecture-ddd.md`
3. `docs/ai-task-template.md`
4. `docs/feature-slices.md`
5. `docs/notion-campus-link.md`
6. Notion의 백엔드/프론트엔드 시스템 기획서와 API 명세서

## 작업 완료 전 확인

- 변경한 기능과 관련된 테스트 또는 빌드 명령을 실행합니다.
- 문서만 변경한 경우 링크와 Markdown 구조를 확인합니다.
- DB 변경이 있으면 migration과 테스트를 확인합니다.
- API 변경이 있으면 요청/응답 예시와 프론트 타입을 함께 확인합니다.
- 기존 사용자 변경사항을 되돌리지 않습니다.
