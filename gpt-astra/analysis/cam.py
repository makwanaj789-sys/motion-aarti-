import cv2, numpy as np, json, sys
R=sys.argv[1]; out=sys.argv[2]
orb=cv2.ORB_create(5000, fastThreshold=6)
def g(i): return cv2.imread(f'{R}/{i+1:03d}.png',0)
def est(a,b):
    k1,d1=orb.detectAndCompute(a,None); k2,d2=orb.detectAndCompute(b,None)
    ms=cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True).match(d1,d2)
    p1=np.float32([k1[x.queryIdx].pt for x in ms]); p2=np.float32([k2[x.trainIdx].pt for x in ms])
    M,inl=cv2.estimateAffinePartial2D(p1,p2,method=cv2.RANSAC,ransacReprojThreshold=1.5,maxIters=5000,confidence=0.999)
    return np.vstack([M,[0,0,1]]),int(inl.sum())
segs={'ui':(68,211,87),'code':(215,257,240)}
res={}
for name,(a,b,anchor) in segs.items():
    # chain transforms frame->frame, express each frame relative to anchor: T_i maps anchor coords -> frame i coords
    T={anchor:np.eye(3)}; inl={}
    for i in range(anchor+1,b+1):
        M,n=est(g(i-1),g(i)); T[i]=M@T[i-1]; inl[i]=n
    for i in range(anchor-1,a-1,-1):
        M,n=est(g(i+1),g(i)); T[i]=M@T[i+1]; inl[i]=n
    rows=[]
    for i in range(a,b+1):
        M=T[i]; s=float(np.hypot(M[0,0],M[1,0]))
        # screen position of anchor-frame centre point
        c=M@np.array([640,360,1.0])
        rows.append(dict(f=i,t=round(i/30,4),s=s,cx=float(c[0]),cy=float(c[1]),rot=float(np.degrees(np.arctan2(M[1,0],M[0,0]))),inl=inl.get(i,0)))
    res[name]=rows
json.dump(res,open(out,'w'))
for name in res:
    print(name)
    for r in res[name]: print(' f%d %.3f s=%.4f c=(%.1f,%.1f) rot=%.2f inl=%d'%(r['f'],r['t'],r['s'],r['cx'],r['cy'],r['rot'],r['inl']))
