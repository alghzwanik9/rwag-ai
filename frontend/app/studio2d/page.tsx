"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Message {
  role: "user" | "ai";
  text: string;
  image_url?: string;
}

interface GeneratedImage {
  id: string;
  image_url: string;
  prompt_used: string;
  created_at: string;
}

const downloadImage = (url: string, showToast: (msg: string) => void) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = `rwaq-design-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("💾 جاري تنزيل الصورة...");
};

export default function Studio2D() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "مرحباً بك في استوديو رواق للتصاميم ثنائية الأبعاد (2D Studio). كيف تريد أن تبدو مساحتك اليوم؟" }
  ]);
  const [input, setInput] = useState("");
  const [roomType, setRoomType] = useState("Living Room");
  const [decorStyle, setDecorStyle] = useState("Modern");
  const [colorPalette, setColorPalette] = useState("Warm Neutrals");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return;
    
    const userPrompt = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userPrompt }]);
    
    // Simulating general conversational assistant
    setIsGenerating(true);
    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "ai", text: data.text }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: "عذراً، لم أتمكن من الرد على رسالتك." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "حدث خطأ في الاتصال بالخادم." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    const promptText = input.trim() || "صمم مساحة جميلة ومريحة ذات إضاءة ممتازة وديكورات متناسقة";
    setInput("");
    
    // Add user message with attached upload if any
    const userMsg: Message = { role: "user", text: `توليد صورة لـ: ${promptText}` };
    if (uploadedImageUrl) {
      userMsg.image_url = uploadedImageUrl;
    }
    setMessages(prev => [...prev, userMsg]);
    
    setIsGenerating(true);
    showToast("🎨 جاري توليد الصورة الفنية بذكاء رواق...");

    try {
      const payload = {
        prompt: promptText,
        base_image_url: uploadedImageUrl,
        settings: {
          roomType,
          decorStyle,
          colorPalette
        }
      };

      const res = await fetch("/api/v1/studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const newImg: GeneratedImage = {
          id: `img_${Date.now()}`,
          image_url: data.image_url,
          prompt_used: data.prompt_used,
          created_at: new Date().toLocaleTimeString("ar-SA")
        };
        
        // Add to gallery
        setGeneratedImages(prev => [newImg, ...prev]);
        
        // Add AI message in chat
        setMessages(prev => [...prev, { 
          role: "ai", 
          text: "اكتمل توليد الصورة! لقد قمت بإضافتها إلى معرض الصور على الجانب الأيمن.",
          image_url: data.image_url
        }]);
        
        setUploadedImageUrl(null); // Clear upload
        showToast("✅ اكتمل توليد الصورة بنجاح!");
      } else {
        showToast("❌ فشل توليد الصورة، يرجى المحاولة مرة أخرى.");
        setMessages(prev => [...prev, { role: "ai", text: "فشل توليد التصميم، يرجى التحقق من مدخلاتك والمحاولة لاحقاً." }]);
      }
    } catch {
      showToast("❌ تعذر الاتصال بالخادم.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("⚠️ حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setIsUploading(true);
    showToast("📤 جاري رفع الصورة...");

    // For Demo/Mock purposes, we convert the local image to base64 object URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImageUrl(reader.result as string);
      setIsUploading(false);
      showToast("📸 تم تحميل الصورة كمرجع بنجاح!");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateVariations = (source: GeneratedImage) => {
    setInput(`توليد تعديلات وتفاصيل إضافية بناءً على: ${source.prompt_used}`);
    setSelectedImage(null);
    showToast("✏️ تم نقل الوصف إلى المدخلات لعمل تعديل");
  };

  return (
    <div className="fixed top-[64px] left-0 right-0 md:right-[280px] bottom-0 bg-[#F5F7FA] text-[#1E1E1E] flex flex-col md:flex-row overflow-hidden" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#1E1E1E] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/10 animate-bounce">
          <span className="material-symbols-outlined text-[#4A90E2]">info</span>
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Left Pane: Chat & Settings */}
      <div className="w-full md:w-[420px] bg-white border-l border-gray-200 flex flex-col h-full shrink-0 shadow-lg">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#4A90E2]">
            <span className="material-symbols-outlined text-2xl">camera</span>
            <h2 className="font-bold text-lg text-black">استوديو توليد الصور 2D</h2>
          </div>
          <Link href="/studio" className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1">
            استوديو 3D
            <span className="material-symbols-outlined text-sm">arrow_left</span>
          </Link>
        </div>

        {/* Design Settings Panels */}
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 grid grid-cols-3 gap-2">
          {/* Room Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400">نوع الغرفة</label>
            <select
              value={roomType}
              onChange={e => setRoomType(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-0 focus:border-[#4A90E2]"
            >
              <option value="Living Room">غرفة جلوس</option>
              <option value="Bedroom">غرفة نوم</option>
              <option value="Kitchen">مطبخ</option>
              <option value="Bathroom">دورة مياه</option>
              <option value="Office">مكتب</option>
              <option value="Dining Room">غرفة طعام</option>
            </select>
          </div>

          {/* Decor Style */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400">النمط</label>
            <select
              value={decorStyle}
              onChange={e => setDecorStyle(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-0 focus:border-[#4A90E2]"
            >
              <option value="Modern">مودرن</option>
              <option value="Minimalist">بسيط</option>
              <option value="Japandi">ياباني اسكندنافي</option>
              <option value="Industrial">صناعي</option>
              <option value="Bohemian">بوهيمي</option>
              <option value="Mid-Century">منتصف القرن</option>
            </select>
          </div>

          {/* Color Palette */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400">لوحة الألوان</label>
            <select
              value={colorPalette}
              onChange={e => setColorPalette(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-0 focus:border-[#4A90E2]"
            >
              <option value="Warm Neutrals">ألوان دافئة</option>
              <option value="Cool Tones">ألوان باردة</option>
              <option value="Monochromatic">أحادية</option>
              <option value="Earthy">ترابية</option>
              <option value="Bold Contrast">تباين قوي</option>
            </select>
          </div>
        </div>

        {/* Chat History */}
        <div className="grow overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-sm flex flex-col gap-2 ${msg.role === 'user' ? 'bg-[#1E1E1E] text-white rounded-tr-none' : 'bg-gray-100 text-[#1E1E1E] border border-gray-200 rounded-tl-none'}`}>
                <span>{msg.text}</span>
                  <div className="relative w-full h-48 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage({
                      id: `img_${idx}`,
                      image_url: msg.image_url!,
                      prompt_used: msg.text,
                      created_at: ""
                    })}>
                    <Image
                      src={msg.image_url!}
                      alt="Generated Preview"
                      fill
                      className="rounded-lg object-cover"
                      unoptimized
                    />
                  </div>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tl-none p-3 text-sm text-gray-500 flex gap-1 items-center">
                <span className="animate-bounce">🎨</span>
                <span>جاري التوليد...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {/* Upload Thumbnail Preview */}
          {uploadedImageUrl && (
            <div className="mb-2 flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2">
                <Image src={uploadedImageUrl} alt="Uploaded base" width={40} height={40} className="w-10 h-10 object-cover rounded-lg" unoptimized />
                <span className="text-xs text-gray-500 font-bold">صورة مرجعية جاهزة للتعديل</span>
              </div>
              <button onClick={() => setUploadedImageUrl(null)} className="material-symbols-outlined text-red-500 text-sm hover:bg-red-50 p-1 rounded-full">
                close
              </button>
            </div>
          )}

          {/* Prompt Suggestion Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none">
            {[
              "أضف إضاءة شمس دافئة",
              "اجعل التصميم أكثر حيوية بنباتات",
              "استخدم خشب طبيعي فاتح",
              "صمم صالون معيشة مريح وقريب للنوافذ"
            ].map((sug, idx) => (
              <button
                key={idx}
                onClick={() => setInput(sug)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full shrink-0 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex bg-[#F5F7FA] rounded-xl overflow-hidden border border-gray-200 focus-within:border-[#4A90E2] p-1">
              {/* Vision upload */}
              <button
                onClick={handleImageUploadClick}
                disabled={isUploading}
                className={`material-symbols-outlined p-2 hover:bg-gray-200 rounded-full transition-colors ${uploadedImageUrl ? 'text-[#4A90E2]' : 'text-gray-400'}`}
                title="رفع صورة مرجعية (Img2Img)"
              >
                image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                placeholder="اكتب وصفاً أو اسأل المساعد..."
                className="grow bg-transparent border-none focus:ring-0 text-sm py-2 px-2"
                dir="rtl"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isGenerating}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                إرسال رسالة
              </button>
              <button
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className="flex-1 bg-[#4A90E2] hover:bg-[#357abd] text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">palette</span>
                توليد صورة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Visual Canvas Gallery */}
      <div className="grow bg-[#F5F7FA] p-8 overflow-y-auto flex flex-col">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-black">معرض التصاميم المولدة</h2>
            <p className="text-gray-400 text-xs mt-0.5">تظهر هنا الصور التي قمت بتوليدها في هذه الجلسة.</p>
          </div>
          <span className="bg-[#4A90E2]/10 text-[#4A90E2] px-3 py-1 rounded-full text-xs font-bold">
            عدد الصور: {generatedImages.length}
          </span>
        </div>

        {generatedImages.length === 0 ? (
          <div className="grow flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm p-12">
            <span className="material-symbols-outlined text-gray-300 text-7xl mb-4">wallpaper</span>
            <h3 className="font-bold text-lg text-gray-700 mb-2">استوديو التوليد فارغ</h3>
            <p className="text-gray-400 text-sm max-w-md text-center leading-relaxed">
              اكتب وصف التصميم الذي تفكر به في صندوق المحادثة على اليسار، ثم انقر على **توليد صورة** لتراها تظهر هنا فورياً بجودة عالية.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedImages.map((img) => (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all cursor-pointer relative"
              >
                <div className="relative h-60 w-full overflow-hidden bg-gray-100">
                  <Image src={img.image_url} alt="Generated interior" fill className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" unoptimized />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadImage(img.image_url, showToast); }}
                      className="bg-white p-2.5 rounded-full hover:bg-gray-100 text-black shadow-lg"
                      title="تحميل الصورة"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleGenerateVariations(img); }}
                      className="bg-[#4A90E2] p-2.5 rounded-full hover:bg-[#357abd] text-white shadow-lg"
                      title="توليد تعديلات"
                    >
                      <span className="material-symbols-outlined text-[18px]">brush</span>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-700 text-xs font-bold line-clamp-2 leading-relaxed" dir="rtl">
                    {img.prompt_used}
                  </p>
                  <div className="mt-2 flex justify-between items-center text-[10px] text-gray-400 font-medium">
                    <span>{img.created_at}</span>
                    <span className="text-[#4A90E2] font-bold">بواسطة Flux Schnell</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Detail Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-150 animate-fade-in">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full flex flex-col animate-slide-up border border-gray-100">
            {/* High-res Image */}
            <div className="relative bg-gray-900 flex justify-center items-center">
              <div className="relative w-full h-[60vh]">
                <Image
                  src={selectedImage.image_url}
                  alt="Generated interior high res"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 left-4 bg-white/80 hover:bg-white text-gray-700 hover:text-black w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Detail Info */}
            <div className="p-6 text-right">
              <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <span className="material-symbols-outlined text-[#4A90E2] text-lg">description</span>
                الوصف المستخدم للتوليد
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed" dir="rtl">
                {selectedImage.prompt_used}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between gap-4">
              <button
                onClick={() => handleGenerateVariations(selectedImage)}
                className="bg-[#4A90E2] hover:bg-[#357abd] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">brush</span>
                توليد تعديلات (Variations)
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => downloadImage(selectedImage.image_url, showToast)}
                  className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  تحميل الصورة
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs px-5 py-3 rounded-xl transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
