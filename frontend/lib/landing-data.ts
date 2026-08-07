/**
 * Content model for the public Rwaq landing page.
 *
 * Everything the marketing surface renders is declared here so copy, pricing
 * and demo data can be edited without touching component logic. All figures
 * shown in the interactive demo are illustrative sample data for the landing
 * page — furniture prices mirror the SAR values in the studio catalog
 * (`app/studio/config/catalogTemplates.ts`) so the two surfaces agree.
 */

export const BRAND = {
  nameAr: 'رواق',
  nameEn: 'Rwaq AI',
  email: 'info@rwaq-ai.com',
  missionAr:
    'رواق منصة تصميم معماري داخلي تعمل بوكلاء ذكاء اصطناعي، تحوّل وصفاً بسيطاً بالعربية إلى مخطط فراغي دقيق، وقائمة أثاث مطابقة لموردين محليين، ومعاينة ثلاثية الأبعاد قابلة للتصدير.',
} as const;

/**
 * Cinematic loops generated with Higgsfield (Veo 3.1 Lite, 4s, silent, 16:9).
 *
 * Preferred deployment is to download each clip into `public/media/` — the
 * paths below are checked first. Set the matching env var to point at any
 * other origin (CDN, bucket). If no source loads, `AmbientVideo` falls back to
 * a pure-CSS ambient scene, so the page never renders an empty frame.
 */
export const MEDIA = {
  heroLoop: {
    local: '/media/rwaq-hero-japandi.mp4',
    remote: process.env.NEXT_PUBLIC_RWAQ_HERO_VIDEO ?? '',
    label: 'جولة سينمائية داخل غرفة معيشة بأسلوب ياباندي بإضاءة صباحية',
  },
  morphLoop: {
    local: '/media/rwaq-spatial-morph.mp4',
    remote: process.env.NEXT_PUBLIC_RWAQ_MORPH_VIDEO ?? '',
    label: 'تحوّل المخطط الفراغي من هيكل سلكي إلى مشهد ثلاثي الأبعاد',
  },
} as const;

export type NavLink = { href: string; labelAr: string; labelEn: string };

export const NAV_LINKS: NavLink[] = [
  { href: '#features', labelAr: 'المميزات', labelEn: 'Features' },
  { href: '#styles', labelAr: 'مكتبة الأنماط', labelEn: 'Style Library' },
  { href: '#studio-2d', labelAr: 'استوديو 2D', labelEn: '2D Studio' },
  { href: '#pricing', labelAr: 'الأسعار', labelEn: 'Pricing' },
];

/* ── Hero spatial HUD ───────────────────────────────────────────────────── */

export const HERO_HUD = {
  room: { widthM: 5.0, depthM: 5.0, labelAr: 'أبعاد الغرفة' },
  budget: {
    amount: 14200,
    currencyAr: 'ر.س',
    labelAr: 'الميزانية التقديرية',
    sources: ['IKEA', 'West Elm'],
  },
  palette: {
    labelAr: 'لوحة ياباندي',
    labelEn: 'Japandi Palette',
    swatches: [
      { hex: '#002B4B', nameAr: 'أزرق عميق' },
      { hex: '#D2B48C', nameAr: 'رملي دافئ' },
      { hex: '#F8F8F8', nameAr: 'أبيض ناعم' },
    ],
  },
} as const;

/* ── Bento features ─────────────────────────────────────────────────────── */

export type FeatureCard = {
  id: string;
  icon: 'engine' | 'catalog' | 'ar' | 'export';
  titleAr: string;
  tagEn: string;
  bodyAr: string;
  metrics: { valueAr: string; labelAr: string }[];
};

