"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Field, controlErrorClass } from "@/components/admission/Field";
import { ProvinceSelect } from "@/components/admission/ProvinceSelect";
import { SecondarySchoolSelect } from "@/components/admission/SecondarySchoolSelect";
import { WardSelect } from "@/components/admission/WardSelect";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { calculateAdmissionScoreWithBonuses } from "@/lib/admission-score";
import { WARD_OTHER_LABEL, WARD_OTHER_VALUE } from "@/lib/administrative-units";
import { composePermanentAddress } from "@/lib/address";
import {
  ACADEMIC_LEVEL_LABELS,
  ALL_FILE_TYPES,
  FILE_TYPE_LABELS,
  IDENTITY_DOCUMENT_FILE_TYPES,
  ISSUE_PLACE_OPTIONS,
  PRIZE_LABELS,
  PRIZE_SCORES,
  PRIORITY_LABELS,
  SCHOOL_YEAR_OPTIONS,
  SUBJECT_OPTIONS,
} from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";
import type { AwardInput, UploadedFileInput } from "@/lib/validation";

type AcademicScoreKey =
  | "literature"
  | "math"
  | "english"
  | "naturalScience"
  | "historyGeography"
  | "civicEducation"
  | "technology"
  | "informatics";

type AcademicLevelValue = "TOT" | "KHA" | "DAT" | "CHUA_DAT";

type AcademicRecordForm = {
  grade: number;
  note?: string;
  academicLevel: AcademicLevelValue;
  conductLevel: AcademicLevelValue;
} & Partial<Record<AcademicScoreKey, number>>;

type RegisterForm = {
  fullName: string;
  dateOfBirth: string;
  gender: "NAM" | "NU" | "KHAC";
  ethnicity: string;
  birthPlace: string;
  citizenId: string;
  issueDate: string;
  issuePlace: string;
  secondarySchool: string;
  secondarySchoolOldAddress: string;
  secondarySchoolAddress: string;
  schoolYear: string;
  permanentAddress: string;
  houseNumber: string;
  hamlet: string;
  ward: string;
  wardOther: string;
  province: string;
  studentPhone: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  priorities: string[];
  awards: AwardInput[];
  additionalAwardsNote: string;
  academicRecords: AcademicRecordForm[];
  selectedOptionNumber: number;
  selectedSubjects: string;
  commitmentAccepted: boolean;
};

type FieldErrors = Record<string, string>;

const scoreFields: Array<{ key: AcademicScoreKey; label: string }> = [
  { key: "literature", label: "Văn" },
  { key: "math", label: "Toán" },
  { key: "english", label: "Anh" },
  { key: "naturalScience", label: "KHTN" },
  { key: "historyGeography", label: "LS&ĐL" },
  { key: "civicEducation", label: "GDCD" },
  { key: "technology", label: "Công nghệ" },
  { key: "informatics", label: "Tin học" },
];

const steps = [
  { label: "Học sinh", description: "Thông tin cá nhân và giấy tờ định danh." },
  { label: "Học tập", description: "Trường THCS và kết quả học tập lớp 6-9." },
  { label: "Liên hệ", description: "Địa chỉ thường trú và thông tin phụ huynh/người giám hộ." },
  { label: "Ưu tiên", description: "Diện ưu tiên và điểm khuyến khích nếu có." },
  { label: "Nguyện vọng", description: "Chọn phương án môn học dự tuyển." },
  { label: "Tệp hồ sơ", description: "Tải lên ảnh, giấy tờ định danh và minh chứng." },
  { label: "Xác nhận", description: "Kiểm tra lại thông tin trước khi nộp." },
];

const initialAcademic: AcademicRecordForm[] = [6, 7, 8, 9].map((grade) => ({
  grade,
  academicLevel: "TOT",
  conductLevel: "TOT",
}));

const initialForm: RegisterForm = {
  fullName: "",
  dateOfBirth: "",
  gender: "NAM",
  ethnicity: "Kinh",
  birthPlace: "",
  citizenId: "",
  issueDate: "",
  issuePlace: "",
  secondarySchool: "",
  secondarySchoolOldAddress: "",
  secondarySchoolAddress: "",
  schoolYear: "2025 - 2026",
  permanentAddress: "",
  houseNumber: "",
  hamlet: "",
  ward: "",
  wardOther: "",
  province: "Cà Mau",
  studentPhone: "",
  email: "",
  guardianName: "",
  guardianPhone: "",
  priorities: [],
  awards: [],
  additionalAwardsNote: "",
  academicRecords: initialAcademic,
  selectedOptionNumber: 1,
  selectedSubjects: SUBJECT_OPTIONS[0].subjects,
  commitmentAccepted: false,
};

const uploadDescriptions: Record<string, string> = {
  PHOTO_4X6: "Ảnh chân dung rõ mặt, JPG/JPEG/PNG, tối đa 5MB.",
  HOC_BA_THCS: "Không bắt buộc tải lên học bạ; khuyến khích tải PDF để nhà trường kiểm tra nhanh hơn.",
  HOC_BA_LOP_6: "Không bắt buộc; ảnh trang học bạ lớp 6 nếu phụ huynh muốn bổ sung minh chứng.",
  HOC_BA_LOP_7: "Không bắt buộc; ảnh trang học bạ lớp 7 nếu phụ huynh muốn bổ sung minh chứng.",
  HOC_BA_LOP_8: "Không bắt buộc; ảnh trang học bạ lớp 8 nếu phụ huynh muốn bổ sung minh chứng.",
  HOC_BA_LOP_9: "Không bắt buộc; ảnh trang học bạ lớp 9 nếu phụ huynh muốn bổ sung minh chứng.",
  GIAY_KHAI_SINH: "Ảnh/PDF giấy khai sinh.",
  CCCD: "Ảnh/PDF số định danh/CCCD hoặc giấy xác nhận số định danh.",
  MINH_CHUNG_UU_TIEN: "Minh chứng cho diện ưu tiên/đối tượng khác đã chọn.",
  MINH_CHUNG_KHUYEN_KHICH: "Minh chứng giải thưởng/điểm khuyến khích.",
  HO_NGHEO_CAN_NGHEO: "Giấy xác nhận hộ nghèo/cận nghèo.",
  GIAY_TO_KHAC: "Tài liệu bổ sung khác nếu nhà trường yêu cầu.",
};

