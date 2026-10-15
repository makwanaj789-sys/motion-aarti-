import cv2, numpy as np, json, sys
R=sys.argv[1]; out=[]
for i in range(420):
    im=cv2.imread(f'{R}/{i+1:03d}.png').astype(np.float32)
    b,g,r=im[...,0],im[...,1],im[...,2]; Y=0.299*r+0.587*g+0.114*b
    w=np.clip(r-b,0,None); w[Y>90]=0         # drop text/UI
    w=cv2.resize(w,(160,90),interpolation=cv2.INTER_AREA); w=cv2.GaussianBlur(w,(0,0),3)
    pk=float(w.max()); 
    if pk<2: out.append(dict(f=i,peak=pk)); continue
    py,px=np.unravel_index(np.argmax(w),w.shape)
    m=w>0.5*pk; ys,xs=np.nonzero(m)
    out.append(dict(f=i,peak=round(pk,1),px=round(px/160,3),py=round(py/90,3),cx=round(float(xs.mean())/160,3),cy=round(float(ys.mean())/90,3),
        hw=round(float(xs.max()-xs.min())/160,3),hh=round(float(ys.max()-ys.min())/90,3),area=round(float(m.mean()),3),
        floor=round(float(np.percentile(Y,10)),1)))
json.dump(out,open(sys.argv[2],'w'))
for o in out[::3]: print(o)
