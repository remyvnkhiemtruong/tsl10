import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cổng đăng ký dự tuyển lớp 10 THPT Võ Văn Kiệt",
  description: "Đăng ký dự tuyển vào lớp 10 năm học 2026 - 2027"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
