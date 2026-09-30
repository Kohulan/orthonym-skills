// Shared plumbing: finds the tools setup.sh prepared and launches Chrome with
// the flags a stage needs (file access, GPU for WebGL/WebGPU).
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const SKILL = path.resolve(HERE, '..');
export const ASSETS = path.join(SKILL, 'assets');

let tools;
export function getTools() {
  if (tools) return tools;
  const out = execFileSync('bash', [path.join(HERE, 'setup.sh')], { encoding: 'utf8' });
  tools = Object.fromEntries(out.trim().split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
  return tools;
}

export async function launch({ headless = true } = {}) {
  const t = getTools();
  const { chromium } = await import(path.join(t.NODE_MODULES, 'playwright-core', 'index.mjs'));
  return chromium.launch({
    executablePath: t.CHROME, headless,
    args: ['--allow-file-access-from-files', '--enable-unsafe-webgpu', '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization', '--autoplay-policy=no-user-gesture-required'],
  });
}

export function args(argv = process.argv.slice(2)) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; o[k] = v; }
    else o._.push(a);
  }
  return o;
}
