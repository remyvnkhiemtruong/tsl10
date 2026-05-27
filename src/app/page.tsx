import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SCHOOL_NAME, SCHOOL_YEAR } from "@/lib/constants";

export default function HomePage() {
  return (
    <main>
      <PublicHeader />
      <section className="bg-gradient-to-br from-school-900 via-school-700 to-cyan-600 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-[1.2fr_.8fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-100">Năm học {SCHOOL_YEAR}</p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">Cổng đăng ký dự tuyển vào lớp 10</h1>
            <p className="mt-4 max-w-2xl text-lg text-blue-50">
              {SCHOOL_NAME} tiếp nhận hồ sơ trực tuyến, upload học bạ, ảnh, PDF và minh chứng ưu tiên/khuyến khích.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dang-ky">
                <Button className="bg-white text-school-900 hover:bg-blue-50">Bắt đầu đăng ký</Button>
              </Link>
              <Link href="/tra-cuu">
                <Button className="bg-cyan-700 hover:bg-cyan-800">Tra cứu hồ sơ</Button>
              </Link>
            </div>
          </div>
          <Card className="bg-white/95 text-slate-900">
            <h2 className="text-xl font-bold">Hồ sơ cần chuẩn bị</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>Ảnh học sinh 4x6.</li>
              <li>Học bạ THCS dạng PDF hoặc ảnh học bạ lớp 6, 7, 8, 9.</li>
              <li>Giấy khai sinh hoặc CCCD/số định danh.</li>
              <li>Minh chứng ưu tiên, đối tượng khác, khuyến khích nếu có.</li>
              <li>Thông tin liên hệ phụ huynh/người giám hộ.</li>
            </ul>
          </Card>
        </div>
      </section>
    </main>
  );
}
