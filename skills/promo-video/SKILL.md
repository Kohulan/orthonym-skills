---
name: promo-video
description: Make promotional, launch and explainer videos as code - motion graphics, kinetic type, real product screen footage, 3D (three.js), fluid ink simulations and a composed soundtrack - rendered frame-exact to MP4 for LinkedIn, X, YouTube, Instagram, talks or a website. Use this skill whenever the user wants any kind of promo video, teaser, showreel, launch or announcement video, product demo video, animated explainer, "a small video for my LinkedIn post", a video for a paper, tool, app or release, or wants to improve, re-cut, restyle or add music to one, even if they only say "make a video" or "something to post". Starts with a short interview, storyboards before animating, and ships a review page for comments.
---

# Promo video

A video here is a web page: HTML, CSS and JavaScript on a fixed-size stage, where every frame is
a pure function of time. `scripts/render.mjs` calls `renderFrame(t)` frame by frame, screenshots
each one into ffmpeg, and muxes a soundtrack the stage composed in code. That makes the video
deterministic, editable like code, and as sharp as the browser can draw.

The work runs in three levels (after "The 3 Levels of AI Motion Graphics", RoboNuggets):
1. **One-shot:** build the whole video from one brief. Fast; good for showreels and tests.
2. **Storyboard (the default):** stills of every shot with timings, which the user comments on
   before anything moves. It catches the wrong video a third of the way in instead of at the end.
3. **Directing:** the user reviews the real video on a review page, pinning comments to moments
   (picture and sound) and moving cuts, then you apply exactly those changes.

Default to Level 2. Go straight to Level 1 only when the user asks for it ("just make it",
"surprise me", "one-shot", a showreel).

## Step 0 - Research, then interview

Before asking anything, learn what you can: read the project's README, website, design tokens
(CSS custom properties, a design system file), and find logos and brand assets (`public/`,
`assets/`, `docs/`, `logos/`). If a live site exists, look at it. Questions are for what cannot be
looked up, and they are cheaper when you can offer the right options.

Then interview with the question picker (`AskUserQuestion`), 2-4 questions per round, each with a
recommended option first and enough context to pick fast. Keep asking in rounds until every item
below has a clear answer: an answer that raises a new question (a free-text note, a constraint
such as "no blue", a choice that conflicts with the brand or with chemistry conventions) gets
its own follow-up round before you build anything. Skip any question the conversation or the
research already answered, and never ask for what you could look up. Cover:

- **Goal and message:** what the video must make a viewer think or do; the one-line promise.
- **Where it runs:** platform and format (see `references/motion-craft.md`; default LinkedIn 4:5).
- **Length:** 15 s teaser / 30-45 s feature / 60 s walk-through.
- **Audience:** peers in the field, customers, general public, funders.
- **Facts:** the real features, numbers and claims to show, and the call to action (URL, button).
  Ask for them; never invent them. Offer the ones you found and let the user correct.
- **Brand:** confirm the logos, colours and fonts you found; partner logos only if stated.
- **Footage:** is there a live app or site to film, and which flow shows it best?
- **Sound:** for anything that will be posted, recommend a real track (the user generates one in
  Suno or picks a licensed one, from a prompt you write) and fit the cuts to it
  (`references/music.md`, "Fitting a supplied track"). Code-made music with a mood is the fallback
  and fine for drafts; be upfront that it sounds synthetic.
- **Look and energy:** calm and premium vs bold and fast; 3D and fluids used where they carry
  the story (default), everywhere, or not at all.
