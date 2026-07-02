const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'mocks', 'bookings.json');
const rawData = fs.readFileSync(targetPath, 'utf8');
const bookings = JSON.parse(rawData);

const normalized = bookings.map(b => {
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
    applicant: b.applicant || "未提供",
    purpose: b.purpose || "無",
    status: b.status || "reserved",
    cancelDeadline: b.cancelDeadline || null,
    createdAt: b.createdAt,
    peopleCount: b.peopleCount || (b.venueId === 1 ? 50 : 10),
    deposit: b.deposit || 2000,
    additionalFees: b.additionalFees || [],
    remittance: b.remittance || null,
    note: b.note || null,
    adminNote: b.adminNote || null,
    cancelReason: b.cancelReason || null,
    documentRejectReason: b.documentRejectReason || null,
    documentUploadDeadline: b.documentUploadDeadline || null,
    receiptUploadDeadline: b.receiptUploadDeadline || null,
    documents: b.documents || [
      { key: "application_form", label: "租借申請書",         required: true,  uploaded: false },
      { key: "id_copy",          label: "申請人身分證影本",   required: true,  uploaded: false },
      { key: "org_certificate",  label: "立案證明／法人登記", required: false, uploaded: false },
      { key: "activity_plan",    label: "活動企劃書",         required: false, uploaded: false },
      { key: "insurance",        label: "公共意外責任險",     required: false, uploaded: false },
      { key: "agreement",        label: "場地使用同意書",     required: true,  uploaded: false },
      { key: "payment_proof",    label: "費用繳款證明",       required: true,  uploaded: false },
      { key: "safety_plan",      label: "安全維護計畫",       required: false, uploaded: false }
    ]
  };
});

// 若是 confirmed 狀態且過去缺乏 mock 紀錄，自動將 document 與 remittance 上傳狀態補齊
normalized.forEach(b => {
    if (b.status === 'confirmed' || b.status === 'payment_review') {
        b.documents.forEach(d => {
            if (d.required && !d.uploaded) {
                d.uploaded = true;
                d.fileName = d.fileName || `${d.key}_${b.applicant}.pdf`;
                d.uploadedAt = d.uploadedAt || b.createdAt;
            }
        });
    }

    if (b.status === 'confirmed' && !b.remittance) {
        b.remittance = {
            last5: String(Math.floor(10000 + Math.random() * 90000)),
            amount: 2000,
            datetime: `${b.createdAt}T10:00`,
            senderName: b.applicant,
            note: "系統自動預設核帳紀錄",
            receiptImage: null
        };
    }
});

fs.writeFileSync(targetPath, JSON.stringify(normalized, null, 2));
console.log('Successfully normalized ' + normalized.length + ' bookings!');