type IdentityDocumentFileType = (typeof IDENTITY_DOCUMENT_FILE_TYPES)[number];

const fileTypesInOrder = ALL_FILE_TYPES.filter(
  (fileType) => !IDENTITY_DOCUMENT_FILE_TYPES.includes(fileType as IdentityDocumentFileType)
);

function uniqueMessages(fieldErrors: FieldErrors) {
  return Array.from(new Set(Object.values(fieldErrors).filter(Boolean)));
}

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

function phoneError(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return `${label} là thông tin bắt buộc.`;
  if (!/^\+?[\d\s.-]+$/.test(trimmed)) return `${label} chưa hợp lệ.`;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return `${label} chưa hợp lệ.`;
  return "";
}

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function firstStepForErrors(fieldErrors: FieldErrors) {
  const firstKey = Object.keys(fieldErrors)[0] ?? "";
  if (firstKey.startsWith("academicRecords") || ["secondarySchool", "schoolYear"].includes(firstKey)) return 1;
  if (["houseNumber", "hamlet", "province", "ward", "wardOther", "studentPhone", "email", "guardianName", "guardianPhone"].includes(firstKey)) {
    return 2;
  }
  if (firstKey.startsWith("priorities") || firstKey.startsWith("awards")) return 3;
  if (firstKey.startsWith("selected")) return 4;
  if (firstKey.startsWith("uploadedFiles")) return 5;
  if (firstKey.startsWith("commitment")) return 6;
  return 0;
}

