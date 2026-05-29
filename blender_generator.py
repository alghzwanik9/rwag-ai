import json
import os

class BlenderCodeGenerator:
    def __init__(self, state: dict, output_blend: str = "output.blend", output_glb: str = "output.glb"):
        self.state = state
        self.output_blend = output_blend
        self.output_glb = output_glb
        self.code = []

    @staticmethod
    def hex_to_rgba(hex_str: str) -> tuple:
        hex_col = hex_str.lstrip('#')
        if len(hex_col) == 3:
            hex_col = ''.join(c + c for c in hex_col)
        if len(hex_col) != 6:
            hex_col = 'CCCCCC'
        rgb = tuple(int(hex_col[i:i+2], 16) / 255.0 for i in (0, 2, 4))
        linear_rgb = tuple((c / 12.92) if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb)
        return (*linear_rgb, 1.0)

    def _add_imports(self):
        self.code.append("import bpy")
        self.code.append("import math")
        self.code.append("import mathutils")
        self.code.append("")
        self.code.append("existing_groups = []")
        self.code.append("")
        self.code.append("def get_global_aabb(meshes):")
        self.code.append("    min_x = min_y = min_z = float('inf')")
        self.code.append("    max_x = max_y = max_z = float('-inf')")
        self.code.append("    for obj in meshes:")
        self.code.append("        for corner in obj.bound_box:")
        self.code.append("            world_corner = obj.matrix_world @ mathutils.Vector(corner)")
        self.code.append("            min_x = min(min_x, world_corner.x)")
        self.code.append("            max_x = max(max_x, world_corner.x)")
        self.code.append("            min_y = min(min_y, world_corner.y)")
        self.code.append("            max_y = max(max_y, world_corner.y)")
        self.code.append("            min_z = min(min_z, world_corner.z)")
        self.code.append("            max_z = max(max_z, world_corner.z)")
        self.code.append("    return min_x, max_x, min_y, max_y, min_z, max_z")
        self.code.append("")
        self.code.append("def clamp_to_room_bounds(parent_obj, meshes, bounds):")
        self.code.append("    rmin_x, rmax_x, rmin_y, rmax_y = bounds")
        self.code.append("    min_x, max_x, min_y, max_y, _, _ = get_global_aabb(meshes)")
        self.code.append("    x_offset = 0.0")
        self.code.append("    y_offset = 0.0")
        self.code.append("    if min_x < rmin_x: x_offset = rmin_x - min_x")
        self.code.append("    if max_x > rmax_x: x_offset = rmax_x - max_x")
        self.code.append("    if min_y < rmin_y: y_offset = rmin_y - min_y")
        self.code.append("    if max_y > rmax_y: y_offset = rmax_y - max_y")
        self.code.append("    parent_obj.location.x += x_offset")
        self.code.append("    parent_obj.location.y += y_offset")
        self.code.append("    if x_offset != 0 or y_offset != 0:")
        self.code.append("        bpy.context.view_layer.update()")
        self.code.append("        return True")
        self.code.append("    return False")
        self.code.append("")
        self.code.append("def check_intersection(aabb1, aabb2):")
        self.code.append("    min_x1, max_x1, min_y1, max_y1, min_z1, max_z1 = aabb1")
        self.code.append("    min_x2, max_x2, min_y2, max_y2, min_z2, max_z2 = aabb2")
        self.code.append("    return (min_x1 <= max_x2 and max_x1 >= min_x2) and \\")
        self.code.append("           (min_y1 <= max_y2 and max_y1 >= min_y2) and \\")
        self.code.append("           (min_z1 <= max_z2 and max_z1 >= min_z2)")
        self.code.append("")
        self.code.append("def avoid_collisions(parent_obj, meshes, existing_groups, bounds, max_retries=10):")
        self.code.append("    for i in range(max_retries):")
        self.code.append("        my_aabb = get_global_aabb(meshes)")
        self.code.append("        collision = False")
        self.code.append("        for ext_meshes in existing_groups:")
        self.code.append("            ext_aabb = get_global_aabb(ext_meshes)")
        self.code.append("            if check_intersection(my_aabb, ext_aabb):")
        self.code.append("                collision = True")
        self.code.append("                break")
        self.code.append("        if not collision:")
        self.code.append("            return True")
        self.code.append("        # Nudge along X and clamp")
        self.code.append("        parent_obj.location.x += 0.2")
        self.code.append("        bpy.context.view_layer.update()")
        self.code.append("        clamp_to_room_bounds(parent_obj, meshes, bounds)")
        self.code.append("    print(f'WARNING: Could not resolve collision for {parent_obj.name}. Deleting.')")
        self.code.append("    # Delete if failed to avoid collision")
        self.code.append("    bpy.ops.object.select_all(action='DESELECT')")
        self.code.append("    for obj in meshes: obj.select_set(True)")
        self.code.append("    parent_obj.select_set(True)")
        self.code.append("    bpy.ops.object.delete()")
        self.code.append("    return False")
        self.code.append("")

    def _clear_scene(self):
        self.code.append("# Clear existing mesh objects")
        self.code.append("bpy.ops.object.select_all(action='DESELECT')")
        self.code.append("bpy.ops.object.select_by_type(type='MESH')")
        self.code.append("bpy.ops.object.delete()")
        self.code.append("")

    def _generate_mesh(self, obj):
        obj_id = obj['id']
        obj_type = obj['type']
        dim = obj['dimensions']
        trans = obj['transform']
        
        if obj_type == 'wall':
            color_hex = self.state.get('wall_color', obj.get('hex_color', '#F5F5F5'))
        elif obj_type == 'floor':
            color_hex = self.state.get('floor_color', obj.get('hex_color', '#EEEEEE'))
        elif obj_type == 'window':
            color_hex = obj.get('hex_color', '#A3D2CA') # Light glassy blue/cyan
        else:
            color_hex = obj.get('hex_color', '#CCCCCC')
            
        rgba_color = self.hex_to_rgba(color_hex)
        
        # Dimensions
        length = dim['length']
        width = dim['width']
        height = dim['height']
        
        # Transform (JSON uses Y-up)
        tx = trans['t_x']
        ty = trans['t_y'] # Must be 0
        tz = trans['t_z']
        yaw_y = trans['yaw_y']
        scale = trans['scale']
        
        self.code.append(f"# Generating {obj_type}: {obj_id}")
        
        # Map JSON (Y-up) to Blender (Z-up)
        # Blender X = JSON tx
        # Blender Y = JSON tz
        blender_x = tx
        blender_y = tz
        if obj_type == 'floor':
            # Floor top surface at Z = ty
            blender_z = ty - (height * scale) / 2.0
        else:
            # Other objects bottom surface at Z = ty
            blender_z = ty + (height * scale) / 2.0
        
        # Smart Asset Matching
        matched_asset = None
        asset_id = obj.get('asset_id', obj_id)
        asset_id_lower = asset_id.lower()
        
        if os.path.exists("assets"):
            import re
            available_assets = [f for f in os.listdir("assets") if f.endswith(".glb")]
            for asset in available_assets:
                # Remove Windows duplicate suffixes like " (2)" and make lowercase
                asset_base = asset.lower().replace(".glb", "").strip()
                clean_asset_base = re.sub(r'\s*\(\d+\)', '', asset_base).strip()
                
                # Check if the cleaned asset name matches the asset_id
                if clean_asset_base == asset_id_lower or asset_id_lower in clean_asset_base or clean_asset_base in asset_id_lower:
                    matched_asset = asset
                    break
                    
        if obj_type == 'furniture' and not matched_asset:
            self.code.append(f"print(\"WARNING: Asset '{asset_id}' not found in assets/ folder. Falling back to primitive shape.\")")
        
        if matched_asset:
            asset_path = os.path.abspath(os.path.join("assets", matched_asset))
            self.code.append(f"# Importing asset {matched_asset} for {obj_id}")
            # Blender uses forward slashes or raw strings for paths
            safe_asset_path = asset_path.replace('\\\\', '/').replace('\\', '/')
            self.code.append(f"bpy.ops.import_scene.gltf(filepath=r'{safe_asset_path}')")
            self.code.append(f"bpy.context.view_layer.update()")
            self.code.append(f"imported_objs = list(bpy.context.selected_objects)")
            self.code.append(f"imported_meshes = [obj for obj in imported_objs if obj.type == 'MESH']")
            self.code.append(f"if imported_meshes:")
            
            # Create a parent empty to group the object
            self.code.append(f"    parent_empty = bpy.data.objects.new('{obj_id}_parent', None)")
            self.code.append(f"    bpy.context.scene.collection.objects.link(parent_empty)")
            self.code.append(f"    parent_empty.location = (0, 0, 0)")
            self.code.append(f"    bpy.context.view_layer.update()")
            
            # Parent all imported objects
            self.code.append(f"    for obj in imported_objs:")
            self.code.append(f"        obj.parent = parent_empty")
            self.code.append(f"        obj.matrix_parent_inverse = parent_empty.matrix_world.inverted()")
            
            # Calculate original dimensions for scaling
            self.code.append(f"    min_x = min_y = min_z = float('inf')")
            self.code.append(f"    max_x = max_y = max_z = float('-inf')")
            self.code.append(f"    for obj in imported_meshes:")
            self.code.append(f"        for vertex in obj.bound_box:")
            self.code.append(f"            world_vertex = obj.matrix_world @ mathutils.Vector(vertex)")
            self.code.append(f"            min_x = min(min_x, world_vertex.x)")
            self.code.append(f"            max_x = max(max_x, world_vertex.x)")
            self.code.append(f"            min_y = min(min_y, world_vertex.y)")
            self.code.append(f"            max_y = max(max_y, world_vertex.y)")
            self.code.append(f"            min_z = min(min_z, world_vertex.z)")
            self.code.append(f"            max_z = max(max_z, world_vertex.z)")
            self.code.append(f"    dim_x = max_x - min_x")
            self.code.append(f"    dim_y = max_y - min_y")
            self.code.append(f"    dim_z = max_z - min_z")
            
            # 1. Apply requested scale, rotation, and X/Y location to parent empty
            self.code.append(f"    max_dim_ai = max({length}, {width}, {height}) * {scale}")
            self.code.append(f"    max_dim_model = max(dim_x, dim_y, dim_z)")
            self.code.append(f"    uniform_scale = (max_dim_ai / max_dim_model) if max_dim_model > 0 else {scale}")
            self.code.append(f"    parent_empty.scale = (uniform_scale, uniform_scale, uniform_scale)")
            self.code.append(f"    parent_empty.rotation_euler[2] = math.radians({yaw_y})")
            self.code.append(f"    parent_empty.location = ({blender_x}, {blender_y}, {ty})")
            
            # 2. FORCE an update to the scene graph
            self.code.append(f"    bpy.context.view_layer.update()")
            
            # 3. Calculate true global bounding box min_z
            self.code.append(f"    true_min_z = float('inf')")
            self.code.append(f"    for obj in imported_meshes:")
            self.code.append(f"        world_corners = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]")
            self.code.append(f"        obj_min_z = min([corner.z for corner in world_corners])")
            self.code.append(f"        true_min_z = min(true_min_z, obj_min_z)")
            
            # 4. Apply offset to ensure object rests exactly on floor (Z={ty})
            self.code.append(f"    if true_min_z < {ty}:")
            self.code.append(f"        z_offset = {ty} - true_min_z")
            self.code.append(f"        parent_empty.location.z += z_offset")
            self.code.append(f"    bpy.context.view_layer.update()")
            
            self.code.append(f"    # Bounding Box Clamp and Collision Avoidance")
            self.code.append(f"    if '{obj_type}' not in ['floor', 'wall', 'window']:")
            self.code.append(f"        room_bounds = ({self.room_min_x}, {self.room_max_x}, {self.room_min_y}, {self.room_max_y})")
            self.code.append(f"        clamp_to_room_bounds(parent_empty, imported_meshes, room_bounds)")
            self.code.append(f"        if avoid_collisions(parent_empty, imported_meshes, existing_groups, room_bounds):")
            self.code.append(f"            existing_groups.append(imported_meshes)")
            self.code.append(f"        else:")
            self.code.append(f"            imported_meshes = []")

            # 5. Apply Material Color Override
            self.code.append(f"    for obj in imported_meshes:")
            self.code.append(f"        if not obj.data.materials:")
            self.code.append(f"            mat = bpy.data.materials.new(name='{obj_id}_mat')")
            self.code.append(f"            mat.use_nodes = True")
            self.code.append(f"            obj.data.materials.append(mat)")
            self.code.append(f"        for slot in obj.material_slots:")
            self.code.append(f"            if slot.material and slot.material.use_nodes:")
            self.code.append(f"                bsdf = slot.material.node_tree.nodes.get('Principled BSDF')")
            self.code.append(f"                if bsdf:")
            self.code.append(f"                    bsdf.inputs['Base Color'].default_value = {rgba_color}")
            if obj_type == 'wall':
                self.code.append(f"                    if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.9")
            elif obj_type == 'floor':
                self.code.append(f"                    if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.2")
            elif obj_type == 'window':
                self.code.append(f"                    if 'Transmission' in bsdf.inputs: bsdf.inputs['Transmission'].default_value = 1.0")
                self.code.append(f"                    if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.05")
                self.code.append(f"                    if 'IOR' in bsdf.inputs: bsdf.inputs['IOR'].default_value = 1.45")
                self.code.append(f"                    slot.material.blend_method = 'BLEND'")
            self.code.append("")
        else:
            # Primitive fallback
            self.code.append(f"bpy.ops.mesh.primitive_cube_add(size=1.0, location=({blender_x}, {blender_y}, {blender_z}))")
            self.code.append(f"current_obj = bpy.context.active_object")
            self.code.append(f"current_obj.name = '{obj_id}'")
            
            # Set scale (Blender Z = height)
            self.code.append(f"current_obj.scale = ({length} * {scale}, {width} * {scale}, {height} * {scale})")
            
            # Rotation (JSON yaw_y corresponds to Blender rotation around Z)
            self.code.append(f"current_obj.rotation_euler[2] = math.radians({yaw_y})")
            self.code.append("bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)")
            
            # FORCE an update to the scene graph
            self.code.append(f"bpy.context.view_layer.update()")
            
            # Apply offset to ensure primitive rests exactly on floor, EXCEPT for the floor itself
            self.code.append(f"if '{obj_type}' != 'floor':")
            self.code.append(f"    world_corners = [current_obj.matrix_world @ mathutils.Vector(corner) for corner in current_obj.bound_box]")
            self.code.append(f"    true_min_z = min([corner.z for corner in world_corners])")
            self.code.append(f"    if true_min_z < {ty}:")
            self.code.append(f"        z_offset = {ty} - true_min_z")
            self.code.append(f"        current_obj.location.z += z_offset")
            self.code.append(f"        bpy.context.view_layer.update()")
            
            self.code.append(f"# Bounding Box Clamp and Collision Avoidance")
            self.code.append(f"if '{obj_type}' not in ['floor', 'wall', 'window']:")
            self.code.append(f"    room_bounds = ({self.room_min_x}, {self.room_max_x}, {self.room_min_y}, {self.room_max_y})")
            self.code.append(f"    clamp_to_room_bounds(current_obj, [current_obj], room_bounds)")
            self.code.append(f"    if avoid_collisions(current_obj, [current_obj], existing_groups, room_bounds):")
            self.code.append(f"        existing_groups.append([current_obj])")
            self.code.append(f"    else:")
            self.code.append(f"        current_obj = None")

            # Apply Material from Color
            self.code.append(f"if current_obj:")
            self.code.append(f"    mat = bpy.data.materials.new(name='{obj_id}_mat')")
            self.code.append(f"    mat.use_nodes = True")
            self.code.append(f"    bsdf = mat.node_tree.nodes.get('Principled BSDF')")
            self.code.append(f"    if bsdf:")
            self.code.append(f"        bsdf.inputs['Base Color'].default_value = {rgba_color}")
            if obj_type == 'wall':
                self.code.append(f"        if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.9")
            elif obj_type == 'floor':
                self.code.append(f"        if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.2")
            elif obj_type == 'window':
                self.code.append(f"        if 'Transmission' in bsdf.inputs: bsdf.inputs['Transmission'].default_value = 1.0")
                self.code.append(f"        if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.05")
                self.code.append(f"        if 'IOR' in bsdf.inputs: bsdf.inputs['IOR'].default_value = 1.45")
                self.code.append(f"        mat.blend_method = 'BLEND'")
            self.code.append(f"    current_obj.data.materials.append(mat)")
            self.code.append("")

    def _setup_materials(self):
        self.code.append("# Stage 5: Material & Illumination (EEVEE Next)")
        self.code.append("if hasattr(bpy.context.scene.render, 'engine'):")
        self.code.append("    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'")
        self.code.append("    bpy.context.scene.eevee.use_ssr = True")
        self.code.append("    bpy.context.scene.eevee.use_ssr_refraction = True")
        self.code.append("for obj in bpy.data.objects:")
        self.code.append("    if obj.type == 'MESH':")
        self.code.append("        mat = bpy.data.materials.new(name=f'{obj.name}_mat')")
        self.code.append("        mat.use_nodes = True")
        self.code.append("        if not obj.data.materials:")
        self.code.append("            obj.data.materials.append(mat)")
        self.code.append("")

    def generate(self) -> str:
        self._add_imports()
        self._clear_scene()
        
        objects = self.state.get('objects', [])
        
        # Determine room inner physical boundaries
        floor_obj = next((o for o in objects if o['type'] == 'floor'), None)
        if floor_obj:
            fl_len = floor_obj['dimensions']['length'] * floor_obj['transform']['scale']
            fl_wid = floor_obj['dimensions']['width'] * floor_obj['transform']['scale']
            tx = floor_obj['transform']['t_x']
            tz = floor_obj['transform']['t_z']
            
            self.room_min_x = tx - fl_len / 2.0
            self.room_max_x = tx + fl_len / 2.0
            self.room_min_y = tz - fl_wid / 2.0
            self.room_max_y = tz + fl_wid / 2.0
            
            for w in [o for o in objects if o['type'] == 'wall']:
                w_tx = w['transform']['t_x']
                w_tz = w['transform']['t_z']
                w_len = w['dimensions']['length'] * w['transform']['scale']
                w_wid = w['dimensions']['width'] * w['transform']['scale']
                
                yaw_y = w['transform'].get('yaw_y', 0)
                if abs(yaw_y) == 90 or abs(yaw_y) == 270:
                    w_len, w_wid = w_wid, w_len
                
                w_min_x = w_tx - w_len / 2.0
                w_max_x = w_tx + w_len / 2.0
                w_min_y = w_tz - w_wid / 2.0
                w_max_y = w_tz + w_wid / 2.0
                
                if w_len >= w_wid:
                    if abs(w_tz - self.room_min_y) < 1.0: self.room_min_y = max(self.room_min_y, w_max_y)
                    if abs(w_tz - self.room_max_y) < 1.0: self.room_max_y = min(self.room_max_y, w_min_y)
                else:
                    if abs(w_tx - self.room_min_x) < 1.0: self.room_min_x = max(self.room_min_x, w_max_x)
                    if abs(w_tx - self.room_max_x) < 1.0: self.room_max_x = min(self.room_max_x, w_min_x)
        else:
            self.room_min_x, self.room_max_x = -2.5, 2.5
            self.room_min_y, self.room_max_y = -2.5, 2.5
        for obj in objects:
            self._generate_mesh(obj)
            
        self._setup_materials()
        
        # Save output blend file
        self.code.append(f"# Save the scene")
        # Ensure path uses raw strings to avoid escaping issues in Windows
        self.code.append(f"bpy.ops.wm.save_as_mainfile(filepath=r'{self.output_blend}')")
        
        # Export as GLB
        self.code.append(f"# Export GLB")
        self.code.append(f"bpy.ops.export_scene.gltf(filepath=r'{self.output_glb}', export_format='GLB')")
        self.code.append("")
        
        return "\n".join(self.code)

if __name__ == "__main__":
    with open("mock_payload.json", "r") as f:
        state = json.load(f)
    gen = BlenderCodeGenerator(state)
    script_content = gen.generate()
    with open("generated_blender_script.py", "w") as f:
        f.write(script_content)
    print("Generated Blender script: generated_blender_script.py")
