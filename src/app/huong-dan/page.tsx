import { PublicHeader } from "@/components/PublicHeader";
import { Card } from "@/components/ui/card";

export default function GuidePage() {
  return (
    <main>
      <PublicHeader />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-black text-slate-900">Hướng dẫn đăng ký</h1>
        <div className="mt-6 grid gap-4">
          <Card>
            <h2 className="font-bold">1. Chuẩn bị hồ sơ</h2>
            <p className="mt-2 text-sm text-slate-600">
              Chuẩn bị ảnh 4x6, học bạ, giấy khai sinh hoặc CCCD/số định danh và minh chứng ưu tiên/khuyến khích nếu có.
            </p>
          </Card>
          <Card>
            <h2 className="font-bold">2. Điền thông tin</h2>
            <p className="mt-2 text-sm text-slate-600">
              Nhập thông tin học sinh, học tập THCS, liên hệ và chọn phương án môn học lớp 10.
            </p>
          </Card>
          <Card>
            <h2 className="font-bold">3. Nộp và tra cứu</h2>
            <p className="mt-2 text-sm text-slate-600">
              Sau khi nộp, lưu mã hồ sơ để tra cứu trạng thái xử lý bằng mã hồ sơ, số định danh và ngày sinh.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}
