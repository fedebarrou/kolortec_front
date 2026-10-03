"""Renders de control del HOT SPOT CMY (Cycles, GPU).
Uso: blender -b --factory-startup hotspot-cmy.blend -P render_control.py -- --views frente,tres_cuartos,disipador --out renders [--res 1200 1600] [--samples 128]
Abre el .blend propio (sin autoexec de nada ajeno), agrega fondo/luces/camaras SOLO en memoria y NO guarda el .blend.
"""
import bpy, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(k, d):
    return argv[argv.index(k) + 1] if k in argv else d
views = arg("--views", "frente,tres_cuartos,disipador").split(",")
out = arg("--out", "renders")
W = int(arg("--res", "1200")); Hh = int(argv[argv.index("--res") + 2]) if "--res" in argv else 1600
samples = int(arg("--samples", "128"))
hide_cover = "--sin-tapa-izq" in argv
suffix = arg("--suffix", "")

scene = bpy.context.scene
# --- GPU
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"; prefs.get_devices()
for d in prefs.devices:
    d.use = (d.type == "OPTIX")
    print("[dev]", d.name, d.type, d.use)
scene.render.engine = "CYCLES"; scene.cycles.device = "GPU"
scene.cycles.samples = samples; scene.cycles.use_denoising = True
scene.render.resolution_x = W; scene.render.resolution_y = Hh; scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "AgX"; scene.view_settings.exposure = -0.4  # igual que v1 para comparar
scene.render.image_settings.file_format = "PNG"

# --- mundo gris neutro + piso
w = bpy.data.worlds.new("w"); scene.world = w; w.use_nodes = True
bg = w.node_tree.nodes["Background"]; bg.inputs[0].default_value = (0.5, 0.5, 0.51, 1); bg.inputs[1].default_value = 0.55
mat = bpy.data.materials.new("piso"); mat.use_nodes = True
b = mat.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (0.30, 0.30, 0.31, 1); b.inputs["Roughness"].default_value = 0.65
bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0)); fl = bpy.context.object; fl.name = "piso_render"; fl.data.materials.append(mat)

def light(name, loc, target, energy, size):
    ld = bpy.data.lights.new(name, "AREA"); ld.energy = energy; ld.size = size; ld.shape = "RECTANGLE"; ld.size_y = size
    lo = bpy.data.objects.new(name, ld); scene.collection.objects.link(lo); lo.location = loc
    d = Vector(target) - Vector(loc); lo.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
light("key", (-1.6, -2.0, 2.0), (0, 0, 0.4), 260, 1.6)
light("fill", (2.2, -1.6, 0.9), (0, 0, 0.4), 120, 2.2)
light("rim", (0.6, 2.0, 1.6), (0, 0, 0.45), 220, 1.2)
light("top", (0, -0.2, 2.4), (0, 0, 0.3), 90, 1.8)

if hide_cover:
    for o in bpy.data.objects:
        if o.name == "yugo": pass

import json, mathutils
jpg = "--jpg" in argv
if jpg:
    scene.render.image_settings.file_format = "JPEG"; scene.render.image_settings.quality = 92
pivot = bpy.data.objects["cabezal_pivot"]
piezas = json.load(open(os.path.join(os.path.dirname(bpy.data.filepath), "piezas.json"), encoding="utf-8"))
base_loc = {o.name: o.location.copy() for o in bpy.data.objects}

def estado(abierto, tilt_deg):
    """pose del cabezal + tapas (orden 1 y 2 del despiece) cerradas o separadas."""
    pivot.rotation_euler = (math.radians(tilt_deg), 0, 0)
    for n, l in base_loc.items(): bpy.data.objects[n].location = l
    bpy.context.view_layer.update()
    if not abierto: return
    for pz in piezas:
        d = pz.get("despiece") or {}
        if d.get("orden") in (1, 2):
            gx, gy, gz = d["direccion"]; v = Vector((gx, -gz, gy)) * d["distancia"]   # GLB (x,y,z) -> Blender (x,-z,y)
            ob = bpy.data.objects[pz["nombre_objeto"]]
            if ob.parent is not None: v = ob.parent.matrix_world.to_3x3().inverted() @ v
            ob.location = base_loc[ob.name] + v
    bpy.context.view_layer.update()

cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_d); scene.collection.objects.link(cam); scene.camera = cam
def shot(name, target, dist, az_deg, el_deg, lens):
    az, el = math.radians(az_deg), math.radians(el_deg)
    loc = Vector(target) + Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el))) * dist
    cam.location = loc; cam_d.lens = lens
    cam.rotation_euler = (Vector(target) - loc).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = os.path.join(out, name + suffix + (".jpg" if jpg else ".png"))
    bpy.ops.render.render(write_still=True)
    print("[render]", scene.render.filepath)

def head(p): return tuple(pivot.matrix_world @ Vector(p))

for v in views:
    if v == "cerrado_frente": estado(False, 22);  shot("cerrado_frente", (0, 0, 0.42), 2.1, 0, 3, 70)
    if v == "cerrado_34":     estado(False, -30); shot("cerrado_34", (0, 0, 0.40), 2.2, -50, 10, 70)
    if v == "cerrado_34_der": estado(False, -30); shot("cerrado_34_der", (0, 0, 0.40), 2.2, 50, 10, 70)
    if v == "abierto_34":     estado(True, -30);  shot("abierto_34", (0, 0, 0.42), 3.3, 38, 12, 70)
    # --- chequeo de textos (se tienen que leer de izquierda a derecha, sin espejo)
    if v == "txt_izq":   estado(False, -30); shot("txt_izq", (-0.185, 0, 0.44), 0.7, -90, 0, 70)
    if v == "txt_der":   estado(False, -30); shot("txt_der", (0.185, 0, 0.44), 0.7, 90, 0, 70)
    if v == "txt_label": estado(False, -30); shot("txt_label", (0.055, -0.124, 0.1625), 0.32, 0, 38, 70)
    if v == "txt_logo":  estado(False, -30); shot("txt_logo", (0, -0.0655, 0.2385), 0.35, 0, 0, 70)
    if v == "txt_panel": estado(False, -30); shot("txt_panel", (0, -0.15, 0.088), 0.42, 0, 4, 70)
    if v == "txt_trasera": estado(False, -30); shot("txt_trasera", (0, 0.1, 0.42), 1.4, 180, 8, 70)
    if v == "det_boca":     estado(False, -30); shot("det_boca", head((0, 0, 0.24)), 0.6, 165, 52, 70)
    if v == "det_rejilla": estado(False, -30); shot("det_rejilla", head((0, 0.15, -0.13)), 0.5, 180, 12, 70)
    if v == "det_lado":    estado(False, -30); shot("det_lado", head((-0.09, -0.12, 0.05)), 0.75, -40, 8, 70)
    if v == "det_yugo":    estado(False, -30); shot("det_yugo", (-0.1, -0.06, 0.27), 0.55, -35, 12, 70)
    # --- vistas de detalle (modelo abierto, sin tapas)
    if v == "frente":       estado(True, -30); shot("frente", (0, 0, 0.40), 2.1, 0, 3, 70)
    if v == "tres_cuartos": estado(True, -30); shot("tres_cuartos", (0, 0, 0.40), 2.2, 38, 10, 70)
    if v == "disipador":    estado(True, -30); shot("disipador", (0.0, 0.0, 0.39), 0.95, 24, 14, 85)
    if v == "lateral":      estado(True, -30); shot("lateral", (0, 0, 0.40), 2.2, 90, 4, 70)