export const FEATURES: FeatureCard[] = [
  {
    id: 'spatial-engine',
    icon: 'engine',
    titleAr: 'محرك التوزيع الفراغي الذكي',
    tagEn: 'CrewAI Spatial Engine',
    bodyAr:
      'وكلاء متخصصون يوزّعون القطع داخل المساحة مع حظر التداخل بين الأثاث وضبط ممرات الحركة تلقائياً وفق المعايير المعمارية.',
    metrics: [
      { valueAr: '٩٠ سم', labelAr: 'أدنى عرض ممر' },
      { valueAr: '٠ تداخل', labelAr: 'تصادم القطع' },
    ],
  },
  {
    id: 'rag-catalog',
    icon: 'catalog',
    titleAr: 'المطابقة الفورية للموردين',
    tagEn: 'RAG Catalog',
    bodyAr:
      'ربط كل قطعة أثاث تلقائياً بكاتالوجات إيكيا وأبيات ووست إلم، مع السعر بالريال السعودي ورقم القطعة وحالة التوفر.',
    metrics: [
      { valueAr: '٣ موردين', labelAr: 'مصادر مرتبطة' },
      { valueAr: 'ريال سعودي', labelAr: 'تسعير محلي' },
    ],
  },
  {
    id: 'ar-preview',
    icon: 'ar',
    titleAr: 'معاينة الواقع المعزز',
    tagEn: 'AR Preview',
    bodyAr:
      'امسح رمز الاستجابة السريعة وشاهد الأثاث بمقاسه الحقيقي داخل غرفتك عبر كاميرا الجوال قبل الشراء.',
    metrics: [{ valueAr: 'iOS · Android', labelAr: 'بدون تطبيق' }],
  },
  {
    id: 'pdf-export',
    icon: 'export',
    titleAr: 'تصدير المخطط وكتالوج التكلفة',
    tagEn: 'Instant PDF Export',
    bodyAr:
      'نزّل المخطط الفراغي وجدول الكميات وعرض السعر النهائي في ملف واحد منسّق وجاهز للعميل بنقرة واحدة.',
    metrics: [{ valueAr: 'PDF · A4', labelAr: 'جاهز للطباعة' }],
  },
];

/* ── Interactive demo (Live AI Generation Bar) ──────────────────────────── */

export type PlanShape = {
  label: string;
  /** Normalised floor-plan coordinates in a 0–100 space (RTL-agnostic). */
  x: number;
  y: number;
  w: number;
  h: number;
  tone: 'anchor' | 'soft' | 'accent';
};

export type DemoItem = {
  nameAr: string;
  sku: string;
  brand: 'IKEA' | 'أبيات' | 'West Elm';
  price: number;
};

