# MiaoliSpaceRent 資料庫結構說明

## 資料庫概覽

- **資料庫名稱**: miaoliSpaceRent
- **資料庫類型**: PostgreSQL 16
- **資料表數量**: 21 張
- **主要功能**: 場館/空間租借、會員管理、預約與系統後台營運
- **特殊功能**:
  - 自動格式化 ID（透過觸發器）
  - JSONB 欄位支援複雜資料查詢
  - 預約衝突檢查（EXCLUDE 約束 + 觸發器）
  - 自動更新時間戳記

---

## 資料表分類

### 1. 核心資料表

| 資料表 | 說明 | 優先級 |
|--------|------|--------|
| `Venues` | 場館/空間表（支援階層結構） | 🔴 高 |
| `VenueRentalModes` | 場地租借模式設定表 | 🔴 高 |
| `VenueTimeSlots` | 場地時段定義表 | 🔴 高 |
| `VenuePrices` | 場地價格表（平日/假日） | 🔴 高 |
| `VenueRentalItems` | 場館附加項目／設備租借表 | 🔴 高 |
| `VenueRequiredDocuments` | 場館各模式需檢附文件表 | 🔴 高 |
| `DocumentTemplates` | 文件範本主檔 | 🟡 中 |
| `VenueImages` | 場館圖片表（多圖、排序、主圖） | 🔴 高 |
| `SystemHolidays` | 系統國定假日表 | 🔴 高 |
| `VenueHolidaySettings` | 場館假日設定表 | 🔴 高 |
| `VenueDayTypeOverrides` | 場館自訂日別覆寫表 | 🔴 高 |
| `VenueDateOverrides` | 場館日期覆寫表（開館/閉館） | 🔴 高 |
| `VenueHourlyBlocks` | 場館不可租借時段表（小時單位） | 🔴 高 |
| `Members` | 會員表 | 🔴 高 |
| `Reservations` | 預約表 | 🔴 高 |
| `Admins` | 系統管理員表 | 🔴 高 |
| `News` | 最新消息表 | 🟡 中 |
| `SystemSettings` | 系統設定表 | 🟡 中 |

### 2. 擴充資料表（未來功能）

| 資料表 | 說明 | 優先級 |
|--------|------|--------|
| `Payments` | 付款記錄表 | 🟢 低 |
| `AuditLogs` | 操作記錄表 | 🟢 低 |
| `Notifications` | 通知記錄表 | 🟢 低 |

---

## PostgreSQL 資料型別對照

本系統使用 PostgreSQL 16，以下是主要資料型別說明：

| 邏輯型別 | PostgreSQL 型別 | 說明 | 範例 |
|---------|----------------|------|------|
| 自增主鍵 | `SERIAL` | 自動遞增整數（1, 2, 3...） | `Id SERIAL PRIMARY KEY` |
| 大整數主鍵 | `BIGSERIAL` | 自動遞增長整數 | `Id BIGSERIAL PRIMARY KEY` |
| 字串 | `VARCHAR(n)` | 可變長度字串（支援 Unicode） | `VARCHAR(200)` |
| 大文字 | `TEXT` | 無限長度文字 | `Content TEXT` |
| JSON 資料 | `JSONB` | 二進位 JSON（可索引、可查詢） | `Facilities JSONB` |
| 布林值 | `BOOLEAN` | true/false | `IsActive BOOLEAN` |
| 小數 | `NUMERIC(p,s)` | 精確小數 | `NUMERIC(10,2)` |
| 日期 | `DATE` | 日期（不含時間） | `Birthday DATE` |
| 時間 | `TIME` | 時間（不含日期） | `StartTime TIME` |
| 時間戳記 | `TIMESTAMPTZ` | 日期時間（含時區） | `CreatedAt TIMESTAMPTZ` |

### PostgreSQL 特殊功能

#### 1. 自動格式化 ID（觸發器）
- 使用 `BEFORE INSERT` 觸發器自動產生格式化編號
- 格式：`M-0000001`, `R-20260108-001`, `A-0000001`
- 由資料庫層保證並發安全性

#### 2. JSONB 欄位優勢
- 支援 GIN 索引加速查詢
- 支援 JSON 操作符（`@>`, `?`, `->>` 等）
- 自動驗證 JSON 格式合法性
- 查詢範例：`WHERE Tags @> '["籃球"]'::jsonb`

