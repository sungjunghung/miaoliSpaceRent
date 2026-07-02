# 場館規則設定與發布 BPMN 規格

## 1. 流程目標

定義後台如何維護場館租借規則並發布，使前台預約行為與費率計算一致生效。

## 2. 起訖條件

- 開始事件：管理員新增或調整場館規則。
- 結束事件：規則發布並於前台生效。

## 2.1 流程圖（泳道）

```mermaid
flowchart LR
  subgraph P1[Pool: 場館規則設定與發布]
    subgraph L1[Lane: 場館管理員]
      A1((開始事件)) --> A2[人工任務: 編輯場館基本資料]
      A2 --> A3[人工任務: 設定租借模式與限制]
      A3 --> A4[人工任務: 設定時段與價格]
      A4 --> A5[人工任務: 設定文件需求與附加規則]
      A6[人工任務: 修正設定]
      A7[人工任務: 儲存並發布]
    end

    subgraph L2[Lane: 系統]
      S1[服務任務: 驗證規則完整性]
      G1{XOR: 是否有缺漏或衝突}
      S2[服務任務: 回傳錯誤清單]
      S3[服務任務: 發布規則]
      S4[服務任務: 更新前台可租借條件]
      S5[服務任務: 更新前台費率與驗證邏輯]
      E1((結束事件: 規則生效))
    end

    subgraph L3[Lane: 前台會員]
      U1[使用者任務: 查看場地可租模式]
      U2[使用者任務: 依新規則進行預約]
    end
  end

  A5 --> S1 --> G1
  G1 -- 是 --> S2 --> A6 --> A7
  A7 --> S1
  G1 -- 否 --> S3 --> S4 --> S5 --> E1
  S5 -. 規則發布通知 .-> U1 --> U2
```

## 3. 泳道角色

1. 場館管理員
2. 系統
3. 前台會員（被動受影響）

## 4. 主流程任務

1. 管理員：編輯場館基本資料。
2. 管理員：設定租借模式、時段、價格、文件需求與限制。
3. 系統：驗證規則完整性與衝突。
4. 管理員：儲存並發布。
5. 系統：更新前台可租借規則與驗證條件。
6. 會員：於前台看到最新可租模式與費率。

## 5. 關鍵閘道

1. 規則是否完整
2. 時段或價格是否衝突
3. 發布是否成功

## 6. 例外與補償

1. 驗證失敗：提示缺漏並回編輯步驟。
2. 發布失敗：保留草稿與錯誤記錄。

## 7. 系統對應

- 後台頁面：
  - src/view/admin/venues/index.vue
  - src/view/admin/venues/edit/basic.vue
  - src/view/admin/venues/edit/rentalRules.vue
  - src/view/admin/venues/edit/rental.vue
- 前台頁面：
  - src/view/portal/Venue/VenueList.vue
  - src/view/portal/Venue/VenueDetail.vue
  - src/view/portal/Venue/VenueBooking.vue
- 規則結構：
  - docs/databaseTableSchema.md

## 8. BPMN 繪圖重點

1. 建議用資料物件標記規則集（模式、費率、時段）。
2. 發布前驗證可建模為服務任務 + 排他閘道。
3. 前台生效可用訊息流表示規則下發。
