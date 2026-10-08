# Music and sound design

Two sources, both normalised and muxed by render.mjs:

1. **Composed in code** by `score.js` inside the stage (drafts, and the fallback when there is no
   track): pads, bass, drums, arpeggios and sound effects. Original, so there is no licence to check.
2. **A licensed track the user provides** (recommended for anything posted; drop it in
   `<job>/music/`), with the cuts placed on its beats.

Never download music from the web for a video. If the user wants "real" music and has none,
suggest a licensed library they already use, and compose in code meanwhile.

**Be honest about the ceiling:** code-made music sounds like a synth demo. It is fine for drafts,
storyboard reviews and sound effects; for a video that will be posted, recommend a real track early.
The fastest route that worked: the user generates tracks in Suno (or similar) from a prompt you
write, and drops them in `music/`. You cannot operate Suno yourself. Mention
licensing: generated-music services restrict commercial use by plan, so the user checks the
current terms. A good prompt names style, bpm, key, "instrumental, no vocals", and a structure
with timed sections that mirror the shot list (calm intro under the explanation, the drop on the
key reveal, a clean fade under the logos). Genre requests (e.g. "epic with dubstep drops") are
worth steering: drops on one or two moments, not the whole video.

## Fitting a supplied track (what worked)

1. **Measure before choosing.** For each candidate: duration, tempo, beat grid, and the energy
   jumps (drops, breaks). librosa does it in one run:
   `uvx --from librosa --with numpy python` with `librosa.beat.beat_track`, a low-band (<120 Hz) and
   a high-band (>4 kHz) energy trace per 0.25 s around suspected drops, and
   `showspectrumpic=...:fscale=log` for a picture of the sections.
2. **Choose by structure, not by genre:** the track whose calm parts, drop and ending line up
   with the shot list wins. Say why in one line and offer the other.
3. **Re-time the video to the track:** land the single most important message on the drop
   (stretch that shot's internal times by a factor, `K = (drop - shotStart) / oldOffset`), then
   start every later shot on a beat from the beat grid (snap the planned times to the nearest beat).
   Shift each cut by under a second; stretch or compress a shot's internals, never the footage speed
   by more than ~15%.
4. **Let the track play alone (the default):** no `renderAudio`, no synth SFX; a produced track
   already has its own risers and hits. Use "SFX over a licensed track" below only on request.
5. Update `review-data.js` shot times after re-timing.

## Arranging a promo

Plan the timeline in bars once the tempo is chosen, then let the picture follow the music:

| Moment | Sound |
|---|---|
| Logo / first mark lands | `S.impact(t)` exactly on the frame it lands |
| Intro under the promise | a single sustained `S.pad`, no drums |
| First proof shot | `S.groove({... drums: 'half', arp: true })` enters: the video "starts" |
| Camera move or shot change | `S.whoosh(t - .3, .6)` so its peak meets the cut |
| A click or keypress on screen | `S.tick(t)` at the marker time from footage.json |
| A success state (a verified result) | `S.sparkle(t)` |
| The most important reveal | switch drums to `'four'`, or drop everything for 1 beat, then impact |
| Into the outro | `S.riser(outro - 1.6, 1.6)` then `S.impact(outro)` |
| Outro hold | one pad chord, fades by itself (render fades the last 1.2 s) |

Tempo: 100-120 bpm suits product and science promos; 124-128 for high energy. At 112 bpm a bar
is 2.14 s, which is about one caption; that is why 108-116 works so often. Minor keys (`i-VI-III-VII`)
feel cinematic and driven; major (`I-V-vi-IV`, pass `minor: false`) feels bright and friendly.

## Syncing to footage

Marker times in footage.json are the moments things happen on screen. Map them to stage time
(`APP0 + F.beat[key].t`) and hang ticks, sparkles and whooshes on them. If a cut should sit on a beat
but the footage marker is off by a fraction, move the caption and the camera, not the footage.

## SFX over a licensed track (only when the user asks)

```bash
node $SK/scripts/render.mjs stage.html --track music/track.mp3 --out promo.mp4
```

In the stage:

```js
// render.mjs awaits window.stageReady before the first frame, so beat times are known in time.
window.stageReady = (async () => {
  const info = await Score.analyze(window.TRACK_B64);   // { bpm, beats: [s...], duration }
  const S = Score.create({ bpm: info.bpm, duration: STAGE.duration });
  await S.useTrack(window.TRACK_B64, { gain: .85, offset: 0 });  // offset: skip a slow intro
  S.impact(info.beats[16]); S.whoosh(info.beats[32] - .3);         // SFX on its beats
  window.BEATS = info.beats;                                        // renderFrame can cut on these
  window.renderAudio = () => S.render();
})();
```

Snap shot boundaries to `info.beats`. Check the detected bpm against the track's stated bpm if
the user knows it; beat trackers can land on half or double time.

## Mixing

- Music under everything; SFX may peak above it for a moment, never sustain above it.
- render.mjs normalises to -14 LUFS, true peak -1.5 dB, and fades out the last 1.2 s.
- Check the result: `ffmpeg -i promo.mp4 -lavfi showspectrumpic=s=1200x300:scale=log spec.png`
  and read the picture against the shot list; `ebur128` for loudness.
