@echo off
chcp 65001 >nul
REM ============================================================
REM  CodeMentor AI - 개발 서버 실행기 (더블클릭용)
REM  백엔드(FastAPI :8000) + 프론트엔드(Vite :5173)를
REM  각각 새 창에서 띄우고, 브라우저를 엽니다.
REM  종료: 열린 두 창을 닫거나 각 창에서 Ctrl+C
REM ============================================================
setlocal
set "ROOT=%~dp0"

echo [1/3] 백엔드(FastAPI) 시작 - http://localhost:8000
start "CodeMentor API (8000)" /D "%ROOT%apps\api" cmd /k .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

echo [2/3] 프론트엔드(Vite) 시작 - http://localhost:5173
start "CodeMentor Web (5173)" /D "%ROOT%apps\web" cmd /k ""C:\Program Files\nodejs\npm.cmd" run dev"

echo [3/3] 잠시 후 브라우저를 엽니다... (서버 준비 전이면 새로고침하세요)
timeout /t 8 /nobreak >nul
start "" http://localhost:5173

endlocal
