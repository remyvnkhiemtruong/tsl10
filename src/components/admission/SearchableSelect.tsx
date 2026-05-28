"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
};

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  hasError,
}: {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      `${option.label} ${option.description ?? ""}`.toLocaleLowerCase("vi-VN").includes(normalizedQuery)
    );
  }, [options, query]);

  function openList() {
    if (disabled) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
    setQuery("");
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          disabled={disabled}
          value={open ? query : selected?.label ?? ""}
          placeholder={placeholder}
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

      {open && !disabled && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-slate-500">Không tìm thấy lựa chọn phù hợp.</div>
          ) : (
            filtered.map((option) => {
              const selectedOption = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-school-50",
                    selectedOption && "bg-school-50 text-school-900"
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option.value);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    {option.description && <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>}
                  </span>
                  {selectedOption && <Check size={16} className="mt-0.5 shrink-0 text-school-700" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

