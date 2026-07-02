# 訂單取消與退款 BPMN 規格

## 1. 流程目標

定義已成立訂單之取消申請、審核與退款銜接流程。

## 2. 起訖條件

- 開始事件：會員提出取消申請。
- 結束事件：
  - 取消核准且退款完成
  - 取消核准且不退款結案
  - 取消不核准（維持原訂單）

## 2.1 流程圖（泳道）

```mermaid
flowchart LR
  subgraph P1[Pool: 訂單取消與退款]
    subgraph L1[Lane: 會員]
      U1((開始事件)) --> U2[使用者任務: 提交取消申請與原因]
    end

    subgraph L2[Lane: 系統]
      S1[服務任務: 更新訂單狀態 cancellation_requested]
      G1{XOR: 是否符合取消期限}
      S2[服務任務: 通知不符合取消條件]
      S3[服務任務: 訂單維持原狀態]
      S4[服務任務: 訂單更新為 cancelled]
      G2{XOR: 是否需要退款}
      S5[服務任務: 建立退款案件 type=booking_cancellation]
      S6[服務任務: 退款狀態更新 completed]
      S7[服務任務: 通知會員取消結果]
      E1((結束事件: 取消核准且不退款))
      E2((結束事件: 取消不核准))
      E3((結束事件: 退款完成))
      E4((結束事件: 退款駁回))
    end

    subgraph L3[Lane: 承辦]
      A1[人工任務: 審核取消申請]
      G3{XOR: 取消申請是否核准}
      A2[人工任務: 核定退款金額]
      G4{XOR: 承辦是否核准退款}
    end

    subgraph L4[Lane: 會計]
      C1[人工任務: 會計審核退款]
      G5{XOR: 會計是否核准退款}
    end

    subgraph L5[Lane: 出納]
      K1[人工任務: 執行撥款]
      G6{XOR: 撥款是否成功}
      K2[人工任務: 保留待辦並重試]
    end
  end

  U2 --> S1 --> G1
  G1 -- 否 --> S2 --> S3 --> S7 --> E2
  G1 -- 是 --> A1 --> G3

  G3 -- 否 --> S3 --> S7 --> E2
  G3 -- 是 --> S4 --> G2

  G2 -- 否 --> S7 --> E1
  G2 -- 是 --> S5 --> A2 --> G4

  G4 -- 否 --> E4
  G4 -- 是 --> C1 --> G5

  G5 -- 否 --> S7 --> E4
  G5 -- 是 --> K1 --> G6

  G6 -- 否 --> K2 --> K1
  G6 -- 是 --> S6 --> S7 --> E3
```

## 3. 泳道角色

1. 會員
2. 系統
3. 承辦
4. 會計
5. 出納

## 4. 主流程任務

1. 會員：提交取消原因。
2. 系統：更新為 cancellation_requested。
3. 承辦：審核取消申請。
4. 系統：若核准則訂單更新為 cancelled，並建立退款案件（booking_cancellation）。
5. 承辦：核定退款金額並送會計。
6. 會計：核定後送出納。
7. 出納：完成撥款。
8. 系統：退款狀態更新 completed。

## 5. 關鍵閘道

1. 是否符合取消期限
2. 取消申請是否核准
3. 是否需要退款
4. 承辦是否核准退款
5. 會計是否核准退款

## 6. 例外與補償

1. 取消不核准：通知會員，訂單回原狀態。
2. 退款駁回：退款狀態為 rejected，流程結案。
3. 撥款失敗：回到出納處理任務並保留待辦。

## 7. 系統對應

- 前台：
  - src/view/portal/member/BookingDetail.vue
- 後台：
  - src/view/admin/refunds.vue
  - src/view/admin/bookings/components/RefundProcessingBlock.vue
- 資料模型：
  - src/stores/bookings.ts
  - src/stores/refunds.ts

## 8. BPMN 繪圖重點

1. 將「取消審核」與「退款簽核」拆成兩段任務鏈。
2. 退款簽核建議以子流程表示（承辦→會計→出納）。
3. 明確標示 rejected 結束事件。
