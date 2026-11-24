# 런크크(runkk) 개발 환경 설명서 — AI 어시스턴트용

> **이 저장소에서 작업하는 AI에게**
> 이 문서는 런크크 팀의 서버, 배포, 개발 환경을 설명합니다. 코드를 바꾸거나 명령어를 알려주기 전에 끝까지 읽어 주세요.
> 앱(`frontend/`) 작업이라면 `frontend/AGENTS.md`의 규칙(Expo v58 문서 먼저 확인)도 함께 지켜 주세요.
> 특히 **9장 "절대 하면 안 되는 것"**은 반드시 지켜야 합니다. 서버 데이터가 지워지거나 비밀번호가 새어 나갈 수 있습니다.
> 이 문서와 실제 코드가 다르면 **코드가 맞습니다.** 다른 점을 사용자에게 알려 주세요.
> (기준: 2026-11-24, `main` 브랜치)

---

## 1. 프로젝트 한눈에 보기

- **런크크**: 러닝 기록, 코스 추천, 친구, 크루, 커뮤니티 기능이 있는 러닝 앱입니다. 학교 팀 프로젝트입니다.
- **저장소**: GitHub `twg041110/runkk` (모노레포)

```
runkk/
├─ frontend/                 # 앱 (Expo / React Native)
├─ backend/                  # 서버 (Spring Boot)
│  └─ API.md                 # 서버 API 목록 (실제 구현 기준)
├─ docker-compose.yml        # 서버 노트북에서 백엔드 + DB를 띄우는 설정
└─ .github/workflows/deploy.yml   # main에 푸시하면 서버 노트북에 자동 배포
```

- 저장소 루트에는 README가 없습니다. 백엔드 실행법과 API는 `backend/API.md`에 있습니다.

---

## 2. 전체 구조

```
[휴대폰 Expo Go / 에뮬레이터]
        │  HTTPS (Tailscale Funnel 공개 주소, 주소는 팀 카톡 공지)
        ▼
[서버 노트북 (Windows, 팀원 개인 노트북을 서버로 사용)]
   ├─ Tailscale Funnel:  인터넷 → 노트북 127.0.0.1:8080
   ├─ Docker Compose (프로젝트 이름: runkk)
   │    ├─ backend 컨테이너 (runkk-backend-1): Spring Boot, 포트 8080
   │    └─ db 컨테이너 (runkk-db-1): MySQL 8.4, 노트북 127.0.0.1:3307 → 컨테이너 3306
   │         └─ 데이터는 Docker 볼륨 runkk_db-data에 저장
   └─ GitHub Actions self-hosted runner (C:\actions-runner)
        └─ main에 backend 변경이 푸시되면 자동으로 다시 빌드하고 켬
```

핵심 사실은 다음과 같습니다.
- **클라우드 서버를 쓰지 않습니다.** 팀원 한 명의 Windows 노트북이 서버입니다. 노트북이 꺼지거나 잠자기에 들어가면 앱이 서버에 접속하지 못합니다.
- 백엔드와 DB 포트는 모두 `127.0.0.1`에만 열려 있습니다. 같은 와이파이에서도 IP로 직접 접속할 수 없고, 외부에서는 **Tailscale Funnel 주소(HTTPS)로만** 백엔드에 들어옵니다.
- Oracle Cloud로 옮기려고 했지만 가입 오류 때문에 보류했습니다. 아직 서버 노트북을 씁니다.

---

## 3. 서버 노트북 상세

