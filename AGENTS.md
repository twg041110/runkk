# 런크크(runkk) 개발 환경 설명서 — AI 어시스턴트용

> **이 저장소에서 작업하는 AI에게**
> 이 문서는 런크크 팀의 서버, 배포, 개발 환경을 설명합니다. 코드를 바꾸거나 명령어를 알려주기 전에 끝까지 읽어 주세요.
> 앱(`frontend/`) 작업이라면 `frontend/AGENTS.md`의 규칙(Expo v58 문서 먼저 확인)도 함께 지켜 주세요.
> 특히 **9장 "절대 하면 안 되는 것"**은 반드시 지켜야 합니다. 서버 데이터가 지워지거나 비밀번호가 새어 나갈 수 있습니다.
> 이 문서와 실제 코드가 다르면 **코드가 맞습니다.** 다른 점을 사용자에게 알려 주세요.
> (기준: 2026-11-25, `main` 브랜치. 서버는 AWS EC2)

---

## 1. 프로젝트 한눈에 보기

- **런크크**: 러닝 기록, 코스 추천, 친구, 크루, 커뮤니티 기능이 있는 러닝 앱입니다. 학교 팀 프로젝트입니다.
- **저장소**: GitHub `twg041110/runkk` (모노레포)

```
runkk/
├─ frontend/                 # 앱 (Expo / React Native)
├─ backend/                  # 서버 (Spring Boot)
│  └─ API.md                 # 서버 API 목록 (실제 구현 기준)
├─ docker-compose.yml        # AWS 서버에서 백엔드 + DB를 띄우는 설정
└─ .github/workflows/deploy.yml   # main에 푸시하면 AWS 서버에 자동 배포
```

- 저장소 루트에는 README가 없습니다. 백엔드 실행법과 API는 `backend/API.md`에 있습니다.

---

## 2. 전체 구조

```
[휴대폰 Expo Go / 에뮬레이터]
        │  HTTP  http://(서버 고정 IP):8080   ← 주소는 팀 카톡 공지
        ▼
[AWS EC2 서버 (Ubuntu 24.04, Arm, 시드니 리전)]
   ├─ 보안 그룹(방화벽): 22(SSH), 8080(백엔드)만 열림
   ├─ Docker Compose (프로젝트 이름: runkk)
   │    ├─ backend 컨테이너 (runkk-backend-1): Spring Boot, 서버 0.0.0.0:8080
   │    └─ db 컨테이너 (runkk-db-1): MySQL 8.4, 서버 127.0.0.1:3307 → 컨테이너 3306
   │         └─ 데이터는 Docker 볼륨 runkk_db-data에 저장
   └─ GitHub Actions self-hosted runner (~/actions-runner, 라벨 aws, 서비스로 상시 실행)
        └─ main에 backend 변경이 푸시되면 자동으로 다시 빌드하고 켬
```

핵심 사실은 다음과 같습니다.
- 서버는 **AWS EC2 한 대**입니다(2026-11-25에 옮김). 예전에는 팀원 노트북(Windows)을 서버로 썼고 Tailscale Funnel로 공개했지만, **지금은 둘 다 쓰지 않습니다.**
- 앱은 **고정 IP(탄력적 IP)의 8080 포트로 HTTP 접속**합니다. HTTPS가 아니라서 **로그인 비밀번호가 암호화 없이 전송됩니다.** 팀원들에게 실제로 쓰는 비밀번호로 가입하지 말라고 안내했습니다.
- DB(3307)는 서버 안(`127.0.0.1`)에서만 열려 있고, 보안 그룹에서도 열지 않았습니다.
- 서버 DB는 이전할 때 **새로 만들었습니다**(노트북 데이터는 옮기지 않음). 테이블은 백엔드가 자동으로 만들지만(5-3), 회원·코스·크루 같은 **데이터는 비어 있습니다.** 예시 데이터는 `local` 프로필에서만 들어갑니다.

---

## 3. AWS 서버 상세

