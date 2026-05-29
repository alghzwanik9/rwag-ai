import bpy
import math
import mathutils

existing_groups = []

def get_global_aabb(meshes):
    min_x = min_y = min_z = float('inf')
    max_x = max_y = max_z = float('-inf')
    for obj in meshes:
        for corner in obj.bound_box:
            world_corner = obj.matrix_world @ mathutils.Vector(corner)
            min_x = min(min_x, world_corner.x)
            max_x = max(max_x, world_corner.x)
            min_y = min(min_y, world_corner.y)
            max_y = max(max_y, world_corner.y)
            min_z = min(min_z, world_corner.z)
            max_z = max(max_z, world_corner.z)
    return min_x, max_x, min_y, max_y, min_z, max_z

def clamp_to_room_bounds(parent_obj, meshes, bounds):
    rmin_x, rmax_x, rmin_y, rmax_y = bounds
    min_x, max_x, min_y, max_y, _, _ = get_global_aabb(meshes)
    x_offset = 0.0
    y_offset = 0.0
    if min_x < rmin_x: x_offset = rmin_x - min_x
    if max_x > rmax_x: x_offset = rmax_x - max_x
    if min_y < rmin_y: y_offset = rmin_y - min_y
    if max_y > rmax_y: y_offset = rmax_y - max_y
    parent_obj.location.x += x_offset
    parent_obj.location.y += y_offset
    if x_offset != 0 or y_offset != 0:
        bpy.context.view_layer.update()
        return True
    return False

def check_intersection(aabb1, aabb2):
    min_x1, max_x1, min_y1, max_y1, min_z1, max_z1 = aabb1
    min_x2, max_x2, min_y2, max_y2, min_z2, max_z2 = aabb2
    return (min_x1 <= max_x2 and max_x1 >= min_x2) and \
           (min_y1 <= max_y2 and max_y1 >= min_y2) and \
           (min_z1 <= max_z2 and max_z1 >= min_z2)

def avoid_collisions(parent_obj, meshes, existing_groups, bounds, max_retries=10):
    for i in range(max_retries):
        my_aabb = get_global_aabb(meshes)
        collision = False
        for ext_meshes in existing_groups:
            ext_aabb = get_global_aabb(ext_meshes)
            if check_intersection(my_aabb, ext_aabb):
                collision = True
                break
        if not collision:
            return True
        # Nudge along X and clamp
        parent_obj.location.x += 0.2
        bpy.context.view_layer.update()
        clamp_to_room_bounds(parent_obj, meshes, bounds)
    print(f'WARNING: Could not resolve collision for {parent_obj.name}. Deleting.')
    # Delete if failed to avoid collision
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes: obj.select_set(True)
    parent_obj.select_set(True)
    bpy.ops.object.delete()
    return False

# Clear existing mesh objects
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.select_by_type(type='MESH')
bpy.ops.object.delete()

# Generating floor: floor_1
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.05))
current_obj = bpy.context.active_object
current_obj.name = 'floor_1'
current_obj.scale = (5 * 1.0, 5 * 1.0, 0.1 * 1.0)
current_obj.rotation_euler[2] = math.radians(0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.context.view_layer.update()
if 'floor' != 'floor':
    world_corners = [current_obj.matrix_world @ mathutils.Vector(corner) for corner in current_obj.bound_box]
    true_min_z = min([corner.z for corner in world_corners])
    if true_min_z < 0:
        z_offset = 0 - true_min_z
        current_obj.location.z += z_offset
        bpy.context.view_layer.update()
# Bounding Box Clamp and Collision Avoidance
if 'floor' not in ['floor', 'wall', 'window']:
    room_bounds = (-2.4, 2.5, -2.4, 2.5)
    clamp_to_room_bounds(current_obj, [current_obj], room_bounds)
    if avoid_collisions(current_obj, [current_obj], existing_groups, room_bounds):
        existing_groups.append([current_obj])
    else:
        current_obj = None
if current_obj:
    mat = bpy.data.materials.new(name='floor_1_mat')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.6583748172794485, 0.5711248294648731, 0.47353149614800955, 1.0)
        if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.2
    current_obj.data.materials.append(mat)