| 항목 | 값 |
|---|---|
| OS | Windows |
| 비밀 설정 파일 | `C:\runkk\.env` (깃에 없음, 노트북에만 있음) |
| `.env`에 들어 있는 키 이름 | `DB_USER`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_SECRET` (값은 절대 공유 금지) |
| Docker Compose 프로젝트 이름 | `runkk` (`docker compose -p runkk ...`) |
| 컨테이너 | `runkk-backend-1`, `runkk-db-1` |
| DB | MySQL 8.4, DB 이름 `runkk`, 시간대 Asia/Seoul |
| DB 데이터 볼륨 | `runkk_db-data` (**지우면 서버 데이터 전부 사라짐**) |
| 백엔드 포트 | 노트북 `127.0.0.1:8080` |
| DB 포트 | 노트북 `127.0.0.1:3307` (컨테이너 안에서는 3306) |
| 공개 주소 | Tailscale Funnel → 8080. 주소는 **팀 카톡 공지에서만** 공유 |
| 배포 러너 | `C:\actions-runner\run.cmd` (창이 켜져 있어야 배포됨) |

### 3-1. 서버 상태 확인 (서버 노트북 PowerShell)

```powershell
docker ps                                  # runkk-backend-1, runkk-db-1이 Up이어야 정상
docker logs --tail 100 runkk-backend-1     # 백엔드 오류 로그 보기
docker restart runkk-backend-1             # 백엔드만 다시 켜기 (DB 데이터 유지)
tailscale funnel status                    # 공개 주소가 8080으로 연결돼 있는지
```

브라우저에서 `공개주소/api/ping`을 열었을 때 `ok`가 나오면 서버가 정상입니다.

### 3-2. DB 직접 보기 (HeidiSQL 등)

- **서버 노트북에서**: 호스트 `127.0.0.1`, 포트 `3307`, 사용자와 암호는 `.env`의 `DB_USER`/`DB_PASSWORD`(조회용 권장) 또는 `root`/`DB_ROOT_PASSWORD`, DB `runkk`.
- **다른 노트북에서**: Tailscale VPN에 같은 계정으로 들어와 있고, 서버 노트북에서 `tailscale serve --bg --tcp 3307 tcp://localhost:3307`이 켜져 있을 때만 됩니다. 이 경우 호스트는 서버 노트북의 Tailscale IP(100.x.x.x)입니다. (현재 켜져 있는지는 서버 노트북 담당자에게 확인)
- `serve`는 VPN 안에서만 열립니다. **DB를 `funnel`로 열면 인터넷에 공개되니 절대 안 됩니다.**

---

## 4. 자동 배포 (GitHub Actions)

`.github/workflows/deploy.yml`의 동작입니다.
- **언제 실행되나**: `main` 브랜치에 아래 경로가 바뀐 커밋이 푸시될 때만 실행됩니다.
  - `backend/**`, `docker-compose.yml`, `.github/workflows/deploy.yml`
  - **`frontend/`만 바뀌면 배포가 실행되지 않습니다.** 앱은 각자 Expo로 실행하기 때문입니다.
- **어디서 실행되나**: `runs-on: self-hosted`, 즉 서버 노트북의 러너에서 실행됩니다.
- **무엇을 하나**:
  ```
  docker compose -p runkk --env-file C:\runkk\.env up -d --build
  docker image prune -f
  ```
  백엔드 이미지를 새로 빌드하고(`backend/Dockerfile`: JDK 25로 `bootJar` → JRE 25로 실행), 컨테이너를 교체합니다. DB 볼륨은 그대로 남습니다.
- **서버 노트북이 꺼져 있으면**: 작업이 `Queued` 상태로 기다리다가 러너가 켜지면 실행됩니다. 하루 넘게 기다리면 GitHub가 취소할 수 있습니다. 그때는 Actions 탭에서 **Re-run**을 누르면 됩니다.
- 러너 켜기: 서버 노트북에서 `cd C:\actions-runner` 다음 `.\run.cmd` 실행. `Listening for Jobs`가 나오면 정상입니다. 창을 닫으면 러너도 꺼집니다.

---

## 5. 백엔드 (`backend/`)

| 항목 | 값 |
|---|---|
| 언어/프레임워크 | Java 25, Spring Boot 4.1.1, Gradle(wrapper 포함) |
| 주요 의존성 | Spring Data JPA(Hibernate 7), Web MVC, Validation, OAuth2 Resource Server(JWT), Lombok |
| DB 드라이버 | MariaDB 드라이버(`jdbc:mariadb://`)로 MySQL 8.4에 접속 (호환됨) |
| 패키지 | `com.example.runkk` 아래 기능별: `auth`, `member`, `run`, `course`, `crew`, `friend`, `post`, `notification`, `safety`, `common` |
| API 목록 | `backend/API.md` (실제 구현 기준) |

