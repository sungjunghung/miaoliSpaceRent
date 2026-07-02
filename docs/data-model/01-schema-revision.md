# 01 — Schema 修訂(PostgreSQL 16)

> 本文件是對 [databaseTableSchema.md](../databaseTableSchema.md)(舊 18 張表)的**修訂與擴充**,依 [00 canonical 模型](00-canonical-data-model.md) 制定。核准並實作後,本文件取代舊 schema 成為權威。
>
> 內容:①既有表的**增修 diff** ②**新增 ~12 張表** ③約束/觸發器補充。型別沿用舊 schema 的 [PostgreSQL 型別對照](../databaseTableSchema.md#postgresql-資料型別對照)。

## 總覽:表數 18 → 30

| 分類 | 動作 | 表 |
|---|---|---|
| 場地 | **增修** | Venues, VenueRentalModes, VenuePrices, VenueTimeSlots, VenueHolidaySettings |
| 場地 | **新增** | VenueRentalItems, VenueRequiredDocuments, DocumentTemplates |
| 會員後台 | **增修** | Members, Admins |
| 會員後台 | **新增** | PermissionGroups, AdminManagedVenues |
| 預約流程 | **增修** | Reservations |
| 預約流程 | **新增** | ReservationDocuments, ReservationAdditionalFees, ReservationRemittances, Refunds |
| 內容 | **新增** | FAQs, CalendarNotes |
| 內容 | **不變** | News(僅命名映射,見 00)、SystemSettings, SystemHolidays, VenueDayTypeOverrides, VenueDateOverrides, VenueHourlyBlocks |
| 擴充(未來) | **不變** | Payments, AuditLogs, VenueImages, Notifications |

---

## A. 既有表增修(diff)

### Venues(+1 欄;窗口/期限欄位改 per-mode 移出)
```sql
ALTER TABLE Venues
  ADD COLUMN Type VARCHAR(50);   -- ★ 場地分類(如「運動賽事」)

-- 申請窗口/期限改為「每模式各自設定」,故從 Venues 移出到 VenueRentalModes:
--   既有欄位 AdvanceBookingDays、CancelBeforeHours 於資料遷移後 DROP。
ALTER TABLE Venues
  DROP COLUMN AdvanceBookingDays,
  DROP COLUMN CancelBeforeHours;
```
> **設計決策(每模式獨立管理租借規則)**:申請窗口與各項期限(可提前/最晚可預約/取消/文件、收據上傳期限)一律 per-mode,見 [VenueRentalModes](#venuerentalmodes大幅擴充-)。場館層級僅保留場地基本屬性與**假日定義**(見 [VenueHolidaySettings](#venueholidaysettings假日定義收斂-))。
>
> `mainImageUrl / gallery`:**不**加欄,一律走 `VenueImages`(`IsMain=true` 為主圖,其餘為 gallery)。

### VenueRentalModes(大幅擴充 ★)
```sql
ALTER TABLE VenueRentalModes
  ADD COLUMN RequireDocuments           BOOLEAN DEFAULT false,
  ADD COLUMN DepositEnabled             BOOLEAN DEFAULT false,
  ADD COLUMN DepositAmount              NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN SetupAllowanceHours        INT DEFAULT 0,
  ADD COLUMN TeardownAllowanceHours     INT DEFAULT 0,
  ADD COLUMN SetupOverageUnitMinutes    INT DEFAULT 0,
  ADD COLUMN TeardownOverageUnitMinutes INT DEFAULT 0,
  ADD COLUMN SetupOverageFeePerUnit     NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN TeardownOverageFeePerUnit  NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN OverageRoundingMode        VARCHAR(10) DEFAULT 'ceil', -- ceil/floor/nearest
  ADD COLUMN WeekendPricingEnabled      BOOLEAN DEFAULT false,       -- 此模式是否套用假日價(定義在場館層級)
  -- ★ 申請窗口/期限改 per-mode(自 Venues 移入):
  ADD COLUMN AdvanceBookingDays         INT DEFAULT 7,   -- 可提前預約天數
  ADD COLUMN LatestBookingDays          INT DEFAULT 1,   -- 最晚可預約天數
  ADD COLUMN CancelBeforeDays           INT DEFAULT 7,   -- ⚠ 取消期限(單位待確認,見 00)
  ADD COLUMN ReceiptUploadDeadlineDays  INT DEFAULT 3,   -- 收據上傳期限
  ADD COLUMN DocumentUploadDeadlineDays INT DEFAULT 7;   -- 文件上傳期限
-- Mode 值域改為 daily / timeslot / hourly(原 timeslot 已一致)
-- 註:假日「定義」(WeekendDays / WeekendIncludeHolidays)不放這裡,收斂至 VenueHolidaySettings。
```

### VenuePrices(語意調整)
- 維持 `(VenueId, Mode, DayType, TimeSlotCode)` 唯一鍵。
- **前端 `weekendPrice` 攤平**:一筆 `DayType=weekday` + 一筆 `DayType=holiday`。轉換由 [adapter.ts](../../frontend/src/mocks/venue-edit/adapter.ts) 現有邏輯延伸。
- `Mode` 值 `session→timeslot`。

### VenueTimeSlots
無結構變更;確認 `SortOrder / IsEnabled` 存在(前端 [venueTimeSlots.json](../../frontend/src/mocks/venue-edit/venueTimeSlots.json) 未帶,由預設補)。

### VenueHolidaySettings(假日定義收斂 ★)
假日「定義」是場館層級(與租借模式無關),故所有模式共用一份,存於此表。對映前端 `weekendDays / weekendIncludeHolidays`。
```sql
ALTER TABLE VenueHolidaySettings
  ADD COLUMN WeekendDays JSONB DEFAULT '[0,6]';  -- ★ 算假日的星期(0=日..6=六),對映前端 weekendDays
-- 既有 UseSystemHolidays 對映前端 weekendIncludeHolidays(是否含國定假日)。
-- 既有 SaturdayAsHoliday / SundayAsHoliday 由 WeekendDays 涵蓋,遷移後可淘汰或保留為衍生值。
```
> 各模式的 `WeekendPricingEnabled`(要不要套用假日價)仍在 `VenueRentalModes`;但「哪些日子是假日」統一讀本表。修正前端 [rentalRules.vue](../../frontend/src/view/admin/venues/edit/rentalRules.vue) 目前 per-mode 存三份 + `watchEffect` 強制共用的冗餘。

### Members(+5 欄 ★)
```sql
ALTER TABLE Members
  ADD COLUMN RetainedDeposit   NUMERIC(10,2) DEFAULT 0,   -- ★ 保留保證金
  ADD COLUMN Avatar            VARCHAR(500),              -- ★
  ADD COLUMN IdentityType      VARCHAR(20),               -- ★ 身分別
  ADD COLUMN IdentityDocument  VARCHAR(500),              -- ★ 身分證明檔
  ADD COLUMN Provider          VARCHAR(20) DEFAULT 'email'; -- ★ email/google/line
```

### Admins(改權限模型)
```sql
ALTER TABLE Admins
  ADD COLUMN PermissionGroupId INT REFERENCES PermissionGroups(Id), -- ★
  ADD COLUMN Avatar            VARCHAR(500);                        -- ★
-- 既有 Permissions JSONB:保留過渡,權限判定改讀 PermissionGroups;
--   資料遷移後可移除(見 04 B5)。
```

### Reservations(+7 欄,值域調整)
```sql
ALTER TABLE Reservations
  ADD COLUMN BaseFee                NUMERIC(10,2) DEFAULT 0,  -- ★ 場地費(不含押金/附加)
  ADD COLUMN DocumentRejectReason   VARCHAR(500),             -- ★
  ADD COLUMN DocumentUploadDeadline TIMESTAMPTZ,              -- ★
  ADD COLUMN ReceiptUploadDeadline  TIMESTAMPTZ,              -- ★
  ADD COLUMN DocumentApprovedAt     TIMESTAMPTZ,              -- ★
  ADD COLUMN PaymentApprovedAt      TIMESTAMPTZ;              -- ★
-- RentalMode 值 session→timeslot
-- Status 值域擴充為 00 定義的 11 態(英文 snake_case)。
--   建議加 CHECK 約束或於應用層強制。
-- ContactName/Phone/Email:對映前端 applicant(見 03 的拆併決策)。
```

---

## B. 新增表

### DocumentTemplates ★ · 文件範本主檔
| 欄位 | 型別 | 說明 |
|---|---|---|
| Id | SERIAL PK | |
| TemplateKey | VARCHAR(50) UNIQUE | 業務碼(application_form 等) |
| Label | VARCHAR(100) | |
| Hint | VARCHAR(500) | |
| TemplateFile | VARCHAR(500) | 範本檔(可 NULL) |
| CreatedAt/UpdatedAt | TIMESTAMPTZ | |

### VenueRequiredDocuments ★ · 場地文件需求
| 欄位 | 型別 | 說明 |
|---|---|---|
| Id | SERIAL PK | |
| VenueId | INT FK→Venues | |
| Mode | VARCHAR(20) | daily/timeslot/hourly（適用範圍即此欄，不另設 appliesTo） |
| TemplateKey | VARCHAR(50) FK→DocumentTemplates | |
| Required | BOOLEAN | |
| TemplateFile | VARCHAR(500) | ★ 此模式專屬範本（可 NULL）；租借申請書等因模式而異 |
| CreatedAt/UpdatedAt | TIMESTAMPTZ | |

**唯一約束**:`(VenueId, Mode, TemplateKey)` — 每模式各自一列,故同一文件在不同模式可放不同 `TemplateFile`。

### VenueRentalItems ★ · 附加租借項目
| 欄位 | 型別 | 說明 |
|---|---|---|
| Id | SERIAL PK | |
| VenueId | INT FK→Venues | |
| SortOrder | INT | |
| Label | VARCHAR(100) | |
| Unit | VARCHAR(50) | 如「張」「每 2 日」 |
| Amount | NUMERIC(10,2) | 單價(0=免費) |
| Quantity | INT | 可提供總量 |
| MaxPerBooking | INT | 單筆上限 |
| CreatedAt/UpdatedAt | TIMESTAMPTZ | |

### PermissionGroups ★ · 權限群組
| 欄位 | 型別 | 說明 |
|---|---|---|
| Id | SERIAL PK | |
| GroupCode | VARCHAR(20) UNIQUE | role-001 |
| Name | VARCHAR(100) | |
| Description | VARCHAR(500) | |
| IsSystem | BOOLEAN | 系統內建不可刪 |
| Permissions | JSONB | 字串陣列 ["venues.view",...] |
| CreatedAt/UpdatedAt | TIMESTAMPTZ | |

### AdminManagedVenues ★ · 管理員負責場館(多對多)
| 欄位 | 型別 | 說明 |
|---|---|---|
| AdminId | INT FK→Admins | |
| VenueId | INT FK→Venues | |
**主鍵**:`(AdminId, VenueId)`

### ReservationDocuments ★ · 預約文件
| 欄位 | 型別 | 說明 |
|---|---|---|
| Id | SERIAL PK | |
| ReservationId | INT FK→Reservations | |
| TemplateKey | VARCHAR(50) FK→DocumentTemplates | |
| Label | VARCHAR(100) | 成交快照 |
| Required | BOOLEAN | 成交快照 |
| Uploaded | BOOLEAN | |
| FileName | VARCHAR(255) | |
| UploadedAt | TIMESTAMPTZ | |
| RejectReason | VARCHAR(500) | |
| CreatedAt/UpdatedAt | TIMESTAMPTZ | |

### ReservationAdditionalFees ★ · 成交附加項目快照
| 欄位 | 型別 | 說明 |
|---|---|---|
| Id | SERIAL PK | |
| ReservationId | INT FK→Reservations | |
| Label | VARCHAR(100) | |
| Unit | VARCHAR(50) | |
| Amount | NUMERIC(10,2) | 單價 |
| Quantity | INT | 實選數量 |

### ReservationRemittances ★ · 匯款核帳
| 欄位 | 型別 | 說明 |
|---|---|---|
| Id | SERIAL PK | |
| ReservationId | INT FK→Reservations | |
| Last5 | VARCHAR(5) | 帳號末五碼 |
| Amount | NUMERIC(10,2) | |
| Datetime | TIMESTAMPTZ | 匯款時間 |
| SenderName | VARCHAR(100) | |
| Note | VARCHAR(500) | |
| ReceiptImage | VARCHAR(500) | 收據影本 |
| VerifiedAt | TIMESTAMPTZ | 核帳時間 |
| VerifiedBy | INT FK→Admins | 核帳人 |
| CreatedAt | TIMESTAMPTZ | |
> 一筆預約可有多次匯款(分次匯入),採 1:N。

### Refunds ★ · 退款單
| 欄位 | 型別 | 說明 |
|---|---|---|
| Id | SERIAL PK | |
| RefundCode | VARCHAR(20) UNIQUE | RF-2026-0001(觸發器生成) |
| Type | VARCHAR(30) | booking_cancellation / retained_deposit |
| Status | VARCHAR(30) | 5 態(見 00) |
| MemberId | INT FK→Members | |
| MemberName/MemberEmail/MemberPhone | VARCHAR | 冗餘快照(結案憑證) |
| ReservationId | INT FK→Reservations NULL | retained_deposit 時 NULL |
| AmountRequested | NUMERIC(10,2) | |
| AmountApproved | NUMERIC(10,2) NULL | 承辦核定 |
| Reason | VARCHAR(500) | |
| BankName/BranchName/AccountName/AccountNumber | VARCHAR | 收款帳戶 |
| BankbookImage | VARCHAR(500) | 存摺影本 |
| RequestedAt | TIMESTAMPTZ | |
| AdminApprovedAt/AccountingApprovedAt/CashierCompletedAt/RejectedAt | TIMESTAMPTZ NULL | 各階段時戳 |
| RejectedReason | VARCHAR(500) | |
| Notes | VARCHAR(1000) | |
| CreatedAt/UpdatedAt | TIMESTAMPTZ | |

### FAQs ★
| 欄位 | 型別 | 說明 |
|---|---|---|
| Id | SERIAL PK | |
| Category | VARCHAR(50) | 分組標題(前端依此分組) |
| Question | VARCHAR(300) | |
| Answer | TEXT | |
| SortOrder | INT | |
| IsPublished | BOOLEAN DEFAULT true | |
| CreatedAt/UpdatedAt | TIMESTAMPTZ | |

### CalendarNotes ★ · 管理端行事曆備註
| 欄位 | 型別 | 說明 |
|---|---|---|
| Id | SERIAL PK | |
| VenueId | INT FK→Venues NULL | NULL=全館 |
| Title | VARCHAR(200) | |
| Date | DATE | |
| AllDay | BOOLEAN | |
| StartTime/EndTime | TIME NULL | 非全天用 |
| Description | VARCHAR(1000) | |
| CreatedBy | INT FK→Admins | |
| CreatedAt/UpdatedAt | TIMESTAMPTZ | |

---

## C. 約束、觸發器、索引

- **格式化業務碼觸發器**:沿用舊 schema 機制,新增 `Refunds.RefundCode`(RF-YYYY-NNNN)。Members/Admins/Reservations 既有。
- **UpdatedAt 自動更新**:所有含 `UpdatedAt` 的新表套用 `BEFORE UPDATE` 觸發器(沿用舊 schema 函式)。
- **預約衝突**:沿用舊 schema 的 EXCLUDE 約束 + 觸發器;`RentalMode=timeslot` 對映原 timeslot 邏輯。
- **狀態值域**:Reservations.Status / Refunds.Status / Refunds.Type / OverageRoundingMode 建議加 `CHECK` 或以 enum 型別實作(EF 端以 string 對映)。
- **建議索引**:`Reservations(MemberId)`、`Reservations(VenueId, BookingDate)`、`Refunds(MemberId)`、`Refunds(Status)`、`ReservationDocuments(ReservationId)`、`VenueRequiredDocuments(VenueId, Mode)`。

## D. 假日判定優先順序
沿用舊 schema [假日判定](../databaseTableSchema.md#假日判定優先順序);`VenueHolidaySettings` 與前端 `weekendDays/weekendIncludeHolidays/useSystemHolidays` 的欄位對映於 [00](00-canonical-data-model.md) 標註,實作時於 Application 層集中此邏輯。
