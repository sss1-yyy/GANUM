# GANUM Backend

Spring Boot 백엔드입니다. Java 21이 필요합니다.

## 실행

`backend` 디렉터리에서 실행합니다.

```bash
# macOS / Linux
./gradlew bootRun --args='--spring.profiles.active=h2'
```

```powershell
# Windows PowerShell
.\gradlew.bat bootRun --args='--spring.profiles.active=h2'
```

위 명령은 Docker 없이 H2 인메모리 데이터베이스로 실행합니다. 실행 후 API 문서는
`http://localhost:8080/swagger-ui.html`에서 확인할 수 있습니다.

macOS/Linux에서 `Permission denied`가 발생하면 저장소의 실행 권한 정보가 적용되지 않은
경우입니다. 한 번만 아래 명령을 실행한 뒤 다시 실행합니다.

```bash
chmod +x gradlew
./gradlew bootRun --args='--spring.profiles.active=h2'
```

## 테스트

```bash
# macOS / Linux
./gradlew test
```

```powershell
# Windows PowerShell
.\gradlew.bat test
```

## 선택 외부 API 설정

외부 연동은 필수가 아닙니다. `backend/.env.example`을 `backend/.env`로 복사해 키를
설정하면 적용됩니다. `.env`는 Git에 커밋하지 않습니다.

```bash
cp .env.example .env
```

```powershell
Copy-Item .env.example .env
```

- `GEMINI_API_KEY`: Gemini 채팅·레포트 생성에 사용합니다. 비어 있으면 규칙 기반 예시 문장으로 동작합니다.
- `DATA_GO_KR_SERVICE_KEY`: 공공데이터포털 주식·증권상품 시세 동기화에 사용합니다. 비어 있으면 시드 시세로 동작합니다.

공개 시세 API인 Upbit은 기본 활성화되어 있습니다. 네트워크 접근이 불가능하거나 호출에 실패하면 시드 가격을 유지합니다.
