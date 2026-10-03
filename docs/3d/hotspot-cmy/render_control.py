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

cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_d); scene.collection.objects.link(cam); scene.camera = cam
def shot(name, target, dist, az_deg, el_deg, lens):
    az, el = math.radians(az_deg), math.radians(el_deg)
    loc = Vector(target) + Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el))) * dist
    cam.location = loc; cam_d.lens = lens
    cam.rotation_euler = (Vector(target) - loc).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = os.path.join(out, name + suffix + ".png")
    bpy.ops.render.render(write_still=True)
    print("[render]", scene.render.filepath)

for v in views:
    if v == "frente":       shot("frente", (0, 0, 0.40), 2.1, 0, 3, 70)
    if v == "tres_cuartos": shot("tres_cuartos", (0, 0, 0.40), 2.2, 38, 10, 70)
    if v == "disipador":    shot("disipador", (0.0, 0.0, 0.39), 0.95, 24, 14, 85)
    if v == "optica":
        pv = math.radians(-30); tgt = (0, 0.5 * 0.0 + 0.0, 0)
        import mathutils
        pm = mathutils.Matrix.Translation((0, 0, 0.515)) @ mathutils.Matrix.Rotation(pv, 4, "X")
        shot("optica", tuple(pm @ Vector((0, -0.03, 0.07))), 0.8, 20, 25, 85)
    if v == "lente":
        import mathutils
        pm = mathutils.Matrix.Translation((0, 0, 0.515)) @ mathutils.Matrix.Rotation(math.radians(-30), 4, "X")
        shot("lente", tuple(pm @ Vector((0, 0, 0.24))), 0.6, 165, 52, 70)
    if v == "lateral":      shot("lateral", (0, 0, 0.40), 2.2, 90, 4, 70)
    if v == "trasera":      shot("trasera", (0, 0, 0.40), 2.2, 160, 12, 70)
