import type { Metadata } from 'next';
import NarrativePage from '@/components/landing/narrative/NarrativePage';

export const metadata: Metadata = {
  title: 'رواق | تصميم المساحات المعمارية بذكاء الوكلاء',
  description:
    'اكتب وصف غرفتك بالعربية وشاهدها تُبنى أمامك: حدود، خامات، توزيع، وتكلفة بالريال السعودي — قبل أن تشتري قطعة واحدة.',
  keywords: ['تصميم داخلي', 'ذكاء اصطناعي', 'مخطط فراغي', 'أثاث', 'السعودية'],
  openGraph: {
    title: 'رواق — صمّم مساحتك المعمارية بذكاء الوكلاء',
    description:
      'رحلة تفاعلية من الوصف إلى مخطط قابل للتنفيذ وعرض سعر جاهز للعميل.',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default function LandingPage() {
  return <NarrativePage />;
}
