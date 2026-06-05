import Link from 'next/link';
import { SignUpButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

export default async function LandingPage() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-secondary/20" dir="rtl">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-surface/90 backdrop-blur-lg border-b border-outline-variant z-50 px-6 md:px-16 flex justify-between items-center transition-all">
        <div className="flex items-center gap-4">
          <h1 className="font-headline-md font-bold text-primary tracking-tight">رواق</h1>
          <div className="h-6 w-px bg-outline-variant hidden md:block"></div>
          <span className="font-label-md text-on-surface-variant hidden md:block">أستوديو التصميم الرقمي</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="font-label-md text-on-surface-variant hover:text-primary transition-colors">المميزات</Link>
          <Link href="#testimonials" className="font-label-md text-on-surface-variant hover:text-primary transition-colors">آراء العملاء</Link>
          <Link href="#contact" className="font-label-md text-on-surface-variant hover:text-primary transition-colors">تواصل معنا</Link>
        </nav>
        <div className="flex gap-4">
          {isSignedIn ? (
            <Link href="/studio" className="bg-secondary text-white px-8 py-2.5 rounded-full font-label-md hover:bg-secondary/90 transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2">
              <span>انتقل إلى الأستوديو</span>
            </Link>
          ) : (
            <SignUpButton mode="modal">
              <button className="bg-secondary text-white px-8 py-2.5 rounded-full font-label-md hover:bg-secondary/90 transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2">
                <span>ابدأ التصميم</span>
              </button>
            </SignUpButton>
          )}
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="pt-40 pb-24 px-6 md:px-16 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container/50 border border-secondary/10 mb-4">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label-sm text-secondary">النسخة التجريبية بذكاء اصطناعي متوفرة الآن</span>
            </div>
            
            <h2 className="font-display-lg text-display-lg md:text-[64px] font-bold text-primary leading-tight">
              صمم مساحتك بذكاء<br/>مع أستوديو التصميم الرقمي
            </h2>
            
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              منصة متكاملة تجمع بين قوة الذكاء الاصطناعي والواقع المعزز، لتصميم مساحاتك الداخلية بكل سهولة مع إدارة ذكية للميزانية. استكشف الأثاث والألوان بلمسة واحدة.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              {isSignedIn ? (
                <Link href="/studio" className="bg-primary text-white px-8 py-4 rounded-full font-label-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  <span>العودة إلى الأستوديو</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="bg-primary text-white px-8 py-4 rounded-full font-label-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                    <span>صمم مساحتك الآن مجاناً</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </SignUpButton>
              )}
              <button className="bg-surface-container-low text-primary px-8 py-4 rounded-full font-label-lg border border-outline-variant hover:bg-surface-container transition-all flex items-center justify-center gap-3">
                <span className="material-symbols-outlined text-sm">play_circle</span>
                <span>شاهد العرض التوضيحي</span>
              </button>
            </div>
          </div>
        </section>

        {/* Features Bento Box */}
        <section id="features" className="py-24 px-6 md:px-16 bg-surface-container-lowest border-t border-outline-variant/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h3 className="font-headline-lg font-bold text-primary">المميزات الأساسية</h3>
              <p className="font-body-md text-on-surface-variant">كل ما تحتاجه لتحويل أفكارك إلى واقع رقمي مذهل</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface p-8 rounded-3xl border border-outline-variant/50 hover:border-secondary/30 transition-all hover:shadow-sm group">
                <div className="w-14 h-14 bg-secondary-container text-secondary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                </div>
                <h4 className="font-headline-sm font-bold text-primary mb-3">توليد بذكاء اصطناعي</h4>
                <p className="font-body-md text-on-surface-variant leading-relaxed">اكتب وصف غرفتك وسيقوم الذكاء الاصطناعي ببناء مشهد ثلاثي الأبعاد بالكامل في ثوانٍ قليلة، مع اقتراحات ذكية لتوزيع الأثاث.</p>
              </div>
              
              <div className="bg-surface p-8 rounded-3xl border border-outline-variant/50 hover:border-secondary/30 transition-all hover:shadow-sm group">
                <div className="w-14 h-14 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">savings</span>
                </div>
                <h4 className="font-headline-sm font-bold text-primary mb-3">مراقبة التكاليف الذكية</h4>
                <p className="font-body-md text-on-surface-variant leading-relaxed">تتبع ميزانيتك مباشرة أثناء التصميم واحصل على بدائل اقتصادية ذكية للقطع فورية من الموردين المحليين لضمان عدم تجاوز الميزانية.</p>
              </div>

              <div className="bg-surface p-8 rounded-3xl border border-outline-variant/50 hover:border-secondary/30 transition-all hover:shadow-sm group">
                <div className="w-14 h-14 bg-tertiary-container text-on-tertiary-container rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">view_in_ar</span>
                </div>
                <h4 className="font-headline-sm font-bold text-primary mb-3">الواقع المعزز (AR)</h4>
                <p className="font-body-md text-on-surface-variant leading-relaxed">شاهد تصميمك النهائي في مساحتك الحقيقية باستخدام تقنية الواقع المعزز عبر كاميرا هاتفك المحمول بدقة عالية.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container text-on-surface-variant py-12 px-6 md:px-16 text-center border-t border-outline-variant">
        <h2 className="font-headline-md font-bold mb-4">رواق للتصميم الداخلي</h2>
        <p className="font-body-sm text-on-primary-container mb-8">© 2026 جميع الحقوق محفوظة لأستوديو التصميم الرقمي.</p>
      </footer>
    </div>
  );
}
