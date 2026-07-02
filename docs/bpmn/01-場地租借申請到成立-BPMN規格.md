# 場地租借申請到成立 BPMN 規格

## 1. 流程目標

定義會員從選場地到預約成立的完整流程，涵蓋文件審核、繳費審核與逾期取消分支。

## 2. 起訖條件

- 開始事件：會員在前台送出預約申請。
- 結束事件：
  - 預約成立（confirmed）
  - 逾期取消（cancelled_expired）
  - 文件退件未補（cancelled_rejected）

## 2.1 流程圖（泳道）

```mermaid
flowchart LR
  subgraph P1[Pool: 場地租借申請到成立]
    subgraph L1[Lane: 會員]
      U1((開始事件)) --> U2[使用者任務: 選場地與租借模式]
      U2 --> U3[使用者任務: 填寫申請資料並送出]
      U4[使用者任務: 上傳文件或補件]
      U5[使用者任務: 提交匯款資訊與證明]
    end

    subgraph L2[Lane: 系統]
      S1[服務任務: 建立預約 reserved]
      G1{XOR: 是否需文件審核}
      S2[服務任務: 建立文件上傳期限]
      S3[服務任務: 建立繳費期限]
      G2{XOR: 補件是否逾期}
      S4[服務任務: 狀態更新 cancelled_rejected]
      S5[服務任務: 狀態更新 pending_payment]
      G3{XOR: 繳費是否逾期}
      S6[服務任務: 狀態更新 cancelled_expired]
      S7[服務任務: 狀態更新 confirmed]
      E1((結束事件: 預約成立))
      E2((結束事件: 文件逾期取消))
      E3((結束事件: 繳費逾期取消))
    end

    subgraph L3[Lane: 承辦]
      A1[人工任務: 審核文件]
      G4{XOR: 文件是否通過}
    end

    subgraph L4[Lane: 出納]
      C1[人工任務: 核帳]
      G5{XOR: 核帳是否成功}
    end
  end

  U3 --> S1 --> G1
  G1 -- 是 --> S2 --> U4 --> A1 --> G4
  G4 -- 否 --> G2
  G2 -- 否 --> U4
  G2 -- 是 --> S4 --> E2
  G4 -- 是 --> S5

  G1 -- 否 --> S3
  S5 --> S3 --> U5 --> C1 --> G5
  G5 -- 否 --> G3
  G3 -- 否 --> U5
  G3 -- 是 --> S6 --> E3
  G5 -- 是 --> S7 --> E1
```

## 3. 泳道角色

1. 會員
2. 系統
3. 承辦
4. 出納

## 4. 主流程任務

1. 會員：選擇場地與租借模式，填寫申請資料並送出。
2. 系統：建立預約（reserved），產生文件或繳費期限。
3. 承辦：若需文件，執行文件審核。
4. 系統：文件通過後轉待繳費（pending_payment）。
5. 會員：提交匯款資訊與證明。
6. 出納：核帳並確認款項。
7. 系統：狀態更新為預約成立（confirmed）。

## 5. 關鍵閘道

1. 是否需要文件審核（requireDocuments）
2. 文件是否通過
3. 是否於期限內補件
4. 是否於期限內完成繳費
5. 核帳是否成功

## 6. 例外與補償

1. 文件退件：回到會員補件任務。
2. 補件逾期：系統自動取消（cancelled_rejected）。
3. 繳費逾期：系統自動取消（cancelled_expired）。
4. 核帳失敗：保持待確認或退回會員補件。

## 7. 系統對應

- 路由與頁面：
  - src/view/portal/Venue/VenueBooking.vue
  - src/view/portal/Venue/VenueConfirm.vue
  - src/view/portal/member/MyBookings.vue
  - src/view/portal/member/BookingDetail.vue
- 狀態模型：
  - src/stores/bookings.ts

## 8. BPMN 繪圖重點

1. 使用排他閘道處理文件需求與審核結果。
2. 以中介計時事件表達補件/繳費截止。
3. 取消分支需落到明確結束事件，避免懸空流程。