export type DemoScenario = {
  id: string;
  promptAr: string;
  roomAr: string;
  dims: { w: number; d: number };
  paletteHex: string[];
  items: DemoItem[];
  plan: PlanShape[];
  insightAr: string;
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'modern-navy',
    promptAr: 'غرفة معيشة بأسلوب مودرن مع كنبة كحلية',
    roomAr: 'غرفة معيشة',
    dims: { w: 5.0, d: 5.0 },
    paletteHex: ['#1B2A44', '#2F4A6D', '#C9B79C', '#F2F0EC'],
    items: [
      { nameAr: 'أريكة ٣ مقاعد KIVIK — كحلي', sku: 'KIVIK-3S', brand: 'IKEA', price: 2495 },
      { nameAr: 'كرسي بمسندين STRANDMON', sku: 'STRANDMON', brand: 'IKEA', price: 1195 },
      { nameAr: 'طاولة قهوة رخامية', sku: 'WE-MRBL-CT', brand: 'West Elm', price: 1850 },
      { nameAr: 'سجادة منسوجة STOCKHOLM', sku: 'STOCKHOLM-RG', brand: 'IKEA', price: 1495 },
      { nameAr: 'وحدة تلفزيون معلّقة', sku: 'ABY-TVU-180', brand: 'أبيات', price: 1420 },
      { nameAr: 'مصباح أرضي HEKTAR', sku: 'HEKTAR-FL', brand: 'IKEA', price: 295 },
    ],
    plan: [
      { label: 'أريكة', x: 8, y: 58, w: 46, h: 16, tone: 'anchor' },
      { label: 'كرسي', x: 62, y: 56, w: 18, h: 18, tone: 'soft' },
      { label: 'طاولة', x: 24, y: 36, w: 26, h: 14, tone: 'accent' },
      { label: 'سجادة', x: 12, y: 30, w: 62, h: 46, tone: 'soft' },
      { label: 'تلفزيون', x: 20, y: 8, w: 40, h: 8, tone: 'anchor' },
      { label: 'إضاءة', x: 84, y: 40, w: 10, h: 10, tone: 'accent' },
    ],
    insightAr: 'وُزّعت القطع حول محور بصري واحد مع ممر حركة بعرض ٩٥ سم بين الأريكة والطاولة.',
  },
  {
    id: 'japandi-bedroom',
    promptAr: 'غرفة نوم ياباندية بألوان ترابية وإضاءة خافتة',
    roomAr: 'غرفة نوم',
    dims: { w: 4.2, d: 4.6 },
    paletteHex: ['#2B2723', '#A48E74', '#D8CBB8', '#F6F3EE'],
    items: [
      { nameAr: 'سرير خشب بلوط منخفض', sku: 'ABY-OAK-BED', brand: 'أبيات', price: 3250 },
      { nameAr: 'كومودينو كتان طبيعي ×٢', sku: 'WE-LN-NS2', brand: 'West Elm', price: 1640 },
      { nameAr: 'خزانة أدراج MALM', sku: 'MALM-DR6', brand: 'IKEA', price: 1195 },
      { nameAr: 'سجادة صوف بيج', sku: 'ABY-WL-RUG', brand: 'أبيات', price: 890 },
      { nameAr: 'مصباح ورقي معلّق', sku: 'REGOLIT-PD', brand: 'IKEA', price: 85 },
    ],
    plan: [
      { label: 'سرير', x: 26, y: 46, w: 48, h: 40, tone: 'anchor' },
      { label: 'طاولة', x: 8, y: 52, w: 14, h: 14, tone: 'soft' },
      { label: 'طاولة', x: 78, y: 52, w: 14, h: 14, tone: 'soft' },
      { label: 'خزانة', x: 10, y: 10, w: 34, h: 12, tone: 'anchor' },
      { label: 'سجادة', x: 20, y: 40, w: 60, h: 50, tone: 'soft' },
      { label: 'إضاءة', x: 60, y: 12, w: 12, h: 12, tone: 'accent' },
    ],
    insightAr: 'تُرك فراغ ٧٠ سم على جانبي السرير لضمان سهولة الحركة وترتيب الفراش.',
  },
  {
    id: 'home-office',
    promptAr: 'مكتب منزلي هادئ بإضاءة دافئة ورفوف مفتوحة',
    roomAr: 'مكتب منزلي',
    dims: { w: 3.6, d: 4.0 },
    paletteHex: ['#22262E', '#4A5361', '#B79C7A', '#EFEDE8'],
    items: [
      { nameAr: 'مكتب خشب صلب ١٦٠ سم', sku: 'ABY-DSK-160', brand: 'أبيات', price: 1780 },
      { nameAr: 'كرسي مكتب مريح MARKUS', sku: 'MARKUS-OC', brand: 'IKEA', price: 995 },
      { nameAr: 'رف عرض مفتوح BILLY', sku: 'BILLY-OS', brand: 'IKEA', price: 449 },
      { nameAr: 'مصباح مكتب نحاسي', sku: 'WE-BR-TL', brand: 'West Elm', price: 620 },
      { nameAr: 'سجادة جوت LOHALS', sku: 'LOHALS-RG', brand: 'IKEA', price: 395 },
    ],
    plan: [
      { label: 'مكتب', x: 14, y: 20, w: 52, h: 16, tone: 'anchor' },
      { label: 'كرسي', x: 32, y: 42, w: 16, h: 16, tone: 'soft' },
      { label: 'رفوف', x: 74, y: 16, w: 14, h: 46, tone: 'anchor' },
      { label: 'سجادة', x: 12, y: 34, w: 54, h: 44, tone: 'soft' },
      { label: 'إضاءة', x: 54, y: 12, w: 10, h: 10, tone: 'accent' },
    ],
    insightAr: 'وُضع المكتب عمودياً على مصدر الضوء لتقليل الوهج على الشاشة أثناء النهار.',
  },
  {
    id: 'majlis',
    promptAr: 'مجلس عربي معاصر بلمسات ذهبية ومقاعد أرضية',
    roomAr: 'مجلس',
    dims: { w: 6.0, d: 4.5 },
    paletteHex: ['#14181F', '#8A7452', '#E8C488', '#F5F0E6'],
    items: [
      { nameAr: 'طقم مجلس أرضي مخمل ٨ قطع', sku: 'ABY-MJLS-8', brand: 'أبيات', price: 6400 },
      { nameAr: 'طاولة وسط نحاسية دائرية', sku: 'WE-BRS-CT', brand: 'West Elm', price: 2150 },
      { nameAr: 'سجادة كلاسيكية ٣×٤ م', sku: 'ABY-CLS-34', brand: 'أبيات', price: 2890 },
      { nameAr: 'ثريا نحاسية معلّقة', sku: 'WE-BRS-CH', brand: 'West Elm', price: 3100 },
      { nameAr: 'طاولة جانبية GLADOM ×٢', sku: 'GLADOM-2', brand: 'IKEA', price: 190 },
    ],
    plan: [
      { label: 'مجلس', x: 6, y: 16, w: 12, h: 62, tone: 'anchor' },
      { label: 'مجلس', x: 82, y: 16, w: 12, h: 62, tone: 'anchor' },
      { label: 'مجلس', x: 22, y: 78, w: 56, h: 12, tone: 'anchor' },
      { label: 'طاولة', x: 38, y: 40, w: 24, h: 24, tone: 'accent' },
      { label: 'سجادة', x: 18, y: 14, w: 64, h: 62, tone: 'soft' },
      { label: 'ثريا', x: 44, y: 6, w: 12, h: 12, tone: 'accent' },
    ],
    insightAr: 'حُفظ ممر دخول بعرض ١٢٠ سم من الباب حتى مركز المجلس وفق أعراف الضيافة.',
  },
];

