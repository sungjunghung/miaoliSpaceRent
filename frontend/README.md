# 苗栗縣體育場館預約系統(原型）

苗栗縣立體育場的線上場館租借平台原型,提供民眾查詢場館、查看預約熱度、線上預訂與退款申請,並包含一套給管理單位使用的後台。本專案為**前端原型**,所有資料皆以 mock JSON 模擬,無實際後端串接。

## 功能概觀

### 前台(Portal)

- **首頁**:Hero 輪播、預約熱度月曆、最新消息;行動版內建場館搜尋(時段／多日)。
- **場館資訊**:場館列表與詳情,支援依時段、多日條件搜尋可用場地。
- **線上預訂**:選擇場地 → 確認預訂的完整流程。
- **會員中心**:我的帳戶、我的預訂、我的退款。
- **最新消息**:場館公告、活動與維護通知。
- **其他**:常見問題、服務條款、隱私權政策。
- **RWD**:桌機採頂部導覽列,行動版改用底部 dock 與頁內搜尋。

### 後台(Admin)

- 場館管理(基本資料、租借規則、租借品項等多頁編輯)
- 預約管理、會員管理、最新消息管理
- 管理員與權限群組管理

## 技術棧

| 類別 | 使用 |
| --- | --- |
| 框架 | Vue 3(`<script setup>` SFC)+ TypeScript |
| 建置 | Vite |
| 路由 | Vue Router |
| 狀態 | Pinia |
| 樣式 | Tailwind CSS v4 + DaisyUI v5(自訂主題 `mytheme-light` / `mytheme-dark`） |
| 圖表 | Chart.js + vue-chartjs |
| 編輯器 | Quill(`@vueup/vue-quill`） |
| 圖示 | Material Symbols |
| 捲動 | Lenis(平滑捲動） |

## 開始使用

```bash
# 安裝相依套件
npm install

# 啟動開發伺服器(預設 http://localhost:5173)
npm run dev

# 型別檢查 + 正式建置
npm run build

# 預覽建置產物
npm run preview
```

## 專案結構

```text
src/
├── view/            # 頁面
│   ├── portal/      # 前台(auth / member / news / Venue / Legal)
│   └── admin/       # 後台(venues / bookings / members / news / admins / permissions)
├── layout/          # 版型外殼(portal / admin / 全螢幕)
├── components/      # 共用元件
├── composables/     # 組合式函式(預約格式、月曆狀態、tooltip 等)
├── stores/          # Pinia(auth / bookings / refunds)
├── router/          # 路由設定
├── mocks/           # 模擬資料(JSON)
├── utils/           # 工具函式
├── types/           # 型別定義
└── style.css        # 全域樣式與自訂 utility / 主題
```

## 說明

- 資料來源為 `src/mocks/` 下的 JSON,並非真實 API。
- 樣式以 **DaisyUI 語意類別優先**,僅在 DaisyUI 無法表達時才補 Tailwind utility。
- 主題透過 `<html data-theme>` 切換,顏色一律使用 DaisyUI 語意 token,勿寫死明暗色。