### 5-1. 설정 파일과 프로필

- `application.yaml`: 기본 설정입니다. `spring.profiles.include: secret`으로 `application-secret.yaml`을 함께 읽습니다.
  - `application-secret.yaml`은 `.gitignore`에 있어서 **저장소에 없습니다.** 파일이 없어도 오류는 나지 않습니다.
  - 서버(Docker)에서는 이 파일 대신 `docker-compose.yml`의 환경 변수(`SPRING_DATASOURCE_*`, `JWT_SECRET`)로 DB와 JWT 값을 넣습니다.
- `application-local.yaml`(`local` 프로필): **DB 설치 없이 내 PC에서 켜는 설정**입니다.
  - H2 파일 DB(`backend/data/`, MySQL 모드)를 씁니다. 폴더를 지우면 처음 상태로 돌아갑니다.
  - `runkk.seed: true`라서 처음 켤 때 예시 데이터(코스, 크루, 게시글, 예시 계정)가 들어갑니다(`common/LocalSeedData.java`). 예시 계정은 `backend/API.md`에 있습니다.
- JWT: `runkk.jwt.secret`(서버에서는 `.env`의 `JWT_SECRET`), 만료 14일. 값이 비어 있으면 임시 키를 써서, 서버를 다시 켤 때마다 모두 로그아웃됩니다.

### 5-2. 내 PC에서 백엔드 켜기

```powershell
cd backend
./gradlew bootRun --args='--spring.profiles.active=local'
# 확인: http://localhost:8080/api/ping → ok
```
JDK 25가 필요합니다. 테스트는 `./gradlew test`(H2 메모리 DB)로 돌립니다.

### 5-3. DB 스키마 규칙 (중요)

- **`ddl-auto: update`**: 엔티티(`@Entity`) 클래스를 바꾸면 서버가 켜질 때 테이블이 자동으로 만들어지거나 컬럼이 추가됩니다. SQL 파일로 테이블을 따로 만들지 않습니다.
  - 컬럼 **추가**는 자동입니다. 하지만 컬럼 **이름 변경, 삭제, 타입 변경은 자동으로 되지 않습니다.** 옛 컬럼이 남아서 오류가 날 수 있습니다.
- **`globally_quoted_identifiers: true`**: 테이블과 컬럼 이름을 따옴표로 감쌉니다. 그래서 **컬럼 이름이 자바 필드 이름 그대로 camelCase**입니다(예: `memberId`, snake_case 아님).
- **과거 사고 사례**: 서버에 옛 snake_case로 만든 `member` 테이블이 남아 있어서 `Unknown column 'm1_0.memberId'` 500 오류가 났습니다. 서버 노트북 담당자가 해당 테이블을 지우고 백엔드를 재시작해서 해결했습니다. 비슷한 오류가 나면 **AI가 마음대로 DB를 지우지 말고** 담당자에게 알려야 합니다.

### 5-4. 코드 관례

- 오류는 `common/ApiException`(`badRequest`, `unauthorized`, `conflict` 등)으로 던지면 `GlobalExceptionHandler`가 JSON으로 바꿔 줍니다. 메시지는 한국어로, 사용자에게 보여줄 문장으로 씁니다.
- 로그인한 사용자 정보는 `auth/CurrentUser`로 꺼냅니다.
- 테스트 메서드 이름은 영어로 쓰고, 한국어 설명은 `@DisplayName`에 넣습니다. 한글 메서드 이름은 테스트 리포트 생성이 깨집니다.

---

## 6. 프론트엔드 (`frontend/`)

| 항목 | 값 |
|---|---|
| 프레임워크 | **Expo SDK 58**, React Native 0.88.1, React 19.3, TypeScript(strict) |
| 라우팅 | expo-router, 화면 파일은 `src/app/` (파일 이름 = 주소) |
| 기타 | React Compiler 켜짐, typedRoutes 켜짐, 경로 별칭 `@/` = `src/` |
| 색상 | `src/constants/theme.ts`의 `Palette` (accent는 형광 노랑 `#F0FF00`) |
| 공용 부품 | `src/components/common/` (ConfirmDialog, Toast, ScreenHeader, icons 등) |

