# CodeMentor AI

> 개발자를 위한 AI 코드 분석 & 멘토링 플랫폼.
> Gemini 기반 채팅 · GitHub repo 분석 · README 자동 생성 · 대시보드까지.

**v2** — React + FastAPI + Postgres 풀스택. v1 (Flask 단일 서비스)은 [`legacy/flask-v1/`](legacy/flask-v1/) 참고.

## Structure

```
apps/
├── api/    FastAPI + SQLAlchemy 2.x (async) + Alembic (Python 3.11+)
└── web/    Vite + React 19 + TS + Tailwind v4 + shadcn/ui

legacy/flask-v1/   v1 백엔드 보존 (참고용)
docs/              아키텍처 / API 문서 / 스크린샷
```

## Prerequisites

로컬 실행 전에 아래가 필요합니다 (Windows + PowerShell 기준).

- **Python 3.11+** (3.13 확인됨)
- **Node.js 20+** (LTS 권장 — Vite 6 / React 19 요구). 미설치 시:
  `winget install OpenJS.NodeJS.LTS` 후 **터미널/VS Code를 완전히 재시작**해야 `npm`이 PATH에 잡힙니다.
- **Neon Postgres** 계정 — https://neon.tech 에서 무료 프로젝트 생성 후 연결 문자열 발급
- **Gemini API 키** — https://aistudio.google.com/apikey (AI 채팅/분석 기능에 필수)
- PowerShell 실행 정책상 `npm`(=`npm.ps1`)이 차단될 수 있습니다. 그럴 땐 `npm` 대신 **`npm.cmd`** 를 쓰거나,
  세션에서 `Set-ExecutionPolicy -Scope Process RemoteSigned` 를 먼저 실행하세요.

## Quick start

### 1) 백엔드

```powershell
cd apps\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"

# .env 생성
Copy-Item .env.example .env
notepad .env
```

`.env` 편집 시 주의 — **`DATABASE_URL`은 asyncpg 형식으로 변환**해야 합니다.
Neon이 주는 원본은 `postgresql://...?sslmode=require` 형태인데, 이 프로젝트는 `asyncpg` 드라이버라
아래처럼 **스킴과 ssl 파라미터를 바꿔야** 동작합니다 (안 바꾸면 연결 거부 / 마이그레이션 실패):

```
# Neon 원본:   postgresql://USER:PW@HOST.neon.tech/db?sslmode=require
# .env 에 넣을 값:
DATABASE_URL=postgresql+asyncpg://USER:PW@HOST.neon.tech/db?ssl=require
```

`GEMINI_API_KEY` 도 같은 `.env`에 채웁니다. 이어서 스키마 생성 + 실행:

```powershell
# 최초 1회만: alembic/versions/ 가 비어 있으면 초기 마이그레이션을 생성
#   (이미 마이그레이션 파일이 커밋돼 있으면 이 줄은 건너뜀)
alembic revision --autogenerate -m "initial schema"

# 스키마를 DB에 적용 (이후 실행 시에도 동일)
alembic upgrade head

# 실행
uvicorn app.main:app --reload --port 8000
```

> `.env`를 수정하면 **uvicorn을 재시작**해야 반영됩니다 (`--reload`는 `.py`만 감시, 설정은 캐시됨).
> 확인: http://localhost:8000/docs

### 2) 프론트엔드 (백엔드와 별도 터미널)

```powershell
cd apps\web
npm install            # 막히면 npm.cmd install

# .env.local 생성 (기본값 그대로 OK — 백엔드가 8000 포트면 수정 불필요)
Copy-Item .env.example .env.local

npm run dev            # 막히면 npm.cmd run dev
```

브라우저 → http://localhost:5173 (백엔드도 떠 있어야 로그인·AI가 동작)

### 한 번에 실행 (선택)

위 두 서버를 매번 따로 안 띄우고 싶으면:

- **VS Code**: `Ctrl+Shift+B` (또는 Terminal → Run Task → `Dev: 전체 실행`)
  → 백엔드·프론트가 분할 터미널로 동시 실행 ([.vscode/tasks.json](.vscode/tasks.json) 제공, 별도 설치 불필요)
- **Windows 탐색기**: 루트의 [start-dev.bat](start-dev.bat) 더블클릭
  → 두 서버 새 창 + 브라우저 자동 오픈

> 사전 준비(Node 설치, `apps/api/.venv` 생성, `npm install`)가 끝나 있어야 합니다.
> Windows에서 PowerShell이 `npm`을 막으면 아래 Troubleshooting 참고.

## Troubleshooting

| 증상 | 원인 / 해결 |
|---|---|
| `ConnectionRefusedError [WinError 1225]` (alembic/uvicorn) | `DATABASE_URL`이 더미값이거나 미변환. 위 asyncpg 형식(`postgresql+asyncpg://...?ssl=require`)으로 수정 후 **새로** 실행 |
| `alembic upgrade head` 가 아무 것도 안 함 | `alembic/versions/` 가 비어 있음 → 먼저 `alembic revision --autogenerate -m "initial schema"` |
| `'node' is not recognized` / `npm` 인식 안 됨 | Node 미설치거나, Node 설치 전 열린 터미널. Node 설치 후 **VS Code/터미널 완전 재시작** |
| `npm.ps1 cannot be loaded ... scripts disabled` | PowerShell 실행 정책. `npm` 대신 `npm.cmd` 사용 또는 `Set-ExecutionPolicy -Scope Process RemoteSigned` |
| `passlib ... bcrypt has no attribute '__about__'` (WARNING) | 무해 (passlib가 trap, 인증 정상 동작). 끄려면 `pip install "bcrypt==4.0.1"` 후 재시작 |
| 화면은 뜨는데 로그인/API 실패 | 백엔드 미기동이거나 CORS. 백엔드 터미널 로그 확인, `ALLOWED_ORIGINS`에 `http://localhost:5173` 포함 여부 확인 |
| `legacy/flask-v1/` 의 `localhost:5000` | v1(Flask) 옛 버전 주소. v2는 5173/8000 사용 — 무시 |

## Features

- 🔐 JWT 인증 (회원가입 / 로그인 / /me)
- 💬 Gemini 기반 **SSE 스트리밍 채팅** + 마크다운/코드블록 렌더
- 📁 GitHub repo URL 임포트 → 파일 트리 + Monaco 뷰어
- 📝 **README 자동 생성** + 다운로드
- ✨ AI 프로젝트 요약 (코드 구조 + 기술 스택 + 개선점)
- 📊 대시보드 (stats + 7일 차트 + 최근 활동)
- 🎨 VSCode 스타일 다크 테마

## Stack

| 영역 | 기술 |
|---|---|
| Frontend | React 19, Vite, TS, Tailwind v4, shadcn/ui, TanStack Query, Zustand, Framer Motion, Monaco |
| Backend | FastAPI, SQLAlchemy 2.x (async), Alembic, asyncpg |
| DB | Postgres (Neon) |
| LLM | Gemini 2.5 Flash |
| Auth | passlib (bcrypt) + python-jose (JWT) |
| Deploy | Vercel (web) + Render (api) + Neon (db) |

## License

[MIT](LICENSE)
