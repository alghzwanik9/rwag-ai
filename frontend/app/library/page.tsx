"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSceneStore } from "@/lib/useSceneStore";

type LibraryTab = "styles" | "standards" | "lighting" | "materials";

const LIBRARY_TABS: { id: LibraryTab; icon: string; label: string }[] = [
  { id: "standards", icon: "straighten", label: "معايير الفراغات والقياسات (Neufert)" },
  { id: "styles", icon: "menu_book", label: "الفلسفات والمدارس المعمارية" },
  { id: "lighting", icon: "lightbulb", label: "هندسة الإضاءة المعمارية (Lux)" },
  { id: "materials", icon: "texture", label: "تناغم المواد وخامات PBR" },
];

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

interface RoomStandard {
  id: string;
  room_type: string;
  name_ar: string;
  description: string;
  anthropometrics: Record<string, string>;
  spatial_rules: string[];
  lighting_standards: {
    recommended_lux: number;
    color_temperature_k: number[];
    layers: Record<string, string>;
  };
  material_balance: {
    dominant_60: string;
    secondary_30: string;
    accent_10: string;
  };
  default_dims?: { width: number; depth: number };
}

interface RawBackendStandard {
  id?: string;
  room_type?: string;
  category?: string;
  name_ar?: string;
  description?: string;
  anthropometrics?: Record<string, unknown>;
  spatial_rules?: string[];
  lighting_standards?: {
    recommended_lux?: number;
    color_temperature_k?: number[];
    layers?: Record<string, string>;
  };
  material_balance?: {
    dominant_60?: string;
    secondary_30?: string;
    accent_10?: string;
  };
  default_dims?: { width: number; depth: number };
}

const ANTHROPOMETRIC_KEY_LABELS: Record<string, string> = {
  primary_walkway_min_m: "الممر الرئيسي",
  secondary_walkway_min_m: "الممر الثانوي",
  coffee_table_distance_to_sofa_m: "مسافة طاولة القهوة للكنب",
  sofa_to_armchair_conversation_distance_m: "مسافة المحادثة بين المقاعد",
  tv_viewing_distance_formula: "مسافة التلفاز الموصى بها",
  side_table_height_relative_to_armrest: "ارتفاع الطاولة الجانبية",
  area_per_person_m2: "المساحة لكل شخص",
  clearance_around_bed_sides_m: "الممر حول جانبي السرير",
  clearance_in_front_of_wardrobe_m: "الممر أمام خزانة الملابس",
  bed_to_tv_distance_min_m: "المسافة بين السرير والتلفاز",
  nightstand_height_relative_to_mattress: "ارتفاع الكومودينو",
  wardrobe_depth_standard_m: "عمق خزانة الملابس القياسي",
  clearance_behind_chair_to_wall_min_m: "خلوص خلف الكرسي للجدار",
  clearance_behind_chair_with_walkway_m: "خلوص خلف الكرسي مع ممر",
  table_width_per_diner_cm: "عرض الطاولة لكل شخص",
  table_depth_per_diner_cm: "عمق الطاولة لكل شخص",
  chandelier_height_above_table_cm: "ارتفاع الثريا فوق الطاولة",
  rug_extension_beyond_table_edges_min_cm: "امتداد السجادة حول الطاولة",
  counter_depth_standard_m: "عمق سطح العمل القياسي",
  counter_height_standard_m: "ارتفاع سطح العمل القياسي",
  aisle_width_between_counters_m: "الممر بين أسطح العمل",
  island_stool_clearance_m: "خلوص كراسي الجزيرة",
  work_triangle_perimeter_m: "محيط مثلث العمل الإجمالي",
  desk_depth_min_m: "عمق سطح المكتب الأدنى",
  desk_width_min_m: "عرض سطح المكتب الأدنى",
  chair_pullout_clearance_m: "مسافة رجوع الكرسي",
  walkway_behind_chair_m: "الممر خلف الكرسي",
  monitor_viewing_distance_cm: "مسافة الرؤية للشاشة",
};

const DEFAULT_DIMS_BY_ROOM_TYPE: Record<string, { width: number; depth: number }> = {
  living_room: { width: 5.5, depth: 5.0 },
  bedroom: { width: 4.8, depth: 4.5 },
  kitchen: { width: 4.5, depth: 4.0 },
  home_office: { width: 4.0, depth: 3.5 },
  dining_room: { width: 4.6, depth: 4.0 },
};

