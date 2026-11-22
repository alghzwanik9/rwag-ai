import type { Metadata } from 'next';
import MaaradClient from './MaaradClient';

export const metadata: Metadata = {
  title: 'معرض التصاميم المعمارية | رواق Rwaq AI',
  description:
    'استكشف تصاميم غرف ومجالس فاخرة مولدة بالذكاء الاصطناعي مع برومبت التوليد والتكلفة التقديرية، وانقل أي تصميم بنقرة واحدة إلى الاستوديو ثلاثي الأبعاد.',
  keywords: [
    'معرض تصاميم',
    'تصميم داخلي 3D',
    'مجلس عربي معاصر',
    'غرفة معيشة ياباندي',
    'مكتب تنفيذي',
    'ذكاء اصطناعي فراغي',
    'رواق',
  ],
  openGraph: {
    title: 'معرض التصاميم المعمارية — منصة رواق',
    description:
      'تصفح واستلهم أرقى التصاميم المعمارية الفراغية، وافتحها في الاستوديو 3D بنقرة واحدة.',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default function MaaradPage() {
  return <MaaradClient />;
}
