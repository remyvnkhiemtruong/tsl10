"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Field, controlErrorClass } from "@/components/admission/Field";
import { ProvinceSelect } from "@/components/admission/ProvinceSelect";
import { WardSelect } from "@/components/admission/WardSelect";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WARD_OTHER_VALUE } from "@/lib/administrative-units";
import {
  ACADEMIC_LEVEL_LABELS,
  GENDER_LABELS,
  ISSUE_PLACE_OPTIONS,
  PRIORITY_LABELS,
  PRIZE_LABELS,
  PRIZE_SCORES,
  SCHOOL_YEAR_OPTIONS,
  STATUS_LABELS,
  SUBJECT_OPTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AwardInput } from "@/lib/validation";

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

export type AdminEditFormValue = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: "NAM" | "NU" | "KHAC";
  ethnicity: string;
  birthPlace: string;
  citizenId: string;
  issueDate: string;
  issuePlace: string;
  secondarySchool: string;
  schoolYear: string;
  houseNumber: string;
  hamlet: string;
  province: string;
  ward: string;
  wardOther: string;
  studentPhone: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  selectedOptionNumber: number;
  selectedSubjects: string;
  priorities: string[];
  awards: AwardInput[];
  academicRecords: AcademicRecordForm[];
  status: string;
  publicNote: string;
  internalNote: string;
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

