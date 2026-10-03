"""Recorta/genera las texturas de calcomanias del HOT SPOT CMY a partir de las fotos del cliente.
Salida: tex_src/*.png  (el export a GLB las pasa a webp).
Fuente de fotos: la carpeta que indique HOTSPOT_FOTOS (fotos propias de Kolortec,
no van al repo; ver SOURCES.md)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, os
# Carpeta con las fotos originales del equipo (no se versionan).
D = os.environ.get("HOTSPOT_FOTOS", "").rstrip("/\\") + "/"
if D == "/":
    raise SystemExit("Definí HOTSPOT_FOTOS con la carpeta de las fotos del HOT SPOT CMY.")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tex_src")
os.makedirs(OUT, exist_ok=True)
S = 2.016
F = D + "WhatsApp Image 2026-07-23 at 16.36.04.jpeg"
im = Image.open(F).convert("RGB")
def crop(box):
    return im.crop(tuple(int(v * S) for v in box))

# panel frontal completo (LCD, botonera, DMX/ERR, asterisco, HOT SPOT CMY)
p = crop((320, 1570, 840, 1760)).crop((28, 30, 1000, 322))
p.save(f"{OUT}/panel_front.png"); print("panel", p.size)

# etiqueta de la tapa
l = crop((640, 1480, 860, 1560)).crop((30, 20, 420, 135))
l.save(f"{OUT}/label_top.png"); print("label", l.size)

# KOLORTEC* del yugo: color blanco, alfa por luminancia
g = crop((470, 1330, 700, 1400)).crop((45, 38, 405, 102))
a = np.asarray(g.convert("L")).astype(np.float32)
lo, hi = 95, 170
alpha = np.clip((a - lo) / (hi - lo), 0, 1)
rgba = np.zeros((g.size[1], g.size[0], 4), np.uint8)
rgba[..., :3] = 238
rgba[..., 3] = (alpha * 255).astype(np.uint8)
Image.fromarray(rgba, "RGBA").save(f"{OUT}/yoke_logo.png"); print("logo", g.size)

# sticker lateral HOTSPOT CMY (vertical, se lee de abajo hacia arriba), tipografia Impact como en las fotos
W, H = 220, 900
st = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(st)
d.rounded_rectangle((0, 0, W - 1, H - 1), radius=105, fill=(14, 14, 14, 255), outline=(232, 232, 232, 255), width=6)
f = ImageFont.truetype("C:/Windows/Fonts/impact.ttf", 150)
txt = Image.new("RGBA", (H, W), (0, 0, 0, 0))
td = ImageDraw.Draw(txt)
w1 = td.textlength("HOTSPOT", font=f); w2 = td.textlength(" CMY", font=f)
x0 = (H - (w1 + w2)) / 2
td.text((x0, 22), "HOTSPOT", font=f, fill=(240, 240, 240, 255))
td.text((x0 + w1, 22), " CMY", font=f, fill=(222, 224, 26, 255))
st.alpha_composite(txt.rotate(90, expand=True))
st.save(f"{OUT}/sticker_side.png"); print("sticker", st.size)
