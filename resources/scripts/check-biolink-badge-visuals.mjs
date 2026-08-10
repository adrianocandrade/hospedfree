import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const rendererPath =
  'resources/client/short-links/renderers/biolink-renderer/biolink-layout.tsx';
const socialsPath =
  'resources/client/dashboard/biolink/biolink-editor/content/widgets/socials-widget/socials-widget-renderer.tsx';
const appearancePath =
  'resources/client/dashboard/biolink/biolink-editor/appearance/biolink-appearance-tab.tsx';
const renderer = fs.readFileSync(path.join(root, rendererPath), 'utf8');
const socials = fs.readFileSync(path.join(root, socialsPath), 'utf8');
const appearance = fs.readFileSync(path.join(root, appearancePath), 'utf8');
const failures = [];

function requireText(source, sourcePath, text, reason) {
  if (!source.includes(text)) {
    failures.push(`${sourcePath}: ${reason}`);
  }
}

function requirePattern(source, sourcePath, pattern, reason) {
  if (!pattern.test(source)) {
    failures.push(`${sourcePath}: ${reason}`);
  }
}

requireText(
  socials,
  socialsPath,
  "'flex size-11 items-center justify-center",
  'the social icon reference size changed; review badge parity',
);
requireText(
  renderer,
  rendererPath,
  'const resolvedIcon = resolveImageUrl(item.icon);',
  'badge image paths must be normalized before rendering',
);
requireText(
  renderer,
  rendererPath,
  "className={cn(className, 'block bg-current')}",
  'SVG mask elements must establish a box so width and height take effect',
);
requirePattern(
  renderer,
  rendererPath,
  /iconOnly\s*&&\s*'biolink-badge-icon-only[^']*\bsize-11\b/,
  'icon-only badges must use the same 44px container size as social icons',
);
requirePattern(
  renderer,
  rendererPath,
  /style === 'cards'\s*&&\s*description/,
  'card badges must expose their description and remain distinct from chips',
);
requireText(
  renderer,
  rendererPath,
  "const shortYear = String(year).slice(-2).padStart(2, '0');",
  'public badge editions must render only the final two year digits',
);
requireText(
  renderer,
  rendererPath,
  "'absolute -end-1 -bottom-1 flex size-5",
  'the icon edition marker must remain a compact 20px circle',
);
requireText(
  appearance,
  appearancePath,
  "String(editionYear).slice(-2).padStart(2, '0')",
  'the editor preview must match the public two-digit edition marker',
);
requireText(
  renderer,
  rendererPath,
  '<LucideIcons.BadgeCheck',
  'badges without a usable configured icon must render a library fallback',
);

if (failures.length) {
  console.error('Biolink badge visual contract failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  'Biolink badge visual contract passed for icon paths, sizing, editions, and style differentiation.',
);
