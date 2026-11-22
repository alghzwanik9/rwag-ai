import os
from pathlib import Path

from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

BASE_DIR = Path(__file__).resolve().parent
SCREENSHOTS_DIR = BASE_DIR / "docs" / "screenshots"

# ── Single Source of Truth: 10-Slide Competition Deck Content ────────────────
DECK_META = {
    "brand_ar": "منصة رِواق",
    "brand_en": "RWAQ AI",
    "year": "2026",
    "footer": "Rwaq AI — منصة رواق للذكاء الاصطناعي المعماري | العرض التقديمي 2026",
}

IMG_ARCHITECTURE = SCREENSHOTS_DIR / "01_architecture_pipeline.png"
IMG_STUDIO = SCREENSHOTS_DIR / "02_studio_3d_workflow.png"
IMG_MAARAD = SCREENSHOTS_DIR / "03_maarad_catalog_showcase.png"
IMG_AUDIT_QUOTE = SCREENSHOTS_DIR / "04_spatial_audit_and_quote.png"

# Color Palette
COLOR_BG = RGBColor(11, 17, 32)         # #0B1120 Deep Navy
COLOR_CARD = RGBColor(22, 33, 56)       # #162138 Slate Navy
COLOR_CARD_DARK = RGBColor(15, 23, 42)  # #0F172A Darker Panel
COLOR_BORDER = RGBColor(51, 65, 85)     # #334155 Slate Border
COLOR_PRIMARY = RGBColor(2, 132, 199)   # #0284C7 Cyan Blue
COLOR_CYAN = RGBColor(56, 189, 248)     # #38BDF8 Bright Cyan
COLOR_ACCENT = RGBColor(16, 185, 129)   # #10B981 Emerald
COLOR_AMBER = RGBColor(245, 158, 11)    # #F59E0B Amber
COLOR_WHITE = RGBColor(248, 250, 252)   # #F8FAFC White
COLOR_SLATE = RGBColor(203, 213, 225)   # #CBD5E1 Light Slate
COLOR_MUTED = RGBColor(148, 163, 184)   # #94A3B8 Muted Slate


def _ensure_font_rtl_and_lang(text_frame):
    """Inject OpenXML rtl='1' on every a:pPr and lang='ar-SA' on every a:rPr/a:endParaRPr."""
    for p in text_frame.paragraphs:
        p_el = p._p
        pPr = p_el.find(qn("a:pPr"))
        if pPr is None:
            pPr = etree.Element(qn("a:pPr"))
            p_el.insert(0, pPr)
        pPr.set("rtl", "1")

        for r_el in p_el.findall(qn("a:r")):
            rPr = r_el.find(qn("a:rPr"))
            if rPr is None:
                rPr = etree.Element(qn("a:rPr"))
                r_el.insert(0, rPr)
            rPr.set("lang", "ar-SA")
            rPr.set("altLang", "en-US")
            # Ensure Complex Script font is set to Cairo for clean Arabic shaping
            if rPr.find(qn("a:cs")) is None:
                cs = etree.SubElement(rPr, qn("a:cs"))
                cs.set("typeface", "Cairo")

        end_rPr = p_el.find(qn("a:endParaRPr"))
        if end_rPr is not None:
            end_rPr.set("lang", "ar-SA")
            end_rPr.set("altLang", "en-US")


def enforce_presentation_rtl(prs: Presentation):
    """Apply rtl='1' and lang='ar-SA' across every text frame and table cell in the deck."""
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                _ensure_font_rtl_and_lang(shape.text_frame)
            if shape.has_table:
                tbl = shape.table
                # Enable RTL table column order in tblPr
                tblPr = tbl._tbl.find(qn("a:tblPr"))
                if tblPr is not None:
                    tblPr.set("rtl", "1")
                for row in tbl.rows:
                    for cell in row.cells:
                        _ensure_font_rtl_and_lang(cell.text_frame)


