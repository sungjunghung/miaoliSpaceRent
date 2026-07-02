# 文件審核與補件 BPMN 規格

## 1. 流程目標

定義需要文件的預約案件，如何進行上傳、退件、補件與通過，並銜接到繳費階段。

## 2. 起訖條件

- 開始事件：預約建立後且 requireDocuments = true。
- 結束事件：
  - 文件審核通過（進入 pending_payment）
  - 文件逾期取消（cancelled_rejected）

## 2.1 流程圖（泳道）

```mermaid
flowchart LR
  subgraph POOL["Pool：文件審核與補件"]
    direction TB

    subgraph LANE_M["Lane：會員"]
      direction LR
      U2["使用者任務<br/>上傳必要文件"]
      U3["使用者任務<br/>補件後重新上傳"]
    end

    subgraph LANE_O["Lane：承辦"]
      direction LR
      A1["人工任務<br/>審核文件內容"]
      G2{"XOR 閘道<br/>是否符合要求"}
      A2["人工任務<br/>退件並填寫原因"]
    end

    subgraph LANE_S["Lane：系統"]
      direction LR
      E0(["開始事件<br/>requireDocuments=true"])
      S1["服務任務<br/>建立文件清單與上傳期限"]
      S2["服務任務<br/>進入 document_review"]
      EG{{"事件閘道<br/>等待補件 / 逾期"}}
      T1(("計時中介事件<br/>補件截止"))
      S3["服務任務<br/>更新 cancelled_rejected"]
      S4["服務任務<br/>更新 pending_payment"]
      E1(("結束事件<br/>文件通過"))
      E2(("結束事件<br/>文件逾期取消"))
    end
  end

  E0 --> S1 --> U2 --> S2 --> A1 --> G2
  G2 -- 符合 --> S4 --> E1
  G2 -- 不符合 --> A2 --> EG
  EG -- 會員上傳 --> U3 --> S2
  EG -- 逾期觸發 --> T1 --> S3 --> E2
```

## 3. 泳道角色

1. 會員
2. 系統
3. 承辦

## 4. 主流程任務

1. 系統：建立文件清單與上傳期限。
2. 會員：上傳必要文件。
3. 承辦：審核文件。
4. 系統：通過則進入待繳費。

## 5. 關鍵閘道

1. 文件是否齊全
2. 文件是否符合要求
3. 是否在補件期限內

## 6. 例外與補償

1. 文件不符：標記 documents_rejected 並附退件原因。
2. 會員補件：回到審核任務。
3. 補件逾期：系統自動 cancelled_rejected。

## 7. 系統對應

- 前台：
  - src/view/portal/member/BookingDetail.vue
- 後台：
  - src/view/admin/bookings/components/DocumentReviewBlock.vue
- 狀態模型：
  - src/stores/bookings.ts

## 8. BPMN 繪圖重點

1. 文件審核建議畫成循環子流程（審核 -> 退件 -> 補件）。
2. 補件期限務必用計時中介事件標示。
3. 退件原因可作為資料物件掛於退件任務。
