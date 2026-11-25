"use client";

import React from "react";

export interface ArchitecturalStylePreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  wallColor: string;
  floorColor: string;
  ambientMode: "morning" | "rainy" | "midnight";
  palette: { name: string; hex: string }[];
  tags: string[];
  keyMaterials: string[];
  lighting: string;
  recommendedPrompt: string;
}

export const ARCHITECTURAL_STYLES: ArchitecturalStylePreset[] = [
  {
    id: "salmani",
    name: "الطراز السلماني الحديث",
    subtitle: "أصالة الحجر الرياضي مع رحابة المساحات المعاصرة",
    description: "مستوحى من كود العمارة السلمانية بالرياض؛ يجمع بين حجر الرياض الطبيعي، وفتحات النوافذ النحيفة، والألوان الرملية الدافئة مع لمسات خشب السنديان الداكن.",
    wallColor: "#EAE5DC",
    floorColor: "#A8937C",
    ambientMode: "morning",
    palette: [
      { name: "حجر كريمي", hex: "#EAE5DC" },
      { name: "بيج رملي", hex: "#D6C7AC" },
      { name: "سنديان داكن", hex: "#6E543C" },
      { name: "نحاس برونزي", hex: "#9E8256" },
    ],
    tags: ["عمارة سلمانية", "حجر طبيعي", "أصالة وهوية"],
    keyMaterials: ["حجر الرياض الطبيعي", "خشب سنديان أمريكي", "نحاس برونزي مطفي"],
    lighting: "إضاءة مخفية دافئة 2700K مع إبراز ملمس الحجر",
    recommendedPrompt: "مجلس بطراز العمارة السلمانية المعاصرة، جدران من حجر الرياض الفاتح، كنب فاخر بدرجات الرمل والبلوط، إضاءة كوف دافئة.",
  },
  {
    id: "neo-luxury",
    name: "النيومودرن الفاخر",
    subtitle: "فخامة الرخام والخطوط المعمارية الانسيابية",
    description: "تصميم راقٍ ومفتوح يرتكز على ألواح رخام كلكتا الكبيرة، أثاث منحني مودرن، لمسات برونزية لامعة، وإضاءة خطية مدروسة تعكس الفخامة الهادئة.",
    wallColor: "#F2EFEB",
    floorColor: "#7D7065",
    ambientMode: "morning",
    palette: [
      { name: "رخام كلكتا", hex: "#F2EFEB" },
      { name: "رمادي دافئ", hex: "#B8ADA2" },
      { name: "جوزي فاخر", hex: "#5C493B" },
      { name: "ذهب معتق", hex: "#C8A663" },
    ],
    tags: ["نيومودرن", "رخام فاخر", "إضاءة خطية"],
    keyMaterials: ["رخام إيطالي مصقول", "مخمل وبوكليه ناعم", "ألمنيوم ذهبي مطفي"],
    lighting: "سبوتلايت سقفية 3000K متناسقة مع إضاءة الثريا المعلقة",
    recommendedPrompt: "صالة استقبال نيومودرن فاخرة، أرضية رخام إيطالي لامع، كنب مقوس من قماش البوكليه، طاولة رخام وجدران تلبيس خشب.",
  },
  {
    id: "warm-japandi",
    name: "الياباندي الدافئ",
    subtitle: "البساطة الاسكندنافية بروح يابانية مسترخية",
    description: "فلسفة الهدوء الداخلي والتوازن؛ خطوط نظيفة، خشب بلوط فاتح طبيعي، سجاد قنب ناعم، ونباتات داخلية تجعل الغرفة متنفساً مريحاً للأعصاب.",
    wallColor: "#FAF8F5",
    floorColor: "#C2AF94",
    ambientMode: "morning",
    palette: [
      { name: "أبيض قطني", hex: "#FAF8F5" },
      { name: "بلوط فاتح", hex: "#D7C4A8" },
      { name: "أخضر زيتوني", hex: "#6B7560" },
      { name: "رمادي صخري", hex: "#4A4944" },
    ],
    tags: ["ياباندي", "طبيعي ومريح", "واحات نباتية"],
    keyMaterials: ["خشب بلوط غير معالج", "كتان طبيعي خام", "فخار وسيراميك يدوي"],
    lighting: "ضوء شمس طبيعي وافر مع فوانيس ورقية ناعمة",
    recommendedPrompt: "صالة جلوس بطراز ياباندي هادئ، أخشاب بلوط طبيعية، أريكة كتان بيج منخفضة، نباتات زيتون داخلية، نوافذ واسعة.",
  },
  {
    id: "andalus-majlis",
    name: "المجلس الأندلسي المعاصر",
    subtitle: "كرم الضيافة العربية وفخامة القناطر المنحوتة",
    description: "يمزج بين فخامة المجالس السعودية التقليدية والهندسة الأندلسية الحديثة؛ كنب كحلي ملكي عميق، تفاصيل ذهبية نحاسية، وأرضيات دافئة ترحب بالضيوف.",
    wallColor: "#EDE8E0",
    floorColor: "#9C826B",
    ambientMode: "morning",
    palette: [
      { name: "كحلي ملكي", hex: "#141E30" },
      { name: "ذهب معتق", hex: "#E8C488" },
      { name: "حجر جيري دافئ", hex: "#EDE8E0" },
      { name: "جوزي عميق", hex: "#9C826B" },
    ],
    tags: ["مجلس ضيافة", "أندلسي حديث", "فخامة عربية"],
    keyMaterials: ["مخمل ملكي مقاوم", "خشب جوز طبيعي", "نحاس مغربي محفور"],
    lighting: "ثريا نحاسية تراثية بتوزيع إضاءة محيطي فسيح",
    recommendedPrompt: "مجلس ضيافة عربي معاصر فسيح، كنب ثلاثي مخمل كحلي عميق، كراسي بلوط، طاولة حجرية دائرية، إضاءة دافئة 3000K.",
  },
];

