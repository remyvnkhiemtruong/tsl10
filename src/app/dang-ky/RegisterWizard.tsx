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
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ACADEMIC_LEVEL_LABELS,
  FILE_TYPE_LABELS,
  PRIZE_LABELS,
  PRIZE_SCORES,
  PRIORITY_LABELS,
  SUBJECT_OPTIONS,
} from "@/lib/constants";
import { cn, formatBytes } from "@/lib/utils";
import {
  AcademicRecordInput,
  ApplicationCreateInput,
  AwardInput,
  UploadedFileInput,
  applicationCreateSchema,
} from "@/lib/validation";

type RegisterForm = Omit<ApplicationCreateInput, "commitmentAccepted" | "uploadedFiles"> & {
  commitmentAccepted: boolean;
};

type AcademicScoreKey =
  | "literature"
  | "math"
  | "english"
  | "naturalScience"
  | "historyGeography"
  | "civicEducation"
  | "technology"
  | "informatics";

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
  { label: "Liên hệ", description: "Địa chỉ và thông tin phụ huynh/người giám hộ." },
  { label: "Ưu tiên", description: "Diện ưu tiên và điểm khuyến khích nếu có." },
  { label: "Nguyện vọng", description: "Chọn phương án môn học dự tuyển." },
  { label: "Upload", description: "Tải lên ảnh, học bạ và minh chứng." },
  { label: "Xác nhận", description: "Kiểm tra lại thông tin trước khi nộp." },
];