# Generating wall: wall_north
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.5, 1.5))
current_obj = bpy.context.active_object
current_obj.name = 'wall_north'
current_obj.scale = (5 * 1.0, 0.2 * 1.0, 3.0 * 1.0)
current_obj.rotation_euler[2] = math.radians(0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.context.view_layer.update()
if 'wall' != 'floor':
    world_corners = [current_obj.matrix_world @ mathutils.Vector(corner) for corner in current_obj.bound_box]
    true_min_z = min([corner.z for corner in world_corners])
    if true_min_z < 0:
        z_offset = 0 - true_min_z
        current_obj.location.z += z_offset
        bpy.context.view_layer.update()
# Bounding Box Clamp and Collision Avoidance
if 'wall' not in ['floor', 'wall', 'window']:
    room_bounds = (-2.4, 2.5, -2.4, 2.5)
    clamp_to_room_bounds(current_obj, [current_obj], room_bounds)
    if avoid_collisions(current_obj, [current_obj], existing_groups, room_bounds):
        existing_groups.append([current_obj])
    else:
        current_obj = None
if current_obj:
    mat = bpy.data.materials.new(name='wall_north_mat')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.9130986517934192, 0.9130986517934192, 0.9130986517934192, 1.0)
        if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.9
    current_obj.data.materials.append(mat)

# Generating wall: wall_west
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-2.5, 0, 1.5))
current_obj = bpy.context.active_object
current_obj.name = 'wall_west'
current_obj.scale = (0.2 * 1.0, 5 * 1.0, 3.0 * 1.0)
current_obj.rotation_euler[2] = math.radians(0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.context.view_layer.update()
if 'wall' != 'floor':
    world_corners = [current_obj.matrix_world @ mathutils.Vector(corner) for corner in current_obj.bound_box]
    true_min_z = min([corner.z for corner in world_corners])
    if true_min_z < 0:
        z_offset = 0 - true_min_z
        current_obj.location.z += z_offset
        bpy.context.view_layer.update()
# Bounding Box Clamp and Collision Avoidance
if 'wall' not in ['floor', 'wall', 'window']:
    room_bounds = (-2.4, 2.5, -2.4, 2.5)
    clamp_to_room_bounds(current_obj, [current_obj], room_bounds)
    if avoid_collisions(current_obj, [current_obj], existing_groups, room_bounds):
        existing_groups.append([current_obj])
    else:
        current_obj = None
if current_obj:
    mat = bpy.data.materials.new(name='wall_west_mat')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.9130986517934192, 0.9130986517934192, 0.9130986517934192, 1.0)
        if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.9
    current_obj.data.materials.append(mat)

# Generating window: main_window
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -2.49, 1.25))
current_obj = bpy.context.active_object
current_obj.name = 'main_window'
current_obj.scale = (3.0 * 1.0, 0.2 * 1.0, 2.5 * 1.0)
current_obj.rotation_euler[2] = math.radians(0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.context.view_layer.update()
if 'window' != 'floor':
    world_corners = [current_obj.matrix_world @ mathutils.Vector(corner) for corner in current_obj.bound_box]
    true_min_z = min([corner.z for corner in world_corners])
    if true_min_z < 0:
        z_offset = 0 - true_min_z
        current_obj.location.z += z_offset
        bpy.context.view_layer.update()
# Bounding Box Clamp and Collision Avoidance
if 'window' not in ['floor', 'wall', 'window']:
    room_bounds = (-2.4, 2.5, -2.4, 2.5)
    clamp_to_room_bounds(current_obj, [current_obj], room_bounds)
    if avoid_collisions(current_obj, [current_obj], existing_groups, room_bounds):
        existing_groups.append([current_obj])
    else:
        current_obj = None
if current_obj:
    mat = bpy.data.materials.new(name='main_window_mat')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.26225065752969623, 0.3467040563550296, 0.45078578283822346, 1.0)
        if 'Transmission' in bsdf.inputs: bsdf.inputs['Transmission'].default_value = 1.0
        if 'Roughness' in bsdf.inputs: bsdf.inputs['Roughness'].default_value = 0.05
        if 'IOR' in bsdf.inputs: bsdf.inputs['IOR'].default_value = 1.45
        mat.blend_method = 'BLEND'
    current_obj.data.materials.append(mat)

