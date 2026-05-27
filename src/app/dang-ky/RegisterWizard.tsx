"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ACADEMIC_LEVEL_LABELS,
  FILE_TYPE_LABELS,
  PRIZE_LABELS,
  PRIZE_SCORES,
  PRIORITY_LABELS,
  SUBJECT_OPTIONS
} from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import {
  AcademicRecordInput,
  ApplicationCreateInput,
  AwardInput,
  UploadedFileInput,
  applicationCreateSchema
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
  { key: "informatics", label: "Tin học" }
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
  conductLevel: "TOT"
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
  commitmentAccepted: false
};

const requiredUploadTypes = ["PHOTO_4X6", "HOC_BA_THCS", "GIAY_KHAI_SINH", "CCCD"] as const;

export function RegisterWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [files, setFiles] = useState<UploadedFileInput[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [form, setForm] = useState<RegisterForm>(initialForm);

  const steps = useMemo(
    () => ["Học sinh", "Học tập", "Liên hệ", "Ưu tiên", "Nguyện vọng", "Upload", "Xác nhận"],
    []
  );
  const bonusScore = form.awards.reduce((sum, award) => sum + (PRIZE_SCORES[award.prize] ?? 0), 0);

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
      { competitionName: "", field: "", level: "", year: undefined, prize: "GIAI_BA" }
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
        body: JSON.stringify(parsed.data)
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
      <div className="grid gap-2 md:grid-cols-7">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              index === step ? "border-school-700 bg-school-700 text-white" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <Card className="mt-6">
        {step === 0 && (
          <section className="grid gap-4 md:grid-cols-2">
            <Field label="Họ và tên viết in hoa">
              <input
                className="form-input"
                value={form.fullName}
                onChange={(event) => update("fullName", event.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Ngày sinh">
              <input
                type="date"
                className="form-input"
                value={form.dateOfBirth}
                onChange={(event) => update("dateOfBirth", event.target.value)}
              />
            </Field>
            <Field label="Giới tính">
              <select
                className="form-select"
                value={form.gender}
                onChange={(event) => update("gender", event.target.value as RegisterForm["gender"])}
              >
                <option value="NAM">Nam</option>
                <option value="NU">Nữ</option>
                <option value="KHAC">Khác</option>
              </select>
            </Field>
            <Field label="Dân tộc">
              <input className="form-input" value={form.ethnicity} onChange={(event) => update("ethnicity", event.target.value)} />
            </Field>
            <Field label="Nơi sinh">
              <input className="form-input" value={form.birthPlace} onChange={(event) => update("birthPlace", event.target.value)} />
            </Field>
            <Field label="Số định danh/CCCD">
              <input
                className="form-input"
                value={form.citizenId}
                onChange={(event) => update("citizenId", event.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field label="Ngày cấp">
              <input type="date" className="form-input" value={form.issueDate} onChange={(event) => update("issueDate", event.target.value)} />
            </Field>
            <Field label="Nơi cấp">
              <input className="form-input" value={form.issuePlace} onChange={(event) => update("issuePlace", event.target.value)} />
            </Field>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Trường THCS">
                <input
                  className="form-input"
                  value={form.secondarySchool}
                  onChange={(event) => update("secondarySchool", event.target.value)}
                />
              </Field>
              <Field label="Năm học lớp 9">
                <input className="form-input" value={form.schoolYear} onChange={(event) => update("schoolYear", event.target.value)} />
              </Field>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="p-2">Lớp</th>
                    {scoreFields.map((field) => (
                      <th key={field.key} className="p-2">
                        {field.label}
                      </th>
                    ))}
                    <th className="p-2">Học lực</th>
                    <th className="p-2">Hạnh kiểm</th>
                  </tr>
                </thead>
                <tbody>
                  {form.academicRecords.map((record, index) => (
                    <tr key={record.grade} className="border-t">
                      <td className="p-2 font-semibold">{record.grade}</td>
                      {scoreFields.map((field) => (
                        <td key={field.key} className="p-2">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            className="form-input w-20"
                            value={record[field.key] ?? ""}
                            onChange={(event) =>
                              updateAcademic(index, field.key, event.target.value === "" ? undefined : Number(event.target.value))
                            }
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
          </section>
        )}

        {step === 2 && (
          <section className="grid gap-4 md:grid-cols-2">
            <Field label="Địa chỉ thường trú">
              <input
                className="form-input"
                value={form.permanentAddress}
                onChange={(event) => update("permanentAddress", event.target.value)}
              />
            </Field>
            <Field label="Số nhà">
              <input className="form-input" value={form.houseNumber} onChange={(event) => update("houseNumber", event.target.value)} />
            </Field>
            <Field label="Ấp/khóm">
              <input className="form-input" value={form.hamlet} onChange={(event) => update("hamlet", event.target.value)} />
            </Field>
            <Field label="Xã/phường">
              <input className="form-input" value={form.ward} onChange={(event) => update("ward", event.target.value)} />
            </Field>
            <Field label="Tỉnh/thành phố">
              <input className="form-input" value={form.province} onChange={(event) => update("province", event.target.value)} />
            </Field>
            <Field label="Số điện thoại thí sinh">
              <input className="form-input" value={form.studentPhone} onChange={(event) => update("studentPhone", event.target.value)} />
            </Field>
            <Field label="Email">
              <input className="form-input" value={form.email} onChange={(event) => update("email", event.target.value)} />
            </Field>
            <Field label="Họ tên cha/mẹ/người giám hộ">
              <input className="form-input" value={form.guardianName} onChange={(event) => update("guardianName", event.target.value)} />
            </Field>
            <Field label="Điện thoại liên hệ">
              <input className="form-input" value={form.guardianPhone} onChange={(event) => update("guardianPhone", event.target.value)} />
            </Field>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6">
            <div>
              <h2 className="font-bold">Đối tượng ưu tiên/đối tượng khác</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <label key={value} className="flex gap-2 rounded-lg border border-slate-200 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.priorities.includes(value)}
                      onChange={(event) =>
                        update(
                          "priorities",
                          event.target.checked ? [...form.priorities, value] : form.priorities.filter((item) => item !== value)
                        )
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Điểm khuyến khích</h2>
                <Button onClick={addAward}>
                  <Plus size={16} /> Thêm giải thưởng
                </Button>
              </div>
              <p className="mt-2 text-sm text-slate-600">Tổng điểm khuyến khích dự kiến: {bonusScore}</p>
              <div className="mt-4 space-y-3">
                {form.awards.map((award, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
                    <input
                      className="form-input"
                      placeholder="Tên cuộc thi/giải thưởng"
                      value={award.competitionName}
                      onChange={(event) => updateAward(index, { competitionName: event.target.value })}
                    />
                    <input
                      className="form-input"
                      placeholder="Môn/lĩnh vực"
                      value={award.field ?? ""}
                      onChange={(event) => updateAward(index, { field: event.target.value })}
                    />
                    <input
                      className="form-input"
                      placeholder="Cấp tổ chức"
                      value={award.level ?? ""}
                      onChange={(event) => updateAward(index, { level: event.target.value })}
                    />
                    <select
                      className="form-select"
                      value={award.prize}
                      onChange={(event) => updateAward(index, { prize: event.target.value as AwardInput["prize"] })}
                    >
                      {Object.entries(PRIZE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label} ({PRIZE_SCORES[value]} điểm)
                        </option>
                      ))}
                    </select>
                    <Button className="bg-red-600 hover:bg-red-700" onClick={() => removeAward(index)} aria-label="Xóa giải thưởng">
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
            {SUBJECT_OPTIONS.map((option) => (
              <button
                key={option.optionNumber}
                type="button"
                onClick={() => {
                  update("selectedOptionNumber", option.optionNumber);
                  update("selectedSubjects", option.subjects);
                }}
                className={`rounded-lg border p-5 text-left transition ${
                  form.selectedOptionNumber === option.optionNumber
                    ? "border-school-700 bg-school-50"
                    : "border-slate-200 bg-white hover:border-school-500"
                }`}
              >
                <div className="font-bold">Phương án {option.optionNumber}</div>
                <div className="mt-2 text-sm text-slate-600">{option.subjects}</div>
              </button>
            ))}
          </section>
        )}

        {step === 5 && (
          <section className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold">File bắt buộc</p>
              <p className="mt-1">
                Ảnh 4x6; học bạ THCS PDF hoặc đủ ảnh học bạ lớp 6-9; giấy khai sinh hoặc CCCD; minh chứng tương ứng nếu có ưu tiên/khuyến khích.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(FILE_TYPE_LABELS).map(([fileType, label]) => (
                <label key={fileType} className="block rounded-lg border border-dashed border-slate-300 p-4">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Upload size={16} /> {label}
                    {requiredUploadTypes.includes(fileType as (typeof requiredUploadTypes)[number]) && (
                      <span className="text-xs text-red-600">Bắt buộc</span>
                    )}
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="mt-3 block w-full text-sm"
                    disabled={uploadingType === fileType}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadFile(fileType, file);
                      event.currentTarget.value = "";
                    }}
                  />
                  {uploadingType === fileType && <p className="mt-2 text-sm text-school-700">Đang tải lên...</p>}
                </label>
              ))}
            </div>
            <UploadedFiles files={files} onRemove={removeFile} />
          </section>
        )}

        {step === 6 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">Xem lại và xác nhận</h2>
            <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm md:grid-cols-2">
              <p>
                <b>Họ tên:</b> {form.fullName}
              </p>
              <p>
                <b>Số định danh:</b> {form.citizenId}
              </p>
              <p>
                <b>Trường THCS:</b> {form.secondarySchool}
              </p>
              <p>
                <b>Phương án:</b> {form.selectedOptionNumber} - {form.selectedSubjects}
              </p>
              <p>
                <b>Điểm khuyến khích:</b> {bonusScore}
              </p>
              <p>
                <b>Số file đã upload:</b> {files.length}
              </p>
            </div>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.commitmentAccepted}
                onChange={(event) => update("commitmentAccepted", event.target.checked)}
              />
              Tôi xin cam đoan những thông tin khai trên là đúng sự thật và chịu trách nhiệm về hồ sơ đã nộp.
            </label>
          </section>
        )}

        <div className="mt-8 flex justify-between">
          <Button className="bg-slate-200 text-slate-900 hover:bg-slate-300" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
            Quay lại
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={goNext}>Tiếp tục</Button>
          ) : (
            <Button disabled={loading || !form.commitmentAccepted} onClick={submit}>
              {loading ? "Đang nộp..." : "Nộp hồ sơ"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function LevelSelect({
  value,
  onChange
}: {
  value: AcademicRecordInput["academicLevel"];
  onChange: (value: NonNullable<AcademicRecordInput["academicLevel"]>) => void;
}) {
  return (
    <select className="form-select w-28" value={value ?? "TOT"} onChange={(event) => onChange(event.target.value as NonNullable<AcademicRecordInput["academicLevel"]>)}>
      {Object.entries(ACADEMIC_LEVEL_LABELS).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}

function UploadedFiles({ files, onRemove }: { files: UploadedFileInput[]; onRemove: (storageKey: string) => void }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <h3 className="font-bold">File đã tải lên</h3>
      {files.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">Chưa có file.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {files.map((file) => (
            <li key={file.storageKey} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3">
              <span className="flex min-w-0 items-center gap-2">
                <FileText size={16} className="shrink-0 text-school-700" />
                <span className="truncate">
                  {FILE_TYPE_LABELS[file.fileType]} - {file.originalName}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-slate-500">{formatBytes(file.size)}</span>
                <CheckCircle2 size={16} className="text-green-600" />
                <button type="button" onClick={() => onRemove(file.storageKey)} className="text-red-600" aria-label="Xóa file">
                  <Trash2 size={16} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
