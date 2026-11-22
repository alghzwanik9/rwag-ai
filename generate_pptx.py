import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette
    COLOR_BG = RGBColor(11, 17, 32)        # #0B1120 Deep Navy
    COLOR_CARD = RGBColor(30, 41, 59)      # #1E293B Slate Dark
    COLOR_BORDER = RGBColor(51, 65, 85)    # #334155 Slate Border
    COLOR_PRIMARY = RGBColor(2, 132, 199)  # #0284C7 Cyan/Blue
    COLOR_ACCENT = RGBColor(16, 185, 129)  # #10B981 Emerald
    COLOR_AMBER = RGBColor(245, 158, 11)   # #F59E0B Amber
    COLOR_WHITE = RGBColor(248, 250, 252)  # #F8FAFC White
    COLOR_MUTED = RGBColor(148, 163, 184)  # #94A3B8 Gray

    blank_layout = prs.slide_layouts[6]

    def set_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG
        bg.line.fill.background()
        return bg

    def add_header(slide, title_text, category_text):
        # Header category badge
        badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(9.8), Inches(0.5), Inches(2.7), Inches(0.5))
        badge.fill.solid()
        badge.fill.fore_color.rgb = COLOR_CARD
        badge.line.color.rgb = COLOR_PRIMARY
        badge.line.width = Pt(1.5)
        tf_b = badge.text_frame
        tf_b.word_wrap = True
        p_b = tf_b.paragraphs[0]
        p_b.text = category_text
        p_b.font.name = "Cairo"
        p_b.font.size = Pt(12)
        p_b.font.bold = True
        p_b.font.color.rgb = COLOR_PRIMARY
        p_b.alignment = PP_ALIGN.CENTER

        # Project tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(4), Inches(0.5))
        tf_t = tag_box.text_frame
        p_t = tf_t.paragraphs[0]
        p_t.text = "🏛️ منصة رواق | Rwaq AI"
        p_t.font.name = "Cairo"
        p_t.font.size = Pt(14)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_ACCENT

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(1.1), Inches(11.7), Inches(0.9))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.name = "Cairo"
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE
        p.alignment = PP_ALIGN.RIGHT

    def add_card(slide, left, top, width, height, title, body_lines, accent_color=COLOR_PRIMARY):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = accent_color
        card.line.width = Pt(1)

        tb = slide.shapes.add_textbox(Inches(left + 0.25), Inches(top + 0.2), Inches(width - 0.5), Inches(height - 0.4))
        tf = tb.text_frame
        tf.word_wrap = True

        p_title = tf.paragraphs[0]
        p_title.text = title
        p_title.font.name = "Cairo"
        p_title.font.size = Pt(18)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_WHITE
        p_title.alignment = PP_ALIGN.RIGHT

        for line in body_lines:
            p = tf.add_paragraph()
            p.text = line
            p.font.name = "Cairo"
            p.font.size = Pt(13)
            p.font.color.rgb = COLOR_MUTED
            p.alignment = PP_ALIGN.RIGHT
            p.space_before = Pt(8)

    # ------------------ SLIDE 1: COVER ------------------
    s1 = prs.slides.add_slide(blank_layout)
    set_background(s1)

    # Center box
    box1 = s1.shapes.add_textbox(Inches(1.5), Inches(1.8), Inches(10.333), Inches(4.5))
    tf1 = box1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "🏛️ مـنـصـة رِواق | RWAQ AI"
    p.font.name = "Cairo"
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT
    p.alignment = PP_ALIGN.CENTER

    p2 = tf1.add_paragraph()
    p2.text = "الجيل القادم لتصميم المساحات الداخلية بالذكاء الاصطناعي التوليدي والتقنيات ثلاثية الأبعاد"
    p2.font.name = "Cairo"
    p2.font.size = Pt(36)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_WHITE
    p2.alignment = PP_ALIGN.CENTER
    p2.space_before = Pt(20)

    p3 = tf1.add_paragraph()
    p3.text = "تحويل الوصف النصي المباشر إلى بيئات ثلاثية الأبعاد تفاعلية وفورية، بأثاث حقيقي موثوق ومحاكاة دقيقة في المتصفح."
    p3.font.name = "Cairo"
    p3.font.size = Pt(18)
    p3.font.color.rgb = COLOR_MUTED
    p3.alignment = PP_ALIGN.CENTER
    p3.space_before = Pt(24)

    p4 = tf1.add_paragraph()
    p4.text = "ملف العرض للمشاركة في المسابقة | 2026"
    p4.font.name = "Cairo"
    p4.font.size = Pt(14)
    p4.font.color.rgb = COLOR_PRIMARY
    p4.alignment = PP_ALIGN.CENTER
    p4.space_before = Pt(40)

    # ------------------ SLIDE 2: THE PROBLEM ------------------
    s2 = prs.slides.add_slide(blank_layout)
    set_background(s2)
    add_header(s2, "معضلة التصميم الداخلي وتأثيث المساحات", "المشكلة والتحدي")
    add_card(s2, 0.8, 2.2, 3.6, 4.5, "1. عجز التصور المكاني (78%)", [
        "• يعجز معظم العملاء عن تخيل تناسق الأبعاد وتوزيع الأثاث اعتماداً على الصور المسطحة 2D.",
        "• صعوبة تقدير ملاءمة أحجام القطع لمساحة الغرفة الواقعية قبل الشراء.",
        "• تردد المشترين وخوفهم من اتخاذ قرارات خاطئة."
    ], COLOR_BORDER)
    add_card(s2, 4.8, 2.2, 3.6, 4.5, "2. تكلفة وبطء الرندرة اليدوية", [
        "• الاستعانة بمصمم محترف مكلفة جداً وتستغرق أسابيع لتسليم المخططات والرندرة.",
        "• أي تعديل بسيط في لون جدار أو مكان طاولة يتطلب إعادة رندرة طويلة ومكلفة.",
        "• غياب أدوات تفاعلية سريعة بيد العميل العادي."
    ], COLOR_AMBER)
    add_card(s2, 8.8, 2.2, 3.6, 4.5, "3. خسائر التجزئة ومعدل الإرجاع", [
        "• تكبد متاجر الأثاث ملايين سنوياً بسبب إرجاع المنتجات لعدم مناسبة أبعادها للغرف.",
        "• هدر كبير في سلاسل الإمداد وتكاليف الشحن والتركيب المعاكس.",
        "• انخفاض معدل التحويل في المتاجر الإلكترونية للأثاث."
    ], COLOR_PRIMARY)

    # ------------------ SLIDE 3: THE SOLUTION ------------------
    s3 = prs.slides.add_slide(blank_layout)
    set_background(s3)
    add_header(s3, "الحل المبتكر: منصة رواق (Rwaq AI)", "الحل والقيمة المضافة")
    add_card(s3, 0.8, 2.2, 3.6, 4.5, "توليد فوري (Prompt-to-3D)", [
        "• تحويل النص المباشر مثل: 'صمم غرفة معيشة نيوكلاسيك بإضاءة صباحية' إلى مشهد 3D متكامل.",
        "• فهم دلالي فائق لمتطلبات المساحة وأنماط التصميم.",
        "• النتيجة تظهر في ثوانٍ بدلاً من أيام وأسابيع."
    ], COLOR_PRIMARY)
    add_card(s3, 4.8, 2.2, 3.6, 4.5, "تفاعل حي كامل (Interactive 3D)", [
        "• تجول حر وكاميرا مدارية 360 درجة في المتصفح عبر WebGL/Three.js.",
        "• تغيير أوقات اليوم والإضاءة (صباح، ممطر، ليلي) فورياً.",
        "• تعديل ألوان الجدران والأرضيات والخامات بنقرة واحدة."
    ], COLOR_ACCENT)
    add_card(s3, 8.8, 2.2, 3.6, 4.5, "أثاث حقيقي قابل للشراء", [
        "• ربط مباشر بكتالوجات أثاث حقيقية مفهرسة بقاعدة متجهات LanceDB.",
        "• لا توليد لأشكال وهمية غير قابلة للتنفيذ.",
        "• سلة تسوق موحدة بأسعار القطع وروابط شرائها."
    ], COLOR_AMBER)

    # ------------------ SLIDE 4: USER FLOW ------------------
    s4 = prs.slides.add_slide(blank_layout)
    set_background(s4)
    add_header(s4, "رحلة المستخدم وتجربة الاستخدام (User Flow)", "تجربة المستخدم")
    add_card(s4, 0.8, 2.2, 2.7, 4.5, "المرحلة 1: الطلب", [
        "إدخال المتطلبات نصياً أو اختيار النمط المفضل (مودرن، بوهيمي، نيوكلاسيك) أو رفع أبعاد الغرفة."
    ], COLOR_PRIMARY)
    add_card(s4, 3.8, 2.2, 2.7, 4.5, "المرحلة 2: التوليد", [
        "يقوم الذكاء الاصطناعي بتوزيع قطع الأثاث هندسياً وفق قيود معمارية دقيقة لمنع التداخل."
    ], COLOR_PRIMARY)
    add_card(s4, 6.8, 2.2, 2.7, 4.5, "المرحلة 3: المعاينة", [
        "استعراض الغرفة ثلاثية الأبعاد والتجول فيها، وتغيير الإضاءة والألوان واستبدال القطع حياً."
    ], COLOR_ACCENT)
    add_card(s4, 9.8, 2.2, 2.7, 4.5, "المرحلة 4: القرار", [
        "الحصول على تكلفة الأثاث الإجمالية وروابط الشراء الفوري أو تصدير ملفات 3D التنفيذية."
    ], COLOR_AMBER)

    # ------------------ SLIDE 5: TECHNICAL ARCHITECTURE ------------------
    s5 = prs.slides.add_slide(blank_layout)
    set_background(s5)
    add_header(s5, "النموذج التقني والمعماري (System Architecture)", "الهندسة والتقنية")
    add_card(s5, 0.8, 2.2, 3.6, 4.5, "1. الواجهة التفاعلية (Frontend)", [
        "• Next.js 15 & React Three Fiber (R3F)",
        "• رندرة ثلاثية الأبعاد فورية داخل المتصفح بمعدل 60FPS.",
        "• تصميم متجاوب يدعم اللغة العربية (RTL) مع Tailwind CSS v4 وإدارة حالة المشهد عبر Zustand."
    ], COLOR_PRIMARY)
    add_card(s5, 4.8, 2.2, 3.6, 4.5, "2. خادم الذكاء الاصطناعي (Backend)", [
        "• FastAPI & Gemini Reasoning Engine",
        "• استخلاص المعالم وتوزيع الأثاث بدقة.",
        "• قاعدة بيانات متجهات سريعة (LanceDB) للبحث الدلالي ومطابقة مجسمات الأثاث 3D من الكتالوج."
    ], COLOR_ACCENT)
    add_card(s5, 8.8, 2.2, 3.6, 4.5, "3. محرك الرندرة (Headless Engine)", [
        "• Headless Blender Python Automation",
        "• خط أنابيب من 5 مراحل لتركيب المشهد والتحقق من سلامة الأبعاد هندسياً.",
        "• تصدير آلي لملفات GLB خفيفة ومحسنة للبث الشبكي الفوري."
    ], COLOR_AMBER)

    # ------------------ SLIDE 6: SPATIAL CONSTRAINTS ------------------
    s6 = prs.slides.add_slide(blank_layout)
    set_background(s6)
    add_header(s6, "محرك القيود الهندسية والتصحيح الذاتي", "الدقة الهندسية")
    add_card(s6, 0.8, 2.2, 3.6, 4.5, "مخطط معايير صارم (Strict Schema)", [
        "• فرض قيود إحداثية هندسية ملزمة تمنع طفو الأجسام.",
        "• معيار إلزام الالتصاق بالأرضية: (t_y = 0.0) لكافة الكتل.",
        "• تحديد مسارات الحركة وممرات المرور داخل الغرفة."
    ], COLOR_PRIMARY)
    add_card(s6, 4.8, 2.2, 3.6, 4.5, "التصحيح التلقائي (Self-Correction)", [
        "• في حال حدوث خطأ أو تداخل مكاني، يرصد الوكيل الشذوذ الهندسي فوراً.",
        "• إعادة ضبط وتصحيح المشهد برمجياً قبل التصدير النهائي للمستخدم.",
        "• القضاء التام على ظاهرة الهلوسة البصرية الشائعة في نماذج الذكاء التوليدي."
    ], COLOR_ACCENT)
    add_card(s6, 8.8, 2.2, 3.6, 4.5, "محاكاة المواد والفيزياء (PBR)", [
        "• تحويل أكواد الألوان Hex تلقائياً إلى خامات Linear RGB واقعية.",
        "• محاكاة دقيقة لانعكاسات الضوء والظلال بناءً على وقت اليوم.",
        "• إبراز ملمس الخشب والجلد والأقمشة بدقة واقعية."
    ], COLOR_AMBER)

    # ------------------ SLIDE 7: COMPETITIVE ADVANTAGE ------------------
    s7 = prs.slides.add_slide(blank_layout)
    set_background(s7)
    add_header(s7, "الميزة التنافسية والقيمة المقارنة في السوق", "الميزة التنافسية")
    
    # Large comparative table
    rows, cols = 5, 4
    table_shape = s7.shapes.add_table(rows, cols, Inches(0.8), Inches(2.2), Inches(11.7), Inches(4.5))
    table = table_shape.table

    headers = ["المعيار", "مكاتب التصميم التقليدية", "مولدات الذكاء (2D)", "منصة رواق (Rwaq AI)"]
    for c, h in enumerate(headers):
        cell = table.cell(0, c)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_PRIMARY if c == 3 else COLOR_CARD
        p = cell.text_frame.paragraphs[0]
        p.font.name = "Cairo"
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE
        p.alignment = PP_ALIGN.CENTER

    data = [
        ["زمن التسليم", "من 3 إلى 14 يوماً", "ثوانٍ معدودة", "أقل من دقيقة (فوري تفاعلي)"],
        ["طبيعة المخرج", "صور ثابتة (2D Renders)", "صورة مسطحة جامدة", "بيئة 3D تفاعلية 360° في المتصفح"],
        ["التعديل الحي", "مكلف ويتطلب أيام عمل", "مستحيل (يولد صورة جديدة)", "تعديل فوري للخامات والإضاءة"],
        ["الربط بالشراء", "بحث يدوي مجهد للمقاسات", "غير متوفر (أشكال خيالية)", "ربط مباشر بكتالوجات أثاث حقيقية"]
    ]

    for r, row_data in enumerate(data):
        for c, val in enumerate(row_data):
            cell = table.cell(r + 1, c)
            cell.text = val
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(16, 28, 48) if c == 3 else COLOR_CARD
            p = cell.text_frame.paragraphs[0]
            p.font.name = "Cairo"
            p.font.size = Pt(12)
            p.font.bold = (c == 3)
            p.font.color.rgb = COLOR_ACCENT if c == 3 else COLOR_MUTED
            p.alignment = PP_ALIGN.CENTER

    # ------------------ SLIDE 8: BUSINESS MODEL ------------------
    s8 = prs.slides.add_slide(blank_layout)
    set_background(s8)
    add_header(s8, "نموذج العمل ومصادر تحقيق الإيرادات", "نموذج العمل")
    add_card(s8, 0.8, 2.2, 3.6, 4.5, "1. اشتراكات المحترفين (Pro SaaS)", [
        "• باقات للمصممين الداخليين والمكاتب الهندسية لتوليد غير محدود وتصدير ملفات CAD/3D عالية الجودة.",
        "• ميزات متقدمة للعلامة التجارية المخصصة وتصدير تقارير التسعير للعملاء."
    ], COLOR_PRIMARY)
    add_card(s8, 4.8, 2.2, 3.6, 4.5, "2. حلول قطاع التجزئة (Enterprise API)", [
        "• تزويد متاجر الأثاث الكبرى (إيكيا، هوم سنتر وغيرهم) بمحرك رواق لتضمين زر 'جرب في مساحتك بتقنية 3D' داخل متاجرهم الإلكترونية.",
        "• نموذج ترخيص برمجيات شهري وفق حجم الاستخدام (B2B SaaS)."
    ], COLOR_ACCENT)
    add_card(s8, 8.8, 2.2, 3.6, 4.5, "3. عمولات التجارة (Affiliate Market)", [
        "• نسبة عمولة متفق عليها عن كل عملية شراء لأثاث تم اختياره من خلال المشاهد التي ولدها رواق.",
        "• رفع معدلات الشراء المباشر وخفض نسب الإرجاع للمتاجر الشريكة."
    ], COLOR_AMBER)

    # ------------------ SLIDE 9: TRACTION & ROADMAP ------------------
    s9 = prs.slides.add_slide(blank_layout)
    set_background(s9)
    add_header(s9, "سجل الإنجاز وخارطة الطريق القادمة", "الإنجاز والخطة")
    add_card(s9, 0.8, 2.2, 5.6, 4.5, "✅ المنجز في النموذج الأولي (MVP)", [
        "• بناء الواجهة التفاعلية الكاملة بـ Next.js 15 و Three.js باللغة العربية.",
        "• تكامل خط أنابيب الـ Orchestrator ورندرة Blender وتصدير GLB آلياً.",
        "• محاكاة الإضاءة والطقس وتعديل الخامات حياً في المتصفح.",
        "• فهرسة أصول الأثاث ثلاثية الأبعاد وربط قاعدة LanceDB."
    ], COLOR_ACCENT)
    add_card(s9, 6.8, 2.2, 5.6, 4.5, "🚀 مستهدفات المرحلة القادمة", [
        "• إطلاق واجهة المحادثة التوليدية الكاملة وربط نماذج الاستدلال المتقدمة.",
        "• إضافة ميزة مسح المخططات المعمارية بالذكاء الاصطناعي (Floor Plan Scanner).",
        "• عقد أول شراكة استراتيجية وتكامل مباشر مع متجر أثاث محلي.",
        "• إطلاق النسخة التجريبية العامة للجمهور والمصممين."
    ], COLOR_PRIMARY)

    # ------------------ SLIDE 10: CLOSING ------------------
    s10 = prs.slides.add_slide(blank_layout)
    set_background(s10)
    box10 = s10.shapes.add_textbox(Inches(1.5), Inches(1.8), Inches(10.333), Inches(4.5))
    tf10 = box10.text_frame
    tf10.word_wrap = True

    p = tf10.paragraphs[0]
    p.text = "🏛️ رِواق | RWAQ AI"
    p.font.name = "Cairo"
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT
    p.alignment = PP_ALIGN.CENTER

    p2 = tf10.add_paragraph()
    p2.text = "نعيد كتابة قواعد تصميم الفضاءات الداخلية"
    p2.font.name = "Cairo"
    p2.font.size = Pt(36)
    p2.font.bold = True
    p2.font.color.rgb = COLOR_WHITE
    p2.alignment = PP_ALIGN.CENTER
    p2.space_before = Pt(20)

    p3 = tf10.add_paragraph()
    p3.text = "رواق هو الجسر الذكي بين الخيال والواقع الملموس. جاهزون للإجابة على استفساراتكم وبدء تجربة العرض الحي."
    p3.font.name = "Cairo"
    p3.font.size = Pt(18)
    p3.font.color.rgb = COLOR_MUTED
    p3.alignment = PP_ALIGN.CENTER
    p3.space_before = Pt(24)

    p4 = tf10.add_paragraph()
    p4.text = "الموقع: rwaq-ai.com  |  البريد: contact@rwaq-ai.com"
    p4.font.name = "Cairo"
    p4.font.size = Pt(16)
    p4.font.color.rgb = COLOR_PRIMARY
    p4.alignment = PP_ALIGN.CENTER
    p4.space_before = Pt(36)

    output_path = os.path.abspath("Rwaq_AI_Competition_Presentation.pptx")
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    create_deck()
