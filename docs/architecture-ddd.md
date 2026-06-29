# Campus Link DDD 아키텍처

## 1. 아키텍처 목표

Campus Link는 도메인 주도 설계(DDD) 원칙으로 개발합니다. 각 개발자나 AI 에이전트가 관련 없는 영역을 건드리지 않고 한 기능씩 작업할 수 있어야 합니다.

기능 작업이 코드베이스 전체로 퍼지지 않도록 합니다. 모든 작업은 작은 수직 슬라이스(vertical slice)로 표현합니다.

- 사용자 목표 하나
- 바운디드 컨텍스트 하나
- API 그룹 하나
- 프론트엔드 라우트 또는 컴포넌트 그룹 하나
- 테스트 대상 하나

## 2. 바운디드 컨텍스트

### Identity

목적: 계정 신원과 학교 인증을 처리한다.

주요 개념:

- User
- SchoolEmail
- Campus
- Major
- VerificationStatus

담당:

- 회원가입
- 로그인
- 학교 이메일 인증
- 캠퍼스·학과 검증

소유하지 않는 것:

- 포트폴리오 작업물
- 프로젝트 모집
- 지원(application)

### Profile

목적: 협업을 위해 사용자가 누구인지 설명한다.

주요 개념:

- Profile
- RoleTag
- ToolTag
- Availability
- CollaborationPreference

담당:

- 온보딩 데이터
- 역할 선택
- 툴 선택
- 협업 가능 상태

소유하지 않는 것:

- 업로드된 포트폴리오 미디어
- 프로젝트 멤버십 결정

### Portfolio

목적: 작업 샘플로 사용자 역량을 증명한다.

주요 개념:

- PortfolioItem
- ExternalLink
- WorkRole
- MediaAsset

담당:

- 포트폴리오 항목 생성
- 외부 링크 등록
- 작업 내 역할 설명
- 포트폴리오 목록/상세

소유하지 않는 것:

- 사용자 인증
- 프로젝트 모집

### Project

목적: 협업자를 찾는 팀 또는 프로젝트를 표현한다.

주요 개념:

- Project
- RequiredRole
- ProjectStatus
- ProjectType
- ProjectTag

담당:

- 프로젝트 생성
- 프로젝트 목록/검색/필터
- 프로젝트 상세
- 모집 상태

소유하지 않는 것:

- 사용자 프로필 수정
- 프로젝트 컨텍스트 밖의 지원 상태 결정

### Application

목적: 사용자와 프로젝트 간 협업 요청을 관리한다.

주요 개념:

- Application
- Proposal
- ApplicationStatus
- ApplicationMessage

담당:

- 프로젝트 지원
- 사용자에게 협업 제안
- 수락/거절/취소
- 지원 상태 목록

소유하지 않는 것:

- 프로젝트 수정
- 포트폴리오 수정

## 3. 기능 작업 규칙

모든 AI/개발자 작업은 아래 규칙을 따릅니다.

> 작업이 명시적으로 컨텍스트 간 통합을 정의하지 않는 한, 하나의 바운디드 컨텍스트 안에서 한 기능만 다룬다.

좋은 작업 예:

- 프로젝트 목록 API 구현
- 온보딩 역할 선택 페이지 구현
- 포트폴리오 항목 생성 폼 구현
- 지원 상태 enum 및 repository 구현

나쁜 작업 예:

- 사용자 기능 전부 만들기
- 백엔드 전체 만들기
- 모든 페이지를 DB에 연결하기
- 프론트엔드와 백엔드를 한 번에 리팩터링하기

## 4. 백엔드 패키지 가이드

Spring Boot 패키지는 기술 레이어보다 **도메인 우선**으로 구성합니다.

권장 패키지 구조:

```txt
com.campuslink
  identity
    domain
    application
    infrastructure
    presentation
  profile
    domain
    application
    infrastructure
    presentation
  portfolio
    domain
    application
    infrastructure
    presentation
  project
    domain
    application
    infrastructure
    presentation
  application
    domain
    application
    infrastructure
    presentation
  common
```

레이어 의미:

- domain: 엔티티, 값 객체, enum, 도메인 규칙
- application: 유스케이스 및 서비스 오케스트레이션
- infrastructure: DB, 스토리지, 외부 서비스 구현
- presentation: REST 컨트롤러, 요청/응답 DTO

## 5. 프론트엔드 폴더 가이드

Next.js는 가능한 한 **기능(feature) 단위** 폴더를 사용합니다.

권장 구조:

```txt
src
  app
    onboarding
    projects
    portfolios
    applications
    my
  features
    onboarding
    projects
    portfolios
    applications
    profile
  shared
    components
    lib
    types
    constants
```

폴더 의미:

- app: 라우트 구조
- features: 도메인별 UI, 훅, API 클라이언트
- shared: 도메인 소유권이 없는 재사용 UI·유틸

## 6. API 그룹 가이드

REST API는 바운디드 컨텍스트를 따릅니다.

```txt
/api/auth
/api/profiles
/api/portfolios
/api/projects
/api/applications
/api/proposals
```

아래처럼 범용 API는 피합니다.

```txt
/api/data
/api/manage
/api/common
```

## 7. 완료 정의(Definition of Done)

기능은 아래를 포함할 때만 완료로 봅니다.

- 사용자 관점에서 확인 가능한 동작
- 백엔드가 포함되면 API 계약
- 검증 규칙
- 성공·실패 케이스
- 테스트 또는 체크리스트 항목 최소 1개
- 동작이 바뀌면 README 또는 스펙 업데이트

