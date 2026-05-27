import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function SuccessPage({ params }: { params: Promise<{ applicationCode: string }> }) {
  const { applicationCode } = await params;
  return (
    <main className="min-h-screen">
      <PublicHeader />
      <section className="page-container py-12">
        <Card className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={34} />
          </div>
          <CardTitle className="mt-6 text-3xl">Nộp hồ sơ thành công</CardTitle>
          <CardDescription className="mt-3">Mã hồ sơ của bạn là:</CardDescription>
          <p className="mt-4 rounded-2xl bg-school-50 p-4 text-2xl font-black text-school-900">{applicationCode}</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Vui lòng lưu mã hồ sơ để tra cứu trạng thái cùng số định danh và ngày sinh.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/tra-cuu"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-school-700 px-4 text-sm font-semibold text-white transition hover:bg-school-900"
            >
              Tra cứu hồ sơ
            </Link>
            <Link
              href="/dang-ky"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Nộp hồ sơ khác
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