#### 3. 預約衝突檢查
- 使用 EXCLUDE 約束防止時段重疊
- 使用觸發器檢查全日租借和階層鎖定
- 資料庫層面強制保證資料一致性

#### 4. 自動更新時間
- UpdatedAt 欄位透過觸發器自動更新
- 使用 `BEFORE UPDATE` 觸發器實作

---

## 核心資料表

### Venues - 場館/空間表
**用途**: 定義場館基本資訊與階層結構（租借規則與價格請見 VenueRentalModes / VenuePrices）

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| Name | VARCHAR(200) | 場館名稱（必填） |
| Type | VARCHAR(50) | 場館類別（例：運動賽事、藝文展演，可選） |
| Description | VARCHAR(1000) | 場館介紹（可選） |
| Location | VARCHAR(500) | 場館地址（必填） |
| Capacity | INT | 容納人數（必填） |
| ParentId | INT | 父層 ID（自我關聯，可選；NULL 表頂層） |
| HasChildren | BOOLEAN | 是否有子空間（預設：false） |
| IsRentable | BOOLEAN | 是否可租借（預設：true） |
| LockChildrenWhenBooked | BOOLEAN | 租借時是否鎖定子空間（預設：false） |
| AdvanceBookingDays | INT | 最早可申請：使用日前 N 天（可選） |
| LatestBookingDays | INT | 最晚可預約：使用日前 N 天（可選） |
| CancellationDeadlineDays | INT | 最晚取消：使用日前 N 天（可選） |
| ReceiptUploadDeadlineDays | INT | 匯款資料上傳期限：確認後 N 天內（可選） |
| DocumentUploadDeadlineDays | INT | 文件上傳期限：審核通過後 N 天內（可選） |
| Facilities | JSONB | 設施（JSON 字串陣列） |
| Notices | JSONB | 預約須知（JSON 字串陣列） |
| OpeningHours | JSONB | 營業時間（JSON 物件，鍵為 mon~sun） |
| ClosedWeekdays | JSONB | 固定休館星期（JSON 數字陣列，0=日～6=六） |
| ClosedDates | JSONB | 休館日期（JSON 日期字串陣列） |
| Status | VARCHAR(20) | 狀態（available/maintenance/closed，預設：available） |
| IsActive | BOOLEAN | 是否啟用（可空） |
| CreatedAt | TIMESTAMPTZ | 建立時間（自動設定） |
| UpdatedAt | TIMESTAMPTZ | 更新時間（自動更新） |

**注意事項**:
- `ParentId` 為 NULL 表示頂層場館
- 階層結構由應用層維護，資料庫僅儲存父子關係
- 各期限欄位（AdvanceBookingDays、LatestBookingDays、CancellationDeadlineDays、ReceiptUploadDeadlineDays、DocumentUploadDeadlineDays）為**場館層級**設定；後台編輯頁雖以「每租借模式」呈現，實際持久化於場館層級（各模式共用）
- `ClosedWeekdays` / `ClosedDates` 為簡易休館設定；更細緻的單日開／閉館與日別覆寫另見 VenueDateOverrides / VenueDayTypeOverrides
- 所有 JSONB 欄位在資料庫層面可為 NULL，實際使用時由應用層處理

---

### VenueRentalModes - 場地租借模式設定表
**用途**: 設定每個場地開放的租借方式及其限制

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| VenueId | INT | 場館 ID（關聯 Venues） |
| Mode | VARCHAR(20) | 租借模式（daily/timeslot/hourly） |
| IsEnabled | BOOLEAN | 是否啟用此模式 |
| MinDays | INT | 最少租借天數（daily 模式用） |
| MaxDays | INT | 最多租借天數（daily 模式用） |
| MinHours | INT | 最少租借時數（hourly 模式用） |
| MaxHours | INT | 最多租借時數（hourly 模式用） |
| DepositEnabled | BOOLEAN | 是否需要保證金 |
| DepositAmount | NUMERIC(10,2) | 保證金金額 |
| RequireDocuments | BOOLEAN | 此模式是否需檢附文件 |
| SetupAllowanceHours | NUMERIC(4,1) | 場佈容許時數（可 0.5 為單位） |
| TeardownAllowanceHours | NUMERIC(4,1) | 撤場容許時數（可 0.5 為單位） |
| SetupOverageUnitMinutes | INT | 場佈超時計費單位（分鐘） |
| TeardownOverageUnitMinutes | INT | 撤場超時計費單位（分鐘） |
| SetupOverageFeePerUnit | NUMERIC(10,2) | 場佈超時每單位費用 |
| TeardownOverageFeePerUnit | NUMERIC(10,2) | 撤場超時每單位費用 |
| OverageRoundingMode | VARCHAR(10) | 超時進位方式（ceil/floor/nearest） |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |

**唯一約束**: `(VenueId, Mode)` 確保每個場地每種模式只有一筆設定

**Mode 說明**:
- `daily`: 整日租借（以天為單位）
- `timeslot`: 時段租借（上午/下午/夜間；前端程式內部 key 為 `session`，時段區間見 VenueTimeSlots）
- `hourly`: 小時租借（以小時為單位）

---

### VenueTimeSlots - 場地時段定義表
**用途**: 定義各場地的時段區間（上午/下午/夜間的開始與結束時間）

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| VenueId | INT | 場館 ID（關聯 Venues） |
| SlotCode | VARCHAR(20) | 時段代碼（morning/afternoon/evening） |
| SlotName | VARCHAR(50) | 時段名稱（上午/下午/夜間） |
| StartTime | TIME | 開始時間 |
| EndTime | TIME | 結束時間 |
| SortOrder | INT | 排序 |
| IsEnabled | BOOLEAN | 是否啟用 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |

**唯一約束**: `(VenueId, SlotCode)` 確保每個場地每個時段只有一筆設定

**SlotCode 說明**:
- `morning`: 上午時段
- `afternoon`: 下午時段
- `evening`: 夜間時段

---

### VenuePrices - 場地價格表
**用途**: 設定各場地不同租借模式與日期類型的價格

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| VenueId | INT | 場館 ID（關聯 Venues） |
| Mode | VARCHAR(20) | 租借模式（daily/timeslot/hourly） |
| TimeSlotCode | VARCHAR(20) | 時段代碼（timeslot 模式用，其餘為 NULL） |
| Price | NUMERIC(10,2) | 平日價 |
| WeekendPrice | NUMERIC(10,2) | 假日價 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |

**唯一約束**: `(VenueId, Mode, TimeSlotCode)` 確保價格設定不重複

**價格範例**:
| Mode | TimeSlotCode | Price（平日） | WeekendPrice（假日） | 說明 |
|------|--------------|------|------|------|
| daily | NULL | 50000 | 50000 | 整日價 |
| timeslot | morning | 3000 | 3000 | 上午時段價 |
| timeslot | afternoon | 3000 | 3000 | 下午時段價 |
| hourly | NULL | 500 | 600 | 每小時價 |

**身份別價格（尚未落地）**:
後台編輯頁已支援「身份別價格」（每列一種身份，如一般民眾／在地居民，各有平日、假日價），但**目前資料層尚未持久化此維度**（現行僅存一組基準價 Price/WeekendPrice）。未來若導入，建議擴充身份別維度——例如新增 `IdentityLabel` 欄位並將其納入唯一約束，或另建 `VenuePriceIdentities` 子表。

---

### VenueRentalItems - 場館附加項目／設備租借表
**用途**: 設定場地可額外租借的設備或收費項目（金額 0 表示免費提供）

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| VenueId | INT | 場館 ID（關聯 Venues） |
| Label | VARCHAR(100) | 項目名稱（如：折疊椅） |
| Unit | VARCHAR(20) | 單位（張、台、組…） |
| Amount | NUMERIC(10,2) | 金額（0 表示免費） |
| Quantity | INT | 可租借總數量 |
| MaxPerBooking | INT | 每次預約租借上限 |
| SortOrder | INT | 排序（可為 NULL） |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |

---

### VenueRequiredDocuments - 場館各模式需檢附文件表
**用途**: 設定各場館各租借模式需檢附的文件與其範本檔

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| VenueId | INT | 場館 ID（關聯 Venues） |
| Mode | VARCHAR(20) | 租借模式（daily/timeslot/hourly） |
| TemplateKey | VARCHAR(50) | 文件範本鍵（關聯 DocumentTemplates.Key） |
| Required | BOOLEAN | 是否必繳 |
| TemplateFile | VARCHAR(255) | 已上傳的範本檔名（可為 NULL） |
| AppliesTo | JSONB | 適用模式（JSON 字串陣列，如 `["daily"]`） |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |

**唯一約束**: `(VenueId, Mode, TemplateKey)`

