"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  CA_MAU_SECONDARY_SCHOOLS,
  SECONDARY_SCHOOL_OTHER_LABEL,
  normalizeVietnamese,
  type SecondarySchool,
} from "@/lib/secondary-schools";
import { cn } from "@/lib/utils";

export type SecondarySchoolSelectValue = {
  secondarySchool: string;
  secondarySchoolOldAddress: string;
  secondarySchoolAddress: string;
};

export function SecondarySchoolSelect({
  value,
  onChange,
  hasError,
}: {
  value: SecondarySchoolSelectValue;
  onChange: (value: SecondarySchoolSelectValue) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedSchool = useMemo(
    () =>
      CA_MAU_SECONDARY_SCHOOLS.find(
        (school) =>
          school.name === value.secondarySchool &&
          school.oldAddress === value.secondarySchoolOldAddress &&
          school.newAddress === value.secondarySchoolAddress
      ),
    [value]
  );
  const isManual = manualMode || Boolean(value.secondarySchool && !selectedSchool);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    const normalized = normalizeVietnamese(debouncedQuery);
    const matches = normalized
      ? CA_MAU_SECONDARY_SCHOOLS.filter((school) =>
          normalizeVietnamese(`${school.name} ${school.oldAddress} ${school.newAddress}`).includes(normalized)
        )
      : CA_MAU_SECONDARY_SCHOOLS;
    return matches.slice(0, 80);
  }, [debouncedQuery]);

  function openList() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
    setQuery("");
  }

  function selectSchool(school: SecondarySchool) {
    setManualMode(false);
    onChange({
      secondarySchool: school.name,
      secondarySchoolOldAddress: school.oldAddress,
      secondarySchoolAddress: school.newAddress,
    });
    setOpen(false);
    setQuery("");
  }

  function selectManual() {
    setManualMode(true);
    onChange({
      secondarySchool: selectedSchool ? "" : value.secondarySchool,
      secondarySchoolOldAddress: selectedSchool ? "" : value.secondarySchoolOldAddress,
      secondarySchoolAddress: selectedSchool ? "" : value.secondarySchoolAddress,
    });
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={open ? query : selectedSchool?.name ?? (isManual ? SECONDARY_SCHOOL_OTHER_LABEL : "")}
            placeholder="Chọn trường THCS"
            onFocus={openList}
            onClick={openList}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onBlur={() => {
              closeTimer.current = setTimeout(() => setOpen(false), 120);
            }}
            className={cn("form-input pl-9 pr-10", hasError && "border-red-500 bg-red-50/60 focus:border-red-600 focus:ring-red-100")}
            aria-invalid={hasError}
          />
          <ChevronDown
            size={16}
            className={cn("pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition", open && "rotate-180")}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">Nhập tên trường, địa chỉ cũ hoặc địa chỉ mới để tìm...</p>

        {open && (
          <div className="absolute z-30 mt-2 max-h-96 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
            <button
              type="button"
              className={cn("flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-school-50", isManual && "bg-school-50 text-school-900")}
              onMouseDown={(event) => event.preventDefault()}
              onClick={selectManual}
            >
              <span>
                <span className="block font-semibold">{SECONDARY_SCHOOL_OTHER_LABEL}</span>
                <span className="mt-0.5 block text-xs text-slate-500">Dùng khi trường chưa có trong danh mục.</span>
              </span>
              {isManual && <Check size={16} className="mt-0.5 shrink-0 text-school-700" />}
            </button>
            {filtered.map((school) => {
              const selected = selectedSchool?.id === school.id;
              return (
                <button
                  key={school.id}
                  type="button"
                  className={cn(
                    "flex w-full items-start justify-between gap-3 border-t border-slate-100 px-3 py-2.5 text-left transition hover:bg-school-50",
                    selected && "bg-school-50 text-school-900"
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSchool(school)}
                >
                  <span>
                    <span className="block font-semibold">{school.name}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">Địa chỉ cũ: {school.oldAddress}</span>
                    <span className="block text-xs leading-5 text-slate-500">Địa chỉ mới: {school.newAddress}</span>
                  </span>
                  {selected && <Check size={16} className="mt-0.5 shrink-0 text-school-700" />}
                </button>
              );
            })}
            {filtered.length === 0 && <div className="px-3 py-3 text-slate-500">Không tìm thấy trường phù hợp.</div>}
          </div>
        )}
      </div>

      {selectedSchool && (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p>
            <b>Địa chỉ cũ:</b> {selectedSchool.oldAddress}
          </p>
          <p>
            <b>Địa chỉ mới:</b> {selectedSchool.newAddress}
          </p>
        </div>
      )}

      {isManual && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <Alert variant="warning">Trường nhập thủ công sẽ được admin kiểm tra và chuẩn hóa sau khi tiếp nhận hồ sơ.</Alert>
          <Input
            placeholder="Nhập tên trường THCS"
            value={value.secondarySchool}
            onChange={(event) => onChange({ ...value, secondarySchool: event.target.value })}
          />
          <Input
            placeholder="Địa chỉ cũ của trường THCS"
            value={value.secondarySchoolOldAddress}
            onChange={(event) => onChange({ ...value, secondarySchoolOldAddress: event.target.value })}
          />
          <Input
            placeholder="Địa chỉ mới của trường THCS"
            value={value.secondarySchoolAddress}
            onChange={(event) => onChange({ ...value, secondarySchoolAddress: event.target.value })}
          />
        </div>
      )}
    </div>
  );
}
