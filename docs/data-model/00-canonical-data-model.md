# 00 — Canonical 權威資料模型

> 本文件是 MiaoliSpaceRent 前端、後端、資料庫三方共同遵循的**單一權威資料模型**。任何欄位、列舉、狀態機以此為準;`docs/databaseTableSchema.md`(舊)之後由 [01-schema-revision.md](01-schema-revision.md) 取代。
>
> 相關文件:[01 schema 修訂](01-schema-revision.md) · [02 API 契約](02-api-contract.md) · [03 前端對齊清單](03-frontend-alignment-delta.md) · [04 實作藍圖](04-implementation-roadmap.md)

## 目錄
- [設計原則](#設計原則)
- [命名與 ID 策略](#命名與-id-策略)
- [列舉與狀態機](#列舉與狀態機)
- [實體目錄與欄位映射](#實體目錄與欄位映射)
- [實體關聯總覽](#實體關聯總覽)

---

## 設計原則

1. **單一真理來源**:三方(DB / 後端 / 前端)全部向本模型靠齊,不再各自定義。
2. **正規化為準**:場地的價格、模式、時段、圖片、附加項目、文件需求一律走獨立表;前端 [venues.json](../../frontend/src/mocks/venues.json) 的內嵌形態改由後端在契約層組裝回傳。
3. **命名分層**:契約層(JSON/API)用 `camelCase`,DB/C# 用 `PascalCase`,一一對映(見各實體表格)。
4. **狀態機集中定義**:預約、退款的狀態與轉移在本文件閉合定義,前後端不得各自擴充。
5. **成交快照**:預約成立當下的單價、日別、附加項目、文件需求以快照存於預約相關表,避免場地設定日後變動污染歷史訂單。

---

## 命名與 ID 策略

### 詞彙統一(canonical 用語)
| 概念 | Canonical | 廢棄的舊寫法 |
|---|---|---|
| 會員 | `member` / `memberId` | 前端 `user` / `userId` |
| 時段租借模式 | **`timeslot`** | 前端 `session`(runtime 側) |
| 預約日期 | `bookingDate` | 前端 `date` |
| 時段代碼 | `timeSlotCode` | 前端 `session`(值) |
| 取消提前量 | `cancelBeforeDays`(**天**,per-mode) | 前端 `cancellationDeadlineDays` ⚠️ 見待確認 |

> ⚠️ **待確認(業務)**:取消期限單位。前端與現行 UI 皆以「天」為單位,canonical 暫定 `cancelBeforeDays`(天)。若體育場實務改以「小時」公告,再改 `cancelBeforeHours`。此欄現為 **per-mode**(存於 `VenueRentalModes`)。**實作前需與業主確認單位**。

### ID 策略(重要)
前端 mock 用字串前綴 ID(`user-003`、`admin-001`、`role-001`、`RF-2026-0001`),DB 用 `SERIAL` int 主鍵 + 觸發器產生的格式化業務碼(`M-0000001`、`A-0000001`、`R-YYYYMMDD-001`)。canonical 定案:

- **DB 內部**:`Id SERIAL`(整數主鍵,做 FK 關聯)。
- **對外契約**:公開欄位 `code`(字串業務碼,如 `M-0000001`);API 路徑與關聯以 `code` 交換,不外洩 int PK。
- **前端**:改用 `code` 字串當識別;現有 `user-003` 之類的 mock id 在切換真 API 時一併替換為 `M-000000x` 格式。

---

## 列舉與狀態機

### 租借模式 `rentalMode`
`daily`(整日) · `timeslot`(時段:上午/下午/夜間) · `hourly`(計時)

### 日別 `dayType`
`weekday`(平日) · `holiday`(假日)。判定優先序見 [01-schema-revision.md](01-schema-revision.md#假日判定優先順序)。

### 預約狀態 `reservationStatus`(11 態,canonical)
來源:前端 [useBookingStatus.ts](../../frontend/src/composables/useBookingStatus.ts)。

| 值 | 顯示 | 說明 |
|---|---|---|
| `reserved` | 待上傳文件 / 待繳費 | 剛成立;依 `requireDocuments` 決定下一步 |
| `document_review` | 文件審核中 | 會員已上傳文件,待承辦審 |
| `documents_rejected` | 文件退件 | 審核未過,需補件 |
| `pending_payment` | 等待繳費 | 文件通過(或免文件),待會員匯款 |
| `payment_review` | 繳費審核中 | 會員已回報匯款,待核帳 |
| `confirmed` | 預訂成功 | 核帳通過,訂單成立 |
| `completed` | 已完成 | 使用結束 |
| `cancellation_requested` | 取消申請中 | 會員送出取消,待承辦審(進入退款流程) |
| `cancelled` | 已取消 | 一般取消結案 |
| `cancelled_expired` | 逾期取消 | 逾期未完成流程自動取消 |
| `cancelled_rejected` | 退件取消 | 文件/核帳退件後取消 |

**主要轉移**(對應 [BPMN 01/05/06/02](../bpmn/)):
```
reserved ──(需文件)→ document_review ──通過→ pending_payment ──回報→ payment_review ──核帳通過→ confirmed ──使用完→ completed
   │(免文件)────────────────────────────↗                        │退件           │退件
   └→ pending_payment                          documents_rejected←┘        (回 pending_payment 或 cancelled_rejected)
confirmed ──會員申請取消→ cancellation_requested ──承辦核准→ cancelled(+ 退款流程)
任一待辦逾期 → cancelled_expired
```

### 退款狀態 `refundStatus`(5 態,canonical)
來源:前端 [refunds.ts](../../frontend/src/stores/refunds.ts)。三階段簽核 + 退件。

| 值 | 顯示 | 負責角色 |
|---|---|---|
| `admin_review` | 承辦初審 | admin |
| `accounting_review` | 會計核定 | accounting |
| `cashier_processing` | 出納撥款 | cashier |
| `completed` | 退款完成 | — |
| `rejected` | 已駁回 | — |

轉移:`admin_review →(approveAdmin,填核定金額)→ accounting_review →(approveAccounting)→ cashier_processing →(completeCashier)→ completed`;任一階段可 `→ rejected`。

### 退款來源 `refundSourceType`
`booking_cancellation`(訂單取消退款,對應 BPMN 02) · `retained_deposit`(預留保證金退款,對應 BPMN 03)

### 其他列舉
- `member.provider`:`email` · `google` · `line`
- `member.status`:`待審核` · `正常` · `停用`
- `admin.role`:`super_admin` · (營運/客服等,見 permissionGroups)
- `venue.status`:`正常` · `維護中` · `停用`
- `overageRoundingMode`(超時計費進位):`ceil` · `floor` · `nearest`

---

## 實體目錄與欄位映射

> 欄位格式:`契約(camelCase)` ↔ `DB(PascalCase)`。★=本次新增欄位/表;⚠=單位或語意需注意。

### 場地相關

#### Venue 場館/空間
| 契約 | DB | 型別 | 備註 |
|---|---|---|---|
| code | (Id + 業務碼) | | 見 ID 策略 |
| parentId | ParentId | int? | 階層 |
| name | Name | varchar(200) | |
| type ★ | Type ★ | varchar(50) | 如「運動賽事」 |
| status | Status | varchar(20) | 正常/維護中/停用 |
| capacity | Capacity | int | |
| location | Location | varchar(500) | |
| description | Description | varchar(1000) | |
| facilities | Facilities | jsonb | 字串陣列 |
| openingHours | OpeningHours | jsonb | |
| notices | Notices | jsonb | 字串陣列 |
| isRentable | IsRentable | bool | |
| lockChildrenWhenBooked | LockChildrenWhenBooked | bool | |
| isActive | IsActive | bool | |
| images(組裝) | → VenueImages | | 見下表 |
| rentalModes(組裝) | → VenueRentalModes | | |
| pricing(組裝) | → VenuePrices | | |
| timeSlots(組裝) | → VenueTimeSlots | | |
| rentalItems(組裝) | → VenueRentalItems ★ | | |

#### VenueRentalModes 場地租借模式(大幅擴充 ★)
| 契約 | DB | 備註 |
|---|---|---|
| venueId, mode | VenueId, Mode | daily/timeslot/hourly |
| isEnabled | IsEnabled | |
| minDays/maxDays/minHours/maxHours | 同名 | 依模式 |
| requireDocuments ★ | RequireDocuments ★ | |
| depositEnabled ★ / depositAmount ★ | 同名 ★ | 押金 |
| setupAllowanceHours ★ / teardownAllowanceHours ★ | 同名 ★ | 進退場緩衝 |
| setupOverageUnitMinutes ★ / teardownOverageUnitMinutes ★ | 同名 ★ | 超時計費單位 |
| setupOverageFeePerUnit ★ / teardownOverageFeePerUnit ★ | 同名 ★ | 超時每單位費 |
| overageRoundingMode ★ | OverageRoundingMode ★ | ceil/floor/nearest |
| weekendPricingEnabled ★ | WeekendPricingEnabled ★ | 此模式是否套用假日價(假日「定義」在場館層級,見 VenueHolidaySettings) |
| **advanceBookingDays ★** | AdvanceBookingDays ★ | 可提前預約天數(**改 per-mode**) |
| **latestBookingDays ★** | LatestBookingDays ★ | 最晚可預約天數 |
| **cancelBeforeDays ⚠★** | CancelBeforeDays ⚠★ | 取消期限(單位見待確認) |
| **receiptUploadDeadlineDays ★** | ReceiptUploadDeadlineDays ★ | 收據上傳期限 |
| **documentUploadDeadlineDays ★** | DocumentUploadDeadlineDays ★ | 文件上傳期限 |

> **設計決策(每模式獨立管理租借規則)**:價格、天數/時數限制、押金、進退場/超時計費、需檢附文件、**以及申請窗口與各項期限**,一律 per-mode 存於 `VenueRentalModes`。唯一例外是**假日定義**(哪些星期算假日、是否含國定假日),那是「場館行事曆」的性質、與租借模式無關,故收斂於場館層級的 `VenueHolidaySettings`。此決策修正了前端 [rental.vue](../../frontend/src/view/admin/venues/edit/rental.vue) / [rentalRules.vue](../../frontend/src/view/admin/venues/edit/rentalRules.vue) 目前「假日設定 per-mode 存三份、又用 `watchEffect` 強制共用」的冗餘矛盾。

#### VenuePrices / VenueTimeSlots
- **VenuePrices**:`(venueId, mode, dayType, timeSlotCode) → price`。前端 `weekendPrice` 欄改為 `dayType=holiday` 的另一列。
- **VenueTimeSlots**:`(venueId, slotCode) → name, startTime, endTime, sortOrder, isEnabled`。

#### VenueRentalItems ★(新表)· 附加租借項目設定
`venueId, sortOrder, label, unit, amount, quantity, maxPerBooking`。來源 [venueRentalItems.json](../../frontend/src/mocks/venue-edit/venueRentalItems.json)。

#### VenueRequiredDocuments ★ + DocumentTemplates ★(新表)
- **DocumentTemplates**:`key(PK 業務碼), label, hint, templateFile`。全域文件範本主檔。
- **VenueRequiredDocuments**:`venueId, mode, templateKey→DocumentTemplates, required, templateFile`。**每模式各自一列**,`templateFile` 亦 per-mode —— 因租借申請書等文件會因租借方式而不同。不設 `appliesTo`(以 `mode` 欄表達適用範圍)。

#### VenueImages / VenueHolidaySettings / VenueDayTypeOverrides / VenueDateOverrides / VenueHourlyBlocks
沿用舊 schema,VenueHolidaySettings 對映前端 `weekendDays/weekendIncludeHolidays/useSystemHolidays` 概念(見 01)。

### 會員與後台

#### Member 會員
| 契約 | DB | 備註 |
|---|---|---|
| code | MemberId | M-0000001 |
| name/phone/email | 同名 | Email 唯一 |
| passwordHash | PasswordHash | 契約不回傳 |
| idNumber | IdNumber | |
| retainedDeposit ★ | RetainedDeposit ★ | 保留保證金 |
| avatar ★ | Avatar ★ | |
| identityType ★ / identityDocument ★ | 同名 ★ | 身分驗證 |
| provider ★ | Provider ★ | email/google/line |
| birthday/gender/address | 同名 | |
| status | Status | 待審核/正常/停用 |
| totalBookings/totalSpent | 同名 | |
| joinDate/lastLoginAt | 同名 | |

#### Admin 管理員 + PermissionGroups ★ + AdminManagedVenues ★
- **Admin**:`code(A-0000001), name, email, phone, role, permissionGroupId→PermissionGroups ★, avatar ★, status, lastLoginAt...`。棄用內嵌 `Permissions JSONB`,改外鍵到群組。
- **PermissionGroups ★**(新表):`code(role-00x), name, description, isSystem, permissions(jsonb 字串陣列如 "venues.view"), createdAt, updatedAt`。來源 [permissionGroups.json](../../frontend/src/mocks/permissionGroups.json)。
- **AdminManagedVenues ★**(新表,多對多):`adminId, venueId`。來源 admin.`managedVenues`。

### 預約與流程

#### Reservation 預約(擴充 ★)
| 契約 | DB | 備註 |
|---|---|---|
| code | ReservationId | R-YYYYMMDD-001 |
| venueId / memberId | VenueId / MemberId | ⚠ 前端 `userId`→`memberId` |
| rentalMode | RentalMode | ⚠ 前端 `session`→`timeslot` |
| dayType | DayType | 成交快照 |
| bookingDate ⚠ | BookingDate | ⚠ 前端 `date` |
| startDate/endDate/rentalDays | 同名 | daily |
| timeSlotCode ⚠ | TimeSlotCode | ⚠ 前端 `session` 值 |
| startTime/endTime/totalHours | 同名 | timeslot/hourly |
| unitPrice/baseFee ★/totalPrice/deposit | 同名 | 金額快照 |
| peopleCount/purpose | 同名 | |
| applicant ⚠ | ContactName/Phone/Email | ⚠ 前端單一 `applicant` 字串 → 拆三欄(或保留 applicantName 一欄,見 03) |
| status | Status | 11 態 |
| note/adminNote/cancelReason | 同名 | |
| documentRejectReason ★ | DocumentRejectReason ★ | |
| documentUploadDeadline ★ / receiptUploadDeadline ★ | 同名 ★ | |
| documentApprovedAt ★ / paymentApprovedAt ★ | 同名 ★ | |
| createdAt/confirmedAt/completedAt/cancelledAt/checkInAt | 同名 | |
| additionalFees(組裝) | → ReservationAdditionalFees ★ | |
| documents(組裝) | → ReservationDocuments ★ | |
| remittance(組裝) | → ReservationRemittances ★ | |
| refund(組裝) | → Refunds ★ | 見下 |

#### ReservationDocuments ★(新表)· 每筆預約文件
`reservationId, templateKey, label(快照), required, uploaded, fileName, uploadedAt, rejectReason`。來源 booking 內嵌 `documents[]`。

#### ReservationAdditionalFees ★(新表)· 成交附加項目快照
`reservationId, label, unit, amount, quantity`。來源 booking 內嵌 `additionalFees[]`。

#### ReservationRemittances ★(新表,1:1 或 1:N)· 匯款核帳
`reservationId, last5, amount, datetime, senderName, note, receiptImage, verifiedAt, verifiedBy`。來源 booking 內嵌 `remittance`。對應 [BPMN 06 繳費核帳](../bpmn/06-繳費核帳與確認-BPMN規格.md)。

#### Refunds ★(新表)· 退款單(取代前端 refunds.json + booking 內嵌 refund)
| 契約 | DB | 備註 |
|---|---|---|
| code | RefundId | RF-2026-0001 |
| type | Type | booking_cancellation / retained_deposit |
| status | Status | 5 態 |
| memberId(+ 冗餘 memberName/Email/Phone 快照) | 同名 | |
| bookingId(nullable) | ReservationId | retained_deposit 時為 null |
| amountRequested / amountApproved | 同名 | |
| reason | Reason | |
| bankAccount{bankName,branchName,accountName,accountNumber} | Bank* 四欄 或 jsonb | |
| bankbookImage | BankbookImage | 存摺影本 |
| requestedAt / adminApprovedAt / accountingApprovedAt / cashierCompletedAt / rejectedAt | 同名 | 各階段時戳 |
| rejectedReason / notes | 同名 | |

對應 [BPMN 02 取消退款](../bpmn/02-訂單取消與退款-BPMN規格.md) 與 [BPMN 03 預留保證金退款](../bpmn/03-預留保證金退款-BPMN規格.md)。

### 內容與系統

| 實體 | 契約重點欄位 | 來源 | 備註 |
|---|---|---|---|
| News | id, category, title, summary, content, publishedAt, pinned↔IsPinned ⚠, imageUrl↔CoverImage ⚠ | [news.json](../../frontend/src/mocks/news.json) | 命名差異 |
| FAQs ★ | id, category, question, answer, sortOrder | [faq.json](../../frontend/src/mocks/faq.json) | 前端依 category 分組;DB 攤平 |
| CalendarNotes ★ | id, venueId(nullable), title, date, allDay, startTime, endTime, description, createdBy | [calendarNotes.json](../../frontend/src/mocks/calendarNotes.json) | 管理端行事曆備註 |
| SystemHolidays / SystemSettings | 沿用舊 schema | | |
| Payments / AuditLogs / Notifications | 沿用舊 schema(擴充功能) | | |

---

## 實體關聯總覽

```
Venue ─┬─< VenueRentalModes ─< VenueRequiredDocuments >── DocumentTemplates
       ├─< VenuePrices        ├─< VenueTimeSlots
       ├─< VenueRentalItems   ├─< VenueImages
       ├─< VenueHolidaySettings / DayTypeOverrides / DateOverrides / HourlyBlocks
       └─< Reservation
Reservation ─┬─< ReservationDocuments (templateKey → DocumentTemplates)
             ├─< ReservationAdditionalFees
             ├─< ReservationRemittances
             └─1─ Refund (booking_cancellation)
Member ─┬─< Reservation
        └─< Refund (含 retained_deposit,bookingId=null)
Admin ──< AdminManagedVenues >── Venue
Admin ──> PermissionGroups
SystemHolidays ··(參照)·· VenueHolidaySettings
News · FAQs · CalendarNotes · SystemSettings(獨立)
```

> `─<` = 一對多,`>──` = 多對一,`─1─` = 一對一,`··` = 邏輯參照(非硬 FK)。
