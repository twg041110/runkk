# 런크크 (runkk)

러닝 플랫폼 모바일 애플리케이션 및 백엔드 서버

## 🛠 개발 도구 및 언어
- **Frontend:** React Native (Expo)
- **Backend:** Spring Boot, MariaDB

---

## 🚀 시작하는 법

### 📱 모바일 실기기 테스트 방법 (Expo Go)
1. 스마트폰에 **Expo Go** 앱 설치
2. Expo 계정 가입 및 앱 내 **로그인 필수** (동일 계정으로 CLI 로그인 권장)
3. PC와 스마트폰을 **동일한 Wi-Fi**에 연결
4. 터미널의 QR 코드를 스마트폰 카메라로 스캔

프로젝트를 실행하려면 터미널에서 아래 명령어들을 순서대로 입력하세요.


### 1. 백엔드 실행 
```cd backend```
#### Windows 사용자
```./gradlew.bat bootRun```
#### Mac/Linux 사용자
```./gradlew bootRun```

### 2. 프론트엔드 실행 (새 터미널을 열고 frontend 폴더로 이동)
```cd frontend```<br>
```npm install```<br>
#### Expo 계정 로그인 (터미널 안내에 따라 ID/PW 입력)
```npx expo login```<br>
```주의점(비밀번호 입력 시 글자가 화면에 보이지 않을 수 있습니다.)```<br>
```npx expo start```