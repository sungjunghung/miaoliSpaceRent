# 預留保證金退款 BPMN 規格

## 1. 流程目標

定義會員從帳戶頁申請退還留存保證金，到後台多角色簽核與撥款完成之流程。

## 2. 起訖條件

- 開始事件：會員於帳戶頁提交保證金退款申請。
- 結束事件：
  - 退款完成（completed）
  - 退款駁回（rejected）

## 2.1 流程圖（泳道）

```mermaid
flowchart LR
  subgraph P1[Pool: 預留保證金退款]
    subgraph L1[Lane: 會員]
      U1((開始事件)) --> U2[使用者任務: 填寫金額、原因、銀行帳戶]
      U2 --> U3[使用者任務: 提交保證金退款申請]
    end

    subgraph L2[Lane: 系統]
      S0[服務任務: 接收退款申請]
      G1{XOR: 申請資料完整且金額合法}
      S1[服務任務: 建立退款案件 type=retained_deposit status=admin_review]
      S2[服務任務: 更新 status=accounting_review]
      S3[服務任務: 更新 status=cashier_processing]
      S4[服務任務: 更新 status=completed]
      S5[服務任務: 更新 status=rejected]
      S6[服務任務: 通知會員補正資料]
      E1((結束事件: 退款完成))
      E2((結束事件: 退款駁回))
    end

    subgraph L3[Lane: 承辦]
      A1[人工任務: 核定退款金額]
      G2{XOR: 承辦是否核准}
    end

    subgraph L4[Lane: 會計]
      C1[人工任務: 會計核定]
      G3{XOR: 會計是否核准}
    end

    subgraph L5[Lane: 出納]
      K1[人工任務: 執行撥款]
      G4{XOR: 撥款是否成功}
      K2[人工任務: 保留待辦並重試]
    end
  end

  U3 --> S0 --> G1
  G1 -- 否 --> S6 --> U2
  G1 -- 是 --> S1 --> A1 --> G2
  G2 -- 否 --> S5 --> E2
  G2 -- 是 --> S2 --> C1 --> G3
  G3 -- 否 --> S5 --> E2
  G3 -- 是 --> S3 --> K1 --> G4
  G4 -- 否 --> K2 --> K1
  G4 -- 是 --> S4 --> E1
```

## 3. 泳道角色

1. 會員
2. 系統
3. 承辦
4. 會計
5. 出納

## 4. 主流程任務

1. 會員：填寫申請金額、退款原因與銀行帳戶。
2. 系統：建立退款案件（retained_deposit / admin_review）。
3. 承辦：核定退款金額。
4. 系統：轉 accounting_review。
5. 會計：核定並送出納。
6. 系統：轉 cashier_processing。
7. 出納：執行撥款。
8. 系統：更新 completed，會員可於退款頁查看。

## 5. 關鍵閘道

1. 申請金額是否超過留存保證金
2. 退款資料是否完整
3. 承辦是否核准
4. 會計是否核准

## 6. 例外與補償

1. 資料不完整：退回會員補正。
2. 承辦或會計駁回：狀態 rejected 並通知會員。
3. 撥款失敗：保留 cashier_processing 待重試。

## 7. 系統對應

- 前台：
  - src/view/portal/member/MyProfile.vue
  - src/view/portal/member/MyRefunds.vue
- 後台：
  - src/view/admin/refunds.vue
- 資料模型：
  - src/stores/refunds.ts

## 8. BPMN 繪圖重點

1. 此流程與訂單取消退款分開建模，不要合併。
2. 用訊息事件表示會員收到進度通知。
3. 金額核定任務建議加資料物件（申請金額、核定金額）。