# Generating furniture: tv_unit_main
# Importing asset tv_unit.glb for tv_unit_main
bpy.ops.import_scene.gltf(filepath=r'D:/DEV/ACTIVE/rwaq-ai/assets/tv_unit.glb')
bpy.context.view_layer.update()
imported_objs = list(bpy.context.selected_objects)
imported_meshes = [obj for obj in imported_objs if obj.type == 'MESH']
if imported_meshes:
    parent_empty = bpy.data.objects.new('tv_unit_main_parent', None)
    bpy.context.scene.collection.objects.link(parent_empty)
    parent_empty.location = (0, 0, 0)
    bpy.context.view_layer.update()
    for obj in imported_objs:
        obj.parent = parent_empty
        obj.matrix_parent_inverse = parent_empty.matrix_world.inverted()
    min_x = min_y = min_z = float('inf')
    max_x = max_y = max_z = float('-inf')
    for obj in imported_meshes:
        for vertex in obj.bound_box:
            world_vertex = obj.matrix_world @ mathutils.Vector(vertex)
            min_x = min(min_x, world_vertex.x)
            max_x = max(max_x, world_vertex.x)
            min_y = min(min_y, world_vertex.y)
            max_y = max(max_y, world_vertex.y)
            min_z = min(min_z, world_vertex.z)
            max_z = max(max_z, world_vertex.z)
    dim_x = max_x - min_x
    dim_y = max_y - min_y
    dim_z = max_z - min_z
    max_dim_ai = max(1.8, 0.4, 0.5) * 1.0
    max_dim_model = max(dim_x, dim_y, dim_z)
    uniform_scale = (max_dim_ai / max_dim_model) if max_dim_model > 0 else 1.0
    parent_empty.scale = (uniform_scale, uniform_scale, uniform_scale)
    parent_empty.rotation_euler[2] = math.radians(0)
    parent_empty.location = (0, -2.2, 0)
    bpy.context.view_layer.update()
    true_min_z = float('inf')
    for obj in imported_meshes:
        world_corners = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
        obj_min_z = min([corner.z for corner in world_corners])
        true_min_z = min(true_min_z, obj_min_z)
    if true_min_z < 0:
        z_offset = 0 - true_min_z
        parent_empty.location.z += z_offset
    bpy.context.view_layer.update()
    # Bounding Box Clamp and Collision Avoidance
    if 'furniture' not in ['floor', 'wall', 'window']:
        room_bounds = (-2.4, 2.5, -2.4, 2.5)
        clamp_to_room_bounds(parent_empty, imported_meshes, room_bounds)
        if avoid_collisions(parent_empty, imported_meshes, existing_groups, room_bounds):
            existing_groups.append(imported_meshes)
        else:
            imported_meshes = []
    for obj in imported_meshes:
        if not obj.data.materials:
            mat = bpy.data.materials.new(name='tv_unit_main_mat')
            mat.use_nodes = True
            obj.data.materials.append(mat)
        for slot in obj.material_slots:
            if slot.material and slot.material.use_nodes:
                bsdf = slot.material.node_tree.nodes.get('Principled BSDF')
                if bsdf:
                    bsdf.inputs['Base Color'].default_value = (0.013702083047289686, 0.013702083047289686, 0.013702083047289686, 1.0)

# Generating furniture: sofa_main
# Importing asset sofa.glb for sofa_main
bpy.ops.import_scene.gltf(filepath=r'D:/DEV/ACTIVE/rwaq-ai/assets/sofa.glb')
bpy.context.view_layer.update()
imported_objs = list(bpy.context.selected_objects)
imported_meshes = [obj for obj in imported_objs if obj.type == 'MESH']
if imported_meshes:
    parent_empty = bpy.data.objects.new('sofa_main_parent', None)
    bpy.context.scene.collection.objects.link(parent_empty)
    parent_empty.location = (0, 0, 0)
    bpy.context.view_layer.update()
    for obj in imported_objs:
        obj.parent = parent_empty
        obj.matrix_parent_inverse = parent_empty.matrix_world.inverted()
    min_x = min_y = min_z = float('inf')
    max_x = max_y = max_z = float('-inf')
    for obj in imported_meshes:
        for vertex in obj.bound_box:
            world_vertex = obj.matrix_world @ mathutils.Vector(vertex)
            min_x = min(min_x, world_vertex.x)
            max_x = max(max_x, world_vertex.x)
            min_y = min(min_y, world_vertex.y)
            max_y = max(max_y, world_vertex.y)
            min_z = min(min_z, world_vertex.z)
            max_z = max(max_z, world_vertex.z)
    dim_x = max_x - min_x
    dim_y = max_y - min_y
    dim_z = max_z - min_z
    max_dim_ai = max(2.4, 0.95, 0.8) * 1.0
    max_dim_model = max(dim_x, dim_y, dim_z)
    uniform_scale = (max_dim_ai / max_dim_model) if max_dim_model > 0 else 1.0
    parent_empty.scale = (uniform_scale, uniform_scale, uniform_scale)
    parent_empty.rotation_euler[2] = math.radians(180)
    parent_empty.location = (0, 1.0, 0)
    bpy.context.view_layer.update()
    true_min_z = float('inf')
    for obj in imported_meshes:
        world_corners = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
        obj_min_z = min([corner.z for corner in world_corners])
        true_min_z = min(true_min_z, obj_min_z)
    if true_min_z < 0:
        z_offset = 0 - true_min_z
        parent_empty.location.z += z_offset
    bpy.context.view_layer.update()
    # Bounding Box Clamp and Collision Avoidance
    if 'furniture' not in ['floor', 'wall', 'window']:
        room_bounds = (-2.4, 2.5, -2.4, 2.5)
        clamp_to_room_bounds(parent_empty, imported_meshes, room_bounds)
        if avoid_collisions(parent_empty, imported_meshes, existing_groups, room_bounds):
            existing_groups.append(imported_meshes)
        else:
            imported_meshes = []
    for obj in imported_meshes:
        if not obj.data.materials:
            mat = bpy.data.materials.new(name='sofa_main_mat')
            mat.use_nodes = True
            obj.data.materials.append(mat)
        for slot in obj.material_slots:
            if slot.material and slot.material.use_nodes:
                bsdf = slot.material.node_tree.nodes.get('Principled BSDF')
                if bsdf:
                    bsdf.inputs['Base Color'].default_value = (0.06847816984440017, 0.06847816984440017, 0.06847816984440017, 1.0)

