"""
backend/app/services/spatial_solver.py
Architectural Spatial Solver & Clustering Engine
Enforces Neufert standards, functional furniture clustering, clearance corridors,
and multi-zone layouts (single, corridor_room, open_plan, l_shape).
"""

import math
from typing import List, Dict, Any, Optional

def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val)
    except (ValueError, TypeError):
        return default

class SpatialClusteringSolver:
    """
    Post-processes and reorganizes raw LLM-generated furniture objects into
    coherent, ergonomically grounded architectural clusters.
    """

    @classmethod
    def solve_layout(
        cls,
        objects: List[Dict[str, Any]],
        room_width: float,
        room_depth: float,
        shape: str = "single"
    ) -> List[Dict[str, Any]]:
        """
        Organizes objects into clusters:
        1. Work / Study Cluster (Desk, Chair, Rug, Bookshelf, Task Lamp)
        2. Lounge / Living Cluster (Sofa, Coffee Table, TV Unit, Armchair, Rug)
        3. Corridor / Entry Cluster (Console, Runner, Lighting)
        4. Wall-snapping and boundary enforcement.
        """
        if not objects:
            return objects

        # Deep copy items so we don't mutate unexpectedly
        items = [dict(obj) for obj in objects]

        # Categorize items by canonical role
        beds = [it for it in items if it.get("asset_id") == "bed"]
        desks = [it for it in items if it.get("asset_id") in ("desk", "table")]
        chairs = [it for it in items if it.get("asset_id") in ("chair", "dining_chair", "armchair", "deck_chair")]
        rugs = [it for it in items if it.get("asset_id") == "rug"]
        bookshelves = [it for it in items if it.get("asset_id") in ("bookshelf", "drawer_cabinet", "tv_unit")]
        sofas = [it for it in items if it.get("asset_id") == "sofa"]
        coffee_tables = [it for it in items if it.get("asset_id") in ("coffee_table", "coffee_table_art")]
        lamps = [it for it in items if it.get("asset_id") in ("floor_lamp", "lamp")]
        plants = [it for it in items if it.get("asset_id") in ("plant", "vase_flowers")]

        half_w = room_width / 2.0
        half_d = room_depth / 2.0

        # Adjust center for open_plan (living cluster on the left, kitchen on the right)
        living_center_x = round(-half_w * 0.45, 2) if shape == "open_plan" else 0.0

        # ── 1. WORKSPACE CLUSTER SOLVER ──
        if desks and not sofas and not beds:
            primary_desk = desks[0]
            desk_t = primary_desk.setdefault("transform", {})
            desk_dims = primary_desk.get("dimensions", {})
            desk_len = _safe_float(desk_dims.get("length") or desk_dims.get("width_mm", 1400) / 1000.0, 1.4)
            desk_depth = _safe_float(desk_dims.get("width") or desk_dims.get("depth_mm", 700) / 1000.0, 0.7)

            # Snap desk against back wall in standard orientation
            desk_x = round(min(max(_safe_float(desk_t.get("t_x"), 0.0), -half_w + desk_len / 2.0 + 0.4), half_w - desk_len / 2.0 - 0.4), 2)
            desk_z = round(-half_d + desk_depth / 2.0 + 0.12, 2) # Flush against back wall
            desk_t["t_x"] = desk_x
            desk_t["t_y"] = 0.0
            desk_t["t_z"] = desk_z
            desk_t["yaw_y"] = 0.0 # Facing room / camera

            # Match and position Chair to Desk
            if chairs:
                desk_chair = chairs[0]
                chair_t = desk_chair.setdefault("transform", {})
                # Ergonomic position: Centered on desk, pulled out 0.50m from desk, facing desk
                chair_t["t_x"] = desk_x
                chair_t["t_y"] = 0.0
                chair_t["t_z"] = round(desk_z + desk_depth / 2.0 + 0.45, 2)
                chair_t["yaw_y"] = 0.0 # Tucked in facing desk

            # Place Rug underneath Desk + Chair ensemble
            if rugs:
                primary_rug = rugs[0]
                rug_t = primary_rug.setdefault("transform", {})
                rug_t["t_x"] = desk_x
                rug_t["t_y"] = 0.0
                rug_t["t_z"] = round(desk_z + 0.40, 2)
                rug_t["yaw_y"] = 0.0

            # Place Bookshelf / Cabinet along Left Wall
            storage_items = [it for it in bookshelves if it.get("asset_id") in ("bookshelf", "drawer_cabinet")]
            if storage_items:
                shelf = storage_items[0]
                shelf_t = shelf.setdefault("transform", {})
                shelf_dims = shelf.get("dimensions", {})
                shelf_len = _safe_float(shelf_dims.get("length") or 1.0, 1.0)
                shelf_depth = _safe_float(shelf_dims.get("width") or 0.4, 0.4)
                # Flush against left wall (x = -half_w)
                shelf_t["t_x"] = round(-half_w + shelf_depth / 2.0 + 0.12, 2)
                shelf_t["t_y"] = 0.0
                shelf_t["t_z"] = round(min(desk_z + desk_depth + 1.2, half_d - shelf_len / 2.0 - 0.5), 2)
                shelf_t["yaw_y"] = 90.0 # Snapped flat against left wall

        # ── 2. LIVING / LOUNGE CLUSTER SOLVER ──
        elif sofas:
            primary_sofa = sofas[0]
            sofa_t = primary_sofa.setdefault("transform", {})
            sofa_dims = primary_sofa.get("dimensions", {})
            sofa_len = _safe_float(sofa_dims.get("length") or 2.2, 2.2)
            sofa_depth = _safe_float(sofa_dims.get("width") or 0.9, 0.9)

            sofa_x = living_center_x if shape == "open_plan" else round(min(max(_safe_float(sofa_t.get("t_x"), 0.0), -half_w + sofa_len / 2.0 + 0.3), half_w - sofa_len / 2.0 - 0.3), 2)
            sofa_z = round(-half_d + sofa_depth / 2.0 + 0.15, 2)
            sofa_t["t_x"] = sofa_x
            sofa_t["t_y"] = 0.0
            sofa_t["t_z"] = sofa_z
            sofa_t["yaw_y"] = 0.0

            # Coffee Table centered directly in front of Sofa (0.45m clearance)
            if coffee_tables:
                table = coffee_tables[0]
                tab_t = table.setdefault("transform", {})
                tab_dims = table.get("dimensions", {})
                tab_depth = _safe_float(tab_dims.get("width") or 0.6, 0.6)
                tab_t["t_x"] = sofa_x
                tab_t["t_y"] = 0.0
                tab_t["t_z"] = round(sofa_z + sofa_depth / 2.0 + 0.45 + tab_depth / 2.0, 2)
                tab_t["yaw_y"] = 0.0

            # Rug centered under Sofa front and Coffee Table
            if rugs:
                rug = rugs[0]
                rug_t = rug.setdefault("transform", {})
                rug_t["t_x"] = sofa_x
                rug_t["t_y"] = 0.0
                rug_t["t_z"] = round(sofa_z + 0.8, 2)
                rug_t["yaw_y"] = 0.0

            # TV Unit aligned opposite Sofa
            tv_units = [it for it in bookshelves if it.get("asset_id") == "tv_unit"]
            if tv_units:
                tv = tv_units[0]
                tv_t = tv.setdefault("transform", {})
                tv_dims = tv.get("dimensions", {})
                tv_depth = _safe_float(tv_dims.get("width") or 0.4, 0.4)
                tv_t["t_x"] = sofa_x
                tv_t["t_y"] = 0.0
                tv_t["t_z"] = round(min(sofa_z + 2.8, half_d - tv_depth / 2.0 - 0.2), 2)
                tv_t["yaw_y"] = 180.0 # Facing back towards sofa

            # Armchair placed conversational angle (90 deg)
            armchairs = [it for it in chairs if it.get("asset_id") in ("armchair", "deck_chair", "chair")]
            if armchairs:
                ac = armchairs[0]
                ac_t = ac.setdefault("transform", {})
                ac_dims = ac.get("dimensions", {})
                ac_len = _safe_float(ac_dims.get("length") or 0.85, 0.85)
                ac_t["t_x"] = round(min(sofa_x + sofa_len / 2.0 + 0.5, half_w - ac_len / 2.0 - 0.2), 2)
                ac_t["t_y"] = 0.0
                ac_t["t_z"] = round(sofa_z + 0.9, 2)
                ac_t["yaw_y"] = -90.0 # Turned towards coffee table

            # In open_plan: If there's a desk/table or dining chairs, place them in the kitchen/dining zone (+X)
            if shape == "open_plan" and desks:
                dining_table = desks[0]
                dt_t = dining_table.setdefault("transform", {})
                dt_t["t_x"] = round(half_w * 0.5, 2)
                dt_t["t_y"] = 0.0
                dt_t["t_z"] = round(-half_d * 0.2, 2)
                dt_t["yaw_y"] = 90.0

        # ── 3. BEDROOM CLUSTER SOLVER ──
        elif beds:
            primary_bed = beds[0]
            bed_t = primary_bed.setdefault("transform", {})
            bed_dims = primary_bed.get("dimensions", {})
            bed_len = _safe_float(bed_dims.get("length") or 2.1, 2.1)
            bed_depth = _safe_float(bed_dims.get("width") or 1.8, 1.8)

            bed_x = 0.0
            bed_z = round(-half_d + bed_len / 2.0 + 0.12, 2)
            bed_t["t_x"] = bed_x
            bed_t["t_y"] = 0.0
            bed_t["t_z"] = bed_z
            bed_t["yaw_y"] = 0.0

            if bookshelves:
                nightstand = bookshelves[0]
                ns_t = nightstand.setdefault("transform", {})
                ns_t["t_x"] = round(bed_x + bed_depth / 2.0 + 0.45, 2)
                ns_t["t_y"] = 0.0
                ns_t["t_z"] = bed_z
                ns_t["yaw_y"] = 0.0

            if rugs:
                rug = rugs[0]
                rug_t = rug.setdefault("transform", {})
                rug_t["t_x"] = bed_x
                rug_t["t_y"] = 0.0
                rug_t["t_z"] = round(bed_z + 0.7, 2)
                rug_t["yaw_y"] = 0.0

        # ── 3. AMBIENT & ACCESSORY ANCHORING ──
        if lamps:
            lamp = lamps[0]
            l_t = lamp.setdefault("transform", {})
            # Place lamp in back-left or front-left architectural corner
            l_t["t_x"] = round(-half_w + 0.45, 2)
            l_t["t_y"] = 0.0
            l_t["t_z"] = round(half_d - 0.45, 2)
            l_t["yaw_y"] = 0.0

        if plants:
            plant = plants[0]
            p_t = plant.setdefault("transform", {})
            # Place plant near back-left corner (near window / light)
            p_t["t_x"] = round(-half_w + 0.45, 2)
            p_t["t_y"] = 0.0
            p_t["t_z"] = round(-half_d + 0.65, 2)
            p_t["yaw_y"] = 0.0

        # ── 4. MULTI-ZONE / CORRIDOR ADJUSTMENT ──
        if shape == "corridor_room":
            # In corridor_room, items are kept within the main room section
            # and the corridor strip (e.g. rightmost or southernmost area) is kept clear
            clear_corridor_min_x = half_w - 1.4
            for it in items:
                t = it.get("transform", {})
                if _safe_float(t.get("t_x")) > clear_corridor_min_x and it.get("asset_id") not in ("rug", "floor_lamp"):
                    t["t_x"] = round(clear_corridor_min_x - 0.4, 2)

        # ── 5. STRICT BOUNDARY & FLOAT CLAMPING ──
        for it in items:
            t = it.setdefault("transform", {})
            t["t_y"] = 0.0 # Never float or sink
            t["t_x"] = round(min(max(_safe_float(t.get("t_x")), -half_w + 0.2), half_w - 0.2), 2)
            t["t_z"] = round(min(max(_safe_float(t.get("t_z")), -half_d + 0.2), half_d - 0.2), 2)

        return items

    @classmethod
    def solve_incremental_placement(
        cls,
        new_asset_id: str,
        new_dims: Dict[str, Any],
        existing_items: List[Dict[str, Any]],
        room_width: float = 5.0,
        room_depth: float = 5.0,
        windows: Optional[List[Dict[str, Any]]] = None,
        anchor_hint: Optional[str] = None
    ) -> Dict[str, float]:
        """
        Determines a strict-snap, non-colliding (x, y, z, yaw) coordinate for a newly added
        furniture item without displacing any existing items.
        """
        half_w = float(room_width) / 2.0
        half_d = float(room_depth) / 2.0

        # Helper to convert dimensions to meters
        def _get_axis_m(dims: Dict[str, Any], key: str, fallback_m: float) -> float:
            val = dims.get(key)
            if val is None and key == "width":
                val = dims.get("width_mm")
            elif val is None and key == "depth":
                val = dims.get("depth_mm")
            elif val is None and key == "height":
                val = dims.get("height_mm")
            val_f = _safe_float(val, fallback_m)
            if val_f > 20.0:  # in mm
                val_f /= 1000.0
            return max(0.2, val_f) if val_f > 0 else fallback_m

        item_len = _get_axis_m(new_dims, "width", 1.0)   # X span
        item_depth = _get_axis_m(new_dims, "depth", 0.6) # Z depth
        item_height = _get_axis_m(new_dims, "height", 0.8)

        # Build 2D bounding boxes (X, Z) of all existing solid items
        clearance_padding = 0.15
        existing_boxes = []
        for obj in existing_items:
            # Rugs do not cause physical collision on the floor
            if obj.get("asset_id") == "rug":
                continue
            pos = obj.get("position")
            if not pos and "transform" in obj:
                t = obj["transform"]
                pos = [_safe_float(t.get("t_x")), _safe_float(t.get("t_y")), _safe_float(t.get("t_z"))]
            if not pos or len(pos) < 3:
                continue

            o_dims = obj.get("dimensions", {})
            o_len = _get_axis_m(o_dims, "width", 0.8)
            o_depth = _get_axis_m(o_dims, "depth", 0.8)

            existing_boxes.append({
                "min_x": pos[0] - (o_len / 2.0) - clearance_padding,
                "max_x": pos[0] + (o_len / 2.0) + clearance_padding,
                "min_z": pos[2] - (o_depth / 2.0) - clearance_padding,
                "max_z": pos[2] + (o_depth / 2.0) + clearance_padding,
            })

        def _is_colliding(cand_min_x: float, cand_max_x: float, cand_min_z: float, cand_max_z: float) -> bool:
            for b in existing_boxes:
                if not (cand_max_x <= b["min_x"] or cand_min_x >= b["max_x"] or
                        cand_max_z <= b["min_z"] or cand_min_z >= b["max_z"]):
                    return True
            return False

        # Identify window locations for anchor resolution
        window_points = []
        if windows:
            for w in windows:
                w_wall = w.get("wall", "back")
                w_offset = _safe_float(w.get("positionOffset"), 0.0)
                if w_wall == "back":
                    window_points.append({"wall": "back", "x": w_offset * (half_w * 0.7), "z": -half_d})
                elif w_wall == "left":
                    window_points.append({"wall": "left", "x": -half_w, "z": w_offset * (half_d * 0.7)})

        # Formulate candidate walls and coordinate generators
        anchor = (anchor_hint or "").lower()
        prefer_window = "window" in anchor or "نافذة" in anchor or "شباك" in anchor
        prefer_left = "left" in anchor or "يسار" in anchor
        prefer_right = "right" in anchor or "يمين" in anchor

        candidate_positions = []

        # 1. Back Wall candidates (Flush to back wall, facing forward, yaw=0)
        # item along X, depth along Z
        z_back = -half_d + (item_depth / 2.0) + 0.10
        min_x = -half_w + (item_len / 2.0) + 0.25
        max_x = half_w - (item_len / 2.0) - 0.25
        step_x = 0.25
        cur_x = min_x
        while cur_x <= max_x:
            cand_min_x = cur_x - (item_len / 2.0)
            cand_max_x = cur_x + (item_len / 2.0)
            cand_min_z = z_back - (item_depth / 2.0)
            cand_max_z = z_back + (item_depth / 2.0)
            if not _is_colliding(cand_min_x, cand_max_x, cand_min_z, cand_max_z):
                # Calculate penalty distance from anchor
                dist_penalty = 0.0
                if prefer_window and window_points:
                    dist_penalty = min(abs(cur_x - wp["x"]) for wp in window_points if wp["wall"] == "back") if any(wp["wall"] == "back" for wp in window_points) else 10.0
                elif prefer_left:
                    dist_penalty = abs(cur_x - (-half_w))
                elif prefer_right:
                    dist_penalty = abs(cur_x - half_w)

                priority = 10.0 + dist_penalty
                if prefer_window and any(wp["wall"] == "back" for wp in window_points):
                    priority = dist_penalty
                candidate_positions.append({
                    "t_x": cur_x,
                    "t_y": 0.0,
                    "t_z": z_back,
                    "yaw_y": 0.0,
                    "priority": priority
                })
            cur_x += step_x

        # 2. Left Wall candidates (Flush to left wall, facing room right, yaw=90)
        # item along Z, depth along X
        x_left = -half_w + (item_depth / 2.0) + 0.10
        min_z = -half_d + (item_len / 2.0) + 0.25
        max_z = half_d - (item_len / 2.0) - 0.25
        step_z = 0.25
        cur_z = min_z
        while cur_z <= max_z:
            cand_min_x = x_left - (item_depth / 2.0)
            cand_max_x = x_left + (item_depth / 2.0)
            cand_min_z = cur_z - (item_len / 2.0)
            cand_max_z = cur_z + (item_len / 2.0)
            if not _is_colliding(cand_min_x, cand_max_x, cand_min_z, cand_max_z):
                dist_penalty = 0.0
                if prefer_window and window_points:
                    dist_penalty = min(abs(cur_z - wp["z"]) for wp in window_points if wp["wall"] == "left") if any(wp["wall"] == "left" for wp in window_points) else 10.0
                elif prefer_left:
                    dist_penalty = 0.5
                elif prefer_right:
                    dist_penalty = 15.0

                priority = 12.0 + dist_penalty
                if prefer_left or (prefer_window and any(wp["wall"] == "left" for wp in window_points)):
                    priority = dist_penalty
                candidate_positions.append({
                    "t_x": x_left,
                    "t_y": 0.0,
                    "t_z": cur_z,
                    "yaw_y": 90.0,
                    "priority": priority
                })
            cur_z += step_z

        # 3. Right Wall candidates (Flush to right wall, facing room left, yaw=-90)
        x_right = half_w - (item_depth / 2.0) - 0.10
        cur_z = min_z
        while cur_z <= max_z:
            cand_min_x = x_right - (item_depth / 2.0)
            cand_max_x = x_right + (item_depth / 2.0)
            cand_min_z = cur_z - (item_len / 2.0)
            cand_max_z = cur_z + (item_len / 2.0)
            if not _is_colliding(cand_min_x, cand_max_x, cand_min_z, cand_max_z):
                dist_penalty = 0.0
                if prefer_right:
                    dist_penalty = 0.5
                else:
                    dist_penalty = 5.0
                candidate_positions.append({
                    "t_x": x_right,
                    "t_y": 0.0,
                    "t_z": cur_z,
                    "yaw_y": -90.0,
                    "priority": 14.0 + dist_penalty
                })
            cur_z += step_z

        # Sort candidate positions by priority (lowest penalty first)
        if candidate_positions:
            candidate_positions.sort(key=lambda c: c["priority"])
            best = candidate_positions[0]
            return {
                "t_x": round(best["t_x"], 2),
                "t_y": 0.0,
                "t_z": round(best["t_z"], 2),
                "yaw_y": round(best["yaw_y"], 1),
            }

        # Fallback if room is heavily congested: clamp safe spot near room perimeter
        return {
            "t_x": round(min(max(-half_w + 1.0, 0.0), half_w - 1.0), 2),
            "t_y": 0.0,
            "t_z": round(min(max(-half_d + 1.0, 0.0), half_d - 1.0), 2),
            "yaw_y": 0.0,
        }

    @classmethod
    def auto_correct_violations(
        cls,
        objects: List[Dict[str, Any]],
        room_width: float,
        room_depth: float,
        violations: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Closed-loop self-correction engine:
        Takes a generated room layout and automatically fixes any architectural/Neufert/SBC violations:
        1. Resolves 2D AABB overlaps between solid items via minimum-translation separation.
        2. Normalizes coffee-table to sofa edge-to-edge distance into the optimal [0.35m - 0.45m] zone.
        3. Enforces TV unit viewing distance >= 2.0m from seating.
        4. Guarantees primary circulation walkway (>= 0.90m) along room axes.
        5. Clamps all furniture within room boundaries and floor (t_y = 0.0).
        """
        if not objects:
            return objects

        items = [dict(obj) for obj in objects]
        half_w = room_width / 2.0
        half_d = room_depth / 2.0

        def _get_item_dims(it):
            dims = it.get("dimensions") or {}
            l = _safe_float(dims.get("length") or dims.get("width_mm", 1000) / 1000.0, 1.0)
            w = _safe_float(dims.get("width") or dims.get("depth_mm", 800) / 1000.0, 0.8)
            return l, w

        sofas = [it for it in items if it.get("asset_id") == "sofa"]
        coffee_tables = [it for it in items if it.get("asset_id") in ("coffee_table", "coffee_table_art")]
        tv_units = [it for it in items if it.get("asset_id") == "tv_unit"]

        # 1. Correct Coffee Table -> Sofa Clearance (0.35m - 0.45m)
        if sofas and coffee_tables:
            s_item = sofas[0]
            c_item = coffee_tables[0]
            st = s_item.setdefault("transform", {})
            ct = c_item.setdefault("transform", {})
            sl, sw = _get_item_dims(s_item)
            cl, cw = _get_item_dims(c_item)

            sofa_x = _safe_float(st.get("t_x"), 0.0)
            sofa_z = _safe_float(st.get("t_z"), -half_d + sw / 2.0 + 0.15)
            ct["t_x"] = sofa_x
            ct["t_y"] = 0.0
            ct["t_z"] = round(sofa_z + (sw / 2.0) + 0.40 + (cw / 2.0), 2)
            ct["yaw_y"] = 0.0

        # 2. Correct TV Unit Viewing Distance (>= 2.0m)
        if sofas and tv_units:
            s_item = sofas[0]
            tv_item = tv_units[0]
            st = s_item.setdefault("transform", {})
            tt = tv_item.setdefault("transform", {})
            _, sw = _get_item_dims(s_item)
            _, tw = _get_item_dims(tv_item)

            sofa_x = _safe_float(st.get("t_x"), 0.0)
            sofa_z = _safe_float(st.get("t_z"), -half_d + sw / 2.0 + 0.15)

            current_dist = abs(_safe_float(tt.get("t_z")) - sofa_z)
            if current_dist < 2.0:
                target_z = min(sofa_z + 2.6, half_d - tw / 2.0 - 0.20)
                tt["t_x"] = sofa_x
                tt["t_y"] = 0.0
                tt["t_z"] = round(target_z, 2)
                tt["yaw_y"] = 180.0

        # 3. Resolve Solid Obstacle AABB Collisions
        solid_items = [
            it for it in items
            if it.get("asset_id") not in ("rug", "carpet") and it.get("type") == "furniture"
        ]

        for _ in range(3):
            any_overlap = False
            for i in range(len(solid_items)):
                for j in range(i + 1, len(solid_items)):
                    a = solid_items[i]
                    b = solid_items[j]
                    ta = a.setdefault("transform", {})
                    tb = b.setdefault("transform", {})
                    la, wa = _get_item_dims(a)
                    lb, wb = _get_item_dims(b)

                    ax, az = _safe_float(ta.get("t_x")), _safe_float(ta.get("t_z"))
                    bx, bz = _safe_float(tb.get("t_x")), _safe_float(tb.get("t_z"))

                    min_xa, max_xa = ax - la / 2.0, ax + la / 2.0
                    min_za, max_za = az - wa / 2.0, az + wa / 2.0
                    min_xb, max_xb = bx - lb / 2.0, bx + lb / 2.0
                    min_zb, max_zb = bz - wb / 2.0, bz + wb / 2.0

                    overlap_x = min(max_xa, max_xb) - max(min_xa, min_xb)
                    overlap_z = min(max_za, max_zb) - max(min_za, min_zb)

                    if overlap_x > 0.04 and overlap_z > 0.04:
                        any_overlap = True
                        if overlap_x < overlap_z:
                            push = (overlap_x + 0.10) / 2.0
                            if bx > ax:
                                tb["t_x"] = round(bx + push, 2)
                                ta["t_x"] = round(ax - push, 2)
                            else:
                                tb["t_x"] = round(bx - push, 2)
                                ta["t_x"] = round(ax + push, 2)
                        else:
                            push = (overlap_z + 0.10) / 2.0
                            if bz > az:
                                tb["t_z"] = round(bz + push, 2)
                                ta["t_z"] = round(az - push, 2)
                            else:
                                tb["t_z"] = round(bz - push, 2)
                                ta["t_z"] = round(az + push, 2)
            if not any_overlap:
                break

        # 4. Enforce Primary Walkway Clearance (SBC & Neufert >= 0.90m)
        walkway_boundary_z = half_d - 0.90
        for it in solid_items:
            t = it.setdefault("transform", {})
            _, w_dim = _get_item_dims(it)
            item_front_z = _safe_float(t.get("t_z")) + (w_dim / 2.0)
            if item_front_z > walkway_boundary_z:
                t["t_z"] = round(walkway_boundary_z - (w_dim / 2.0) - 0.05, 2)

        # 5. Strict room boundary & floor clamp
        for it in items:
            t = it.setdefault("transform", {})
            l_dim, w_dim = _get_item_dims(it)
            t["t_y"] = 0.0
            t["t_x"] = round(min(max(_safe_float(t.get("t_x")), -half_w + (l_dim / 2.0) + 0.1), half_w - (l_dim / 2.0) - 0.1), 2)
            t["t_z"] = round(min(max(_safe_float(t.get("t_z")), -half_d + (w_dim / 2.0) + 0.1), half_d - (w_dim / 2.0) - 0.1), 2)

        return items