def create_deck():
    for img_path in (IMG_ARCHITECTURE, IMG_STUDIO, IMG_MAARAD, IMG_AUDIT_QUOTE):
        if not img_path.exists():
            raise FileNotFoundError(f"Missing required visual asset: {img_path}")

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    def set_background(slide):
        bg = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5)
        )
        bg.fill.solid()
        bg.fill.fore_color.rgb = COLOR_BG
        bg.line.fill.background()

        # Top brand accent strip (dual tone)
        bar_l = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(6.666), Inches(0.08)
        )
        bar_l.fill.solid()
        bar_l.fill.fore_color.rgb = COLOR_PRIMARY
        bar_l.line.fill.background()

        bar_r = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(6.666), Inches(0), Inches(6.667), Inches(0.08)
        )
        bar_r.fill.solid()
        bar_r.fill.fore_color.rgb = COLOR_ACCENT
        bar_r.line.fill.background()
        return bg

    def add_header(slide, title_text, subtitle_text, category_text, slide_num):
        # Category pill (top-left in RTL reading balance)
        badge = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(0.32), Inches(2.9), Inches(0.42)
        )
        badge.fill.solid()
        badge.fill.fore_color.rgb = COLOR_CARD
        badge.line.color.rgb = COLOR_PRIMARY
        badge.line.width = Pt(1.25)
        tf_b = badge.text_frame
        tf_b.word_wrap = True
        tf_b.vertical_anchor = MSO_ANCHOR.MIDDLE
        p_b = tf_b.paragraphs[0]
        p_b.text = category_text
        p_b.font.name = "Cairo"
        p_b.font.size = Pt(11)
        p_b.font.bold = True
        p_b.font.color.rgb = COLOR_CYAN
        p_b.alignment = PP_ALIGN.CENTER

        # Brand tag (top-right)
        tag_box = slide.shapes.add_textbox(Inches(8.7), Inches(0.28), Inches(4.0), Inches(0.45))
        tf_t = tag_box.text_frame
        p_t = tf_t.paragraphs[0]
        p_t.text = "منصة رِواق | Rwaq AI"
        p_t.font.name = "Cairo"
        p_t.font.size = Pt(14)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_ACCENT
        p_t.alignment = PP_ALIGN.RIGHT

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.6), Inches(0.84), Inches(12.1), Inches(0.65))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.name = "Cairo"
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE
        p.alignment = PP_ALIGN.RIGHT

        # Subtitle
        sub_box = slide.shapes.add_textbox(Inches(0.6), Inches(1.42), Inches(12.1), Inches(0.42))
        tf_s = sub_box.text_frame
        tf_s.word_wrap = True
        p_s = tf_s.paragraphs[0]
        p_s.text = subtitle_text
        p_s.font.name = "Cairo"
        p_s.font.size = Pt(13)
        p_s.font.color.rgb = COLOR_MUTED
        p_s.alignment = PP_ALIGN.RIGHT

        # Footer divider & bar
        line = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0.6), Inches(6.95), Inches(12.13), Inches(0.015)
        )
        line.fill.solid()
        line.fill.fore_color.rgb = COLOR_BORDER
        line.line.fill.background()

        f_left = slide.shapes.add_textbox(Inches(0.6), Inches(7.0), Inches(2.5), Inches(0.35))
        pf_l = f_left.text_frame.paragraphs[0]
        pf_l.text = f"{slide_num:02d} / 10"
        pf_l.font.name = "Cairo"
        pf_l.font.size = Pt(10)
        pf_l.font.bold = True
        pf_l.font.color.rgb = COLOR_CYAN
        pf_l.alignment = PP_ALIGN.LEFT

        f_right = slide.shapes.add_textbox(Inches(4.0), Inches(7.0), Inches(8.73), Inches(0.35))
        pf_r = f_right.text_frame.paragraphs[0]
        pf_r.text = DECK_META["footer"]
        pf_r.font.name = "Cairo"
        pf_r.font.size = Pt(10)
        pf_r.font.color.rgb = COLOR_MUTED
        pf_r.alignment = PP_ALIGN.RIGHT

    def add_card(
        slide,
        left,
        top,
        width,
        height,
        title,
        body_lines,
        accent_color=COLOR_PRIMARY,
        title_size=15,
        body_size=11.5,
    ):
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height)
        )
        card.fill.solid()
        card.fill.fore_color.rgb = COLOR_CARD
        card.line.color.rgb = accent_color
        card.line.width = Pt(1.25)

        # Right-edge accent bar (RTL anchor)
        bar = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE,
            Inches(left + width - 0.08),
            Inches(top + 0.14),
            Inches(0.08),
            Inches(height - 0.28),
        )
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent_color
        bar.line.fill.background()

        tb = slide.shapes.add_textbox(
            Inches(left + 0.18), Inches(top + 0.14), Inches(width - 0.42), Inches(height - 0.26)
        )
        tf = tb.text_frame
        tf.word_wrap = True

        p_title = tf.paragraphs[0]
        p_title.text = title
        p_title.font.name = "Cairo"
        p_title.font.size = Pt(title_size)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_WHITE
        p_title.alignment = PP_ALIGN.RIGHT

        for line in body_lines:
            p = tf.add_paragraph()
            p.text = line
            p.font.name = "Cairo"
            p.font.size = Pt(body_size)
            p.font.color.rgb = COLOR_SLATE
            p.alignment = PP_ALIGN.RIGHT
            p.space_before = Pt(5)

    def add_framed_visual(slide, img_path: Path, left: float, top: float, width: float, caption: str):
        height = width * 9.0 / 16.0
        frame = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(left - 0.06),
            Inches(top - 0.06),
            Inches(width + 0.12),
            Inches(height + 0.44),
        )
        frame.fill.solid()
        frame.fill.fore_color.rgb = COLOR_CARD_DARK
        frame.line.color.rgb = COLOR_BORDER
        frame.line.width = Pt(1.25)

        slide.shapes.add_picture(str(img_path), Inches(left), Inches(top), width=Inches(width))

        cap_box = slide.shapes.add_textbox(
            Inches(left), Inches(top + height + 0.04), Inches(width), Inches(0.32)
        )
        p_c = cap_box.text_frame.paragraphs[0]
        p_c.text = caption
        p_c.font.name = "Cairo"
        p_c.font.size = Pt(9.5)
        p_c.font.color.rgb = COLOR_MUTED
        p_c.alignment = PP_ALIGN.CENTER

    # ── SLIDE 1: COVER ───────────────────────────────────────────────────────
    s1 = prs.slides.add_slide(blank_layout)
    set_background(s1)

    pill_s1 = s1.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.4), Inches(1.25), Inches(4.533), Inches(0.55)
    )
    pill_s1.fill.solid()
    pill_s1.fill.fore_color.rgb = COLOR_CARD
    pill_s1.line.color.rgb = COLOR_ACCENT
    pill_s1.line.width = Pt(1.5)
    tf_p1 = pill_s1.text_frame
    tf_p1.vertical_anchor = MSO_ANCHOR.MIDDLE
    p_p1 = tf_p1.paragraphs[0]
    p_p1.text = "منصة رِواق | RWAQ AI  •  AI + WEBGL 3D"
    p_p1.font.name = "Cairo"
    p_p1.font.size = Pt(14)
    p_p1.font.bold = True
    p_p1.font.color.rgb = COLOR_ACCENT
    p_p1.alignment = PP_ALIGN.CENTER

    box1 = s1.shapes.add_textbox(Inches(1.1), Inches(2.05), Inches(11.133), Inches(3.3))
    tf1 = box1.text_frame
    tf1.word_wrap = True

    p_h1 = tf1.paragraphs[0]
    p_h1.text = "الجيل القادم لتصميم المساحات الداخلية بالذكاء الاصطناعي التوليدي والويب ثلاثي الأبعاد"
    p_h1.font.name = "Cairo"
    p_h1.font.size = Pt(34)
    p_h1.font.bold = True
    p_h1.font.color.rgb = COLOR_WHITE
    p_h1.alignment = PP_ALIGN.CENTER

    p_sub = tf1.add_paragraph()
    p_sub.text = "تحويل الأوصاف النصية والصور المرجعية إلى بيئات ثلاثية الأبعاد تفاعلية داخل المتصفح، مع تدقيق هندسي حتمي وفق معايير نيوفرت وكود البناء السعودي وتسعير حي بالريال السعودي."
    p_sub.font.name = "Cairo"
    p_sub.font.size = Pt(16)
    p_sub.font.color.rgb = COLOR_SLATE
    p_sub.alignment = PP_ALIGN.CENTER
    p_sub.space_before = Pt(20)

    # Bottom tech badges strip on Slide 1
    badges_s1 = [
        ("Next.js 16.4.6 + R3F 9.8.2", COLOR_PRIMARY),
        ("Gemini 2.5 Flash Vision", COLOR_ACCENT),
        ("LanceDB RAG (3,694 سجل)", COLOR_AMBER),
        ("تدقيق مكاني حتمي + PDF", COLOR_CYAN),
    ]
    bx = 0.9
    for txt, col in badges_s1:
        sh = s1.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, Inches(bx), Inches(5.6), Inches(2.7), Inches(0.55)
        )
        sh.fill.solid()
        sh.fill.fore_color.rgb = COLOR_CARD
        sh.line.color.rgb = col
        sh.line.width = Pt(1.2)
        tfs = sh.text_frame
        tfs.vertical_anchor = MSO_ANCHOR.MIDDLE
        ps = tfs.paragraphs[0]
        ps.text = txt
        ps.font.name = "Cairo"
        ps.font.size = Pt(11.5)
        ps.font.bold = True
        ps.font.color.rgb = COLOR_WHITE
        ps.alignment = PP_ALIGN.CENTER
        bx += 2.94

    meta_box = s1.shapes.add_textbox(Inches(1.5), Inches(6.5), Inches(10.333), Inches(0.45))
    pm = meta_box.text_frame.paragraphs[0]
    pm.text = "ملف العرض الرسمي للمسابقة  |  2026"
    pm.font.name = "Cairo"
    pm.font.size = Pt(13)
    pm.font.color.rgb = COLOR_CYAN
    pm.alignment = PP_ALIGN.CENTER

    # ── SLIDE 2: THE PROBLEM ─────────────────────────────────────────────────
    s2 = prs.slides.add_slide(blank_layout)
    set_background(s2)
    add_header(
        s2,
        "معضلة التصميم الداخلي وتأثيث المساحات",
        "فجوة حقيقية بين تصور العميل وواقع الأبعاد والخلوص والتكلفة قبل الشراء والتنفيذ",
        "المشكلة والتحدي",
        2,
    )
    add_card(
        s2,
        8.73,
        2.05,
        4.0,
        4.65,
        "1. فجوة التصور المكاني والأبعاد",
        [
            "• الاعتماد على الصور المسطحة (2D) يصعّب تقدير المقاسات الواقعية وتناسب الكتل داخل الغرفة.",
            "• مولدات الصور بالذكاء الاصطناعي تنتج لقطات جمالية بأثاث خيالي غير مرتبط بمقاسات حقيقية أو معايير حركة.",
            "• غياب التحقق المسبق من مسارات الحركة وخلوص الجلوس قبل اتخاذ القرار.",
        ],
        COLOR_PRIMARY,
        title_size=16,
        body_size=12.5,
    )
    add_card(
        s2,
        4.66,
        2.05,
        4.0,
        4.65,
        "2. بطء وتكلفة الرندرة التقليدية",
        [
            "• الاستعانة بمكاتب التصميم التقليدية تتطلب أياماً وأسابيع لإخراج المخططات واللقطات ثلاثية الأبعاد.",
            "• أي تعديل في لون جدار أو خامة أرضية أو توزيع قطعة يستلزم إعادة إعداد ورندرة مكلفة.",
            "• عدم توفر أداة عربية تفاعلية تمنح المستخدم والمصمم تجربة فورية دون برامج ثقيلة.",
        ],
        COLOR_AMBER,
        title_size=16,
        body_size=12.5,
    )
    add_card(
        s2,
        0.6,
        2.05,
        4.0,
        4.65,
        "3. مخاطرة الشراء ومرتجعات التجزئة",
        [
            "• يواجه المشتري صعوبة في معرفة التكلفة الإجمالية للغرفة بدقة قبل التنقل بين عشرات الصفحات.",
            "• تتحمل متاجر الأثاث تكاليف لوجستية مرتفعة عند إرجاع قطع لا تلائم أبعاد الغرفة الفعلية.",
            "• الحاجة لربط التصميم مباشرة بكتالوجات موثوقة وبدائل ميزانية شفافة بالريال السعودي.",
        ],
        COLOR_ACCENT,
        title_size=16,
        body_size=12.5,
    )

    # ── SLIDE 3: THE SOLUTION (EMBED STUDIO WORKFLOW VISUAL) ─────────────────
    s3 = prs.slides.add_slide(blank_layout)
    set_background(s3)
    add_header(
        s3,
        "الحل المبتكر: منصة رواق (Rwaq AI)",
        "من الوصف النصي أو الصورة المرجعية إلى استوديو 3D تفاعلي وتدقيق هندسي وتسعير فوري بالريال",
        "الحل والقيمة المضافة",
        3,
    )
    add_framed_visual(
        s3,
        IMG_STUDIO,
        0.6,
        2.05,
        7.1,
        "استوديو رواق (/studio): مسار التوليد رباعي المراحل + الخامات والنوافذ + التدقيق المكاني الفوري",
    )
    add_card(
        s3,
        7.95,
        2.05,
        4.78,
        1.42,
        "توليد هيكلي ذكي (Prompt & Vision-to-3D)",
        [
            "• توليد مخطط 3D منظم عبر Gemini 2.5 Flash مدعوم بفهم الصور ومعايير نيوفرت وكود البناء السعودي.",
            "• نوافذ فعلية (RealRoom) وألوان جدران وأرضيات ومزاج إضاءة تلقائي.",
        ],
        COLOR_PRIMARY,
        title_size=14,
        body_size=11,
    )
    add_card(
        s3,
        7.95,
        3.62,
        4.78,
        1.42,
        "تفاعل حي ومقاوم للانقطاع (WebGL + Rapier)",
        [
            "• تجميع فوري بالمتصفح عبر R3F 9.8.2 وفيزياء Rapier 2.2.0 وإضاءة Lightformer دون الاعتماد على CDN.",
            "• محادثة توليدية حية (/api/v1/chat) وتبديل خامات وإضاءة (صباح، ممطر، ليلي).",
        ],
        COLOR_ACCENT,
        title_size=14,
        body_size=11,
    )
    add_card(
        s3,
        7.95,
        5.19,
        4.78,
        1.42,
        "أثاث حقيقي وتسعير شفاف بالريال (SAR)",
        [
            "• مطابقة بـ 3,694 سجل أثاث من إيكيا في LanceDB مع روابط الشراء المباشرة (store_url) وبدائل الميزانية.",
            "• تصدير عرض سعر PDF وجدول مواد (PrintReport) ومعاينة AR فورية.",
        ],
        COLOR_AMBER,
        title_size=14,
        body_size=11,
    )

    # ── SLIDE 4: USER FLOW (4 STAGES) ────────────────────────────────────────
    s4 = prs.slides.add_slide(blank_layout)
    set_background(s4)
    add_header(
        s4,
        "رحلة المستخدم في 4 مراحل متكاملة",
        "مسار عملي يبدأ من الفكرة النصية أو القوالب الجاهزة وينتهي بعرض سعر معتمد وتجربة تفاعلية",
        "تجربة المستخدم",
        4,
    )
    add_card(
        s4,
        9.83,
        2.1,
        2.9,
        4.55,
        "01 التحليل (Analyze)",
        [
            "• إدخال وصف عربي أو إنجليزي للغرفة أو إرفاق صورة مرجعية.",
            "• أو البدء فوراً من أحد القوالب الستة الجاهزة في المعرض (/maarad).",
            "• استخلاص النمط والأبعاد وتفضيلات الإضاءة عبر Gemini 2.5 Flash.",
        ],
        COLOR_PRIMARY,
        title_size=15,
        body_size=11.5,
    )
    add_card(
        s4,
        6.75,
        2.1,
        2.9,
        4.55,
        "02 المطابقة (Match)",
        [
            "• بحث متجهي ثنائي اللغة (384 بُعداً) داخل LanceDB عبر 3,694 سجل أثاث.",
            "• مطابقة القطع مع مجسمات GLB المحلية عالية الدقة (>1 MB).",
            "• استدعاء معايير التصميم المعمارية ونيوفرت تلقائياً.",
        ],
        COLOR_ACCENT,
        title_size=15,
        body_size=11.5,
    )
    add_card(
        s4,
        3.68,
        2.1,
        2.9,
        4.55,
        "03 البناء والتخصيص (Build)",
        [
            "• تجميع المشهد 3D داخل المتصفح بسرعة 60FPS عبر R3F 9.8.2 و Rapier 2.2.0.",
            "• تعديل الخامات والنوافذ والطقس وتنفيذ أوامر المحادثة الحية (/api/v1/chat).",
            "• حفظ واسترجاع المشاريع سحابياً عبر Supabase و Clerk.",
        ],
        COLOR_CYAN,
        title_size=15,
        body_size=11.5,
    )
    add_card(
        s4,
        0.6,
        2.1,
        2.9,
        4.55,
        "04 التدقيق والتنفيذ (Cost)",
        [
            "• تشغيل التدقيق المكاني الحتمي (SpatialAuditModal) بنقرة واحدة.",
            "• استعراض الميزانية بالريال واقتراح بدائل اقتصادية ذكية.",
            "• تصدير عرض سعر PDF وجدول مواد (BOM) وروابط الشراء المباشرة (store_url) ومعاينة AR.",
        ],
        COLOR_AMBER,
        title_size=15,
        body_size=11.5,
    )

    # ── SLIDE 5: SYSTEM ARCHITECTURE (EMBED ARCHITECTURE VISUAL) ─────────────
    s5 = prs.slides.add_slide(blank_layout)
    set_background(s5)
    add_header(
        s5,
        "الهندسة التقنية المتكاملة (System Architecture)",
        "تجميع فوري داخل المتصفح بدون زمن رندرة خادمي + ذكاء توليدي وبحث متجهي ثنائي اللغة",
        "الهندسة والتقنية",
        5,
    )
    add_framed_visual(
        s5,
        IMG_ARCHITECTURE,
        0.6,
        2.05,
        7.35,
        "المعمارية الفعلية لمنصة رواق: الواجهة التفاعلية ↔ خادم FastAPI ↔ نماذج الذكاء وقواعد البيانات",
    )
    add_card(
        s5,
        8.2,
        2.05,
        4.53,
        1.42,
        "1. الواجهة ومحرك 3D (Frontend)",
        [
            "• Next.js 16.4.6 و React 19.3.1 و Tailwind CSS v4 (RTL) و Zustand 5.",
            "• R3F 9.8.2 و Rapier 2.2.0 وإضاءة Lightformer محلية و10 نماذج GLB (>1 MB).",
        ],
        COLOR_PRIMARY,
        title_size=13.5,
        body_size=10.8,
    )
    add_card(
        s5,
        8.2,
        3.62,
        4.53,
        1.42,
        "2. الخادم والذكاء التوليدي (Backend)",
        [
            "• FastAPI + Gemini 2.5 Flash (Vision + مخرجات JSON صارمة FullDesignOutput).",
            "• LanceDB للبحث المتجهي ثنائي اللغة (384 بُعداً) على 3,694 سجل إيكيا.",
        ],
        COLOR_ACCENT,
        title_size=13.5,
        body_size=10.8,
    )
    add_card(
        s5,
        8.2,
        5.19,
        4.53,
        1.42,
        "3. السحابة والـ 2D والتصدير",
        [
            "• Supabase للمشاريع و Clerk للمصادقة و Fal.ai Flux Schnell لـ /studio2d.",
            "• مسار /api/generate-room يعمل بالتجميع المتصفحي الفوري (مع أداة تصدير محلية منفصلة عبر orchestrator.py).",
        ],
        COLOR_AMBER,
        title_size=13.5,
        body_size=10.5,
    )

    # ── SLIDE 6: SPATIAL AUDIT & COSTING (EMBED AUDIT/QUOTE VISUAL) ──────────
    s6 = prs.slides.add_slide(blank_layout)
    set_background(s6)
    add_header(
        s6,
        "التدقيق الهندسي الحتمي والتسعير الشفاف بالريال",
        "تحقق رياضي دقيق من المعايير المعمارية (audit_spatial_layout) مقترن بعرض سعر فوري قابل للتنفيذ",
        "الدقة الهندسية",
        6,
    )
    add_framed_visual(
        s6,
        IMG_AUDIT_QUOTE,
        0.6,
        2.05,
        7.35,
        "محرك التدقيق المكاني الحتمي (POST /api/v1/spatial-audit) + جدول المواد وعرض السعر بالريال",
    )
    add_card(
        s6,
        8.2,
        2.05,
        4.53,
        1.42,
        "1. تدقيق مكاني حتمي [50 - 100]",
        [
            "• دالة audit_spatial_layout تفحص نسبة الإشغال (15%–45%) وخلوص الكنبة والطاولة (0.30–0.65م).",
            "• فحص مسافة التلفاز (>=1.5م) وتداخل AABB (>0.05م) مع توصيات عربية واضحة.",
        ],
        COLOR_ACCENT,
        title_size=13.5,
        body_size=10.8,
    )
    add_card(
        s6,
        8.2,
        3.62,
        4.53,
        1.42,
        "2. قيود الإحداثيات والفيزياء",
        [
            "• مخطط Pydantic صارم يفرض الالتصاق بالأرضية (t_y = 0.0) وتوحيد الأبعاد بالمليمتر.",
            "• فيزياء Rapier 2.2.0 داخل المشهد تمنع التداخل الفيزيائي أثناء التفاعل الحي.",
        ],
        COLOR_PRIMARY,
        title_size=13.5,
        body_size=10.8,
    )
    add_card(
        s6,
        8.2,
        5.19,
        4.53,
        1.42,
        "3. تسعير SAR وروابط الشراء والتصدير",
        [
            "• تقدير فوري بالريال + بدائل اقتصادية (/api/recommendations/alternatives) وروابط store_url مباشرة.",
            "• تصدير عرض سعر PDF (QuoteExportButton) وجدول مواد (PrintReport) ومعاينة AR (/ar).",
        ],
        COLOR_AMBER,
        title_size=13.5,
        body_size=10.8,
    )

    # ── SLIDE 7: COMPETITIVE ADVANTAGE ───────────────────────────────────────
    s7 = prs.slides.add_slide(blank_layout)
    set_background(s7)
    add_header(
        s7,
        "الميزة التنافسية والقيمة المقارنة في السوق",
        "رواق يجمع سرعة الذكاء التوليدي مع دقة التحقق الهندسي وواقعية التجميع ثلاثي الأبعاد",
        "الميزة التنافسية",
        7,
    )

    rows, cols = 5, 4
    table_shape = s7.shapes.add_table(rows, cols, Inches(0.6), Inches(2.1), Inches(12.13), Inches(4.5))
    table = table_shape.table
    col_widths = [Inches(2.3), Inches(2.9), Inches(3.0), Inches(3.93)]
    for i, w in enumerate(col_widths):
        table.columns[i].width = w

    headers = [
        "المعيار التنافسي",
        "مكاتب التصميم التقليدية",
        "مولدات الصور بالذكاء (2D)",
        "منصة رواق (Rwaq AI)",
    ]
    for c, h in enumerate(headers):
        cell = table.cell(0, c)
        cell.text = h
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        cell.fill.solid()
        cell.fill.fore_color.rgb = COLOR_PRIMARY if c == 3 else COLOR_CARD_DARK
        p = cell.text_frame.paragraphs[0]
        p.font.name = "Cairo"
        p.font.size = Pt(13.5)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE
        p.alignment = PP_ALIGN.CENTER

    data = [
        [
            "زمن التسليم والتعديل",
            "من 3 إلى 14 يوماً لكل دورة",
            "ثوانٍ (توليد صورة جديدة كل مرة)",
            "ثوانٍ داخل المتصفح مع تعديل حي فوري",
        ],
        [
            "طبيعة المخرج البصري",
            "لقطات ثابتة (2D Renders)",
            "صورة مسطحة غير تفاعلية",
            "مشهد 3D تفاعلي 360° + فيزياء Rapier + معاينة AR",
        ],
        [
            "الدقة الهندسية والتدقيق",
            "مراجعة يدوية تعتمد على المصمم",
            "لا يوجد (هلوسة أبعاد ومنظور)",
            "تدقيق حتمي (audit_spatial_layout) بدرجة [50–100]",
        ],
        [
            "التسعير والربط التجاري",
            "تسعير يدوي وبحث منفصل",
            "غير متوفر (أثاث خيالي)",
            "تسعير حي بالريال + روابط store_url + عرض سعر PDF وبدائل ميزانية",
        ],
    ]

    for r, row_data in enumerate(data):
        for c, val in enumerate(row_data):
            cell = table.cell(r + 1, c)
            cell.text = val
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(16, 36, 58) if c == 3 else COLOR_CARD
            p = cell.text_frame.paragraphs[0]
            p.font.name = "Cairo"
            p.font.size = Pt(12)
            p.font.bold = c in (0, 3)
            p.font.color.rgb = COLOR_ACCENT if c == 3 else (COLOR_WHITE if c == 0 else COLOR_SLATE)
            p.alignment = PP_ALIGN.CENTER

    # ── SLIDE 8: SHOWROOM & BUSINESS MODEL (EMBED MAARAD VISUAL) ─────────────
    s8 = prs.slides.add_slide(blank_layout)
    set_background(s8)
    add_header(
        s8,
        "المعرض الجاهز (/maarad) ونموذج العمل المستدام",
        "6 قوالب ثلاثية الأبعاد مُسعّرة فعلياً بالريال كنقطة انطلاق، ضمن نموذج ربحي متعدد القنوات",
        "المعرض ونموذج العمل",
        8,
    )
    add_framed_visual(
        s8,
        IMG_MAARAD,
        0.6,
        2.05,
        7.1,
        "معرض رواق (/maarad): 6 تصاميم جاهزة للتعديل بأسعارها الفعلية بالريال + مكتبة GLB المحلية",
    )
    add_card(
        s8,
        7.95,
        2.05,
        4.78,
        1.42,
        "1. اشتراكات المحترفين (Pro SaaS)",
        [
            "• باقات للمصممين الداخليين والمكاتب الهندسية لتوليد متقدم وتصدير عروض أسعار PDF وجداول مواد (BOM).",
            "• حفظ سحابي غير محدود للمشاريع وتقارير تدقيق مكاني بعلامة المكتب.",
        ],
        COLOR_PRIMARY,
        title_size=14,
        body_size=11,
    )
    add_card(
        s8,
        7.95,
        3.62,
        4.78,
        1.42,
        "2. حلول قطاع التجزئة (Enterprise API)",
        [
            "• ترخيص محرك المعاينة 3D والتدقيق المكاني لمتاجر الأثاث لدمج ميزة «جرّب في غرفتك».",
            "• ربط مباشر بكتالوجات المتاجر وفهرسة الأبعاد والأسعار داخل LanceDB.",
        ],
        COLOR_ACCENT,
        title_size=14,
        body_size=11,
    )
    add_card(
        s8,
        7.95,
        5.19,
        4.78,
        1.42,
        "3. عمولات الإحالة والشراء (Affiliate)",
        [
            "• عمولة متفق عليها عن كل إحالة شراء ناجحة عبر روابط المنتجات المباشرة (store_url).",
            "• تحسين معدل التحويل وتقليل المرتجعات بفضل التحقق المسبق من المقاسات.",
        ],
        COLOR_AMBER,
        title_size=14,
        body_size=11,
    )

    # ── SLIDE 9: COMPLETED MILESTONES & ROADMAP ──────────────────────────────
    s9 = prs.slides.add_slide(blank_layout)
    set_background(s9)
    add_header(
        s9,
        "سجل الإنجاز الفعلي وخارطة الطريق القادمة",
        "منتج متكامل يعمل بالكامل اليوم مع مسار توسع واضح للسوق السعودي والإقليمي",
        "الإنجاز والخطة",
        9,
    )
    add_card(
        s9,
        6.83,
        2.05,
        5.9,
        4.65,
        "المنجز والمُختبر فعلياً (Completed)",
        [
            "• استوديو 3D عربي كامل (Next.js 16.4.6 + React 19.3.1 + R3F 9.8.2 + Rapier 2.2.0) بمرونة كاملة دون اتصال (Lightformer + 10 نماذج GLB >1 MB).",
            "• التوليد الهيكلي والمحادثة التوليدية الحية (/api/generate-room و /api/v1/chat) عبر Gemini 2.5 Flash وفهرس LanceDB (3,694 سجل إيكيا).",
            "• التدقيق المكاني الحتمي (SpatialAuditModal / audit_spatial_layout) + معرض القوالب (/maarad) + مكتبة الأثاث (/library) + استوديو 2D (/studio2d عبر Fal.ai Flux Schnell).",
            "• الحفظ السحابي (Supabase + Clerk) + تصدير عروض الأسعار PDF و PrintReport وروابط store_url ومعاينة AR (/ar).",
        ],
        COLOR_ACCENT,
        title_size=16,
        body_size=11.5,
    )
    add_card(
        s9,
        0.6,
        2.05,
        5.9,
        4.65,
        "خارطة الطريق القادمة (Next Roadmap)",
        [
            "• توسيع فهرس الكتالوج ليشمل متاجر أثاث سعودية وإقليمية إضافية مع مزامنة آلية للأسعار والتوفر.",
            "• تطوير قارئ المخططات المعمارية متعددة الغرف (Multi-Room CAD / Floorplan Importer).",
            "• إطلاق مساحات عمل للمكاتب الهندسية (Pro Workspaces) بعروض أسعار مخصصة ومشاركة تفاعلية للعملاء.",
            "• تعزيز تجربة الأجهزة اللوحية والجوال وتوسيع قدرات القياس المباشر عبر الواقع المعزز (WebXR).",
        ],
        COLOR_PRIMARY,
        title_size=16,
        body_size=11.5,
    )

    # ── SLIDE 10: CLOSING ────────────────────────────────────────────────────
    s10 = prs.slides.add_slide(blank_layout)
    set_background(s10)

    pill_s10 = s10.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.8), Inches(1.2), Inches(3.733), Inches(0.55)
    )
    pill_s10.fill.solid()
    pill_s10.fill.fore_color.rgb = COLOR_CARD
    pill_s10.line.color.rgb = COLOR_ACCENT
    pill_s10.line.width = Pt(1.5)
    tf_p10 = pill_s10.text_frame
    tf_p10.vertical_anchor = MSO_ANCHOR.MIDDLE
    p_p10 = tf_p10.paragraphs[0]
    p_p10.text = "رِواق | RWAQ AI"
    p_p10.font.name = "Cairo"
    p_p10.font.size = Pt(16)
    p_p10.font.bold = True
    p_p10.font.color.rgb = COLOR_ACCENT
    p_p10.alignment = PP_ALIGN.CENTER

    box10 = s10.shapes.add_textbox(Inches(1.2), Inches(2.05), Inches(10.933), Inches(2.7))
    tf10 = box10.text_frame
    tf10.word_wrap = True

    p_c1 = tf10.paragraphs[0]
    p_c1.text = "نعيد صياغة تجربة التصميم الداخلي بالذكاء المعماري"
    p_c1.font.name = "Cairo"
    p_c1.font.size = Pt(34)
    p_c1.font.bold = True
    p_c1.font.color.rgb = COLOR_WHITE
    p_c1.alignment = PP_ALIGN.CENTER

    p_c2 = tf10.add_paragraph()
    p_c2.text = "منصة متكاملة تجمع التوليد الفوري، التدقيق الهندسي الحتمي، والتسعير الواقعي بالريال داخل المتصفح. جاهزون الآن للعرض الحي والإجابة على أسئلة لجنة التحكيم."
    p_c2.font.name = "Cairo"
    p_c2.font.size = Pt(16)
    p_c2.font.color.rgb = COLOR_SLATE
    p_c2.alignment = PP_ALIGN.CENTER
    p_c2.space_before = Pt(20)

    # Truthful submission / live demo card (no placeholder domains or fake emails)
    info_card = s10.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(2.0), Inches(5.05), Inches(9.333), Inches(1.45)
    )
    info_card.fill.solid()
    info_card.fill.fore_color.rgb = COLOR_CARD
    info_card.line.color.rgb = COLOR_PRIMARY
    info_card.line.width = Pt(1.25)

    info_tb = s10.shapes.add_textbox(Inches(2.3), Inches(5.2), Inches(8.733), Inches(1.15))
    tf_i = info_tb.text_frame
    tf_i.word_wrap = True

    pi1 = tf_i.paragraphs[0]
    pi1.text = "Rwaq AI — منصة رواق للذكاء الاصطناعي المعماري (نسخة التحكيم والعرض الحي 2026)"
    pi1.font.name = "Cairo"
    pi1.font.size = Pt(14)
    pi1.font.bold = True
    pi1.font.color.rgb = COLOR_WHITE
    pi1.alignment = PP_ALIGN.CENTER

    pi2 = tf_i.add_paragraph()
    pi2.text = "العرض المحلي: http://localhost:3000   |   خادم API: http://127.0.0.1:8000"
    pi2.font.name = "Cairo"
    pi2.font.size = Pt(12.5)
    pi2.font.color.rgb = COLOR_CYAN
    pi2.alignment = PP_ALIGN.CENTER
    pi2.space_before = Pt(8)

    pi3 = tf_i.add_paragraph()
    pi3.text = "دليل العرض الحي للجنة التحكيم: docs/DEMO_RUNBOOK.md   •   نسخة الويب والطباعة: rwaq_presentation_deck.html"
    pi3.font.name = "Cairo"
    pi3.font.size = Pt(11.5)
    pi3.font.color.rgb = COLOR_MUTED
    pi3.alignment = PP_ALIGN.CENTER
    pi3.space_before = Pt(6)

    # Enforce native Arabic OpenXML RTL & lang='ar-SA' on EVERY slide, paragraph, run, and table
    enforce_presentation_rtl(prs)

    output_path = BASE_DIR / "Rwaq_AI_Competition_Presentation.pptx"
    prs.save(str(output_path))
    print(f"Presentation saved successfully to: {output_path}")


if __name__ == "__main__":
    create_deck()
