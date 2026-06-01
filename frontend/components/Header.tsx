"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

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
    return 'مشروع التصميم الداخلي';
  };

  return (
    <header className="fixed top-0 left-0 right-0 md:right-[280px] h-toolbar-width bg-surface-bright dark:bg-surface-dim border-b border-outline-variant flex justify-between items-center px-container-padding z-40">
      <div className="flex items-center gap-4">
        <span className="font-headline-md text-headline-md font-bold text-on-surface">{getPageTitle()}</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
          </button>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined" data-icon="history">history</span>
          </button>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined" data-icon="help">help</span>
          </button>
        </div>
        <div className="h-9 w-9 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant">
          {user?.imageUrl ? (
            <img alt="User" className="h-full w-full object-cover" src={user.imageUrl} />
          ) : (
            <span className="text-sm font-bold text-on-surface-variant">{user?.firstName?.charAt(0) || "U"}</span>
          )}
        </div>
      </div>
    </header>
  );
}
