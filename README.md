# 런크크 (runkk)

러닝 플랫폼 모바일 애플리케이션 및 백엔드 서버

## 🛠 개발 도구 및 버전
- **Frontend:** React Native 0.86 (Expo SDK 57), TypeScript
- **Backend:** Spring Boot, Java 25, Gradle
- **DB:** MySQL 8.4 (서버) / 로컬은 MariaDB 또는 MySQL

---

## 📦 처음 한 번만 설치

| 대상 | 설치할 것 |
|---|---|
| 모두 | Git (또는 GitHub Desktop), **Node.js LTS** |
| 모두 | 스마트폰에 **Expo Go** 앱 (SDK 57 지원 버전) |
| 에뮬레이터 쓰는 사람 | Android Studio (가상 기기 1개 만들어 두기) |
| 백엔드 실행하는 사람 | **JDK 25**, 로컬 DB (MariaDB 또는 MySQL) |

---

## 📱 프론트엔드 실행

```
cd frontend
npm install
npx expo login
npx expo start
```
- `npm install`은 처음 한 번, 그리고 **풀 받았을 때 `package.json`이 바뀌었으면** 다시 실행하세요.
- `npx expo login`은 처음 한 번만 하면 됩니다. (비밀번호 입력 시 글자가 화면에 보이지 않을 수 있어요.)

**실행 후 여는 방법**
- **실제 폰:** PC와 폰을 **같은 Wi-Fi**에 연결하고, Expo Go에 로그인한 뒤 터미널의 QR 코드를 스캔
- **와이파이가 달라서 안 열릴 때:** `npx expo start --tunnel`
- **에뮬레이터:** Android Studio에서 가상 기기를 켜 두고, 터미널에서 `a` 누르기

---

## 🖥 백엔드 실행 (내 컴퓨터에서 돌릴 때만)

### 1. 로컬 DB 만들기
로컬 MariaDB/MySQL에 접속해서 DB를 하나 만듭니다.
```sql
CREATE DATABASE runkk;
```

### 2. `application-secret.yaml` 만들기
이 파일은 깃에 올라가지 않기 때문에 **풀로 받을 수 없어요.** 각자 아래 위치에 직접 만드세요.

`backend/src/main/resources/application-secret.yaml`
```yaml
spring:
  datasource:
    url: jdbc:mariadb://localhost:3306/runkk
    username: 내_로컬_DB_계정
    password: 내_로컬_DB_비밀번호
```
> 내 컴퓨터 DB 정보를 적는 파일입니다. 서버 비밀번호가 아니에요.

### 3. 실행
```
cd backend
```
- Windows: `./gradlew.bat bootRun`
- Mac/Linux: `./gradlew bootRun`

브라우저에서 http://localhost:8080/api/ping 을 열어 `ok`가 나오면 성공입니다.

---

## ⚠️ 팀 규칙

1. **`main`에 바로 푸시하지 않기.** `main`에 `backend/` 변경이 올라가면 **서버 노트북에 자동 배포**됩니다. 각자 브랜치에서 작업하고 PR로 합쳐 주세요.
2. **비밀 파일은 절대 커밋하지 않기.** `application-secret.yaml`, `.env` 등 비밀번호가 들어간 파일은 커밋 목록에서 체크를 해제하세요.
3. **Expo 버전은 혼자 올리지 않기.** 지금은 **SDK 57**로 맞춰 쓰고 있어요. 올릴 때는 팀 전체가 같이 올립니다.
   - 내 버전 확인: `frontend` 폴더에서 `npm ls expo` → `expo@57.x.x`면 정상

---

## 🌐 서버 접속
서버 노트북은 항상 켜져 있고, 어디서든 접속할 수 있어요. **서버 주소는 보안상 레포에 적지 않고 팀 카톡으로만 공유해요.**

`frontend` 폴더에 `.env.local` 파일을 만들고 카톡으로 받은 주소를 넣으세요.
```
EXPO_PUBLIC_API_URL=카톡으로_받은_서버_주소
```
- 주소 끝에 `/`는 붙이지 마세요.
- `.env.local`은 깃에 올라가지 않아요. 각자 한 번만 만들면 됩니다.
- 파일을 만들거나 고친 뒤에는 `npx expo start`를 껐다가 다시 실행하세요.

앱을 실행했을 때 터미널에 `서버 연결: ok`가 나오면 성공입니다.