# Generating furniture: coffee_table
# Importing asset table.glb for coffee_table
bpy.ops.import_scene.gltf(filepath=r'D:/DEV/ACTIVE/rwaq-ai/assets/table.glb')
bpy.context.view_layer.update()
imported_objs = list(bpy.context.selected_objects)
imported_meshes = [obj for obj in imported_objs if obj.type == 'MESH']
if imported_meshes:
    parent_empty = bpy.data.objects.new('coffee_table_parent', None)
    bpy.context.scene.collection.objects.link(parent_empty)
    parent_empty.location = (0, 0, 0)
    bpy.context.view_layer.update()
    for obj in imported_objs:
        obj.parent = parent_empty
        obj.matrix_parent_inverse = parent_empty.matrix_world.inverted()
    min_x = min_y = min_z = float('inf')
    max_x = max_y = max_z = float('-inf')
    for obj in imported_meshes:
        for vertex in obj.bound_box:
            world_vertex = obj.matrix_world @ mathutils.Vector(vertex)
            min_x = min(min_x, world_vertex.x)
            max_x = max(max_x, world_vertex.x)
            min_y = min(min_y, world_vertex.y)
            max_y = max(max_y, world_vertex.y)
            min_z = min(min_z, world_vertex.z)
            max_z = max(max_z, world_vertex.z)
    dim_x = max_x - min_x
    dim_y = max_y - min_y
    dim_z = max_z - min_z
    max_dim_ai = max(1.0, 0.6, 0.4) * 1.0
    max_dim_model = max(dim_x, dim_y, dim_z)
    uniform_scale = (max_dim_ai / max_dim_model) if max_dim_model > 0 else 1.0
    parent_empty.scale = (uniform_scale, uniform_scale, uniform_scale)
    parent_empty.rotation_euler[2] = math.radians(0)
    parent_empty.location = (0, 0.0, 0)
    bpy.context.view_layer.update()
    true_min_z = float('inf')
    for obj in imported_meshes:
        world_corners = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
        obj_min_z = min([corner.z for corner in world_corners])
        true_min_z = min(true_min_z, obj_min_z)
    if true_min_z < 0:
        z_offset = 0 - true_min_z
        parent_empty.location.z += z_offset
    bpy.context.view_layer.update()
    # Bounding Box Clamp and Collision Avoidance
    if 'furniture' not in ['floor', 'wall', 'window']:
        room_bounds = (-2.4, 2.5, -2.4, 2.5)
        clamp_to_room_bounds(parent_empty, imported_meshes, room_bounds)
        if avoid_collisions(parent_empty, imported_meshes, existing_groups, room_bounds):
            existing_groups.append(imported_meshes)
        else:
            imported_meshes = []
    for obj in imported_meshes:
        if not obj.data.materials:
            mat = bpy.data.materials.new(name='coffee_table_mat')
            mat.use_nodes = True
            obj.data.materials.append(mat)
        for slot in obj.material_slots:
            if slot.material and slot.material.use_nodes:
                bsdf = slot.material.node_tree.nodes.get('Principled BSDF')
                if bsdf:
                    bsdf.inputs['Base Color'].default_value = (0.35153259950043936, 0.08437621154414882, 0.026241221894849898, 1.0)