**注意事項**:
- `Mode` 為此筆設定所歸屬的模式；`AppliesTo` 記錄同一份文件實際適用於哪些模式（前端支援跨模式套用同一文件）

---

### DocumentTemplates - 文件範本主檔
**用途**: 定義系統可用的文件範本類型，供各場館各模式引用

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| Key | VARCHAR(50) | 範本鍵（唯一，如 application_form / agreement / payment_proof） |
| Label | VARCHAR(100) | 文件名稱（如：租借申請書） |
| Hint | VARCHAR(200) | 說明提示 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |

**唯一約束**: `Key`

---

### VenueImages - 場館圖片表
**用途**: 管理場館圖片、主圖與排序

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| VenueId | INT | 場館 ID（關聯 Venues） |
| Url | VARCHAR(500) | 圖片 URL |
| IsMain | BOOLEAN | 是否為主圖 |
| SortOrder | INT | 排序 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| CreatedBy | INT | 建立者 ID |

**注意事項**:
- 每個場館建議僅一張 `IsMain = true`（主圖）；前端另以 `SortOrder` 決定 gallery 顯示順序

---

### SystemHolidays - 系統國定假日表
**用途**: 統一管理國定假日與補班日，供各場館參考套用

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| Date | DATE | 日期（唯一） |
| Name | VARCHAR(100) | 假日名稱 |
| HolidayType | VARCHAR(20) | 類型（national/makeup_workday） |
| Year | INT | 年份（便於查詢） |
| Description | VARCHAR(200) | 說明 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |
| CreatedBy | INT | 建立者（管理員 ID） |

**唯一約束**: `Date`

**HolidayType 說明**:
- `national`: 國定假日（元旦、春節、清明、端午、中秋、國慶等）
- `makeup_workday`: 補班日（週六補班）

**資料範例**:
| Date | Name | HolidayType | Year |
|------|------|-------------|------|
| 2026-01-01 | 元旦 | national | 2026 |
| 2026-01-29 | 除夕 | national | 2026 |
| 2026-01-30 | 春節 | national | 2026 |
| 2026-02-07 | 補班日 | makeup_workday | 2026 |

---

### VenueHolidaySettings - 場館假日設定表
**用途**: 設定各場館各租借模式的假日判定規則，決定哪些星期／日期適用假日價格

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| VenueId | INT | 場館 ID（關聯 Venues） |
| Mode | VARCHAR(20) | 租借模式（daily/timeslot/hourly） |
| WeekendDays | JSONB | 視為假日價的星期（JSON 數字陣列，0=日～6=六） |
| WeekendIncludeHolidays | BOOLEAN | 是否納入系統國定假日為假日價 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |

**唯一約束**: `(VenueId, Mode)` 確保每個場館每種模式只有一筆設定

**注意事項**:
- 後台編輯頁目前將假日設定視為**場館層級共用**（各模式相同）；資料層則以 `(VenueId, Mode)` 儲存，保留未來各模式獨立設定的彈性
- 是否「啟用假日價」由 `WeekendDays` 非空或 `WeekendIncludeHolidays` 為真推導，未另存旗標欄位

---

### VenueDayTypeOverrides - 場館自訂日別覆寫表
**用途**: 記錄特定場館在特定日期的日別覆寫（自訂平日/自訂假日），用於覆蓋系統國定假日與週末假日規則

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| VenueId | INT | 場館 ID（關聯 Venues） |
| Date | DATE | 日期（不含時間） |
| DayType | VARCHAR(20) | 日別（weekday/holiday） |
| Reason | VARCHAR(200) | 原因（必填，用於管理與稽核說明） |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |

**唯一約束**: `(VenueId, Date)` 確保同場館同日期只有一筆覆寫（最終狀態）

**DayType 說明**:
- `weekday`: 自訂平日（可覆蓋國定假日與週末假日規則）
- `holiday`: 自訂假日（可覆蓋補班日與一般平日）

**資料範例**:
| VenueId | Date | DayType | Reason |
|---------|------|---------|--------|
| 1 | 2026-01-01 | weekday | 元旦照常營業（平日價） |
| 1 | 2026-02-14 | holiday | 情人節活動（假日價） |
| 2 | 2026-02-07 | holiday | 補班日但場館休息（假日價） |

---

