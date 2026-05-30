import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { getActiveSeason } from "@/lib/season";
import { RegisterWizard } from "./RegisterWizard";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const season = await getActiveSeason();
  const subjectOptions = season.subjectOptions.map((option) => ({
    optionNumber: option.optionNumber,
    subjects: option.subjects,
    name: option.name,
  }));

  return (
    <main className="min-h-screen">
      <PublicHeader />
      <section className="page-container py-8 sm:py-12">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Đăng ký dự tuyển</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Đăng ký dự tuyển vào lớp 10</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Vui lòng nhập đầy đủ thông tin và tải lên hồ sơ minh chứng trước khi nộp.
          </p>
        </div>
        <RegisterWizard subjectOptions={subjectOptions} />
      </section>
      <PublicFooter />
    </main>
  );
}
