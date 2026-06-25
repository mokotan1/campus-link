# Frontend 폴더

이 폴더는 Next.js 프론트엔드를 담당합니다.

## 이 폴더에 들어가는 것

- 화면 라우트
- UI 컴포넌트
- 기능별 프론트엔드 로직
- API 클라이언트 코드
- 온보딩, 프로젝트, 포트폴리오, 지원 현황 화면 상태

## 주요 스크립트

아래 명령어는 `frontend/` 폴더에서 실행합니다.

```bash
npm install
npm run dev
npm run build
npm run lint
```

## 로컬 주소

```txt
http://localhost:3000
```

## 스크립트 의미

| 명령어 | 목적 |
| --- | --- |
| `npm install` | 의존성 설치 |
| `npm run dev` | 로컬 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 검사 |

## Feature 폴더 맵

```txt
src/app/                  라우트 단위 페이지
src/features/onboarding   온보딩 UI와 로직
src/features/projects     프로젝트 목록/상세/등록 UI
src/features/portfolios   포트폴리오 UI와 로직
src/features/applications 지원/제안/상태 UI
src/features/profile      프로필 UI와 로직
src/shared/components     재사용 UI 컴포넌트
src/shared/lib            재사용 유틸리티
src/shared/types          공용 TypeScript 타입
src/shared/constants      공용 프론트엔드 상수
```

## 환경 변수

예시 파일을 복사해서 사용합니다.

```txt
.env.example -> .env.local
```

`.env.local`은 커밋하지 않습니다.
