"""CodeMentor AI - Flask 백엔드.

표준 Flask 구조 (templates/ + static/) 사용.
배포(Render + gunicorn)와 로컬 실행(python app.py) 모두 동작합니다.
"""

import logging
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from gemini_service import GeminiServiceError, analyze_code

load_dotenv()

# === 로깅: 사용자 응답엔 새니타이즈된 메시지, 서버 로그엔 전체 트레이스 ===
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# === 입력 검증 / 한도 ===
SUPPORTED_LANGUAGES = {"java", "python", "javascript"}
SUPPORTED_ANALYSIS_TYPES = {"code_review", "bug_fix", "refactoring", "performance"}
MAX_CODE_LENGTH = int(os.getenv("MAX_CODE_LENGTH", "20000"))

# === Rate limit / CORS 설정 ===
RATE_LIMIT = os.getenv("RATE_LIMIT", "5 per minute;30 per hour")
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")
    if o.strip()
]

# === Flask app (templates/ + static/ 자동 인식) ===
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    storage_uri="memory://",
    strategy="fixed-window",
)


# === 보안 헤더 ===
@app.after_request
def add_security_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "no-referrer"
    resp.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return resp


# === 페이지 라우트 ===
@app.route("/")
def index():
    return render_template("index.html")


# === 메타 엔드포인트 ===
@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/config")
def config():
    return jsonify({
        "max_code_length": MAX_CODE_LENGTH,
        "supported_languages": sorted(SUPPORTED_LANGUAGES),
        "supported_analysis_types": sorted(SUPPORTED_ANALYSIS_TYPES),
    })


# === 분석 엔드포인트 (rate-limited) ===
@app.route("/api/analyze", methods=["POST"])
@limiter.limit(RATE_LIMIT)
def analyze():
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip()
    language = (data.get("language") or "").lower()
    analysis_type = (data.get("analysis_type") or "").lower()

    if not code:
        return jsonify({"error": "코드를 입력해주세요."}), 400
    if len(code) > MAX_CODE_LENGTH:
        return jsonify({
            "error": f"코드가 너무 깁니다. 최대 {MAX_CODE_LENGTH:,}자까지 입력할 수 있어요.",
        }), 400
    if language not in SUPPORTED_LANGUAGES:
        return jsonify({"error": "지원하지 않는 언어입니다."}), 400
    if analysis_type not in SUPPORTED_ANALYSIS_TYPES:
        return jsonify({"error": "지원하지 않는 분석 유형입니다."}), 400

    try:
        result = analyze_code(code=code, language=language, analysis_type=analysis_type)
    except GeminiServiceError as exc:
        app.logger.warning(
            "Gemini service error: %s", exc.__cause__ or exc, exc_info=True,
        )
        return jsonify({"error": str(exc)}), 502
    except Exception:
        app.logger.exception("Unexpected error during /api/analyze")
        return jsonify({
            "error": "분석 중 예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        }), 500

    return jsonify(result)


# === 에러 핸들러 ===
@app.errorhandler(429)
def ratelimit_handler(_e):
    app.logger.info("Rate limit exceeded for %s", get_remote_address())
    return jsonify({
        "error": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
    }), 429


@app.errorhandler(404)
def not_found(_e):
    if request.path.startswith("/api/"):
        return jsonify({"error": "요청한 엔드포인트를 찾을 수 없습니다."}), 404
    return render_template("index.html"), 200


@app.errorhandler(500)
def server_error(_e):
    app.logger.exception("Internal server error")
    return jsonify({"error": "서버 내부 오류가 발생했습니다."}), 500


# === 로컬 개발용 실행 (배포는 gunicorn 이 app:app 을 import) ===
if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
