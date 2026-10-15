import sys
from PIL import Image, ImageDraw
R,out=sys.argv[1],sys.argv[2]
tw,th,cols,per=320,180,5,30
for s in range(0,420,per):
    S=Image.new('RGB',(cols*tw,(per//cols)*th),(60,60,60))
    for k in range(per):
        f=s+k
        if f>=420: break
        im=Image.open(f'{R}/{f+1:03d}.png').convert('RGB').resize((tw,th))
        x,y=(k%cols)*tw,(k//cols)*th; S.paste(im,(x,y))
        ImageDraw.Draw(S).text((x+3,y+2),f'f{f} {f/30:.3f}s',fill=(255,255,0))
    S.save(f'{out}/s{s:03d}.png')
