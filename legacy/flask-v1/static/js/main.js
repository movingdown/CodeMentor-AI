const $ = (id) => document.getElementById(id);

const els = {
  code: $("code"),
  charCount: $("charCount"),
  editorTitle: $("editorTitle"),
  exampleBtn: $("exampleBtn"),
  languageGroup: $("languageGroup"),
  analysisGroup: $("analysisGroup"),
  analyzeBtn: $("analyzeBtn"),
  clearBtn: $("clearBtn"),
  copyBtn: $("copyBtn"),

  inputWarning: $("inputWarning"),
  warningIcon: $("warningIcon"),
  warningText: $("warningText"),
  warningCloseBtn: $("warningCloseBtn"),

  placeholder: $("placeholder"),
  loadingState: $("loadingState"),
  errorState: $("errorState"),
  errorMessage: $("errorMessage"),
  result: $("result"),

  summary: $("summary"),
  analysisTypeBadge: $("analysisTypeBadge"),
  modelBadge: $("modelBadge"),

  problemsCard: $("problemsCard"),
  problems: $("problems"),
  problemsCount: $("problemsCount"),

  improvementsCard: $("improvementsCard"),
  improvements: $("improvements"),
  improvementsCount: $("improvementsCount"),

  fixedCodeCard: $("fixedCodeCard"),
  fixedCode: $("fixedCode"),
  fixedFilename: $("fixedFilename"),

  performanceCard: $("performanceCard"),
  perfBefore: $("perfBefore"),
  perfAfter: $("perfAfter"),
  perfExplanation: $("perfExplanation"),

  learningCard: $("learningCard"),
  learningPoints: $("learningPoints"),
  learningCount: $("learningCount"),
};

const LANGUAGE_META = {
  python:     { label: "Python",     ext: "py" },
  java:       { label: "Java",       ext: "java" },
  javascript: { label: "JavaScript", ext: "js" },
};

const ANALYSIS_LABELS = {
  code_review: "📋 코드 리뷰",
  bug_fix:     "🐛 버그 수정",
  refactoring: "🔧 리팩토링",
  performance: "⚡ 성능 개선",
};

const SEVERITY_LABELS = {
  high: "심각", medium: "주의", low: "참고", info: "정보",
};

const VALID_SEVERITIES = new Set(["high", "medium", "low", "info"]);

// === 분석기 데모용 예제 (의도된 문제를 포함) ===
const EXAMPLES = {
  python: `def find_duplicates(items):
    result = []
    for i in range(len(items)):
        for j in range(len(items)):
            if i != j and items[i] == items[j]:
                if items[i] not in result:
                    result.append(items[i])
    return result


nums = [1, 2, 3, 2, 4, 1, 5, 3]
print(find_duplicates(nums))
`,
  java: `import java.util.*;

public class Calculator {
    public int sum(List<Integer> numbers) {
        int total = 0;
        for (int i = 0; i < numbers.size(); i++) {
            total = total + numbers.get(i);
        }
        return total;
    }

    public double average(List<Integer> numbers) {
        int total = sum(numbers);
        return total / numbers.size();
    }
}
`,
  javascript: `function getActiveAdults(users) {
    var result = [];
    for (var i = 0; i < users.length; i++) {
        if (users[i].age >= 18) {
            if (users[i].active == true) {
                result.push({
                    name: users[i].name,
                    email: users[i].email
                });
            }
        }
    }
    return result;
}
`,
};

const state = {
  language: "python",
  analysisType: "code_review",
  maxCodeLength: 20000, // /api/config 로 덮어씀
};

