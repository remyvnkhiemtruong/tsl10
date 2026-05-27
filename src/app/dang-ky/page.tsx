import { PublicHeader } from "@/components/PublicHeader";
import { RegisterWizard } from "./RegisterWizard";

export default function RegisterPage() {
  return (
    <main>
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-black text-slate-900">Đăng ký dự tuyển vào lớp 10</h1>
        <p className="mt-2 text-slate-600">
          Vui lòng nhập đầy đủ thông tin và tải lên hồ sơ minh chứng trước khi nộp.
        </p>
        <RegisterWizard />
      </div>
    </main>
  );
}
