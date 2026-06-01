import { useState } from "react";
import { useSceneStore } from "@/lib/useSceneStore";
import { IProductTemplate } from "@/app/studio/config/catalogTemplates";

export function useAIGeneration(showToast: (msg: string) => void, catalogAssets: IProductTemplate[]) {
  const [prompt, setPrompt] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageBase64) return;
    setIsLoading(true);
    showToast("جاري التوليد بذكاء رواق...");

    try {
      const res = await fetch("/api/generate-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt || "تصميم الغرفة الموجودة في الصورة", imageBase64 }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.items && data.items.length > 0) {
          const state = useSceneStore.getState();
          state.clearScene();
          // Clear monolithic room if present (assume handled by state or component later)
          
          data.items.forEach((item: any) => {
             const matchingAsset = catalogAssets.find(a => a.id === item.asset_id);
             if (matchingAsset) {
                state.addSceneItem({
                    ...matchingAsset,
                    instanceId: item.instance_id,
                    position: item.position,
                    rotation: item.rotation
                });
             } else {
                // Fallback for missing assets
                state.addSceneItem({
                    instanceId: item.instance_id,
                    id: item.asset_id,
                    name: item.asset_id.replace("_", " "),
                    brand: "Rwaq AI",
                    price: 0,
                    currency: "SAR",
                    category: "seating" as any,
                    modelUrl: "",
                    thumbnailUrl: "",
                    dimensions: { width: 1000, height: 1000, depth: 1000 },
                    position: item.position,
                    rotation: item.rotation
                });
             }
          });
          
          if (data.room_dimensions) {
            state.setRoomWidth(data.room_dimensions.width);
            state.setRoomDepth(data.room_dimensions.depth);
          }
          
          showToast("✅ اكتمل توليد الغرفة بالذكاء الاصطناعي!");
        } else {
          showToast("❌ فشل التوليد، حاول مرة أخرى");
        }
        
        setPrompt("");
        setImageBase64(null);
      } else if (res.status === 429) {
        showToast("تجاوزت الحد المسموح — انتظر دقيقة وأعد المحاولة");
      } else {
        showToast("حدث خطأ في الاتصال بالخادم");
      }
    } catch {
      showToast("تعذّر الاتصال بالخادم — تحقق من تشغيله");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    prompt,
    setPrompt,
    imageBase64,
    setImageBase64,
    isLoading,
    handleImageUpload,
    handleGenerate,
  };
}
