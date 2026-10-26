(() => {
  "use strict";

  const STORAGE = {
    apiKey: "leon_api_key",
    apiKeyLegacy: "leon_groq_api_key",
    provider: "leon_provider",
    demo: "leon_demo_mode",
    model: "leon_model",
    history: "leon_chat_history", // legacy single-chat
    chats: "leon_chats_v1",
    activeChat: "leon_active_chat_id",
    tipSeen: "leon_tip_seen_v1",
  };

  const PROVIDERS = {
    gemini: {
      id: "gemini",
      label: "Gemini",
      status: "Gemini AI · 已連接",
      keyUrl: "https://aistudio.google.com/apikey",
      keyLinkText: "去 Google AI Studio 拎免費 Gemini Key",
      keyPlaceholder: "貼上 Google AI Studio 嘅 API Key",
      explain:
        "API key 就好似一條<strong>免費密碼</strong>。香港推薦用 <strong>Google Gemini</strong>——" +
        "Groq 喺香港好多時會顯示 Forbidden。去 Google AI Studio 免費拎 Key 貼上就得。",
      models: [
        { value: "gemini-3.5-flash-lite", label: "gemini-3.5-flash-lite（推薦·免費）" },
        { value: "gemini-3.8-flash", label: "gemini-3.8-flash（較強）" },
        { value: "gemini-3.6-flash", label: "gemini-3.6-flash" },
        { value: "gemini-2.5-flash", label: "gemini-2.5-flash（舊版）" },
      ],
      defaultModel: "gemini-3.5-flash-lite",
      visionModels: null, // all gemini flash models see images
    },
    openrouter: {
      id: "openrouter",
      label: "OpenRouter",
      status: "OpenRouter · 已連接",
      keyUrl: "https://openrouter.ai/keys",
      keyLinkText: "去 OpenRouter 拎 API key",
      keyPlaceholder: "貼上 sk-or-… 開頭嘅 Key",
      explain:
        "OpenRouter 可以選用多種模型（有啲免費）。若 Safari 出現跨域錯誤，請改用 Gemini。",
      models: [
        { value: "google/gemini-2.5-flash", label: "google/gemini-2.5-flash" },
        { value: "google/gemini-2.0-flash-exp:free", label: "gemini-2.0-flash-exp:free" },
        { value: "meta-llama/llama-3.3-70b-instruct:free", label: "llama-3.3-70b:free" },
      ],
      defaultModel: "google/gemini-2.5-flash",
      visionModels: new Set([
        "google/gemini-2.5-flash",
        "google/gemini-2.0-flash-exp:free",
      ]),
    },
    groq: {
      id: "groq",
      label: "Groq",
      status: "Groq AI · 已連接",
      keyUrl: "https://console.groq.com/keys",
      keyLinkText: "去 Groq 拎 API key（香港可能 Forbidden）",
      keyPlaceholder: "貼上 gsk_… 開頭嘅 Key",
      explain:
        "Groq 喺<strong>香港好多時會顯示 Forbidden</strong>，用不了。請改揀上面嘅 <strong>Google Gemini</strong>。",
      models: [
        { value: "llama-3.3-70b-versatile", label: "llama-3.3-70b-versatile" },
        { value: "llama-3.1-8b-instant", label: "llama-3.1-8b-instant（較快）" },
        { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "llama-4-scout（可睇相）" },
        { value: "qwen/qwen3.8-27b", label: "qwen3.8-27b（可睇相）" },
      ],
      defaultModel: "llama-3.3-70b-versatile",
      visionModels: new Set([
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "qwen/qwen3.8-27b",
      ]),
      defaultVisionModel: "meta-llama/llama-4-scout-17b-16e-instruct",
    },
  };

  const MAX_ATTACHMENTS = 5;
  const MAX_IMAGE_EDGE = 1280;
  const MAX_TEXT_CHARS = 40000;
  const MAX_FILE_BYTES = 12 * 1024 * 1024;

  const SYSTEM_PROMPT =
    "You are Leon, an all-purpose helpful AI assistant. " +
    "Reply in the same language the user writes in (Cantonese/Traditional Chinese, English, Mandarin, or any other). " +
    "Be warm, clear, and friendly like a helpful friend. " +
    "You are especially good at homework, study tips, everyday life questions, and practical help for a Hong Kong Form 1 student — " +
    "but you help with anything: writing, coding, planning, translating, explaining concepts, brainstorming, and daily tasks. " +
    "When the user sends images, describe and reason about what you see helpfully. " +
    "When they send files, acknowledge the file and use any provided text content. " +
    "Keep answers concise on mobile unless the user asks for detail. Use short paragraphs and bullet points when helpful.";

  const WELCOME =
    "嗨！我係 Leon 👋\n" +
    "一個咩都會幫到手嘅 AI 助手——功課、溫習、寫嘢、翻譯、日常問題，儘管問我。\n\n" +
    "而家可以影相、揀相，或者傳檔案畀我（撳輸入欄左邊 📎）。\n\n" +
    "而家係「示範模式」，唔使 API Key 都可以傾。想用真正 AI（包括睇相）：\n" +
    "撳右上角設定 → 揀 Google Gemini（香港推薦）→ 去 Google AI Studio 拎免費 Key 貼上 → 關閉示範模式。\n\n" +
    "（Groq 喺香港好多時會 Forbidden，唔好用佢。）\n\n" +
    "想開新話題？撳右上 ＋ 或者左邊選單入面「新對話」。";

  const els = {
    chat: document.getElementById("chat"),
    form: document.getElementById("composer"),
    input: document.getElementById("input"),
    sendBtn: document.getElementById("sendBtn"),
    statusText: document.getElementById("statusText"),
    chatTitle: document.getElementById("chatTitle"),
    settingsBtn: document.getElementById("settingsBtn"),
    overlay: document.getElementById("settingsOverlay"),
    demoToggle: document.getElementById("demoToggle"),
    providerSelect: document.getElementById("providerSelect"),
    apiKeyInput: document.getElementById("apiKeyInput"),
    apiExplain: document.getElementById("apiExplain"),
    apiHint: document.getElementById("apiHint"),
    keyLink: document.getElementById("keyLink"),
    modelSelect: document.getElementById("modelSelect"),
    modelHint: document.getElementById("modelHint"),
    saveSettingsBtn: document.getElementById("saveSettingsBtn"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    clearChatBtn: document.getElementById("clearChatBtn"),
    attachBtn: document.getElementById("attachBtn"),
    attachOverlay: document.getElementById("attachOverlay"),
    closeAttachBtn: document.getElementById("closeAttachBtn"),
    optCamera: document.getElementById("optCamera"),
    optGallery: document.getElementById("optGallery"),
    optFile: document.getElementById("optFile"),
    cameraInput: document.getElementById("cameraInput"),
    galleryInput: document.getElementById("galleryInput"),
    fileInput: document.getElementById("fileInput"),
    attachPreview: document.getElementById("attachPreview"),
    menuBtn: document.getElementById("menuBtn"),
    newChatBtn: document.getElementById("newChatBtn"),
    sidebarOverlay: document.getElementById("sidebarOverlay"),
    closeSidebarBtn: document.getElementById("closeSidebarBtn"),
    sidebarNewChat: document.getElementById("sidebarNewChat"),
    chatList: document.getElementById("chatList"),
    tipBanner: document.getElementById("tipBanner"),
    tipOpenSettings: document.getElementById("tipOpenSettings"),
    tipDismiss: document.getElementById("tipDismiss"),
  };

  /** @type {{id: string, title: string, messages: object[], updatedAt: number}[]} */
  let chats = [];
  /** @type {string|null} */
  let activeChatId = null;
  /** @type {{role: string, content: string, attachments?: object[]}[]} */
  let messages = [];
  /** @type {{id: string, name: string, type: string, size: number, kind: string, previewUrl?: string, dataUrl?: string, textContent?: string}[]} */
  let pending = [];
  let busy = false;

  function getProviderMeta(id) {
    return PROVIDERS[id] || PROVIDERS.gemini;
  }

  function loadSettings() {
    const demo = localStorage.getItem(STORAGE.demo);
    let apiKey = localStorage.getItem(STORAGE.apiKey) || "";
    if (!apiKey) {
      const legacy = localStorage.getItem(STORAGE.apiKeyLegacy) || "";
      if (legacy) {
        apiKey = legacy;
        localStorage.setItem(STORAGE.apiKey, legacy);
      }
    }
    let provider = localStorage.getItem(STORAGE.provider) || "gemini";
    if (!PROVIDERS[provider]) provider = "gemini";
    // If user only had a Groq key from before and never set provider, keep groq
    if (!localStorage.getItem(STORAGE.provider) && localStorage.getItem(STORAGE.apiKeyLegacy) && !localStorage.getItem(STORAGE.apiKey)) {
      provider = "groq";
    }
    const meta = getProviderMeta(provider);
    let model = localStorage.getItem(STORAGE.model) || meta.defaultModel;
    const known = meta.models.some((m) => m.value === model);
    if (!known) model = meta.defaultModel;
    const demoMode = demo === null ? true : demo === "1";
    return { demoMode, apiKey, model, provider };
  }

  function saveSettings({ demoMode, apiKey, model, provider }) {
    localStorage.setItem(STORAGE.demo, demoMode ? "1" : "0");
    if (provider && PROVIDERS[provider]) {
      localStorage.setItem(STORAGE.provider, provider);
    }
    if (apiKey !== undefined) {
      if (apiKey) localStorage.setItem(STORAGE.apiKey, apiKey);
      else localStorage.removeItem(STORAGE.apiKey);
    }
    if (model) localStorage.setItem(STORAGE.model, model);
    updateStatus();
  }

  function updateStatus() {
    const { demoMode, apiKey, provider } = loadSettings();
    if (demoMode) {
      els.statusText.textContent = "示範模式 · 即用";
    } else if (apiKey) {
      els.statusText.textContent = getProviderMeta(provider).status;
    } else {
      els.statusText.textContent = "請設定 API Key";
    }
  }

  function fillModelSelect(provider, selected) {
    const meta = getProviderMeta(provider);
    els.modelSelect.innerHTML = "";
    for (const m of meta.models) {
      const opt = document.createElement("option");
      opt.value = m.value;
      opt.textContent = m.label;
      els.modelSelect.appendChild(opt);
    }
    const want = selected || meta.defaultModel;
    if (meta.models.some((m) => m.value === want)) {
      els.modelSelect.value = want;
    } else {
      els.modelSelect.value = meta.defaultModel;
    }
  }

  function applyProviderUI(provider) {
    const meta = getProviderMeta(provider);
    els.apiExplain.innerHTML = meta.explain;
    els.keyLink.href = meta.keyUrl;
    els.keyLink.textContent = meta.keyLinkText;
    els.apiKeyInput.placeholder = meta.keyPlaceholder;
    fillModelSelect(provider, els.modelSelect.value);
    if (provider === "gemini") {
      els.modelHint.textContent = "Gemini 預設已支援睇相。香港推薦用呢個供應商。";
    } else if (provider === "openrouter") {
      els.modelHint.textContent = "若 Safari 報跨域／CORS 錯誤，請改用 Gemini。";
    } else {
      els.modelHint.textContent = "Groq 喺香港可能 Forbidden。傳相時會自動改用可睇相模型。";
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function uid() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function isTextLike(file) {
    const t = (file.type || "").toLowerCase();
    const n = (file.name || "").toLowerCase();
    if (t.startsWith("text/")) return true;
    if (
      t === "application/json" ||
      t === "application/csv" ||
      t === "application/xml"
    )
      return true;
    return /\.(txt|md|csv|json|log|xml|html|htm|js|ts|css|py|c|cpp|h|java|rb|go|rs|yml|yaml)$/.test(
      n
    );
  }

  function slimMessages(list) {
    return list.slice(-40).map((m) => {
      const copy = { role: m.role, content: m.content };
      if (m.attachments && m.attachments.length) {
        copy.attachments = m.attachments.map((a) => ({
          name: a.name,
          type: a.type,
          size: a.size,
          kind: a.kind,
          previewUrl:
            a.kind === "image" && a.previewUrl && a.previewUrl.length < 180000
              ? a.previewUrl
              : undefined,
        }));
      }
      return copy;
    });
  }

  function titleFromMessages(list) {
    const firstUser = (list || []).find(
      (m) => m.role === "user" && (m.content || "").trim()
    );
    if (firstUser) {
      const t = firstUser.content.trim().replace(/\s+/g, " ");
      return t.length > 28 ? t.slice(0, 28) + "…" : t;
    }
    const hasAtt = (list || []).some(
      (m) => m.role === "user" && m.attachments && m.attachments.length
    );
    if (hasAtt) return "附件對話";
    return "新對話";
  }

  function persistChats() {
    const active = chats.find((c) => c.id === activeChatId);
    if (active) {
      active.messages = slimMessages(messages);
      active.title = titleFromMessages(messages);
      active.updatedAt = Date.now();
    }
    try {
      localStorage.setItem(STORAGE.chats, JSON.stringify(chats));
      if (activeChatId) {
        localStorage.setItem(STORAGE.activeChat, activeChatId);
      }
    } catch (_) {
      try {
        const lighter = chats.map((c) => ({
          ...c,
          messages: (c.messages || []).map((m) => ({
            role: m.role,
            content: m.content,
            attachments: (m.attachments || []).map((a) => ({
              name: a.name,
              type: a.type,
              size: a.size,
              kind: a.kind,
            })),
          })),
        }));
        localStorage.setItem(STORAGE.chats, JSON.stringify(lighter));
      } catch (__) {
        /* quota */
      }
    }
  }

  function migrateLegacyHistory() {
    try {
      const raw = localStorage.getItem(STORAGE.history);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return null;
      const chat = {
        id: uid(),
        title: titleFromMessages(parsed),
        messages: parsed,
        updatedAt: Date.now(),
      };
      localStorage.removeItem(STORAGE.history);
      return chat;
    } catch (_) {
      return null;
    }
  }

  function loadChatsFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE.chats);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          chats = parsed;
          activeChatId =
            localStorage.getItem(STORAGE.activeChat) || chats[0].id;
          if (!chats.find((c) => c.id === activeChatId)) {
            activeChatId = chats[0].id;
          }
          return;
        }
      }
    } catch (_) {}

    const legacy = migrateLegacyHistory();
    if (legacy) {
      chats = [legacy];
      activeChatId = legacy.id;
      persistChats();
      return;
    }

    const welcome = {
      id: uid(),
      title: "歡迎",
      messages: [{ role: "assistant", content: WELCOME }],
      updatedAt: Date.now(),
    };
    chats = [welcome];
    activeChatId = welcome.id;
    persistChats();
  }

  function getActiveChat() {
    return chats.find((c) => c.id === activeChatId) || null;
  }

  function renderChatList() {
    const list = els.chatList;
    list.innerHTML = "";
    const sorted = chats.slice().sort((a, b) => b.updatedAt - a.updatedAt);
    for (const c of sorted) {
      const row = document.createElement("div");
      row.className =
        "chat-list-item" + (c.id === activeChatId ? " active" : "");
      row.setAttribute("role", "listitem");

      const main = document.createElement("button");
      main.type = "button";
      main.className = "chat-list-main";
      const title = document.createElement("strong");
      title.textContent = c.title || "新對話";
      const meta = document.createElement("small");
      const d = new Date(c.updatedAt || Date.now());
      meta.textContent = d.toLocaleString("zh-HK", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      main.appendChild(title);
      main.appendChild(meta);
      main.addEventListener("click", () => {
        switchChat(c.id);
        closeSidebar();
      });

      const actions = document.createElement("div");
      actions.className = "chat-list-actions";

      const renameBtn = document.createElement("button");
      renameBtn.type = "button";
      renameBtn.className = "chat-action";
      renameBtn.setAttribute("aria-label", "重新命名");
      renameBtn.textContent = "改名";
      renameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const next = prompt("對話名稱", c.title || "新對話");
        if (next === null) return;
        const t = next.trim();
        if (!t) return;
        c.title = t.slice(0, 40);
        c.updatedAt = Date.now();
        persistChats();
        renderChatList();
        updateHeaderTitle();
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "chat-action danger";
      delBtn.setAttribute("aria-label", "刪除對話");
      delBtn.textContent = "刪";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!confirm("刪除呢個對話？")) return;
        deleteChat(c.id);
      });

      actions.appendChild(renameBtn);
      actions.appendChild(delBtn);
      row.appendChild(main);
      row.appendChild(actions);
      list.appendChild(row);
    }
  }

  function updateHeaderTitle() {
    const c = getActiveChat();
    els.chatTitle.textContent = c && c.title ? c.title : "Leon";
  }

  function paintMessages() {
    els.chat.innerHTML = "";
    for (const m of messages) {
      if (m.role === "user" || m.role === "assistant" || m.role === "system") {
        appendBubble(m.role, m.content, { attachments: m.attachments });
      }
    }
  }

  function switchChat(id) {
    if (busy) return;
    persistChats();
    const c = chats.find((x) => x.id === id);
    if (!c) return;
    activeChatId = id;
    messages = (c.messages || []).slice();
    pending = [];
    renderPending();
    paintMessages();
    updateHeaderTitle();
    persistChats();
    renderChatList();
  }

  function createNewChat() {
    if (busy) return;
    persistChats();
    const chat = {
      id: uid(),
      title: "新對話",
      messages: [],
      updatedAt: Date.now(),
    };
    chats.unshift(chat);
    activeChatId = chat.id;
    messages = [];
    pending = [];
    renderPending();
    els.chat.innerHTML = "";
    updateHeaderTitle();
    persistChats();
    renderChatList();
    closeSidebar();
    els.input.focus();
  }

  function deleteChat(id) {
    if (busy) return;
    const idx = chats.findIndex((c) => c.id === id);
    if (idx < 0) return;
    chats.splice(idx, 1);
    if (!chats.length) {
      const welcome = {
        id: uid(),
        title: "歡迎",
        messages: [{ role: "assistant", content: WELCOME }],
        updatedAt: Date.now(),
      };
      chats = [welcome];
      activeChatId = welcome.id;
      messages = welcome.messages.slice();
    } else if (activeChatId === id) {
      activeChatId = chats[0].id;
      messages = (chats[0].messages || []).slice();
    }
    pending = [];
    renderPending();
    paintMessages();
    updateHeaderTitle();
    persistChats();
    renderChatList();
  }

  function persistHistory() {
    persistChats();
    renderChatList();
    updateHeaderTitle();
  }

  function renderAttachmentsInto(container, attachments) {
    if (!attachments || !attachments.length) return;
    const wrap = document.createElement("div");
    wrap.className = "bubble-attachments";
    for (const a of attachments) {
      if (a.kind === "image" && a.previewUrl) {
        const img = document.createElement("img");
        img.className = "bubble-att-img";
        img.src = a.previewUrl;
        img.alt = a.name || "相片";
        img.loading = "lazy";
        wrap.appendChild(img);
      } else {
        const chip = document.createElement("div");
        chip.className = "bubble-att-file";
        const icon = document.createElement("span");
        icon.textContent = a.kind === "image" ? "🖼️" : "📄";
        const name = document.createElement("span");
        name.className = "att-name";
        name.textContent = a.name || "檔案";
        const meta = document.createElement("span");
        meta.className = "att-meta";
        meta.textContent = formatSize(a.size || 0);
        chip.appendChild(icon);
        chip.appendChild(name);
        chip.appendChild(meta);
        wrap.appendChild(chip);
      }
    }
    container.appendChild(wrap);
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
      if (opts.attachments && opts.attachments.length) {
        renderAttachmentsInto(bubble, opts.attachments);
      }
      if (content) {
        const text = document.createElement("div");
        text.className = "bubble-text";
        text.textContent = content;
        bubble.appendChild(text);
      }
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
    const { demoMode, apiKey, model, provider } = loadSettings();
    els.demoToggle.checked = demoMode;
    els.providerSelect.value = provider;
    applyProviderUI(provider);
    els.apiKeyInput.value = apiKey;
    fillModelSelect(provider, model);
    els.overlay.classList.remove("hidden");
    if (force) els.apiKeyInput.focus();
  }

  function closeSettings() {
    els.overlay.classList.add("hidden");
  }

  function openSidebar() {
    renderChatList();
    els.sidebarOverlay.classList.remove("hidden");
    els.sidebarOverlay.setAttribute("aria-hidden", "false");
  }

  function closeSidebar() {
    els.sidebarOverlay.classList.add("hidden");
    els.sidebarOverlay.setAttribute("aria-hidden", "true");
  }

  function openAttach() {
    els.attachOverlay.classList.remove("hidden");
  }

  function closeAttach() {
    els.attachOverlay.classList.add("hidden");
  }

  function maybeShowTip() {
    if (localStorage.getItem(STORAGE.tipSeen) === "1") return;
    const { demoMode, apiKey } = loadSettings();
    if (!demoMode && apiKey) return;
    els.tipBanner.classList.remove("hidden");
  }

  function dismissTip() {
    localStorage.setItem(STORAGE.tipSeen, "1");
    els.tipBanner.classList.add("hidden");
  }

  function renderPending() {
    const box = els.attachPreview;
    box.innerHTML = "";
    if (!pending.length) {
      box.classList.add("hidden");
      return;
    }
    box.classList.remove("hidden");
    for (const a of pending) {
      const chip = document.createElement("div");
      chip.className =
        "attach-chip" + (a.kind === "image" && a.previewUrl ? "" : " file-chip");
      if (a.kind === "image" && a.previewUrl) {
        const img = document.createElement("img");
        img.src = a.previewUrl;
        img.alt = a.name;
        chip.appendChild(img);
      } else {
        const icon = document.createElement("div");
        icon.className = "file-icon";
        icon.textContent = a.kind === "image" ? "🖼️" : "📄";
        const label = document.createElement("div");
        label.className = "file-label";
        label.textContent = a.name;
        chip.appendChild(icon);
        chip.appendChild(label);
      }
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "remove-att";
      rm.setAttribute("aria-label", "移除 " + a.name);
      rm.textContent = "×";
      rm.addEventListener("click", () => {
        pending = pending.filter((x) => x.id !== a.id);
        renderPending();
      });
      chip.appendChild(rm);
      box.appendChild(chip);
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error("read failed"));
      reader.readAsDataURL(file);
    });
  }

  function resizeImageToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          const max = MAX_IMAGE_EDGE;
          if (width > max || height > max) {
            const scale = Math.min(max / width, max / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const outType =
            file.type === "image/png" || file.type === "image/webp"
              ? file.type
              : "image/jpeg";
          const quality = outType === "image/jpeg" ? 0.82 : 0.92;
          resolve(canvas.toDataURL(outType, quality));
        } catch (err) {
          reject(err);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("image load failed"));
      };
      img.src = url;
    });
  }

  async function processFile(file) {
    if (!file) return null;
    if (file.size > MAX_FILE_BYTES) {
      appendBubble(
        "system",
        `「${file.name}」太大（超過 ${formatSize(MAX_FILE_BYTES)}），請揀細啲嘅檔案。`
      );
      return null;
    }
    const isImage = (file.type || "").startsWith("image/");
    const att = {
      id: uid(),
      name: file.name || (isImage ? "photo.jpg" : "file"),
      type: file.type || "application/octet-stream",
      size: file.size,
      kind: isImage ? "image" : "file",
    };
    if (isImage) {
      try {
        att.dataUrl = await resizeImageToDataUrl(file);
        att.previewUrl = att.dataUrl;
      } catch (_) {
        att.dataUrl = await fileToDataUrl(file);
        att.previewUrl = att.dataUrl;
      }
    } else if (isTextLike(file)) {
      try {
        let text = await file.text();
        if (text.length > MAX_TEXT_CHARS) {
          text = text.slice(0, MAX_TEXT_CHARS) + "\n…(截斷)";
        }
        att.textContent = text;
      } catch (_) {
        /* ignore */
      }
    }
    return att;
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    for (const file of files) {
      if (pending.length >= MAX_ATTACHMENTS) {
        appendBubble("system", `一次最多 ${MAX_ATTACHMENTS} 個附件。`);
        break;
      }
      const att = await processFile(file);
      if (att) pending.push(att);
    }
    renderPending();
  }

  function demoReply(userText, attachments) {
    const t = (userText || "").trim();
    const lower = t.toLowerCase();
    const isZh =
      /[\u4e00-\u9fff]/.test(t) ||
      /[嘅係咗唔喺嚟邊點]/.test(t) ||
      (!t && attachments && attachments.length);
    const isCanto =
      /[嘅係咗唔喺嚟邊點咩啲咁]/.test(t) ||
      (!t && attachments && attachments.length);

    if (attachments && attachments.length) {
      const lines = attachments.map(
        (a) =>
          `• ${a.name}（${a.kind === "image" ? "相片" : "檔案"} · ${formatSize(a.size)}）`
      );
      if (isCanto || isZh) {
        return (
          `收到你傳嘅附件，我已經接收到喇 ✅\n\n` +
          lines.join("\n") +
          (t ? `\n\n你仲講：「${t.slice(0, 60)}${t.length > 60 ? "…" : ""}」` : "") +
          `\n\n示範模式會確認檔名同大小。想我真正睇相／讀內容 → 設定關閉示範模式，揀 Google Gemini，去 AI Studio 拎免費 Key 貼上。`
        );
      }
      return (
        `Got your attachment(s) — received ✅\n\n` +
        lines.join("\n") +
        (t ? `\n\nYou also said: “${t.slice(0, 60)}${t.length > 60 ? "…" : ""}”` : "") +
        `\n\nDemo mode confirms name & size. For real vision, turn off Demo and add a free Gemini API key.`
      );
    }

    if (
      /^(hi|hello|hey|哈囉|你好|嗨|早晨|午安|晚安)\b/i.test(t) ||
      (t.length < 3 && /^(yo|hey)$/i.test(t))
    ) {
      if (isCanto || isZh) {
        return "嗨！我係 Leon～有咩想問或者想幫手？可以打字，亦可以撳 📎 影相／揀相／傳檔案。想開新話題可以撳 ＋。";
      }
      return "Hey! I'm Leon — ask me anything, or tap 📎 to send a photo or file. Tap ＋ for a new chat.";
    }

    if (/api\s*key|API\s*key|api鍵|密鑰|groq|gemini|forbidden/i.test(t)) {
      if (isCanto || isZh) {
        return (
          "API key 就好似一條免費密碼，貼入設定就可以開真正 AI。\n\n" +
          "Groq 喺香港好多時會顯示 Forbidden——請改用 Google Gemini。\n\n" +
          "步驟（iPhone）：\n" +
          "1. 撳右上角設定\n" +
          "2. AI 供應商揀「Google Gemini」\n" +
          "3. 撳「去 Google AI Studio 拎免費 Gemini Key」\n" +
          "4. 用 Google 帳號登入 → Create API key → 複製\n" +
          "5. 貼返 Leon 設定，關閉示範模式，撳儲存\n\n" +
          "我唔可以幫你造 Key，要你自己免費拎。"
        );
      }
      return (
        "An API key is a free password that turns on real AI.\n\n" +
        "Groq often shows Forbidden in Hong Kong — use Google Gemini instead.\n" +
        "Settings → Gemini → get a free key at Google AI Studio → paste → turn off Demo → Save."
      );
    }

    if (/功課|作业|作業|homework|study|溫習|复习|考試|考试|exam|math|數學|数学|英文|english/i.test(t)) {
      if (isCanto || isZh) {
        return (
          `收到——關於「${t.slice(0, 40)}${t.length > 40 ? "…" : ""}」。\n\n` +
          "示範模式小貼士：\n" +
          "1. 先寫清楚題目同已知條件\n" +
          "2. 一步一步解，唔好跳步\n" +
          "3. 做完用自己嘅話覆述答案\n\n" +
          "亦可影題目相傳畀我（📎）。加 Gemini API Key 就可以詳細教你。"
        );
      }
      return (
        `Got it — about “${t.slice(0, 40)}${t.length > 40 ? "…" : ""}”.\n\n` +
        "Demo tip: write the full question, solve step by step, then check.\n" +
        "You can also photograph the problem (📎). Add a Gemini key for full AI help."
      );
    }

    if (/譯|翻译|翻譯|translate|translation/i.test(t)) {
      if (isCanto || isZh) {
        return (
          `你想翻譯：「${t.slice(0, 60)}${t.length > 60 ? "…" : ""}」\n\n` +
          "請寫清楚：原文 + 想譯成邊種語言。開真 AI（設定 → Gemini Key）就可以即時翻譯。"
        );
      }
      return (
        `You asked to translate: “${t.slice(0, 60)}${t.length > 60 ? "…" : ""}”\n\n` +
        "Tell me source text + target language. Add a Gemini key for live translation."
      );
    }

    if (/寫|写|作文|電郵|电邮|email|essay|letter|草稿/i.test(t)) {
      if (isCanto || isZh) {
        return (
          `明白，你想寫嘢：「${t.slice(0, 40)}${t.length > 40 ? "…" : ""}」\n\n` +
          "結構：開頭 → 重點 2–3 點 → 結尾。告訴我對象、長度、語氣；加 Gemini Key 就可以起草。"
        );
      }
      return (
        `Writing help for: “${t.slice(0, 40)}${t.length > 40 ? "…" : ""}”\n\n` +
        "Hook → 2–3 points → close. Tell me audience, length, tone. Add a Gemini key for a draft."
      );
    }

    if (/時間|时间|日程|schedule|計劃|计划|reminder|提醒/i.test(t)) {
      if (isCanto || isZh) {
        return (
          `關於時間／計劃：「${t.slice(0, 40)}${t.length > 40 ? "…" : ""}」\n\n` +
          "建議用「必須做 / 可以做 / 可延後」三欄。加 Gemini Key 可以幫你度時間表。"
        );
      }
      return (
        `About planning: “${t.slice(0, 40)}${t.length > 40 ? "…" : ""}”\n\n` +
        "Sort Must / Should / Later. With a Gemini key I can build a schedule."
      );
    }

    const snippet = t.length > 80 ? t.slice(0, 80) + "…" : t;
    if (isCanto) {
      return (
        `收到你講：「${snippet}」\n\n` +
        "我係 Leon，示範模式而家會用模板回覆。可以問功課、翻譯、寫文，或者撳 📎 傳相／檔案。\n\n" +
        "想要真正 AI → 設定 → 揀 Gemini → 去 AI Studio 拎免費 Key → 貼上 → 關閉示範模式。"
      );
    }
    if (isZh) {
      return (
        `收到：「${snippet}」\n\n` +
        "我是 Leon。示範模式會用模板回覆。可問功課、翻譯、寫作，或用 📎 傳相片／檔案。\n\n" +
        "要真正 AI：設定 → 選 Gemini → 去 AI Studio 拿免費 Key → 貼上 → 關閉示範模式。"
      );
    }
    return (
      `Got your message: “${snippet}”\n\n` +
      "I'm Leon. Demo mode uses template replies. Try homework, translation, writing, or 📎 attachments.\n\n" +
      "For real AI: Settings → Gemini → get a free Google AI Studio key → paste → turn off Demo."
    );
  }

  function buildApiUserContent(text, attachments) {
    const atts = attachments || [];
    const images = atts.filter((a) => a.kind === "image" && a.dataUrl);
    const files = atts.filter((a) => a.kind !== "image" || !a.dataUrl);

    let textParts = [];
    if (text && text.trim()) textParts.push(text.trim());
    for (const f of files) {
      if (f.textContent) {
        textParts.push(
          `\n[Attached text file: ${f.name} (${formatSize(f.size)})]\n${f.textContent}`
        );
      } else if (f.kind === "image") {
        textParts.push(
          `\n[User sent an image: ${f.name}, ${formatSize(f.size)}, type ${f.type}. Preview unavailable for API.]`
        );
      } else {
        textParts.push(
          `\n[User attached file: ${f.name}, ${formatSize(f.size)}, type ${f.type}. Binary content not included.]`
        );
      }
    }

    const textBody =
      textParts.join("\n").trim() ||
      (images.length
        ? "Please look at the attached image(s) and respond helpfully."
        : "(empty)");

    if (!images.length) {
      return textBody;
    }

    const content = [{ type: "text", text: textBody }];
    for (const img of images.slice(0, 5)) {
      content.push({
        type: "image_url",
        image_url: { url: img.dataUrl },
      });
    }
    return content;
  }

  function pickModel(hasImages) {
    const { model, provider } = loadSettings();
    const meta = getProviderMeta(provider);
    if (provider === "gemini") return model || meta.defaultModel;
    if (hasImages && meta.visionModels && !meta.visionModels.has(model)) {
      return meta.defaultVisionModel || [...meta.visionModels][0] || model;
    }
    return model || meta.defaultModel;
  }

  function dataUrlToInline(dataUrl) {
    const m = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return null;
    return { mime_type: m[1], data: m[2] };
  }

  function buildGeminiParts(text, attachments) {
    const atts = attachments || [];
    const parts = [];
    const files = atts.filter((a) => a.kind !== "image" || !a.dataUrl);
    let textParts = [];
    if (text && text.trim()) textParts.push(text.trim());
    for (const f of files) {
      if (f.textContent) {
        textParts.push(
          `\n[Attached text file: ${f.name} (${formatSize(f.size)})]\n${f.textContent}`
        );
      } else if (f.kind === "image") {
        textParts.push(
          `\n[User sent an image: ${f.name}, ${formatSize(f.size)}, type ${f.type}.]`
        );
      } else {
        textParts.push(
          `\n[User attached file: ${f.name}, ${formatSize(f.size)}, type ${f.type}. Binary not included.]`
        );
      }
    }
    const images = atts.filter((a) => a.kind === "image" && a.dataUrl);
    const textBody =
      textParts.join("\n").trim() ||
      (images.length
        ? "Please look at the attached image(s) and respond helpfully."
        : "(empty)");
    parts.push({ text: textBody });
    for (const img of images.slice(0, 5)) {
      const inline = dataUrlToInline(img.dataUrl);
      if (inline) parts.push({ inline_data: inline });
    }
    return parts;
  }

  function historyForOpenAI() {
    return messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-20)
      .map((m) => {
        if (m.role === "assistant") {
          return { role: "assistant", content: m.content };
        }
        if (m.attachments && m.attachments.some((a) => a.dataUrl)) {
          return {
            role: "user",
            content: buildApiUserContent(m.content, m.attachments),
          };
        }
        if (m.attachments && m.attachments.length) {
          const note = m.attachments
            .map(
              (a) =>
                `[attachment: ${a.name}, ${a.kind}, ${formatSize(a.size || 0)}]`
            )
            .join(" ");
          return {
            role: "user",
            content: (m.content || "") + (m.content ? "\n" : "") + note,
          };
        }
        return { role: "user", content: m.content };
      });
  }

  function historyForGemini() {
    const contents = [];
    const slice = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-20);
    for (const m of slice) {
      if (m.role === "assistant") {
        contents.push({
          role: "model",
          parts: [{ text: m.content || "" }],
        });
      } else {
        contents.push({
          role: "user",
          parts: buildGeminiParts(m.content, m.attachments),
        });
      }
    }
    return contents;
  }

  async function parseError(res) {
    let detail = "";
    try {
      const j = await res.json();
      detail =
        j.error?.message ||
        j.message ||
        (typeof j.error === "string" ? j.error : JSON.stringify(j));
    } catch (_) {
      try {
        detail = await res.text();
      } catch (__) {
        detail = "";
      }
    }
    if (res.status === 403 || /forbidden/i.test(detail || "")) {
      return (
        (detail || "Forbidden") +
        " — 若用緊 Groq，香港好多時會咁；請改用 Google Gemini。"
      );
    }
    return detail || `HTTP ${res.status}`;
  }

  async function callGemini(opts = {}) {
    const { apiKey } = loadSettings();
    if (!apiKey) throw new Error("NO_KEY");
    const model = opts.model || loadSettings().model || "gemini-3.5-flash-lite";
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      encodeURIComponent(model) +
      ":generateContent?key=" +
      encodeURIComponent(apiKey);
    const contents = historyForGemini();
    if (!contents.length) {
      contents.push({
        role: "user",
        parts: [{ text: "Hello" }],
      });
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });
    if (!res.ok) throw new Error(await parseError(res));
    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts
      .map((p) => p.text || "")
      .filter(Boolean)
      .join("\n")
      .trim();
    if (!text) {
      const block = data.promptFeedback?.blockReason || data.candidates?.[0]?.finishReason;
      throw new Error(block ? `Empty response (${block})` : "Empty response from Gemini");
    }
    return text;
  }

  async function callOpenAICompat(endpoint, opts = {}) {
    const { apiKey } = loadSettings();
    if (!apiKey) throw new Error("NO_KEY");
    const model = opts.model || loadSettings().model;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    if (opts.openrouter) {
      headers["HTTP-Referer"] = location.origin;
      headers["X-Title"] = "Leon";
    }
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...historyForOpenAI()],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) throw new Error(await parseError(res));
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty response");
    return String(text).trim();
  }

  async function callAI(opts = {}) {
    const { provider } = loadSettings();
    if (provider === "gemini") {
      return callGemini(opts);
    }
    if (provider === "openrouter") {
      try {
        return await callOpenAICompat(
          "https://openrouter.ai/api/v1/chat/completions",
          { ...opts, openrouter: true }
        );
      } catch (err) {
        const msg = String(err.message || err);
        if (/cors|failed to fetch|networkerror|load failed/i.test(msg)) {
          throw new Error(
            "OpenRouter 可能被瀏覽器跨域擋咗。請改用 Google Gemini（設定 → AI 供應商）。"
          );
        }
        throw err;
      }
    }
    // groq
    return callOpenAICompat(
      "https://api.groq.com/openai/v1/chat/completions",
      opts
    );
  }

  // legacy alias used nowhere but keep historyForApi name for clarity
  function historyForApi() {
    return historyForOpenAI();
  }

  async function handleSend(text) {
    const trimmed = (text || "").trim();
    const atts = pending.slice();
    if ((!trimmed && !atts.length) || busy) return;

    const { demoMode, apiKey, provider } = loadSettings();
    if (!demoMode && !apiKey) {
      openSettings(true);
      appendBubble(
        "system",
        provider === "gemini"
          ? "請先去 Google AI Studio 拎免費 Gemini Key 貼上，或開啟「示範模式」先試用。"
          : "請先貼上 API Key，或開啟「示範模式」先試用。香港推薦用 Google Gemini。"
      );
      return;
    }

    busy = true;
    els.sendBtn.disabled = true;

    const displayAtts = atts.map((a) => ({
      name: a.name,
      type: a.type,
      size: a.size,
      kind: a.kind,
      previewUrl: a.previewUrl,
      dataUrl: a.dataUrl,
      textContent: a.textContent,
    }));

    messages.push({
      role: "user",
      content: trimmed,
      attachments: displayAtts.length ? displayAtts : undefined,
    });
    appendBubble("user", trimmed, {
      attachments: displayAtts.length ? displayAtts : undefined,
    });
    persistHistory();

    pending = [];
    renderPending();
    els.input.value = "";
    autoResize();

    const typing = appendBubble("assistant", "", { typing: true });

    try {
      let reply;
      if (demoMode) {
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
        reply = demoReply(trimmed, displayAtts);
      } else {
        const hasImages = displayAtts.some((a) => a.kind === "image" && a.dataUrl);
        const model = pickModel(hasImages);
        reply = await callAI({ model });
      }
      removeNode(typing);
      messages.push({ role: "assistant", content: reply });
      appendBubble("assistant", reply);
      persistHistory();
    } catch (err) {
      removeNode(typing);
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
    loadChatsFromStorage();
    const active = getActiveChat();
    messages = active && active.messages ? active.messages.slice() : [];
    if (!messages.length && chats.length === 1 && active.title === "歡迎") {
      messages = [{ role: "assistant", content: WELCOME }];
      persistChats();
    }
    paintMessages();
    updateHeaderTitle();
    updateStatus();
    renderChatList();
    maybeShowTip();
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

  els.menuBtn.addEventListener("click", openSidebar);
  els.closeSidebarBtn.addEventListener("click", closeSidebar);
  els.sidebarOverlay.addEventListener("click", (e) => {
    if (e.target === els.sidebarOverlay) closeSidebar();
  });
  els.newChatBtn.addEventListener("click", createNewChat);
  els.sidebarNewChat.addEventListener("click", createNewChat);

  els.tipOpenSettings.addEventListener("click", () => {
    dismissTip();
    openSettings(true);
  });
  els.tipDismiss.addEventListener("click", dismissTip);

  els.attachBtn.addEventListener("click", openAttach);
  els.closeAttachBtn.addEventListener("click", closeAttach);
  els.attachOverlay.addEventListener("click", (e) => {
    if (e.target === els.attachOverlay) closeAttach();
  });

  els.optCamera.addEventListener("click", () => {
    closeAttach();
    els.cameraInput.value = "";
    els.cameraInput.click();
  });
  els.optGallery.addEventListener("click", () => {
    closeAttach();
    els.galleryInput.value = "";
    els.galleryInput.click();
  });
  els.optFile.addEventListener("click", () => {
    closeAttach();
    els.fileInput.value = "";
    els.fileInput.click();
  });

  els.cameraInput.addEventListener("change", () => addFiles(els.cameraInput.files));
  els.galleryInput.addEventListener("change", () => addFiles(els.galleryInput.files));
  els.fileInput.addEventListener("change", () => addFiles(els.fileInput.files));

  els.providerSelect.addEventListener("change", () => {
    applyProviderUI(els.providerSelect.value);
  });

  els.saveSettingsBtn.addEventListener("click", () => {
    const provider = els.providerSelect.value;
    saveSettings({
      demoMode: els.demoToggle.checked,
      apiKey: els.apiKeyInput.value.trim(),
      model: els.modelSelect.value,
      provider,
    });
    closeSettings();
    dismissTip();
    const label = getProviderMeta(provider).label;
    appendBubble(
      "system",
      els.demoToggle.checked
        ? "已儲存：示範模式開啟。"
        : els.apiKeyInput.value.trim()
          ? `已儲存：將使用 ${label}。`
          : "已儲存。未有 API Key——傳送訊息時會再開設定。"
    );
  });

  els.clearChatBtn.addEventListener("click", () => {
    messages = [{ role: "assistant", content: WELCOME }];
    pending = [];
    renderPending();
    els.chat.innerHTML = "";
    appendBubble("assistant", WELCOME);
    persistHistory();
    closeSettings();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  initChat();
})();
