# 03 — 前端對齊清單(逐檔改動)

> 前端要向 [00 canonical 模型](00-canonical-data-model.md) 靠齊的具體改動。分兩波:**W1 命名/型別對齊**(可先做、不需後端)、**W2 mock→API 切換**(需後端 B 批就緒)。

## W1 — 命名與型別對齊(不依賴後端)

### 1. `session` → `timeslot` 全面更名
runtime 側仍用 `session`,venue-edit 側已用 `timeslot`,需統一為 `timeslot`。

| 檔案 | 改動 |
|---|---|
| [stores/bookings.ts](../../frontend/src/stores/bookings.ts) | `rentalMode: 'daily' \| 'session' \| 'hourly'` → `'timeslot'`;`calcBaseFee` 內 `b.rentalMode === 'session'` 與 `venue.rentalModes.session` 一併改;`session` 欄位改 `timeSlotCode` |
| [mocks/venues.json](../../frontend/src/mocks/venues.json) | `rentalModes.session` → `rentalModes.timeslot`、`pricing.session` → `pricing.timeslot`、`sessions[]` 概念保留於 timeslot |
| [mocks/generateBookings.ts](../../frontend/src/mocks/generateBookings.ts) | 產生的 `rentalMode:'session'`、`session:` 欄位更名 |
| [composables/useBookingStatus.ts](../../frontend/src/composables/useBookingStatus.ts) / [useBookingFormat.ts](../../frontend/src/composables/useBookingFormat.ts) | 若判斷 `session` 字面值處一併改 |
| 各使用 `rentalMode==='session'` 的 view/component | 全域搜尋替換 |

> 建議以全域 grep `'session'` 逐一確認(注意別誤改與「時段」無關的字串)。

### 2. `userId` → `memberId`
| 檔案 | 改動 |
|---|---|
| [stores/bookings.ts](../../frontend/src/stores/bookings.ts) | `Booking.userId?` → `memberCode`;`getByUserId` → `getByMemberCode` |
| [stores/auth.ts](../../frontend/src/stores/auth.ts) | `User.id`(`user-003`)→ `code`(`M-0000003`);登入回傳對映 |
| [mocks/users.json](../../frontend/src/mocks/users.json) / [bookings.json](../../frontend/src/mocks/bookings.json) | id/userId 值改 `M-000000x` 格式 |
| [stores/refunds.ts](../../frontend/src/stores/refunds.ts) | `getByMemberId` 參數改用 code |

### 3. 預約欄位更名對齊契約
`date → bookingDate`(展示層可保留 alias);確認 status 值已是 canonical 11 態(前端本已相符,DB 端對齊即可)。

### 4. ID 格式統一為業務碼
所有 mock 的字串 ID 改為 canonical 業務碼:`user-003→M-0000003`、`admin-001→A-0000001`、`role-001→role-001`(權限群組碼保留)、`RF-2026-xxxx`(已相符)。

### 5. 移除 booking 內嵌 refund 的重複來源
目前 refund 同時存在於 [bookings.json](../../frontend/src/mocks/bookings.json) 內嵌 `refund` **與** [refunds.json](../../frontend/src/mocks/refunds.json)。canonical 以獨立 Refunds 為準。
- [stores/bookings.ts](../../frontend/src/stores/bookings.ts) 的 `RefundInfo` 與 booking `refund` 組裝(L189-200)改為:預約詳情從 refunds store 依 `bookingCode` 帶入,不再於 booking mock 內嵌。
- 統一退款狀態型別:bookings.ts 的 `RefundStatus`(4 態)與 refunds.ts 的(5 態,含 `rejected`)**合併為 refunds.ts 版本**。

### 6. 租借規則改「每模式獨立」+ 分頁整併(設計決策)
`advanceBookingDays / latestBookingDays / cancellationDeadlineDays / receiptUploadDeadlineDays / documentUploadDeadlineDays` 由**場館層級**改為 **per-mode**(存於各 `rentalModes[mode]`)。押金與場佈/撤場其實已 per-mode(見 [RentalModeCollapse.vue](../../frontend/src/view/admin/venues/edit/RentalModeCollapse.vue))。

