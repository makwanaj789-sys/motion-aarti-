# GPT Astra 6 v3: Alight Motion package

Project specs: 1920×1080, 60 fps, 14.6 s. The video is a fan-made concept, made by @h81t6.

## Folders

| Folder / file | Contents |
|---|---|
| `XML/GPT_Astra_6_v3_SAFE.xml` | Main project: logo image + audio linked |
| `XML/GPT_Astra_6_v3_SAFE_NOMEDIA.xml` | Same project without image/audio links. The logo layers are white circles named "(placeholder …)" |
| `Media/chatgpt_logo_white.png` | ChatGPT logo (white, transparent, 1024 px). The project uses this one |
| `Media/AF8B34922D2788986F96F693A55C786BB9F96071.png` | Same logo under the name the XML stores internally |
| `Media/chatgpt_logo_white_2048.png`, `_green_1024`, `_black_1024` | Extra sizes and colours, for your own edits |
| `Media/reference_audio.wav` (and `81FA0DA2….wav`) | The reference video's original song, 14.0 s |
| `Fonts/` | Inter (Regular, Medium, SemiBold), Fraunces Regular and Fraunces Variable, with their OFL licences |

## Fonts per layer

| Font | Layers |
|---|---|
| **Fraunces Regular** (400) | "ChatGPT" wordmark letters, "Welcome", outro "GPT Astra 6" |
| **Inter Regular** (400) | Typing/placeholder, chips, model notes, Thinking / Medium, all code lines, prompt, "Writing", "& analysis", "Coding", "Research", "FAN-MADE CONCEPT" |
| **Inter Medium** (500) | Selector label (GPT-6 / GPT Astra 6), model names, "Created by @h81t6", selector arrow › |
| **Inter SemiBold** (600) | CONCEPT tag |

The XML loads these fonts through Alight Motion's Google Fonts. If a phone has no internet or a font does not load:
1. Install the TTF from `Fonts/`, or use the text layer's Font → import font from file.
2. Pick it for the layers listed above.

`Fraunces-Regular.ttf` is a static file made from the variable font (optical size 14, weight 400). It is the closest match to the video.

## Text size fix (15 Oct)

The first XML made all text about 3× too big, so the letters overlapped. Alight Motion's text size unit is not a pixel: it is (shorter canvas side ÷ 360) px, so 3 px on a 1080p canvas. Every text size is now divided by 3, and the vertical position was corrected from a measurement in the app.

## Import

1. Unzip the package on your phone.
2. Open `XML/GPT_Astra_6_v3_SAFE.xml` with Alight Motion.
3. If a layer shows missing media, replace it:
   - logo layers → `Media/chatgpt_logo_white.png`
   - audio → `Media/reference_audio.wav`
4. For the NOMEDIA version: set the fill of the 5 "(placeholder …)" circles to the logo PNG (Fill → Image), and add `reference_audio.wav` as audio at 0 s.

## Notes

- Licence status of the song: unknown, so confirm the music rights before posting publicly.
- The ChatGPT/OpenAI logo is OpenAI's trademark. The video is labelled fan-made.
- The SAFE build has no blur or glow effects and no ring around the menu, because the first full version (which had them) did not import on your phone. You can add a Glow effect in Alight Motion yourself if you want it.
