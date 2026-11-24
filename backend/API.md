# 런크크 백엔드 API

ERD를 기준으로 만든 서버 API 목록입니다. 주소는 모두 `http://서버주소:8080` 뒤에 붙습니다.

## 내 PC에서 켜 보기 (DB 설치 필요 없음)

```powershell
cd backend
./gradlew bootRun --args='--spring.profiles.active=local'
```

- `local` 프로필로 켜면 H2라는 내장 DB를 써서 `backend/data` 폴더에 파일로 저장됩니다. 폴더를 지우면 처음 상태로 돌아갑니다.
- 처음 켤 때 코스 7개, 크루 1개, 게시글 3개가 자동으로 들어갑니다.
- 예시 계정은 `demo@runkk.app` / `runkk1234`입니다. 크루 "여의도 새벽런"의 크루장입니다.
- 서버(docker-compose)에서는 지금처럼 MySQL을 씁니다. `.env`에 `JWT_SECRET=아무 긴 문자열`을 추가해 주세요. 없으면 서버를 다시 켤 때마다 모두 로그아웃됩니다.

## 로그인 방식

1. 회원가입이나 로그인을 하면 응답에 `accessToken`이 옵니다.
2. 앱은 이 값을 저장해 두고, 이후 요청마다 `Authorization: Bearer <accessToken>` 헤더를 붙입니다.
3. 토큰은 14일 동안 유효합니다.

🔓 표시는 로그인 없이 부를 수 있는 API입니다. 로그인한 상태로 부르면 "저장함", "좋아요함" 같은 내 상태가 함께 옵니다.

## 오류 응답 모양

모든 오류는 같은 모양으로 옵니다. `message`는 앱 화면에 그대로 보여 줘도 되는 한국어 문장입니다.

```json
{ "status": 400, "message": "입력값을 다시 확인해 주세요.", "fields": { "password": "비밀번호는 영문과 숫자를 섞어 8자 이상으로 정해 주세요." }, "timestamp": "..." }
```

## 목록 응답 모양

목록은 `?page=0&size=20`으로 나눠 받습니다. 응답은 아래 모양입니다. `hasNext`가 true면 다음 페이지가 있습니다.

```json
{ "content": [...], "page": 0, "size": 20, "totalElements": 42, "hasNext": true }
```

## 회원가입, 로그인 `/api/auth` 🔓

| 방법 | 주소 | 설명 |
|---|---|---|
| POST | `/signup` | `email`, `password`(영문+숫자 8자 이상), `nickname`(2~12자), `agreedTerms`가 필요합니다. `agreedTerms`에는 `["SERVICE","PRIVACY","LOCATION","AGE14"]`가 모두 들어 있어야 합니다. 선택 항목은 `gender`, `birthYear`, `region`, `level`, `heightCm`, `weightKg`입니다. |
| POST | `/login` | `email`, `password`를 보냅니다. 응답은 `{ accessToken, tokenType, expiresIn, member }`입니다. |
| GET | `/check-email?email=` | `{ available: true/false }`를 돌려줍니다. |
| GET | `/check-nickname?nickname=` | 위와 같습니다. |

## 회원 `/api/members`

| 방법 | 주소 | 설명 |
|---|---|---|
| GET | `/me` | 내 정보입니다. 친구 코드(`friendCode`)도 들어 있습니다. |
| PATCH | `/me` | 프로필을 수정합니다. 보낸 칸만 바뀝니다. |
| DELETE | `/me` | 회원 탈퇴입니다. 본문은 `{ reason }`이고 생략할 수 있습니다. |
| PATCH | `/me/password` | 비밀번호 변경입니다. 본문은 `{ currentPassword, newPassword }`입니다. 현재 비밀번호가 틀리면 400 "현재 비밀번호가 맞지 않아요."가 오고, 새 비밀번호는 회원가입과 같은 규칙(영문+숫자 8자 이상)입니다. 성공하면 204(내용 없음)입니다. |
| GET / PATCH | `/me/settings` | 알림, 방해 금지 시간, 거리 단위, 음성 안내 설정입니다. 방해 금지를 끄려면 `quietTimeOff: true`를 보냅니다. |
| GET | `/search?nickname=` | 닉네임으로 회원을 찾습니다. |
| GET | `/{memberId}` 🔓 | 다른 회원의 프로필입니다. |

