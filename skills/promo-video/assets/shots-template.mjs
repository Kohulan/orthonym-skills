// shots.mjs -- what to film in the real app. Run: node <skill>/scripts/capture.mjs shots.mjs --outdir footage
// Every `mark` is a marker the stage can hang a caption and a camera move on;
// give it the selectors to frame and the stage zooms to their union rect.
// Pace for the viewer, not the machine: a marker needs ~2.5-4 s of screen time to read.
export default {
  url: 'https://example.org',
  viewport: { width: 1080, height: 1000 },    // >= the site's desktop breakpoint; the stage scales it into a window
  // Warm caches before filming so results land instantly on camera (optional).
  warm: async page => {
    // await page.evaluate(() => fetch('/api/whatever', { method: 'POST', body: '...' }));
  },
  steps: async ({ page, mark, moveTo, click, type, scroll, wait }) => {
    await wait(3000);                                          // let the page's own entrance play
    await mark('input', ['#search']);
    await type('#search', 'caffeine');
    await click('button[type=submit]');
    await page.locator('.result').first().waitFor();
    await mark('result', ['.result'], 40);
    await wait(3500);
    await moveTo('.result .detail');
    await mark('detail', ['.result .detail'], 60);
    await wait(3500);
    await scroll('bottom', 1600);
    await mark('more');
    await wait(3000);
  },
};
