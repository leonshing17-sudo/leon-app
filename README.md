# Leon — 甚麼都會的 AI 助手

Leon 係一個可加到 iPhone 主畫面嘅 Progressive Web App（PWA）聊天助手。支援示範模式（唔使 Key）同 Groq 免費 API（真正 AI）。

## 檔案

- `index.html` — 主介面
- `styles.css` — 深色手機優先樣式
- `app.js` — 聊天邏輯、示範模式、Groq API
- `sw.js` — Service Worker（離線快取）
- `manifest.json` — PWA 設定
- `icon.svg` / `icon-192.png` / `icon-512.png` — 圖示

## 喺電腦打開

1. 進入資料夾：`cd /workspace/leon-app`
2. 啟動靜態伺服器（若未開）：
   ```bash
   python3 -m http.server 8765 --bind 0.0.0.0
   ```
3. 瀏覽器打開：`http://localhost:8765/` 或 `http://127.0.0.1:8765/`

## 加到 iPhone 主畫面（當 App 用）

1. 用 **Safari** 打開 Leon 嘅網址（需要同一 Wi‑Fi／可達嘅位址，例如電腦嘅區網 IP：`http://你的電腦IP:8765/`）
2. 撳底部分享掣 **分享**（方框加向上箭嘴）
3. 向下搵 **「加入主畫面」**（Add to Home Screen）
4. 名稱確認係「Leon」，撳 **加入**

之後主畫面會有 Leon 圖示，開出嚟似獨立 App。

> 注意：iOS 要用 **Safari** 先可以「加入主畫面」。Chrome／其他瀏覽器未必有呢個選項。HTTP 區網位址一般可以加入；正式對外建議用 HTTPS。

## 示範模式（即用）

- 預設開啟「示範模式」：唔使 API Key，Leon 會用有用嘅模板回覆（跟你語言）。
- 右上角 ⚙️ 設定可以開關。

## 真正 AI：免費 Groq API Key

1. 去 [https://console.groq.com/keys](https://console.groq.com/keys) 註冊／登入
2. 建立一個 API Key（免費額度）
3. 喺 Leon 設定：
   - 關閉「示範模式」
   - 貼上 Key（以 `gsk_` 開頭）
   - 揀模型（建議 `llama-3.3-70b-versatile`）
   - 撳「儲存」
4. Key **只存在你部手機／瀏覽器嘅 localStorage**，唔會寫死喺程式碼，亦唔會傳到作者伺服器

## 功能摘要

- 多語言回覆（跟你打咩語言）
- 功課／溫習／日常萬能助手人設
- 深色現代聊天 UI，適配 iPhone 安全區
- PWA：manifest、service worker、Apple touch icon、theme-color

## 疑難排解

| 問題 | 建議 |
|------|------|
| 開唔到頁 | 確認伺服器喺 8765 行緊；防火牆允許 |
| 加入主畫面搵唔到 | 必須用 Safari；重新整理後再試 |
| Groq 報錯 | 檢查 Key、網絡；可暫時開返示範模式 |
| 舊版畫面 | 設定 → 清除對話；或 Safari 清網站資料後重開 |

祝你用得開心 — Leon 👋