### VenueDateOverrides - 場館日期覆寫表
**用途**: 設定場館特定日期的開館或閉館覆寫，用於覆蓋系統預設的營業日判定

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| VenueId | INT | 場館 ID（關聯 Venues） |
| Date | DATE | 日期（不含時間） |
| OverrideType | VARCHAR(20) | 覆寫類型（open: 開館覆寫, closed: 閉館覆寫） |
| Reason | VARCHAR(200) | 原因（選填，用於管理與稽核說明） |
| CreatedBy | INT | 建立者（管理員 ID） |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |

**唯一約束**: `(VenueId, Date)` 確保同場館同日期只有一筆覆寫

**OverrideType 說明**:
- `open`: 開館覆寫（將原本不營業的日期改為營業，如補班日設為平日營業）
- `closed`: 閉館覆寫（將原本營業的日期改為不營業，如臨時休館、維護日）

**資料範例**:
| VenueId | Date | OverrideType | Reason |
|---------|------|--------------|--------|
| 1 | 2026-02-07 | open | 補班日正常營業 |
| 1 | 2026-02-14 | closed | 情人節活動場地維護 |
| 2 | 2026-03-15 | closed | 設備檢修 |

**與 VenueDayTypeOverrides 的差異**:
- `VenueDateOverrides`: 控制該日期是否營業（開館/閉館）
- `VenueDayTypeOverrides`: 控制該日期的價格類型（平日價/假日價）

---

### VenueHourlyBlocks - 場館不可租借時段表
**用途**: 設定特定日期的不可租借時段（小時單位），父層設定會向下套用

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| VenueId | INT | 場館 ID（關聯 Venues） |
| Date | DATE | 日期（不含時間） |
| Hour | INT | 小時（0-23） |
| Reason | VARCHAR(200) | 原因（選填） |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |
| CreatedBy | INT | 建立者（管理員 ID） |

**唯一約束**: `(VenueId, Date, Hour)`

**資料範例**:
| VenueId | Date | Hour | Reason |
|---------|------|------|--------|
| 1 | 2026-01-15 | 9 | 場地整修 |
| 1 | 2026-01-15 | 10 | 場地整修 |
| 2 | 2026-01-20 | 14 | 內部活動 |

---

### 假日判定優先順序

對於某場館某租借模式在某日期，DayType（weekday/holiday）的判定規則如下：

1. **VenueDayTypeOverrides** 最高優先 → 若該日有覆寫，直接採用（weekday/holiday）
2. **SystemHolidays**（當該模式 WeekendIncludeHolidays=true）→ national 類型為假日，makeup_workday 為平日
3. **WeekendDays** → 若該日星期落在設定的假日星期清單，視為假日
4. 其他日期 → 平日

**判定邏輯偽代碼**:
```
function getDayType(venueId, mode, date):
    setting = getVenueHolidaySetting(venueId, mode)

    // 1. 場館自訂日別覆寫（最高優先）
    override = getVenueDayTypeOverride(venueId, date)
    if override exists:
        return override.DayType  // weekday/holiday

    // 2. 系統國定假日（可由場館各模式決定是否套用）
    if setting.WeekendIncludeHolidays:
        systemHoliday = getSystemHoliday(date)
        if systemHoliday:
            if systemHoliday.HolidayType == 'national':
                return 'holiday'
            if systemHoliday.HolidayType == 'makeup_workday':
                return 'weekday'

    // 3. 假日星期判定（WeekendDays：0=日～6=六）
    if date.weekday() in setting.WeekendDays:
        return 'holiday'

    // 4. 預設為平日
    return 'weekday'
```

---

### Members - 會員表
**用途**: 管理會員基本資料、等級與狀態

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| MemberId | VARCHAR(20) | 格式化會員編號（M-0000001，觸發器自動生成） |
| Name | VARCHAR(100) | 姓名 |
| Phone | VARCHAR(20) | 電話 |
| Email | VARCHAR(255) | Email（唯一） |
| PasswordHash | VARCHAR(255) | 密碼雜湊 |
| IdNumber | VARCHAR(20) | 身分證字號 |
| Birthday | DATE | 生日 |
| Gender | VARCHAR(10) | 性別 |
| Address | VARCHAR(500) | 地址 |
| Status | VARCHAR(20) | 狀態（待審核/正常/停用） |
| TotalBookings | INT | 總預約次數 |
| TotalSpent | NUMERIC(10,2) | 總消費金額 |
| Note | VARCHAR(500) | 管理員備註 |
| JoinDate | TIMESTAMPTZ | 加入日期 |
| LastLoginAt | TIMESTAMPTZ | 最後登入 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |
| IsDeleted | BOOLEAN | 軟刪除 |
| DeletedAt | TIMESTAMPTZ | 刪除時間 |

