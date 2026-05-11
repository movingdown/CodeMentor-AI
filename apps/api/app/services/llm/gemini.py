"""Gemini wrapper — streaming chat + one-shot generation.

Why a thin wrapper:
  - 라우터는 LLM 벤더를 몰라야 한다. 교체 시 여기만 갈아끼움.
  - 도메인 메시지 → Gemini 포맷 변환을 한 곳에 모음.
"""
from collections.abc import AsyncIterator
from dataclasses import dataclass

from google import genai
from google.genai import types

from app.core.config import get_settings

settings = get_settings()


class LLMError(Exception):
    """User-safe error message."""


SYSTEM_PROMPT = """당신은 친절한 시니어 소프트웨어 엔지니어이자 멘토입니다.

규칙:
- 한국어로 답변하되, 기술 용어는 원문 그대로 두세요.
- 코드 예제는 반드시 ```언어 ... ``` 마크다운 코드 블록으로 감싸세요.
- 답변은 핵심부터 짧고 명확하게.
"""


@dataclass
class ChatTurn:
    """LLM에 전달할 단일 대화 턴."""

    role: str  # "user" | "assistant"
    content: str


def _to_gemini_contents(turns: list[ChatTurn]) -> list[dict]:
    """우리 도메인 메시지 → Gemini contents. system role은 별도 처리."""
    return [
        {
            "role": "user" if t.role == "user" else "model",
            "parts": [{"text": t.content}],
        }
        for t in turns
        if t.content.strip() and t.role in ("user", "assistant")
    ]


def _client() -> "genai.Client":
    if not settings.gemini_api_key:
        raise LLMError("AI 서비스가 설정되지 않았습니다.")
    return genai.Client(api_key=settings.gemini_api_key)


async def stream_chat(turns: list[ChatTurn]) -> AsyncIterator[str]:
    """멀티턴 히스토리를 Gemini에 보내고 토큰을 흘려보냄."""
    if not turns:
        raise LLMError("빈 대화는 보낼 수 없습니다.")

    contents = _to_gemini_contents(turns)
    if not contents:
        raise LLMError("유효한 메시지가 없습니다.")

    try:
        stream = await _client().aio.models.generate_content_stream(
            model=settings.gemini_model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.7,
            ),
        )
        async for chunk in stream:
            text = chunk.text or ""
            if text:
                yield text
    except LLMError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise LLMError("AI 응답 중 오류가 발생했어요.") from exc


async def generate_text(
    prompt: str,
    system_instruction: str | None = None,
    temperature: float = 0.5,
) -> str:
    """One-shot generation. README / Summary 등 비스트리밍 용도."""
    try:
        response = await _client().aio.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature,
            ),
        )
        text = (response.text or "").strip()
        if not text:
            raise LLMError("AI가 빈 응답을 반환했어요.")
        return text
    except LLMError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise LLMError("AI 호출 중 오류가 발생했어요.") from exc
