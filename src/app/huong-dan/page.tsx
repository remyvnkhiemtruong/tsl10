import { ClipboardCheck, FileUp, SearchCheck } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const steps = [
  {
    icon: FileUp,
    title: "1. Chuẩn bị hồ sơ",
    description:
      "Chuẩn bị ảnh 4x6, học bạ, giấy khai sinh hoặc số định danh/CCCD và minh chứng ưu tiên/khuyến khích nếu có.",
  },
  {
    icon: ClipboardCheck,
    title: "2. Điền thông tin",
    description: "Nhập thông tin học sinh, học tập THCS, liên hệ và chọn phương án môn học lớp 10.",
  },
  {
    icon: SearchCheck,
    title: "3. Nộp và tra cứu",
    description: "Sau khi nộp, lưu mã hồ sơ để tra cứu trạng thái xử lý bằng mã hồ sơ, số định danh và ngày sinh.",
  },
];

export default function GuidePage() {
  return (
    <main className="min-h-screen">
      <PublicHeader />
      <section className="page-container py-10 sm:py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Hướng dẫn</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Hướng dẫn đăng ký trực tuyến</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Thí sinh và phụ huynh thực hiện theo các bước dưới đây để hồ sơ được tiếp nhận đầy đủ.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="h-full">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-school-50 text-school-700">
                  <Icon size={22} />
                </div>
                <CardTitle className="mt-5">{step.title}</CardTitle>
                <CardDescription className="mt-2">{step.description}</CardDescription>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
