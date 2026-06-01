"use client";

import React, { useState } from 'react';
import { useUser } from "@clerk/nextjs";

export default function SettingsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('profile');

  const tabClass = (id: string) => {
    const active = activeTab === id;
    return `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full text-right ${
      active
        ? 'bg-secondary-container text-secondary'
        : 'text-on-surface-variant hover:bg-surface-container'
    }`;
  };

  return (
    <main className="fixed top-[64px] left-0 right-[280px] bottom-0 bg-surface overflow-y-auto" dir="rtl">
      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <h2 className="font-headline-lg font-bold text-on-surface">إعدادات الحساب</h2>
          <p className="text-on-surface-variant font-body-md mt-1">إدارة معلوماتك الشخصية وتفضيلاتك.</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Tabs */}
          <div className="col-span-3 flex flex-col gap-1">
            {[
              { id: 'profile', icon: 'person', label: 'الملف الشخصي' },
              { id: 'preferences', icon: 'palette', label: 'التفضيلات' },
              { id: 'notifications', icon: 'notifications', label: 'الإشعارات' },
              { id: 'security', icon: 'shield', label: 'الأمان' },
            ].map(tab => (
              <button key={tab.id} className={tabClass(tab.id)} onClick={() => setActiveTab(tab.id)}>
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="col-span-9">
            {activeTab === 'profile' && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
                <h3 className="font-headline-sm font-bold text-on-surface mb-6">المعلومات الشخصية</h3>
                
                {/* Avatar + Name */}
                <div className="flex items-center gap-6 mb-8 p-5 bg-surface-container-low rounded-xl border border-outline-variant">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-outline-variant bg-surface-container flex items-center justify-center">
                      {user?.imageUrl ? (
                        <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-on-surface-variant">{user?.firstName?.charAt(0) || "U"}</span>
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 bg-secondary text-white p-1.5 rounded-full shadow-md hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                  </div>
                  <div>
                    <p className="font-headline-sm font-bold text-on-surface">{user?.fullName || "المستخدم"}</p>
                    <p className="text-sm text-on-surface-variant mt-0.5">مصمم داخلي رئيسي</p>
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant block">الاسم الكامل</label>
                    <input
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                      type="text"
                      defaultValue={user?.fullName || ""}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant block">البريد الإلكتروني</label>
                    <input
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
                      type="email"
                      defaultValue={user?.primaryEmailAddress?.emailAddress || ""}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant block">نبذة تعريفية</label>
                    <textarea
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all resize-none"
                      rows={3}
                      defaultValue="مصمم متخصص في المساحات السكنية العصرية مع التركيز على الاستدامة والمواد الطبيعية."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                  <button className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container transition-colors">إلغاء</button>
                  <button className="px-5 py-2.5 rounded-xl bg-secondary text-white text-sm font-bold hover:bg-secondary/90 transition-colors">حفظ التغييرات</button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
                <h3 className="font-headline-sm font-bold text-on-surface mb-6">تفضيلات التصميم</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-bold text-on-surface-variant mb-3">وحدات القياس</p>
                    <div className="flex gap-4">
                      {['نظام متري (م، سم)', 'نظام إمبراطوري (قدم، بوصة)'].map((u, i) => (
                        <label key={i} className="flex-1 cursor-pointer">
                          <input defaultChecked={i === 0} className="hidden peer" name="unit" type="radio" />
                          <div className="p-4 border border-outline-variant rounded-xl peer-checked:border-secondary peer-checked:bg-secondary-container/30 flex justify-between items-center transition-all">
                            <span className="text-sm text-on-surface">{u}</span>
                            <span className="material-symbols-outlined text-secondary text-[18px] opacity-0 peer-checked:opacity-100" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
                <h3 className="font-headline-sm font-bold text-on-surface mb-6">إشعارات النظام</h3>
                <div className="divide-y divide-outline-variant">
                  {[
                    { label: 'تحديثات المشروع', desc: 'عند تعديل أحد أعضاء الفريق' },
                    { label: 'تعليقات العملاء', desc: 'تنبيهات عند وصول ملاحظة جديدة' },
                    { label: 'الذكاء الاصطناعي', desc: 'عند اكتمال معالجة التصاميم' },
                  ].map((n, i) => (
                    <div key={i} className="py-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-on-surface">{n.label}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{n.desc}</p>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input defaultChecked className="rounded border-outline-variant text-secondary focus:ring-secondary" type="checkbox" />
                          تطبيق
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input className="rounded border-outline-variant text-secondary focus:ring-secondary" type="checkbox" />
                          إيميل
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
                <h3 className="font-headline-sm font-bold text-on-surface mb-4">الأمان والخصوصية</h3>
                <p className="text-on-surface-variant text-sm">هذه الصفحة قيد التطوير...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