export const scenarioTotal = (s: DemoScenario): number =>
  s.items.reduce((sum, item) => sum + item.price, 0);

/* ── Style & material showcase ──────────────────────────────────────────── */

export type MaterialId = 'oak' | 'marble' | 'gold' | 'boucle';

export type Material = {
  id: MaterialId;
  nameAr: string;
  nameEn: string;
  /** Pure-CSS approximation of the material — no image requests. */
  css: string;
  finishAr: string;
};

export const MATERIALS: Material[] = [
  {
    id: 'oak',
    nameAr: 'بلوط طبيعي',
    nameEn: 'Natural Oak',
    finishAr: 'مطفي · مسامي',
    css: `repeating-linear-gradient(96deg, #c9a97c 0 3px, #c09e70 3px 5px, #cdae82 5px 9px, #b8956a 9px 11px),
          linear-gradient(180deg, #d8bb8e, #b08f63)`,
  },
  {
    id: 'marble',
    nameAr: 'رخام كرارا',
    nameEn: 'Carrara Marble',
    finishAr: 'مصقول · لامع',
    css: `linear-gradient(122deg, transparent 42%, rgba(120,132,142,0.5) 43%, transparent 45%),
          linear-gradient(58deg, transparent 60%, rgba(120,132,142,0.35) 61%, transparent 63%),
          radial-gradient(circle at 30% 30%, #ffffff, #e8e7e3 60%, #d6d5d0)`,
  },
  {
    id: 'gold',
    nameAr: 'ذهب مصقول',
    nameEn: 'Brushed Gold',
    finishAr: 'مفروش · دافئ',
    css: `repeating-linear-gradient(102deg, #e8c488 0 2px, #cfa96a 2px 4px, #f0d7a6 4px 6px),
          linear-gradient(160deg, #f2dcb0, #a8875a)`,
  },
  {
    id: 'boucle',
    nameAr: 'نسيج بوكليه',
    nameEn: 'Bouclé Fabric',
    finishAr: 'محبّب · ناعم',
    css: `radial-gradient(circle at 20% 25%, rgba(255,255,255,0.85) 1.5px, transparent 2px),
          radial-gradient(circle at 62% 58%, rgba(255,255,255,0.7) 1.5px, transparent 2px),
          radial-gradient(circle at 85% 20%, rgba(0,0,0,0.06) 1.5px, transparent 2px),
          linear-gradient(150deg, #efe6d8, #ddd0bd)`,
  },
];

