import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({ className, type = "button", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-school-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-school-900 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
