# Leon — 甚麼都會的 AI 助手

Leon 係一個可加到 iPhone 主畫面嘅 Progressive Web App（PWA）聊天助手。支援示範模式（唔使 Key）同 Groq 免費 API（真正 AI，包括睇相）。

**永久網址：** https://leonshing17-sudo.github.io/leon-app/

## 檔案

- `index.html` — 主介面
- `styles.css` — 深色手機優先樣式
- `app.js` — 聊天邏輯、附件、示範模式、Groq API
- `sw.js` — Service Worker（離線快取）
- `manifest.json` — PWA 設定
- `icon.svg` / `icon-192.png` / `icon-512.png` — 圖示

## 影相／揀相／檔案

輸入欄左邊有 **📎 附件掣**：

1. **影相** — 打開相機即影即用（iPhone 會問相機權限）
2. **選擇相片** — 由相簿揀一張或多張
3. **選擇檔案** — 圖片、PDF、文字檔等

選好之後會喺輸入欄上面顯示預覽，可以 × 移除；傳送後氣泡會顯示相／檔案。

- **示範模式**：Leon 會確認收到（檔名、類型、大小）
- **Groq AI 模式**：有相時自動改用可睇相模型（例如 `llama-4-scout`），以 base64 傳圖；文字檔會抽出內容一齊送出

## 加到 iPhone 主畫面（當 App 用）

1. 用 **Safari** 打開 https://leonshing17-sudo.github.io/leon-app/
2. 撳底部分享掣 **分享**（方框加向上箭嘴）
3. 向下搵 **「加入主畫面」**
4. 名稱確認係「Leon」，撳 **加入**

之後主畫面會有 Leon 圖示。若已加入過，重新打開一次等更新；必要時 Safari → 清除該網站資料後再加入。

> 注意：iOS 要用 **Safari** 先可以「加入主畫面」。影相／揀相喺主畫面 App 同 Safari 都可以用。

## 示範模式（即用）

- 預設開啟「示範模式」：唔使 API Key，Leon 會用有用嘅模板回覆（跟你語言），亦會確認附件。
- 右上角 ⚙️ 設定可以開關。

## 真正 AI：免費 Groq API Key

1. 去 [https://console.groq.com/keys](https://console.groq.com/keys) 註冊／登入
2. 建立一個 API Key（免費額度）
3. 喺 Leon 設定：
   - 關閉「示範模式」
   - 貼上 Key（以 `gsk_` 開頭）
   - 揀模型（文字建議 `llama-3.3-70b-versatile`；睇相會自動用 vision 模型）
   - 撳「儲存」
4. Key **只存在你部手機／瀏覽器嘅 localStorage**

## 功能摘要

- 多語言回覆（跟你打咩語言）
- 影相、揀相、傳檔案；氣泡預覽
- 功課／溫習／日常萬能助手人設
- 深色現代聊天 UI，適配 iPhone 安全區
- PWA：manifest、service worker、Apple touch icon、theme-color

## 疑難排解

| 問題 | 建議 |
|------|------|
| 加入主畫面搵唔到 | 必須用 Safari；重新整理後再試 |
| 影相掣冇反應 | 允許相機權限；用 Safari／主畫面 App |
| 睇唔到新功能 | 強制重新整理；或清除網站資料後再開 |
| Groq 報錯 | 檢查 Key、網絡；可暫時開返示範模式 |

祝你用得開心 — Leon 👋
