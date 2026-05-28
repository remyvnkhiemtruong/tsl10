import { AdminShell } from "@/components/AdminShell";
import { SchoolContactCard } from "@/components/SchoolContactCard";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getSchoolSettings } from "@/lib/school-settings";
import { SchoolSettingsForm } from "./SchoolSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSchoolSettings();
  return (
    <AdminShell>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Cấu hình</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Liên hệ và lịch tuyển sinh</h1>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <Card>
          <CardTitle>Cập nhật thông tin hiển thị</CardTitle>
          <CardDescription className="mt-1">Cấu hình này được dùng ở footer, đăng ký, tra cứu và công bố trúng tuyển.</CardDescription>
          <div className="mt-5">
            <SchoolSettingsForm initial={settings} />
          </div>
        </Card>
        <SchoolContactCard
          contact={settings.contact}
          leadershipContacts={settings.leadershipContacts}
          publicLeadershipPhones={settings.publicLeadershipPhones}
        />
      </div>
    </AdminShell>
  );
}