- **Colour scheme:** always ask, with a small preview per option (the picker's `preview` field):
  the brand's own palette first, then 2-3 real alternatives (dark vs light ground, accent sets).
  Treat any colour the user rules out as a hard constraint everywhere you draw, 3D materials
  and fluid ink included; footage of a real product keeps its real colours, so say so.
- **Fonts:** always ask, previewing each pairing (headline / text / label): the brand's own fonts
  first, then 2-3 alternatives with a different character (condensed, heavy sans, grotesk, serif).

Write the answers into `brief.md` in the job folder: message, audience, format, length, facts
(verbatim, with where each came from), CTA, brand, footage plan, sound, look. Show it in one
short summary and continue unless the user objects.

## Step 1 - Job folder and tools

```bash
SK=<this skill's base directory>          # e.g. ~/.claude/skills/promo-video
JOB=~/Movies/promo-videos/<slug>          # outside any git repo: frames and renders are large
mkdir -p "$JOB" && cd "$JOB"
cp $SK/assets/{stage-template.html,stage-kit.js,fluid.js,score.js} . && mv stage-template.html stage.html
bash $SK/scripts/setup.sh                 # finds or fetches Chrome, playwright-core, ffmpeg
```

Copy the project's logos and assets into `$JOB/assets/`. Keep everything the stage loads next to it;
the stage is opened from `file://`.

## Step 2 - Storyboard (Level 2)

1. Write a beat sheet in `brief.md`: shots with start time, duration, caption, what moves, sound.
   Plan it in bars of the chosen tempo so cuts can land on beats (`references/music.md`).
2. Build `stage.html` in the **final look**: layout, type, colours, logos, 3D objects placed, but
   motion can be rough. Read `references/motion-craft.md` first; read
   `references/3d-and-fluids.md` if a shot uses three.js or fluid ink.
3. Render one still per shot at the moment that best shows it:
   `node $SK/scripts/render.mjs stage.html --stills 0.6,4.2,8.0 --outdir board`
4. Copy `$SK/assets/storyboard.html` into the job and write `board-data.js`:
   `window.BOARD = { title, format, duration, shots: [{ id, t, img, title, desc, sound }] }`.
5. `open storyboard.html` and stop. Tell the user: click a still to pin a comment, then
   **Copy all comments** and paste them back.

Comments come back as lines like `Shot 07, 5.90s, pin at 52% across, 46% down: less text heavy`.
Apply every comment and change nothing else, re-render the affected stills, and ask for another
pass or approval. Approval is the user saying so, or a pasted "No comments: the storyboard is approved."

## Step 3 - Footage (when there is a live product)

Copy `$SK/assets/shots-template.mjs` to `shots.mjs`, script the flow, and run
`node $SK/scripts/capture.mjs shots.mjs --outdir footage`. Each `mark(key, selectors)` is a beat the
stage hangs a caption and a camera zoom on. In the stage:
`const F = Kit.footage(window.DATA.footage, [['start', 1, null], ['result', 1.6, null], ...])`,
then `await F.apply(img, t - APP0, windowWidth)` inside `renderFrame`, and render with
`--data footage=footage/footage.json`. Present footage in a floating browser window with captions
in a band above it (motion-craft.md, "Real product footage").

## Step 4 - Build the motion and the sound

- Animate with `Kit` (`tween`, `ease`, `riseLines`, `timeline`, `stepper`): everything from `t`.
- Compose with `Score` in the stage and set `window.renderAudio = () => S.render()`
  (`references/music.md`). For a user track, render with `--track music/<file>`.
- Preview sections quickly while working: `render.mjs stage.html --out part.mp4 --from 8 --to 16 --fps 15`.
- Self-check before showing anything (motion-craft.md, "Self-check"): contact sheet, full-size
  frames at each beat, spectrogram, loudness, no PAGE ERRORS. Look at the images; do not assume.

Renders are fast (a 60 s video with 3D is typically 1-3 minutes). Run anything longer than about
two minutes in the background and keep working or report status.

## Step 5 - Review (Level 3)

1. Full render: `node $SK/scripts/render.mjs stage.html --out review.mp4` (add `--data`, `--track`).
2. Copy `$SK/assets/review.html` into the job, write `review-data.js`:
   `window.REVIEW = { title, video: 'review.mp4', fps: 30, scenes: [{ id, title, start, end }] }`.
3. `open review.html`. The user plays it at 1x or 2x, clicks the picture to pin notes, adds sound
   notes, moves scene starts and ends to the playhead, and pastes back **Copy all**.
4. Apply every note and trim, change nothing else, re-render, and let them review again. Do not
   make the final render until the user says the version is done.

## Step 6 - Final delivery

- Render the final: `render.mjs stage.html --out <slug>.mp4` (add `--ss 2` for crisper thin lines).
- Save a cover image at the frame that sells the video best (the platform lets the user pick it):
  `ffmpeg -ss <t> -i <slug>.mp4 -frames:v 1 <slug>-cover.png`.
- Copy both to the Desktop (or where the user wants them) and report: length, size, format, where.
- Offer post text in the user's voice, built only from the brief's facts.

## Reusable elements

When the user likes a piece (a logo reveal, a transition, a window treatment), save it to
`~/Movies/promo-videos/_library/<name>/` as a small stage snippet with a note on how to reuse it,
and check the library at the start of the next job.

## Things that bite

- **macOS privacy:** files in `~/Downloads`, `~/Desktop` or `~/Documents` may be unreadable
  ("Operation not permitted"). Ask the user to move the file into the job folder.
- **Blank 3D or fluid canvas:** read the PAGE ERRORS render.mjs prints; see 3d-and-fluids.md,
  "Headless GPU".
- **Fonts:** load them with `display=block`; render.mjs waits for `document.fonts.ready`.
- **A site that looks different on real devices** (WebGPU, touch, 120 Hz): the capture is a desktop
  Chrome; say so if the promo claims tablet or phone behaviour.
- **Honesty:** only real UI, real facts, real partners. A promo that overstates is a liability for
  the person who posts it.
