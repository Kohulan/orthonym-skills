# Review on the pin board

Contents: publish, read a round back, apply and close, notes.

`assets/board.html` is a claude.ai artifact page: the render on a scrollable board, click to drop a
numbered pin with a note, a list of marks, zoom buttons, and a "Done, send to Claude" button that
posts the open pins as one comment sent to the Claude session. Pins live in the artifact's database
(`db` capability) and survive reloads and republishes.

## Publish

1. Load the `artifact-capabilities` skill (the page uses `db`, `user`, `comments`).
2. Render the poster at 110 dpi to one JPEG (`board.jpg`, under about 2 MB, quality 80–85).
3. Copy `assets/board.html` to the scratch folder; replace `{{TITLE}}` (a short name, e.g.
   "Poster Markup") and `{{ALT}}` (what the image shows). Nothing else changes.
4. Publish once: `Artifact` with `file_path`, `files: {"board.jpg": "<path>"}`,
   `capabilities: {"db": {}, "user": {}, "comments": {}}`, `icon: "pin"`, a one-line description.
5. Verify once with `ArtifactData` `list` on collection `pins` (empty on a new board is the expected
   answer). Hand over the link and say: click to drop a pin, zoom for small text, click a pin to edit,
   mark done or delete; press "Done, send to Claude" when the round is complete. The send asks once
   for permission to comment as the user; the first send cannot be tested from the session, say so,
   and "the pins are there" in chat works as a fallback.

## Read a round back

A round arrives as a comment sent to Claude (text "Markup round: ... Pin N (row, col; x A%, y B%):
note") or as the user saying the pins are there. The database is the source of truth either way:

```
ArtifactData query  url=<board>  collection=pins  query={"order_by":{"field":"n"},"limit":200}
```

Each document is `{n, x, y, note, done, created}` with `x`, `y` in percent of the image width and
height. Convert before deciding what a pin points at: on a slide of W × H inches,
`x_in = x/100 * W`, `y_in = y/100 * H`; compare with the shapes' x, y, w, h in the build script. When
the note alone is ambiguous ("remove this"), crop a 400 px window around the point from the render
and look at it. Only open pins (`done: false`) are the request. A note that needs the user's
decision gets one question with a default; everything else is applied.

## Apply and close

1. Apply the changes in the build script, rebuild, render, run the usual QA.
2. Re-render `board.jpg` from the new build and republish the page with the same `file_path` (or
   `url`) and `files: {"board.jpg": ...}`; omit `capabilities` so the declaration carries over. Pins
   keep their percent positions, so they stay aligned with the new render.
3. Mark the applied pins done in one batch, pinned to the versions read above:
   `ArtifactData batch writes=[{op:"update", collection:"pins", doc_id:"001", data:{done:true}, if_version:<v>}, ...]`.
   A pin not applied (declined, needs a decision) stays open; say why in the report.
4. If the round came in as a comment, reply in that thread (`ArtifactComments`, loaded with
   ToolSearch) with one line per pin; otherwise report in chat as a numbered list by pin number.
5. Copy the deliverables to `poster/` as the README says.

## Notes

- Document ids are zero-padded pin numbers (`001`); numbers are never reused after a deletion.
- The board is private to its owner unless shared from its Share menu; "send to Claude" works for
  editors only, and only while a session that published or read the artifact is running.
- To start a clean sheet, delete the `pins` documents with a batch; do not publish a new URL.
- Without the Artifact tool, send the preview image in chat and take the changes as a numbered list.
