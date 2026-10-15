import cv2, numpy as np, json, sys
R=sys.argv[1]; out=sys.argv[2]
N=420; rows=[]; prev=None; prevg=None
orb=cv2.ORB_create(3000, fastThreshold=8)
for i in range(1,N+1):
    im=cv2.imread(f'{R}/{i:03d}.png').astype(np.float32)
    b,g,r=im[...,0],im[...,1],im[...,2]
    Y=0.299*r+0.587*g+0.114*b
    gray=Y.astype(np.uint8)
    row={'f':i-1,'t':round((i-1)/30,4),'Ymean':float(Y.mean())}
    # cut metric
    row['diff']=float(np.abs(Y-prev).mean()) if prev is not None else 0.0
    # bright (white UI/text) mask: high luma, low saturation
    sat=(np.max(im,2)-np.min(im,2))
    m=(Y>140)&(sat<60)
    row['brightArea']=int(m.sum())
    if m.sum()>30:
        ys,xs=np.nonzero(m)
        x0,x1=np.percentile(xs,[0.5,99.5]); y0,y1=np.percentile(ys,[0.5,99.5])
        row.update(bx0=float(x0),bx1=float(x1),by0=float(y0),by1=float(y1),cx=float(xs.mean()),cy=float(ys.mean()))
        crop=gray[int(y0):int(y1)+1,int(x0):int(x1)+1]
        row['sharp']=float(cv2.Laplacian(crop,cv2.CV_64F).var())
        row['peakY']=float(np.percentile(Y[m],95))
    # warm light (accent glow): r dominant
    w=np.clip(r-b-15,0,None)*(Y<170)
    W=w.sum()
    if W>1e3:
        yy,xx=np.mgrid[0:720,0:1280]
        lx=float((w*xx).sum()/W); ly=float((w*yy).sum()/W)
        sx=float(np.sqrt((w*(xx-lx)**2).sum()/W)); sy=float(np.sqrt((w*(yy-ly)**2).sum()/W))
        row.update(lx=lx,ly=ly,lsx=sx,lsy=sy,lE=float(W/1e6),lmax=float(w.max()))
    # camera: similarity between prev and this frame on feature points
    if prevg is not None and row['diff']<25:
        k1,d1=orb.detectAndCompute(prevg,None); k2,d2=orb.detectAndCompute(gray,None)
        if d1 is not None and d2 is not None and len(k1)>20 and len(k2)>20:
            bf=cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True); ms=bf.match(d1,d2)
            if len(ms)>=12:
                p1=np.float32([k1[x.queryIdx].pt for x in ms]); p2=np.float32([k2[x.trainIdx].pt for x in ms])
                M,inl=cv2.estimateAffinePartial2D(p1,p2,method=cv2.RANSAC,ransacReprojThreshold=2.0)
                if M is not None and inl.sum()>=10:
                    s=float(np.hypot(M[0,0],M[1,0])); row.update(ds=s,dtx=float(M[0,2]),dty=float(M[1,2]),inl=int(inl.sum()))
    prev=Y; prevg=gray; rows.append(row)
json.dump(rows,open(out,'w'))
print('ok',len(rows))