**分頁重分工(採方案 A;已實作)**——租借相關全部集中到單一「租借方式」分頁,移除獨立的共用分頁:

| 分頁 | 動作 | 內容 |
|---|---|---|
| **「租借方式」**(原「方案與價格」) | 承接全部 per-mode + 頂部共用假日 | 頂部一張**假日定義**卡(場館共用);其下三個模式 collapse,每個含 價格 / 保證金 / 場佈撤場 / **申請與期限** / **需檢附文件(含各自範本)** |
| ~~「租借規則」/「共用設定」~~ | **移除** | [rentalRules.vue](../../frontend/src/view/admin/venues/edit/) 已刪除,route 與 tab 一併移除 |

具體改動(已完成):
- **型別搬移**:5 個窗口/期限欄位 + `requireDocuments/requiredDocuments` 由 `Venue` 移到 `RentalModeBase`(定義於 [RentalModeCollapse.vue](../../frontend/src/view/admin/venues/edit/RentalModeCollapse.vue) 與 [rental.vue](../../frontend/src/view/admin/venues/edit/rental.vue))。
- **需檢附文件 per-mode**:文件清單與範本上傳移入各模式 collapse,綁 `mode.requiredDocuments`,每模式各自維護(對映 canonical 的 `VenueRequiredDocuments(venueId, mode, templateKey, templateFile)`)。**`appliesTo` 移除**(以 `mode` 表達適用範圍)。
- **假日定義**:移到「租借方式」分頁頂部(場館層級),各模式的假日價欄以 computed `weekendPricingEnabled` 決定顯示。
- **分頁/路由移除**:[edit.vue](../../frontend/src/view/admin/venues/edit.vue) 移除 tab、[router/index.ts](../../frontend/src/router/index.ts) 移除 `admin-venue-edit-rental-rules` route、[adminLayout.vue](../../frontend/src/layout/adminLayout.vue) 移除對應 TITLES/breadcrumb/entityName。
- **假日 per-mode 冗餘已清除**:原 `watchEffect` 把 `weekendDays/weekendIncludeHolidays` 複寫到各模式的邏輯移除,改場館一份。

### 7. 取消期限單位 ⚠(待業主確認後才動)
canonical 暫定 `cancelBeforeDays`(天,與現行 UI 一致,per-mode)。若業主改採「小時」再更名 `cancelBeforeHours` 並改 UI 文案。**先擱置,確認後再改**。

## W2 — mock → API 切換(依賴後端 B 批)

原則:各 store 從 `import mockXxx from '@/mocks/...'` 改為呼叫 API;新增 `src/api/` 薄層封裝 `fetch`。切換順序對齊 [04 roadmap](04-implementation-roadmap.md) 的 B 批。

| 前端 store / 資料 | 改接端點 | 依賴後端批次 |
|---|---|---|
| [stores/auth.ts](../../frontend/src/stores/auth.ts) | `/api/auth/*`、`/api/members/me` | B2 |
| venues(bookings.ts 內 `mockVenues`、[venue-edit/adapter.ts](../../frontend/src/mocks/venue-edit/adapter.ts)) | `/api/venues*` | B2 |
| [stores/bookings.ts](../../frontend/src/stores/bookings.ts) | `/api/reservations*` | B3 |
| [stores/refunds.ts](../../frontend/src/stores/refunds.ts) | `/api/refunds*`、取消流程 | B4 |
| news / faq / calendarNotes / admins / permissionGroups mock | 對應 `/api/*` | B5 |

> `adapter.ts` 目前把正規化 mock 組回 `VenueEditFormData`;切換後改為「呼叫 API 拿 VenueDetailDto → 組 form」,其欄位結構已與 canonical 一致,轉換邏輯可大量沿用。

## 驗收(前端側)
- W1 完成後:`vue-tsc -b` 型別檢查通過,`session` 字面值在租借語境下歸零,mock 全數使用業務碼。
- W2 各批完成後:對應頁面在真 API 下功能等同 mock 版(逐頁 e2e:場館列表/詳情、我的預約、退款簽核、後台場館編輯)。
