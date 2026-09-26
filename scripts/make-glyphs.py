import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import distance_transform_edt
SIZE=24; B=3; RADIUS=8; CUTOFF=0.25; SS=4
OUT=sys.argv[1]  # usage: python3 scripts/make-glyphs.py public/fonts  (needs Oswald.ttf, the variable font, next to the script)
def varint(n):
    out=bytearray()
    n&=(1<<64)-1
    while True:
        b=n&0x7f; n>>=7
        if n: out.append(b|0x80)
        else: out.append(b); break
    return bytes(out)
def zigzag(n): return (n<<1)^(n>>63)
def key(field,wt): return varint((field<<3)|wt)
def f_varint(field,v): return key(field,0)+varint(v)
def f_bytes(field,b): return key(field,2)+varint(len(b))+b
def make_font(weight):
    f=ImageFont.truetype(os.path.join(os.path.dirname(os.path.abspath(__file__)),'Oswald.ttf'),SIZE*SS); f.set_variation_by_axes([weight]); return f
def glyph(font,cp):
    ch=chr(cp)
    adv=font.getlength(ch)/SS
    bbox=font.getbbox(ch,anchor='ls')
    w=bbox[2]-bbox[0]; h=bbox[3]-bbox[1]
    if w<=0 or h<=0 or ch.isspace():
        if ch.isspace() or cp==0xa0: return dict(id=cp,bitmap=b'',w=0,h=0,left=0,top=0,adv=int(round(adv)))
        return None
    pad=(RADIUS+B)*SS
    W=w+2*pad; Hh=h+2*pad
    W+= (-W)%SS; Hh+=(-Hh)%SS
    im=Image.new('L',(W,Hh),0)
    ImageDraw.Draw(im).text((pad-bbox[0],pad-bbox[1]),ch,font=font,fill=255,anchor='ls')
    a=np.array(im)>127
    dout=distance_transform_edt(~a); din=distance_transform_edt(a)
    d=(dout-din)/SS   # signed distance in px, positive outside
    d=d[SS//2::SS, SS//2::SS]
    alpha=np.clip(255-255*(d/RADIUS+CUTOFF),0,255).astype(np.uint8)
    # crop to glyph + buffer B
    oh,ow=alpha.shape
    x0=RADIUS+B-B; y0=RADIUS+B-B
    alpha=alpha[y0:oh-y0, x0:ow-x0]
    gh,gw=alpha.shape
    left=int(np.floor(bbox[0]/SS)); top=int(round(-bbox[1]/SS))
    asc=int(round(SIZE*1.0))  # fontnik: top = bitmap_top - ascender
    return dict(id=cp,bitmap=alpha.tobytes(),w=gw-2*B,h=gh-2*B,left=left,top=top-asc+17-17,adv=int(round(adv)))
def encode(name,start,end,font):
    gl=b''
    for cp in range(start,end+1):
        g=glyph(font,cp)
        if not g: continue
        body=f_varint(1,g['id'])
        if g['bitmap']: body+=f_bytes(2,g['bitmap'])
        body+=f_varint(3,g['w'])+f_varint(4,g['h'])+f_varint(5,zigzag(g['left']))+f_varint(6,zigzag(g['top']))+f_varint(7,g['adv'])
        gl+=f_bytes(3,body)
    stack=f_bytes(1,name.encode())+f_bytes(2,f'{start}-{end}'.encode())+gl
    return f_bytes(1,stack)
for name,wt in (('Oswald Light',300),('Oswald Regular',400),('Oswald Bold',700)):
    font=make_font(wt)
    d=os.path.join(OUT,name); os.makedirs(d,exist_ok=True)
    for s,e in ((0,255),(256,511)):
        data=encode(name,s,e,font)
        open(os.path.join(d,f'{s}-{e}.pbf'),'wb').write(data)
    print(name,'ok')
