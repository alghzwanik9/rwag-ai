'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MAARAD_CATEGORIES,
  MAARAD_ROOMS,
  MaaradCategory,
  MaaradRoom,
} from '@/lib/maaradRooms';
import MaaradCard from '@/components/maarad/MaaradCard';
import PromptModal from '@/components/maarad/PromptModal';
import ItemsModal from '@/components/maarad/ItemsModal';

type SortOption = 'featured' | 'budget-asc' | 'budget-desc' | 'area-desc';

export default function MaaradClient() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | MaaradCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  const [activePromptRoom, setActivePromptRoom] = useState<MaaradRoom | null>(null);
  const [activeItemsRoom, setActiveItemsRoom] = useState<MaaradRoom | null>(null);

  // Filter and Sort rooms
  const filteredRooms = useMemo(() => {
    return MAARAD_ROOMS.filter((room) => {
      const matchCategory = selectedCategory === 'all' || room.category === selectedCategory;
      const matchQuery =
        searchQuery.trim() === '' ||
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        room.prompt.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchQuery;
    }).sort((a, b) => {
      if (sortOption === 'budget-asc') return a.estimatedCost - b.estimatedCost;
      if (sortOption === 'budget-desc') return b.estimatedCost - a.estimatedCost;
      if (sortOption === 'area-desc') return b.dimensions.area - a.dimensions.area;
      return 0; // 'featured' preserves default curated order
    });
  }, [selectedCategory, searchQuery, sortOption]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0E1015] text-rwaq-ink flex flex-col font-sans selection:bg-rwaq-gold/30 selection:text-rwaq-gold">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0E1015]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="text-2xl font-bold text-rwaq-gold transition-all group-hover:drop-shadow-[0_0_12px_rgba(232,196,136,0.5)]">
                رواق
              </span>
              <span className="h-4 w-px bg-white/20" />
              <span className="font-tech text-xs tracking-wider uppercase text-rwaq-ink-faint">
                SHOWROOM
              </span>
            </Link>
            <span className="hidden sm:inline-block rounded-full border border-rwaq-gold/20 bg-rwaq-gold/10 px-2.5 py-0.5 text-[11px] font-medium text-rwaq-gold">
              معرض التصاميم 🏛️
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium text-rwaq-ink-muted hover:text-rwaq-ink hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              <span>الرئيسية</span>
            </Link>

            <Link
              href="/studio"
              className="inline-flex items-center gap-2 rounded-xl bg-rwaq-gold px-4 py-2 text-xs font-bold text-[#0E1015] hover:bg-rwaq-gold/90 transition-all shadow-md shadow-rwaq-gold/20 active:scale-95"
            >
              <span>دخول الاستوديو 3D</span>
              <span className="material-symbols-outlined text-[16px]">view_in_ar</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-[#141821] to-[#0E1015] py-14 sm:py-20 px-5 sm:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 h-64 w-64 rounded-full bg-rwaq-gold/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-4xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-rwaq-gold/30 bg-rwaq-gold/10 px-4 py-1.5 text-xs font-semibold text-rwaq-gold">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>مساحات معمارية مجهزة بنماذج 3D حقيقية وقابلة للتعديل</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            معرض تصاميم <span className="text-rwaq-gold">رواق المعماري</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-rwaq-ink-muted leading-relaxed">
            استكشف أحدث المساحات المصممة بواسطة محرك التوزيع الفراغي. يمكنك معاينة الأبعاد، نسخ برومبت التوليد، أو فتح أي تصميم بنقرة واحدة وتعديله داخل الاستوديو التفاعلي 3D.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="sticky top-18 z-30 border-b border-white/10 bg-[#0E1015]/95 backdrop-blur-md py-4 px-5 sm:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex w-full md:w-auto items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {MAARAD_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-rwaq-gold text-[#0E1015] font-bold shadow-sm shadow-rwaq-gold/30'
                      : 'border border-white/10 bg-white/[0.02] text-rwaq-ink-muted hover:border-white/20 hover:text-rwaq-ink'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                  <span>{cat.labelAr}</span>
                </button>
              );
            })}
          </div>

          {/* Search + Sort */}
          <div className="flex w-full md:w-auto items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-rwaq-ink-faint text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الطراز أو البرومبت..."
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-9 pl-3 text-xs text-rwaq-ink placeholder:text-rwaq-ink-faint focus:border-rwaq-gold/60 focus:outline-none focus:ring-1 focus:ring-rwaq-gold/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="مسح البحث"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-rwaq-ink-faint hover:text-rwaq-ink"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Sort Select */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              aria-label="ترتيب النتائج"
              className="rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-xs text-rwaq-ink focus:border-rwaq-gold/60 focus:outline-none"
            >
              <option value="featured" className="bg-[#121620] text-rwaq-ink">الموصى به</option>
              <option value="budget-asc" className="bg-[#121620] text-rwaq-ink">الميزانية: الأقل أولاً</option>
              <option value="budget-desc" className="bg-[#121620] text-rwaq-ink">الميزانية: الأعلى أولاً</option>
              <option value="area-desc" className="bg-[#121620] text-rwaq-ink">المساحة: الأكبر أولاً</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Gallery Section */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-5 sm:px-8 py-10">
        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-rwaq-ink-muted">
            عرض <span className="font-bold text-rwaq-ink">{filteredRooms.length}</span> من أصل{' '}
            <span className="font-bold text-rwaq-ink">{MAARAD_ROOMS.length}</span> تصاميم معمارية
          </p>

          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-xs text-rwaq-gold hover:underline"
            >
              عرض الكل
            </button>
          )}
        </div>

        {/* Gallery Grid */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <MaaradCard
                key={room.id}
                room={room}
                onViewPrompt={(r) => setActivePromptRoom(r)}
                onViewItems={(r) => setActiveItemsRoom(r)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.01] py-16 px-4 text-center">
            <span className="material-symbols-outlined text-[48px] text-rwaq-ink-faint mb-3">
              search_off
            </span>
            <h3 className="text-base font-bold text-rwaq-ink">لم يتم العثور على تصاميم مطابقة</h3>
            <p className="text-xs text-rwaq-ink-muted mt-1 max-w-sm">
              جرب تغيير عبارة البحث أو اختيار تصنيف آخر لاستعراض التصاميم المتاحة.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-4 rounded-xl border border-rwaq-gold/40 bg-rwaq-gold/10 px-4 py-2 text-xs font-semibold text-rwaq-gold hover:bg-rwaq-gold/20 transition-colors"
            >
              إعادة ضبط التصفية
            </button>
          </div>
        )}

        {/* Custom Design Callout Banner */}
        <div className="mt-16 relative overflow-hidden rounded-3xl border border-rwaq-gold/30 bg-gradient-to-r from-rwaq-surface via-[#171D28] to-[#121620] p-8 sm:p-10">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-tech uppercase tracking-wider text-rwaq-gold">
                أستوديو الذكاء الاصطناعي التوليدي
              </span>
              <h2 className="text-2xl font-bold text-white">
                هل لديك فكرة أو أبعاد مساحة خاصة بك؟
              </h2>
              <p className="text-xs sm:text-sm text-rwaq-ink-muted leading-relaxed">
                ادخل إلى أستوديو رواق واكتب وصف مساحتك بالعربية أو ارفع صورة لمخططك، وسيتولى المحرك الذكي توزيع الأثاث وحساب التكلفة بدقة.
              </p>
            </div>

            <Link
              href="/studio"
              className="inline-flex items-center gap-2 rounded-2xl bg-rwaq-gold px-6 py-3.5 text-sm font-bold text-[#0E1015] hover:bg-rwaq-gold/90 transition-all shadow-lg shadow-rwaq-gold/25 shrink-0"
            >
              <span>ابدأ تصميم غرفتك الخاصة</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#090B0F] py-8 px-5 sm:px-8 text-center text-xs text-rwaq-ink-faint">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            جميع الحقوق محفوظة © {new Date().getFullYear()} منصة رواق (Rwaq AI) — التصميم الفراغي بالذكاء الاصطناعي
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-rwaq-gold transition-colors">الرئيسية</Link>
            <Link href="/studio" className="hover:text-rwaq-gold transition-colors">الاستوديو</Link>
            <Link href="/privacy" className="hover:text-rwaq-gold transition-colors">الخصوصية والشروط</Link>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PromptModal
        room={activePromptRoom}
        onClose={() => setActivePromptRoom(null)}
      />
      <ItemsModal
        room={activeItemsRoom}
        onClose={() => setActiveItemsRoom(null)}
      />
    </div>
  );
}
