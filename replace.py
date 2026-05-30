import os

file_path = "frontend/app/studio/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False

i = 0
while i < len(lines):
    line = lines[i]
    
    # 1. Imports
    if "import { useAssets } from \"@/lib/useAssets\";" in line:
        new_lines.append(line)
        i += 1
        new_lines.append('import { IkeaAssetsLibrary } from "@/components/IkeaAssetsLibrary";\n')
        new_lines.append('import { PromptBar } from "./components/PromptBar";\n')
        new_lines.append('import { BudgetCards } from "./components/BudgetCards";\n')
        new_lines.append('import { StudioToolbar } from "./components/StudioToolbar";\n')
        i += 1 # Skip original IkeaAssetsLibrary
        continue
        
    # 2. Nav (StudioToolbar)
    if '<nav className="fixed left-4 top-1/2 -translate-y-1/2 w-16 bg-surface/60' in line:
        new_lines.append('        <StudioToolbar\n')
        new_lines.append('          showToast={showToast}\n')
        new_lines.append('          handleLoadTemplate={handleLoadTemplate}\n')
        new_lines.append('          setIsProjectsModalOpen={setIsProjectsModalOpen}\n')
        new_lines.append('          setIsModalOpen={setIsModalOpen}\n')
        new_lines.append('          setIsMaterialPaletteOpen={setIsMaterialPaletteOpen}\n')
        new_lines.append('          setIsARModalOpen={setIsARModalOpen}\n')
        new_lines.append('          resetCamera={resetCamera}\n')
        new_lines.append('        />\n')
        # Skip until </nav>
        while i < len(lines) and "</nav>" not in lines[i]:
            i += 1
        i += 1
        continue
        
    # 3. PromptBar
    if '{/* AI Prompt Input (Bottom Center) */}' in line:
        new_lines.append('        {/* AI Prompt Input (Bottom Center) */}\n')
        new_lines.append('        <PromptBar\n')
        new_lines.append('          prompt={prompt}\n')
        new_lines.append('          setPrompt={setPrompt}\n')
        new_lines.append('          imageBase64={imageBase64}\n')
        new_lines.append('          setImageBase64={setImageBase64}\n')
        new_lines.append('          isLoading={isLoading}\n')
        new_lines.append('          handleGenerate={handleGenerate}\n')
        new_lines.append('          handleImageUpload={handleImageUpload}\n')
        new_lines.append('        />\n')
        
        # skip until <div className="fixed bottom-24
        while i < len(lines) and "Quick Info Cards" not in lines[i]:
            i += 1
        continue
        
    # 4. BudgetCards
    if '{/* Quick Info Cards (Bento style at bottom corners) - Reusing Stitch layout for economy summary */}' in line:
        new_lines.append('        {/* Quick Info Cards (Bento style at bottom corners) - Reusing Stitch layout for economy summary */}\n')
        new_lines.append('        <BudgetCards />\n')
        
        # skip until {/* ── مودال الأثاث ── */}
        while i < len(lines) and "{/* ── مودال الأثاث ── */}" not in lines[i]:
            i += 1
        continue
        
    new_lines.append(line)
    i += 1

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Done")
