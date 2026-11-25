import type { Metadata } from 'next';
import NarrativePage from '@/components/landing/narrative/NarrativePage';

export const metadata: Metadata = {
  title: 'رواق | جولة معمارية ثلاثية الأبعاد وتصميم داخلي بذكاء الوكلاء',
  description:
    'من وصفك بالعربية أو مخططك ثنائي الأبعاد إلى استوديو 3D فيزيائي مدقق وفق كود البناء السعودي SBC 201، ورندرة عصبية 1:1، وجدول كميات فوري بالريال السعودي ومعاينة AR.',
  keywords: [
    'تصميم داخلي',
    'ذكاء اصطناعي',
    'كود البناء السعودي SBC 201',
    'مخطط فراغي 3D',
    'حصر كميات BOQ',
    'السعودية',
  ],
  openGraph: {
    title: 'رواق — صمّم مساحتك المعمارية بذكاء الوكلاء',
    description:
      'جولة معمارية ثلاثية الأبعاد من الوصف العربي ومخطط 2D إلى تدقيق SBC 201 وتسعير فوري بالريال السعودي ومعاينة AR.',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default function LandingPage() {
  return <NarrativePage />;
}
