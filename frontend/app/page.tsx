import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import LandingHeader from '@/components/landing/LandingHeader';
import Hero from '@/components/landing/Hero';
import PromptStudioBar from '@/components/landing/PromptStudioBar';
import FeaturesBento from '@/components/landing/FeaturesBento';
import StyleShowcase from '@/components/landing/StyleShowcase';
import StatsBand from '@/components/landing/StatsBand';
import PricingSection from '@/components/landing/PricingSection';
import LandingFooter from '@/components/landing/LandingFooter';

export const metadata: Metadata = {
  title: 'رواق | تصميم المساحات المعمارية بذكاء الوكلاء',
  description:
    'رواق منصة تصميم داخلي تعمل بوكلاء ذكاء اصطناعي: مخطط فراغي دقيق، مطابقة فورية لأثاث إيكيا وأبيات ووست إلم بالريال السعودي، معاينة بالواقع المعزز، وتصدير PDF بنقرة واحدة.',
  keywords: ['تصميم داخلي', 'ذكاء اصطناعي', 'مخطط فراغي', 'واقع معزز', 'أثاث', 'السعودية'],
  openGraph: {
    title: 'رواق — صمّم مساحتك المعمارية بذكاء الوكلاء',
    description:
      'المنصة الأولى القائمة على الذكاء الاصطناعي التوليدي لتخيل وتأثيث ومحاكاة المساحات ثلاثية الأبعاد بإدارة دقيقة للميزانية.',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="rwaq-landing min-h-screen overflow-x-hidden" dir="rtl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[200] focus:rounded-pill focus:bg-rwaq-gold focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-rwaq-slate"
      >
        تخطَّ إلى المحتوى الرئيسي
      </a>

      <LandingHeader />

      <main id="main">
        <Hero isSignedIn={Boolean(userId)} />
        <PromptStudioBar />
        <FeaturesBento />
        <StyleShowcase />
        <StatsBand />
        <PricingSection />
      </main>

      <LandingFooter />
    </div>
  );
}
