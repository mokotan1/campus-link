# AI 기능 작업 템플릿

AI 에이전트에게 기능 구현, 버그 수정, 문서 작업, 리팩터링을 요청할 때 아래 형식을 사용합니다. 모든 작업은 가능하면 하나의 바운디드 컨텍스트와 하나의 사용자 목표 안에서 정의합니다.

## 작업 요약

기능명:

작업 유형:

```txt
기능 구현 / 버그 수정 / 문서 수정 / 리팩터링 / 테스트 보강 / 설정 변경
```

바운디드 컨텍스트:

```txt
Identity / Profile / Portfolio / Project / Application / Common / Frontend Shared
```

품질 Tier:

```txt
Tier 0: 경계, DB schema, 인증, 공통 enum, API 에러 형식
Tier 1: MVP 핵심 사용자 행동, 생성/수정/상태 전환
Tier 2: 목록, 필터, 조회 UI
Tier 3: stub, seed, 문서, 1회성 스크립트
```

사용자 목표:

## 범위

수정 허용 파일:

```txt
예: backend/src/main/java/com/campuslink/backend/project/**
예: frontend/src/features/projects/**
예: docs/**
```

수정 금지 파일:

```txt
예: 인증과 무관한 도메인
예: 기존 migration 수정 금지, 새 migration만 추가
예: unrelated frontend shared components
```

관련 화면:

관련 API:

관련 DB 테이블:

## 요구사항

입력:

출력:

검증 규칙:

권한 규칙:

실패 케이스:

```txt
예: 로그인하지 않은 사용자
예: 본인 리소스가 아닌 경우
예: 중복 요청
예: 존재하지 않는 ID
예: 잘못된 enum 값
```

## API 계약

요청 예시:

```json
{}
```

성공 응답 예시:

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

실패 응답 예시:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해주세요.",
    "fields": []
  }
}
```

## 프론트엔드 기준

필요한 화면 상태:

```txt
loading
empty
error
unauthorized
forbidden
submitting
success
```

필요한 컴포넌트:

필요한 폼 검증:

필요한 enum/constants:

## 백엔드 기준

필요한 계층:

```txt
presentation: Controller, Request DTO, Response DTO
application: Use case service
domain: entity, value object, enum, rule
infrastructure: JPA entity, repository, adapter
```

필요한 보안 처리:

```txt
로그인 사용자 확인
소유권 확인
입력값 검증
민감정보 로그 금지
서버 내부 정보 노출 금지
```

필요한 DB 변경:

```txt
없음 / 새 Flyway migration 필요 / seed 데이터 필요
```

## 완료 기준

- [ ] 사용자 목표가 화면 또는 API에서 확인된다.
- [ ] 관련 바운디드 컨텍스트 밖의 코드를 불필요하게 수정하지 않았다.
- [ ] 서버에서 입력값을 검증한다.
- [ ] 서버에서 인증과 권한을 검증한다.
- [ ] 성공 케이스와 실패 케이스를 확인했다.
- [ ] API 응답이 공통 응답 형식을 따른다.
- [ ] 프론트엔드 화면에 loading, empty, error 상태가 필요한 만큼 있다.
- [ ] 문서 또는 README 업데이트가 필요한 경우 반영했다.

## 검증 방법

실행 명령:

```bash
# 예시
cd backend
./gradlew test

cd frontend
npm run lint
npm run typecheck
```

수동 확인:

기대 결과:

## 참고

AI가 반드시 확인할 문서:

```txt
AGENTS.md
docs/SECURITY_GUIDELINES.md
docs/architecture-ddd.md
docs/feature-slices.md
Notion 백엔드 시스템 기획서
Notion 프론트엔드 시스템 기획서
Notion 백엔드 REST API 명세서
```

추가 메모:
