import cv2, numpy as np, json, sys
R=sys.argv[1]
orb=cv2.ORB_create(8000, fastThreshold=5, nlevels=12, scaleFactor=1.15)
def g(i): return cv2.imread(f'{R}/{i+1:03d}.png',0)
A=g(87); kA,dA=orb.detectAndCompute(A,None)
def fit(p1,p2):
    # scale + translation only (no rotation), RANSAC
    best=None; rng=np.random.default_rng(0)
    for _ in range(3000):
        i,j=rng.choice(len(p1),2,replace=False)
        d1=p1[i]-p1[j]; d2=p2[i]-p2[j]; n1=np.linalg.norm(d1)
        if n1<20: continue
        s=np.linalg.norm(d2)/n1; t=p2[i]-s*p1[i]
        r=np.linalg.norm(p2-(s*p1+t),axis=1); inl=r<2.0
        if best is None or inl.sum()>best[0]: best=(inl.sum(),inl)
    inl=best[1]; P,Q=p1[inl],p2[inl]
    # least squares refine
    X=np.zeros((2*len(P),3)); X[0::2,0]=P[:,0]; X[0::2,1]=1; X[1::2,0]=P[:,1]; X[1::2,2]=1
    y=Q.reshape(-1); sol=np.linalg.lstsq(X,y,rcond=None)[0]
    return sol, int(inl.sum())
out=[]
for i in range(68,212):
    B=g(i); kB,dB=orb.detectAndCompute(B,None)
    ms=cv2.BFMatcher(cv2.NORM_HAMMING,crossCheck=True).match(dA,dB)
    p1=np.float32([kA[m.queryIdx].pt for m in ms]); p2=np.float32([kB[m.trainIdx].pt for m in ms])
    (s,tx,ty),n=fit(p1,p2)
    cx,cy=s*640+tx,s*360+ty
    out.append(dict(f=i,t=round(i/30,4),s=float(s),cx=float(cx),cy=float(cy),inl=n))
    print('f%d %.3f s=%.4f c=(%.1f,%.1f) inl=%d'%(i,i/30,s,cx,cy,n))
json.dump(out,open(sys.argv[2],'w'))
