import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BRAND } from '@/lib/landing-data';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | رواق',
  description: 'كيف يجمع رواق بياناتك ويستخدمها ويحميها.',
};

/**
 * Privacy policy for the public site.
 *
 * The sections below describe the data flows the platform actually implements
 * (Clerk for authentication, Supabase for project storage, model providers for
 * generation). Have counsel review the wording against PDPL before launch.
 */
const SECTIONS: { titleAr: string; bodyAr: string[] }[] = [
  {
    titleAr: 'البيانات التي نجمعها',
    bodyAr: [
      'بيانات الحساب: الاسم والبريد الإلكتروني وصورة الملف الشخصي، وتُدار عبر مزوّد المصادقة لدينا.',
      'بيانات المشاريع: أوصاف المساحات التي تكتبها، أبعاد الغرف، القطع المختارة، الخامات، والتكاليف التقديرية.',
      'بيانات الاستخدام التقنية: نوع المتصفح والجهاز وسجلات الأخطاء، وتُستخدم لتحسين أداء المنصة واستقرارها.',
    ],
  },
  {
    titleAr: 'كيف نستخدم البيانات',
    bodyAr: [
      'توليد المخططات الفراغية والمشاهد ثلاثية الأبعاد ومطابقة الأثاث مع كاتالوجات الموردين.',
      'حفظ مشاريعك واسترجاعها عند تسجيل الدخول من أي جهاز.',
      'تحسين دقة محرك التوزيع الفراغي وجودة الاقتراحات.',
    ],
  },
  {
    titleAr: 'مشاركة البيانات',
    bodyAr: [
      'لا نبيع بياناتك الشخصية لأي طرف ثالث.',
      'نستعين بمزودي خدمة لتشغيل المنصة (المصادقة، الاستضافة، قواعد البيانات، ونماذج الذكاء الاصطناعي)، ويعالجون البيانات وفق تعليماتنا وبالقدر اللازم لتقديم الخدمة فقط.',
      'قد نفصح عن البيانات عند وجود التزام نظامي يقتضي ذلك.',
    ],
  },
  {
    titleAr: 'الاحتفاظ بالبيانات وحمايتها',
    bodyAr: [
      'نحتفظ ببيانات المشاريع طالما ظل حسابك نشطاً، ويمكنك حذف أي مشروع في أي وقت.',
      'تُنقل البيانات عبر اتصال مشفّر، ويقتصر الوصول إليها على الأنظمة والأشخاص المصرّح لهم.',
    ],
  },
  {
    titleAr: 'حقوقك',
    bodyAr: [
      'يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذف حسابك بالكامل.',
      `لممارسة أي من هذه الحقوق راسلنا على ${BRAND.email} وسنستجيب خلال مدة معقولة.`,
    ],
  },
  {
    titleAr: 'ملفات الارتباط',
    bodyAr: [
      'نستخدم ملفات ارتباط أساسية للحفاظ على جلسة تسجيل الدخول وتفضيلات الواجهة. لا تُستخدم هذه الملفات لأغراض إعلانية.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="rwaq-landing min-h-screen overflow-x-hidden" dir="rtl">
      <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 lg:py-28">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-rwaq-ink-muted transition-colors hover:text-rwaq-gold"
        >
          <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden="true" />
          <span>العودة إلى الصفحة الرئيسية</span>
        </Link>

        <h1 className="mt-8 text-3xl font-bold text-rwaq-ink sm:text-4xl">سياسة الخصوصية</h1>
        <p className="mt-3 text-sm text-rwaq-ink-faint">
          تشرح هذه الصفحة كيف يتعامل {BRAND.nameAr} مع بياناتك عند استخدام المنصة.
        </p>

        <div className="mt-12 space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.titleAr}>
              <h2 className="text-xl font-bold text-rwaq-ink">{section.titleAr}</h2>
              <ul className="mt-4 space-y-3">
                {section.bodyAr.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-1 w-1 shrink-0 rounded-pill bg-rwaq-gold/70"
                    />
                    <span className="text-[15px] leading-[1.9] text-rwaq-ink-muted">{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
          <h2 className="text-base font-medium text-rwaq-ink">تواصل معنا</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-rwaq-ink-muted">
            لأي استفسار يخص الخصوصية أو معالجة البيانات، راسلنا على{' '}
            <a href={`mailto:${BRAND.email}`} className="font-tech text-rwaq-gold hover:underline">
              {BRAND.email}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