function formatAnthropometricValue(key: string, value: unknown): string {
  if (typeof value === "string") return value;
  const unit = key.endsWith("_cm") ? "سم" : key.endsWith("_m2") ? "م²" : "متر";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value} ${unit}`;
  }
  if (Array.isArray(value) && value.length >= 2) {
    return `${value[0]} إلى ${value[1]} ${unit}`;
  }
  return String(value ?? "");
}

function normalizeAnthropometrics(raw?: Record<string, unknown>): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const result: Record<string, string> = {};
  Object.entries(raw).forEach(([key, val]) => {
    const label = ANTHROPOMETRIC_KEY_LABELS[key] || key.replace(/_/g, " ");
    result[label] = formatAnthropometricValue(key, val);
  });
  return result;
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

const ROOM_STANDARDS: RoomStandard[] = [
  {
    id: "std_living_room",
    room_type: "living_room",
    name_ar: "الصالات وغرف المعيشة والمجالس",
    description: "معايير تصميم وتأثيث غرف المعيشة والصالات المفتوحة والمجالس وفق المعايير المعمارية العالمية (Neufert & Time-Saver Standards).",
    default_dims: { width: 5.5, depth: 5.0 },
    anthropometrics: {
      "الممر الرئيسي": "≥ 0.90 متر (90 سم)",
      "الممر الثانوي": "≥ 0.60 متر (60 سم)",
      "مسافة طاولة القهوة للكنب": "0.35 إلى 0.45 متر",
      "مسافة التلفاز الموصى بها": "بوصة الشاشة × 0.03 (مثلاً: 65 بوصة = 2.0 إلى 2.5م)",
      "ارتفاع الطاولة الجانبية": "مطابق لمسند ذراع الكنبة أو أقل بـ 5 سم"
    },
    spatial_rules: [
      "يجب ألا يقطع ممر الحركة الرئيسي مثلث المحادثة أو خط الرؤية بين الجالسين والتلفاز.",
      "يجب ترك مسافة لا تقل عن 10 إلى 15 سم بين أطراف السجادة والجدران لتأطير الفراغ.",
      "يجب أن تكون الأرجل الأمامية لجميع المقاعد والكنب موضوعة فوق السجادة الرئيسية لتوحيد الكتلة الفراغية.",
      "تجنب إلصاق جميع قطع الأثاث بالجدران (Floating Furniture) لإعطاء شعور بالفخامة والاتساع."
    ],
    lighting_standards: {
      recommended_lux: 150,
      color_temperature_k: [2700, 3000],
      layers: {
        "العامة (Ambient)": "إضاءة سقفية مخفية (Cove Lighting) بلون دافئ 2700-3000K لتهدئة الأجواء.",
        "الوظيفية (Task)": "إضاءة قراءة موجهة بجانب كراسي القراءة الفردية بـ 300 Lux.",
        "الجمالية (Accent)": "Spotlights بزاوية 30 درجة لإبراز اللوحات الفنية أو الجدران الديكورية."
      }
    },
    material_balance: {
      dominant_60: "الجدران والأرضيات (بيج دافئ، رمادي فاتح، أخشاب بلوط).",
      secondary_30: "أقمشة الكنب، السجاد، والستائر (كتان، بوكليه، جلد ناعم).",
      accent_10: "الوسائد، الطاولات الجانبية، الإكسسوارات المعدنية (برونز مطفي، رخام طبيعي)."
    }
  },
  {
    id: "std_bedroom",
    room_type: "bedroom",
    name_ar: "غرف النوم الرئيسية والأجنحة",
    description: "معايير تخطيط وتأثيث غرف النوم لتحقيق أقصى درجات الراحة النفسية والهدوء البصري وسلاسة الحركة.",
    default_dims: { width: 4.8, depth: 4.5 },
    anthropometrics: {
      "الممر حول جانبي السرير": "≥ 0.75 متر (75 سم)",
      "الممر أمام خزانة الملابس": "≥ 0.90 متر لفتح الأبواب بحرية",
      "المسافة بين السرير وشاشة التلفاز": "≥ 1.20 متر",
      "ارتفاع الكومودينو": "مطابق لسطح المرتبة أو أعلى بـ 2-5 سم",
      "عمق خزانة الملابس القياسي": "0.60 متر (60 سم)"
    },
    spatial_rules: [
      "السرير هو العنصر المحوري (Focal Point) ويجب أن يكون مرئياً بزاوية مريحة عند دخول الغرفة.",
      "تجنب وضع ظهر السرير مباشرة تحت نافذة نشطة إلا عند استخدام عوازل وستائر معتمة كاملة.",
      "استخدام السجاد أسفل السرير بحيث يمتد على الأقل 60-80 سم من جانبي السرير وأسفله لتوفير ملمس دافئ.",
      "توفير مسافة لا تقل عن 90 سم أمام خزانة الملابس لفتح الأبواب والأدراج بحرية تامة."
    ],
    lighting_standards: {
      recommended_lux: 100,
      color_temperature_k: [2400, 2700],
      layers: {
        "العامة (Ambient)": "إضاءة غير مباشرة (Indirect Cove/Dimmed) تدعم الاسترخاء والنوم.",
        "الوظيفية (Task)": "إضاءة قراءة جانبية على جانبي السرير قابلة للتحكم المستقل بـ 150-200 Lux.",
        "الجمالية (Accent)": "إضاءة داخلية في الخزائن ومسار حركة ليلي خافت للأرضيات."
      }
    },
    material_balance: {
      dominant_60: "الجدران المهدئة (أوف وايت، بيج ترابي) وأرضيات خشبية دافئة.",
      secondary_30: "مفارش السرير الكتانية، الستائر المعتمة المزدوجة، وظهر السرير المنجد.",
      accent_10: "أباجورات نحاسية مطفية، نباتات تنقية الهواء (Sansevieria)، ومرايا زخرفية."
    }
  },
  {
    id: "std_kitchen",
    room_type: "kitchen",
    name_ar: "المطابخ المعمارية والمساحات المفتوحة",
    description: "معايير تخطيط المطابخ المفتوحة ومثلث الحركة المريح لتحقيق كفاءة العمل وسلامة الاستخدام.",
    default_dims: { width: 4.5, depth: 4.0 },
    anthropometrics: {
      "عمق سطح العمل القياسي": "0.60 متر (60 سم)",
      "ارتفاع سطح العمل القياسي": "0.90 متر (90 سم)",
      "الممر بين أسطح العمل": "1.05 إلى 1.20 متر",
      "خلوص كراسي الجزيرة (Bar Stools)": "≥ 0.85 متر",
      "محيط مثلث العمل الإجمالي": "4.0 إلى 7.9 متر كحد أقصى"
    },
    spatial_rules: [
      "قاعدة مثلث العمل الذهبي (Work Triangle): مجموع المسافات بين الحوض والثلاجة والموقد يجب أن يكون بين 4.0 إلى 7.9م.",
      "يجب ألا يقطع ممر الحركة الرئيسي للمنزل مثلث العمل داخل المطبخ.",
      "يجب ترك مسافة أمان لا تقل عن 40 سم على جانبي الموقد لوضع أواني الطهي الساخنة بأمان.",
      "في المطابخ المفتوحة، يجب ربط الجزيرة بصرياً مع غرفة المعيشة مع توفير شفاط عالي القدرة."
    ],
    lighting_standards: {
      recommended_lux: 350,
      color_temperature_k: [3500, 4000],
      layers: {
        "العامة (Ambient)": "إضاءة عامة متجانسة تمنع تكون الظلال على أسطح الطبخ.",
        "الوظيفية (Task)": "شريط LED أسفل الخزائن العلوية بـ 400-500 Lux لإنارة أسطح التقطيع.",
        "الجمالية (Accent)": "معلقات إنارة فنية فوق الجزيرة على ارتفاع 75-85 سم من سطح الجزيرة."
      }
    },
    material_balance: {
      dominant_60: "خزائن مقاومة للبصمات والحرارة وأرضيات بورسلين غير زلقة.",
      secondary_30: "أسطح العمل من الكوارتز أو البورسلين الملبد (Sintered Stone).",
      accent_10: "مقابض وخلاطات مياه نحاسية مطفية وأرفف خشبية مفتوحة."
    }
  },
  {
    id: "std_home_office",
    room_type: "home_office",
    name_ar: "المكاتب المنزلية ومساحات العمل الإبداعية",
    description: "معايير تصميم وتجهيز المكاتب المنزلية لتعزيز التركيز والإنتاجية مع مراعاة بيئة العمل المريحة (Ergonomics).",
    default_dims: { width: 4.0, depth: 3.5 },
    anthropometrics: {
      "عمق سطح المكتب الأدنى": "0.70 متر (70 سم)",
      "عرض سطح المكتب الأدنى": "1.20 متر",
      "مسافة رجوع الكرسي للخلف": "≥ 1.00 متر (100 سم)",
      "الممر خلف الكرسي": "≥ 0.90 متر",
      "مسافة الرؤية للشاشة": "50 إلى 75 سم"
    },
    spatial_rules: [
      "وضع الشاشة عمودياً على مصدر الضوء الطبيعي لتجنب الوهج والانعكاسات الحادة.",
      "توفير خلفية بصرية أنيقة ومرتبة خلف كرسي المكتب تناسب الاجتماعات المرئية.",
      "توفير مسارات مخفية لتنظيم الكابلات للحفاظ على المظهر المعماري النظيف."
    ],
    lighting_standards: {
      recommended_lux: 400,
      color_temperature_k: [3500, 4500],
      layers: {
        "العامة (Ambient)": "إضاءة محايدة (4000K) تزيد من اليقظة والتركيز.",
        "الوظيفية (Task)": "مصباح مكتب احترافي عالي النقاء (CRI > 90) بدون وميض.",
        "الجمالية (Accent)": "إضاءة شريطية LED دافئة خلف الشاشة لتقليل إجهاد العين."
      }
    },
    material_balance: {
      dominant_60: "جدران مطفية وخزائن جدارية بلون رمادي أو خشبي هادئ.",
      secondary_30: "سطح مكتب من الخشب الطبيعي وكرسي بيئة عمل عالي الجودة.",
      accent_10: "نباتات مكتبية منقية للهواء ومجسمات هندسية تضفي لمسة إبداعية."
    }
  }
];

function mergeLiveStandards(
  fallback: RoomStandard[],
  remoteItems: RawBackendStandard[]
): RoomStandard[] {
  const byRoomType = new Map<string, RoomStandard>();
  fallback.forEach((std) => byRoomType.set(std.room_type, std));

  remoteItems.forEach((item) => {
    if (!item || typeof item !== "object" || !item.room_type) return;
    const roomType = String(item.room_type);
    const existing = byRoomType.get(roomType);
    const normalizedAnthro = normalizeAnthropometrics(item.anthropometrics);

    const hydrated: RoomStandard = {
      id: item.id || existing?.id || `std_${roomType}`,
      room_type: roomType,
      name_ar: item.name_ar || existing?.name_ar || roomType,
      description: item.description || existing?.description || "",
      anthropometrics:
        Object.keys(normalizedAnthro).length > 0
          ? normalizedAnthro
          : existing?.anthropometrics || {},
      spatial_rules:
        Array.isArray(item.spatial_rules) && item.spatial_rules.length > 0
          ? item.spatial_rules
          : existing?.spatial_rules || [],
      lighting_standards: {
        recommended_lux:
          item.lighting_standards?.recommended_lux ??
          existing?.lighting_standards.recommended_lux ??
          200,
        color_temperature_k:
          Array.isArray(item.lighting_standards?.color_temperature_k) &&
          item.lighting_standards.color_temperature_k.length > 0
            ? item.lighting_standards.color_temperature_k
            : existing?.lighting_standards.color_temperature_k || [2700, 3000],
        layers:
          item.lighting_standards?.layers &&
          Object.keys(item.lighting_standards.layers).length > 0
            ? item.lighting_standards.layers
            : existing?.lighting_standards.layers || {},
      },
      material_balance: {
        dominant_60:
          item.material_balance?.dominant_60 || existing?.material_balance.dominant_60 || "",
        secondary_30:
          item.material_balance?.secondary_30 || existing?.material_balance.secondary_30 || "",
        accent_10:
          item.material_balance?.accent_10 || existing?.material_balance.accent_10 || "",
      },
      default_dims:
        item.default_dims ||
        existing?.default_dims ||
        DEFAULT_DIMS_BY_ROOM_TYPE[roomType] || { width: 5.0, depth: 4.5 },
    };

    byRoomType.set(roomType, hydrated);
  });

  return Array.from(byRoomType.values());
}

export default function ArchitecturalLibrary() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LibraryTab>("standards");
  const [search, setSearch] = useState("");
  const [roomStandards, setRoomStandards] = useState<RoomStandard[]>(ROOM_STANDARDS);
  const [isLiveSynced, setIsLiveSynced] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<ArchitecturalStyle | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<RoomStandard | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const setRoomWidth = useSceneStore((s) => s.setRoomWidth);
  const setRoomDepth = useSceneStore((s) => s.setRoomDepth);
  const setCoveLightColor = useSceneStore((s) => s.setCoveLightColor);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/v1/architectural-standards", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Standards API unavailable");
        return res.json();
      })
      .then((payload) => {
        const remoteList: RawBackendStandard[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.standards)
            ? payload.standards
            : [];

        if (remoteList.length > 0) {
          setRoomStandards(mergeLiveStandards(ROOM_STANDARDS, remoteList));
          setIsLiveSynced(true);
        }
      })
      .catch(() => {
        // Silent offline fallback: local ROOM_STANDARDS are already displayed.
      });

    return () => controller.abort();
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyStandardToStudio = (std: RoomStandard) => {
    if (std.default_dims) {
      setRoomWidth(std.default_dims.width);
      setRoomDepth(std.default_dims.depth);
    }
    if (std.lighting_standards?.color_temperature_k?.[1]) {
      setCoveLightColor(std.lighting_standards.color_temperature_k[1]);
    }
    showToast(`📐 تم تطبيق أبعاد ومعايير إضاءة (${std.name_ar}) على الاستوديو!`);
    router.push("/studio");
  };

  const filteredStyles = useMemo(() => {
    return ARCHITECTURAL_STYLES.filter((style) =>
      style.title.toLowerCase().includes(search.toLowerCase()) ||
      style.summary.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const filteredStandards = useMemo(() => {
    return roomStandards.filter((std) =>
      std.name_ar.toLowerCase().includes(search.toLowerCase()) ||
      std.description.toLowerCase().includes(search.toLowerCase()) ||
      std.room_type.toLowerCase().includes(search.toLowerCase())
    );
  }, [roomStandards, search]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1E1E1E] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4A90E2] text-3xl">architecture</span>
              مركز المعرفة والمعايير المعمارية
            </h1>
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isLiveSynced
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              {isLiveSynced ? "متصل بالمرجع الحي" : "المرجع الهندسي المدمج"}
            </span>
          </div>
          <p className="text-gray-500 text-sm">مرجع هندسي متكامل للمصممين يغذي وكلاء الذكاء الاصطناعي بمعايير الفراغات والإضاءة والخامات.</p>
        </div>
        <Link 
          href="/studio" 
          className="bg-[#1E1E1E] hover:bg-[#2d2d2d] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:scale-105 shrink-0"
        >
          <span className="material-symbols-outlined text-sm">home_pin</span>
          الذهاب للاستوديو 3D
        </Link>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-none">
        {LIBRARY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shrink-0 ${
              activeTab === tab.id
                ? "bg-[#1E1E1E] text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/60"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-8 bg-white p-3 rounded-2xl shadow-sm border border-gray-200/80 flex items-center gap-2">
        <span className="material-symbols-outlined text-gray-400 p-2">search</span>
        <input
          type="text"
          placeholder="ابحث عن معيار فراغي، مدرسة فنية، أو مقاس هندسي..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 text-sm py-2 px-1"
        />
      </div>

      {/* ── TAB 1: SPATIAL STANDARDS (NEUFERT) ── */}
      {activeTab === "standards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStandards.map((std) => (
            <div key={std.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2.5 bg-[#4A90E2]/10 text-[#4A90E2] rounded-xl material-symbols-outlined text-xl">
                      square_foot
                    </span>
                    <h3 className="text-xl font-black text-gray-900">{std.name_ar}</h3>
                  </div>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full shrink-0">
                    {std.default_dims ? `${std.default_dims.width}م × ${std.default_dims.depth}م` : "أبعاد متغيرة"}
                  </span>
                </div>
                
                <p className="text-gray-500 text-xs leading-relaxed mb-5">{std.description}</p>

                {/* Anthropometrics Grid */}
                <div className="bg-[#F5F7FA] rounded-2xl p-4 mb-5 border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#4A90E2] text-sm">accessibility_new</span>
                    القياسات الإنسانية ومسارات الحركة (Anthropometrics):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(std.anthropometrics).map(([k, v], i) => (
                      <div key={i} className="bg-white p-2.5 rounded-xl border border-gray-200/50 flex flex-col justify-between">
                        <span className="text-gray-400 text-[10px] font-bold">{k}</span>
                        <span className="font-bold text-gray-800 mt-0.5">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Spatial Rules */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-amber-500 text-sm">rule</span>
                    أهم القواعد الفراغية:
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pr-1">
                    {std.spatial_rules.slice(0, 3).map((rule, idx) => (
                      <li key={idx} className="leading-relaxed">{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap justify-between items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStandard(std)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  الدليل التفصيلي
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyStandardToStudio(std)}
                  className="bg-[#4A90E2] hover:bg-[#357abd] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">tune</span>
                  تطبيق المعيار في 3D Studio
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 2: ARCHITECTURAL STYLES ── */}
      {activeTab === "styles" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredStyles.map((style) => (
            <div key={style.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all flex flex-col">
              <div className="relative h-48 w-full overflow-hidden bg-gray-200">
                <Image
                  src={style.hero_image_url}
                  alt={style.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-md">
                  {style.era}
                </div>
              </div>
              <div className="p-6 grow flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#1E1E1E] mb-2">{style.title}</h3>
                  <p className="text-gray-500 text-xs line-clamp-3 mb-4 leading-relaxed">{style.summary}</p>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStyle(style)}
                    className="text-gray-700 hover:text-black font-bold text-xs bg-gray-100 px-4 py-2.5 rounded-xl transition-colors"
                  >
                    التفاصيل
                  </button>
                  <Link href={`/studio?reference=${style.slug}`} className="bg-[#4A90E2] hover:bg-[#357abd] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1">
                    استخدم بالاستوديو
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: LIGHTING STANDARDS ── */}
      {activeTab === "lighting" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-md">
            <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-2xl">wb_incandescent</span>
              توزيع شدة الإضاءة الموصى بها (Lux Requirements)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { room: "الصالات وغرف المعيشة", lux: "150 Lux", temp: "2700K - 3000K" },
                { room: "القراءة والاسترخاء", lux: "300 Lux", temp: "3000K" },
                { room: "غرف النوم العامة", lux: "100 Lux", temp: "2400K - 2700K" },
                { room: "أسطح عمل المطابخ", lux: "500 Lux", temp: "4000K" },
                { room: "المكاتب المنزلية", lux: "400 - 500 Lux", temp: "4000K" },
                { room: "طاولات الطعام", lux: "250 Lux", temp: "2700K - 3000K" }
              ].map((item, i) => (
                <div key={i} className="bg-[#F5F7FA] p-4 rounded-2xl border border-gray-200/60 flex flex-col justify-between">
                  <span className="text-xs text-gray-500 font-bold">{item.room}</span>
                  <div className="mt-2">
                    <p className="text-lg font-black text-[#4A90E2]">{item.lux}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{item.temp}</p>
                  </div>
                </div>
              ))}
            </div>

            <h4 className="text-sm font-bold text-gray-800 mb-3">قاعدة الطبقات الضوئية الثلاث (Three-Layer Lighting):</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-black ml-1">1. الإضاءة العامة (Ambient):</span> الأساس غير المباشر (Cove Lighting) لملء الفراغ بنعومة.
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-black ml-1">2. الإضاءة الوظيفية (Task):</span> المسلطة لأداء نشاط محدد (القراءة، الطهي، العمل).
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-black ml-1">3. الإضاءة الجمالية (Accent):</span> تسليط الضوء على اللوحات والتحف بنسبة شدة 3:1.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-400">thermostat</span>
                دليل درجات كلفن (Kelvin Scale)
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/50">
                  <span className="font-bold text-amber-900 block mb-1">2400K - 2700K (دافئ جداً)</span>
                  <span className="text-amber-700">غرف النوم وأجواء المساء للاسترخاء وإفراز الميلاتونين.</span>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200/50">
                  <span className="font-bold text-yellow-900 block mb-1">3000K (دافئ ناعم - المعيار الذهبي)</span>
                  <span className="text-yellow-700">الصالات وغرف المعيشة والمجالس (الدفء المعماري الفاخر).</span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/50">
                  <span className="font-bold text-blue-900 block mb-1">4000K (أبيض محايد)</span>
                  <span className="text-blue-700">المطابخ والمكاتب وغرف الملابس لرؤية دقيقة وتنبيه ذهني.</span>
                </div>
              </div>
            </div>
            <Link href="/studio" className="mt-6 w-full bg-[#1E1E1E] text-white text-center py-3 rounded-xl font-bold text-xs hover:bg-black transition-all">
              تجربة الإضاءة في 3D Studio
            </Link>
          </div>
        </div>
      )}

      {/* ── TAB 4: MATERIALS & 60-30-10 HARMONY ── */}
      {activeTab === "materials" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "الياباني الإسكندنافي (Warm Japandi)",
              dominant: "خشب البلوط الفاتح + دهان بيج جيري (#EFEBE4)",
              secondary: "كتان طبيعي + حجر الترافرتين البيج (#D4C8B8)",
              accent: "فخار غير مصقول + خشب الجوز الداكن (#4A3B32)"
            },
            {
              title: "المودرن العضوي (Modern Organic)",
              dominant: "خرسانة ناعمة دافئة + دهان أوف وايت (#F4F2ED)",
              secondary: "قماش البوكليه العاجي + خشب أكاسيا (#C9B9A6)",
              accent: "نحاس برونزي مطفي + جلد طبيعي (#8C5835)"
            },
            {
              title: "الوحشية المعاصرة (Contemporary Brutalist)",
              dominant: "ألواح خرسانية + أرضيات تيرازو (#E2E2DF)",
              secondary: "حديد أسود مصنفر + صوف ثقيل (#2B2B2B)",
              accent: "خشب الساج المعتق + نباتات شاهقة (#3E5336)"
            }
          ].map((pal, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-3">{pal.title}</h3>
                <div className="space-y-3 text-xs mb-6">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                    <span className="text-[10px] font-bold text-gray-400 block mb-0.5">60% الأساس المحيط (الجدران والأرضيات)</span>
                    <span className="font-bold text-gray-800">{pal.dominant}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                    <span className="text-[10px] font-bold text-gray-400 block mb-0.5">30% الأثاث الرئيسي والكتل</span>
                    <span className="font-bold text-gray-800">{pal.secondary}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60">
                    <span className="text-[10px] font-bold text-gray-400 block mb-0.5">10% نقاط الجذب واللمسات</span>
                    <span className="font-bold text-gray-800">{pal.accent}</span>
                  </div>
                </div>
              </div>
              <Link href="/studio" className="w-full bg-[#4A90E2] text-white text-center py-3 rounded-xl font-bold text-xs hover:bg-[#357abd] transition-all">
                تطبيق هذه الباليت في الاستوديو
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Standard Detail Modal */}
      {selectedStandard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-150 animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-slide-up border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-[#F5F7FA] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4A90E2] text-2xl">square_foot</span>
                <h3 className="font-black text-xl text-gray-900">{selectedStandard.name_ar}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStandard(null)}
                aria-label="إغلاق"
                className="material-symbols-outlined text-gray-500 hover:text-black"
              >
                close
              </button>
            </div>
            <div className="p-6 overflow-y-auto grow space-y-5 text-xs text-gray-700">
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-2">الوصف الهندسي:</h4>
                <p className="leading-relaxed text-gray-600">{selectedStandard.description}</p>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-2">القواعد الفراغية والمعمارية:</h4>
                <ul className="space-y-1.5 list-disc list-inside text-gray-600 pr-1">
                  {selectedStandard.spatial_rules.map((r, i) => (
                    <li key={i} className="leading-relaxed">{r}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedStandard(null)}
                className="bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApplyStandardToStudio(selectedStandard);
                  setSelectedStandard(null);
                }}
                className="bg-[#4A90E2] text-white px-6 py-2.5 rounded-xl font-bold shadow-md"
              >
                تطبيق في الاستوديو 3D
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Style Details Modal */}
      {selectedStyle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-150 animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col animate-slide-up border border-gray-100">
            <div className="relative h-64 bg-gray-200 shrink-0">
              <Image
                src={selectedStyle.hero_image_url}
                alt={selectedStyle.title}
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover"
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
                type="button"
                onClick={() => setSelectedStyle(null)}
                aria-label="إغلاق"
                className="absolute top-4 left-4 bg-white/80 hover:bg-white text-gray-700 hover:text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto grow flex flex-col gap-6 text-right">
              <div>
                <h4 className="font-bold text-[#1E1E1E] text-base mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <span className="material-symbols-outlined text-[#4A90E2] text-lg">psychology</span>
                  فلسفة ونشأة التصميم
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">{selectedStyle.content}</p>
              </div>

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

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 shrink-0">
              <button
                type="button"
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
      )}
    </main>
  );
}
