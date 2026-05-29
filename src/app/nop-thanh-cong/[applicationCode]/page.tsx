import { CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SuccessActions } from "./SuccessActions";

export default async function SuccessPage({ params }: { params: Promise<{ applicationCode: string }> }) {
  const { applicationCode } = await params;
  return (
    <main className="min-h-screen">
      <PublicHeader />
      <section className="page-container py-10 sm:py-12">
        <Card className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={34} />
          </div>
          <CardTitle className="mt-6 text-2xl sm:text-3xl">Hồ sơ trực tuyến đã được ghi nhận</CardTitle>
          <CardDescription className="mt-3">
            Thí sinh cần tiếp tục nộp hồ sơ trực tiếp/bản giấy theo thông báo của nhà trường.
          </CardDescription>
          <p className="mt-5 text-sm font-semibold text-slate-600">Mã hồ sơ của thí sinh:</p>
          <p className="mt-2 break-all rounded-2xl bg-school-50 p-4 text-2xl font-black text-school-900 sm:text-3xl">
            {applicationCode}
          </p>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm leading-6 text-amber-900">
            <p className="font-bold">Hướng dẫn tiếp theo</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Lưu mã hồ sơ để tra cứu về sau.</li>
              <li>Dùng mã hồ sơ, số định danh/CCCD và ngày sinh để tra cứu trạng thái hồ sơ.</li>
              <li>Sau khi nhà trường duyệt hồ sơ trực tuyến và cấp số phiếu, thí sinh/phụ huynh tra cứu để tải phiếu đăng ký dự tuyển PDF.</li>
              <li>Nộp hồ sơ trực tiếp/bản giấy theo thông báo của Trường THPT Võ Văn Kiệt.</li>
            </ul>
          </div>
          <SuccessActions applicationCode={applicationCode} />
        </Card>
      </section>
    </main>
  );
}
