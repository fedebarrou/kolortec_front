"""KOLORTEC HOT SPOT CMY - modelo 3D hard-surface, headless.

Uso:
  blender -b --factory-startup -P build_hotspot.py -- [--glb RUTA_GLB_CRUDO]

Genera:
  hotspot-cmy.blend      (fuente)
  <glb crudo>            (Blender: Draco + WebP). Despues se optimiza/valida aparte.
  piezas.json            (centro/radio por pieza, coordenadas del GLB, Y arriba)
Unidades: metros. Blender Z arriba, frente del equipo hacia -Y (panel LCD).
El GLB sale con el frente hacia +Z (convencion glTF, la camara por defecto lo ve de frente).
Todo se reconstruye desde este script. Fotos de referencia: ver SOURCES.md.
"""
import bpy, bmesh, math, json, os, sys
import numpy as np
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
TEXSRC = os.path.join(HERE, "tex_src")
TEXGEN = os.path.join(HERE, "tex_gen")
os.makedirs(TEXGEN, exist_ok=True)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
GLB_OUT = argv[argv.index("--glb") + 1] if "--glb" in argv else os.path.join(HERE, "hotspot-cmy.raw.glb")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
coll = scene.collection

# ---------------------------------------------------------------- utilidades
def T(x, y, z): return Matrix.Translation((x, y, z))
def Rx(a): return Matrix.Rotation(a, 4, 'X')
def Ry(a): return Matrix.Rotation(a, 4, 'Y')
def Rz(a): return Matrix.Rotation(a, 4, 'Z')
# perfil (u,v) -> plano YZ del mundo (u=y, v=z), extrusion a lo largo de X
M_YZ = Matrix(((0, 0, 1, 0), (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
# perfil (u,v) -> plano XZ del mundo (u=x, v=z), extrusion a lo largo de -Y
M_XZ = Rx(math.pi / 2)

def hx(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)

# ---------------------------------------------------------------- texturas de grano (normal maps tileables)
def _blur(a, k, axis):
    out = a.copy()
    for s in range(1, k + 1):
        out += np.roll(a, s, axis) + np.roll(a, -s, axis)
    return out / (2 * k + 1)

def make_normal(name, seed, kx, ky, amp):
    p = os.path.join(TEXGEN, name + ".png")
    n = 256
    rng = np.random.default_rng(seed)
    h = rng.random((n, n)).astype(np.float32)
    if kx: h = _blur(h, kx, 1)
    if ky: h = _blur(h, ky, 0)
    h = (h - h.mean()) / (h.std() + 1e-6)
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * amp
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * amp
    nz = np.ones_like(gx)
    ln = np.sqrt(gx * gx + gy * gy + nz * nz)
    rgb = np.dstack((-gx / ln, -gy / ln, nz / ln)) * 0.5 + 0.5
    rgba = np.dstack((rgb, np.ones((n, n), np.float32))).astype(np.float32)
    img = bpy.data.images.new(name, n, n, alpha=False)
    img.pixels.foreach_set(rgba.ravel())
    img.filepath_raw = p; img.file_format = 'PNG'
    for intento in range(6):   # Windows a veces bloquea el PNG un instante (antivirus/visor)
        try:
            img.save(); break
        except RuntimeError:
            import time; time.sleep(0.6)
    else:
        img.pack()
    img.colorspace_settings.name = 'Non-Color'
    return img

IMG_GRAIN = make_normal("grano_pintura", 11, 0, 0, 0.35)       # polvo/pintura epoxi negra, grano fino
IMG_BRUSH = make_normal("aluminio_cepillado", 5, 22, 0, 0.55)   # estrias en una direccion
def make_rough(name, seed, lo, hi, k=3):
    p = os.path.join(TEXGEN, name + ".png"); n = 256
    rng = np.random.default_rng(seed)
    h = _blur(_blur(rng.random((n, n)).astype(np.float32), k, 0), k, 1)
    h = (h - h.min()) / (h.max() - h.min() + 1e-6)
    r = lo + (hi - lo) * h
    rgba = np.dstack((r, r, r, np.ones_like(r))).astype(np.float32)
    img = bpy.data.images.new(name, n, n, alpha=False)
    img.pixels.foreach_set(rgba.ravel())
    img.filepath_raw = p; img.file_format = 'PNG'
    for intento in range(6):
        try:
            img.save(); break
        except RuntimeError:
            import time; time.sleep(0.6)
    else:
        img.pack()
    img.colorspace_settings.name = 'Non-Color'
    return img

IMG_PLAST = make_normal("plastico_carcasa", 7, 1, 1, 0.22)      # carcasa texturada, grano suave
IMG_R_PLAST = make_rough("rugosidad_plastico", 21, 0.5, 0.82, 2)   # rugosidad variable (manchas de uso)
IMG_R_METAL = make_rough("rugosidad_metal", 33, 0.34, 0.66, 3)

# ---------------------------------------------------------------- materiales
MATS = {}
def mkmat(name, color, metal=0.0, rough=0.5, alpha=None, tex=None, normal=None, nstr=0.8, emit=None, rough_img=None, spec=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    if spec is not None: b.inputs['Specular IOR Level'].default_value = spec
    if rough_img is not None:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = rough_img
        sp = nt.nodes.new('ShaderNodeSeparateColor')
        nt.links.new(t.outputs['Color'], sp.inputs['Color']); nt.links.new(sp.outputs['Green'], b.inputs['Roughness'])
    if emit:
        b.inputs['Emission Color'].default_value = (*emit[0], 1); b.inputs['Emission Strength'].default_value = emit[1]
    if tex:
        img = bpy.data.images.load(os.path.join(TEXSRC, tex))
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if tex.endswith("logo.png") or tex.startswith("sticker"):
            nt.links.new(t.outputs['Alpha'], b.inputs['Alpha']); alpha = 1.0
    if normal is not None:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = normal
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = nstr
        nt.links.new(t.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if alpha is not None:
        if not (tex and (tex.endswith("logo.png") or tex.startswith("sticker"))):
            b.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND'; m.surface_render_method = 'BLENDED'
    MATS[name] = m
    return m

mkmat("carcasa_plastico", (0.028, 0.028, 0.03), 0.0, 0.6, normal=IMG_PLAST, nstr=0.7, rough_img=IMG_R_PLAST, spec=0.3)
mkmat("metal_negro", (0.02, 0.02, 0.022), 0.5, 0.5, normal=IMG_GRAIN, nstr=0.9, rough_img=IMG_R_METAL, spec=0.4)
mkmat("goma_negra", (0.018, 0.018, 0.018), 0.0, 0.8, normal=IMG_GRAIN, nstr=0.5, rough_img=IMG_R_PLAST, spec=0.25)
mkmat("aluminio_cepillado", hx('#c4c6c9'), 1.0, 0.36, normal=IMG_BRUSH, nstr=0.9)
mkmat("aluminio_aletas", hx('#b7babd'), 1.0, 0.30)
mkmat("cobre", hx('#d9824f'), 1.0, 0.24)
mkmat("laton", hx('#c9a24a'), 1.0, 0.30)
mkmat("acero_zincado", hx('#8c8f92'), 0.9, 0.38, normal=IMG_BRUSH, nstr=0.5)
mkmat("vidrio_lente", hx('#0f3a38'), 0.0, 0.03, alpha=0.45)
mkmat("vidrio_c", hx('#1aa7c9'), 0.0, 0.05, alpha=0.5)
mkmat("vidrio_m", hx('#c4287f'), 0.0, 0.05, alpha=0.5)
mkmat("vidrio_y", hx('#e3d319'), 0.0, 0.05, alpha=0.5)
mkmat("vidrio_gobo", hx('#7fb9c4'), 0.0, 0.05, alpha=0.55)
mkmat("lcd_vidrio", hx('#060809'), 0.0, 0.08)
mkmat("pcb_verde", hx('#0c5a24'), 0.0, 0.5)
mkmat("conector_blanco", hx('#d9d6cc'), 0.0, 0.5)
mkmat("cable_rojo", hx('#b3121a'), 0.0, 0.5)
mkmat("cable_negro", hx('#0b0b0b'), 0.0, 0.5)
mkmat("manga_gris", hx('#55585b'), 0.0, 0.6)
mkmat("decal_panel", (1, 1, 1), 0.0, 0.45, tex="panel_front.png")
mkmat("decal_etiqueta", (1, 1, 1), 0.0, 0.4, tex="label_top.png")
mkmat("decal_logo", (1, 1, 1), 0.0, 0.5, tex="yoke_logo.png")
mkmat("decal_sticker", (1, 1, 1), 0.0, 0.35, tex="sticker_side.png")
mkmat("plastico_liso", (0.02, 0.02, 0.021), 0.0, 0.7, normal=IMG_PLAST, nstr=0.25, spec=0.3)
mkmat("ranura_negra", hx('#050505'), 0.0, 0.8)
mkmat("correa", hx('#26262a'), 0.0, 0.6, normal=IMG_GRAIN, nstr=0.6)

# ---------------------------------------------------------------- constructor de piezas
class Part:
    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new("UVMap")
        self.mats = []
        self.decal = set()

    def _mi(self, mat):
        if mat not in self.mats: self.mats.append(mat)
        return self.mats.index(mat)

    def _tag(self, before, mat, bevel=0.0, bseg=2):
        bm = self.bm
        new = [f for f in bm.faces if f not in before]
        if bevel:
            edges = list({e for f in new for e in f.edges})
            bmesh.ops.bevel(bm, geom=edges, offset=bevel, offset_type='OFFSET', profile=0.5,
                            segments=bseg, affect='EDGES')
            new = [f for f in bm.faces if f not in before]
        i = self._mi(mat)
        for f in new: f.material_index = i
        return new

    def box(self, size, m, mat, bevel=0.0, bseg=2):
        before = set(self.bm.faces)
        mm = m @ Matrix.Diagonal((size[0], size[1], size[2], 1))
        bmesh.ops.create_cube(self.bm, size=1.0, matrix=mm)
        return self._tag(before, mat, bevel, bseg)

    def cyl(self, r, depth, m, mat, seg=24, r2=None, bevel=0.0):
        before = set(self.bm.faces)
        bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r,
                              radius2=(r if r2 is None else r2), depth=depth, matrix=m)
        return self._tag(before, mat, bevel)

    def poly(self, pts, depth, m, mat, bevel=0.0, bseg=2):
        """prisma: poligono (x,y) extruido en z in [-d/2, d/2], luego matriz m."""
        bm = self.bm; before = set(bm.faces); n = len(pts)
        b = [bm.verts.new(m @ Vector((x, y, -depth / 2))) for x, y in pts]
        t = [bm.verts.new(m @ Vector((x, y, depth / 2))) for x, y in pts]
        bm.faces.new(b[::-1]); bm.faces.new(t)
        for i in range(n):
            bm.faces.new((b[i], b[(i + 1) % n], t[(i + 1) % n], t[i]))
        new = [f for f in bm.faces if f not in before]
        bmesh.ops.recalc_face_normals(bm, faces=new)
        return self._tag(before, mat, bevel, bseg)

    def spin(self, prof, m, mat, seg=40):
        """revolucion: perfil CERRADO [(r,z)...] alrededor de Z, luego matriz m."""
        bm = self.bm; before = set(bm.faces)
        vs = [bm.verts.new((r, 0, z)) for r, z in prof]
        es = [bm.edges.new((vs[i], vs[(i + 1) % len(vs)])) for i in range(len(vs))]
        ret = bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), dvec=(0, 0, 0),
                             angle=2 * math.pi, steps=seg, use_merge=True, use_duplicate=False)
        # transformar todo lo creado
        newv = {v for f in bm.faces if f not in before for v in f.verts} | set(vs)
        bmesh.ops.transform(bm, matrix=m, verts=list(newv))
        bmesh.ops.remove_doubles(bm, verts=list(newv), dist=1e-6)
        newf = [f for f in bm.faces if f not in before and f.is_valid]
        bmesh.ops.recalc_face_normals(bm, faces=newf)
        return self._tag(before, mat)

    def tube(self, pts, r, mat, seg=6, closed=False, caps=True):
        bm = self.bm; before = set(bm.faces)
        pts = [Vector(p) for p in pts]; n = len(pts); rings = []; pn = None
        for i, p in enumerate(pts):
            t = (pts[(i + 1) % n] - pts[i - 1]) if closed else (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)])
            t.normalize()
            if pn is None:
                ref = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
                nn = t.cross(ref).normalized()
            else:
                nn = (pn - t * pn.dot(t)).normalized()
            bb = t.cross(nn); pn = nn
            rings.append([bm.verts.new(p + (nn * math.cos(2 * math.pi * k / seg) + bb * math.sin(2 * math.pi * k / seg)) * r)
                          for k in range(seg)])
        last = n if closed else n - 1
        for i in range(last):
            a, b = rings[i], rings[(i + 1) % n]
            for k in range(seg):
                bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
        if caps and not closed:
            bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
        new = [f for f in bm.faces if f not in before]
        bmesh.ops.recalc_face_normals(bm, faces=new)
        return self._tag(before, mat)

    def quad(self, center, right, up, w, h, mat, uv=(0, 0, 1, 1), off=0.0):
        """decal plano. right/up = ejes (vectores unitarios); normal = right x up."""
        bm = self.bm; before = set(bm.faces)
        c = Vector(center); r = Vector(right).normalized(); u = Vector(up).normalized()
        c = c + r.cross(u) * off
        vs = [bm.verts.new(c + r * sx * w / 2 + u * sy * h / 2) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        f = bm.faces.new(vs)
        for lp, (uu, vv) in zip(f.loops, ((uv[0], uv[1]), (uv[2], uv[1]), (uv[2], uv[3]), (uv[0], uv[3]))):
            lp[self.uv].uv = (uu, vv)
        self.decal.add(f)
        i = self._mi(mat); f.material_index = i
        return f

    def finish(self, parent=None, loc=(0, 0, 0)):
        bm = self.bm
        bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if f not in self.decal])
        uvs = 20.0  # un tile de grano cada 5 cm
        for f in bm.faces:
            if f in self.decal: continue
            n = f.normal; ax = max(range(3), key=lambda i: abs(n[i]))
            for lp in f.loops:
                c = lp.vert.co
                lp[self.uv].uv = ((c.y, c.z), (c.x, c.z), (c.x, c.y))[ax]
                lp[self.uv].uv = (lp[self.uv].uv[0] * uvs, lp[self.uv].uv[1] * uvs)
        # normales: suave, con aristas duras donde el angulo es grande
        for f in bm.faces: f.smooth = True
        for e in bm.edges:
            if len(e.link_faces) == 2 and e.calc_face_angle(0) > math.radians(38): e.smooth = False
        loose = [v for v in bm.verts if not v.link_faces]
        if loose: bmesh.ops.delete(bm, geom=loose, context='VERTS')
        nonman = sum(1 for e in bm.edges if len(e.link_faces) != 2)
        me = bpy.data.meshes.new(self.name)
        bm.to_mesh(me); bm.free()
        for mn in self.mats: me.materials.append(MATS[mn])
        ob = bpy.data.objects.new(self.name, me)
        ob.location = loc
        ob["pieza"] = self.name; me["pieza"] = self.name
        coll.objects.link(ob)
        if parent is not None: ob.parent = parent
        print(f"[parte] {self.name:24s} tris={len(me.polygons):6d} aristas_abiertas={nonman}")
        return ob

