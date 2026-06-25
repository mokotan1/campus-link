# Backend 폴더

이 폴더는 Spring Boot 백엔드를 담당합니다.

## 이 폴더에 들어가는 것

- REST API
- 도메인 규칙
- 데이터베이스 접근
- Supabase/PostgreSQL 연동
- 지원하기/제안하기 상태 로직

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

## 로컬 주소

```txt
http://localhost:8080
```

## 필수 도구

JDK 21을 설치하고 `JAVA_HOME`을 설정해야 합니다.

확인 명령어:

```bash
java -version
```

## 도메인 패키지 맵

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
