"""Gemini API 래퍼.

- 분석 유형/언어에 맞는 프롬프트를 조립하고
- JSON 모드로 Gemini를 호출해
- 6개 섹션(summary / problems / improvements / fixed_code / performance / learning_points)
  으로 구조화된 dict를 반환합니다.

에러는 항상 사용자에게 안전한 한국어 메시지로 래핑됩니다.
원인 예외는 `raise ... from exc` 로 체이닝되어 서버 로그에서만 확인할 수 있습니다.
"""

import json
import os

from google import genai
from google.genai import types


class GeminiServiceError(Exception):
    """Gemini 호출/응답 처리 실패. 메시지는 사용자에게 그대로 노출되어도 안전해야 합니다."""


ANALYSIS_INSTRUCTIONS = {
    "code_review": (
        "코드 품질, 가독성, 네이밍, 구조, 잠재적 문제를 전반적으로 검토하세요. "
        "problems와 improvements를 모두 풍부하게 채우고, 큰 개선이 필요한 경우에만 fixed_code를 작성합니다. "
        "learning_points로 교육적 가치를 제공하는 데 집중하세요."
    ),
    "bug_fix": (
        "버그, 오류, 누락된 예외 처리, 경계 조건 문제를 우선적으로 찾으세요. "
        "problems의 severity를 정확히 부여하고, fixed_code에 모든 버그가 수정된 전체 코드를 반드시 포함하세요. "
        "수정 전후의 동작 차이를 performance.explanation에서 함께 언급해도 좋습니다."
    ),
    "refactoring": (
        "동작은 동일하게 유지하면서 코드 구조, 가독성, 재사용성을 개선하세요. "
        "improvements를 핵심으로 채우고, fixed_code에 리팩토링된 전체 코드를 포함하세요. "
        "복잡도 변화가 있으면 performance에 기록하세요."
    ),
    "performance": (
        "성능 병목, 시간/공간 복잡도, 비효율적 패턴을 우선적으로 찾으세요. "
        "performance 섹션을 가장 상세히 작성하고, Big-O 표기법을 사용하세요. "
        "fixed_code에 최적화된 전체 코드를 포함하세요."
    ),
}

LANGUAGE_LABELS = {
    "java": "Java",
    "python": "Python",
    "javascript": "JavaScript",
}


def _build_prompt(code: str, language: str, analysis_type: str) -> str:
    instruction = ANALYSIS_INSTRUCTIONS[analysis_type]
    language_label = LANGUAGE_LABELS[language]

    return f"""당신은 숙련된 시니어 소프트웨어 엔지니어이자 멘토입니다.
사용자가 제출한 {language_label} 코드를 분석하고, 아래 6개 섹션을 모두 채워 한국어로 응답하세요.

[현재 분석 유형: {analysis_type}]
{instruction}

[응답 JSON 스키마]
반드시 아래 형식의 단일 JSON 객체만 출력하세요. 마크다운 코드 펜스나 다른 텍스트는 절대 포함하지 마세요.

{{
  "summary": "코드가 무엇을 하는지 2~3문장으로 요약. 사용 언어 특징·핵심 알고리즘을 간단히 언급.",

  "problems": [
    {{
      "title": "문제 제목 (한 줄)",
      "severity": "high | medium | low | info 중 하나",
      "description": "문제의 원인과 영향을 2~4문장으로 설명. 코드 인용은 인라인 백틱(`code`) 사용.",
      "line": "관련 라인 번호 또는 범위 (예: '12' 또는 '8-15'). 해당 없으면 빈 문자열"
    }}
  ],

  "improvements": [
    {{
      "title": "개선 제안 제목 (한 줄)",
      "description": "어떻게 개선할지 + 왜 좋은지를 2~4문장으로 설명",
      "line": "관련 라인 (없으면 빈 문자열)"
    }}
  ],

  "fixed_code": "수정/개선된 전체 코드. 코드 펜스(```) 없이 순수 코드만. 적용할 변경이 없으면 빈 문자열.",

  "performance": {{
    "before": "원본 코드의 시간/공간 복잡도 (예: 'Time O(n²), Space O(1)'). 알고리즘이 아니라 단순 코드라면 'N/A' 또는 핵심 특성 1줄.",
    "after": "개선 후 시간/공간 복잡도. 변화가 없으면 'before와 동일'",
    "explanation": "성능 특성·복잡도 변화·실무적 함의를 2~4문장으로 설명. 분석 유형이 성능이 아니더라도 간단히 작성."
  }},

  "learning_points": [
    {{
      "title": "학습 포인트 제목 (예: '리스트 컴프리헨션 vs for 루프')",
      "description": "주니어 개발자가 알면 좋은 개념·원리·베스트 프랙티스를 2~3문장으로. 코드 인용은 백틱."
    }}
  ]
}}

[작성 규칙]
- problems와 learning_points는 1~5개 항목. 빈 배열 금지 (문제가 없으면 'info' severity로 칭찬 항목이라도 작성).
- improvements도 1~5개 권장. 정말 추가 개선안이 없으면 빈 배열 허용.
- description 안에서 마크다운 헤딩(#), 굵은체(**), 코드 펜스(```)는 사용 금지. 인라인 백틱(`)만 허용.
- 코드 라인 번호는 1부터 시작.
- 모든 텍스트는 한국어 (변수명·코드는 원문 그대로).

[분석할 코드]
```{language}
{code}
```
"""


def analyze_code(code: str, language: str, analysis_type: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # 배포자/관리자용 메시지. 키 값 자체는 절대 노출되지 않음.
        raise GeminiServiceError(
            "AI 서비스가 설정되지 않았습니다. 잠시 후 다시 시도해주세요."
        )

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    prompt = _build_prompt(code=code, language=language, analysis_type=analysis_type)

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
    except Exception as exc:  # noqa: BLE001 — 모든 SDK 예외를 래핑
        raise GeminiServiceError(
            "AI 분석 서비스에 일시적으로 연결할 수 없습니다. 잠시 후 다시 시도해주세요."
        ) from exc

    text = (response.text or "").strip()
    if not text:
        raise GeminiServiceError("AI가 빈 응답을 반환했습니다. 다시 시도해주세요.")

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise GeminiServiceError(
            "AI 응답을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요."
        ) from exc

    return {
        "summary": parsed.get("summary", ""),
        "problems": parsed.get("problems", []),
        "improvements": parsed.get("improvements", []),
        "fixed_code": parsed.get("fixed_code", ""),
        "performance": parsed.get("performance", {}),
        "learning_points": parsed.get("learning_points", []),
        "language": language,
        "analysis_type": analysis_type,
        "model": model_name,
    }