---

### Reservations - 預約表
**用途**: 記錄整日租借、時段租借與小時租借預約資訊

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| ReservationId | VARCHAR(20) | 格式化預約編號（R-YYYYMMDD-001，觸發器自動生成） |
| VenueId | INT | 場館 ID（關聯 Venues） |
| MemberId | INT | 會員 ID（關聯 Members） |
| RentalMode | VARCHAR(20) | 租借模式（daily/timeslot/hourly） |
| DayType | VARCHAR(20) | 日期類型（weekday/holiday，成交快照） |
| BookingDate | DATE | 預約日期（單日用） |
| StartDate | DATE | 起始日期（多日用） |
| EndDate | DATE | 結束日期（多日用） |
| RentalDays | INT | 租借天數（daily 模式） |
| TimeSlotCode | VARCHAR(20) | 時段代碼（timeslot 模式：morning/afternoon/evening） |
| StartTime | TIME | 開始時間（hourly/timeslot 模式） |
| EndTime | TIME | 結束時間（hourly/timeslot 模式） |
| TotalHours | NUMERIC(5,2) | 總時數（hourly 模式） |
| UnitPrice | NUMERIC(10,2) | 單價快照（成交時的單價） |
| TotalPrice | NUMERIC(10,2) | 總金額 |
| Deposit | NUMERIC(10,2) | 訂金 |
| PeopleCount | INT | 使用人數 |
| Purpose | VARCHAR(200) | 使用目的 |
| Status | VARCHAR(20) | 狀態（待確認/已確認/使用中/已完成/已取消/已退款） |
| ContactName | VARCHAR(100) | 聯絡人姓名 |
| ContactPhone | VARCHAR(20) | 聯絡電話 |
| ContactEmail | VARCHAR(255) | 聯絡 Email |
| Note | VARCHAR(1000) | 會員備註 |
| AdminNote | VARCHAR(1000) | 管理員備註 |
| CancelReason | VARCHAR(500) | 取消原因 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |
| ConfirmedAt | TIMESTAMPTZ | 確認時間 |
| CheckInAt | TIMESTAMPTZ | 報到時間 |
| CompletedAt | TIMESTAMPTZ | 完成時間 |
| CancelledAt | TIMESTAMPTZ | 取消時間 |

**RentalMode 使用說明**:
| Mode | 必填欄位 | 說明 |
|------|----------|------|
| daily | StartDate, EndDate, RentalDays | 整日租借，以天計價 |
| timeslot | BookingDate, TimeSlotCode, StartTime, EndTime | 時段租借（上午/下午/夜間） |
| hourly | BookingDate, StartTime, EndTime, TotalHours | 小時租借，以小時計價 |

---

### Admins - 系統管理員表
**用途**: 管理後台管理員帳號、角色與權限

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| AdminId | VARCHAR(20) | 格式化管理員編號（A-0000001，觸發器自動生成） |
| Name | VARCHAR(100) | 姓名 |
| Email | VARCHAR(255) | Email（唯一） |
| Phone | VARCHAR(20) | 電話 |
| PasswordHash | VARCHAR(255) | 密碼雜湊 |
| Role | VARCHAR(50) | 角色（超級/營運/客服） |
| Permissions | JSONB | 權限設定（JSON） |
| Department | VARCHAR(100) | 部門 |
| Status | VARCHAR(20) | 狀態（啟用/停用） |
| LastLoginAt | TIMESTAMPTZ | 最後登入 |
| LastLoginIp | VARCHAR(50) | 最後登入 IP |
| LoginCount | INT | 登入次數 |
| Note | VARCHAR(500) | 備註 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |
| CreatedBy | INT | 建立者 ID |
| IsDeleted | BOOLEAN | 軟刪除 |
| DeletedAt | TIMESTAMPTZ | 刪除時間 |

---

### News - 最新消息表
**用途**: 系統公告與最新消息管理

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| Title | VARCHAR(200) | 標題 |
| Summary | VARCHAR(500) | 摘要 |
| Content | TEXT | 內容（HTML） |
| CoverImage | VARCHAR(500) | 封面圖片 |
| Category | VARCHAR(50) | 分類（公告/活動/維護） |
| Tags | JSONB | 標籤（JSON） |
| IsPublished | BOOLEAN | 是否發布 |
| PublishedAt | TIMESTAMPTZ | 發布時間 |
| IsPinned | BOOLEAN | 是否置頂 |
| PinnedUntil | TIMESTAMPTZ | 置頂期限 |
| AuthorId | INT | 作者（管理員 ID） |
| AuthorName | VARCHAR(100) | 作者姓名 |
| ViewCount | INT | 瀏覽次數 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |

