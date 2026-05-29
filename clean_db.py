from asset_scraper import LanceDBAssetStore
store = LanceDBAssetStore()
t = store._table
t.delete("asset_id IN ('khronos_abeautifulgame', 'khronos_antiquecamera', 'khronos_glassvaseflowers', 'khronos_materialsvariantsshoe')")
print("Deleted weird Khronos objects from LanceDB.")