## 친구 `/api/friends`

| 방법 | 주소 | 설명 |
|---|---|---|
| GET | `/` | 친구 목록입니다. |
| GET | `/ranking?period=WEEK\|MONTH` | 나를 포함한 친구들의 달린 거리 순위입니다. |
| POST | `/requests` | 친구 요청을 보냅니다. 본문은 `{ memberId }`나 `{ friendCode: "RKK-XXXX" }` 중 하나입니다. 상대가 이미 나에게 요청을 보낸 상태면 바로 친구가 됩니다. |
| GET | `/requests/received`, `/requests/sent` | 받은 요청과 보낸 요청입니다. |
| PATCH | `/requests/{id}/accept`, `/requests/{id}/reject` | 받은 요청을 수락하거나 거절합니다. |
| DELETE | `/{friendshipId}` | 친구를 끊거나, 내가 보낸 요청을 취소합니다. |

## 코스 `/api/courses`

| 방법 | 주소 | 설명 |
|---|---|---|
| GET | `/?region=&difficulty=BEGINNER\|INTERMEDIATE\|ADVANCED&maxKm=&keyword=` 🔓 | 코스 목록입니다. 별점 평균, 후기 수, 이번 주 러너 수, 저장 여부가 함께 옵니다. |
| GET | `/{courseId}` 🔓 | 코스 상세입니다. 특징 목록, 초보 팁, 경로(`routeData`)가 들어 있습니다. |
| POST / DELETE | `/{courseId}/save` | 코스를 저장하거나 저장을 취소합니다. |
| GET | `/saved` | 내가 저장한 코스입니다. |
| GET | `/{courseId}/reviews` 🔓 | 후기 목록입니다. |
| POST | `/{courseId}/reviews` | 후기를 씁니다. 본문은 `{ rating: 1~5, content }`입니다. |
| DELETE | `/reviews/{reviewId}` | 내가 쓴 후기를 지웁니다. |

## 러닝 기록 `/api/runs`

| 방법 | 주소 | 설명 |
|---|---|---|
| POST | `/` | 달리기가 끝나면 기록을 저장합니다. 필수 값은 `distanceKm`, `durationSec`, `startedAt`입니다. 선택 값은 `runType`(FREE/GOAL/COURSE/TOGETHER/CREW), `goalType`(NONE/DISTANCE/TIME/DISTANCE_TIME), `goalValue`(거리 목표는 km, 시간 목표는 분), `courseId`, `inviteId`, `meetupId`, `routePoints: [{lat,lng,recordedAt}]`입니다. 페이스, 칼로리, 달성률은 서버가 계산합니다. |
| GET | `/` | 내 기록 목록입니다. 최신 기록이 먼저 옵니다. |
| GET | `/weekly` | 이번 주 요약입니다. 요일별 거리와 주간 목표 달성률(%)이 들어 있습니다. |
| GET / DELETE | `/{recordId}` | 기록 상세(경로 포함)를 보거나 기록을 지웁니다. |

## 함께 달리기 초대 `/api/run-invites`

| 방법 | 주소 | 설명 |
|---|---|---|
| POST | `/` | 친구에게만 보낼 수 있습니다. 본문은 `{ inviteeId, runAt, courseId?, meetingPlace?, meetingLat?, meetingLng?, targetPaceSec? }`입니다. |
| GET | `/received`, `/sent` | 대기 중이거나 수락된 초대입니다. |
| PATCH | `/{id}/accept`, `/{id}/reject` | 받은 사람이 수락하거나 거절합니다. |
| PATCH | `/{id}/cancel` | 보낸 사람이 취소합니다. |

## 크루 `/api/crews`

크루 규칙은 다음과 같습니다.

- 한 사람은 크루 하나에만 가입하거나 가입 신청할 수 있습니다.
- 가입하려면 1km 이상 달린 기록이 5번 필요합니다.
- 크루마다 정한 성별, 나이, 정원 조건을 확인합니다.
- `joinType`이 AUTO면 바로 가입되고, APPROVAL이면 크루장이 승인해야 합니다.

