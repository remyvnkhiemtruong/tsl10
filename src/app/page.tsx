import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileCheck2, LockKeyhole, SearchCheck, UploadCloud } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SCHOOL_NAME, SCHOOL_YEAR } from "@/lib/constants";

const preparationItems = [
  "Ảnh học sinh 4x6.",
  "Học bạ THCS dạng PDF hoặc ảnh học bạ lớp 6, 7, 8, 9.",
  "Giấy khai sinh hoặc CCCD/số định danh.",
  "Minh chứng ưu tiên/khuyến khích nếu có.",
  "Thông tin liên hệ phụ huynh/người giám hộ.",
];

const features = [
  {
    icon: UploadCloud,
    title: "Nộp trực tuyến",
    description: "Điền thông tin, tải minh chứng và nộp hồ sơ ngay trên cổng đăng ký.",
  },
  {
    icon: SearchCheck,
    title: "Tra cứu trạng thái",
    description: "Theo dõi tình trạng tiếp nhận bằng mã hồ sơ, số định danh và ngày sinh.",
  },
  {
    icon: LockKeyhole,
    title: "Bảo mật hồ sơ",
    description: "Tài liệu riêng tư chỉ được xử lý qua luồng kiểm tra của nhà trường.",
  },
];

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <PublicHeader />
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#0f172a,#1d4ed8_58%,#0f766e)] text-white">
        <div className="page-container grid min-h-[calc(100vh-73px)] gap-10 py-12 sm:py-16 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-20">
          <div>
            <Badge variant="outline" className="border-white/30 bg-white/10 text-white">
              Năm học {SCHOOL_YEAR}
            </Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Cổng đăng ký dự tuyển vào lớp 10
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-blue-50 sm:text-lg">
              {SCHOOL_NAME} tiếp nhận hồ sơ trực tuyến, upload học bạ, ảnh, PDF và minh chứng ưu tiên/khuyến khích
              cho năm học mới.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dang-ky"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-bold text-school-900 shadow-lg transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
              >
                Bắt đầu đăng ký <ArrowRight size={18} />
              </Link>
              <Link
                href="/tra-cuu"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 text-base font-bold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
              >
                Tra cứu hồ sơ
              </Link>
            </div>
          </div>

          <Card className="border-white/20 bg-white/95 text-slate-900 shadow-2xl">
            <div className="flex items-start gap-4">
              <Image
                src="/LogoVVK.png"
                alt="Logo Trường THPT Võ Văn Kiệt"
                width={72}
                height={72}
                className="h-16 w-16 rounded-full object-contain"
              />
              <div>
                <CardTitle>Hồ sơ cần chuẩn bị</CardTitle>
                <CardDescription>Chuẩn bị sẵn bản ảnh hoặc PDF trước khi điền form đăng ký.</CardDescription>
              </div>
            </div>
            <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
              {preparationItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <FileCheck2 size={18} className="mt-0.5 shrink-0 text-school-700" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="bg-slate-50 py-10 sm:py-14">
        <div className="page-container grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="h-full">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-school-50 text-school-700">
                  <Icon size={22} />
                </div>
                <CardTitle className="mt-5">{feature.title}</CardTitle>
                <CardDescription className="mt-2">{feature.description}</CardDescription>
              </Card>
            );
          })}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
