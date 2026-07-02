# 02 — API 契約(REST / DTO)

> 依 [00 canonical 模型](00-canonical-data-model.md) 定義前後端交換的 REST 端點與 DTO。契約層一律 `camelCase`;後端以 OpenAPI(專案已裝 `Microsoft.AspNetCore.OpenApi`)輸出。此文件為 OpenAPI 生成的規格依據。

## 通則

- **Base path**:`/api`
- **識別**:對外一律用字串業務碼 `code`(見 [00 ID 策略](00-canonical-data-model.md#命名與-id-策略));路徑參數如 `/api/venues/{code}`。
- **金額**:數字(NUMERIC 對映 number)。**時間**:ISO 8601 字串。
- **分頁**:list 端點回 `{ items: [...], total, page, pageSize }`;查詢參數 `?page=&pageSize=&sort=`。
- **錯誤**:`{ error: { code, message, details? } }`,HTTP 狀態碼語意標準化(400/401/403/404/409/422)。
- **驗證**:會員 / 管理員分離的 JWT(或 cookie session,見 04 決策);受保護端點需帶 token。權限鍵對照 [PermissionGroups](01-schema-revision.md#permissiongroups--權限群組)。

---

## 場地 Venues

| 方法 | 路徑 | 用途 | 權限 |
|---|---|---|---|
| GET | `/api/venues` | 場館列表(前台探索/後台管理) | 公開/後台 |
| GET | `/api/venues/{code}` | 場館詳情(含組裝的 rentalModes/pricing/timeSlots/images/rentalItems/requiredDocuments) | 公開 |
| GET | `/api/venues/{code}/availability?date=&mode=` | 某日可租狀態(時段/小時佔用、閉館、封鎖) | 公開 |
| POST | `/api/admin/venues` | 建立場館 | `venues.create` |
| PUT | `/api/admin/venues/{code}` | 編輯場館(接收 venue-edit 完整 form,後端拆寫各正規化表) | `venues.edit` |
| DELETE | `/api/admin/venues/{code}` | 刪除/停用 | `venues.delete` |

**VenueDetailDto**(回傳,組裝正規化表):
```jsonc
{
  "code": "V-0000001", "parentId": null, "name": "苗栗巨蛋體育館",
  "type": "運動賽事", "status": "正常", "capacity": 3000, "location": "...",
  "description": "...", "facilities": ["..."], "openingHours": { "...": {} },
  "notices": ["..."], "isRentable": true,
  "holiday": { "weekendDays": [0,6], "weekendIncludeHolidays": true },  // 場館層級假日定義
  "images": [{ "url": "...", "isMain": true, "sortOrder": 0 }],
  "rentalModes": {
    "daily":   { "isEnabled": true, "minDays": 1, "maxDays": 3, "requireDocuments": true,
                 "depositEnabled": true, "depositAmount": 10000,
                 "setupAllowanceHours": 2, "teardownAllowanceHours": 2,
                 "setupOverageUnitMinutes": 30, "setupOverageFeePerUnit": 500,
                 "teardownOverageUnitMinutes": 30, "teardownOverageFeePerUnit": 500,
                 "overageRoundingMode": "ceil", "weekendPricingEnabled": true,
                 // ★ 申請窗口/期限:per-mode
                 "advanceBookingDays": 30, "latestBookingDays": 3, "cancelBeforeDays": 2,
                 "receiptUploadDeadlineDays": 3, "documentUploadDeadlineDays": 7 },
    "timeslot": { "isEnabled": true, "...": {} },
    "hourly":   { "isEnabled": false, "minHours": 2, "maxHours": 8, "...": {} }
  },
  "timeSlots": [{ "slotCode": "morning", "name": "上午", "startTime": "08:00", "endTime": "12:00", "sortOrder": 0 }],
  "pricing": [{ "mode": "timeslot", "dayType": "weekday", "timeSlotCode": "morning", "price": 3000 }],
  "rentalItems": [{ "label": "折疊椅", "unit": "張", "amount": 0, "quantity": 200, "maxPerBooking": 200 }]
  // requiredDocuments 置於各 rentalModes[mode] 之下（per-mode，含各自 templateFile；無 appliesTo），例如：
  //   rentalModes.daily.requireDocuments = true
  //   rentalModes.daily.requiredDocuments = [
  //     { "templateKey": "application_form", "label": "租借申請書", "hint": "...",
  //       "required": true, "templateFile": "整日_租借申請書.pdf" }
  //   ]
}
```

---

## 會員 Members / 驗證 Auth

| 方法 | 路徑 | 用途 |
|---|---|---|
| POST | `/api/auth/register` | 註冊(→ status=待審核) |
| POST | `/api/auth/login` | 帳密登入,回 token + MemberDto |
| POST | `/api/auth/oauth/{provider}` | google/line 登入 |
| POST | `/api/auth/logout` | 登出 |
| GET | `/api/members/me` | 目前會員資料 |
| PUT | `/api/members/me` | 更新個人資料 |
| GET | `/api/admin/members` | 會員列表 | `members.view` |
| PATCH | `/api/admin/members/{code}` | 審核/停用/備註 | `members.edit` |

**MemberDto**(不含 passwordHash):
```jsonc
{ "code": "M-0000001", "name": "...", "email": "...", "phone": "...", "avatar": "...",
  "retainedDeposit": 0, "identityType": "個人", "identityDocument": "...", "provider": "email",
  "status": "正常", "totalBookings": 3, "totalSpent": 12000, "joinDate": "..." }
```

---

## 預約 Reservations(主流程 BPMN 01/05/06)

| 方法 | 路徑 | 用途 | 狀態轉移 |
|---|---|---|---|
| GET | `/api/reservations` | 我的預約(會員) / 後台列表(admin,`?status=&venueId=`) | — |
| GET | `/api/reservations/{code}` | 預約詳情(含 documents/remittances/additionalFees/refund) | — |
| POST | `/api/reservations` | 送出租借申請 | → `reserved` |
| POST | `/api/reservations/{code}/documents` | 上傳文件 | `reserved`→`document_review` |
| POST | `/api/admin/reservations/{code}/documents/review` | 承辦審文件(pass/reject+reason) | →`pending_payment` / `documents_rejected` |
| POST | `/api/reservations/{code}/remittances` | 回報匯款 | `pending_payment`→`payment_review` |
| POST | `/api/admin/reservations/{code}/remittances/verify` | 核帳(pass/reject) | →`confirmed` / 退回 |
| POST | `/api/reservations/{code}/cancel` | 會員申請取消 | →`cancellation_requested` |
| POST | `/api/admin/reservations/{code}/complete` | 標記完成 | `confirmed`→`completed` |

**ReservationDetailDto**:
```jsonc
{
  "code": "R-20260412-001", "venueCode": "V-0000001", "memberCode": "M-0000003",
  "rentalMode": "timeslot", "dayType": "weekday",
  "bookingDate": "2026-04-12", "startDate": null, "endDate": null,
  "timeSlotCode": "afternoon", "startTime": "13:00", "endTime": "17:00", "totalHours": null,
  "rentalDays": null, "unitPrice": 3000, "baseFee": 3000, "deposit": 5000, "totalPrice": 8400,
  "peopleCount": 57, "purpose": "...",
  "applicant": "苗栗巨蛋羽球俱樂部",   // 見 03 拆併決策(contactName/Phone/Email)
  "status": "confirmed", "requireDocuments": true,
  "documentUploadDeadline": "...", "receiptUploadDeadline": "...",
  "documentRejectReason": null, "note": null, "adminNote": null, "cancelReason": null,
  "createdAt": "2026-03-08", "confirmedAt": "...", "completedAt": null,
  "additionalFees": [{ "label": "感應磁卡費", "unit": "2 張", "amount": 400, "quantity": 1 }],
  "documents": [{ "templateKey": "application_form", "label": "租借申請書", "required": true,
                  "uploaded": true, "fileName": "...pdf", "uploadedAt": "...", "rejectReason": null }],
  "remittances": [{ "last5": "75462", "amount": 6480, "datetime": "2026-03-09T00:00",
                    "senderName": "...", "note": "分次匯入", "receiptImage": null, "verifiedAt": null }],
  "refund": { "code": "RF-2026-0007", "status": "accounting_review", "...": {} }
}
```

**CreateReservationDto**(送出申請):`venueCode, rentalMode, bookingDate|startDate/endDate, timeSlotCode|startTime/endTime, peopleCount, purpose, applicant/contact, additionalFees[{label,unit,amount,quantity}], note`。後端計算 `dayType/unitPrice/baseFee/deposit/totalPrice` 並寫入快照。

---

## 退款 Refunds(BPMN 02/03)

| 方法 | 路徑 | 用途 | 狀態 |
|---|---|---|---|
| GET | `/api/admin/refunds?status=&type=` | 退款佇列 | — |
| GET | `/api/refunds/mine` | 我的退款(會員) | — |
| POST | `/api/refunds/retained-deposit` | 會員送出預留保證金退款 | →`admin_review` |
| POST | `/api/admin/refunds/{code}/approve-admin` | 承辦初審(帶 approvedAmount) | →`accounting_review` |
| POST | `/api/admin/refunds/{code}/approve-accounting` | 會計核定 | →`cashier_processing` |
| POST | `/api/admin/refunds/{code}/complete-cashier` | 出納撥款 | →`completed` |
| POST | `/api/admin/refunds/{code}/reject` | 駁回(帶 reason) | →`rejected` |

> 訂單取消退款(`booking_cancellation`)由 `/api/reservations/{code}/cancel` 核准後由後端自動建立對應 Refund。

**RefundDto**:對映 [Refunds 表](01-schema-revision.md#refunds--退款單),`bankAccount` 以巢狀物件回傳 `{ bankName, branchName, accountName, accountNumber }`。

---

## 後台內容

| 方法 | 路徑 | 用途 | 權限 |
|---|---|---|---|
| GET/POST/PUT/DELETE | `/api/admin/news` · `/api/news`(公開讀) | 最新消息 | `news.*` |
| GET | `/api/faqs` | FAQ(依 category 分組回傳) | 公開 |
| GET/POST/PUT/DELETE | `/api/admin/faqs` | FAQ 管理 | `news.*` 或獨立 |
| GET/POST/PUT/DELETE | `/api/admin/calendar-notes?venueId=&month=` | 行事曆備註 | 後台 |
| GET | `/api/admin/permission-groups` · POST/PUT/DELETE | 權限群組 | `permissions.*` |
| GET/POST/PUT/DELETE | `/api/admin/admins` | 管理員 | `admins.*` |
| GET/PUT | `/api/admin/system-settings` | 系統設定 | 後台 |

**FaqGroupDto**(對齊前端分組):`[{ "category": "租借相關", "items": [{ "question": "...", "answer": "..." }] }]`

**NewsDto**:`{ id, category, title, summary, content, publishedAt, pinned, imageUrl }`(後端 `IsPinned/CoverImage` 於 DTO 對映為 `pinned/imageUrl`)。

---

## DTO ↔ Schema 可實作性檢查
每個上列 DTO 欄位皆可對映到 [01-schema-revision.md](01-schema-revision.md) 的欄位或由其組裝(正規化表 → 巢狀物件)。組裝關係:
- `VenueDetailDto.rentalModes/pricing/timeSlots/images/rentalItems/requiredDocuments` ← 各 `Venue*` 子表。
- `ReservationDetailDto.documents/additionalFees/remittances/refund` ← `Reservation*` 子表 + `Refunds`。
- `FaqGroupDto` ← `FAQs` 依 `Category` 分組。
