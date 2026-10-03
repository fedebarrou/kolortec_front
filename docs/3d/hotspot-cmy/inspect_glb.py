"""Inspecciona un GLB: nodos, materiales, extensiones, imagenes, pesos y bbox por nodo (mundo, Y arriba)."""
import json, struct, sys, os
import numpy as np
f = sys.argv[1]
b = open(f, "rb").read()
magic, ver, ln = struct.unpack("<4sII", b[:12])
off = 12; js = None; binchunk = None
while off < len(b):
    clen, ctype = struct.unpack("<II", b[off:off + 8]); data = b[off + 8: off + 8 + clen]
    if ctype == 0x4E4F534A: js = json.loads(data)
    elif ctype == 0x004E4942: binchunk = data
    off += 8 + clen
print("tamano total:", os.path.getsize(f), "bytes", f"({os.path.getsize(f)/1048576:.3f} MB)")
print("extensionsUsed:", js.get("extensionsUsed"), "| extensionsRequired:", js.get("extensionsRequired"))
print("nodos:", len(js["nodes"]), "mallas:", len(js["meshes"]), "materiales:", len(js["materials"]), "imagenes:", len(js.get("images", [])), "texturas:", len(js.get("textures", [])))
for i, im in enumerate(js.get("images", [])):
    bv = js["bufferViews"][im["bufferView"]]
    print(f"  imagen {i} {im.get('mimeType')} {im.get('name')} {bv['byteLength']/1024:.1f} KB")
print("alphaMode:", {m["name"]: m.get("alphaMode") for m in js["materials"] if m.get("alphaMode")})
tri = 0
for mesh in js["meshes"]:
    for p in mesh["primitives"]:
        tri += js["accessors"][p["indices"]]["count"] // 3
print("triangulos (indices/3):", tri)
# bbox por nodo en mundo
def local(n):
    import math
    M = np.eye(4)
    if "matrix" in n: M = np.array(n["matrix"]).reshape(4, 4).T
    else:
        t = n.get("translation", [0, 0, 0]); q = n.get("rotation", [0, 0, 0, 1]); s = n.get("scale", [1, 1, 1])
        x, y, z, w = q
        R = np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
        M[:3, :3] = R @ np.diag(s); M[:3, 3] = t
    return M
parent = {}
for i, n in enumerate(js["nodes"]):
    for c in n.get("children", []): parent[c] = i
def world(i):
    M = local(js["nodes"][i]); 
    while i in parent:
        i = parent[i]; M = local(js["nodes"][i]) @ M
    return M
res = {}
for i, n in enumerate(js["nodes"]):
    if "mesh" not in n: continue
    pts = []
    for p in js["meshes"][n["mesh"]]["primitives"]:
        a = js["accessors"][p["attributes"]["POSITION"]]
        mn, mx = np.array(a["min"]), np.array(a["max"])
        for cx in (mn[0], mx[0]):
            for cy in (mn[1], mx[1]):
                for cz in (mn[2], mx[2]): pts.append((cx, cy, cz, 1))
    W = world(i); P = (W @ np.array(pts).T).T[:, :3]
    res[n["name"]] = ((P.min(0) + P.max(0)) / 2, P.max(0) - P.min(0))
    print(f"  nodo {n['name']:22s} extras={n.get('extras')} centro_bbox={np.round(res[n['name']][0],4).tolist()} tam={np.round(res[n['name']][1],4).tolist()}")
json.dump({k: [v[0].tolist(), v[1].tolist()] for k, v in res.items()}, open(sys.argv[2], "w")) if len(sys.argv) > 2 else None
