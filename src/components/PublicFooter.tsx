import { SchoolContactCard } from "@/components/SchoolContactCard";
import { getSchoolSettings } from "@/lib/school-settings";

export async function PublicFooter() {
  const settings = await getSchoolSettings();
  return (
    <footer className="border-t border-slate-200 bg-white py-8">
      <div className="page-container">
        <SchoolContactCard
          contact={settings.contact}
          leadershipContacts={settings.leadershipContacts}
          publicLeadershipPhones={settings.publicLeadershipPhones}
          compact
        />
      </div>
    </footer>
  );
}
