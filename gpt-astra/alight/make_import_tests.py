"""Tiny Alight Motion XML files, one feature each, to find which feature an app version refuses to import.

usage: python3 alight/make_import_tests.py <out_dir> <logo.png> [audio.wav]
"""
import hashlib, os, shutil, sys
out, logo = sys.argv[1], sys.argv[2]
audio = sys.argv[3] if len(sys.argv) > 3 else None
os.makedirs(out, exist_ok=True)
LS = hashlib.sha1(open(logo, 'rb').read()).hexdigest().upper(); shutil.copy(logo, os.path.join(out, f'{LS}.png'))
def scene(title, body, w=1080, h=1080, fps=30, total=3000, media=''):
    return ("<?xml version='1.0' encoding='UTF-8' ?>\n"
            f'<scene title="{title}" width="{w}" height="{h}" exportWidth="{w}" exportHeight="{h}" bgcolor="#FF000000" totalTime="{total}" fps="{fps}" '
            'modifiedTime="1792000000000" amver="1028425" ffver="106" am="com.alightcreative.motion/5.0.273.1028425" amplatform="android">\n'
            + media + body + '</scene>\n')
RECT = ('<shape id="1" label="Rectangle 1" startTime="0" endTime="3000" fillType="color" s=".rect"><transform><location value="540.000000,540.000000,0.000000"/></transform>'
        '<fillColor value="#FF10B981"/><property name="size" type="vec2" value="400.000000,400.000000"/></shape>\n')
T = {
 'T01_minimal_rect': scene('T01', RECT),
 'T02_text_inter': scene('T02', RECT.replace('</shape>\n', '</shape>\n') + '<text id="2" label="Text 1" startTime="0" endTime="3000" fillType="color" size="72.000000" font="googlefonts?name=Inter&amp;weight=400" wrapWidth="800" align="center"><transform><location value="540.000000,540.000000"/></transform><fillColor value="#FFFFFFFF"/><content>Hello</content></text>\n'),
 'T03_keyframes': scene('T03', '<shape id="1" label="Rectangle 1" startTime="0" endTime="3000" fillType="color" s=".rect"><transform><location><kf t="0.000000" v="300.000000,540.000000"/><kf t="1.000000" v="780.000000,540.000000"/></location><scale><kf t="0.000000" v="1.000000,1.000000"/><kf t="1.000000" v="0.500000,0.500000"/></scale><opacity><kf t="0.000000" v="0.000000"/><kf t="0.300000" v="1.000000"/></opacity></transform><fillColor value="#FF10B981"/><property name="size" type="vec2" value="300.000000,300.000000"/></shape>\n'),
 'T04_gradient': scene('T04', '<shape id="1" label="Light" startTime="0" endTime="3000" fillType="gradient" s=".rect"><transform><location value="540.000000,540.000000"/></transform><gradient type="radial" startColor="#EB0E7052" endColor="#000E7052" start="0.500000,0.500000" end="1.000000,0.500000"/><property name="size" type="vec2" value="800.000000,800.000000"/></shape>\n'),
 'T05_border_glow_shadow': scene('T05', '<shape id="1" label="Box" startTime="0" endTime="3000" fillType="color" s=".roundrect"><transform><location value="540.000000,540.000000"/></transform><fillColor value="#FF0B1513"/><border direction="centered" color="#8CA7F3D0" size="2.000000"/><glow direction="outside" color="#FF10B981" opacity="0.350000" size="14.000000" hardness="0.300000"/><shadow direction="outside" color="#000000" opacity="0.600000" size="40.000000" hardness="0.300000" offset="0.000000,20.000000"/><property name="size" type="vec2" value="700.000000,200.000000"/><property name="cornerRadius" type="float" value="36.000000"/></shape>\n'),
 'T06_custom_path': scene('T06', '<shape id="1" label="Pointer" startTime="0" endTime="3000" fillType="color"><transform><location value="540.000000,540.000000"/><scale value="6.000000,6.000000"/></transform><fillColor value="#FFFFFFFF"/><parameter><contour d="M 0 0 L 16.9 11.5 L 9.3 13.0 L 13.8 21.5 L 10.5 23.3 L 6.0 14.6 L 0 19.8 Z"/></parameter></shape>\n'),
 'T07_effects': scene('T07', '<text id="1" label="Glow text" startTime="0" endTime="3000" fillType="color" size="120.000000" font="googlefonts?name=Inter&amp;weight=400" wrapWidth="900" align="center"><transform><location value="540.000000,540.000000"/></transform><fillColor value="#FFFFFFFF"/><effect id="com.alightcreative.glow" locallyApplied="true"><property name="radius" type="float" value="36.000000"/><property name="alpha" type="float" value="0.800000"/><property name="color" type="color" value="#FF10B981"/></effect><effect id="com.alightcreative.effects.gaussianblur" locallyApplied="true"><property name="strength" type="float"><kf t="0.000000" v="0.200000"/><kf t="0.300000" v="0.000000"/></property></effect><content>Glow</content></text>\n'),
 'T08_nested_scene': scene('T08', '<embedScene id="1" label="Scene 1" startTime="0" endTime="3000"><transform><location value="540.000000,540.000000"/><scale><kf t="0.000000" v="1.000000,1.000000"/><kf t="1.000000" v="1.500000,1.500000"/></scale></transform>'
     '<effect id="com.alightcreative.effects.motionblur4" locallyApplied="true"><property name="tune" type="float" value="0.600000"/></effect>'
     '<scene title="Scene 1" width="1080" height="1080" exportWidth="1080" exportHeight="1080" bgcolor="#00000000" totalTime="3000" fps="30" ffver="106" amver="1028425" am="com.alightcreative.motion/5.0.273.1028425" amplatform="android">' + RECT.replace('id="1"', 'id="2"') + '</scene></embedScene>\n'),
 'T09_media_logo': scene('T09', f'<shape id="1" label="Logo" startTime="0" endTime="3000" fillType="media" fillImage="am-internal:///{LS}.png" mediaFillMode="fit" s=".rect"><transform><location value="540.000000,540.000000"/></transform><property name="size" type="vec2" value="400.000000,400.000000"/></shape>\n',
     media=f'<media uri="am-internal:///{LS}.png" filename="{LS}.png" title="chatgpt_logo_white" type="image/png" size="{os.path.getsize(logo)}" sig="{LS}" width="1024" height="1024"/>\n'),
 'T11_1920x1080_60fps_long': scene('T11', RECT.replace('3000', '14600').replace('540.000000,540.000000', '960.000000,540.000000'), w=1920, h=1080, fps=60, total=14600),
}
if audio:
    AS = hashlib.sha1(open(audio, 'rb').read()).hexdigest().upper(); shutil.copy(audio, os.path.join(out, f'{AS}.wav'))
    T['T10_audio'] = scene('T10', RECT + f'<audio id="2" label="Audio" startTime="0" endTime="3000" src="am-internal:///{AS}.wav" inTime="0" outTime="3000"/>\n',
                           media=f'<media uri="am-internal:///{AS}.wav" filename="{AS}.wav" title="reference_audio" type="audio/wav" size="{os.path.getsize(audio)}" duration="14017" sig="{AS}"/>\n')
for k, v in T.items(): open(os.path.join(out, k + '.xml'), 'w').write(v)
print('\n'.join(sorted(T)))
