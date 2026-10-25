(() => {
  "use strict";

  const STORAGE = {
    apiKey: "leon_groq_api_key",
    demo: "leon_demo_mode",
    model: "leon_model",
    history: "leon_chat_history",
  };

  const SYSTEM_PROMPT =
    "You are Leon, an all-purpose helpful AI assistant. " +
    "Reply in the same language the user writes in (Cantonese/Traditional Chinese, English, Mandarin, or any other). " +
    "Be warm, clear, and friendly like a helpful friend. " +
    "You are especially good at homework, study tips, everyday life questions, and practical help for a Hong Kong Form 1 student — " +
    "but you help with anything: writing, coding, planning, translating, explaining concepts, brainstorming, and daily tasks. " +
    "Keep answers concise on mobile unless the user asks for detail. Use short paragraphs and bullet points when helpful.";

  const WELCOME =
    "嗨！我係 Leon 👋\n" +
    "一個咩都會幫到手嘅 AI 助手——功課、溫習、寫嘢、翻譯、日常問題，儘管問我。\n\n" +
    "而家係「示範模式」，唔使 API Key 都可以傾。想用真正 AI，撳右上角設定，貼上免費 Groq API Key 就得。";

  const els = {
    chat: document.getElementById("chat"),
    form: document.getElementById("composer"),
    input: document.getElementById("input"),
    sendBtn: document.getElementById("sendBtn"),
    statusText: document.getElementById("statusText"),
    settingsBtn: document.getElementById("settingsBtn"),
    overlay: document.getElementById("settingsOverlay"),
    demoToggle: document.getElementById("demoToggle"),
    apiKeyInput: document.getElementById("apiKeyInput"),
    modelSelect: document.getElementById("modelSelect"),
    saveSettingsBtn: document.getElementById("saveSettingsBtn"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    clearChatBtn: document.getElementById("clearChatBtn"),
  };

  /** @type {{role: string, content: string}[]} */
  let messages = [];
  let busy = false;

  function loadSettings() {
    const demo = localStorage.getItem(STORAGE.demo);
    const apiKey = localStorage.getItem(STORAGE.apiKey) || "";
    const model =
      localStorage.getItem(STORAGE.model) || "llama-3.3-70b-versatile";
    // Default to demo mode if never set
    const demoMode = demo === null ? true : demo === "1";
    return { demoMode, apiKey, model };
  }

  function saveSettings({ demoMode, apiKey, model }) {
    localStorage.setItem(STORAGE.demo, demoMode ? "1" : "0");
    if (apiKey !== undefined) {
      if (apiKey) localStorage.setItem(STORAGE.apiKey, apiKey);
      else localStorage.removeItem(STORAGE.apiKey);
    }
    if (model) localStorage.setItem(STORAGE.model, model);
    updateStatus();
  }

  function updateStatus() {
    const { demoMode, apiKey } = loadSettings();
    if (demoMode) {
      els.statusText.textContent = "示範模式 · 即用";
    } else if (apiKey) {
      els.statusText.textContent = "Groq AI · 已連接";
    } else {
      els.statusText.textContent = "請設定 API Key";
    }
  }

  function persistHistory() {
    try {
      localStorage.setItem(STORAGE.history, JSON.stringify(messages.slice(-40)));
    } catch (_) {
      /* quota */
    }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE.history);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (_) {}
    return null;
  }

  function appendBubble(role, content, opts = {}) {
    const row = document.createElement("div");
    row.className = `msg ${role}`;
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    if (opts.typing) {
      bubble.innerHTML =
        '<div class="typing" aria-label="輸入中"><span></span><span></span><span></span></div>';
    } else {
      bubble.textContent = content;
    }
    row.appendChild(bubble);
    els.chat.appendChild(row);
    els.chat.scrollTop = els.chat.scrollHeight;
    return row;
  }

  function removeNode(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function autoResize() {
    const el = els.input;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function openSettings(force) {
    const { demoMode, apiKey, model } = loadSettings();
    els.demoToggle.checked = demoMode;
    els.apiKeyInput.value = apiKey;
    els.modelSelect.value = model;
    els.overlay.classList.remove("hidden");
    if (force) els.apiKeyInput.focus();
  }

  function closeSettings() {
    els.overlay.classList.add("hidden");
  }

  /** Demo-mode: template replies that echo intent + tip, in user's language pattern */
  function demoReply(userText) {
    const t = userText.trim();
    const lower = t.toLowerCase();
    const isZh =
      /[\u4e00-\u9fff]/.test(t) ||
      /[嘅係咗唔喺嚟邊點]/.test(t);
    const isCanto = /[嘅係咗唔喺嚟邊點咩啲咁]/.test(t);

    // Greetings
    if (/^(hi|hello|hey|哈囉|你好|嗨|早晨|午安|晚安)\b/i.test(t) || t.length < 3 && /^(yo|hey)$/i.test(t)) {
      if (isCanto || isZh) {
        return "嗨！我係 Leon～有咩想問或者想幫手？功課、溫習計劃、翻譯、寫電郵，我都得。";
      }
      return "Hey! I'm Leon — your all-purpose helper. Ask me about homework, study plans, writing, translating, or everyday stuff.";
    }

    // Homework / study
    if (/功課|作业|作業|homework|study|溫習|复习|考試|考试|exam|math|數學|数学|英文|english/i.test(t)) {
      if (isCanto || isZh) {
        return (
          `收到——關於「${t.slice(0, 40)}${t.length > 40 ? "…" : ""}」。\n\n` +
          "示範模式小貼士：\n" +
          "1. 先寫清楚題目同已知條件\n" +
          "2. 一步一步解，唔好跳步\n" +
          "3. 做完用自己嘅話覆述答案\n\n" +
          "貼上完整題目，或者去設定加 Groq API Key，我就可以詳細教你。"
        );
      }
      return (
        `Got it — about “${t.slice(0, 40)}${t.length > 40 ? "…" : ""}”.\n\n` +
        "Demo tip:\n" +
        "1. Write the full question and known info\n" +
        "2. Solve step by step\n" +
        "3. Check by restating the answer\n\n" +
        "Paste the full problem, or add a free Groq API key in Settings for full AI help."
      );
    }

    // Translate
    if (/譯|翻译|翻譯|translate|translation/i.test(t)) {
      if (isCanto || isZh) {
        return (
          `你想翻譯：「${t.slice(0, 60)}${t.length > 60 ? "…" : ""}」\n\n` +
          "示範模式可以記住你嘅意圖。請寫清楚：原文 + 想譯成邊種語言。\n" +
          "例如：「請將呢句譯成英文：……」\n\n" +
          "開真 AI（設定 → Groq Key）就可以即時翻譯。"
        );
      }
      return (
        `You asked to translate: “${t.slice(0, 60)}${t.length > 60 ? "…" : ""}”\n\n` +
        "In demo mode, tell me the source text and target language clearly.\n" +
        "Add a free Groq API key in Settings for live translation."
      );
    }

    // Writing help
    if (/寫|写|作文|電郵|电邮|email|essay|letter|草稿/i.test(t)) {
      if (isCanto || isZh) {
        return (
          `明白，你想寫嘢：「${t.slice(0, 40)}${t.length > 40 ? "…" : ""}」\n\n` +
          "結構建議：開頭 → 重點 2–3 點 → 結尾。\n" +
          "告訴我：對象係邊個、長度、語氣（正式／輕鬆），示範模式可以幫你列大綱；加 API Key 就可以直接幫你起草。"
        );
      }
      return (
        `Understood — writing help for: “${t.slice(0, 40)}${t.length > 40 ? "…" : ""}”\n\n` +
        "Structure tip: hook → 2–3 points → close.\n" +
        "Tell me audience, length, and tone. Add a Groq key in Settings for a full draft."
      );
    }

    // Time / schedule
    if (/時間|时间|日程|schedule|計劃|计划|reminder|提醒/i.test(t)) {
      if (isCanto || isZh) {
        return (
          `關於時間／計劃：「${t.slice(0, 40)}${t.length > 40 ? "…" : ""}」\n\n` +
          "小建議：用「今日必須做 / 可以做 / 可延後」三欄列任務，每項估時間。\n" +
          "加 Groq Key 之後我可以幫你度更細嘅時間表。"
        );
      }
      return (
        `About planning: “${t.slice(0, 40)}${t.length > 40 ? "…" : ""}”\n\n` +
        "Tip: sort tasks into Must / Should / Later and estimate minutes each.\n" +
        "With a Groq API key I can build a full schedule for you."
      );
    }

    // Default: echo intent + tip
    const snippet = t.length > 80 ? t.slice(0, 80) + "…" : t;
    if (isCanto) {
      return (
        `收到你講：「${snippet}」\n\n` +
        "我係 Leon，示範模式而家會用模板回覆。你可以：\n" +
        "• 問功課／溫習方法\n" +
        "• 請我翻譯或改文\n" +
        "• 傾日常問題\n\n" +
        "想要真正 AI 對話 → 右上角設定 → 關閉示範模式 → 貼上 https://console.groq.com/keys 嘅免費 Key。"
      );
    }
    if (isZh) {
      return (
        `收到：「${snippet}」\n\n` +
        "我是 Leon。示範模式會用模板回覆。你可以問功課、翻譯、寫作或日常問題。\n\n" +
        "要真正 AI：設定 → 關閉示範模式 → 貼上免費 Groq API Key（console.groq.com/keys）。"
      );
    }
    return (
      `Got your message: “${snippet}”\n\n` +
      "I'm Leon. Demo mode uses helpful template replies. Try homework help, translation, writing, or everyday questions.\n\n" +
      "For real AI: Settings → turn off Demo → paste a free key from console.groq.com/keys."
    );
  }

  async function callGroq(history) {
    const { apiKey, model } = loadSettings();
    if (!apiKey) {
      const err = new Error("NO_KEY");
      throw err;
    }
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) {
      let detail = "";
      try {
        const j = await res.json();
        detail = j.error?.message || JSON.stringify(j);
      } catch (_) {
        detail = await res.text();
      }
      throw new Error(detail || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty response from Groq");
    return text.trim();
  }

  async function handleSend(text) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const { demoMode, apiKey } = loadSettings();
    if (!demoMode && !apiKey) {
      openSettings(true);
      appendBubble(
        "system",
        "請先貼上 Groq API Key，或開啟「示範模式」先試用。"
      );
      return;
    }

    busy = true;
    els.sendBtn.disabled = true;

    messages.push({ role: "user", content: trimmed });
    appendBubble("user", trimmed);
    persistHistory();
    els.input.value = "";
    autoResize();

    const typing = appendBubble("assistant", "", { typing: true });

    try {
      let reply;
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
        reply = demoReply(trimmed);
      } else {
        const history = messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .slice(-20);
        reply = await callGroq(history);
      }
      removeNode(typing);
      messages.push({ role: "assistant", content: reply });
      appendBubble("assistant", reply);
      persistHistory();
    } catch (err) {
      removeNode(typing);
      // Keep the user message in history/UI; show error as a system bubble
      const msg =
        err.message === "NO_KEY"
          ? "未設定 API Key。請開設定或啟用示範模式。"
          : `出錯：${err.message || err}`;
      appendBubble("system", msg);
      if (err.message === "NO_KEY") openSettings(true);
      persistHistory();
    } finally {
      busy = false;
      els.sendBtn.disabled = false;
      els.input.focus();
    }
  }

  function initChat() {
    const saved = loadHistory();
    if (saved && saved.length) {
      messages = saved;
      for (const m of messages) {
        if (m.role === "user" || m.role === "assistant") {
          appendBubble(m.role, m.content);
        }
      }
    } else {
      messages = [{ role: "assistant", content: WELCOME }];
      appendBubble("assistant", WELCOME);
      persistHistory();
    }
    updateStatus();
  }

  // Events
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSend(els.input.value);
  });

  els.input.addEventListener("input", autoResize);
  els.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(els.input.value);
    }
  });

  els.settingsBtn.addEventListener("click", () => openSettings(false));
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  els.overlay.addEventListener("click", (e) => {
    if (e.target === els.overlay) closeSettings();
  });

  els.saveSettingsBtn.addEventListener("click", () => {
    saveSettings({
      demoMode: els.demoToggle.checked,
      apiKey: els.apiKeyInput.value.trim(),
      model: els.modelSelect.value,
    });
    closeSettings();
    appendBubble(
      "system",
      els.demoToggle.checked
        ? "已儲存：示範模式開啟。"
        : els.apiKeyInput.value.trim()
          ? "已儲存：將使用 Groq AI。"
          : "已儲存。未有 API Key——傳送訊息時會再開設定。"
    );
  });

  els.clearChatBtn.addEventListener("click", () => {
    messages = [{ role: "assistant", content: WELCOME }];
    els.chat.innerHTML = "";
    appendBubble("assistant", WELCOME);
    persistHistory();
    closeSettings();
  });

  // Service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  initChat();
})();
