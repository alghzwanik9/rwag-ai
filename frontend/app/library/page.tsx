"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

interface ArchitecturalStyle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  hero_image_url: string;
  era: string;
  region: string;
  core_materials: string[];
  characteristics: string[];
  examples: string[];
}

const ARCHITECTURAL_STYLES: ArchitecturalStyle[] = [
  {
    id: "style_minimalism",
    title: "Minimalism (البساطة)",
    slug: "minimalism",
    summary: "التركيز على الفراغ، الخطوط النظيفة، والتخلص من التفاصيل الزائدة لخلق شعور بالهدوء والاتساع.",
    content: "تعتمد الفلسفة البسيطة (Minimalism) على مبدأ 'الأقل هو الأكثر' (Less is more). تسعى لتجريد المساحات من العناصر غير الضرورية والتركيز على الضوء الطبيعي والمساحة الفارغة. الألوان تكون محايدة وهادئة، والمواد ناعمة وعالية الجودة، مما يساعد على تصفية الذهن وتقليل التشتت البصري.",
    hero_image_url: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800&auto=format&fit=crop",
    era: "حديث (Modern)",
    region: "عالمي (Global)",
    core_materials: ["خشب طبيعي فاتح", "خرسانة ناعمة", "زجاج", "أقمشة كتان"],
    characteristics: [
      "لوحة ألوان أحادية أو محايدة (أبيض، رمادي، بيج)",
      "أثاث منخفض وخطوط مستقيمة وواضحة",
      "التركيز على الضوء الطبيعي والنوافذ الكبيرة",
      "فراغات مفتوحة وخالية من الإكسسوارات الزائدة"
    ],
    examples: [
      "منازل John Pawson السكنية",
      "الفلسفة اليابانية Zen في التصميم الداخلي"
    ]
  },
  {
    id: "style_bauhaus",
    title: "Bauhaus (باوهاوس)",
    slug: "bauhaus",
    summary: "دمج الفن بالصناعة والوظيفة بالجمال، مع التركيز على الأشكال الهندسية والمواد الصناعية الحديثة.",
    content: "مدرسة باوهاوس الألمانية غيرت مفهوم التصميم من خلال دمج الجانب العملي والجمالي (Form follows function). المساحات هنا ذكية، هندسية، وتستخدم التكنولوجيا والمواد الحديثة كأنابيب الصلب والزجاج المقوى. الألوان جريئة والخطوط هندسية بحتة.",
    hero_image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800&auto=format&fit=crop",
    era: "منتصف القرن العشرين (Mid-Century)",
    region: "أوروبا (Europe)",
    core_materials: ["أنابيب صلب كروم", "جلد أسود", "زجاج مقوى", "خشب رقائقي"],
    characteristics: [
      "الوظيفة تسبق الشكل الجمالي (مساحات عملية جداً)",
      "أشكال هندسية واضحة (مربعات، دوائر، خطوط متوازية)",
      "استخدام الألوان الأساسية كلون لهجة (أحمر، أزرق، أصفر) مع خلفية رمادية أو بيضاء",
      "أثاث خفيف الوزن وقابل للتكديس أو التفكيك"
    ],
    examples: [
      "كرسي Wassily الشهير من تصميم Marcel Breuer",
      "مباني Walter Gropius في ديساو"
    ]
  },
  {
    id: "style_biophilic",
    title: "Biophilic Design (التصميم الحيوي)",
    slug: "biophilic",
    summary: "دمج الطبيعة في البيئة المبنية لتعزيز الصحة النفسية والجسدية والترابط مع الكائنات الحية.",
    content: "يسعى التصميم الحيوي لإعادة ربط الإنسان بالطبيعة داخل بيئته المعيشية. يتم تحقيق ذلك من خلال إدخال النباتات الحية، جدران المياه، استخدام الخامات العضوية غير المعالجة، ومحاكاة الأنماط الطبيعية والتهوية والإضاءة الطبيعية المتغيرة.",
    hero_image_url: "https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?q=80&w=800&auto=format&fit=crop",
    era: "معاصر (Contemporary)",
    region: "عالمي (Global)",
    core_materials: ["أخشاب غير معالجة", "أحجار طبيعية", "خيزران", "نباتات حية كثيفة"],
    characteristics: [
      "دمج مكثف للنباتات والحدائق العمودية داخل الغرف",
      "أشكال عضوية ومنحنية مستوحاة من الطبيعة (تجنب الحواف الحادة)",
      "ألوان ترابية مستوحاة من الغابات والصخور والمياه",
      "استغلال مسارات التهوية والضوء الطبيعي لمحاكاة الخارج"
    ],
    examples: [
      "مكاتب Amazon Spheres في سياتل",
      "فلسفة العمارة العضوية لـ Frank Lloyd Wright"
    ]
  },
  {
    id: "style_midcentury",
    title: "Mid-Century Modern (مودرن منتصف القرن)",
    slug: "mid-century",
    summary: "مزيج فريد من المنحنيات العضوية والخطوط الهندسية مع ألوان دافئة وتركيز كبير على الراحة والاستخدام اليومي.",
    content: "اشتهر هذا الأسلوب في فترة ما بعد الحرب العالمية الثانية وحتى الستينيات. يتميز بالأثاث الخشبي الأنيق ذو الأرجل المدببة، والمنحنيات الانسيابية، والدمج السلس بين الفراغ الداخلي والخارجي، مع لمسات لونية دافئة ومميزة.",
    hero_image_url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=800&auto=format&fit=crop",
    era: "منتصف القرن العشرين (Mid-Century)",
    region: "أمريكا الشمالية (North America)",
    core_materials: ["خشب الساج (Teak)", "خشب الجوز (Walnut)", "بلاستيك مقوى", "نحاس"],
    characteristics: [
      "أثاث مرتفع عن الأرض بأرجل خشبية مدببة ومائلة",
      "منحنيات عضوية ناعمة مدمجة مع خطوط هندسية",
      "ألوان دافئة مميزة (أصفر خردلي، أخضر زيتوني، برتقالي محروق)",
      "نوافذ ممتدة من الأرض إلى السقف لربط الحديقة بالغرفة"
    ],
    examples: [
      "كرسي Eames Lounge الشهير مع مسند القدمين",
      "تصاميم منازل Case Study Houses في كاليفورنيا"
    ]
  },
  {
    id: "style_brutalism",
    title: "Brutalism (العمارة التعبيرية الخشنة)",
    slug: "brutalism",
    summary: "إبراز قوة الخامات الهيكلية وخاصة الخرسانة المكشوفة والحديد، لخلق فراغات تتسم بالجرأة والصلابة البصرية.",
    content: "نشأت من الكلمة الفرنسية 'béton brut' وتعني الخرسانة الخام. يركز التصميم الداخلي الوحشي على إبراز جمال الهيكل الإنشائي دون تجميل أو تزييف: جدران خرسانية رمادية، أسطح فولاذية صدئة، كتل أثاث حجرية ضخمة مع أقمشة دافئة لخلق تباين حميمي.",
    hero_image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop",
    era: "حديث (Modern)",
    region: "أوروبا (Europe)",
    core_materials: ["خرسانة مكشوفة", "حديد أسود صدئ", "حجر خشن", "ألياف صوفية سميكة"],
    characteristics: [
      "أسطح خشنة وغير مكتملة مع إبراز عروق الخرسانة والقوالب الخشبية",
      "أثاث ضخم وثقيل ذو كتل مستطيلة صلبة",
      "لوحة ألوان رمادية وأرضية مدعمة بلمسات خشبية داكنة للدفء",
      "تصميم إضاءة دراماتيكي يركز على الظلال والزوايا القوية"
    ],
    examples: [
      "تصاميم المصمم الراحل Le Corbusier السكنية",
      "ديكورات المكاتب المعاصرة ذات النمط الصناعي الجريء"
    ]
  }
];