# Generating furniture: rug_main
# Importing asset rug.glb for rug_main
bpy.ops.import_scene.gltf(filepath=r'D:/DEV/ACTIVE/rwaq-ai/assets/rug.glb')
bpy.context.view_layer.update()
imported_objs = list(bpy.context.selected_objects)
imported_meshes = [obj for obj in imported_objs if obj.type == 'MESH']
if imported_meshes:
    parent_empty = bpy.data.objects.new('rug_main_parent', None)
    bpy.context.scene.collection.objects.link(parent_empty)
    parent_empty.location = (0, 0, 0)
    bpy.context.view_layer.update()
    for obj in imported_objs:
        obj.parent = parent_empty
        obj.matrix_parent_inverse = parent_empty.matrix_world.inverted()
    min_x = min_y = min_z = float('inf')
    max_x = max_y = max_z = float('-inf')
    for obj in imported_meshes:
        for vertex in obj.bound_box:
            world_vertex = obj.matrix_world @ mathutils.Vector(vertex)
            min_x = min(min_x, world_vertex.x)
            max_x = max(max_x, world_vertex.x)
            min_y = min(min_y, world_vertex.y)
            max_y = max(max_y, world_vertex.y)
            min_z = min(min_z, world_vertex.z)
            max_z = max(max_z, world_vertex.z)
    dim_x = max_x - min_x
    dim_y = max_y - min_y
    dim_z = max_z - min_z
    max_dim_ai = max(2.5, 1.6, 0.02) * 1.0
    max_dim_model = max(dim_x, dim_y, dim_z)
    uniform_scale = (max_dim_ai / max_dim_model) if max_dim_model > 0 else 1.0
    parent_empty.scale = (uniform_scale, uniform_scale, uniform_scale)
    parent_empty.rotation_euler[2] = math.radians(0)
    parent_empty.location = (0, 0.4, 0)
    bpy.context.view_layer.update()
    true_min_z = float('inf')
    for obj in imported_meshes:
        world_corners = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
        obj_min_z = min([corner.z for corner in world_corners])
        true_min_z = min(true_min_z, obj_min_z)
    if true_min_z < 0:
        z_offset = 0 - true_min_z
        parent_empty.location.z += z_offset
    bpy.context.view_layer.update()
    # Bounding Box Clamp and Collision Avoidance
    if 'furniture' not in ['floor', 'wall', 'window']:
        room_bounds = (-2.4, 2.5, -2.4, 2.5)
        clamp_to_room_bounds(parent_empty, imported_meshes, room_bounds)
        if avoid_collisions(parent_empty, imported_meshes, existing_groups, room_bounds):
            existing_groups.append(imported_meshes)
        else:
            imported_meshes = []
    for obj in imported_meshes:
        if not obj.data.materials:
            mat = bpy.data.materials.new(name='rug_main_mat')
            mat.use_nodes = True
            obj.data.materials.append(mat)
        for slot in obj.material_slots:
            if slot.material and slot.material.use_nodes:
                bsdf = slot.material.node_tree.nodes.get('Principled BSDF')
                if bsdf:
                    bsdf.inputs['Base Color'].default_value = (0.7454042095403874, 0.7454042095403874, 0.7454042095403874, 1.0)

# Generating furniture: armchair_accent
print("WARNING: Asset 'khronos_sheenchair' not found in assets/ folder. Falling back to primitive shape.")
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(1.5, 0.5, 0.4))
current_obj = bpy.context.active_object
current_obj.name = 'armchair_accent'
current_obj.scale = (0.7 * 1.0, 0.7 * 1.0, 0.8 * 1.0)
current_obj.rotation_euler[2] = math.radians(135)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.context.view_layer.update()
if 'furniture' != 'floor':
    world_corners = [current_obj.matrix_world @ mathutils.Vector(corner) for corner in current_obj.bound_box]
    true_min_z = min([corner.z for corner in world_corners])
    if true_min_z < 0:
        z_offset = 0 - true_min_z
        current_obj.location.z += z_offset
        bpy.context.view_layer.update()
# Bounding Box Clamp and Collision Avoidance
if 'furniture' not in ['floor', 'wall', 'window']:
    room_bounds = (-2.4, 2.5, -2.4, 2.5)
    clamp_to_room_bounds(current_obj, [current_obj], room_bounds)
    if avoid_collisions(current_obj, [current_obj], existing_groups, room_bounds):
        existing_groups.append([current_obj])
    else:
        current_obj = None
