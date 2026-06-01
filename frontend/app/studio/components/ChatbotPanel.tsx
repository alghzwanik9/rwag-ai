"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSceneStore } from "@/lib/useSceneStore";
import { useAssets } from "@/lib/useAssets";

interface Message {
  role: "user" | "ai";
  text: string;
}

interface ChatbotPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  showToast: (msg: string) => void;
}

export function ChatbotPanel({ isOpen, setIsOpen, showToast }: ChatbotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "مرحباً! أنا مساعدك الذكي في رواق. هل تبحث عن أثاث معين لإضافته؟" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const addSceneItem = useSceneStore((s) => s.addSceneItem);
  const { assets: catalogAssets } = useAssets();

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Add AI text response
        setMessages(prev => [...prev, { role: "ai", text: data.text }]);
        
        // Auto-inject items if returned
        if (data.items && data.items.length > 0) {
          data.items.forEach((item: any) => {
            const matchingAsset = catalogAssets.find(a => a.id === item.asset_id);
            if (matchingAsset) {
              addSceneItem({
                ...matchingAsset,
                instanceId: item.instance_id,
                position: item.position,
                rotation: item.rotation,
                dimensions: item.dimensions
              });
            } else {
              // Fallback
              addSceneItem({
                instanceId: item.instance_id,
                id: item.asset_id,
                name: item.asset_id.replace("_", " "),
                brand: item.economy?.brand || "Rwaq AI",
                price: item.economy?.price || 0,
                currency: "SAR",
                category: "seating" as any,
                modelUrl: "",
                thumbnailUrl: "",
                dimensions: { 
                    width: item.dimensions?.width * 1000 || 1000, 
                    height: item.dimensions?.height * 1000 || 1000, 
                    depth: item.dimensions?.length * 1000 || 1000 
                },
                position: item.position,
                rotation: item.rotation
              });
            }
          });
          showToast("✨ تم إضافة الأثاث إلى الغرفة بنجاح!");
        }
      } else {
        setMessages(prev => [...prev, { role: "ai", text: "عذراً، حدث خطأ أثناء الاتصال بالخادم." }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", text: "حدث خطأ في الاتصال. تأكد من تشغيل الخادم." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed top-0 right-0 h-full w-[380px] bg-white border-l border-[#E0E0E0] shadow-2xl z-[120] transform transition-transform duration-300 flex flex-col`}>
        <div className="p-6 border-b border-[#E0E0E0] flex items-center justify-between bg-[#F5F7FA]">
          <div className="flex items-center gap-2 text-[#4A90E2]">
            <span className="material-symbols-outlined">smart_toy</span>
            <h2 className="font-headline-sm font-bold text-[#1E1E1E]">المساعد الذكي</h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="material-symbols-outlined p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            close
          </button>
        </div>

        <div className="flex-grow p-4 overflow-y-auto bg-surface flex flex-col gap-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-primary text-on-primary rounded-tr-none' : 'bg-[#F5F7FA] text-on-surface border border-outline-variant rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#F5F7FA] border border-outline-variant rounded-2xl rounded-tl-none p-3 text-sm text-on-surface-variant flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce" style={{animationDelay: '0.1s'}}>.</span>
                <span className="animate-bounce" style={{animationDelay: '0.2s'}}>.</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-[#E0E0E0] bg-white">
          <div className="flex items-center gap-2 bg-[#F5F7FA] border border-outline-variant rounded-full px-4 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="اكتب رسالتك هنا..."
              className="flex-grow bg-transparent border-none focus:ring-0 text-sm py-2"
              dir="rtl"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`material-symbols-outlined rounded-full p-2 ${input.trim() && !isLoading ? 'bg-primary text-white hover:bg-primary/90' : 'text-gray-400 bg-gray-100'} transition-colors`}
            >
              send
            </button>
          </div>
        </div>
      </div>

      {/* Optional Overlay if you want it to behave like a modal, otherwise just panel */}
      {/* <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110]" onClick={() => setIsOpen(false)} /> */}
    </>
  );
}