const initialAcademic: AcademicRecordInput[] = [6, 7, 8, 9].map((grade) => ({
  grade,
  literature: undefined,
  math: undefined,
  english: undefined,
  naturalScience: undefined,
  historyGeography: undefined,
  civicEducation: undefined,
  technology: undefined,
  informatics: undefined,
  note: undefined,
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
  schoolYear: "2025 - 2026",
  permanentAddress: "",
  houseNumber: "",
  hamlet: "",
  ward: "",
  province: "Cà Mau",
  studentPhone: "",
  email: "",
  guardianName: "",
  guardianPhone: "",
  priorities: [],
  awards: [],
  academicRecords: initialAcademic,
  selectedOptionNumber: 1,
  selectedSubjects: SUBJECT_OPTIONS[0].subjects,
  commitmentAccepted: false,
};

const requiredUploadTypes = ["PHOTO_4X6", "HOC_BA_THCS", "GIAY_KHAI_SINH", "CCCD"] as const;

const uploadDescriptions: Record<string, string> = {
  PHOTO_4X6: "Ảnh chân dung rõ mặt, nền sáng.",
  HOC_BA_THCS: "Bản PDF đầy đủ học bạ THCS.",
  HOC_BA_LOP_6: "Ảnh trang học bạ lớp 6 nếu không có PDF đầy đủ.",
  HOC_BA_LOP_7: "Ảnh trang học bạ lớp 7 nếu không có PDF đầy đủ.",
  HOC_BA_LOP_8: "Ảnh trang học bạ lớp 8 nếu không có PDF đầy đủ.",
  HOC_BA_LOP_9: "Ảnh trang học bạ lớp 9 nếu không có PDF đầy đủ.",
  GIAY_KHAI_SINH: "Ảnh/PDF giấy khai sinh.",
  CCCD: "Ảnh/PDF CCCD hoặc giấy xác nhận số định danh.",
  MINH_CHUNG_UU_TIEN: "Minh chứng cho diện ưu tiên đã chọn.",
  MINH_CHUNG_KHUYEN_KHICH: "Minh chứng giải thưởng/điểm khuyến khích.",
  HO_NGHEO_CAN_NGHEO: "Giấy xác nhận hộ nghèo/cận nghèo.",
  GIAY_TO_KHAC: "Tài liệu bổ sung khác nếu nhà trường yêu cầu.",
};

export function RegisterWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFileInput[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<RegisterForm>(initialForm);

  const bonusScore = form.awards.reduce((sum, award) => sum + (PRIZE_SCORES[award.prize] ?? 0), 0);
  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  function update<K extends keyof RegisterForm>(name: K, value: RegisterForm[K]) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function updateAcademic(index: number, key: keyof AcademicRecordInput, value: string | number | undefined) {
    const next = [...form.academicRecords];
    next[index] = { ...next[index], [key]: value };
    update("academicRecords", next);
  }

  function addAward() {
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

  async function uploadFile(fileType: string, file: File) {
    setUploadingType(fileType);
    setErrors([]);
    try {
      const data = new FormData();
      data.append("fileType", fileType);
      data.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: data });
      const json = (await res.json()) as { file?: UploadedFileInput; error?: string };
      if (!res.ok || !json.file) throw new Error(json.error ?? "Upload thất bại");
      setFiles((prev) => [...prev, json.file as UploadedFileInput]);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Upload thất bại"]);
    } finally {
      setUploadingType(null);
    }
  }

  function removeFile(storageKey: string) {
    setFiles((prev) => prev.filter((file) => file.storageKey !== storageKey));
  }

  function validateStep(targetStep: number) {
    const stepErrors: string[] = [];
    if (targetStep === 0) {
      if (form.fullName.trim().length < 2) stepErrors.push("Vui lòng nhập họ và tên học sinh.");
      if (!form.dateOfBirth) stepErrors.push("Vui lòng nhập ngày sinh.");
      if (!/^\d{9,12}$/.test(form.citizenId)) stepErrors.push("Số định danh/CCCD phải gồm 9-12 chữ số.");
      if (!form.birthPlace.trim()) stepErrors.push("Vui lòng nhập nơi sinh.");
    }
    if (targetStep === 1) {
      if (!form.secondarySchool.trim()) stepErrors.push("Vui lòng nhập trường THCS.");
      if (form.academicRecords.some((record) => scoreFields.some(({ key }) => record[key] === undefined))) {
        stepErrors.push("Vui lòng nhập đủ điểm các môn cho lớp 6, 7, 8, 9.");
      }
    }
    if (targetStep === 2) {
      if (!form.permanentAddress.trim()) stepErrors.push("Vui lòng nhập địa chỉ thường trú.");
      if (!form.guardianName.trim()) stepErrors.push("Vui lòng nhập cha/mẹ/người giám hộ.");
      if (form.guardianPhone.trim().length < 8) stepErrors.push("Vui lòng nhập số điện thoại liên hệ hợp lệ.");
    }
    if (targetStep === 3 && form.awards.some((award) => !award.competitionName.trim())) {
      stepErrors.push("Mỗi giải thưởng cần có tên cuộc thi/giải thưởng.");
    }
    if (targetStep === 5) {
      stepErrors.push(...uploadPolicyErrors());
    }
    return stepErrors;
  }

  function uploadPolicyErrors() {
    const fileTypes = new Set(files.map((file) => file.fileType));
    const uploadErrors: string[] = [];
    if (!fileTypes.has("PHOTO_4X6")) uploadErrors.push("Cần tải ảnh 4x6.");
    if (!fileTypes.has("HOC_BA_THCS") && ![6, 7, 8, 9].every((grade) => fileTypes.has(`HOC_BA_LOP_${grade}`))) {
      uploadErrors.push("Cần tải học bạ THCS dạng PDF hoặc đủ ảnh học bạ lớp 6, 7, 8, 9.");
    }
    if (!fileTypes.has("GIAY_KHAI_SINH") && !fileTypes.has("CCCD")) {
      uploadErrors.push("Cần tải giấy khai sinh hoặc CCCD/số định danh.");
    }
    if (form.priorities.length > 0 && !fileTypes.has("MINH_CHUNG_UU_TIEN")) {
      uploadErrors.push("Cần tải minh chứng ưu tiên/đối tượng khác.");
    }
    if (
      (form.priorities.includes("HO_NGHEO") || form.priorities.includes("HO_CAN_NGHEO")) &&
      !fileTypes.has("HO_NGHEO_CAN_NGHEO")
    ) {
      uploadErrors.push("Cần tải giấy xác nhận hộ nghèo/cận nghèo.");
    }
    if (form.awards.length > 0 && !fileTypes.has("MINH_CHUNG_KHUYEN_KHICH")) {
      uploadErrors.push("Cần tải minh chứng điểm khuyến khích.");
    }
    return uploadErrors;
  }

  function goNext() {
    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (stepErrors.length === 0) setStep((current) => current + 1);
  }

  async function submit() {
    setLoading(true);
    setErrors([]);
    try {
      const payload = { ...form, uploadedFiles: files };
      const parsed = applicationCreateSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((issue) => issue.message).join("; "));
      }

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as { applicationCode?: string; error?: string };
      if (!res.ok || !json.applicationCode) throw new Error(json.error ?? "Không thể nộp hồ sơ");
      router.push(`/nop-thanh-cong/${json.applicationCode}`);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Không thể nộp hồ sơ"]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-school-700">Tiến độ hồ sơ</p>
            <p className="mt-1 text-sm text-slate-500">Bước {step + 1}/7 · {progress}% hoàn tất</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 lg:max-w-sm">
            <div className="h-full rounded-full bg-school-700 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
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
          <Alert variant="destructive" className="mb-5">
            <ul className="list-inside list-disc space-y-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {step === 0 && (
          <section className="grid gap-4 md:grid-cols-2">
            <Field label="Họ và tên viết in hoa">
              <Input value={form.fullName} onChange={(event) => update("fullName", event.target.value.toUpperCase())} />
            </Field>
            <Field label="Ngày sinh">
              <Input type="date" value={form.dateOfBirth} onChange={(event) => update("dateOfBirth", event.target.value)} />
            </Field>
            <Field label="Giới tính">
              <Select value={form.gender} onChange={(event) => update("gender", event.target.value as RegisterForm["gender"])}>
                <option value="NAM">Nam</option>
                <option value="NU">Nữ</option>
                <option value="KHAC">Khác</option>
              </Select>
            </Field>
            <Field label="Dân tộc">
              <Input value={form.ethnicity} onChange={(event) => update("ethnicity", event.target.value)} />
            </Field>
            <Field label="Nơi sinh">
              <Input value={form.birthPlace} onChange={(event) => update("birthPlace", event.target.value)} />
            </Field>
            <Field label="Số định danh/CCCD">
              <Input
                inputMode="numeric"
                value={form.citizenId}
                onChange={(event) => update("citizenId", event.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field label="Ngày cấp">
              <Input type="date" value={form.issueDate} onChange={(event) => update("issueDate", event.target.value)} />
            </Field>
            <Field label="Nơi cấp">
              <Input value={form.issuePlace} onChange={(event) => update("issuePlace", event.target.value)} />
            </Field>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Trường THCS">
                <Input value={form.secondarySchool} onChange={(event) => update("secondarySchool", event.target.value)} />
              </Field>
              <Field label="Năm học lớp 9">
                <Input value={form.schoolYear} onChange={(event) => update("schoolYear", event.target.value)} />
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
                    <th className="p-3">Học lực</th>
                    <th className="p-3">Hạnh kiểm</th>
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
                      <Field key={field.key} label={field.label}>
                        <ScoreInput value={record[field.key]} onChange={(value) => updateAcademic(index, field.key, value)} />
                      </Field>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Field label="Học lực">
                      <LevelSelect value={record.academicLevel} onChange={(value) => updateAcademic(index, "academicLevel", value)} />
                    </Field>
                    <Field label="Hạnh kiểm">
                      <LevelSelect value={record.conductLevel} onChange={(value) => updateAcademic(index, "conductLevel", value)} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="grid gap-4 md:grid-cols-2">
            <Field label="Địa chỉ thường trú">
              <Textarea value={form.permanentAddress} onChange={(event) => update("permanentAddress", event.target.value)} />
            </Field>
            <Field label="Số nhà">
              <Input value={form.houseNumber} onChange={(event) => update("houseNumber", event.target.value)} />
            </Field>
            <Field label="Ấp/khóm">
              <Input value={form.hamlet} onChange={(event) => update("hamlet", event.target.value)} />
            </Field>
            <Field label="Xã/phường">
              <Input value={form.ward} onChange={(event) => update("ward", event.target.value)} />
            </Field>
            <Field label="Tỉnh/thành phố">
              <Input value={form.province} onChange={(event) => update("province", event.target.value)} />
            </Field>
            <Field label="Số điện thoại thí sinh">
              <Input inputMode="tel" value={form.studentPhone} onChange={(event) => update("studentPhone", event.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
            </Field>
            <Field label="Họ tên cha/mẹ/người giám hộ">
              <Input value={form.guardianName} onChange={(event) => update("guardianName", event.target.value)} />
            </Field>
            <Field label="Điện thoại liên hệ">
              <Input inputMode="tel" value={form.guardianPhone} onChange={(event) => update("guardianPhone", event.target.value)} />
            </Field>
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
                  <p className="mt-1 text-sm text-slate-600">Khai báo giải thưởng để hệ thống tính điểm dự kiến.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Badge variant="success">Tổng điểm: {bonusScore}</Badge>
                  <Button onClick={addAward} size="sm">
                    <Plus size={16} /> Thêm giải thưởng
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
                  <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
                    <Input
                      placeholder="Tên cuộc thi/giải thưởng"
                      value={award.competitionName}
                      onChange={(event) => updateAward(index, { competitionName: event.target.value })}
                    />
                    <Input
                      placeholder="Môn/lĩnh vực"
                      value={award.field ?? ""}
                      onChange={(event) => updateAward(index, { field: event.target.value })}
                    />
                    <Input
                      placeholder="Cấp tổ chức"
                      value={award.level ?? ""}
                      onChange={(event) => updateAward(index, { level: event.target.value })}
                    />
                    <Select
                      value={award.prize}
                      onChange={(event) => updateAward(index, { prize: event.target.value as AwardInput["prize"] })}
                    >
                      {Object.entries(PRIZE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label} ({PRIZE_SCORES[value]} điểm)
                        </option>
                      ))}
                    </Select>
                    <Button variant="destructive" size="icon" onClick={() => removeAward(index)} aria-label="Xóa giải thưởng">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
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
              <b>File bắt buộc:</b> ảnh 4x6; học bạ THCS PDF hoặc đủ ảnh học bạ lớp 6-9; giấy khai sinh hoặc CCCD;
              minh chứng tương ứng nếu có ưu tiên/khuyến khích.
            </Alert>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(FILE_TYPE_LABELS).map(([fileType, label]) => {
                const required = requiredUploadTypes.includes(fileType as (typeof requiredUploadTypes)[number]);
                const uploading = uploadingType === fileType;
                return (
                  <label
                    key={fileType}
                    className="block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-4 transition hover:border-school-500 hover:bg-school-50/40"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="flex items-center gap-2 text-sm font-bold text-slate-950">
                          <Upload size={16} className="text-school-700" /> {label}
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-slate-600">{uploadDescriptions[fileType]}</span>
                      </span>
                      {required && <Badge variant="warning">Bắt buộc</Badge>}
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
                    <span className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
                      {uploading ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" /> Đang tải lên...
                        </>
                      ) : (
                        "Chọn file"
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            <UploadedFiles files={files} onRemove={removeFile} />
          </section>
        )}

        {step === 6 && (
          <section className="space-y-5">
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-sm sm:grid-cols-2">
              <Summary label="Họ tên" value={form.fullName} />
              <Summary label="Số định danh" value={form.citizenId} />
              <Summary label="Trường THCS" value={form.secondarySchool} />
              <Summary label="Phương án" value={`${form.selectedOptionNumber} - ${form.selectedSubjects}`} />
              <Summary label="Điểm khuyến khích" value={`${bonusScore}`} />
              <Summary label="Số file upload" value={`${files.length}`} />
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
            <label className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 transition hover:bg-slate-50">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-school-700 focus:ring-school-700"
                checked={form.commitmentAccepted}
                onChange={(event) => update("commitmentAccepted", event.target.checked)}
              />
              <span>
                Tôi xin cam đoan những thông tin khai trên là đúng sự thật và chịu trách nhiệm về hồ sơ đã nộp.
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
                  <Loader2 size={16} className="animate-spin" /> Đang nộp...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Nộp hồ sơ
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="form-label">{label}</span>
      {children}
    </label>
  );
}

function ScoreInput({ value, onChange }: { value: number | undefined; onChange: (value: number | undefined) => void }) {
  return (
    <Input
      type="number"
      min="0"
      max="10"
      step="0.1"
      className="min-w-0 lg:w-20"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
    />
  );
}

function LevelSelect({
  value,
  onChange,
}: {
  value: AcademicRecordInput["academicLevel"];
  onChange: (value: NonNullable<AcademicRecordInput["academicLevel"]>) => void;
}) {
  return (
    <Select value={value ?? "TOT"} onChange={(event) => onChange(event.target.value as NonNullable<AcademicRecordInput["academicLevel"]>)}>
      {Object.entries(ACADEMIC_LEVEL_LABELS).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </Select>
  );
}

function UploadedFiles({ files, onRemove }: { files: UploadedFileInput[]; onRemove: (storageKey: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-slate-950">File đã tải lên</h3>
        <Badge variant="secondary">{files.length} file</Badge>
      </div>
      {files.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Chưa có file.</p>
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
              <Button variant="destructive" size="sm" onClick={() => onRemove(file.storageKey)} aria-label="Xóa file">
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