| 항목 | 값 |
|---|---|
| 계정 | AWS **무료 플랜**(크레딧 방식). 2027-05-25에 끝나거나 크레딧을 다 쓰면 계정이 닫힘 |
| 리전 | 아시아 태평양(시드니) `ap-southeast-2` (프로젝트 지역에 고정돼 있어 서울 선택 불가) |
| 인스턴스 | 이름 `runkk-server`, `t4g.small`(2 vCPU, 메모리 2GB) + 스왑 2GB, 디스크 20GB gp3 |
| OS | Ubuntu Server 24.04 LTS (arm64), 사용자 `ubuntu` |
| 고정 IP | 탄력적 IP 1개 연결. 주소는 **팀 카톡 공지에서만** 공유 |
| 보안 그룹 | 인바운드 22(SSH), 8080(백엔드)만 허용 |
| 비밀 설정 파일 | `/home/ubuntu/runkk/.env` (깃에 없음, 서버에만 있음, 권한 600) |
| `.env`에 들어 있는 키 이름 | `DB_USER`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_SECRET` (값은 절대 공유 금지) |
| Docker Compose 프로젝트 이름 | `runkk` (`docker compose -p runkk ...`) |
| 컨테이너 | `runkk-backend-1`, `runkk-db-1` |
| DB | MySQL 8.4, DB 이름 `runkk`, 시간대 Asia/Seoul |
| DB 데이터 볼륨 | `runkk_db-data` (**지우면 서버 데이터 전부 사라짐**) |
| 배포 러너 | `~/actions-runner`, 라벨 `aws`, `svc.sh`로 서비스 등록(재부팅해도 자동 실행) |
| 접속 방법 | EC2 콘솔 → 인스턴스 → **연결 → EC2 인스턴스 연결**(브라우저 터미널), 또는 키 파일 `runkk-key.pem`으로 SSH (키는 담당자만 보관, 공유 금지) |

### 3-1. 서버 상태 확인 (AWS 서버 터미널)

```bash
docker ps                                  # runkk-backend-1, runkk-db-1이 Up이어야 정상
docker logs --tail 100 runkk-backend-1     # 백엔드 오류 로그 보기
docker restart runkk-backend-1             # 백엔드만 다시 켜기 (DB 데이터 유지)
cd ~/actions-runner && sudo ./svc.sh status   # 배포 러너가 active (running)인지 (러너 폴더 안에서 실행)
free -h                                    # 메모리·스왑 사용량
```

브라우저에서 `http://(서버 IP):8080/api/ping`을 열었을 때 `ok`가 나오면 서버가 정상입니다.

### 3-2. DB 직접 보기

- **서버 터미널에서** (가장 간단):
  ```bash
  docker exec -it runkk-db-1 mysql -u root -p runkk
  ```
  비밀번호는 `.env`의 `DB_ROOT_PASSWORD`입니다. 조회만 할 때는 `-u (DB_USER 값)`과 `DB_PASSWORD`를 쓰는 게 안전합니다.
- **내 PC의 HeidiSQL에서**: DB 포트는 인터넷에 열려 있지 않으므로 SSH 터널을 씁니다. 키 파일이 있는 PC의 명령 프롬프트에서 아래를 실행해 둔 채로, HeidiSQL에서 호스트 `127.0.0.1`, 포트 `3307`로 접속합니다.
  ```
  ssh -i runkk-key.pem -N -L 3307:127.0.0.1:3307 ubuntu@(서버 IP)
  ```
- **보안 그룹에 3306/3307을 여는 방법은 쓰지 않습니다.** DB가 인터넷에 공개됩니다.

### 3-3. 비용과 기간 (무료 플랜)

- 서버, 고정 IP, 디스크 요금은 **크레딧에서 차감**되고 카드로 청구되지 않습니다. 한 달에 약 21달러가 차감되는 것으로 예상합니다.
- 무료 플랜은 **6개월이 지나거나 크레딧을 다 쓰면** 계정이 닫히고, 90일 뒤 **서버와 DB가 영구 삭제**됩니다. 끝나기 전에 DB를 백업해야 합니다.
- 콘솔의 **"플랜 업그레이드"**를 누르거나 AWS Organizations에 가입하면 유료 플랜이 되어 카드로 청구될 수 있습니다. 사용자 확인 없이 하지 않습니다.
- 인스턴스를 **종료(Terminate)**하면 서버가 통째로 삭제됩니다. 잠시 끄려면 **중지(Stop)**를 씁니다. 서버를 지울 때는 탄력적 IP도 **릴리스**해야 요금이 멈춥니다.

