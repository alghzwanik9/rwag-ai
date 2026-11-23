"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSceneStore } from "@/lib/useSceneStore";
import { useAssets } from "@/lib/useAssets";
import { normalizeDimensionsMm, type AIResponseItem } from "../config/pipeline";
import { PLACEHOLDER_MODEL_URL, resolveItem } from "../config/matching";

interface SceneMutation {
  op: "MODIFY" | "REMOVE" | "ADD" | "ROOM_STYLE" | "RETHEME" | string;
  target_id?: string;
  patch?: Record<string, any>;
  item?: any;
  style_name?: string;
  item_recolors?: Record<string, string>;
  room_patch?: {
    wall_color?: string;
    floor_color?: string;
    ambient_mode?: "morning" | "rainy" | "midnight";
  };
}

interface Message {
  role: "user" | "ai";
  text: string;
  action_type?: "mutate" | "clarify" | "chat" | string;
}

interface ChatbotPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  showToast: (msg: string) => void;
}

export function ChatbotPanel({ isOpen, setIsOpen, showToast }: ChatbotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "مرحباً! أنا مهندس التصميم الذكي والمساعد التفاعلي لرواق. يمكنك طلب تعديل أي قطعة، تغيير الخامات، أو إضافة أثاث جديد بدقة هندسية.",
      action_type: "chat",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Store bindings
  const sceneItems = useSceneStore((s) => s.sceneItems);
  const selectedAssetId = useSceneStore((s) => s.selectedAssetId);
  const setSelectedAssetId = useSceneStore((s) => s.setSelectedAssetId);
  const addSceneItem = useSceneStore((s) => s.addSceneItem);
  const updateSceneItem = useSceneStore((s) => s.updateSceneItem);
  const removeSceneItem = useSceneStore((s) => s.removeSceneItem);
  const setWallColor = useSceneStore((s) => s.setWallColor);
  const setFloorColor = useSceneStore((s) => s.setFloorColor);
  const setAmbientMode = useSceneStore((s) => s.setAmbientMode);

  const { assets: catalogAssets } = useAssets();

  const selectedItem = useMemo(() => {
    if (!selectedAssetId) return null;
    return sceneItems.find((it) => it.instanceId === selectedAssetId) || null;
  }, [selectedAssetId, sceneItems]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const storeState = useSceneStore.getState();
      const currentItemsContext = storeState.sceneItems.map((item) => ({
        instance_id: item.instanceId,
        asset_id: item.id || item.name,
        name: item.name,
        category: item.category,
        position: item.position,
        rotation: item.rotation,
        dimensions: item.dimensions,
        color: item.color,
        brand: item.brand,
        price: item.price,
        currency: item.currency || "SAR",
        store_url: item.store_url,
      }));

      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          scene_items: currentItemsContext,
          selected_asset_id: storeState.selectedAssetId,
          room_width: storeState.roomWidth,
          room_depth: storeState.roomDepth,
          room_shape: storeState.roomShape,
          windows: storeState.windows,
          wall_color: storeState.wallColor,
          floor_color: storeState.floorColor,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // 1. Add AI response to transcript
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: data.text, action_type: data.action_type },
        ]);

        // 2. Execute Atomic Mutations
        const mutations: SceneMutation[] = data.mutations || [];

        if (mutations.length > 0) {
          mutations.forEach((mutation) => {
            switch (mutation.op) {
              case "MODIFY": {
                if (mutation.target_id && mutation.patch) {
                  updateSceneItem(mutation.target_id, mutation.patch);
                  showToast("✨ تم تطبيق التعديل على القطعة بنجاح");
                }
                break;
              }
              case "REMOVE": {
                if (mutation.target_id) {
                  removeSceneItem(mutation.target_id);
                  if (useSceneStore.getState().selectedAssetId === mutation.target_id) {
                    setSelectedAssetId(null);
                  }
                  showToast("🗑️ تم حذف القطعة من المشهد");
                }
                break;
              }
              case "ADD": {
                const item: AIResponseItem = mutation.item;
                if (!item) break;
                const resolution = resolveItem(item, catalogAssets);
                const storeUrl =
                  item.store_url ||
                  item.economy?.store_url ||
                  (resolution.kind !== "placeholder" ? resolution.asset.store_url : undefined);

                if (resolution.kind !== "placeholder") {
                  const matchingAsset = resolution.asset;
                  addSceneItem({
                    ...matchingAsset,
                    instanceId: item.instance_id,
                    price: item.economy?.price ?? matchingAsset.price,
                    currency: item.economy?.currency || matchingAsset.currency,
                    store_url: storeUrl,
                    position: item.position || [0, 0, 0],
                    rotation: item.rotation || [0, 0, 0],
                    color: item.color || undefined,
                    dimensions: normalizeDimensionsMm(item.dimensions, matchingAsset.dimensions),
                  });
                } else {
                  addSceneItem({
                    instanceId: item.instance_id,
                    id: item.economy?.sku || item.asset_id,
                    name: item.asset_id.replace(/_/g, " "),
                    brand: item.economy?.brand || "Rwaq AI",
                    price: item.economy?.price || 0,
                    currency: item.economy?.currency || "SAR",
                    category: "seating",
                    modelUrl: PLACEHOLDER_MODEL_URL,
                    thumbnailUrl: "",
                    store_url: storeUrl,
                    dimensions: normalizeDimensionsMm(item.dimensions),
                    position: item.position || [0, 0, 0],
                    rotation: item.rotation || [0, 0, 0],
                    color: item.color || "#ffffff",
                  });
                }
                showToast("✨ تم إضافة القطعة إلى المشهد بنجاح");
                break;
              }
              case "ROOM_STYLE": {
                const rp = mutation.room_patch;
                if (rp?.wall_color) setWallColor(rp.wall_color);
                if (rp?.floor_color) setFloorColor(rp.floor_color);
                if (rp?.ambient_mode) setAmbientMode(rp.ambient_mode);
                showToast("🎨 تم تحديث طراز وتشطيبات الغرفة");
                break;
              }
              case "RETHEME": {
                const rp = mutation.room_patch;
                if (rp?.wall_color) setWallColor(rp.wall_color);
                if (rp?.floor_color) setFloorColor(rp.floor_color);
                if (rp?.ambient_mode) setAmbientMode(rp.ambient_mode);

                const itemRecolors = mutation.item_recolors || {};
                Object.entries(itemRecolors).forEach(([instanceId, color]) => {
                  updateSceneItem(instanceId, { color });
                });

                showToast(`🎨 تم تحويل طراز وتشطيبات الغرفة بنجاح إلى ${mutation.style_name || "الطراز الجديد"}`);
                break;
              }
            }
          });
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "عذراً، حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مجدداً.", action_type: "chat" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "حدث خطأ في الاتصال بالشبكة. تأكد من تشغيل الخادم.", action_type: "chat" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-surface border-l border-outline-variant shadow-2xl z-120 flex flex-col font-sans"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5 text-primary">
            <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            <div>
              <h2 className="font-bold text-[14px] text-on-surface">المساعد التفاعلي (Co-Pilot)</h2>
              <span className="text-[11px] text-on-surface-variant">تعديل تراكمي ذكي وموضعي</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="material-symbols-outlined p-1.5 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface text-[20px]"
            aria-label="إغلاق المساعد"
          >
            close
          </button>
        </div>

        {/* Selected Asset Context Badge */}
        {selectedItem && (
          <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-primary font-medium truncate">
              <span className="material-symbols-outlined text-[16px]">touch_app</span>
              <span className="truncate">
                القطعة المحددة: <strong>{selectedItem.name}</strong>
              </span>
            </div>
            <button
              onClick={() => setSelectedAssetId(null)}
              className="text-[11px] text-primary/70 hover:text-primary underline mr-2 shrink-0"
              title="إلغاء التحديد"
            >
              إلغاء
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div className="grow overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const isClarify = msg.action_type === "clarify";
            return (
              <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-[13px] leading-relaxed ${
                    isUser
                      ? "bg-primary text-on-primary rounded-tr-none shadow-sm"
                      : isClarify
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 rounded-tl-none shadow-sm"
                      : "bg-surface-container-high text-on-surface border border-outline-variant/50 rounded-tl-none"
                  }`}
                >
                  {!isUser && isClarify && (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[11px] font-bold mb-1">
                      <span className="material-symbols-outlined text-[15px]">help_outline</span>
                      <span>توضيح مطلوب لتحديد القطعة بدقة:</span>
                    </div>
                  )}
                  {msg.text}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-surface-container-high border border-outline-variant rounded-2xl rounded-tl-none p-3 text-xs text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined animate-spin text-[16px] text-primary">
                  sync
                </span>
                <span>جاري معالجة المشهد وتطبيق التعديل الهندسي...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-surface-container-low/50 border-t border-outline-variant/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setInput("غيّر لون الكنب إلى بيج كتان")}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-surface-container text-[11px] text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
          >
            🎨 تغيير لون الكنب
          </button>
          <button
            type="button"
            onClick={() => setInput("أضف مكتبة كتب خشبية بجانب النافذة")}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-surface-container text-[11px] text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
          >
            📚 مكتبة بجانب النافذة
          </button>
          <button
            type="button"
            onClick={() => setInput("أضف نبتة داخلية في الزاوية")}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-surface-container text-[11px] text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
          >
            🌿 نبتة بالزاوية
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-outline-variant bg-surface">
          <div className="flex items-center bg-surface-container rounded-2xl overflow-hidden border border-outline-variant focus-within:border-primary grow p-1 transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="اطلب تعديلاً، إضافة، أو خامة جديدة..."
              className="grow bg-transparent border-none focus:ring-0 text-xs py-2 px-3 text-on-surface placeholder:text-on-surface-variant/60"
              dir="rtl"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`flex items-center justify-center rounded-xl p-2 transition-all ${
                input.trim() && !isLoading
                  ? "bg-primary text-on-primary hover:bg-primary/90 active:scale-95 shadow-sm"
                  : "text-on-surface-variant/40 bg-transparent"
              }`}
              title="إرسال الطلب"
              aria-label="إرسال الطلب"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
