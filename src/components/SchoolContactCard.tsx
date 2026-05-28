import Link from "next/link";
import { Mail, MapPin, Phone, School, Users } from "lucide-react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { SchoolContact, SchoolLeadershipContact } from "@/lib/school-contact";

export function SchoolContactCard({
  contact,
  leadershipContacts,
  publicLeadershipPhones,
  compact,
}: {
  contact: SchoolContact;
  leadershipContacts: SchoolLeadershipContact[];
  publicLeadershipPhones: boolean;
  compact?: boolean;
}) {
  return (
    <Card className={compact ? "p-5" : undefined}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-school-50 text-school-700">
          <School size={20} />
        </div>
        <div>
          <CardTitle className="text-lg">Liên hệ {contact.schoolName}</CardTitle>
          {!compact && <CardDescription className="mt-1">{contact.note}</CardDescription>}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-700">
        <p className="flex gap-2">
          <MapPin size={16} className="mt-0.5 shrink-0 text-school-700" />
          <span>{contact.address}</span>
        </p>
        <p className="flex gap-2">
          <Mail size={16} className="mt-0.5 shrink-0 text-school-700" />
          <a className="font-semibold text-school-800 hover:underline" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        </p>
        {contact.phone && (
          <p className="flex gap-2">
            <Phone size={16} className="mt-0.5 shrink-0 text-school-700" />
            <a className="font-semibold text-school-800 hover:underline" href={`tel:${contact.phone}`}>
              {contact.phone}
            </a>
          </p>
        )}
        <p>
          Website:{" "}
          <Link href={contact.website} className="font-semibold text-school-800 hover:underline" target="_blank">
            {contact.website}
          </Link>
        </p>
      </div>

      {leadershipContacts.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <Users size={16} className="text-school-700" /> Ban giám hiệu/đầu mối lãnh đạo
          </p>
          <div className="mt-3 grid gap-2">
            {leadershipContacts.map((leader) => (
              <div key={`${leader.sortOrder}-${leader.name}`} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                <p className="font-semibold text-slate-950">
                  {leader.name} - {leader.title}
                </p>
                {leader.extraRole && <p className="mt-0.5 text-xs text-slate-500">{leader.extraRole}</p>}
                {publicLeadershipPhones && leader.publicContact && (
                  <p className="mt-1 text-xs font-semibold text-school-800">Liên hệ: {leader.publicContact}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
