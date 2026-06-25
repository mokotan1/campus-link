# 로컬 개발 환경 설정

## 필요 도구

- Node.js 24 또는 호환 LTS 버전
- npm
- JDK 21
- Git

## 프론트엔드 설정

```bash
cd frontend
npm install
npm run dev
```

프론트엔드 실행 주소:

```txt
http://localhost:3000
```

환경 변수 파일:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

## 백엔드 설정

JDK 21을 설치한 뒤 아래 명령이 동작하는지 확인합니다.

```bash
java -version
```

백엔드 실행:

```bash
cd backend
./gradlew bootRun
```

Windows:

```bat
cd backend
gradlew.bat bootRun
```

백엔드 실행 주소:

```txt
http://localhost:8080
```

## 로컬 환경 변수

프론트엔드:

```txt
frontend/.env.local
```

백엔드:

```txt
backend/.env
```

실제 환경 변수 파일은 커밋하지 않습니다. `.env.example`만 커밋합니다.

## 참고

JDK 21이 설치되지 않았거나 PATH에 없으면 백엔드를 실행할 수 없습니다. 프론트엔드는 JDK 없이도 로컬에서 실행하고 확인할 수 있습니다.
