import { Package, Plus, Search } from "lucide-react";
import Image from "next/image";

const MOCK_ASSETS = [
  { id: 1, name: "أريكة مودرن مريحة", category: "أثاث الجلوس", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80", price: "2,500 ر.س" },
  { id: 2, name: "طاولة طعام خشبية", category: "طاولات", image: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=400&q=80", price: "1,200 ر.س" },
  { id: 3, name: "كرسي استرخاء جلد", category: "كراسي", image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=400&q=80", price: "850 ر.س" },
  { id: 4, name: "نبتة زينة داخلية", category: "ديكورات", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=400&q=80", price: "150 ر.س" },
  { id: 5, name: "مصباح أرضي زجاجي", category: "إضاءة", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80", price: "400 ر.س" },
  { id: 6, name: "سرير مزدوج فاخر", category: "أثاث النوم", image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=400&q=80", price: "3,800 ر.س" },
];

export default function AssetsPage() {
  return (
    <main className="fixed top-[64px] left-0 right-[280px] bottom-0 bg-surface overflow-y-auto" dir="rtl">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-lg font-bold text-on-surface flex items-center gap-3">
              <Package className="w-7 h-7 text-secondary" />
              مكتبة الأصول
            </h2>
            <p className="text-on-surface-variant font-body-md mt-1">تصفح وأضف أحدث قطع الأثاث إلى مساحة عملك.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="ابحث عن أريكة، طاولة..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-full py-2.5 pr-11 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
            />
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {MOCK_ASSETS.map((asset) => (
            <div key={asset.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden group hover:border-secondary/50 hover:shadow-md transition-all">
              <div className="relative h-44 bg-surface-container overflow-hidden">
                <Image
                  src={asset.image}
                  alt={asset.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-on-surface border border-outline-variant">
                  {asset.category}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-label-md font-bold text-on-surface mb-1">{asset.name}</h3>
                <p className="text-secondary font-bold text-sm font-mono mb-4">{asset.price}</p>
                <button className="w-full bg-secondary-container text-on-secondary-container py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-secondary hover:text-white transition-colors">
                  <Plus className="w-4 h-4" />
                  إضافة للغرفة
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