export type DesignStyle = {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  palette: { hex: string; nameAr: string }[];
  materials: MaterialId[];
  signatureAr: string;
};

export const STYLES: DesignStyle[] = [
  {
    id: 'japandi',
    nameAr: 'ياباندي',
    nameEn: 'Japandi',
    descAr:
      'اتزان بين البساطة اليابانية والدفء الإسكندنافي: خطوط منخفضة، خشب فاتح، وفراغ سالب مقصود يمنح الغرفة سكوناً بصرياً.',
    palette: [
      { hex: '#2B2723', nameAr: 'بني داكن' },
      { hex: '#A48E74', nameAr: 'رملي دافئ' },
      { hex: '#D8CBB8', nameAr: 'كتاني' },
      { hex: '#F6F3EE', nameAr: 'عاجي' },
    ],
    materials: ['oak', 'boucle'],
    signatureAr: 'أثاث منخفض · إضاءة غير مباشرة',
  },
  {
    id: 'modern',
    nameAr: 'مودرن',
    nameEn: 'Modern',
    descAr:
      'كتل هندسية واضحة وتباين محسوب: أسطح مصقولة، ألوان محايدة عميقة، ولمسة معدنية واحدة تحدد مركز الغرفة.',
    palette: [
      { hex: '#14181F', nameAr: 'فحمي' },
      { hex: '#1B2A44', nameAr: 'كحلي' },
      { hex: '#8E98A8', nameAr: 'رمادي بارد' },
      { hex: '#F2F0EC', nameAr: 'أبيض ناعم' },
    ],
    materials: ['marble', 'gold'],
    signatureAr: 'خطوط حادة · تباين عالٍ',
  },
  {
    id: 'minimalist',
    nameAr: 'مينيمال',
    nameEn: 'Minimalist',
    descAr:
      'أقل عدد من القطع بأعلى جودة تنفيذ. لا زخرفة، لا ضوضاء بصرية — الفراغ نفسه هو العنصر الأساسي في التكوين.',
    palette: [
      { hex: '#3A3D42', nameAr: 'حجري' },
      { hex: '#B7B4AE', nameAr: 'رمادي دافئ' },
      { hex: '#E4E2DD', nameAr: 'جبسي' },
      { hex: '#FBFAF8', nameAr: 'أبيض نقي' },
    ],
    materials: ['marble', 'oak'],
    signatureAr: 'فراغ سالب · لون واحد',
  },
  {
    id: 'industrial',
    nameAr: 'صناعي',
    nameEn: 'Industrial',
    descAr:
      'خامات خام مكشوفة: خرسانة، حديد أسود، وخشب مستصلح. الأنابيب والتفاصيل الإنشائية تُترك ظاهرة كعنصر جمالي.',
    palette: [
      { hex: '#191B1E', nameAr: 'أسود مطفي' },
      { hex: '#4E5257', nameAr: 'خرساني' },
      { hex: '#8A7452', nameAr: 'نحاسي معتق' },
      { hex: '#C9C4BC', nameAr: 'إسمنتي فاتح' },
    ],
    materials: ['gold', 'oak'],
    signatureAr: 'خامات مكشوفة · حديد أسود',
  },
  {
    id: 'midcentury',
    nameAr: 'منتصف القرن',
    nameEn: 'Mid-Century',
    descAr:
      'منحنيات عضوية وأرجل خشبية مدببة من خمسينيات القرن الماضي، مع ألوان دافئة ومحروقة تمنح الغرفة طابعاً حِرَفياً.',
    palette: [
      { hex: '#2E2019', nameAr: 'جوزي' },
      { hex: '#9C5B32', nameAr: 'برتقالي محروق' },
      { hex: '#C7A15C', nameAr: 'خردلي' },
      { hex: '#EFE4D2', nameAr: 'كريمي' },
    ],
    materials: ['oak', 'boucle'],
    signatureAr: 'أرجل مدببة · منحنيات عضوية',
  },
];

