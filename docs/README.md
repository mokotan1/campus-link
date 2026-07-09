# Docs 폴더

이 폴더는 기획, 아키텍처, AI 협업 규칙 문서를 담당합니다.

## 문서 맵

| 파일 | 목적 |
| --- | --- |
| `campus-link-spec.md` | 제품 기획서와 MVP 범위 |
| `campus-link-ui.html` | 정적 HTML UI 프로토타입 |
| `architecture-ddd.md` | DDD 경계, 코드 소유 규칙, MVP 품질 Tier 가이드 (10장) |
| `SECURITY_GUIDELINES.md` | 인증, 권한, 개인정보, 파일 업로드 등 웹 보안 지침 |
| `notion-campus-link.md` | Notion 기획서 로컬 요약과 하위 명세서 링크 |
| `ai-task-template.md` | AI에게 기능 하나를 맡길 때 쓰는 템플릿 |
| `feature-slices.md` | 3주 MVP를 작은 기능 단위로 나눈 목록 |
| `development-setup.md` | 로컬 개발 환경 설정 가이드 |
| `docker-development.md` | Docker Compose 개발환경 실행 가이드 |

## 이 폴더를 읽는 순서

- PM은 `campus-link-spec.md`부터 확인합니다.
- 개발자는 `development-setup.md`부터 확인합니다.
- Docker로 시작하는 개발자는 `docker-development.md`를 확인합니다.
- AI와 함께 개발할 때는 루트의 `AGENTS.md`, `docs/SECURITY_GUIDELINES.md`, `docs/architecture-ddd.md`(특히 10장 품질 Tier), `docs/notion-campus-link.md`, `docs/ai-task-template.md`를 먼저 확인합니다.
- 스프린트 작업 분리는 `feature-slices.md`를 기준으로 합니다.
