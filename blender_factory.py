import bpy
import json
import os
import random
import math

# --- Configuration ---
NUM_TABLES = 5
NUM_SHELVES = 3

OUTPUT_DIR = r"D:\DEV\ACTIVE\rwaq-ai\frontend\public\assets\synthetic"
os.makedirs(OUTPUT_DIR, exist_ok=True)

metadata = {}

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # Clear orphaned data
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)

def create_wood_material(name="WoodMat", r=0.4, g=0.2, b=0.1):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.8
    return mat

def apply_material(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def generate_table(index):
    clear_scene()
    
    # Random dimensions (in meters)
    width = random.uniform(0.8, 2.0)
    depth = random.uniform(0.6, 1.2)
    height = random.uniform(0.6, 0.9)
    thickness = 0.05
    leg_radius = 0.03
    
    # Material
    color_var = random.uniform(-0.1, 0.1)
    wood_mat = create_wood_material(r=0.5+color_var, g=0.3+color_var, b=0.15+color_var)
    
    # Table Top (primitive_cube_add default size is 2, so we scale by half)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, height))
    top = bpy.context.active_object
    top.scale = (width, depth, thickness)
    apply_material(top, wood_mat)
    
    # Legs
    leg_x = (width / 2) - leg_radius - 0.05
    leg_y = (depth / 2) - leg_radius - 0.05
    leg_z = height / 2
    
    positions = [
        (leg_x, leg_y, leg_z),
        (-leg_x, leg_y, leg_z),
        (leg_x, -leg_y, leg_z),
        (-leg_x, -leg_y, leg_z)
    ]
    
    for pos in positions:
        bpy.ops.mesh.primitive_cylinder_add(radius=leg_radius, depth=height, location=pos)
        apply_material(bpy.context.active_object, wood_mat)
        
    # Join all into one object
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active = top
    bpy.ops.object.join()
    top.name = f"SyntheticTable_{index}"
    
    # Export
    filename = f"table_{index}.glb"
    filepath = os.path.join(OUTPUT_DIR, filename)
    bpy.ops.export_scene.gltf(filepath=filepath, export_format='GLB', use_selection=True)
    
    # Dimensions for metadata (in mm)
    metadata[f"synthetic_table_{index}"] = {
        "name": f"طاولة مصنعة {index}",
        "category": "tables",
        "source": "Synthetic Factory",
        "w": round(width * 1000),
        "h": round((height + thickness/2) * 1000),
        "d": round(depth * 1000),
        "model_url": f"/assets/synthetic/{filename}"
    }

def generate_shelf(index):
    clear_scene()
    
    width = random.uniform(0.6, 1.2)
    depth = random.uniform(0.3, 0.5)
    height = random.uniform(1.2, 2.0)
    thickness = 0.03
    num_shelves = random.randint(3, 6)
    
    wood_mat = create_wood_material(name=f"ShelfMat_{index}", r=0.2, g=0.2, b=0.2) # Dark grey/black
    
    objects_to_join = []
    
    # Side panels
    bpy.ops.mesh.primitive_cube_add(size=1, location=(width/2, 0, height/2))
    right_panel = bpy.context.active_object
    right_panel.scale = (thickness, depth, height)
    apply_material(right_panel, wood_mat)
    objects_to_join.append(right_panel)
    
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-width/2, 0, height/2))
    left_panel = bpy.context.active_object
    left_panel.scale = (thickness, depth, height)
    apply_material(left_panel, wood_mat)
    objects_to_join.append(left_panel)
    
    # Shelves
    spacing = height / num_shelves
    for i in range(num_shelves + 1):
        z_pos = i * spacing
        if z_pos == 0: z_pos += thickness/2
        if z_pos == height: z_pos -= thickness/2
            
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, z_pos))
        shelf = bpy.context.active_object
        shelf.scale = (width, depth, thickness)
        apply_material(shelf, wood_mat)
        objects_to_join.append(shelf)
        
    # Join
    for obj in objects_to_join:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects_to_join[0]
    bpy.ops.object.join()
    
    main_obj = bpy.context.active_object
    main_obj.name = f"SyntheticShelf_{index}"
    
    filename = f"shelf_{index}.glb"
    filepath = os.path.join(OUTPUT_DIR, filename)
    bpy.ops.export_scene.gltf(filepath=filepath, export_format='GLB', use_selection=True)
    
    metadata[f"synthetic_shelf_{index}"] = {
        "name": f"رف مصنع {index}",
        "category": "tables",
        "source": "Synthetic Factory",
        "w": round(width * 1000),
        "h": round(height * 1000),
        "d": round(depth * 1000),
        "model_url": f"/assets/synthetic/{filename}"
    }

def main():
    print(f"Generating assets into {OUTPUT_DIR}")
    for i in range(1, NUM_TABLES + 1):
        generate_table(i)
    for i in range(1, NUM_SHELVES + 1):
        generate_shelf(i)
        
    meta_path = os.path.join(OUTPUT_DIR, "synthetic_metadata.json")
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=4, ensure_ascii=False)
    print("Factory finished successfully!")

if __name__ == "__main__":
    main()