/* ── Social proof ───────────────────────────────────────────────────────── */

export type Stat = { value: number; suffix: string; prefix: string; labelAr: string; noteEn: string };

export const STATS: Stat[] = [
  { value: 10000, prefix: '+', suffix: '', labelAr: 'مساحة مصمَّمة', noteEn: 'Spaces designed' },
  { value: 99, prefix: '', suffix: '%', labelAr: 'دقة الأبعاد الفراغية', noteEn: 'Spatial accuracy' },
  { value: 5000, prefix: '+', suffix: '', labelAr: 'قطعة أثاث مطابقة للموردين', noteEn: 'Matched SKUs' },
];

/* ── Pricing ────────────────────────────────────────────────────────────── */

export type PricingTier = {
  id: string;
  nameAr: string;
  priceSar: number | null;
  periodAr: string;
  descAr: string;
  featuresAr: string[];
  ctaAr: string;
  featured: boolean;
};

/**
 * Placeholder commercial terms for the marketing page — replace the amounts
 * and entitlements below with the approved price list before launch.
 */
export const PRICING: PricingTier[] = [
  {
    id: 'free',
    nameAr: 'المجاني',
    priceSar: 0,
    periodAr: 'للأبد',
    descAr: 'لتجربة المنصة وتصميم أول مساحة كاملة.',
    featuresAr: ['٣ مشاريع نشطة', 'توليد مخطط ثنائي وثلاثي الأبعاد', 'مطابقة أساسية للموردين', 'تصدير صورة بدقة عالية'],
    ctaAr: 'ابدأ مجاناً',
    featured: false,
  },
  {
    id: 'pro',
    nameAr: 'الاحترافي',
    priceSar: 249,
    periodAr: 'شهرياً',
    descAr: 'للمصممين المستقلين ومكاتب التصميم الصغيرة.',
    featuresAr: [
      'مشاريع غير محدودة',
      'مطابقة كاملة لكاتالوجات إيكيا وأبيات ووست إلم',
      'معاينة الواقع المعزز عبر الجوال',
      'تصدير PDF بجدول الكميات والتكلفة',
      'مكتبة الأنماط والخامات كاملة',
    ],
    ctaAr: 'اشترك الآن',
    featured: true,
  },
  {
    id: 'studio',
    nameAr: 'الأعمال',
    priceSar: null,
    periodAr: 'حسب الطلب',
    descAr: 'للشركات ومكاتب العمارة متعددة الفرق.',
    featuresAr: [
      'كل مزايا الاحترافي',
      'مساحات عمل ومشاركة للفرق',
      'كاتالوج موردين خاص بالمنشأة',
      'واجهة برمجية ودعم مخصص',
    ],
    ctaAr: 'تواصل مع المبيعات',
    featured: false,
  },
];

/* ── Footer ─────────────────────────────────────────────────────────────── */

export const FOOTER_GROUPS: { titleAr: string; links: NavLink[] }[] = [
  {
    titleAr: 'المنتج',
    links: [
      { href: '#features', labelAr: 'المميزات', labelEn: 'Features' },
      { href: '#studio-2d', labelAr: 'استوديو 2D', labelEn: '2D Studio' },
      { href: '/studio', labelAr: 'الأستوديو ثلاثي الأبعاد', labelEn: '3D Studio' },
      { href: '#pricing', labelAr: 'الأسعار', labelEn: 'Pricing' },
    ],
  },
  {
    titleAr: 'المكتبة',
    links: [
      { href: '#styles', labelAr: 'مكتبة الأنماط', labelEn: 'Styles' },
      { href: '#styles', labelAr: 'الخامات والتشطيبات', labelEn: 'Materials' },
      { href: '#stats', labelAr: 'أرقامنا', labelEn: 'Impact' },
    ],
  },
];