export default function ArchitecturalLibrary() {
  const [search, setSearch] = useState("");
  const [selectedEra, setSelectedEra] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [selectedMaterial, setSelectedMaterial] = useState("All");
  const [selectedStyle, setSelectedStyle] = useState<ArchitecturalStyle | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter Categories
  const eras = ["All", "حديث (Modern)", "منتصف القرن العشرين (Mid-Century)", "معاصر (Contemporary)"];
  const regions = ["All", "عالمي (Global)", "أوروبا (Europe)", "أمريكا الشمالية (North America)"];
  const materials = [
    "All",
    "خشب طبيعي فاتح",
    "خشب الجوز (Walnut)",
    "خرسانة ناعمة",
    "نباتات حية كثيفة",
    "حديد أسود صدئ",
    "خشب الساج (Teak)",
    "أنابيب صلب كروم"
  ];

  // Filter Logic
  const filteredStyles = useMemo(() => {
    return ARCHITECTURAL_STYLES.filter((style) => {
      const matchesSearch =
        style.title.toLowerCase().includes(search.toLowerCase()) ||
        style.summary.toLowerCase().includes(search.toLowerCase()) ||
        style.content.toLowerCase().includes(search.toLowerCase());

      const matchesEra = selectedEra === "All" || style.era === selectedEra;
      const matchesRegion = selectedRegion === "All" || style.region === selectedRegion;
      const matchesMaterial =
        selectedMaterial === "All" || style.core_materials.includes(selectedMaterial);

      return matchesSearch && matchesEra && matchesRegion && matchesMaterial;
    });
  }, [search, selectedEra, selectedRegion, selectedMaterial]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleShare = (slug: string) => {
    const shareUrl = `${window.location.origin}/library?reference=${slug}`;
    navigator.clipboard.writeText(shareUrl);
    showToast("📋 تم نسخ رابط الفلسفة إلى الحافظة!");
  };

  return (
    <main className="fixed top-[64px] left-0 right-0 md:right-[280px] bottom-0 bg-[#F5F7FA] overflow-y-auto px-4 md:px-8 py-6 md:py-10" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#1E1E1E] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/10 animate-bounce">
          <span className="material-symbols-outlined text-[#4A90E2]">info</span>
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#1E1E1E] mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4A90E2] text-3xl">menu_book</span>
            مكتبة الفلسفات والأنماط المعمارية
          </h1>
          <p className="text-gray-500 text-sm">تصفح المدارس الفنية وتصاميم الهوية المعمارية لتستلهم منها لتصاميمك القادمة.</p>
        </div>
        <Link 
          href="/studio" 
          className="bg-[#1E1E1E] hover:bg-[#2d2d2d] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:scale-105"
        >
          <span className="material-symbols-outlined text-sm">home_pin</span>
          الذهاب للاستوديو 3D
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-white p-4 rounded-2xl shadow-md border border-gray-100">
        {/* Search */}
        <div className="flex bg-[#F5F7FA] rounded-xl overflow-hidden border border-gray-200 focus-within:border-[#4A90E2] p-1">
          <span className="material-symbols-outlined p-2 text-gray-400">search</span>
          <input
            type="text"
            placeholder="ابحث عن نمط أو فلسفة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 px-2"
          />
        </div>

        {/* Era Filter */}
        <div className="flex flex-col gap-1">
          <select
            value={selectedEra}
            onChange={(e) => setSelectedEra(e.target.value)}
            className="w-full bg-[#F5F7FA] border border-gray-200 rounded-xl p-3 text-sm focus:border-[#4A90E2] focus:ring-0"
          >
            <option value="All">كل الحقبات الزمنية</option>
            {eras.filter(e => e !== "All").map((e, idx) => (
              <option key={idx} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Region Filter */}
        <div className="flex flex-col gap-1">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full bg-[#F5F7FA] border border-gray-200 rounded-xl p-3 text-sm focus:border-[#4A90E2] focus:ring-0"
          >
            <option value="All">كل المناطق الجغرافية</option>
            {regions.filter(r => r !== "All").map((r, idx) => (
              <option key={idx} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Material Filter */}
        <div className="flex flex-col gap-1">
          <select
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            className="w-full bg-[#F5F7FA] border border-gray-200 rounded-xl p-3 text-sm focus:border-[#4A90E2] focus:ring-0"
          >
            <option value="All">كل المواد والخامات الأساسية</option>
            {materials.filter(m => m !== "All").map((m, idx) => (
              <option key={idx} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Styles */}
      {filteredStyles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-md flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">search_off</span>
          <h3 className="font-bold text-lg text-gray-700 mb-2">لا توجد نتائج مطابقة لبحثك</h3>
          <p className="text-gray-400 text-sm mb-4">جرب البحث بكلمات أخرى أو قم بإلغاء التصفية.</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedEra("All");
              setSelectedRegion("All");
              setSelectedMaterial("All");
            }}
            className="text-[#4A90E2] hover:text-[#357abd] font-bold text-sm underline flex items-center gap-1"
          >
            مسح التصفية
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredStyles.map((style) => (
            <div
              key={style.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col"
            >
              {/* Card Image */}
              <div className="relative h-48 w-full overflow-hidden bg-gray-200">
                <img
                  src={style.hero_image_url}
                  alt={style.title}
                  className="object-cover w-full h-full hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-md">
                  {style.era}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 grow flex flex-col">
                <h3 className="font-headline-md font-bold text-[#1E1E1E] mb-2">{style.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-3 mb-4">{style.summary}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {style.core_materials.slice(0, 3).map((mat, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-md font-medium"
                    >
                      {mat}
                    </span>
                  ))}
                  {style.core_materials.length > 3 && (
                    <span className="bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded-md font-medium">
                      +{style.core_materials.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2 justify-between">
                  <button
                    onClick={() => setSelectedStyle(style)}
                    className="text-gray-700 hover:text-black font-bold text-xs bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    التفاصيل الفلسفية
                  </button>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleShare(style.slug)}
                      className="text-gray-500 hover:text-black bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg transition-colors"
                      title="نسخ الرابط ومشاركته"
                    >
                      <span className="material-symbols-outlined text-[18px]">share</span>
                    </button>
                    
                    <Link
                      href={`/studio?reference=${style.slug}`}
                      className="bg-[#4A90E2] hover:bg-[#357abd] text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">brush</span>
                      استخدم في الاستوديو
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Style Details Modal */}
      {selectedStyle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-150 animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-slide-up border border-gray-100">
            {/* Image Header */}
            <div className="relative h-64 bg-gray-200 shrink-0">
              <img
                src={selectedStyle.hero_image_url}
                alt={selectedStyle.title}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                <div>
                  <div className="bg-[#4A90E2] text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2 shadow-md">
                    {selectedStyle.era} • {selectedStyle.region}
                  </div>
                  <h2 className="text-2xl font-black text-white">{selectedStyle.title}</h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedStyle(null)}
                className="absolute top-4 left-4 bg-white/80 hover:bg-white text-gray-700 hover:text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto grow flex flex-col gap-6 custom-scrollbar text-right">
              {/* Philosophy Content */}
              <div>
                <h4 className="font-bold text-[#1E1E1E] text-base mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <span className="material-symbols-outlined text-[#4A90E2] text-lg">psychology</span>
                  فلسفة ونشأة التصميم
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedStyle.content}</p>
              </div>

              {/* Characteristics */}
              <div>
                <h4 className="font-bold text-[#1E1E1E] text-base mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <span className="material-symbols-outlined text-[#4A90E2] text-lg">featured_play_list</span>
                  أبرز الخصائص والسمات الفنية
                </h4>
                <ul className="list-disc list-inside text-gray-600 text-sm flex flex-col gap-1.5 pr-2">
                  {selectedStyle.characteristics.map((char, index) => (
                    <li key={index} className="leading-relaxed">{char}</li>
                  ))}
                </ul>
              </div>

              {/* Materials */}
              <div>
                <h4 className="font-bold text-[#1E1E1E] text-base mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <span className="material-symbols-outlined text-[#4A90E2] text-lg">texture</span>
                  الخامات والمواد المستخدمة
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedStyle.core_materials.map((mat, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-xl border border-gray-200/50 font-bold"
                    >
                      {mat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notable Examples */}
              <div>
                <h4 className="font-bold text-[#1E1E1E] text-base mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <span className="material-symbols-outlined text-[#4A90E2] text-lg">foundation</span>
                  أبرز الأمثلة والمراجع المعمارية
                </h4>
                <ul className="list-disc list-inside text-gray-600 text-sm flex flex-col gap-1.5 pr-2">
                  {selectedStyle.examples.map((ex, index) => (
                    <li key={index} className="leading-relaxed">{ex}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between gap-4 shrink-0">
              <button
                onClick={() => handleShare(selectedStyle.slug)}
                className="text-gray-500 hover:text-black font-bold text-xs bg-white border border-gray-200 px-4 py-3 rounded-xl transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">share</span>
                مشاركة الرابط
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedStyle(null)}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs px-5 py-3 rounded-xl transition-all"
                >
                  إغلاق النافذة
                </button>
                <Link
                  href={`/studio?reference=${selectedStyle.slug}`}
                  className="bg-[#4A90E2] hover:bg-[#357abd] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">brush</span>
                  استخدم في الاستوديو 3D
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
