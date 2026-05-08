# YUKIHA Ticket Bot

Discord.js v14 기반 유키하 티켓봇입니다.

## 기능

- `/티켓설정` : 티켓 패널 생성 및 관리자 역할/티켓 카테고리/로그 채널 지정
- `/티켓관리` : 열린 티켓 목록 확인
- 버튼으로 티켓 생성
- 모달로 문의 내용 입력
- 카테고리별 티켓 생성
- 중복 티켓 방지
- 티켓 닫기 / 재열기 / 삭제
- HTML 대화 로그 생성
- MongoDB 저장
- 관리자 역할 권한 처리

## 설치

```bash
npm install
cp .env.example .env
```

`.env` 값을 채운 뒤 명령어 등록:

```bash
npm run deploy
```

실행:

```bash
npm start
```

## Discord Developer Portal 설정

Bot 탭에서 아래 권한을 켜세요.

- SERVER MEMBERS INTENT 권장
- MESSAGE CONTENT INTENT는 필수는 아니지만 로그 품질을 위해 권장

OAuth2 URL Generator 권한:

- bot
- applications.commands

봇 권한:

- Manage Channels
- View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Manage Messages

## Dishost 실행 설정

Node.js 20 이상 서버에서 사용하세요.

- Startup command: `npm start`
- Install command: `npm install`
- 최초 1회 콘솔에서 `npm run deploy`

## 환경변수

Dishost 환경변수에는 아래 4개만 넣으면 됩니다.

```env
DISCORD_TOKEN=봇토큰
CLIENT_ID=애플리케이션ID
GUILD_ID=서버ID
MONGODB_URI=몽고DB주소
```

관리자 역할, 티켓 카테고리, 로그 채널은 `.env`에 넣지 않습니다.
디스코드 서버에서 `/티켓설정` 명령어로 지정하세요.