interface InspirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyStyle: (style: ArchitecturalStylePreset) => void;
}

export default function InspirationModal({
  isOpen,
  onClose,
  onApplyStyle,
}: InspirationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl max-h-[85vh] rounded-3xl bg-surface border border-outline-variant/70 shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/50 px-6 py-4 bg-surface-container-low/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[24px]">palette</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                مراجع الإلهام والأنماط المعمارية
              </h2>
              <p className="text-xs text-on-surface-variant">
                أنماط معتمدة في السوق السعودي مع لوحات ألوان ومواد متكاملة بضغطة زر
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body: Grid of Architectural Presets */}
        <div className="grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-5 custom-scrollbar">
          {ARCHITECTURAL_STYLES.map((style) => (
            <div
              key={style.id}
              className="flex flex-col justify-between rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 hover:border-primary/50 hover:shadow-xl transition-all duration-300 group"
            >
              <div>
                {/* Title & Tags */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                      {style.name}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant line-clamp-1">
                      {style.subtitle}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary shrink-0">
                    {style.tags[0]}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  {style.description}
                </p>

                {/* Color Swatches */}
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-on-surface-variant block mb-1.5">
                    لوحة الألوان المعتمدة:
                  </span>
                  <div className="flex items-center gap-2">
                    {style.palette.map((c) => (
                      <div
                        key={c.hex}
                        className="flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface px-2 py-1 shadow-2xs"
                        title={`${c.name}: ${c.hex}`}
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[10px] font-medium text-on-surface">
                          {c.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Materials */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {style.keyMaterials.map((mat) => (
                    <span
                      key={mat}
                      className="rounded-md bg-surface-container-low px-2 py-0.5 text-[10px] text-on-surface-variant"
                    >
                      {mat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  onApplyStyle(style);
                  onClose();
                }}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary py-2.5 px-4 text-xs font-bold shadow-xs hover:opacity-95 active:scale-98 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>تطبيق هذا النمط على الغرفة فورياً</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