---

## 4. 자동 배포 (GitHub Actions)

`.github/workflows/deploy.yml`의 동작입니다.
- **언제 실행되나**: `main` 브랜치에 아래 경로가 바뀐 커밋이 푸시될 때만 실행됩니다.
  - `backend/**`, `docker-compose.yml`, `.github/workflows/deploy.yml`
  - **`frontend/`만 바뀌면 배포가 실행되지 않습니다.** 앱은 각자 Expo로 실행하기 때문입니다.
- **어디서 실행되나**: `runs-on: [self-hosted, aws]`, 즉 AWS 서버의 러너에서 실행됩니다.
- **무엇을 하나**:
  ```
  docker compose -p runkk --env-file /home/ubuntu/runkk/.env up -d --build
  docker image prune -f
  ```
  백엔드 이미지를 새로 빌드하고(`backend/Dockerfile`: JDK 25로 `bootJar` → JRE 25로 실행), 컨테이너를 교체합니다. DB 볼륨은 그대로 남습니다. 빌드는 2분 정도 걸립니다.
- **배포가 `Queued`에서 안 움직이면**: AWS 서버가 꺼졌거나 러너 서비스가 멈춘 것입니다. 서버 터미널에서 `cd ~/actions-runner` 후 `sudo ./svc.sh status`로 확인하고, 멈췄으면 `sudo ./svc.sh start`로 켭니다(`svc.sh`는 러너 폴더 안에서 실행해야 함).
- 배포 결과는 GitHub 저장소의 **Actions** 탭에서 봅니다(초록 체크 = 성공). 러너가 `Idle`로 돌아온 것만으로는 성공인지 알 수 없습니다.

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
- **과거 사고 사례**: 서버에 옛 snake_case로 만든 `member` 테이블이 남아 있어서 `Unknown column 'm1_0.memberId'` 500 오류가 났습니다. 당시 서버 노트북 담당자가 해당 테이블을 지우고 백엔드를 재시작해서 해결했습니다(지금 AWS 서버는 새 DB라 이 문제가 없음). 비슷한 오류가 나면 **AI가 마음대로 DB를 지우지 말고** 담당자에게 알려야 합니다.

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
  EXPO_PUBLIC_API_URL=http://(팀 카톡으로 받은 서버 IP):8080
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
  - `run/*`: 바로 러닝 흐름 (시작 → 위치 권한 → 카운트다운 → 러닝 중 → 결과, main에 합쳐짐). 러닝 상태는 `hooks/use-run-session.tsx`, 지도는 `components/run/run-map.tsx`(폰) · `run-map.web.tsx`(웹은 격자 그림)
    - 아직 안 된 것: 기록 서버 저장(`TODO(API)` POST /api/runs), 이번 주 기록은 예시 값(`FAKE_WEEK`), 목표 정하고 달리기 · 코스 정하기, 화면 켜짐 유지 · 음성 안내
- 임시 입구: 내 정보 탭의 "설정 열기 (임시)", "러닝 시작 (임시)" 버튼. 정식 입구(홈 가운데 러닝 버튼 등)가 생기면 지울 예정입니다.

### 6-4. 실행

```powershell
cd frontend
npm install            # 처음, 그리고 pull 받은 뒤 package.json이 바뀌었으면 매번
npx expo start         # 휴대폰 Expo Go로 QR 스캔, 또는 a 키로 안드로이드 에뮬레이터
npx tsc --noEmit       # 타입 오류 확인 (커밋 전에 0개여야 함)
```
- 휴대폰 Expo Go 앱이 **SDK 58을 지원하는 버전**이어야 합니다.
- 러닝 기능(`expo-location`, `react-native-maps`)은 폰 위치 권한과 **폰 위치(GPS) 켜짐**이 필요합니다. 실내에서는 GPS가 약해서 거리가 안 늘 수 있습니다.
- 지도는 Expo Go에서는 키 없이 됩니다. APK · 앱스토어용으로 빌드할 때는 **구글 지도 API 키**가 필요합니다(키는 깃에 올리지 않음).
- 새로 받은 직후 `npx tsc`에서 `animated-icon.module.css` 오류가 나면, `npx expo start`를 한 번 실행하세요. Expo가 `expo-env.d.ts`(깃에 없음)를 만들어 주면 사라집니다.