## 8. AI 작업 템플릿

각 AI 작업은 아래 형식으로 작성합니다.

```txt
기능:
바운디드 컨텍스트:
품질 Tier:
사용자 목표:
수정 허용 파일:
수정 금지 파일:
입력:
출력:
완료 기준:
테스트/확인 방법:
```

예시:

```txt
기능: 프로젝트 목록 필터
바운디드 컨텍스트: Project
사용자 목표: 캠퍼스, 역할, 상태로 프로젝트를 필터링한다.
수정 허용 파일: 프론트 프로젝트 목록 파일, 프로젝트 API 파일
수정 금지 파일: auth, portfolio, application status
입력: campus, requiredRole, status
출력: 필터링된 프로젝트 목록
완료 기준: 필터 변경 시 화면 목록이 갱신된다.
테스트/확인 방법: 프론트 페이지 실행 후 필터 조합 3가지 확인
```

## 9. 첫 구현 순서

1. 프로젝트 골격
2. 캠퍼스, 역할, 프로젝트 상태 공통 상수
3. Identity 최소 로그인/회원가입 UI
4. Profile 온보딩
5. Portfolio 등록
6. Project 등록/목록/상세
7. Application/Proposal 흐름
8. 지원 현황 페이지

## 10. MVP 품질 투자 가이드

3주 MVP에서는 모든 코드에 같은 품질을 요구하지 않습니다. 기능마다 **품질 Tier**를 정하고, Tier에 맞는 최소 기준만 충족합니다.

Tier는 **하한선**입니다. 상황에 따라 더 높은 품질을 적용해도 됩니다. 애매하면 한 단계 **올립니다**.

### 10.1 품질 Tier

| Tier | 대상 | 최소 기준 |
| --- | --- | --- |
| **0 — 필수** | BC 경계, DB 스키마, 인증, 공통 enum, API 에러 형식 | migration, FE/BE enum 동기화, 테스트 |
| **1 — 높음** | MVP 사용자 여정 핵심 (생성·수정·상태 전환) | Tier 0 + API 계약 + integration/API test 1개 이상 |
| **2 — 보통** | 목록·필터·조회 UI | 타입·린트 통과 + 수동 체크리스트 + empty state |
| **3 — 낮음** | stub, 시드, 1회성 스크립트 | 동작 확인만 |

Tier 판단 질문:

- README MVP 6단계에 직접 연결되면 Tier 0~1
- `campus-link-spec.md` 2차 기능(채팅, 알림, Storage 등)과 맞닿으면 infrastructure seam만 Tier 0 수준으로 준비
- 3곳 이상 반복되기 전까지 FE 컴포넌트는 `shared/`로 올리지 않는다

### 10.2 주차별 투자 초점

**1주차 — 경계 고정 (Tier 0 중심)**

- DB migration (Flyway 등) + `ddl-auto=validate`와 일치
- FE/BE 공통 enum·상수 (Campus, Role, ProjectStatus, ApplicationStatus)
- API 에러 형식 통일
- FE design token + primitive UI (Button, Input, Tag 등)만 `shared/`

**2주차 — 수직 슬라이스 (Tier 1 중심)**

- 슬라이스 하나 = PR 하나 = BC 하나
- domain 규칙 + API + (필요 시) migration + integration test 1개
- PR 본문에 request/response JSON 예시

**3주차 — 여정 연결 (Tier 1~2 + 데모)**

- Application/Proposal 흐름 연결
- 수동 E2E 시나리오 1개 (가입 → 온보딩 → 포트폴리오 → 지원 → 현황)
- 시드 데이터: 프로젝트 10+, 포트폴리오 10+

### 10.3 Tier별 PR 체크리스트

**모든 PR**

- [ ] 수정 BC가 하나인가
- [ ] CI 통과
- [ ] `feature-slices.md` 또는 spec과 완료 조건이 일치하는가

**Tier 0~1 추가**

- [ ] DB 변경 시 migration 포함
- [ ] domain enum 변경 시 FE `shared/constants` 동기화
- [ ] 성공·실패 케이스 각 1개 이상 (테스트 또는 PR 설명)

**Tier 2 UI PR 추가**

- [ ] `campus-link-ui.html`과 레이아웃·카피가 대략 일치
- [ ] empty state 처리

### 10.4 확장 seam (MVP에서 interface만)

2차 기능 대비를 위해 infrastructure에만 아래 seam을 둡니다. domain/application은 구현체를 모릅니다.

| Seam | MVP 구현 | 이후 교체 |
| --- | --- | --- |
| AuthProvider | JWT + 자체 User | Supabase Auth |
| FileStorage | URL 문자열만 | Supabase Storage |
| EmailVerification | stub (verified 처리) | 실제 메일 발송 |
| NotificationPublisher | no-op | Realtime / push |

### 10.5 의도적으로 약하게 가져갈 것

- Generic BaseRepository / CRUD 추상화
- 전역 상태 관리 대규모 도입
- OpenAPI 전체 자동화 (슬라이스마다 PR 본문 JSON 예시로 시작)
- 추천/매칭 엔진, 이벤트 버스, CQRS
- UI 패턴 3회 반복 전 `shared/` 추출

AI 작업 시 `ai-task-template.md`의 **품질 Tier** 필드를 반드시 채웁니다.