# ---------------------------------------------------------------- geometria comun
def circle_pts(r, n, cx=0, cy=0):
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n)]

def gear_pts(r_out, r_in, n):
    pts = []; d = 2 * math.pi / n
    for k in range(n):
        a = k * d
        for f, r in ((0.0, r_in), (0.22, r_out), (0.5, r_out), (0.72, r_in)):
            pts.append((r * math.cos(a + f * d), r * math.sin(a + f * d)))
    return pts

def rrect(w, h, r, n=5):
    pts = []
    for (cx, cy, a0) in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n); pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

# pose
Z_AX = 0.515
TILT = math.radians(-30)   # lente apuntando arriba y hacia atras, como en las fotos 16.36.04(2) / 16.36.05(3)
PIVOT_M = T(0, 0, Z_AX) @ Rx(TILT)
def H(p): return PIVOT_M @ Vector(p)   # punto local del cabezal -> mundo

pivot = bpy.data.objects.new("cabezal_pivot", None)
pivot.empty_display_type = 'ARROWS'; pivot.empty_display_size = 0.05
pivot.location = (0, 0, Z_AX); pivot.rotation_euler = (TILT, 0, 0)
coll.objects.link(pivot)

# ================================================================ BASE
def build_base():
    P = Part("base")
    z0, z1, z2 = 0.045, 0.14, 0.185
    r0 = [(-0.115, -0.15), (0.115, -0.15), (0.165, -0.09), (0.165, 0.09), (0.115, 0.15), (-0.115, 0.15), (-0.165, 0.09), (-0.165, -0.09)]
    r1 = [(x * 0.985, y) for x, y in r0]
    r2 = [(-0.094, -0.098), (0.094, -0.098), (0.135, -0.062), (0.135, 0.085), (0.094, 0.14), (-0.094, 0.14), (-0.135, 0.085), (-0.135, -0.062)]
    bm = P.bm; before = set(bm.faces)
    rings = [[bm.verts.new((x, y, z)) for x, y in r] for r, z in ((r0, z0), (r1, z1), (r2, z2))]
    for k in range(2):
        for i in range(8):
            bm.faces.new((rings[k][i], rings[k][(i + 1) % 8], rings[k + 1][(i + 1) % 8], rings[k + 1][i]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[2])
    new = [f for f in bm.faces if f not in before]
    bmesh.ops.recalc_face_normals(bm, faces=new)
    P._tag(before, "carcasa_plastico", bevel=0.006, bseg=2)
    # orejas / asas laterales (marco con ventana pasante en Y)
    for s in (-1, 1):
        cx = s * 0.1675
        P.box((0.0135, 0.125, 0.12), T(s * 0.1675 + s * 0.0 + (0.0 if True else 0) + s * (0.028 / 2 + 0.0135 / 2), 0, 0.145), "carcasa_plastico", 0.006)
        P.box((0.0135, 0.125, 0.12), T(cx - s * (0.028 / 2 + 0.0135 / 2), 0, 0.145), "carcasa_plastico", 0.006)
        P.box((0.055, 0.125, 0.018), T(cx, 0, 0.196), "carcasa_plastico", 0.007)
        P.box((0.055, 0.125, 0.07), T(cx, 0, 0.115), "carcasa_plastico", 0.007)
        # orificio de fijacion
        P.cyl(0.006, 0.02, T(s * 0.19, 0, 0.1) @ Ry(math.pi / 2), "ranura_negra", 12)
    # patas y soporte de colgar
    for sx in (-1, 1):
        for sy in (-1, 1):
            P.box((0.05, 0.075, 0.047), T(sx * 0.115, sy * 0.095, 0.0235), "carcasa_plastico", 0.008)
    P.box((0.11, 0.035, 0.012), T(0, 0.045, 0.036), "metal_negro", 0.002)
    P.box((0.035, 0.03, 0.03), T(-0.025, 0.045, 0.02), "metal_negro", 0.002)
    P.cyl(0.007, 0.05, T(0.04, 0.045, 0.026) @ Ry(math.pi / 2), "acero_zincado", 10)
    P.cyl(0.011, 0.012, T(0.065, 0.045, 0.026) @ Ry(math.pi / 2), "metal_negro", 10)
    # collar giratorio (aluminio) y correa de pan
    P.cyl(0.039, 0.03, T(0, 0, 0.2), "aluminio_cepillado", 36)
    P.cyl(0.047, 0.012, T(0, 0, 0.209), "goma_negra", 40)
    # rejillas de ventilacion (dos grupos) sobre la tapa
    for gx in (-1, 1):
        for row in range(2):
            for k in range(7):
                P.quad((gx * 0.078 + (k - 3) * 0.0075, -0.052 + row * 0.014, z2 + 0.0004), (1, 0, 0), (0, 1, 0), 0.0042, 0.0095, "ranura_negra")
    # etiqueta normativa sobre el hombro frontal (pendiente 41 grados)
    nrm = Vector((0, -0.045, 0.052)).normalized()
    upv = Vector((0, 0.052, 0.045)).normalized()
    P.quad((0.055, -0.124, 0.1625), (1, 0, 0), upv, 0.082, 0.0242, "decal_etiqueta", off=0.0006)
    return P.finish()

# ================================================================ PANEL + LCD
def build_panel():
    P = Part("panel_lcd")
    zc, yf = 0.088, -0.15
    P.box((0.248, 0.008, 0.094), T(0, yf, zc), "carcasa_plastico", 0.002)
    P.quad((0, yf - 0.0041, zc), (1, 0, 0), (0, 0, 1), 0.2169, 0.0652, "decal_panel", off=0.0)  # normal = x cross z = -y
    # vidrio LCD levemente en relieve (sobre el recuadro de la pantalla)
    k = 0.0002233
    P.box((0.046, 0.0015, 0.036), T((381 - 486) * k, yf - 0.0048, zc + (146 - 140) * k), "lcd_vidrio", 0.0006)
    # botones en relieve (arriba, izquierda, OK, derecha, abajo): la tapa lleva el glifo recortado de la foto
    kpx = 0.2169 / 972.0
    for (bx, by) in ((644, 60), (555, 142), (640, 145), (724, 142), (640, 225)):
        cx = (bx - 486) * kpx; cz = zc + (146 - by) * kpx
        faces = P.cyl(0.0068, 0.0026, T(cx, yf - 0.0041 - 0.0006, cz) @ Rx(math.pi / 2), "plastico_liso", 24, bevel=0.0004)
        P.bm.normal_update()
        for f in faces:
            if f.normal.y < -0.9 and len(f.verts) >= 12:
                f.material_index = P._mi("decal_panel")
                for lp in f.loops:
                    co = lp.vert.co
                    lp[P.uv].uv = (0.5 + co.x / 0.2169, 0.5 + (co.z - zc) / 0.0652)
                P.decal.add(f)
    # tornillos
    for sx in (-1, 1):
        for sz in (-1, 1):
            P.cyl(0.0042, 0.003, T(sx * 0.1195, yf - 0.0045, zc + sz * 0.036) @ Rx(math.pi / 2), "metal_negro", 8)
    return P.finish()

# ================================================================ YUGO
def arm_profile(z0, zc, rr, n=10):
    pts = [(-rr, z0), (rr, z0), (rr, zc)]
    for i in range(1, n):
        a = math.pi * i / n; pts.append((rr * math.cos(a), zc + rr * math.sin(a)))
    pts.append((-rr, zc))
    return pts

def build_yugo():
    P = Part("yugo")
    # puente en U (perfil XZ) - extremo +X cortado en 0.12 (brazo abierto)
    # perfil limpio del puente: piso en V con chaflanes de 45 grados
    B = [(-0.185, 0.215), (0.12, 0.215), (0.12, 0.345), (0.125, 0.345), (0.065, 0.285), (-0.065, 0.285), (-0.125, 0.345), (-0.185, 0.345)]
    P.poly(B, 0.18, T(0, 0.025, 0) @ M_XZ, "carcasa_plastico", 0.006)
    # brazo izquierdo (-X): tapa cerrada. Perfil (y,z) con tapa redondeada, extruido en X
    arm = arm_profile(0.33, 0.51, 0.065)
    P.poly(arm, 0.06, T(-0.155, 0, 0) @ M_YZ, "carcasa_plastico", 0.012, 3)
    # brazo derecho (+X): tapa retirada -> chapa de acero con pestanas
    plate = arm_profile(0.215, 0.51, 0.065)
    P.poly(plate, 0.004, T(0.123, 0, 0) @ M_YZ, "metal_negro", 0.0)
    for sy in (-1, 1):
        P.box((0.05, 0.004, 0.30), T(0.147, sy * 0.0635, 0.375), "metal_negro", 0.001)
    P.box((0.07, 0.13, 0.004), T(0.158, 0, 0.217), "metal_negro", 0.001)
    # ménsula gris (zincada) donde va el encoder
    P.box((0.003, 0.11, 0.085), T(0.1275, 0, 0.262), "acero_zincado", 0.0008)
    # logo KOLORTEC* frontal y sticker lateral HOTSPOT CMY
    P.quad((-0.0, -0.0655, 0.275), (1, 0, 0), (0, 0, 1), 0.077, 0.077 * 64 / 360, "decal_logo", off=0.0)
    P.quad((-0.1858, 0.0, 0.44), (0, 1, 0), (0, 0, 1), 0.05, 0.205, "decal_sticker", off=0.0)
    # tornillos frontales
    for (x, z) in ((-0.168, 0.232), (0.105, 0.232), (-0.11, 0.33), (0.0, 0.232), (-0.168, 0.33), (-0.075, 0.232)):
        P.cyl(0.0045, 0.003, T(x, -0.0665, z) @ Rx(math.pi / 2), "metal_negro", 8)
    for z in (0.36, 0.5):
        P.cyl(0.0045, 0.003, T(-0.1865, -0.045, z) @ Ry(math.pi / 2), "metal_negro", 8)
    return P.finish()

# ================================================================ CABEZAL: chasis
def build_chasis():
    P = Part("cabezal_chasis")
    phi = math.atan((0.118 - 0.075) / 0.2)
    for s in (-1, 1):
        P.box((0.004, 0.15, 0.215), T(s * 0.0965, 0, 0.07) @ Ry(-s * phi), "metal_negro", 0.0005)
        # discos de tilt y pernos de muñón
        P.cyl(0.036, 0.004, T(s * 0.1135, 0, 0) @ Ry(math.pi / 2), "metal_negro", 28)
        P.cyl(0.022, 0.03, T(s * 0.122, 0, 0) @ Ry(math.pi / 2), "aluminio_cepillado", 24)
    P.box((0.19, 0.16, 0.004), T(0, 0, 0.17), "metal_negro", 0.0008)
    for sx in (-1, 1):
        for sy in (-1, 1):
            P.box((0.012, 0.012, 0.03), T(sx * 0.09, sy * 0.07, 0.185), "metal_negro", 0.001)
    P.box((0.222, 0.15, 0.004), T(0, 0, 0.025), "metal_negro", 0.0008)
    P.box((0.236, 0.16, 0.004), T(0, 0, -0.047), "metal_negro", 0.0008)
    for sx in (-1, 1):
        for sy in (-1, 1):
            P.cyl(0.004, 0.217, T(sx * 0.07, sy * 0.06, 0.0615), "acero_zincado", 8)
    P.box((0.07, 0.012, 0.062), T(0, -0.07, 0.16), "metal_negro", 0.001)   # tapa de la columna optica (mas chica: deja ver la varilla)
    return P.finish(parent=pivot)

# ================================================================ lente frontal
def build_lente():
    P = Part("lente_frontal")
    # barril acampanado (revolucion cerrada) con aros internos escalonados
    outer = [(0.060, 0.172), (0.076, 0.172), (0.076, 0.20), (0.082, 0.222), (0.093, 0.250), (0.103, 0.274), (0.1085, 0.2785), (0.1085, 0.2845), (0.1005, 0.2845)]
    inner = [(0.0975, 0.2745)]
    for k in range(6):                                   # 6 escalones internos como en las fotos 16.36.03 / 16.36.06
        rk = 0.0975 - 0.0062 * k; zk = 0.2745 - 0.0125 * k
        inner += [(rk - 0.0008, zk - 0.0095), (rk - 0.0062, zk - 0.0095), (rk - 0.0062, zk - 0.0125)]
    inner += [(0.0605, 0.2)]
    P.spin(outer + inner, Matrix.Identity(4), "goma_negra", 56)
    # lente de salida grande (plano-convexa) con aro de retencion
    lens = [(0, 0.2055), (0.0615, 0.2055), (0.0615, 0.2115), (0.047, 0.2185), (0.031, 0.2235), (0.0155, 0.2265), (0, 0.2275)]
    P.spin(lens, Matrix.Identity(4), "vidrio_lente", 48)
    P.tube([(0.0625 * math.cos(2 * math.pi * i / 48), 0.0625 * math.sin(2 * math.pi * i / 48), 0.2105) for i in range(48)], 0.0022, "aluminio_cepillado", 6, closed=True)
    P.cyl(0.052, 0.004, T(0, 0, 0.165), "vidrio_lente", 32)
    P.cyl(0.058, 0.006, T(0, 0, 0.169), "aluminio_cepillado", 32)
    # tubo optico, tuerca de laton y varilla roscada
    P.cyl(0.030, 0.132, T(0, 0, 0.106), "metal_negro", 28)
    P.cyl(0.040, 0.012, T(0, 0, 0.162), "metal_negro", 28)
    # varilla roscada con tuerca de laton (centro, foto 16.36.06) - rosca = anillos finos
    P.cyl(0.0058, 0.115, T(0.0, -0.043, 0.085), "acero_zincado", 12)
    for k in range(16):
        P.cyl(0.0069, 0.0014, T(0.0, -0.043, 0.032 + k * 0.0046), "acero_zincado", 12)
    P.cyl(0.0125, 0.026, T(0.0, -0.043, 0.088), "laton", 20, bevel=0.0012)
    P.cyl(0.0075, 0.012, T(0.0, -0.043, 0.108), "laton", 14)
    P.box((0.03, 0.03, 0.012), T(0.0, -0.043, 0.026), "metal_negro", 0.002)
    P.box((0.05, 0.014, 0.01), T(0.0, -0.043, 0.136), "metal_negro", 0.002)   # soporte superior de la varilla
    # lentes intermedias entre la rueda de gobos y la salida: celdas con vidrio y aro de aluminio
    for z, r in ((0.066, 0.036), (0.118, 0.036), (0.140, 0.047), (0.154, 0.052)):
        P.cyl(r, 0.012 if r < 0.04 else 0.007, T(0, 0, z), "metal_negro", 32)
        P.cyl(r - 0.008, 0.0135 if r < 0.04 else 0.0085, T(0, 0, z), "vidrio_lente", 28)
        P.tube([((r - 0.004) * math.cos(2 * math.pi * i / 32), (r - 0.004) * math.sin(2 * math.pi * i / 32), z + (0.0065 if r < 0.04 else 0.0045)) for i in range(32)], 0.0012, "aluminio_cepillado", 5, closed=True)
    return P.finish(parent=pivot)

# ================================================================ disipador + heat-pipes
def build_disipador():
    P = Part("disipador_heatpipes")
    n = 26; zb = -0.186; zt = -0.092
    for i in range(n):
        z = zb + (zt - zb) * i / (n - 1)
        P.box((0.16, 0.12, 0.0013), T(0, 0.0, z), "aluminio_aletas")
    P.box((0.16, 0.12, 0.004), T(0, 0, zb - 0.002), "aluminio_aletas")
    P.box((0.19, 0.115, 0.012), T(0, 0, -0.084), "aluminio_cepillado", 0.001)   # placa fria bajo el modulo LED
    # heat-pipes: 6 tubos redondos. Un extremo sale de la placa fria, baja, se curva en U y el otro extremo
    # gira hacia adentro y entra en el bloque de aletas. Se escalonan en X para que se lean como tubos separados.
    for s_ in (-1, 1):
        for i in range(6):
            r = 0.0105 + 0.0095 * i
            xo = s_ * (0.0872 + (0.0042 if i % 2 else 0.0))
            zc = -0.112; rb = 0.0065; zb = zc + 0.010
            path = [(s_ * 0.075, r, -0.0845), (xo, r, -0.0845), (xo, r, zc)]
            path += [(xo, r * math.cos(math.pi * a / 16), zc - r * math.sin(math.pi * a / 16)) for a in range(1, 16)]
            path += [(xo, -r, zc), (xo, -r, zb)]
            for a in range(1, 7):                       # curva de 90 grados hacia el interior
                th = math.radians(90 * a / 6)
                path.append((xo - s_ * rb * (1 - math.cos(th)), -r, zb + rb * math.sin(th)))
            path += [(s_ * 0.070, -r, zb + rb), (s_ * 0.050, -r, zb + rb)]
            P.tube(path, 0.0042, "cobre", 10)
    return P.finish(parent=pivot)

# ================================================================ ventiladores
def build_fan_a():
    P = Part("ventilador_motor_led")
    c = (0, -0.1, -0.1365)
    for sx in (-1, 1):
        P.box((0.004, 0.03, 0.117), T(sx * 0.0765, -0.105, -0.1365), "metal_negro", 0.001)
    P.box((0.157, 0.03, 0.004), T(0, -0.105, -0.1365 + 0.0565), "metal_negro", 0.001)
    P.box((0.157, 0.03, 0.004), T(0, -0.105, -0.1365 - 0.0565), "metal_negro", 0.001)
    P.box((0.157, 0.03, 0.117), T(0, -0.075, -0.1365), "metal_negro", 0.003)    # carcasa/shroud
    M = T(*c) @ Rx(math.pi / 2)     # eje del ventilador (z local) -> -Y (frente)
    P.box((0.104, 0.006, 0.027), M @ T(0, 0.049, 0), "goma_negra", 0.001)
    P.box((0.104, 0.006, 0.027), M @ T(0, -0.049, 0), "goma_negra", 0.001)
    P.box((0.006, 0.092, 0.027), M @ T(0.049, 0, 0), "goma_negra", 0.001)
    P.box((0.006, 0.092, 0.027), M @ T(-0.049, 0, 0), "goma_negra", 0.001)
    for sx in (-1, 1):
        for sy in (-1, 1):
            P.box((0.013, 0.013, 0.027), M @ T(sx * 0.0455, sy * 0.0455, 0), "goma_negra", 0.001)
    P.cyl(0.0185, 0.024, M @ T(0, 0, 0.0), "plastico_liso", 24, bevel=0.002)
    # palas barridas (media luna), 11 unidades
    lead = []; trail = []
    for i in range(9):
        t = i / 8; r = 0.017 + 0.0295 * t; ph = 0.75 * t
        hw = 0.5 * (0.010 + 0.0125 * math.sin(math.pi * min(1, t * 1.1)) ** 0.6) / r
        lead.append((r * math.cos(ph + hw), r * math.sin(ph + hw))); trail.append((r * math.cos(ph - hw), r * math.sin(ph - hw)))
    blade = lead + trail[::-1]
    for k in range(11):
        P.poly(blade, 0.0022, M @ Rz(2 * math.pi * k / 11), "plastico_liso", 0.0003)
    for sx in (-1, 1):
        for sy in (-1, 1):
            P.cyl(0.0028, 0.004, M @ T(sx * 0.0455, sy * 0.0455, 0.0138), "metal_negro", 8)
    return P.finish(parent=pivot)

def build_fan_b():
    P = Part("ventilador_2")
    z = -0.1925
    P.box((0.158, 0.13, 0.008), T(0, 0, z), "goma_negra", 0.002)
    for r in (0.014, 0.024, 0.034, 0.044, 0.054):
        P.tube([(r * math.cos(2 * math.pi * i / 28), r * math.sin(2 * math.pi * i / 28), z - 0.0045) for i in range(28)], 0.0019, "goma_negra", 4, closed=True)
    for a in (0, math.pi / 2):
        P.box((0.12, 0.004, 0.003), T(0, 0, z - 0.0045) @ Rz(a + math.pi / 4), "goma_negra")
    P.cyl(0.013, 0.006, T(0, 0, z - 0.0065), "goma_negra", 20)
    return P.finish(parent=pivot)

# ================================================================ modulo CMY
def build_cmy():
    P = Part("modulo_cmy")
    for (x, y, z, g) in ((-0.035, -0.012, -0.030, "vidrio_c"), (0.035, -0.012, -0.018, "vidrio_m"), (0.0, 0.026, -0.006, "vidrio_y")):
        P.cyl(0.040, 0.0028, T(x, y, z), g, 36)
        P.poly(gear_pts(0.0485, 0.0445, 36), 0.004, T(x, y, z), "goma_negra")
        P.cyl(0.006, 0.008, T(x, y, z), "aluminio_cepillado", 12)
    return P.finish(parent=pivot)

# ================================================================ rueda de gobos
def build_gobos():
    P = Part("rueda_gobos")
    c = (-0.048, 0.010, 0.094)
    R = 0.036
    P.poly(gear_pts(R + 0.0045, R, 42), 0.0035, T(*c), "metal_negro")          # corona dentada
    P.cyl(R - 0.002, 0.0045, T(*c), "metal_negro", 40)
    for k in range(7):                                                          # aperturas con vidrio
        a = 2 * math.pi * k / 7
        P.cyl(0.0078, 0.0058, T(c[0] + 0.0245 * math.cos(a), c[1] + 0.0245 * math.sin(a), c[2]), "vidrio_gobo", 16)
        P.tube([(c[0] + 0.0245 * math.cos(a) + 0.0085 * math.cos(b), c[1] + 0.0245 * math.sin(a) + 0.0085 * math.sin(b), c[2] + 0.0032) for b in [2 * math.pi * j / 14 for j in range(14)]], 0.0009, "aluminio_cepillado", 4, closed=True)
    P.cyl(0.008, 0.012, T(*c), "aluminio_cepillado", 14)
    # segunda rueda (rotacion de gobo) y piñon que las engrana
    c2 = (0.050, -0.004, 0.072)
    P.poly(gear_pts(0.0285, 0.0255, 34), 0.0035, T(*c2), "metal_negro")
    P.cyl(0.0235, 0.0045, T(*c2), "metal_negro", 32)
    P.cyl(0.012, 0.0055, T(*c2), "vidrio_gobo", 18)
    P.poly(gear_pts(0.0105, 0.0085, 14), 0.006, T(-0.0318, 0.0546, 0.094), "aluminio_cepillado")
    return P.finish(parent=pivot)

# ================================================================ motores paso a paso
def build_motores():
    P = Part("motores_paso_a_paso")
    for (x, y, z) in ((-0.052, -0.03, 0.045), (0.072, -0.03, 0.052), (0.0, 0.05, 0.02), (0.066, 0.0, 0.012), (-0.07, 0.035, 0.125)):
        P.box((0.042, 0.042, 0.04), T(x, y, z), "metal_negro", 0.003)
        P.box((0.042, 0.042, 0.006), T(x, y, z + 0.023), "aluminio_cepillado", 0.001)
        P.cyl(0.0025, 0.022, T(x, y, z + 0.037), "acero_zincado", 8)
        P.box((0.014, 0.006, 0.014), T(x + 0.0, y - 0.024, z - 0.008), "conector_blanco", 0.0008)
        P.box((0.008, 0.002, 0.008), T(x + 0.0, y - 0.0275, z - 0.008), "cable_rojo")
        P.poly(gear_pts(0.0115, 0.0095, 14), 0.006, T(x, y, z + 0.043), "aluminio_cepillado")
        P.box((0.05, 0.05, 0.003), T(x, y, z - 0.0215), "metal_negro", 0.0005)
    return P.finish(parent=pivot)

# ================================================================ placa de control (extra)
def build_placa():
    P = Part("placa_control")
    c = (0.056, -0.08, 0.047)
    P.box((0.056, 0.003, 0.086), T(*c), "pcb_verde", 0.0008)
    for (dx, dz, w, h) in ((-0.016, 0.036, 0.016, 0.012), (0.014, 0.038, 0.014, 0.01), (-0.02, 0.01, 0.01, 0.018), (0.02, 0.008, 0.012, 0.016)):
        P.box((w, 0.007, h), T(c[0] + dx, c[1] - 0.005, c[2] + dz), "conector_blanco", 0.0008)
    P.box((0.016, 0.003, 0.016), T(c[0] + 0.0, c[1] - 0.003, c[2] - 0.004), "metal_negro", 0.0005)
    for dx in (-0.018, 0.0, 0.016):
        P.cyl(0.0042, 0.009, T(c[0] + dx, c[1] - 0.006, c[2] - 0.034) @ Rx(math.pi / 2), "metal_negro", 12)
    return P.finish(parent=pivot)

# ================================================================ polea + correa de tilt (mundo)
def hull(pts):
    pts = sorted(set(pts))
    def cr(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo = []
    for p in pts:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    up = []
    for p in reversed(pts):
        while len(up) >= 2 and cr(up[-2], up[-1], p) <= 0: up.pop()
        up.append(p)
    return lo[:-1] + up[:-1]

def build_correa():
    P = Part("correa_tilt")
    xc = 0.142
    zt, zb = Z_AX, 0.255
    # polea grande (disco negro con cubo de aluminio y tornillos)
    P.cyl(0.068, 0.012, T(xc, 0, zt) @ Ry(math.pi / 2), "goma_negra", 56)
    P.cyl(0.03, 0.005, T(xc + 0.0075, 0, zt) @ Ry(math.pi / 2), "aluminio_cepillado", 32)
    P.tube([(xc + 0.0062, 0.0655 * math.cos(2 * math.pi * i / 56), zt + 0.0655 * math.sin(2 * math.pi * i / 56)) for i in range(56)], 0.0016, "aluminio_cepillado", 5, closed=True)
    P.cyl(0.014, 0.006, T(xc + 0.0105, 0, zt) @ Ry(math.pi / 2), "metal_negro", 20)
    for k in range(4):
        a = math.pi / 2 * k + math.pi / 4
        P.cyl(0.0035, 0.003, T(xc + 0.01, 0.022 * math.cos(a), zt + 0.022 * math.sin(a)) @ Ry(math.pi / 2), "metal_negro", 8)
    # polea chica
    P.cyl(0.018, 0.022, T(xc, 0, zb) @ Ry(math.pi / 2), "acero_zincado", 24)
    P.cyl(0.0235, 0.002, T(xc - 0.011, 0, zb) @ Ry(math.pi / 2), "acero_zincado", 24)
    P.cyl(0.0235, 0.002, T(xc + 0.011, 0, zb) @ Ry(math.pi / 2), "acero_zincado", 24)
    # correa: casco convexo de dos circulos, cinta con espesor, dientes sobre los tramos rectos
    R1, R2, th, wd = 0.0735, 0.0245, 0.004, 0.02
    pts = [(R1 * math.cos(2 * math.pi * i / 72), zt + R1 * math.sin(2 * math.pi * i / 72)) for i in range(72)]
    pts += [(R2 * math.cos(2 * math.pi * i / 36), zb + R2 * math.sin(2 * math.pi * i / 36)) for i in range(36)]
    hp = hull([(round(a, 6), round(b, 6)) for a, b in pts])
    n = len(hp); outer = []; inner = []
    for i in range(n):
        a = Vector(hp[i - 1]); b = Vector(hp[i]); c = Vector(hp[(i + 1) % n])
        t = (c - a).normalized(); nr = Vector((t.y, -t.x))
        outer.append(Vector(hp[i])); inner.append(Vector(hp[i]) - nr * th)
    bm = P.bm; before = set(bm.faces)
    X0, X1 = xc - wd / 2, xc + wd / 2
    V = lambda q, x: bm.verts.new((x, q.x, q.y))
    oa = [V(q, X0) for q in outer]; ob = [V(q, X1) for q in outer]
    ia = [V(q, X0) for q in inner]; ib = [V(q, X1) for q in inner]
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((oa[i], oa[j], ob[j], ob[i]))      # cara exterior
        bm.faces.new((ib[i], ib[j], ia[j], ia[i]))      # cara interior
        bm.faces.new((ia[i], ia[j], oa[j], oa[i]))      # borde X0
        bm.faces.new((ob[i], ob[j], ib[j], ib[i]))      # borde X1
    new = [f for f in bm.faces if f not in before]
    bmesh.ops.recalc_face_normals(bm, faces=new)
    P._tag(before, "correa")
    for i in range(n):
        a = Vector(hp[i]); b = Vector(hp[(i + 1) % n]); L = (b - a).length
        if L > 0.002:
            d = (b - a) / L; nr = Vector((d.y, -d.x))
            cnt = max(1, int(round(L / 0.0065)))
            for k in range(cnt):
                p = a + d * (L * (k + 0.5) / cnt) + nr * (th / 2 + 0.0009)
                ang = math.atan2(d.y, d.x)
                # caja alineada con el tramo: ejes locales x=X(ancho), y=d, z=nr
                Mx = Matrix(((1, 0, 0, 0), (0, d.x, nr.x, 0), (0, d.y, nr.y, 0), (0, 0, 0, 1)))
                # columnas: X->X ; local y -> (y=d.x, z=d.y); local z -> (y=nr.x, z=nr.y)
                Mm = Matrix(((1, 0, 0), (0, d.x, nr.x), (0, d.y, nr.y))).to_4x4()
                P.box((wd * 0.8, 0.0022, 0.0022), T(xc, p.x, p.y) @ Mm, "metal_negro")
    return P.finish()

# ================================================================ encoder (mundo)
def build_encoder():
    P = Part("encoder")
    xc, zc = 0.162, 0.255
    N = 64; d = 2 * math.pi / N
    # disco ranurado: peine en el borde (cada diente = tramo exterior, bajada, tramo interior)
    comb = []
    for k in range(N):
        a0 = k * d; a1 = a0 + 0.5 * d; a2 = a0 + d
        comb += [(0.0335 * math.cos(a0), 0.0335 * math.sin(a0)), (0.0335 * math.cos(a1), 0.0335 * math.sin(a1)),
                 (0.0262 * math.cos(a1), 0.0262 * math.sin(a1)), (0.0262 * math.cos(a2), 0.0262 * math.sin(a2))]
    # perfil en (y,z) del mundo -> M_YZ, centrado en (0,zc)
    P.poly([(x, y) for x, y in comb], 0.0018, T(xc, 0, zc) @ M_YZ, "aluminio_cepillado")
    P.cyl(0.014, 0.01, T(xc - 0.004, 0, zc) @ Ry(math.pi / 2), "acero_zincado", 20)
    P.cyl(0.0075, 0.006, T(xc + 0.003, 0, zc) @ Ry(math.pi / 2), "aluminio_cepillado", 16)
    # sensor optico (horquilla negra) + plaqueta verde
    P.box((0.012, 0.014, 0.014), T(xc, -0.03, zc), "metal_negro", 0.001)
    P.box((0.003, 0.034, 0.026), T(xc - 0.004, -0.044, zc - 0.002), "pcb_verde", 0.0005)
    P.box((0.006, 0.01, 0.012), T(xc - 0.007, -0.052, zc + 0.002), "conector_blanco", 0.0008)
    return P.finish()

# ================================================================ cableado (mundo, liviano)
def build_cables():
    P = Part("cableado")
    # manga gris desde el cubo de la polea y haz de cables que baja por el brazo
    spine = [(0.158, 0.0, Z_AX), (0.166, 0.0, 0.50), (0.168, 0.012, 0.46), (0.168, 0.027, 0.405), (0.168, 0.03, 0.34), (0.166, 0.028, 0.29), (0.164, 0.02, 0.245)]
    # suavizado catmull-rom simple
    def smooth(pts, sub=4):
        out = []
        for i in range(len(pts) - 1):
            p0 = Vector(pts[max(i - 1, 0)]); p1 = Vector(pts[i]); p2 = Vector(pts[i + 1]); p3 = Vector(pts[min(i + 2, len(pts) - 1)])
            for s in range(sub):
                t = s / sub
                out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
        out.append(Vector(pts[-1]))
        return out
    sp = smooth(spine)
    P.tube(sp[:9], 0.0105, "manga_gris", 10)
    for i in range(8):
        a = 2 * math.pi * i / 8
        off = Vector((math.cos(a), 0, math.sin(a))) * 0.0064
        P.tube([p + off for p in sp[7:]], 0.0021, "cable_rojo" if i % 2 == 0 else "cable_negro", 5)
    # cables dentro del cabezal (puntos locales del cabezal -> mundo con la pose)
    runs = [
        ([(0.036, -0.086, 0.075), (-0.075, -0.1, 0.05), (-0.098, -0.09, -0.02), (-0.1, -0.05, -0.075)], "cable_rojo"),
        ([(0.04, -0.086, 0.072), (-0.07, -0.105, 0.045), (-0.094, -0.095, -0.025), (-0.097, -0.05, -0.078)], "cable_negro"),
        ([(0.074, -0.086, 0.075), (0.085, -0.098, 0.03), (0.098, -0.09, -0.04), (0.1, -0.05, -0.078)], "cable_rojo"),
        ([(0.07, -0.086, 0.072), (0.08, -0.103, 0.028), (0.094, -0.095, -0.042), (0.097, -0.05, -0.08)], "cable_negro"),
        ([(0.046, -0.113, -0.092), (0.09, -0.1, -0.07), (0.1, -0.06, -0.07)], "cable_rojo"),
        ([(0.044, -0.113, -0.094), (0.088, -0.104, -0.075), (0.097, -0.06, -0.076)], "cable_negro"),
        ([(-0.07, 0.035, 0.1), (-0.09, 0.06, 0.06), (-0.1, 0.07, 0.0), (-0.1, 0.06, -0.06)], "cable_negro"),
        ([(0.066, 0.0, 0.03), (0.095, 0.02, 0.05), (0.1, 0.05, 0.1), (0.07, 0.07, 0.16)], "cable_rojo"),
    ]
    for pts, mat in runs:
        w = [H(p) for p in pts]
        P.tube(smooth(w, 4), 0.0022, mat, 5)
    return P.finish()

# ---------------------------------------------------------------- armado
objs = [build_base(), build_panel(), build_yugo(), build_chasis(), build_lente(), build_disipador(), build_fan_a(), build_fan_b(),
        build_cmy(), build_gobos(), build_motores(), build_placa(), build_correa(), build_encoder(), build_cables()]

LABELS = {
    "base": "Base", "panel_lcd": "Panel con pantalla LCD y botonera", "yugo": "Yugo (brazos en U)",
    "cabezal_chasis": "Chasis del cabezal", "lente_frontal": "Lente frontal", "disipador_heatpipes": "Disipador con heat-pipes",
    "ventilador_motor_led": "Ventilador del módulo LED", "ventilador_2": "Ventilador inferior", "modulo_cmy": "Módulo CMY (mezcla de color)",
    "rueda_gobos": "Rueda de gobos", "motores_paso_a_paso": "Motores paso a paso", "correa_tilt": "Polea y correa de tilt",
    "encoder": "Encoder", "cableado": "Cableado", "placa_control": "Placa electrónica de control",
}

# piezas.json en coordenadas GLB (Y arriba): (x,y,z)_glb = (x, z, -y)_blender
bpy.context.view_layer.update()
piezas = []
for ob in objs:
    pts = [ob.matrix_world @ v.co for v in ob.data.vertices]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    c = (mn + mx) / 2
    # esfera envolvente real: distancia maxima a los vertices en mundo
    rad = max((ob.matrix_world @ v.co - c).length for v in ob.data.vertices)
    # direccion sugerida DESDE la pieza HACIA la camara (coordenadas GLB, unitaria)
    d = Vector((0, -1, 0.35))                                    # por defecto: frente y un poco arriba
    if ob.name == "lente_frontal": d = PIVOT_M.to_3x3() @ Vector((0, 0, 1)) + Vector((0, -0.6, 0.3))   # boca del barril
    if ob.name == "ventilador_motor_led": d = PIVOT_M.to_3x3() @ Vector((0, -1, 0)) + Vector((0, -0.4, 0.3))
    d.normalize()
    piezas.append({
        "nombre_objeto": ob.name, "etiqueta": LABELS[ob.name],
        "centro": [round(c.x, 4), round(c.z, 4), round(-c.y, 4)], "radio": round(rad, 4),
        "vista_sugerida": [round(d.x, 3), round(d.z, 3), round(-d.y, 3)],
        "descripcion": "A CONFIRMAR POR KOLORTEC",
    })
with open(os.path.join(HERE, "piezas.json"), "w", encoding="utf-8") as fh:
    json.dump(piezas, fh, ensure_ascii=False, indent=2)

total = sum(len(o.data.polygons) for o in objs)
print("[total] triangulos =", total)

# guardar fuente (.blend) con imagenes de grano empacadas
for im in bpy.data.images:
    if im.name in ("grano_pintura", "aluminio_cepillado", "plastico_carcasa") or im.filepath: im.pack()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "hotspot-cmy.blend"))

# exportar GLB crudo (Draco + WebP)
bpy.ops.export_scene.gltf(
    filepath=GLB_OUT, export_format='GLB', export_apply=True, export_extras=True, export_yup=True,
    export_cameras=False, export_lights=False,
    export_image_format='WEBP', export_image_webp_fallback=False, export_image_quality=80,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12,
)
print("[glb]", GLB_OUT, os.path.getsize(GLB_OUT))