if current_obj:
    mat = bpy.data.materials.new(name='armchair_accent_mat')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.11443537382697373, 0.3419144249086609, 0.35153259950043936, 1.0)
    current_obj.data.materials.append(mat)

# Generating furniture: plant_corner
# Importing asset plant.glb for plant_corner
bpy.ops.import_scene.gltf(filepath=r'D:/DEV/ACTIVE/rwaq-ai/assets/plant.glb')
bpy.context.view_layer.update()
imported_objs = list(bpy.context.selected_objects)
imported_meshes = [obj for obj in imported_objs if obj.type == 'MESH']
if imported_meshes:
    parent_empty = bpy.data.objects.new('plant_corner_parent', None)
    bpy.context.scene.collection.objects.link(parent_empty)
    parent_empty.location = (0, 0, 0)
    bpy.context.view_layer.update()
    for obj in imported_objs:
        obj.parent = parent_empty
        obj.matrix_parent_inverse = parent_empty.matrix_world.inverted()
    min_x = min_y = min_z = float('inf')
    max_x = max_y = max_z = float('-inf')
    for obj in imported_meshes:
        for vertex in obj.bound_box:
            world_vertex = obj.matrix_world @ mathutils.Vector(vertex)
            min_x = min(min_x, world_vertex.x)
            max_x = max(max_x, world_vertex.x)
            min_y = min(min_y, world_vertex.y)
            max_y = max(max_y, world_vertex.y)
            min_z = min(min_z, world_vertex.z)
            max_z = max(max_z, world_vertex.z)
    dim_x = max_x - min_x
    dim_y = max_y - min_y
    dim_z = max_z - min_z
    max_dim_ai = max(0.6, 0.6, 1.5) * 1.0
    max_dim_model = max(dim_x, dim_y, dim_z)
    uniform_scale = (max_dim_ai / max_dim_model) if max_dim_model > 0 else 1.0
    parent_empty.scale = (uniform_scale, uniform_scale, uniform_scale)
    parent_empty.rotation_euler[2] = math.radians(0)
    parent_empty.location = (-1.8, -2.0, 0)
    bpy.context.view_layer.update()
    true_min_z = float('inf')
    for obj in imported_meshes:
        world_corners = [obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box]
        obj_min_z = min([corner.z for corner in world_corners])
        true_min_z = min(true_min_z, obj_min_z)
    if true_min_z < 0:
        z_offset = 0 - true_min_z
        parent_empty.location.z += z_offset
    bpy.context.view_layer.update()
    # Bounding Box Clamp and Collision Avoidance
    if 'furniture' not in ['floor', 'wall', 'window']:
        room_bounds = (-2.4, 2.5, -2.4, 2.5)
        clamp_to_room_bounds(parent_empty, imported_meshes, room_bounds)
        if avoid_collisions(parent_empty, imported_meshes, existing_groups, room_bounds):
            existing_groups.append(imported_meshes)
        else:
            imported_meshes = []
    for obj in imported_meshes:
        if not obj.data.materials:
            mat = bpy.data.materials.new(name='plant_corner_mat')
            mat.use_nodes = True
            obj.data.materials.append(mat)
        for slot in obj.material_slots:
            if slot.material and slot.material.use_nodes:
                bsdf = slot.material.node_tree.nodes.get('Principled BSDF')
                if bsdf:
                    bsdf.inputs['Base Color'].default_value = (0.027320891639074894, 0.2581828529215958, 0.0953074666309647, 1.0)

# Stage 5: Material & Illumination (EEVEE Next)
if hasattr(bpy.context.scene.render, 'engine'):
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
    bpy.context.scene.eevee.use_ssr = True
    bpy.context.scene.eevee.use_ssr_refraction = True
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        mat = bpy.data.materials.new(name=f'{obj.name}_mat')
        mat.use_nodes = True
        if not obj.data.materials:
            obj.data.materials.append(mat)

# Save the scene
bpy.ops.wm.save_as_mainfile(filepath=r'D:\DEV\ACTIVE\rwaq-ai\frontend\public\outputs\output_1e674e80-b849-41b1-b38d-744aaaaf2140.blend')
# Export GLB
bpy.ops.export_scene.gltf(filepath=r'D:\DEV\ACTIVE\rwaq-ai\frontend\public\outputs\output_1e674e80-b849-41b1-b38d-744aaaaf2140.glb', export_format='GLB')
