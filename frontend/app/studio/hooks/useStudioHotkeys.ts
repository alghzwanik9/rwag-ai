import { useEffect } from "react";
import { useSceneStore } from "@/lib/useSceneStore";

export function useStudioHotkeys(showToast: (msg: string) => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo / Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.code === 'KeyZ') {
          if (e.shiftKey) {
            e.preventDefault();
            useSceneStore.getState().redo();
            showToast("↪️ إعادة (Redo)");
          } else {
            e.preventDefault();
            useSceneStore.getState().undo();
            showToast("↩️ تراجع (Undo)");
          }
        } else if (e.code === 'KeyY') {
          e.preventDefault();
          useSceneStore.getState().redo();
          showToast("↪️ إعادة (Redo)");
        }
      }

      // Delete Item
      if (e.key === "Backspace" || e.key === "Delete") {
        const state = useSceneStore.getState();
        const selected = state.selectedAssetId;
        if (selected) {
          state.removeSceneItem(selected);
          state.setSelectedAssetId(null);
          showToast("🗑️ تم حذف القطعة");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);
}