### 6-1. 반드시 지킬 규칙

- `frontend/AGENTS.md`: **"Expo HAS CHANGED"**. 코드를 쓰기 전에 Expo **v58** 문서(https://docs.expo.dev/versions/v58.0.0/)를 확인하세요. 예전 Expo 지식으로 쓰면 틀릴 수 있습니다.
- 패키지 설치는 `npx expo install 패키지명`으로 합니다. SDK 58에 맞는 버전이 설치됩니다.
  - `expo install`이 네트워크 문제로 안 되면 `node -e "console.log(require('expo/bundledNativeModules.json')['패키지명'])"`로 맞는 버전을 확인한 뒤 `npm install 패키지명@그버전`으로 설치합니다.
- 패키지를 추가하면 **`package.json`과 `package-lock.json`을 둘 다 커밋**합니다.
- 코드 주석은 **한국어로, 초보자도 이해할 수 있게** 씁니다. 팀 공통 스타일입니다.

### 6-2. 서버 주소

- 앱은 서버 주소를 `frontend/.env.local`의 `EXPO_PUBLIC_API_URL`에서 읽습니다(`src/constants/api.ts`).
  ```
  EXPO_PUBLIC_API_URL=https://(팀 카톡으로 받은 공개 주소)
  ```
- `.env.local`은 `.gitignore`에 있어서 저장소에 없습니다. **각자 만들어야 하고, 커밋하면 안 됩니다.**
- 앱이 켜질 때 `/api/ping`을 호출해서 결과를 `npx expo start` 터미널에 `서버 연결: ok`로 보여줍니다. `.env.local`이 없으면 경고가 뜹니다.

### 6-3. 현재 상태 (중요: 대부분 가짜 데이터)

- **로그인은 아직 가짜입니다.** `src/app/_layout.tsx`의 `signedIn` 상태만 바꿉니다. 로그인 버튼이나 "계정 없이 시작하기"를 누르면 들어갑니다. 서버의 로그인 API(JWT)는 있지만 앱과 아직 연결하지 않았습니다.
- 화면 대부분이 가짜 데이터로 그려집니다. 서버와 연결할 곳은 코드에 **`TODO(API)`** 주석으로 표시돼 있습니다.
- 화면 구성:
  - `(auth)/login`: 로그인
  - `(tabs)`: 홈, 커뮤니티, 코스, 친구, 내 정보 (탭 바는 `components/common/app-tabs.tsx`)
  - `settings/*`: 설정 화면들 (main에 합쳐짐)
  - `run/*`: 바로 러닝 흐름 (시작 → 카운트다운 → 러닝 중 → 결과). **`feature/jinhwan-running` 브랜치에만 있고 main에는 아직 없음**
- 임시 입구: 내 정보 탭의 "설정 열기 (임시)" 버튼, 그리고 러닝 브랜치의 "러닝 시작 (임시)" 버튼. 정식 입구가 생기면 지울 예정입니다.

### 6-4. 실행

```powershell
cd frontend
npm install            # 처음, 그리고 pull 받은 뒤 package.json이 바뀌었으면 매번
npx expo start         # 휴대폰 Expo Go로 QR 스캔, 또는 a 키로 안드로이드 에뮬레이터
npx tsc --noEmit       # 타입 오류 확인 (커밋 전에 0개여야 함)
```
- 휴대폰 Expo Go 앱이 **SDK 58을 지원하는 버전**이어야 합니다.
- 러닝 기능(`expo-location`, `react-native-maps`)은 폰 위치 권한과 **폰 위치(GPS) 켜짐**이 필요합니다. 실내에서는 GPS가 약해서 거리가 안 늘 수 있습니다.

---

## 7. 팀원 PC에 필요한 것

| 하는 일 | 필요한 것 |
|---|---|
| 앱만 개발 | Node.js, Git(또는 GitHub Desktop), `frontend/.env.local`, 휴대폰 Expo Go 또는 Android Studio 에뮬레이터 |
| 백엔드도 개발 | 위 + **JDK 25**. DB 설치는 필요 없음(`local` 프로필 사용) |
| 서버 노트북 담당 | Docker Desktop, Tailscale, `C:\runkk\.env`, `C:\actions-runner` |

저장소에 **없어서 따로 받아야 하는 것**은 다음과 같습니다.
- `frontend/.env.local`: 서버 주소. 팀 카톡에서 받습니다.
- `C:\runkk\.env`: 서버 노트북에만 있습니다. 다른 팀원은 필요 없습니다.
- `backend/src/main/resources/application-secret.yaml`: 선택입니다. 각자 로컬 DB를 쓸 때만 직접 만듭니다. 보통은 `local` 프로필이라 필요 없습니다.

---

## 8. Git 작업 방식

- **기능마다 브랜치를 만듭니다.** 이름에 본인 이름을 넣습니다(예: `feature/jinhwan-running`).
- 완성되면 `main`에 합칩니다(GitHub Desktop의 merge 또는 GitHub Pull Request).
- **`main`에 `backend/`가 바뀐 커밋이 들어가면 곧바로 서버에 배포됩니다.** 백엔드 변경은 `./gradlew test`가 통과한 뒤 합칩니다.
- 다른 팀원이 맡은 화면 파일은 그 사람과 상의 없이 고치지 않습니다. 공용 파일(`_layout.tsx`, `components/common/*`)은 꼭 필요한 줄만 바꿉니다.
- 합쳐진 브랜치는 지워도 됩니다.

---

## 9. 절대 하면 안 되는 것 (AI 포함 모두)

1. **비밀 파일을 커밋하지 않습니다**: `.env`, `.env.local`, `application-secret.yaml`, 키 파일(`*.jks`, `*.p12`, `*.key` 등).
2. **비밀번호, 토큰, API 키, 서버 공개 주소를 저장소, 노션, 문서에 적지 않습니다.** 서버 주소는 팀 카톡으로만 공유합니다.
3. **`docker compose down -v`, `docker volume rm runkk_db-data`를 실행하지 않습니다.** `-v`는 DB 데이터를 통째로 지웁니다. 재시작이 필요하면 `docker restart runkk-backend-1`을 씁니다.
4. **DB 포트(3307)를 `tailscale funnel`로 열지 않습니다.** DB가 인터넷에 공개됩니다. 필요하면 VPN 전용인 `tailscale serve`만 씁니다.
5. **`docker-compose.yml`의 `127.0.0.1:` 바인딩을 지우지 않습니다.** 지우면 포트가 외부에 열립니다.
6. 서버 DB의 테이블이나 데이터를 지우는 명령(`DROP`, `DELETE`, `TRUNCATE`)을 **사용자 확인 없이 제안하거나 실행하지 않습니다.**
7. 사용자가 요청하지 않았으면 `main`에 직접 푸시하지 않습니다.

---

## 10. 자주 나는 문제

| 증상 | 원인과 해결 |
|---|---|
| 앱 터미널에 `서버 연결 실패` | 서버 노트북이 꺼졌거나 잠자기 상태, 또는 `.env.local` 주소 오류. 서버 담당자에게 확인 |
| `EXPO_PUBLIC_API_URL이 없어요` 경고 | `frontend/.env.local`이 없음. 만든 뒤 `npx expo start`를 다시 실행 |
| 서버 500, `Unknown column ...` | 옛 테이블 구조가 남은 것(5-3 참고). 서버 담당자에게 알림. DB를 함부로 지우지 않음 |
| GitHub Actions 배포가 `Queued`에서 멈춤 | 서버 노트북이 꺼졌거나 러너(`run.cmd`)가 꺼짐 |
| pull 받은 뒤 앱이 빨간 오류 (모듈 없음) | `npm install`을 안 함 |
| `Location request failed due to unsatisfied device settings` | 폰의 위치(GPS) 스위치가 꺼짐. 빠른 설정에서 위치를 켬 (러닝 브랜치는 팝업으로 안내하도록 고침) |
| Expo Go에서 프로젝트가 안 열림 | Expo Go 버전이 SDK 58과 안 맞음. 앱 업데이트 |
| 백엔드 테스트 리포트 생성 오류 | 테스트 메서드 이름이 한글임. 영어 이름 + `@DisplayName` |
