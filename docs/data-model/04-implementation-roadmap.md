# 04 — 實作藍圖(分批)

> 規格([00](00-canonical-data-model.md)/[01](01-schema-revision.md)/[02](02-api-contract.md)/[03](03-frontend-alignment-delta.md))核准後的程式碼實作順序。每批獨立可驗收。後端為 .NET 10 四層架構([backend/src/](../../backend/src/)),前端 Vue 3 + Pinia。

## 前置決策(開工前敲定)
1. **ORM/遷移**:EF Core Code-First + migrations(建議)。實體置於 `MiaoliSpaceRent.Domain`,`DbContext` 與設定置於 `MiaoliSpaceRent.Infrastructure`(填目前 [DependencyInjection.cs](../../backend/src/MiaoliSpaceRent.Infrastructure/DependencyInjection.cs) 的 `TODO`)。
2. **PostgreSQL 驅動**:`Npgsql.EntityFrameworkCore.PostgreSQL`。連線字串置於 appsettings / user-secrets。
3. **驗證機制**:會員與管理員分離的 JWT(或 cookie session)—— 需拍板;影響 B2 起所有受保護端點。
4. **命名轉換位置**:集中在 **後端 DTO 層**(Application 的 mapping)與 **前端 api 薄層**,Domain/DB 維持 canonical PascalCase。

## 批次

### B1 — 資料層落地
- 依 [01](01-schema-revision.md) 建立所有 Domain 實體 + EF 設定,產生初始 migration,套用到本機 PostgreSQL。
- 建立格式化業務碼、`UpdatedAt`、預約衝突等觸發器(以 migration raw SQL 或 DB 初始化腳本)。
- **驗收**:`dotnet ef database update` 成功;30 張表與約束/觸發器齊備;種一批 seed(可由現有 mock JSON 轉入)。

### B2 — 核心讀取 API + 驗證
- 端點:`/api/venues*`(含詳情組裝)、`/api/auth/*`、`/api/members/me`、`/api/admin/members`。
- 填 Application 用例服務、Infrastructure 儲存庫;`AddApplication()/AddInfrastructure()` 實裝。
- **驗收**:`dotnet build` 0 error;`/api/venues/{code}` 回傳結構符合 [02 VenueDetailDto](02-api-contract.md#場地-venues);登入取得 token。前端 W1 完成後可先接 auth/venues。

### B3 — 租借主流程寫入(BPMN 01/05/06)
- `/api/reservations` 建立(後端算 dayType/價格/押金快照)、文件上傳與審核、匯款回報與核帳、完成。
- 狀態機轉移驗證(11 態,拒絕非法轉移)。
- **驗收**:一筆預約可從 `reserved` 走到 `confirmed`→`completed`;文件退件/核帳退回路徑正確;端點實測 + 前端「我的預約」改接。

### B4 — 取消退款(BPMN 02/03)
- 取消申請 → 承辦核准自動建 Refund;退款三階段簽核 + 駁回;預留保證金退款入口。
- **驗收**:退款 5 態轉移閉合;`booking_cancellation` 與 `retained_deposit` 兩來源皆可結案;前端 refunds 簽核頁改接。

### B5 — 後台內容與權限
- 場館建立/編輯(拆寫各正規化子表)、權限群組、管理員、News/FAQ/CalendarNotes、系統設定。
- 權限鍵檢查中介軟體(對照 PermissionGroups.permissions)。
- 遷移完成後移除 `Admins.Permissions JSONB` 過渡欄。
- **驗收**:venue-edit 完整 form 存檔後,重讀組裝結果一致;權限控制生效。

### B6 — 前端全面切換
- 依 [03 W2](03-frontend-alignment-delta.md#w2--mock--api-切換依賴後端-b-批) 逐 store 移除 mock、接真 API;建立 `src/api/` 薄層。
- **驗收**:全站在真 API 下 e2e 通過;`src/mocks/` 僅保留測試用途或刪除。

## 相依關係
```
B1 ─→ B2 ─→ B3 ─→ B4
        └─→ B5
B2/B3/B4/B5 各自就緒後 → B6 對應頁切換(可漸進)
前端 W1(命名對齊)可與 B1/B2 並行,不需等待後端
```

## 全域驗收(完工定義)
1. [03 驗收](03-frontend-alignment-delta.md#驗收前端側) 全過。
2. 六份 [BPMN](../bpmn/) 流程皆有可運作的 API 路徑。
3. `src/mocks/` 不再是 runtime 資料來源。
4. 後端 `dotnet build` / EF migration / 端點實測綠燈;關鍵用例有單元/整合測試(於 `backend/tests/`,B1 一併建立測試專案)。
