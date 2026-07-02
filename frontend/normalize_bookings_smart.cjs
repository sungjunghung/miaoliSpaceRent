const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'mocks', 'bookings.json');
const rawData = fs.readFileSync(targetPath, 'utf8');
const bookings = JSON.parse(rawData);

const cancelReasons = [
  "因不可抗力因素（颱風）主動取消",
  "主辦方行程變更，無法如期舉辦",
  "參與人數不足，決定停辦",
  "與主辦單位其他競賽時間衝突",
  "逾期未繳清保證金與租金",
  "文件屢次被退，超過最後補件期限"
];

const documentRejectReasons = [
  "立案證明已過期，請提供當年度最新版本",
  "活動企劃書缺少『安全維護』與『緊急疏散』章節，請重新補充",
  "租借申請書漏蓋負責人印章，請列印蓋章後掃描上傳",
  "身分證影本過於模糊，請重新拍攝",
  "公共意外責任險保單日期不涵蓋租借當日，請修正"
];

const additionalFeeTypes = [
  { label: "空調費", unit: "4 小時", amount: 4800 },
  { label: "夜間照明費", unit: "1 次", amount: 1500 },
  { label: "清潔費", unit: "1 次", amount: 1000 },
  { label: "器材租借費", unit: "1 批", amount: 500 },
  { label: "感應磁卡費", unit: "2 張", amount: 400 }
];

const adminNotes = [
  "已透過電話聯繫確認場地需求",
  "申請人表示可能會提早半小時來佈置，已通知管理員",
  "此筆為特急件，請盡快審核款項",
  "已提醒需自備延長線與垃圾袋",
  "已核發許可證，請民眾於入場時出示"
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const normalized = bookings.map(b => {
  // 基本狀態判斷
  const isCancelled = b.status?.startsWith('cancel');
  const isRejected = b.status === 'documents_rejected';
  
  const createdDate = new Date(b.createdAt);
  
  // 隨機假資料費用
  const deposit = b.deposit || (b.venueId === 1 ? 5000 : 2000);
  
  // 決定此訂單是否有隨機加收費用 (30%有)
  let hasAdditional = Math.random() > 0.7;
  let fees = b.additionalFees && b.additionalFees.length > 0 ? b.additionalFees : [];
  if (hasAdditional && fees.length === 0) {
      fees.push(getRandomItem(additionalFeeTypes));
      if (Math.random() > 0.8) fees.push(getRandomItem(additionalFeeTypes)); // 雙重費用
  }
  
  // 隨機退件原因
  let rejectReason = b.documentRejectReason || null;
  if (!rejectReason && isRejected) rejectReason = getRandomItem(documentRejectReasons);

  // 隨機取消原因
  let cancelReason = b.cancelReason || null;
  if (!cancelReason && isCancelled) cancelReason = getRandomItem(cancelReasons);

  // 隨機管理員備註 (15%機率有)
  let adminNote = b.adminNote || null;
  if (!adminNote && Math.random() > 0.85) adminNote = getRandomItem(adminNotes);

  // 隨機匯款紀錄 (針對已預訂且待審核的案件)
  let remittance = b.remittance || null;
  if (!remittance && (b.status === 'confirmed' || b.status === 'payment_review')) {
      const remitDate = new Date(createdDate);
      remitDate.setDate(remitDate.getDate() + Math.floor(Math.random() * 3) + 1);
      
      remittance = {
          last5: String(Math.floor(10000 + Math.random() * 90000)),
          amount: Math.round((deposit + (fees[0]?.amount || 0)) * (Math.random() > 0.5 ? 1 : 1.2)),
          datetime: remitDate.toISOString().slice(0, 16),
          senderName: b.applicant || "民眾",
          note: Math.random() > 0.7 ? "分次匯入" : "",
          receiptImage: Math.random() > 0.5 ? `receipt_${Date.now()}.png` : null
      };
  }

  // 隨機生成文件清單多樣性
  let documents = b.documents;
  if (!documents || documents.length === 0) {
      documents = [
        { key: "application_form", label: "租借申請書",         required: true,  uploaded: false },
        { key: "id_copy",          label: "申請人身分證影本",   required: true,  uploaded: false },
        { key: "org_certificate",  label: "立案證明／法人登記", required: false, uploaded: false },
        { key: "activity_plan",    label: "活動企劃書",         required: false, uploaded: false },
        { key: "insurance",        label: "公共意外責任險",     required: false, uploaded: false },
        { key: "agreement",        label: "場地使用同意書",     required: true,  uploaded: false },
        { key: "payment_proof",    label: "費用繳款證明",       required: true,  uploaded: false },
        { key: "safety_plan",      label: "安全維護計畫",       required: false, uploaded: false }
      ];
      
      if (b.status === 'confirmed' || b.status === 'payment_review' || b.status === 'document_review') {
         documents.forEach(d => {
             if (d.required) d.uploaded = true;
             // 非必填 30% 機率傳
             if (!d.required && Math.random() > 0.7) d.uploaded = true;
             
             if (d.uploaded) {
                 d.fileName = `${d.key}_${Math.floor(Math.random()*1000)}.pdf`;
                 const uploadDate = new Date(createdDate);
                 uploadDate.setDate(uploadDate.getDate() + 1);
                 d.uploadedAt = uploadDate.toISOString().slice(0, 10);
             }
         });
      }
      
      // 若被退件，必扣除 1~2 份必填文件使其變成未上傳
      if (b.status === 'documents_rejected') {
          let reqDocs = documents.filter(d => d.required);
          if (reqDocs.length > 0) reqDocs[Math.floor(Math.random() * reqDocs.length)].uploaded = false;
      }
  }

  return {
    id: b.id,
    userId: b.userId || null,
    venueId: b.venueId,
    rentalMode: b.rentalMode,
    date: b.date,
    startDate: b.startDate || null,
    endDate: b.endDate || null,
    session: b.session || null,
    startTime: b.startTime || null,
    endTime: b.endTime || null,
    applicant: b.applicant || "社團法人測試單位",
    purpose: b.purpose || "例行性活動",
    status: b.status || "reserved",
    cancelDeadline: b.cancelDeadline || null,
    createdAt: b.createdAt,
    peopleCount: b.peopleCount || Math.floor(Math.random() * 50) + 10,
    deposit: deposit,
    additionalFees: fees,
    remittance: remittance,
    note: b.note || null,
    adminNote: adminNote,
    cancelReason: cancelReason,
    documentRejectReason: rejectReason,
    documentUploadDeadline: b.documentUploadDeadline || null,
    receiptUploadDeadline: b.receiptUploadDeadline || null,
    documents: documents
  };
});

fs.writeFileSync(targetPath, JSON.stringify(normalized, null, 2));
console.log('Successfully generated DIVERSE data for ' + normalized.length + ' bookings!');