// ───────────────────────── helpers
function showState(name) {
  els.placeholder.classList.toggle("hidden", name !== "empty");
  els.loadingState.classList.toggle("hidden", name !== "loading");
  els.errorState.classList.toggle("hidden", name !== "error");
  els.result.classList.toggle("hidden", name !== "result");
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineCode(text) {
  return escapeHtml(text).replace(/`([^`\n]+)`/g, "<code>$1</code>");
}

function showWarning(message, type = "warning") {
  els.inputWarning.classList.remove("hidden");
  els.inputWarning.classList.toggle("is-error", type === "error");
  els.warningIcon.textContent = type === "error" ? "⛔" : "⚠️";
  els.warningText.textContent = message;
}

function hideWarning() {
  els.inputWarning.classList.add("hidden");
}

function setupPillGroup(groupEl, attr, onChange) {
  groupEl.addEventListener("click", (e) => {
    const target = e.target.closest(`[data-${attr}]`);
    if (!target) return;
    groupEl.querySelectorAll("[data-active]").forEach((b) => b.removeAttribute("data-active"));
    target.setAttribute("data-active", "true");
    onChange(target.dataset[attr]);
  });
}

function updateEditorTitle() {
  els.editorTitle.textContent = `snippet.${LANGUAGE_META[state.language].ext}`;
}

function updateExampleBtn() {
  els.exampleBtn.textContent = `📝 ${LANGUAGE_META[state.language].label} 예제`;
}

function updateCharCount() {
  const n = els.code.value.length;
  const max = state.maxCodeLength;
  els.charCount.textContent = `${n.toLocaleString()} / ${max.toLocaleString()}`;

  const ratio = n / max;
  const over = n > max;
  els.charCount.classList.toggle("chars-warn", ratio >= 0.8 && !over);
  els.charCount.classList.toggle("chars-over", over);
  els.analyzeBtn.disabled = over;

  if (over) {
    showWarning(
      `코드가 한도를 ${(n - max).toLocaleString()}자 초과했습니다. ${max.toLocaleString()}자 이내로 줄여주세요.`,
      "error",
    );
  } else if (els.inputWarning.classList.contains("is-error") || n > 0) {
    hideWarning();
  }
}

function insertExample() {
  const code = EXAMPLES[state.language];
  if (!code) return;
  els.code.value = code;
  updateCharCount();
  hideWarning();
  els.code.focus();
  els.code.setSelectionRange(0, 0);
  els.code.scrollTop = 0;
}

// ───────────────────────── renderers
function renderProblems(problems) {
  els.problems.innerHTML = "";
  const list = Array.isArray(problems) ? problems : [];
  els.problemsCount.textContent = String(list.length);

  if (list.length === 0) {
    els.problems.innerHTML =
      '<li class="sev-low"><div class="item-desc">✅ 발견된 문제점이 없습니다. 잘 작성된 코드입니다!</div></li>';
    return;
  }

  for (const item of list) {
    const raw = (item.severity || "info").toLowerCase();
    const sev = VALID_SEVERITIES.has(raw) ? raw : "info";
    const li = document.createElement("li");
    li.className = `sev-${sev}`;
    const line = item.line ? `<span class="line-badge">L${escapeHtml(item.line)}</span>` : "";
    li.innerHTML = `
      <div class="item-head">
        <div class="item-title">${escapeHtml(item.title || "(제목 없음)")}</div>
        <div class="item-meta">
          ${line}
          <span class="badge sev-${sev}">${SEVERITY_LABELS[sev]}</span>
        </div>
      </div>
      <div class="item-desc">${inlineCode(item.description || "")}</div>
    `;
    els.problems.appendChild(li);
  }
}

function renderImprovements(improvements) {
  els.improvements.innerHTML = "";
  const list = Array.isArray(improvements) ? improvements : [];
  els.improvementsCount.textContent = String(list.length);

  if (list.length === 0) {
    els.improvements.innerHTML =
      '<li><div class="item-desc">제안할 추가 개선사항이 없습니다.</div></li>';
    return;
  }

  for (const item of list) {
    const obj = typeof item === "string" ? { title: "", description: item } : item;
    const li = document.createElement("li");
    const line = obj.line ? `<span class="line-badge">L${escapeHtml(obj.line)}</span>` : "";
    li.innerHTML = `
      <div class="item-head">
        <div class="item-title">${escapeHtml(obj.title || "(제목 없음)")}</div>
        <div class="item-meta">${line}</div>
      </div>
      <div class="item-desc">${inlineCode(obj.description || "")}</div>
    `;
    els.improvements.appendChild(li);
  }
}

function renderFixedCode(code, language) {
  if (!code || !code.trim()) {
    els.fixedCodeCard.classList.add("hidden");
    return;
  }
  els.fixedCodeCard.classList.remove("hidden");
  els.fixedFilename.textContent = `fixed.${LANGUAGE_META[language].ext}`;
  els.fixedCode.className = `language-${language}`;
  els.fixedCode.textContent = code;
  if (window.Prism) window.Prism.highlightElement(els.fixedCode);
}

function renderPerformance(perf) {
  const before = (perf && perf.before) || "";
  const after = (perf && perf.after) || "";
  const explanation = (perf && perf.explanation) || "";
  if (!before && !after && !explanation) {
    els.performanceCard.classList.add("hidden");
    return;
  }
  els.performanceCard.classList.remove("hidden");
  els.perfBefore.textContent = before || "—";
  els.perfAfter.textContent = after || "—";
  els.perfExplanation.innerHTML = inlineCode(explanation);
}

function renderLearningPoints(points) {
  els.learningPoints.innerHTML = "";
  const list = Array.isArray(points) ? points : [];
  if (list.length === 0) {
    els.learningCard.classList.add("hidden");
    return;
  }
  els.learningCard.classList.remove("hidden");
  els.learningCount.textContent = String(list.length);

  for (const p of list) {
    const obj = typeof p === "string" ? { title: "", description: p } : p;
    const li = document.createElement("li");
    li.innerHTML = `
      ${obj.title ? `<div class="learning-title">${escapeHtml(obj.title)}</div>` : ""}
      <div class="learning-desc">${inlineCode(obj.description || "")}</div>
    `;
    els.learningPoints.appendChild(li);
  }
}

// ───────────────────────── main actions
async function analyze() {
  const code = els.code.value.trim();

  if (!code) {
    showWarning("분석할 코드를 입력해주세요. '📝 예제' 버튼으로 샘플을 불러올 수 있어요.", "warning");
    els.code.focus();
    return;
  }
  if (code.length > state.maxCodeLength) {
    showWarning(
      `코드가 ${state.maxCodeLength.toLocaleString()}자 한도를 초과했습니다.`,
      "error",
    );
    return;
  }
  hideWarning();

  els.analyzeBtn.disabled = true;
  showState("loading");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language: state.language,
        analysis_type: state.analysisType,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `요청 실패 (HTTP ${response.status})`);
    }

    els.summary.textContent = data.summary || "";
    els.analysisTypeBadge.textContent = ANALYSIS_LABELS[state.analysisType] || "";
    renderProblems(data.problems);
    renderImprovements(data.improvements);
    renderFixedCode(data.fixed_code, state.language);
    renderPerformance(data.performance);
    renderLearningPoints(data.learning_points);

    els.modelBadge.textContent = data.model || "gemini";
    els.modelBadge.classList.remove("hidden");

    showState("result");
  } catch (err) {
    els.errorMessage.textContent = err.message;
    showState("error");
  } finally {
    els.analyzeBtn.disabled = els.code.value.length > state.maxCodeLength;
  }
}

function clearAll() {
  els.code.value = "";
  updateCharCount();
  hideWarning();
  els.modelBadge.classList.add("hidden");
  showState("empty");
  els.code.focus();
}

async function copyFixedCode() {
  const text = els.fixedCode.textContent;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const textEl = els.copyBtn.querySelector(".copy-text");
    const original = textEl.textContent;
    textEl.textContent = "복사됨!";
    setTimeout(() => (textEl.textContent = original), 1500);
  } catch {
    showWarning("클립보드 복사에 실패했습니다.", "error");
  }
}

async function loadConfig() {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) return;
    const cfg = await res.json();
    if (cfg.max_code_length) {
      state.maxCodeLength = cfg.max_code_length;
      updateCharCount();
    }
  } catch {
    /* keep default */
  }
}

// ───────────────────────── wire-up
setupPillGroup(els.languageGroup, "language", (v) => {
  state.language = v;
  updateEditorTitle();
  updateExampleBtn();
});

setupPillGroup(els.analysisGroup, "analysis", (v) => {
  state.analysisType = v;
});

els.code.addEventListener("input", updateCharCount);
els.code.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    analyze();
  }
});

els.analyzeBtn.addEventListener("click", analyze);
els.clearBtn.addEventListener("click", clearAll);
els.copyBtn.addEventListener("click", copyFixedCode);
els.exampleBtn.addEventListener("click", insertExample);
els.warningCloseBtn.addEventListener("click", hideWarning);

updateEditorTitle();
updateExampleBtn();
updateCharCount();
showState("empty");
loadConfig();
