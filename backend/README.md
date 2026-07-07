# Backend 폴더

이 폴더는 Spring Boot 기반 실험 서버와 초기 백엔드 구조를 담고 있습니다.

현재 MVP 메인 구현은 `frontend/`의 Next.js API Route + Supabase 기준으로 진행 중입니다.  
즉, 이 폴더는 **참고용 기초 서버 / 실험용 구조**에 가깝고, 팀이 다시 Spring 중심으로 정리하기 전까지는 보조 역할로 봐도 됩니다.

## 이 폴더에 들어가는 것

- Spring Boot 실행 골격
- 헬스 체크
- 공통 응답/예외 형식 초안
- Flyway 기반 초기 마이그레이션
- PostgreSQL / Supabase 연결 실험 설정

## 주요 스크립트

아래 명령어는 `backend/` 폴더에서 실행합니다.

### Windows

```bat
gradlew.bat bootRun
gradlew.bat test
gradlew.bat build
```

### macOS/Linux

```bash
./gradlew bootRun
./gradlew test
./gradlew build
```

레포 루트에서 Docker로 실행할 수도 있습니다.

```bash
docker compose up backend db
```

## 로컬 주소

```txt
http://localhost:8080
```

## 현재 상태

현재 이 폴더에서 실제로 확인 가능한 것은 주로 아래입니다.

- `/api/health`
- `/api/infrastructure/supabase`
- Flyway 기초 마이그레이션

프로필 / 프로젝트 / 포트폴리오 / 지원 API의 실제 MVP 동작은 현재 `frontend/src/app/api` 쪽에 구현되어 있습니다.

## 필수 도구

JDK 21을 설치하고 `JAVA_HOME`을 설정해야 합니다.

확인 명령어:

```bash
java -version
```

## 도메인 패키지 맵 초안

```txt
src/main/java/com/campuslink/backend/
  identity/     계정, 로그인, 학교 인증
  profile/      온보딩, 역할, 툴, 협업 가능 상태
  portfolio/    작업물, 외부 링크, 포트폴리오 검증
  project/      프로젝트 등록, 모집, 검색, 필터
  application/  지원하기, 제안하기, 지원 상태
  common/       특정 도메인에 속하지 않는 공용 코드
```

## 환경 변수

로컬 비밀값이 필요할 때 예시 파일을 복사해서 사용합니다.

```txt
.env.example -> .env
```

`.env`는 커밋하지 않습니다.

### 로컬 PostgreSQL로 실행할 때

`backend/.env` 예시:

```txt
SPRING_PROFILES_ACTIVE=local
DATABASE_URL=jdbc:postgresql://localhost:5432/campus_link
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
```

### Supabase Postgres로 실행할 때

`backend/.env` 예시:

```txt
SPRING_PROFILES_ACTIVE=supabase
SUPABASE_DB_URL=jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-db-password
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Supabase를 쓸 때도 백엔드 작업은 계속 이 `backend/` 폴더에서 진행합니다. 다만 DB와 인증 인프라를 Supabase가 맡고, Spring Boot는 API 구조와 서버 로직을 담당하는 방식입니다.

실행:

```bash
cd backend
./gradlew bootRun
```

중요:

- Supabase DB 비밀번호는 대시보드에서 직접 만든 값을 사용합니다.
- JDBC URL은 Supabase의 연결 정보 기준으로 넣고, 보통 `sslmode=require`를 함께 사용합니다.
- 인증을 나중에 붙일 때는 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`를 사용하게 됩니다.

## 현재 Spring 기초 작업

- `/api/health` 헬스 체크 엔드포인트
- `/api/infrastructure/supabase` Supabase 설정 확인 엔드포인트
- 공통 API 응답 형식
- 공통 예외 응답 형식
- 로컬 프론트엔드(`localhost:3000`)용 CORS 설정
- Flyway 기반 DB 마이그레이션 시작
- `users`, `profiles`, `projects`, `portfolio_items`, `applications` 기본 테이블 초안

## 지금 이 폴더에서 안 하고 있는 것

- 현재 로그인 / 회원가입 메인 흐름 구현
- 현재 MVP API 메인 구현
- 프론트와 직접 붙는 운영용 API 확장

위 항목은 지금 기준 `frontend/` + Supabase 조합에서 진행 중입니다.
