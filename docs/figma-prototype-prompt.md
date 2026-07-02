# Figma Prototype 首頁 · 桌面 App 用 Prompt

> 用途:在 **Claude 桌面 App**(Figma 雲端連接器 `use_figma` 可寫入)貼上這段,
> 建立 prototype page 並畫出首頁。參照風格取自 Wireframing Starter Kit。
> 結構來源:`docs/wireframes/home.html`。

---

## 直接複製這段貼進 Claude 桌面 App

```
請用 Figma 連接器幫我做:

【參照風格】
先看這份 Wireframing Starter Kit 的元件與線框風格作為設計語言:
- 檔案:https://www.figma.com/design/nOxcrnCvYbDBHsBDWDiIF9/Wireframing-Starter-Kit--Community-
- 參照節點:node-id=3816-91（桌面版 - 登入與註冊 Wireframe）
- 也可參考頁面「Components」「Building blocks」裡的線框元件

【任務】
在檔案中新增一個 page,名稱為「prototype」。
在該 page 畫一個「首頁」frame，桌機寬 1024px，沿用 starter kit 的線框灰階風格，由上到下依序：

1) 頂部導覽列
   - 左:品牌「苗栗縣場地租借」
   - 中:主選單 首頁 / 場館資訊 / 最新消息 / 常見問題
   - 右:會員中心下拉（我的帳戶 / 我的預訂 / 我的退款）+ 登入鈕

2) Hero 主視覺（第一眼焦點）
   - 大標「苗栗縣場地租借」+ 副標「線上查詢、申請、繳費，一站完成」
   - 大型搜尋列:關鍵字輸入框 + 模式下拉 + 搜尋鈕
   - 熱門關鍵字標籤:演藝廳 / 展演室 / 會議室

3) 租借流程三步（編號卡）
   - ① 挑選場地 ② 線上申請 ③ 繳費成立

4) 熱門場館
   - 區段標題「熱門場館」+ 右側連結「查看全部場館 →」
   - 四張場地卡:縮圖佔位 / 名稱 / 模式標籤 / 價格起

5) 最新消息
   - 區段標題「最新消息」+ 右側連結「檢視更多 →」
   - 四則消息列:分類徽章 / 標題 / 日期

【風格要求】
低保真線框、灰階佔位圖、清楚的區塊分隔與留白，桌機 1024px 對齊。
```

---

## 我這邊（Claude Code）現在能幫的

雖然不能寫入 Figma，但本機 Dev Mode server 的讀取工具可用，我可以：
- 讀 starter kit 的 **Components / Building blocks / 變數**，把它的視覺語言（顏色、字級、間距、線框元件樣式）整理出來
- 依此**把我們的 `docs/wireframes/home.html` 調成更貼近這份 kit 的風格**

需要的話跟我說「讀 kit 調 HTML」。
