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

## Quick start

### 1) 백엔드

```powershell
cd apps\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"

# .env 생성 (.env.example 복사 후 Neon DATABASE_URL + GEMINI_API_KEY 채우기)
Copy-Item .env.example .env
notepad .env

# 초기 마이그레이션
alembic upgrade head

# 실행
uvicorn app.main:app --reload --port 8000
```

### 2) 프론트엔드

```powershell
cd apps\web
npm install

# .env.local 확인 (기본값 그대로 OK)
Copy-Item .env.example .env.local

npm run dev
```

브라우저 → http://localhost:5173

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