function focusFirstError() {
  window.requestAnimationFrame(() => {
    const target = document.querySelector<HTMLElement>(
      "[data-field-error='true'] input, [data-field-error='true'] select, [data-field-error='true'] button, [data-upload-error='true'] input"
    );
    target?.focus();
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export function RegisterWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFileInput[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [uploadErrors, setUploadErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [selectedIdentityFileType, setSelectedIdentityFileType] = useState<IdentityDocumentFileType>("GIAY_KHAI_SINH");

  const scoreDetails = useMemo(
    () => calculateAdmissionScoreWithBonuses(form.academicRecords, form.priorities, form.awards),
    [form.academicRecords, form.priorities, form.awards]
  );
  const bonusScore = scoreDetails.bonusScore;
  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);
  const finalWard = form.ward === WARD_OTHER_VALUE ? form.wardOther.trim() : form.ward;
  const permanentAddress = composePermanentAddress({
    houseNumber: form.houseNumber,
    hamlet: form.hamlet,
    ward: finalWard,
    province: form.province,
  });

  function update<K extends keyof RegisterForm>(name: K, value: RegisterForm[K]) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name as string];
      return next;
    });
  }

  function setValidation(fieldErrorMap: FieldErrors) {
    setFieldErrors(fieldErrorMap);
    setErrors(uniqueMessages(fieldErrorMap));
    if (Object.keys(fieldErrorMap).length > 0) focusFirstError();
  }

  function fieldError(name: string) {
    return fieldErrors[name];
  }

  function uploadError(fileType: string) {
    return fieldErrors[`uploadedFiles.${fileType}`] ?? uploadErrors[fileType];
  }

  function isIdentityDocumentFileType(fileType: string): fileType is IdentityDocumentFileType {
    return IDENTITY_DOCUMENT_FILE_TYPES.includes(fileType as IdentityDocumentFileType);
  }

  function updateAcademic(index: number, key: keyof AcademicRecordForm, value: string | number | undefined) {
    const next = [...form.academicRecords];
    next[index] = { ...next[index], [key]: value };
    update("academicRecords", next);
    setFieldErrors((prev) => {
      const fieldKey = `academicRecords.${index}.${String(key)}`;
      const updated = { ...prev };
      delete updated[fieldKey];
      return updated;
    });
  }

  function addAward() {
    if (form.awards.length >= 1) return;
    update("awards", [
      ...form.awards,
      { competitionName: "", field: "", level: "", year: undefined, prize: "GIAI_BA" },
    ]);
  }

  function updateAward(index: number, patch: Partial<AwardInput>) {
    const next = [...form.awards];
    next[index] = { ...next[index], ...patch };
    update("awards", next);
  }

  function removeAward(index: number) {
    update(
      "awards",
      form.awards.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function validateStep(targetStep: number): FieldErrors {
    const nextErrors: FieldErrors = {};
    if (targetStep === 0) {
      if (form.fullName.trim().length < 2) nextErrors.fullName = "Vui lòng nhập họ và tên học sinh, tối thiểu 2 ký tự.";
      if (!form.dateOfBirth) nextErrors.dateOfBirth = "Vui lòng nhập ngày sinh.";
      if (!form.ethnicity.trim()) nextErrors.ethnicity = "Vui lòng nhập dân tộc.";
      if (!form.birthPlace) nextErrors.birthPlace = "Vui lòng chọn nơi sinh.";
      if (!/^\d{9,12}$/.test(form.citizenId)) nextErrors.citizenId = "Số định danh/CCCD phải gồm 9-12 chữ số.";
      if (form.issueDate && !form.issuePlace) nextErrors.issuePlace = "Nếu có ngày cấp thì cần chọn nơi cấp.";
    }
    if (targetStep === 1) {
      if (!form.secondarySchool.trim()) nextErrors.secondarySchool = "Vui lòng nhập trường THCS.";
      if (!SCHOOL_YEAR_OPTIONS.includes(form.schoolYear as (typeof SCHOOL_YEAR_OPTIONS)[number])) {
        nextErrors.schoolYear = "Vui lòng chọn năm học lớp 9.";
      }
      form.academicRecords.forEach((record, index) => {
        scoreFields.forEach(({ key, label }) => {
          const value = record[key];
          if (value === undefined || Number.isNaN(value)) nextErrors[`academicRecords.${index}.${key}`] = `Thiếu điểm ${label} lớp ${record.grade}.`;
          else if (value < 0 || value > 10) nextErrors[`academicRecords.${index}.${key}`] = `Điểm ${label} lớp ${record.grade} phải từ 0 đến 10.`;
        });
      });
    }
    if (targetStep === 2) {
      if (!form.houseNumber.trim()) nextErrors.houseNumber = 'Vui lòng nhập số nhà, hoặc nhập "Không có".';
      if (!form.hamlet.trim()) nextErrors.hamlet = "Vui lòng nhập ấp/khóm.";
      if (!form.province) nextErrors.province = "Vui lòng chọn tỉnh/thành phố thường trú.";
      if (!form.ward) nextErrors.ward = "Vui lòng chọn xã/phường thường trú.";
      if (form.ward === WARD_OTHER_VALUE && form.wardOther.trim().length < 2) nextErrors.wardOther = "Vui lòng nhập xã/phường khác.";
      const studentPhoneError = phoneError(form.studentPhone, "Số điện thoại thí sinh");
      if (studentPhoneError) nextErrors.studentPhone = studentPhoneError;
      if (!form.email.trim()) nextErrors.email = "Email thí sinh là thông tin bắt buộc.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = "Email thí sinh không hợp lệ.";
      if (!form.guardianName.trim()) nextErrors.guardianName = "Vui lòng nhập họ tên cha/mẹ/người giám hộ.";
      const guardianPhoneError = phoneError(form.guardianPhone, "Số điện thoại phụ huynh/người giám hộ");
      if (guardianPhoneError) nextErrors.guardianPhone = guardianPhoneError;
    }
    if (targetStep === 3) {
      if (form.awards.length > 1) nextErrors.awards = "Chỉ được chọn tối đa 01 giải thưởng để cộng điểm khuyến khích.";
      form.awards.forEach((award, index) => {
        if (!award.competitionName.trim()) nextErrors[`awards.${index}.competitionName`] = "Mỗi giải thưởng cần có tên cuộc thi/giải thưởng.";
      });
    }
    if (targetStep === 4) {
      const selected = SUBJECT_OPTIONS.find((option) => option.optionNumber === form.selectedOptionNumber);
      if (!selected || selected.subjects !== form.selectedSubjects) nextErrors.selectedOptionNumber = "Phương án môn học không hợp lệ.";
    }
    if (targetStep === 5) {
      Object.assign(nextErrors, uploadPolicyErrors());
    }
    if (targetStep === 6 && !form.commitmentAccepted) {
      nextErrors.commitmentAccepted = "Cần xác nhận cam kết trước khi nộp.";
    }
    return nextErrors;
  }

  function uploadPolicyErrors() {
    const fileTypes = new Set(files.map((file) => file.fileType));
    const nextErrors: FieldErrors = {};
    if (!fileTypes.has("PHOTO_4X6")) nextErrors["uploadedFiles.PHOTO_4X6"] = "Cần tải ảnh 4x6.";
    if (!IDENTITY_DOCUMENT_FILE_TYPES.some((fileType) => fileTypes.has(fileType))) {
      nextErrors["uploadedFiles.IDENTITY_DOCUMENT"] = "Cần tải giấy khai sinh hoặc số định danh/CCCD.";
    }
    return nextErrors;
  }

  async function uploadFile(fileType: string, file: File) {
    setUploadingType(fileType);
    setUploadErrors((prev) => {
      const next = { ...prev };
      delete next[fileType];
      if (isIdentityDocumentFileType(fileType)) {
        for (const identityFileType of IDENTITY_DOCUMENT_FILE_TYPES) delete next[identityFileType];
      }
      return next;
    });
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`uploadedFiles.${fileType}`];
      if (isIdentityDocumentFileType(fileType)) delete next["uploadedFiles.IDENTITY_DOCUMENT"];
      return next;
    });
    setErrors([]);
    try {
      const data = new FormData();
      data.append("fileType", fileType);
      data.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: data });
      const json = (await res.json()) as { file?: UploadedFileInput; error?: string };
      if (!res.ok || !json.file) {
        throw new Error(
          json.error ?? "Không thể tải tệp lên. Vui lòng kiểm tra định dạng JPG/JPEG/PNG/PDF và dung lượng tệp."
        );
      }
      setFiles((prev) => [...prev, json.file as UploadedFileInput]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải tệp lên. Vui lòng kiểm tra định dạng JPG/JPEG/PNG/PDF và dung lượng tệp.";
      setUploadErrors((prev) => ({ ...prev, [fileType]: message }));
      setErrors([message]);
    } finally {
      setUploadingType(null);
    }
  }

  function removeFile(storageKey: string) {
    setFiles((prev) => prev.filter((file) => file.storageKey !== storageKey));
  }

  function goNext() {
    const currentErrors = validateStep(step);
    setValidation(currentErrors);
    if (Object.keys(currentErrors).length === 0) setStep((current) => current + 1);
  }

  async function submit() {
    setLoading(true);
    setErrors([]);
    try {
      const allErrors = steps.reduce<FieldErrors>((acc, _, index) => ({ ...acc, ...validateStep(index) }), {});
      if (Object.keys(allErrors).length > 0) {
        setStep(firstStepForErrors(allErrors));
        setValidation(allErrors);
        return;
      }

      const payload = {
        ...form,
        permanentAddress,
        studentPhone: normalizePhone(form.studentPhone),
        email: form.email.trim().toLowerCase(),
        guardianPhone: normalizePhone(form.guardianPhone),
        uploadedFiles: files,
      };

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { applicationCode?: string; error?: string; fieldErrors?: FieldErrors };
      if (!res.ok || !json.applicationCode) {
        if (json.fieldErrors && Object.keys(json.fieldErrors).length > 0) {
          setStep(firstStepForErrors(json.fieldErrors));
          setValidation(json.fieldErrors);
          return;
        }
        throw new Error(json.error ?? "Không thể nộp hồ sơ");
      }
      try {
        sessionStorage.setItem(
          "vvk_registration_lookup",
          JSON.stringify({
            applicationCode: json.applicationCode,
            citizenId: form.citizenId,
            dateOfBirth: form.dateOfBirth,
          })
        );
      } catch {
        // The success page falls back to the lookup page if sessionStorage is unavailable.
      }
      router.push(`/nop-thanh-cong/${json.applicationCode}`);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Không thể nộp hồ sơ"]);
    } finally {
      setLoading(false);
    }
  }

  function markedRequired(fileType: string) {
    if (fileType === "PHOTO_4X6") return true;
    if (fileType === "MINH_CHUNG_UU_TIEN" && form.priorities.length > 0) return true;
    if (fileType === "HO_NGHEO_CAN_NGHEO" && (form.priorities.includes("HO_NGHEO") || form.priorities.includes("HO_CAN_NGHEO"))) return true;
    if (fileType === "MINH_CHUNG_KHUYEN_KHICH" && form.awards.length > 0) return true;
    return false;
  }

  return (
    <div className="mt-8">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-school-700">Tiến độ hồ sơ</p>
            <p className="mt-1 text-sm text-slate-500">
              Bước {step + 1}/7 · {progress}% hoàn tất
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 lg:max-w-sm">
            <div className="h-full rounded-full bg-school-700 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <label className="mt-5 block md:hidden">
          <span className="form-label">Bước hiện tại</span>
          <Select value={String(step)} onChange={(event) => setStep(Number(event.target.value))}>
            {steps.map((item, index) => (
              <option key={item.label} value={index}>
                Bước {index + 1}: {item.label}
              </option>
            ))}
          </Select>
        </label>
        <div className="mt-5 hidden gap-2 md:grid md:grid-cols-3 lg:grid-cols-7">
          {steps.map((item, index) => {
            const active = index === step;
            const completed = index < step;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setStep(index)}
                className={cn(
                  "flex min-h-16 flex-col items-start rounded-xl border p-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
                  active && "border-school-700 bg-school-700 text-white shadow-sm",
                  completed && !active && "border-emerald-200 bg-emerald-50 text-emerald-800",
                  !active && !completed && "border-slate-200 bg-white text-slate-600 hover:border-school-300 hover:bg-school-50"
                )}
              >
                <span className="flex items-center gap-2 font-bold">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      active && "bg-white text-school-800",
                      completed && !active && "bg-emerald-600 text-white",
                      !active && !completed && "bg-slate-100 text-slate-600"
                    )}
                  >
                    {completed ? <Check size={14} /> : index + 1}
                  </span>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-2xl">{steps[step].label}</CardTitle>
          <CardDescription>{steps[step].description}</CardDescription>
        </CardHeader>

        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-5" role="alert">
            <ul className="list-inside list-disc space-y-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {step === 0 && (
          <section className="grid gap-4 md:grid-cols-2">
            <Field label="Họ và tên viết in hoa" error={fieldError("fullName")}>
              <Input
                value={form.fullName}
                onChange={(event) => update("fullName", event.target.value.toUpperCase())}
                className={controlErrorClass(Boolean(fieldError("fullName")))}
              />
            </Field>
            <Field label="Ngày sinh" error={fieldError("dateOfBirth")}>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => update("dateOfBirth", event.target.value)}
                className={controlErrorClass(Boolean(fieldError("dateOfBirth")))}
              />
            </Field>
            <Field label="Giới tính">
              <Select value={form.gender} onChange={(event) => update("gender", event.target.value as RegisterForm["gender"])}>
                <option value="NAM">Nam</option>
                <option value="NU">Nữ</option>
                <option value="KHAC">Khác</option>
              </Select>
            </Field>
            <Field label="Dân tộc" error={fieldError("ethnicity")}>
              <Input
                value={form.ethnicity}
                onChange={(event) => update("ethnicity", event.target.value)}
                className={controlErrorClass(Boolean(fieldError("ethnicity")))}
              />
            </Field>
            <Field label="Nơi sinh" error={fieldError("birthPlace")}>
              <ProvinceSelect value={form.birthPlace} onChange={(value) => update("birthPlace", value)} hasError={Boolean(fieldError("birthPlace"))} />
            </Field>
            <Field label="Số định danh/CCCD" error={fieldError("citizenId")}>
              <Input
                inputMode="numeric"
                value={form.citizenId}
                onChange={(event) => update("citizenId", event.target.value.replace(/\D/g, ""))}
                className={controlErrorClass(Boolean(fieldError("citizenId")))}
              />
            </Field>
            <Field label="Ngày cấp">
              <Input type="date" value={form.issueDate} onChange={(event) => update("issueDate", event.target.value)} />
            </Field>
            <Field label="Nơi cấp" error={fieldError("issuePlace")}>
              <Select
                value={form.issuePlace}
                onChange={(event) => update("issuePlace", event.target.value)}
                className={controlErrorClass(Boolean(fieldError("issuePlace")))}
              >
                <option value="">Chọn nơi cấp</option>
                {ISSUE_PLACE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
          <Field label="Trường THCS" error={fieldError("secondarySchool")} className="md:col-span-2">
            <SecondarySchoolSelect
              value={{
                secondarySchool: form.secondarySchool,
                secondarySchoolOldAddress: form.secondarySchoolOldAddress,
                secondarySchoolAddress: form.secondarySchoolAddress,
              }}
              onChange={(school) => {
                update("secondarySchool", school.secondarySchool);
                update("secondarySchoolOldAddress", school.secondarySchoolOldAddress);
                update("secondarySchoolAddress", school.secondarySchoolAddress);
              }}
              hasError={Boolean(fieldError("secondarySchool"))}
            />
          </Field>
              <Field label="Năm học lớp 9" error={fieldError("schoolYear")}>
                <Select
                  value={form.schoolYear}
                  onChange={(event) => update("schoolYear", event.target.value)}
                  className={controlErrorClass(Boolean(fieldError("schoolYear")))}
                >
                  {SCHOOL_YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 lg:block">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="p-3">Lớp</th>
                    {scoreFields.map((field) => (
                      <th key={field.key} className="p-3">
                        {field.label}
                      </th>
                    ))}
                    <th className="p-3">Học tập</th>
                    <th className="p-3">Rèn luyện</th>
                  </tr>
                </thead>
                <tbody>
                  {form.academicRecords.map((record, index) => (
                    <tr key={record.grade} className="border-t border-slate-100">
                      <td className="p-3 font-bold text-slate-900">Lớp {record.grade}</td>
                      {scoreFields.map((field) => (
                        <td key={field.key} className="p-2">
                          <ScoreInput
                            value={record[field.key]}
                            error={fieldError(`academicRecords.${index}.${field.key}`)}
                            onChange={(value) => updateAcademic(index, field.key, value)}
                          />
                        </td>
                      ))}
                      <td className="p-2">
                        <LevelSelect value={record.academicLevel} onChange={(value) => updateAcademic(index, "academicLevel", value)} />
                      </td>
                      <td className="p-2">
                        <LevelSelect value={record.conductLevel} onChange={(value) => updateAcademic(index, "conductLevel", value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 lg:hidden">
              {form.academicRecords.map((record, index) => (
                <div key={record.grade} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <h3 className="font-bold text-slate-950">Lớp {record.grade}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {scoreFields.map((field) => (
                      <Field key={field.key} label={field.label} error={fieldError(`academicRecords.${index}.${field.key}`)}>
                        <ScoreInput
                          value={record[field.key]}
                          error={fieldError(`academicRecords.${index}.${field.key}`)}
                          onChange={(value) => updateAcademic(index, field.key, value)}
                        />
                      </Field>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Field label="Học tập">
                      <LevelSelect value={record.academicLevel} onChange={(value) => updateAcademic(index, "academicLevel", value)} />
                    </Field>
                    <Field label="Rèn luyện">
                      <LevelSelect value={record.conductLevel} onChange={(value) => updateAcademic(index, "conductLevel", value)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <Alert>
              Danh mục hành chính theo sắp xếp năm 2025. Nếu chưa thấy địa phương, chọn &quot;{WARD_OTHER_LABEL}&quot;.
            </Alert>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Số nhà" error={fieldError("houseNumber")} hint='Nếu không có số nhà, nhập "Không có".'>
                <Input
                  value={form.houseNumber}
                  onChange={(event) => update("houseNumber", event.target.value)}
                  className={controlErrorClass(Boolean(fieldError("houseNumber")))}
                />
              </Field>
              <Field label="Ấp/khóm" error={fieldError("hamlet")}>
                <Input
                  value={form.hamlet}
                  onChange={(event) => update("hamlet", event.target.value)}
                  className={controlErrorClass(Boolean(fieldError("hamlet")))}
                />
              </Field>
              <Field label="Tỉnh/thành phố thường trú" error={fieldError("province")}>
                <ProvinceSelect
                  value={form.province}
                  onChange={(value) => {
                    update("province", value);
                    update("ward", "");
                    update("wardOther", "");
                  }}
                  hasError={Boolean(fieldError("province"))}
                />
              </Field>
              <Field label="Xã/phường thường trú" error={fieldError("ward")}>
                <WardSelect
                  provinceName={form.province}
                  value={form.ward}
                  onChange={(value) => {
                    update("ward", value);
                    if (value !== WARD_OTHER_VALUE) update("wardOther", "");
                  }}
                  hasError={Boolean(fieldError("ward"))}
                />
              </Field>
              {form.ward === WARD_OTHER_VALUE && (
                <Field label="Xã/phường khác" error={fieldError("wardOther")} className="md:col-span-2">
                  <Input
                    value={form.wardOther}
                    onChange={(event) => update("wardOther", event.target.value)}
                    className={controlErrorClass(Boolean(fieldError("wardOther")))}
                  />
                </Field>
              )}
              <Field label="Số điện thoại thí sinh *" error={fieldError("studentPhone")}>
                <Input
                  inputMode="tel"
                  value={form.studentPhone}
                  onChange={(event) => update("studentPhone", event.target.value)}
                  className={controlErrorClass(Boolean(fieldError("studentPhone")))}
                />
              </Field>
              <Field label="Email thí sinh *" error={fieldError("email")}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  className={controlErrorClass(Boolean(fieldError("email")))}
                />
              </Field>
              <Field label="Họ tên cha/mẹ/người giám hộ *" error={fieldError("guardianName")}>
                <Input
                  value={form.guardianName}
                  onChange={(event) => update("guardianName", event.target.value)}
                  className={controlErrorClass(Boolean(fieldError("guardianName")))}
                />
              </Field>
              <Field label="Điện thoại liên hệ phụ huynh/người giám hộ *" error={fieldError("guardianPhone")}>
                <Input
                  inputMode="tel"
                  value={form.guardianPhone}
                  onChange={(event) => update("guardianPhone", event.target.value)}
                  className={controlErrorClass(Boolean(fieldError("guardianPhone")))}
                />
              </Field>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-700">Địa chỉ thường trú ghép tự động</p>
              <p className="mt-1 text-slate-950">{permanentAddress || "Chưa đủ thông tin địa chỉ"}</p>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-8">
            <div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Đối tượng ưu tiên/đối tượng khác</h2>
                  <p className="mt-1 text-sm text-slate-600">Chọn các diện phù hợp với hồ sơ minh chứng.</p>
                </div>
                <Badge variant="secondary">{form.priorities.length} diện đã chọn</Badge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => {
                  const checked = form.priorities.includes(value);
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex cursor-pointer gap-3 rounded-2xl border p-4 text-sm leading-6 transition",
                        checked
                          ? "border-school-700 bg-school-50 text-school-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-school-300 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-school-700 focus:ring-school-700"
                        checked={checked}
                        onChange={(event) =>
                          update(
                            "priorities",
                            event.target.checked ? [...form.priorities, value] : form.priorities.filter((item) => item !== value)
                          )
                        }
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Điểm khuyến khích</h2>
                  <p className="mt-1 text-sm text-slate-600">Chỉ tính điểm khuyến khích theo giải thưởng đã khai báo.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Badge variant="success">Tổng điểm C: {bonusScore}</Badge>
                  <Button onClick={addAward} size="sm" disabled={form.awards.length >= 1}>
                    <Plus size={16} /> {form.awards.length >= 1 ? "Đã chọn 01 giải" : "Thêm giải thưởng"}
                  </Button>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {form.awards.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                    Chưa có giải thưởng khuyến khích.
                  </p>
                )}
                {form.awards.map((award, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1.4fr_.9fr_.9fr_110px_1fr_auto]"
                  >
                    <Input
                      placeholder="Tên cuộc thi/giải thưởng"
                      value={award.competitionName}
                      onChange={(event) => updateAward(index, { competitionName: event.target.value })}
                      className={controlErrorClass(Boolean(fieldError(`awards.${index}.competitionName`)))}
                    />
                    <Input placeholder="Môn/lĩnh vực" value={award.field ?? ""} onChange={(event) => updateAward(index, { field: event.target.value })} />
                    <Input placeholder="Cấp tổ chức" value={award.level ?? ""} onChange={(event) => updateAward(index, { level: event.target.value })} />
                    <Input
                      inputMode="numeric"
                      placeholder="Năm"
                      value={award.year ?? ""}
                      onChange={(event) => updateAward(index, { year: event.target.value ? Number(event.target.value) : undefined })}
                    />
                    <Select value={award.prize} onChange={(event) => updateAward(index, { prize: event.target.value as AwardInput["prize"] })}>
                      {Object.entries(PRIZE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label} ({PRIZE_SCORES[value]} điểm)
                        </option>
                      ))}
                    </Select>
                    <Button variant="destructive" size="icon" onClick={() => removeAward(index)} aria-label="Xóa giải thưởng">
                      <Trash2 size={16} />
                    </Button>
                    {fieldError(`awards.${index}.competitionName`) && (
                      <p className="text-xs font-semibold text-red-700 lg:col-span-6">{fieldError(`awards.${index}.competitionName`)}</p>
                    )}
                  </div>
                ))}
                <Textarea
                  placeholder="Ghi chú giải thưởng khác không tính điểm (nếu có)"
                  value={form.additionalAwardsNote}
                  onChange={(event) => update("additionalAwardsNote", event.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="grid gap-4 md:grid-cols-2">
            {SUBJECT_OPTIONS.map((option) => {
              const selected = form.selectedOptionNumber === option.optionNumber;
              return (
                <button
                  key={option.optionNumber}
                  type="button"
                  onClick={() => {
                    update("selectedOptionNumber", option.optionNumber);
                    update("selectedSubjects", option.subjects);
                  }}
                  className={cn(
                    "rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
                    selected ? "border-school-700 bg-school-50 shadow-sm" : "border-slate-200 bg-white hover:border-school-400 hover:bg-slate-50"
                  )}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span>
                      <span className="block text-lg font-bold text-slate-950">Phương án {option.optionNumber}</span>
                      <span className="mt-2 block text-sm leading-6 text-slate-600">{option.subjects}</span>
                    </span>
                    {selected && (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-school-700 text-white">
                        <Check size={16} />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </section>
        )}

        {step === 5 && (
          <section className="space-y-5">
            <Alert>
              <b>Tệp bắt buộc:</b> ảnh 4x6; giấy khai sinh hoặc số định danh/CCCD. Không bắt buộc tải lên học bạ.
              Tuy nhiên, nhà trường khuyến khích tải học bạ/ảnh minh chứng kết quả học tập để quá trình kiểm tra và xử lý hồ sơ nhanh hơn.
              Minh chứng ưu tiên/khuyến khích có thể bổ sung để nhà trường đối chiếu. Chỉ nhận JPG/JPEG/PNG/PDF.
            </Alert>
            <div className="grid gap-4 md:grid-cols-2">
              <IdentityDocumentUploader
                files={files.filter((file) => isIdentityDocumentFileType(file.fileType))}
                selectedFileType={selectedIdentityFileType}
                onSelectedFileTypeChange={setSelectedIdentityFileType}
                onUpload={uploadFile}
                onRemove={removeFile}
                uploading={uploadingType === selectedIdentityFileType}
                error={
                  fieldErrors["uploadedFiles.IDENTITY_DOCUMENT"] ??
                  uploadErrors.GIAY_KHAI_SINH ??
                  uploadErrors.CCCD
                }
              />
              {fileTypesInOrder.map((fileType) => {
                const fileError = uploadError(fileType);
                const uploading = uploadingType === fileType;
                const uploaded = files.filter((file) => file.fileType === fileType);
                return (
                  <label
                    key={fileType}
                    data-upload-error={fileError ? "true" : undefined}
                    className={cn(
                      "block cursor-pointer rounded-2xl border border-dashed bg-white p-4 transition hover:border-school-500 hover:bg-school-50/40",
                      fileError ? "border-red-400 bg-red-50/70 ring-2 ring-red-100" : "border-slate-300"
                    )}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="flex items-center gap-2 text-sm font-bold text-slate-950">
                          <Upload size={16} className="text-school-700" /> {FILE_TYPE_LABELS[fileType] ?? fileType}
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-slate-600">{uploadDescriptions[fileType]}</span>
                      </span>
                      {markedRequired(fileType) && <Badge variant="warning">Bắt buộc</Badge>}
                    </span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="sr-only"
                      disabled={uploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadFile(fileType, file);
                        event.currentTarget.value = "";
                      }}
                    />
                    <span className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
                        {uploading ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" /> Đang tải tệp...
                          </>
                        ) : (
                          "Chọn tệp"
                        )}
                      </span>
                      <Badge variant={fileError ? "destructive" : uploaded.length > 0 ? "success" : uploading ? "warning" : "secondary"}>
                        {fileError ? "Lỗi" : uploaded.length > 0 ? "Đã tải" : uploading ? "Đang tải" : "Chưa tải"}
                      </Badge>
                    </span>
                    {uploaded.length > 0 && (
                      <span className="mt-3 block space-y-2">
                        {uploaded.map((file) => (
                          <span key={file.storageKey} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
                            <span className="min-w-0 truncate">
                              {file.originalName} · {formatBytes(file.size)}
                            </span>
                            <button
                              type="button"
                              className="font-semibold text-red-700 hover:text-red-900"
                              onClick={(event) => {
                                event.preventDefault();
                                removeFile(file.storageKey);
                              }}
                            >
                              Xóa
                            </button>
                          </span>
                        ))}
                      </span>
                    )}
                    {fileError && <span className="mt-3 block text-xs font-semibold leading-5 text-red-700">{fileError}</span>}
                  </label>
                );
              })}
            </div>
            <UploadedFiles files={files} onRemove={removeFile} />
          </section>
        )}

        {step === 6 && (
          <section className="space-y-5">
            <Alert variant="success">
              Không thu lệ phí tuyển sinh. Hệ thống chỉ tính điểm xét tuyển dự kiến phục vụ hội đồng tuyển sinh, không tự kết luận trúng tuyển.
            </Alert>
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-sm sm:grid-cols-2">
              <Summary label="Họ tên" value={form.fullName} />
              <Summary label="Số định danh" value={form.citizenId} />
              <Summary label="Nơi sinh" value={form.birthPlace} />
              <Summary label="Trường THCS" value={form.secondarySchool} />
              <Summary label="Địa chỉ thường trú" value={permanentAddress} className="sm:col-span-2" />
              <Summary label="Số điện thoại thí sinh" value={normalizePhone(form.studentPhone)} />
              <Summary label="Email thí sinh" value={form.email.trim().toLowerCase()} />
              <Summary label="Phụ huynh/người giám hộ" value={form.guardianName} />
              <Summary label="Số điện thoại phụ huynh/người giám hộ" value={normalizePhone(form.guardianPhone)} />
              <Summary label="Phương án" value={`${form.selectedOptionNumber} - ${form.selectedSubjects}`} className="sm:col-span-2" />
              <Summary label="A - Tổng điểm TB môn THCS" value={formatScore(scoreDetails.academicAverageSum)} />
              <Summary label="B - Điểm quy đổi học tập/rèn luyện" value={formatScore(scoreDetails.convertedScoreSum)} />
              <Summary label="C - Điểm ưu tiên/khuyến khích" value={formatScore(scoreDetails.bonusScore)} />
              <Summary label="Tổng điểm xét tuyển dự kiến" value={formatScore(scoreDetails.totalScore)} />
              <Summary label="Số tệp đã tải lên" value={`${files.length}`} />
              <Summary
                label="Diện ưu tiên"
                value={
                  form.priorities.length > 0
                    ? form.priorities.map((priority) => PRIORITY_LABELS[priority] ?? priority).join("; ")
                    : "Không"
                }
                className="sm:col-span-2"
              />
            </div>
            <label
              className={cn(
                "flex cursor-pointer gap-3 rounded-2xl border bg-white p-4 text-sm leading-6 text-slate-700 transition hover:bg-slate-50",
                fieldError("commitmentAccepted") ? "border-red-300 bg-red-50" : "border-slate-200"
              )}
              data-field-error={fieldError("commitmentAccepted") ? "true" : undefined}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-school-700 focus:ring-school-700"
                checked={form.commitmentAccepted}
                onChange={(event) => update("commitmentAccepted", event.target.checked)}
              />
              <span>
                Tôi xin cam đoan những thông tin khai trên là đúng sự thật và chịu trách nhiệm về hồ sơ đã nộp.
                {fieldError("commitmentAccepted") && (
                  <span className="mt-1 block text-xs font-semibold text-red-700">{fieldError("commitmentAccepted")}</span>
                )}
              </span>
            </label>
          </section>
        )}

        <CardFooter className="flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((current) => current - 1)}
            className="w-full sm:w-auto"
          >
            <ArrowLeft size={16} /> Quay lại
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={goNext} className="w-full sm:w-auto">
              Tiếp tục <ArrowRight size={16} />
            </Button>
          ) : (
            <Button disabled={loading || !form.commitmentAccepted} onClick={submit} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang nộp hồ sơ...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Nộp hồ sơ trực tuyến
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function ScoreInput({
  value,
  error,
  onChange,
}: {
  value: number | undefined;
  error?: string;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <Input
      type="number"
      min="0"
      max="10"
      step="0.1"
      className={cn("min-w-0 lg:w-20", controlErrorClass(Boolean(error)))}
      value={value ?? ""}
      aria-invalid={Boolean(error)}
      onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
    />
  );
}

function LevelSelect({ value, onChange }: { value: AcademicLevelValue; onChange: (value: AcademicLevelValue) => void }) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value as AcademicLevelValue)}>
      {Object.entries(ACADEMIC_LEVEL_LABELS).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </Select>
  );
}

function IdentityDocumentUploader({
  files,
  selectedFileType,
  onSelectedFileTypeChange,
  onUpload,
  onRemove,
  uploading,
  error,
}: {
  files: UploadedFileInput[];
  selectedFileType: IdentityDocumentFileType;
  onSelectedFileTypeChange: (fileType: IdentityDocumentFileType) => void;
  onUpload: (fileType: IdentityDocumentFileType, file: File) => void;
  onRemove: (storageKey: string) => void;
  uploading: boolean;
  error?: string;
}) {
  return (
    <div
      data-upload-error={error ? "true" : undefined}
      className={cn(
        "rounded-2xl border border-dashed bg-white p-4 transition md:col-span-2",
        error ? "border-red-400 bg-red-50/70 ring-2 ring-red-100" : "border-slate-300"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-950">
            <Upload size={16} className="text-school-700" />
            Giấy khai sinh hoặc CCCD/Số định danh
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Tải ảnh/PDF giấy khai sinh, CCCD hoặc giấy xác nhận số định danh. Chỉ cần nộp một trong các loại giấy tờ này.
          </p>
        </div>
        <Badge variant="warning">Bắt buộc</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[260px_1fr] sm:items-end">
        <label className="block">
          <span className="form-label">Loại giấy tờ tải lên</span>
          <Select
            value={selectedFileType}
            onChange={(event) => onSelectedFileTypeChange(event.target.value as IdentityDocumentFileType)}
            disabled={uploading}
          >
            {IDENTITY_DOCUMENT_FILE_TYPES.map((fileType) => (
              <option key={fileType} value={fileType}>
                {FILE_TYPE_LABELS[fileType]}
              </option>
            ))}
          </Select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="identity-document-upload"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUpload(selectedFileType, file);
              event.currentTarget.value = "";
            }}
          />
          <label
            htmlFor="identity-document-upload"
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Đang tải tệp...
              </>
            ) : (
              "Chọn tệp"
            )}
          </label>
          <Badge variant={error ? "destructive" : files.length > 0 ? "success" : uploading ? "warning" : "secondary"}>
            {error ? "Lỗi" : files.length > 0 ? "Đã tải" : uploading ? "Đang tải" : "Chưa tải"}
          </Badge>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file) => (
            <div key={file.storageKey} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <span className="min-w-0 truncate">
                <span className="font-semibold">{FILE_TYPE_LABELS[file.fileType] ?? file.fileType}</span> · {file.originalName} ·{" "}
                {formatBytes(file.size)}
              </span>
              <button
                type="button"
                className="min-h-10 shrink-0 px-2 font-semibold text-red-700 hover:text-red-900"
                onClick={() => onRemove(file.storageKey)}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="mt-3 text-xs font-semibold leading-5 text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function UploadedFiles({ files, onRemove }: { files: UploadedFileInput[]; onRemove: (storageKey: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-slate-950">Tệp đã tải lên</h3>
        <Badge variant="secondary">{files.length} tệp</Badge>
      </div>
      {files.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Chưa có tệp nào được tải lên.</p>
      ) : (
        <ul className="mt-4 space-y-3 text-sm">
          {files.map((file) => (
            <li key={file.storageKey} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex min-w-0 items-start gap-3">
                <FileText size={18} className="mt-0.5 shrink-0 text-school-700" />
                <span className="min-w-0">
                  <span className="block font-semibold text-slate-950">{FILE_TYPE_LABELS[file.fileType] ?? file.fileType}</span>
                  <span className="mt-1 block truncate text-slate-600">
                    {file.originalName} · {formatBytes(file.size)}
                  </span>
                </span>
              </span>
              <Button variant="destructive" size="sm" onClick={() => onRemove(file.storageKey)} aria-label="Xóa tệp">
                <Trash2 size={15} /> Xóa
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Summary({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value || "-"}</p>
    </div>
  );
}
