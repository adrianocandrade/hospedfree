import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const rendererPath =
  'resources/client/short-links/renderers/biolink-renderer/biolink-layout.tsx';
const collectionsPath =
  'resources/client/dashboard/biolink/biolink-editor/content/widgets/collection-layout.tsx';
const renderer = fs.readFileSync(path.join(root, rendererPath), 'utf8');
const collections = fs.readFileSync(path.join(root, collectionsPath), 'utf8');
const failures = [];

requireText(
  renderer,
  rendererPath,
  'grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))]',
  'the two-column desktop mode must collapse before widgets become too narrow',
);
requireText(
  renderer,
  rendererPath,
  'grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))]',
  'the three-column desktop mode must preserve a safe widget width',
);
requireText(
  renderer,
  rendererPath,
  "desktopLayout && '@container/biolink-widget'",
  'desktop widgets must measure their own width for container queries',
);
requireText(
  renderer,
  rendererPath,
  'biolink-desktop-layout',
  'the desktop surface must expose a stable responsive-layout scope',
);
requireText(
  renderer,
  rendererPath,
  'min-h-[100dvh] w-full max-w-6xl',
  'the split layout must grow with its content instead of locking to the viewport',
);
forbidText(
  renderer,
  rendererPath,
  'min-h-0 min-w-0 overflow-y-auto overscroll-contain',
  'the split content column must not create a nested vertical scrollbar',
);
requireText(
  renderer,
  rendererPath,
  'overflow-x-clip',
  'desktop layout must clip accidental horizontal overflow without creating a scrollbar',
);
requireText(
  collections,
  collectionsPath,
  'biolink-collection-grid',
  'collection grids need a stable hook for desktop width safeguards',
);
requireText(
  renderer,
  rendererPath,
  '[&_.biolink-collection-grid]:grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))]',
  'desktop collection cards must expand when a row has fewer items',
);

if (failures.length) {
  console.error('Biolink desktop layout contract failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  'Biolink desktop layout contract passed for safe columns, local widget breakpoints, and page-level scrolling.',
);

function requireText(source, sourcePath, text, reason) {
  if (!source.includes(text)) {
    failures.push(`${sourcePath}: ${reason}`);
  }
}

function forbidText(source, sourcePath, text, reason) {
  if (source.includes(text)) {
    failures.push(`${sourcePath}: ${reason}`);
  }
}
