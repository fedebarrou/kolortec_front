import numpy as np
from PIL import Image
im = np.array(Image.open('public/assets/scrolly-frames/f150.jpg').convert('RGB')).astype(np.float32)/255
L = 0.2126*im[...,0]+0.7152*im[...,1]+0.0722*im[...,2]
def ss(a,b,x): t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
Y = np.array([0xf4,0xdf,0x33])/255; W=np.ones(3); K=np.array([0.02,0.02,0.025])
def gmap(y0,y1,w0,w1,name):
    a = ss(y0,y1,L)[...,None]; b = ss(w0,w1,L)[...,None]
    out = K*(1-a) + Y*a; out = out*(1-b) + W*b
    Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8)).save(f'docs/mockups/2026-10-03-contacto/{name}.jpg', quality=90)
gmap(0.04,0.50,0.50,0.92,'bg-a-amarillo')   # ELEGIDA (3-oct): public/assets/cierre-haces-amarillos.jpg
Y = np.array([0xf4,0xdf,0x33])/255*0.6 + W*0.4
gmap(0.05,0.42,0.40,0.88,'bg-b-mixto')
print('ok')
