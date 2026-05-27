import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function SuccessPage({ params }: { params: Promise<{ applicationCode: string }> }) {
  const { applicationCode } = await params;
  return (
    <main>
      <PublicHeader />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
            <CheckCircle2 size={34} />
          </div>
          <h1 className="mt-6 text-3xl font-black text-slate-900">Nộp hồ sơ thành công</h1>
          <p className="mt-3 text-slate-600">Mã hồ sơ của bạn là:</p>
          <p className="mt-3 rounded-lg bg-slate-100 p-4 text-2xl font-black text-school-900">{applicationCode}</p>
          <p className="mt-4 text-sm text-slate-600">
            Vui lòng lưu mã hồ sơ để tra cứu trạng thái cùng số định danh và ngày sinh.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/tra-cuu">
              <Button>Tra cứu hồ sơ</Button>
            </Link>
            <Link href="/dang-ky">
              <Button className="bg-slate-800 hover:bg-slate-900">Nộp hồ sơ khác</Button>
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
