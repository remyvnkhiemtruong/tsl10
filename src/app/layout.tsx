import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cổng tuyển sinh lớp 10 - THPT Võ Văn Kiệt",
  description: "Cổng đăng ký dự tuyển vào lớp 10 Trường THPT Võ Văn Kiệt năm học 2026 - 2027",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased overflow-x-hidden">{children}</body>
    </html>
  );
}