---

## 7. 팀원 PC에 필요한 것

| 하는 일 | 필요한 것 |
|---|---|
| 앱만 개발 | Node.js, Git(또는 GitHub Desktop), `frontend/.env.local`, 휴대폰 Expo Go 또는 Android Studio 에뮬레이터 |
| 백엔드도 개발 | 위 + **JDK 25**. DB 설치는 필요 없음(`local` 프로필 사용) |
| 서버 담당 | AWS 콘솔 계정, 키 파일 `runkk-key.pem` (서버 안에 Docker, `.env`, 러너가 설치돼 있음) |

저장소에 **없어서 따로 받아야 하는 것**은 다음과 같습니다.
- `frontend/.env.local`: 서버 주소. 팀 카톡에서 받습니다.
- `/home/ubuntu/runkk/.env`: AWS 서버에만 있습니다. 다른 팀원은 필요 없습니다.
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

1. **비밀 파일을 커밋하지 않습니다**: `.env`, `.env.local`, `application-secret.yaml`, 키 파일(`*.pem`, `*.jks`, `*.p12`, `*.key` 등).
2. **비밀번호, 토큰, API 키, 서버 IP 주소를 저장소, 노션, 문서에 적지 않습니다.** 서버 주소는 팀 카톡으로만 공유합니다.
3. **`docker compose down -v`, `docker volume rm runkk_db-data`를 실행하지 않습니다.** `-v`는 DB 데이터를 통째로 지웁니다. 재시작이 필요하면 `docker restart runkk-backend-1`을 씁니다.
4. **DB 포트(3306/3307)를 인터넷에 열지 않습니다.** AWS 보안 그룹에 추가하지 말고, `docker-compose.yml`의 DB 포트 `127.0.0.1:3307:3306`에서 `127.0.0.1:`을 지우지 않습니다. 보안 그룹은 22, 8080만 엽니다.
5. **AWS 콘솔에서 사용자 확인 없이** 인스턴스 종료(Terminate), 탄력적 IP 릴리스, 플랜 업그레이드, AWS Organizations 가입을 하지 않습니다. 서버가 삭제되거나 요금이 청구될 수 있습니다.
6. 서버 DB의 테이블이나 데이터를 지우는 명령(`DROP`, `DELETE`, `TRUNCATE`)을 **사용자 확인 없이 제안하거나 실행하지 않습니다.**
7. 사용자가 요청하지 않았으면 `main`에 직접 푸시하지 않습니다.

---

## 10. 자주 나는 문제

| 증상 | 원인과 해결 |
|---|---|
| 앱 터미널에 `서버 연결 실패` | `.env.local` 주소 오류(예전 Tailscale 주소 그대로인지 확인), AWS 서버가 꺼졌거나 크레딧 소진. 서버 담당자에게 확인 |
| `EXPO_PUBLIC_API_URL이 없어요` 경고 | `frontend/.env.local`이 없음. 만든 뒤 `npx expo start`를 다시 실행 |
| 서버 500, `Unknown column ...` | 옛 테이블 구조가 남은 것(5-3 참고). 서버 담당자에게 알림. DB를 함부로 지우지 않음 |
| GitHub Actions 배포가 `Queued`에서 멈춤 | AWS 서버가 꺼졌거나 러너 서비스가 멈춤(4장 참고) |
| 배포 중 빌드가 멈추거나 `Killed` | 서버 메모리 부족. 스왑이 켜져 있는지 `free -h`로 확인 |
| pull 받은 뒤 앱이 빨간 오류 (모듈 없음) | `npm install`을 안 함 |
| `Location request failed due to unsatisfied device settings` | 폰의 위치(GPS) 스위치가 꺼짐. 빠른 설정에서 위치를 켬 (러닝 시작 화면에서 "위치가 꺼져 있어요" 팝업으로 안내함) |
| Expo Go에서 프로젝트가 안 열림 | Expo Go 버전이 SDK 58과 안 맞음. 앱 업데이트 |
| 백엔드 테스트 리포트 생성 오류 | 테스트 메서드 이름이 한글임. 영어 이름 + `@DisplayName` |
