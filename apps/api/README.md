# codementor-api

FastAPI + SQLAlchemy 2.x (async) + Alembic.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"

# .env 생성 (Neon DATABASE_URL + GEMINI_API_KEY 필요)
Copy-Item .env.example .env
notepad .env

# 첫 마이그레이션 생성 + 적용
alembic revision --autogenerate -m "initial schema"
alembic upgrade head

# 실행
uvicorn app.main:app --reload --port 8000
```

확인: http://localhost:8000/docs

## Migration cheatsheet

```powershell
alembic revision --autogenerate -m "add foo column"
alembic upgrade head
alembic downgrade -1
alembic current
alembic history
```