| 방법 | 주소 | 설명 |
|---|---|---|
| GET | `/?region=&keyword=&recruitingOnly=true` 🔓 | 크루 목록입니다. 인원과 태그가 함께 옵니다. |
| GET | `/{crewId}` 🔓 | 크루 상세입니다. 크루장, 다음 모임, 나의 가입 상태(`myStatus`)가 들어 있습니다. |
| GET | `/me` | 내 크루입니다. 없으면 `crew: null`이 옵니다. |
| GET | `/eligibility` | 가입 조건을 채웠는지 알려 줍니다. 응답은 `{ eligible, runCount, required }`입니다. |
| POST | `/` | 크루를 만듭니다. 만든 사람이 크루장이 됩니다. |
| PUT / DELETE | `/{crewId}` | 크루를 수정하거나 해체합니다. 크루장만 할 수 있습니다. |
| POST | `/{crewId}/join` | 가입하거나 가입을 신청합니다. |
| DELETE | `/{crewId}/members/me` | 크루를 탈퇴하거나 가입 신청을 취소합니다. 크루장은 탈퇴할 수 없습니다. |
| GET | `/{crewId}/members?status=PENDING` | 멤버 목록입니다. `status=PENDING`을 붙이면 가입 신청 목록이 오고, 이건 크루장만 볼 수 있습니다. |
| PATCH | `/{crewId}/members/{crewMemberId}/approve`, `/reject` | 가입 신청을 승인하거나 거절합니다. 크루장만 할 수 있습니다. |
| GET / POST | `/{crewId}/meetups` | 다가오는 모임을 보거나 모임을 만듭니다. 만드는 건 크루장만 할 수 있습니다. |
| PUT | `/meetups/{meetupId}/attendance` | 참석 여부를 정합니다. 본문은 `{ status: ATTENDING\|ABSENT }`입니다. |
| GET / POST | `/{crewId}/notices` | 공지를 보거나 씁니다. 쓰는 건 크루장만 할 수 있습니다. |
| DELETE | `/notices/{noticeId}` | 공지를 지웁니다. 크루장만 할 수 있습니다. |

## 커뮤니티 `/api/posts`

게시판 종류(`boardType`)는 FREE, TIP, GEAR, INJURY, COURSE_REVIEW, CREW_RECRUIT입니다.

| 방법 | 주소 | 설명 |
|---|---|---|
| GET | `/?board=&keyword=&sort=latest\|popular` 🔓 | 글 목록입니다. `popular`는 좋아요가 많은 순서입니다. 내가 차단한 사람의 글은 빠집니다. |
| GET | `/{postId}` 🔓 | 글 상세입니다. 부를 때마다 조회수가 1 오릅니다. |
| GET | `/me` | 내가 쓴 글입니다. |
| POST | `/` | 글을 씁니다. 본문은 `{ boardType, title, content, runLocation?, recordId?, imageUrls? }`입니다. |
| PUT / DELETE | `/{postId}` | 글을 고치거나 지웁니다. 쓴 사람만 할 수 있습니다. |
| POST / DELETE | `/{postId}/like` | 좋아요를 누르거나 취소합니다. 응답은 `{ liked, likeCount }`입니다. |
| GET / POST | `/{postId}/comments` | 댓글을 보거나 씁니다. 답글은 `parentId`를 함께 보냅니다. 답글에는 다시 답글을 달 수 없습니다. |
| DELETE | `/comments/{commentId}` | 댓글을 지웁니다. 답글이 남아 있을 수 있어서 "삭제된 댓글이에요."로 바꿔 둡니다. |

> 사진 업로드 기능은 아직 없습니다. 지금은 `imageUrls`에 이미 올라가 있는 사진의 주소를 넣습니다.

## 알림, 차단, 신고

| 방법 | 주소 | 설명 |
|---|---|---|
| GET | `/api/notifications` | 알림 목록입니다. 설정에서 끈 종류의 알림은 만들어지지 않습니다. |
| GET | `/api/notifications/unread-count` | 안 읽은 알림 수입니다. 응답은 `{ count }`입니다. |
| PATCH | `/api/notifications/{id}/read`, `/api/notifications/read-all` | 알림을 읽음으로 표시합니다. |
| GET | `/api/blocks` | 내가 차단한 사람 목록입니다. |
| POST / DELETE | `/api/blocks/{memberId}` | 차단하거나 차단을 풉니다. 차단하면 친구 관계도 끊어집니다. |
| POST | `/api/reports` | 신고합니다. 본문은 `{ targetType: MEMBER\|POST\|COMMENT\|COURSE_REVIEW, targetId, reason }`입니다. |
