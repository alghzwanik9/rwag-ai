"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Image from "next/image";

export default function Header() {
  const { user } = useUser();
  const pathname = usePathname();
  
  if (pathname.startsWith('/ar/')) {
    return null;
  }
  
  const getPageTitle = () => {
    if (pathname === '/settings') return 'إعدادات الحساب';
    if (pathname === '/assets') return 'مكتبة الأصول';
    if (pathname === '/team') return 'إدارة الفريق';
    if (pathname === '/projects') return 'مشاريعي';
    if (pathname === '/studio2d') return 'استوديو توليد الصور 2D';
    return 'مشروع التصميم الداخلي';
  };

  return (
    <header className="fixed top-0 left-0 right-0 md:right-[280px] h-toolbar-width bg-surface-bright dark:bg-surface-dim border-b border-outline-variant flex justify-between items-center px-container-padding z-40">
      <div className="flex items-center gap-4">
        <span className="font-headline-md text-headline-md font-bold text-on-surface">{getPageTitle()}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/80 shadow-xs">
          <div className="h-7 w-7 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold text-xs overflow-hidden">
            {user?.imageUrl ? (
              <Image alt="User" className="h-full w-full object-cover" src={user.imageUrl} width={28} height={28} />
            ) : (
              <span>{user?.firstName?.charAt(0) || "U"}</span>
            )}
          </div>
          <span className="text-xs font-bold text-on-surface">
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "المصمم"}
          </span>
        </div>
      </div>
    </header>
  );
}
