# Motion craft for promo videos

Read this before designing the storyboard. It is the taste layer: what makes a promo read
clearly on a phone, with the sound off, in the two seconds before someone scrolls past.

## Formats

| Where it runs | Size (px) | Ratio | Notes |
|---|---|---|---|
| LinkedIn / Instagram feed | 1080x1350 | 4:5 | Default. Takes the most feed height on a phone. |
| Square fallback | 1080x1080 | 1:1 | When the same file must go everywhere. |
| Reels, Shorts, Stories, TikTok | 1080x1920 | 9:16 | Keep text out of the top 220 px and bottom 380 px (platform UI). |
| YouTube, talks, websites, email | 1920x1080 | 16:9 | Landscape; captions can be smaller (min 36 px). |

Render at 30 fps, H.264 High, yuv420p, `+faststart`, AAC 48 kHz at -14 LUFS (render.mjs does
all of this). LinkedIn plays video muted by default and most people never unmute: the video
must tell its whole story with the sound off. Sound is a bonus layer, never the carrier.

Length: 15 s teaser, 30-45 s feature promo, 60 s maximum for a product walk-through. The
first 2 seconds decide whether anyone stays: open on motion and the promise, not on a logo
sitting still.

## Structure that works

1. **Hook (0-3 s):** the brand mark arriving with energy, or the single most striking visual.
2. **Promise (one line):** what it does, in the viewer's words.
3. **Proof beats (2-5 beats, 3-6 s each):** each beat shows ONE real thing, with ONE caption.
4. **The differentiator:** the thing competitors cannot show.
5. **Call to action (last 5-7 s):** logo, URL as a pill, one line, partner logos. Hold it long
   enough to read the URL twice.

## Captions

- One idea per caption, at most 2 lines, at most ~32 characters a line.
- Reading time: about 0.4 s per word + 0.8 s, so a 7-word caption needs ~3.6 s on screen.
- Size at 1080 wide: headline 56-72 px, body 36-40 px minimum. Test by viewing the frame at
  phone size (scale the PNG to 390 px wide): if you squint, it is too small.
- Highlight one word per caption in the accent colour; not more.
- Put captions **outside** the content they describe (a band above a window, a side panel),
  never over the UI or molecule you are showing. If a caption must overlay, move it to
  whichever edge the content is not using at that moment.

## Timing and easing

- Entrances: 0.5-0.8 s, `outQuint` or `out`. Exits: 0.3-0.4 s, `in` or `inOut`, faster than the
  entrance. Stagger lines 60-100 ms and letters 20-35 ms.
- Nothing moves linearly except continuous drift (a background, a slow rotation).
- Overshoot (`back`, `spring`) only on small objects that "land": a pill, an icon, a lamp.
- Hold every finished state for at least 1 s before the next move. Motion only reads against
  stillness.
- Camera moves: 1.0-1.2 s `inOut`. Zoom 1.5-2.3x to a detail. Never zoom and scroll at once.
- Align cuts and hits to the music's beats (Score.bar / S.snap). An impact exactly on a logo
  landing is worth more than any amount of extra motion.

## Transitions worth using

- **Mask reveal:** lines rise through an overflow-hidden box (Kit.riseLines).
- **Match cut:** an element in scene A becomes an element in scene B (the logo glass becoming the
  "O" of the wordmark).
- **Ink wipe:** large fluid splats flood the frame, the next scene appears under them as they fade.
- **3D fly-through:** the camera dollies into an object and out the other side into the next scene.
- **Window tilt:** a browser window rises from below with a perspective tilt that flattens out.

## Real product footage

- Film the live product with capture.mjs (never fake UI). Warm caches first so results land at
  once; let the page's own entrance animation play; pace each beat 2.5-4 s.
- Film at DPR 2; present inside a floating browser window (title bar, URL pill, soft shadow) on
  a branded background. That window, plus captions in a band above it, is the proven layout.
- Zoom the camera to the feature each caption talks about. Record the zoom target as a marker rect.
- A visible pointer with a click ripple makes the interaction legible; move it with easing.

## Brand and honesty

- Use the project's real logos, colours and fonts. Look for them in the repo first
  (`public/`, `docs/`, `assets/`, CSS custom properties) before asking.
- A black logo on a dark ground: `filter: invert(1)`. A logo PNG on a white box over a light
  ground: `mix-blend-mode: multiply` drops the white.
- Every claim, number and feature in a caption must come from the brief the user confirmed or
  the product itself. Never invent a statistic, testimonial, customer or partner. Partner logos
  only where the partnership is stated in the project.

## Self-check before showing anything

1. Contact sheet every 2-2.5 s (`ffmpeg -vf "fps=1/2.5,scale=270:-1,tile=8x4"`): pacing, gaps.
2. Full-size frames at every beat's midpoint: legibility, caption collisions, cut-off content.
3. The first frame and a cover frame (the moment that best sells it) as PNGs.
4. Spectrogram (`showspectrumpic`) against the beat sheet: hits land where planned.
5. Loudness: `ffmpeg -i out.mp4 -af ebur128=framelog=quiet -f null -` reads about -14 LUFS.
6. render.mjs printed no PAGE ERRORS.
