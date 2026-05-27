export const SCHOOL_NAME = "Trường THPT Võ Văn Kiệt";
export const SCHOOL_YEAR = "2026 - 2027";

export const SUBJECT_OPTIONS = [
  { optionNumber: 1, subjects: "Vật lí; Hoá học; Tin học; Công nghệ Công nghiệp" },
  { optionNumber: 2, subjects: "Vật lí; Hoá học; Tin học; Âm nhạc" },
  { optionNumber: 3, subjects: "Hoá học; Sinh học; Tin học; Âm nhạc" },
  { optionNumber: 4, subjects: "Hoá học; Sinh học; Tin học; Địa lí" },
  { optionNumber: 5, subjects: "GDKT&PL; Âm nhạc; Tin học; Địa lí" },
  { optionNumber: 6, subjects: "GDKT&PL; Mĩ thuật; Tin học; Địa lí" },
] as const;

export const PRIORITY_LABELS: Record<string, string> = {
  CON_THUONG_BINH_LIET_SI: "Con thương binh/liệt sĩ",
  DAN_TOC_THIEU_SO: "Dân tộc thiểu số Khmer, Hoa, ...",
  CHA_ME_DAN_TOC_THIEU_SO: "Có cha hoặc mẹ là người dân tộc thiểu số",
  VUNG_DAC_BIET_KHO_KHAN:
    "Học sinh ở vùng có điều kiện kinh tế - xã hội đặc biệt khó khăn: ấp Vĩnh Lộc, ấp Vĩnh Phú B, ấp Long Đức",
  HO_NGHEO: "Hộ nghèo",
  HO_CAN_NGHEO: "Hộ cận nghèo",
  MO_COI_CHA_HOAC_ME: "Mồ côi cha hoặc mẹ",
  MO_COI_CHA_LAN_ME: "Mồ côi cha lẫn mẹ",
};

export const PRIZE_LABELS: Record<string, string> = {
  GIAI_NHAT: "Giải nhất",
  GIAI_NHI: "Giải nhì",
  GIAI_BA: "Giải ba",
};

export const PRIZE_SCORES: Record<string, number> = {
  GIAI_NHAT: 1.5,
  GIAI_NHI: 1.0,
  GIAI_BA: 0.5,
};

export const FILE_TYPE_LABELS: Record<string, string> = {
  PHOTO_4X6: "Ảnh 4x6",
  HOC_BA_THCS: "Học bạ THCS bản PDF",
  HOC_BA_LOP_6: "Ảnh học bạ lớp 6",
  HOC_BA_LOP_7: "Ảnh học bạ lớp 7",
  HOC_BA_LOP_8: "Ảnh học bạ lớp 8",
  HOC_BA_LOP_9: "Ảnh học bạ lớp 9",
  GIAY_KHAI_SINH: "Giấy khai sinh",
  CCCD: "CCCD/Số định danh",
  MINH_CHUNG_UU_TIEN: "Minh chứng ưu tiên/đối tượng khác",
  MINH_CHUNG_KHUYEN_KHICH: "Minh chứng khuyến khích",
  HO_NGHEO_CAN_NGHEO: "Giấy xác nhận hộ nghèo/cận nghèo",
  GIAY_TO_KHAC: "Giấy tờ khác",
};

export const STATUS_LABELS: Record<string, string> = {
  CHO_KIEM_TRA: "Chờ kiểm tra",
  DANG_XU_LY: "Đang xử lý",
  CAN_BO_SUNG: "Cần bổ sung",
  DA_TIEP_NHAN: "Đã tiếp nhận",
  HOP_LE: "Hợp lệ",
  KHONG_HOP_LE: "Không hợp lệ",
  DA_DUYET_XET_TUYEN: "Đã duyệt xét tuyển",
};

export const FILE_STATUS_LABELS: Record<string, string> = {
  CHUA_KIEM_TRA: "Chưa kiểm tra",
  HOP_LE: "Hợp lệ",
  KHONG_HOP_LE: "Không hợp lệ",
  CAN_BO_SUNG: "Cần bổ sung",
};

export const GENDER_LABELS: Record<string, string> = {
  NAM: "Nam",
  NU: "Nữ",
  KHAC: "Khác",
};

export const ACADEMIC_LEVEL_LABELS: Record<string, string> = {
  TOT: "Tốt",
  KHA: "Khá",
  DAT: "Đạt",
  CHUA_DAT: "Chưa đạt",
};

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export const FILE_SIZE_LIMITS_MB: Record<string, number> = {
  PHOTO_4X6: 5,
  HOC_BA_THCS: 25,
  HOC_BA_LOP_6: 10,
  HOC_BA_LOP_7: 10,
  HOC_BA_LOP_8: 10,
  HOC_BA_LOP_9: 10,
  GIAY_KHAI_SINH: 10,
  CCCD: 10,
  MINH_CHUNG_UU_TIEN: 10,
  MINH_CHUNG_KHUYEN_KHICH: 10,
  HO_NGHEO_CAN_NGHEO: 10,
  GIAY_TO_KHAC: 10,
};

export const ALL_FILE_TYPES = Object.keys(FILE_TYPE_LABELS);
export const ALL_PRIORITY_TYPES = Object.keys(PRIORITY_LABELS);
