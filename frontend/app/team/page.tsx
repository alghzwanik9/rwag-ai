import { Users, UserPlus, ShieldAlert, Mail } from "lucide-react";
import Image from "next/image";
import { currentUser } from '@clerk/nextjs/server';

export default async function TeamPage() {
  const user = await currentUser();

  return (
    <main className="fixed top-[64px] left-0 right-[280px] bottom-0 bg-surface overflow-y-auto" dir="rtl">
      <div className="p-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-lg font-bold text-on-surface flex items-center gap-3">
              <Users className="w-7 h-7 text-secondary" />
              إدارة الفريق
            </h2>
            <p className="text-on-surface-variant font-body-md mt-1">إدارة صلاحيات الأعضاء ودعوة المصممين.</p>
          </div>
          <button
            disabled
            className="bg-surface-container border border-outline-variant text-on-surface-variant px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 cursor-not-allowed opacity-60"
          >
            <UserPlus className="w-4 h-4" />
            دعوة عضو (قريباً)
          </button>
        </div>

        {/* Team Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
            <p className="text-sm font-bold text-on-surface-variant">أعضاء مساحة العمل · 1 عضو</p>
          </div>

          {/* Current User Row */}
          <div className="px-6 py-5 flex items-center justify-between hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-4">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-outline-variant bg-surface-container">
                {user?.imageUrl ? (
                  <Image src={user.imageUrl} alt={user.fullName || "User"} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-bold">
                    {user?.firstName?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-on-surface">{user?.fullName || "أنت"}</p>
                <div className="flex items-center gap-1.5 text-on-surface-variant text-xs mt-0.5">
                  <Mail className="w-3 h-3" />
                  {user?.primaryEmailAddress?.emailAddress || "—"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-secondary bg-secondary-container px-3 py-1.5 rounded-full">
              <ShieldAlert className="w-3.5 h-3.5" />
              مالك
            </div>
          </div>

          {/* Empty State */}
          <div className="px-6 py-10 flex flex-col items-center justify-center text-center border-t border-outline-variant">
            <div className="w-14 h-14 bg-surface-container rounded-full flex items-center justify-center mb-3">
              <UserPlus className="w-7 h-7 text-outline" />
            </div>
            <p className="font-bold text-on-surface mb-1">لا يوجد أعضاء آخرون بعد</p>
            <p className="text-sm text-on-surface-variant max-w-xs">ستتمكن قريباً من دعوة زملائك للتعاون في الوقت الفعلي.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
