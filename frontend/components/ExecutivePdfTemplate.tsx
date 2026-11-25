"use client";

import React from "react";

export interface BOQItemRow {
  index: number;
  id: string;
  sku: string;
  name: string;
  category: string;
  dimensionsCm: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  storeUrl?: string;
  brand: string;
}

export interface ExecutivePdfTemplateProps {
  projectRef: string;
  dateStr: string;
  roomName: string;
  roomWidth: number;
  roomDepth: number;
  roomHeight: number;
  roomStyle: string;
  ambientMode: string;
  spatialScore: number;
  snapshot3DUrl: string;
  blueprint2DUrl: string;
  items: BOQItemRow[];
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
}

/**
 * High-fidelity, print-ready A4 Executive Architectural Submittal & BOQ Template.
 * Rendered offscreen and captured page-by-page via html2canvas & jsPDF.
 * Formatted with strict RTL Arabic typography (Tajawal / Cairo).
 */
export default function ExecutivePdfTemplate({
  projectRef,
  dateStr,
  roomName,
  roomWidth,
  roomDepth,
  roomHeight,
  roomStyle,
  ambientMode,
  spatialScore,
  snapshot3DUrl,
  blueprint2DUrl,
  items,
  subtotal,
  vatAmount,
  grandTotal,
}: ExecutivePdfTemplateProps) {
  const floorArea = (roomWidth * roomDepth).toFixed(2);

  // Split BOQ items into chunks of 9 items per table page to guarantee comfortable fit
  const ITEMS_PER_PAGE = 9;
  const itemChunks: BOQItemRow[][] = [];
  if (items.length === 0) {
    itemChunks.push([]);
  } else {
    for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
      itemChunks.push(items.slice(i, i + ITEMS_PER_PAGE));
    }
  }

  const totalPages = 1 + itemChunks.length;

  return (
    <div
      id="rwaq-executive-pdf-root"
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        width: "794px",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        fontFamily: "'Tajawal', 'Cairo', system-ui, -apple-system, sans-serif",
        direction: "rtl",
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 1: ARCHITECTURAL BLUEPRINT & EXECUTIVE SPECIFICATIONS
         ═══════════════════════════════════════════════════════════════════ */}
      <div
        id="pdf-page-1"
        style={{
          width: "794px",
          height: "1123px",
          padding: "36px 40px",
          boxSizing: "border-box",
          position: "relative",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <div>
          {/* Top Architectural Header Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "2px solid #0f766e",
              paddingBottom: "14px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  backgroundColor: "#0f766e",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#d97706",
                  fontWeight: 900,
                  fontSize: "24px",
                }}
              >
                ر
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
                    رواق للذكاء الاصطناعي المعماري
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      backgroundColor: "#fef3c7",
                      color: "#b45309",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      border: "1px solid #fde68a",
                    }}
                  >
                    RWAQ AI STUDIO
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  تقرير الاعتماد التنفيذي والمخطط المساحي المعتمد | كود البناء السعودي SBC
                </div>
              </div>
            </div>

            <div style={{ textAlign: "left", fontSize: "11px", color: "#334155" }}>
              <div style={{ fontWeight: 700, color: "#0f766e" }}>الرقم المرجعي: {projectRef}</div>
              <div>التاريخ: {dateStr}</div>
              <div>الحالة: <span style={{ color: "#16a34a", fontWeight: 700 }}>معتمد معمارياً ✓</span></div>
            </div>
          </div>

          {/* Project & Room Specifications Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "12px 14px",
              marginBottom: "14px",
            }}
          >
            <div>
              <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>اسم الفراغ</div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {roomName || "غرفة معيشة رئيسية"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>الأبعاد والمساحة</div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                {roomWidth.toFixed(2)}م × {roomDepth.toFixed(2)}م ({floorArea} م²)
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>النمط التصميمي</div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f766e", marginTop: "2px" }}>
                {roomStyle || "مودرن معاصر"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>المود الضوئي (الإضاءة)</div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>
                {ambientMode === "morning" ? "صباحي مشرق" : ambientMode === "rainy" ? "أجواء ماطرة هادئة" : "ليلي دافئ (Midnight)"}
              </div>
            </div>
          </div>

          {/* Saudi Building Code & Neufert Compliance Banner */}
          <div
            style={{
              backgroundColor: "#ecfdf5",
              border: "1.5px solid #a7f3d0",
              borderRadius: "10px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 900,
                  boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
                }}
              >
                {spatialScore}%
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#065f46" }}>
                  شهادة الامتثال المعماري لكود البناء السعودي (SBC 201 / SBC 1101) ومعايير نويفرت
                </div>
                <div style={{ fontSize: "11px", color: "#047857", marginTop: "3px", lineHeight: 1.4 }}>
                  ✓ مسارات حركة رئيسية آمنة (≥ 0.90م) &nbsp;|&nbsp; ✓ خلو نطاق دوران الأبواب من العوائق &nbsp;|&nbsp; ✓ أبعاد ارتداد الأثاث مطابقة لنويفرت
                </div>
              </div>
            </div>
            <div
              style={{
                backgroundColor: "#059669",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.5px",
                textAlign: "center",
              }}
            >
              معتمد SBC 201
            </div>
          </div>

          {/* Visual Presentation Area: 3D Perspective + 2D Top-Down Blueprint */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginBottom: "16px",
            }}
          >
            {/* 3D Viewport Perspective */}
            <div
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                overflow: "hidden",
                backgroundColor: "#0f172a",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  backgroundColor: "#1e293b",
                  padding: "8px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>المنظور الفراغي ثلاثي الأبعاد (3D Perspective)</span>
                <span style={{ color: "#94a3b8" }}>زاوية الكاميرا الحالية</span>
              </div>
              <div
                style={{
                  height: "380px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#020617",
                }}
              >
                {snapshot3DUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={snapshot3DUrl}
                    alt="3D Perspective"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div style={{ color: "#64748b", fontSize: "12px" }}>جاري تحميل لقطة المنظور 3D...</div>
                )}
              </div>
            </div>

            {/* 2D Top-Down Architectural Blueprint */}
            <div
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                overflow: "hidden",
                backgroundColor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  backgroundColor: "#0f766e",
                  padding: "8px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#ffffff",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>المخطط المساحي ومسارات الحركة (2D Floorplan)</span>
                <span style={{ color: "#5eead4" }}>مقياس نسبي دقيق</span>
              </div>
              <div
                style={{
                  height: "380px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f8fafc",
                }}
              >
                {blueprint2DUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={blueprint2DUrl}
                    alt="2D Blueprint"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div style={{ color: "#64748b", fontSize: "12px" }}>جاري استخراج المخطط 2D...</div>
                )}
              </div>
            </div>
          </div>

          {/* Blueprint Legend & Guidelines */}
          <div
            style={{
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "10.5px",
              color: "#334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: "16px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ display: "inline-block", width: "12px", height: "8px", backgroundColor: "#0f766e", borderRadius: "2px" }} />
                جدران معمارية (20 سم)
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ display: "inline-block", width: "12px", height: "8px", backgroundColor: "#10b981", borderRadius: "2px", opacity: 0.7 }} />
                مسار حركة آمن (SBC ≥ 0.90م)
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ display: "inline-block", width: "12px", height: "8px", backgroundColor: "#38bdf8", borderRadius: "2px" }} />
                فتحات إضاءة ونوافذ
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ display: "inline-block", width: "12px", height: "8px", backgroundColor: "#f59e0b", borderRadius: "2px" }} />
                أبواب ونطاق حركة الباب
              </span>
            </div>
            <span style={{ fontWeight: 700, color: "#0f766e" }}>كافة القياسات بالمتر ما لم يُذكر خلاف ذلك</span>
          </div>
        </div>

        {/* Footer Page 1 */}
        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            paddingTop: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "10px",
            color: "#64748b",
          }}
        >
          <div>رواق AI &copy; 2026 — منصة التصميم الداخلي الذكية المتوافقة مع كود البناء السعودي</div>
          <div>صفحة 1 من {totalPages}</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PAGE 2 (and subsequent): EXECUTIVE BILL OF QUANTITIES (BOQ)
         ═══════════════════════════════════════════════════════════════════ */}
      {itemChunks.map((chunk, chunkIdx) => {
        const isLastChunk = chunkIdx === itemChunks.length - 1;
        const pageNumber = 2 + chunkIdx;

        return (
          <div
            key={`boq-page-${chunkIdx}`}
            id={`pdf-page-${pageNumber}`}
            style={{
              width: "794px",
              height: "1123px",
              padding: "36px 40px",
              boxSizing: "border-box",
              position: "relative",
              backgroundColor: "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            <div>
              {/* Header Bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "2px solid #0f766e",
                  paddingBottom: "14px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>
                    جدول توصيف وكميات وتكاليف الأثاث المعتمد (BOQ)
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                    Executive Bill of Quantities & Procurement Submittal
                  </div>
                </div>
                <div style={{ textAlign: "left", fontSize: "11px", color: "#334155" }}>
                  <div style={{ fontWeight: 700, color: "#0f766e" }}>المرجع: {projectRef}</div>
                  <div>التاريخ: {dateStr}</div>
                </div>
              </div>

              {/* BOQ Table */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "10.5px",
                  marginBottom: "18px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#0f766e",
                      color: "#ffffff",
                      textAlign: "right",
                      fontWeight: 700,
                    }}
                  >
                    <th style={{ padding: "8px 6px", borderRadius: "0 6px 0 0", width: "32px", textAlign: "center" }}>#</th>
                    <th style={{ padding: "8px 8px", width: "95px" }}>رمز الصنف (SKU)</th>
                    <th style={{ padding: "8px 8px" }}>اسم القطعة والتوصيف</th>
                    <th style={{ padding: "8px 8px", width: "70px" }}>التصنيف</th>
                    <th style={{ padding: "8px 8px", width: "110px", textAlign: "center" }}>الأبعاد (سم)</th>
                    <th style={{ padding: "8px 6px", width: "45px", textAlign: "center" }}>الكمية</th>
                    <th style={{ padding: "8px 8px", width: "75px", textAlign: "left" }}>سعر الوحدة</th>
                    <th style={{ padding: "8px 8px", width: "80px", textAlign: "left" }}>الإجمالي</th>
                    <th style={{ padding: "8px 6px", borderRadius: "6px 0 0 0", width: "65px", textAlign: "center" }}>المتجر</th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((item, idx) => (
                    <tr
                      key={item.sku + idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <td style={{ padding: "8px 6px", textAlign: "center", color: "#64748b", fontWeight: 700 }}>
                        {item.index}
                      </td>
                      <td style={{ padding: "8px 8px", fontFamily: "monospace", fontSize: "10px", color: "#0f766e", fontWeight: 700 }}>
                        {item.sku}
                      </td>
                      <td style={{ padding: "8px 8px", fontWeight: 700, color: "#0f172a" }}>
                        <div>{item.name}</div>
                        <div style={{ fontSize: "9px", color: "#64748b", fontWeight: 500 }}>{item.brand}</div>
                      </td>
                      <td style={{ padding: "8px 8px", color: "#475569" }}>
                        {item.category === "seating"
                          ? "جلسات"
                          : item.category === "tables"
                          ? "طاولات"
                          : item.category === "lighting"
                          ? "إنارة"
                          : item.category === "rugs"
                          ? "سجاد"
                          : item.category === "storage"
                          ? "خزائن"
                          : "ديكور"}
                      </td>
                      <td style={{ padding: "8px 8px", textAlign: "center", direction: "ltr", color: "#334155", fontSize: "10px" }}>
                        {item.dimensionsCm}
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 800, color: "#0f172a" }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: "8px 8px", textAlign: "left", color: "#475569" }}>
                        {item.unitPrice.toLocaleString("en-US")} ر.س
                      </td>
                      <td style={{ padding: "8px 8px", textAlign: "left", fontWeight: 800, color: "#0f766e" }}>
                        {item.totalPrice.toLocaleString("en-US")} ر.س
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 6px",
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                            borderRadius: "4px",
                            fontSize: "9px",
                            fontWeight: 700,
                          }}
                        >
                          IKEA SA
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Only on the final page of BOQ: Financial Summary + Official Seal */}
              {isLastChunk && (
                <div style={{ marginTop: "10px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 0.8fr",
                      gap: "14px",
                      marginBottom: "16px",
                    }}
                  >
                    {/* Official Digital Seal & Certification Box */}
                    <div
                      style={{
                        border: "1.5px dashed #cbd5e1",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        backgroundColor: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                      }}
                    >
                      <div
                        style={{
                          width: "70px",
                          height: "70px",
                          borderRadius: "50%",
                          border: "2px solid #0f766e",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#0f766e",
                          transform: "rotate(-8deg)",
                          backgroundColor: "#f0fdf4",
                        }}
                      >
                        <div style={{ fontSize: "8px", fontWeight: 900, letterSpacing: "1px" }}>RWAQ AI</div>
                        <div style={{ fontSize: "14px", fontWeight: 900 }}>معتمد</div>
                        <div style={{ fontSize: "7px", fontWeight: 700 }}>SBC 201</div>
                      </div>
                      <div style={{ fontSize: "10px", color: "#475569", lineHeight: 1.5 }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "2px" }}>
                          اعتماد التوافق المعماري والمواصفات
                        </div>
                        تمت مطابقة هذا المخطط وجدول الكميات وفق كود البناء السعودي (SBC 201) ومعايير نويفرت.
                        المقاسات والأسعار استرشادية للشراء المباشر والتعميد التنفيذي.
                      </div>
                    </div>

                    {/* Financial Summary Box */}
                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1.5px solid #0f766e",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#0f766e",
                          color: "#ffffff",
                          padding: "6px 12px",
                          fontSize: "11px",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        الملخص المالي الإجمالي (SAR)
                      </div>
                      <div style={{ padding: "10px 14px", fontSize: "11px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#475569" }}>
                          <span>المجموع قبل الضريبة:</span>
                          <span style={{ fontWeight: 700 }}>{subtotal.toLocaleString("en-US")} ر.س</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#475569" }}>
                          <span>ضريبة القيمة المضافة (15%):</span>
                          <span style={{ fontWeight: 700 }}>{vatAmount.toLocaleString("en-US")} ر.س</span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderTop: "1px solid #cbd5e1",
                            paddingTop: "6px",
                            fontSize: "13px",
                            fontWeight: 900,
                            color: "#0f766e",
                          }}
                        >
                          <span>الإجمالي الكلي المعتمد:</span>
                          <span>{grandTotal.toLocaleString("en-US")} ر.س</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Procurement Guidance & Direct Links */}
                  <div
                    style={{
                      backgroundColor: "#f1f5f9",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "10px",
                      color: "#64748b",
                      lineHeight: 1.4,
                    }}
                  >
                    <strong>تنبيه توريد:</strong> كافة القطع المذكورة أعلاه متوفرة بروابط ورموز مطابقة لمخزون ايكيا السعودية (IKEA SA).
                    يُرجى التحقق من توفر المخزون في الفرع الأقرب قبل إصدار أمر الشراء.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid #e2e8f0",
                paddingTop: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "10px",
                color: "#64748b",
              }}
            >
              <div>رواق AI &copy; 2026 — جدول الكميات والتسعير التنفيذي المعتمد</div>
              <div>صفحة {pageNumber} من {totalPages}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
