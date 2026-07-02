# 前台網站地圖（資訊架構樹）

依據 src/router/index.ts 目前前台（Portal）路由整理，僅涵蓋使用者端，不含管理後台（/admin）。

## 1) 網站地圖樹狀圖

```text
前台網站 /
├─ 【頁面】首頁 /
├─ 會員與帳號
│  ├─ 【頁面】登入 /login
│  ├─ 【頁面】註冊 /register
│  ├─ 【頁面】註冊完成 /register/confirmation
│  ├─ 【頁面】忘記密碼 /forgot-password
│  └─ 【頁面】重設密碼 /reset-password
├─ 場地租借
│  ├─ 【頁面】場地列表 /venues
│  └─ 【頁面】場地詳情 /venues/:id
│     ├─ 【頁面】填寫預約 /venues/:id/booking
│     └─ 【頁面】預約確認 /venues/:id/confirm
├─ 最新消息
│  ├─ 【頁面】消息列表 /news
│  └─ 【頁面】消息詳情 /news/:id
├─ 會員中心
│  ├─ 【頁面】會員中心首頁 /member
│  ├─ 【頁面】我的資料 /member/profile
│  ├─ 【頁面】我的預約 /member/bookings
│  │  └─ 【頁面】預約詳情 /member/bookings/:id
│  └─ 【頁面】我的退費 /member/refunds
└─ 法務資訊
   ├─ 【頁面】服務條款 /terms
   ├─ 【頁面】隱私政策 /privacy
   └─ 【頁面】常見問題 /faq
```

## 2) 說明

- 這份文件是網站地圖的資訊架構樹，用來表達頁面層級與導覽關係。
- 動態節點 :id 代表內容頁（例如單一場地、單一消息、單筆預約）。
- 租借流程請見 docs/rental-user-flow.md。
- 全核心流程總覽請見 docs/core-user-flows.md。