---

### SystemSettings - 系統設定表
**用途**: 儲存全域設定、公告與營運參數

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| SettingKey | VARCHAR(100) | 設定鍵（唯一） |
| SettingValue | TEXT | 設定值（當 DataType='json' 時建議使用 JSONB） |
| DataType | VARCHAR(20) | 型別（string/number/boolean/json/date） |
| Category | VARCHAR(50) | 分類 |
| Description | VARCHAR(500) | 說明 |
| IsPublic | BOOLEAN | 是否公開 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |
| UpdatedBy | INT | 更新者（管理員 ID） |

---

## 擴充資料表（未來功能）

### Payments - 付款記錄表
**用途**: 記錄付款交易與發票資訊

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | SERIAL | 主鍵（自動遞增） |
| PaymentId | VARCHAR(20) | 格式化付款編號（P-YYYYMMDD-001，觸發器自動生成） |
| ReservationId | INT | 預約 ID（關聯 Reservations） |
| MemberId | INT | 會員 ID（關聯 Members） |
| Amount | NUMERIC(10,2) | 金額 |
| PaymentType | VARCHAR(20) | 付款類型（deposit/full/refund） |
| PaymentMethod | VARCHAR(50) | 付款方式 |
| Status | VARCHAR(20) | 付款狀態 |
| TransactionId | VARCHAR(100) | 交易編號 |
| PaymentGateway | VARCHAR(50) | 金流服務商 |
| MerchantTradeNo | VARCHAR(100) | 商店交易編號 |
| InvoiceNumber | VARCHAR(50) | 發票號碼 |
| InvoiceDate | TIMESTAMPTZ | 發票日期 |
| Note | VARCHAR(500) | 備註 |
| FailureReason | VARCHAR(500) | 失敗原因 |
| PaidAt | TIMESTAMPTZ | 付款時間 |
| RefundedAt | TIMESTAMPTZ | 退款時間 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| UpdatedAt | TIMESTAMPTZ | 更新時間 |

---

### AuditLogs - 操作記錄表
**用途**: 紀錄重要操作與審計追蹤

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | BIGSERIAL | 主鍵（自動遞增長整數） |
| UserId | INT | 操作者 ID |
| UserType | VARCHAR(20) | 操作者類型（Admin/Member） |
| UserName | VARCHAR(100) | 操作者姓名 |
| Action | VARCHAR(100) | 操作行為 |
| EntityType | VARCHAR(50) | 目標類型 |
| EntityId | INT | 目標 ID |
| EntityName | VARCHAR(200) | 目標名稱 |
| OldValues | JSONB | 變更前（JSON） |
| NewValues | JSONB | 變更後（JSON） |
| Changes | JSONB | 變更摘要（JSON） |
| IpAddress | VARCHAR(50) | IP 位址 |
| UserAgent | VARCHAR(500) | User-Agent |
| RequestUrl | VARCHAR(1000) | 請求 URL |
| RequestMethod | VARCHAR(10) | 請求方法 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |

---

### Notifications - 通知記錄表
**用途**: 記錄發送給會員的通知

| 欄位名稱 | 資料型別 | 說明 |
|---------|---------|------|
| Id | BIGSERIAL | 主鍵（自動遞增長整數） |
| MemberId | INT | 會員 ID（關聯 Members） |
| Type | VARCHAR(50) | 類型 |
| Title | VARCHAR(200) | 標題 |
| Content | VARCHAR(1000) | 內容 |
| RelatedEntityType | VARCHAR(50) | 關聯類型 |
| RelatedEntityId | INT | 關聯 ID |
| SendEmail | BOOLEAN | 是否寄送 Email |
| SendSMS | BOOLEAN | 是否寄送簡訊 |
| SendPush | BOOLEAN | 是否推播 |
| IsRead | BOOLEAN | 是否已讀 |
| ReadAt | TIMESTAMPTZ | 已讀時間 |
| CreatedAt | TIMESTAMPTZ | 建立時間 |
| SentAt | TIMESTAMPTZ | 發送時間 |
