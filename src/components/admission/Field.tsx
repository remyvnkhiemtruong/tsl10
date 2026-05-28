import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function controlErrorClass(hasError?: boolean) {
  return hasError
    ? "border-red-500 bg-red-50/60 focus:border-red-600 focus:ring-red-100"
    : "";
}

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block min-w-0", className)} data-field-error={error ? "true" : undefined}>
      <span className="form-label">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs leading-5 text-slate-500">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-semibold leading-5 text-red-700">{error}</span>}
    </label>
  );
}

