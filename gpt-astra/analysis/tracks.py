import cv2, numpy as np, json, sys
R=sys.argv[1]; out=sys.argv[2]
def load(i):
    im=cv2.imread(f'{R}/{i+1:03d}.png').astype(np.float32); b,g,r=im[...,0],im[...,1],im[...,2]
    Y=0.299*r+0.587*g+0.114*b; sat=np.max(im,2)-np.min(im,2); return im,b,g,r,Y,sat
def blob(m):
    if m.sum()<15: return None
    ys,xs=np.nonzero(m); return dict(cx=float(xs.mean()),cy=float(ys.mean()),x0=float(np.percentile(xs,1)),x1=float(np.percentile(xs,99)),y0=float(np.percentile(ys,1)),y1=float(np.percentile(ys,99)),n=int(m.sum()))
res={}
# moon (0-0.733): bright, round
res['moon']=[]
for i in range(0,23):
    im,b,g,r,Y,sat=load(i); m=(Y>170)&(sat<70)
    # keep the largest connected component (moon) not clouds
    n,lab,st,cen=cv2.connectedComponentsWithStats(m.astype(np.uint8))
    if n>1:
        k=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); x,y,w,h,a=st[k]; res['moon'].append(dict(f=i,cx=float(cen[k][0]),cy=float(cen[k][1]),w=int(w),h=int(h),area=int(a),Ymax=float(Y.max())))
# logo (orange star)
res['logo']=[]
for i in list(range(22,70))+list(range(350,392)):
    im,b,g,r,Y,sat=load(i); m=(r>140)&(r-b>45)&(Y>80)
    o=blob(m)
    if o: o['f']=i; o['Ymean']=float(Y.mean()); res['logo'].append(o)
# white text / letters for brand + words; column segmentation into glyph runs
res['white']=[]
for i in list(range(36,70))+list(range(256,352)):
    im,b,g,r,Y,sat=load(i); m=(Y>110)&(sat<90)&~((r>140)&(r-b>45)&(i<70))
    o=blob(m)
    if not o: continue
    col=m.sum(0)>0; runs=[]; x=0
    while x<1280:
        if col[x]:
            s=x
            while x<1280 and col[x]: x+=1
            runs.append([s,x])
        else: x+=1
    # glyph intensity (mean Y of mask) and glow (warm halo energy around text)
    o.update(f=i,runs=runs,meanY=float(Y[m].mean()),warm=float(np.clip(r-b-20,0,None)[m].mean()),sharp=float(cv2.Laplacian(Y.astype(np.uint8),cv2.CV_64F)[int(o['y0']):int(o['y1'])+1,int(o['x0']):int(o['x1'])+1].var()))
    res['white'].append(o)
json.dump(res,open(out,'w'))
print({k:len(v) for k,v in res.items()})