function uniqueMessages(fieldErrors: FieldErrors) {
  return Array.from(new Set(Object.values(fieldErrors).filter(Boolean)));
}

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export function EditApplicationForm({ initial }: { initial: AdminEditFormValue }) {
  const router = useRouter();
  const [form, setForm] = useState<AdminEditFormValue>(initial);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedSubject = useMemo(
    () => SUBJECT_OPTIONS.find((option) => option.optionNumber === form.selectedOptionNumber)?.subjects ?? form.selectedSubjects,
    [form.selectedOptionNumber, form.selectedSubjects]
  );

  function update<K extends keyof AdminEditFormValue>(name: K, value: AdminEditFormValue[K]) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name as string];
      return next;
    });
  }

  function fieldError(name: string) {
    return fieldErrors[name];
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

  async function save() {
    setLoading(true);
    setErrors([]);
    setFieldErrors({});
    try {
      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
        studentPhone: normalizePhone(form.studentPhone),
        guardianPhone: normalizePhone(form.guardianPhone),
        selectedSubjects: selectedSubject,
      };
      const res = await fetch(`/api/admin/applications/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string; fieldErrors?: FieldErrors };
      if (!res.ok) {
        if (json.fieldErrors && Object.keys(json.fieldErrors).length > 0) {
          setFieldErrors(json.fieldErrors);
          setErrors(uniqueMessages(json.fieldErrors));
          return;
        }
        throw new Error(json.error ?? "Không thể lưu hồ sơ");
      }
      router.push(`/admin/ho-so/${form.id}`);
      router.refresh();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Không thể lưu hồ sơ"]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <ul className="list-inside list-disc space-y-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Card>
        <CardTitle>Thông tin học sinh</CardTitle>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Họ và tên" error={fieldError("fullName")}>
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
            <Select value={form.gender} onChange={(event) => update("gender", event.target.value as AdminEditFormValue["gender"])}>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
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
        </div>
      </Card>

      <Card>
        <CardTitle>Thông tin học tập và điểm</CardTitle>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Trường THCS" error={fieldError("secondarySchool")}>
            <Input
              value={form.secondarySchool}
              onChange={(event) => update("secondarySchool", event.target.value)}
              className={controlErrorClass(Boolean(fieldError("secondarySchool")))}
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
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[980px] text-sm">
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
                  <td className="p-3 font-bold">Lớp {record.grade}</td>
                  {scoreFields.map((field) => (
                    <td key={field.key} className="p-2">
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={record[field.key] ?? ""}
                        onChange={(event) => updateAcademic(index, field.key, event.target.value ? Number(event.target.value) : undefined)}
                        className={controlErrorClass(Boolean(fieldError(`academicRecords.${index}.${field.key}`)))}
                        aria-label={`${field.label} lớp ${record.grade}`}
                      />
                      {fieldError(`academicRecords.${index}.${field.key}`) && (
                        <span className="mt-1 block text-xs font-semibold text-red-700">
                          {fieldError(`academicRecords.${index}.${field.key}`)}
                        </span>
                      )}
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
      </Card>

      <Card>
        <CardTitle>Địa chỉ và liên hệ</CardTitle>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Số nhà" error={fieldError("houseNumber")}>
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
          <Field label="Tỉnh/thành phố" error={fieldError("province")}>
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
          <Field label="Xã/phường" error={fieldError("ward")}>
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
      </Card>

      <Card>
        <CardTitle>Ưu tiên, khuyến khích và phương án</CardTitle>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => {
            const checked = form.priorities.includes(value);
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition",
                  checked ? "border-school-500 bg-school-50" : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-school-700 focus:ring-school-700"
                  checked={checked}
                  onChange={(event) => {
                    update(
                      "priorities",
                      event.target.checked
                        ? [...form.priorities, value]
                        : form.priorities.filter((item) => item !== value)
                    );
                  }}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Giải thưởng/khuyến khích</CardTitle>
              <CardDescription>Điểm C được tính lại theo giải thưởng đã nhập.</CardDescription>
            </div>
            <Button onClick={addAward} variant="secondary">
              <Plus size={16} /> Thêm giải
            </Button>
          </div>
          {form.awards.map((award, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 lg:grid-cols-[1.4fr_1fr_1fr_110px_150px_auto]">
              <Input
                placeholder="Tên cuộc thi/giải thưởng"
                value={award.competitionName}
                onChange={(event) => updateAward(index, { competitionName: event.target.value })}
                className={controlErrorClass(Boolean(fieldError(`awards.${index}.competitionName`)))}
              />
              <Input placeholder="Lĩnh vực" value={award.field ?? ""} onChange={(event) => updateAward(index, { field: event.target.value })} />
              <Input placeholder="Cấp" value={award.level ?? ""} onChange={(event) => updateAward(index, { level: event.target.value })} />
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
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Phương án môn học" error={fieldError("selectedOptionNumber")}>
            <Select
              value={form.selectedOptionNumber}
              onChange={(event) => {
                const optionNumber = Number(event.target.value);
                const selected = SUBJECT_OPTIONS.find((option) => option.optionNumber === optionNumber);
                update("selectedOptionNumber", optionNumber);
                update("selectedSubjects", selected?.subjects ?? "");
              }}
              className={controlErrorClass(Boolean(fieldError("selectedOptionNumber")))}
            >
              {SUBJECT_OPTIONS.map((option) => (
                <option key={option.optionNumber} value={option.optionNumber}>
                  Phương án {option.optionNumber} - {option.subjects}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Trạng thái hồ sơ" error={fieldError("status")}>
            <Select
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
              className={controlErrorClass(Boolean(fieldError("status")))}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ghi chú công khai" error={fieldError("publicNote")} className="md:col-span-2">
            <Textarea
              value={form.publicNote}
              onChange={(event) => update("publicNote", event.target.value)}
              className={controlErrorClass(Boolean(fieldError("publicNote")))}
            />
          </Field>
          <Field label="Ghi chú nội bộ" error={fieldError("internalNote")} className="md:col-span-2">
            <Textarea
              value={form.internalNote}
              onChange={(event) => update("internalNote", event.target.value)}
              className={controlErrorClass(Boolean(fieldError("internalNote")))}
            />
          </Field>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Link
          href={`/admin/ho-so/${form.id}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Hủy
        </Link>
        <Button onClick={save} disabled={loading}>
          <Save size={16} /> {loading ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>
  );
}

function LevelSelect({ value, onChange }: { value: AcademicLevelValue; onChange: (value: AcademicLevelValue) => void }) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value as AcademicLevelValue)}>
      {Object.entries(ACADEMIC_LEVEL_LABELS).map(([level, label]) => (
        <option key={level} value={level}>
          {label}
        </option>
      ))}
    </Select>
  );
}
