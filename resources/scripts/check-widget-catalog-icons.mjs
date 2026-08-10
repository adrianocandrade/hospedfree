import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const widgetListPath = path.join(
  root,
  'resources/client/dashboard/biolink/biolink-editor/content/widgets/widget-list.tsx',
);
const selectorPath = path.join(
  root,
  'resources/client/dashboard/biolink/biolink-editor/content/widgets/widget-selector/select-widget-dialog.tsx',
);
const widgetList = fs.readFileSync(widgetListPath, 'utf8');
const selector = fs.readFileSync(selectorPath, 'utf8');
const failures = [];

if (widgetList.includes('widget-selector/widget-images/')) {
  failures.push('Legacy widget thumbnail imports are still present.');
}

const widgetEntries = [...widgetList.matchAll(/^  [A-Za-z][A-Za-z0-9]*: \{/gm)];
const iconAssignments = [
  ...widgetList.matchAll(
    /^    image: widgetIcon\('([^']+)'(?:, '([^']+)')?\),$/gm,
  ),
];

if (iconAssignments.length !== widgetEntries.length) {
  failures.push(
    `Expected one v2 icon for each widget (${widgetEntries.length}), found ${iconAssignments.length}.`,
  );
}

for (const [, iconName, explicitExtension] of iconAssignments) {
  const extension = explicitExtension ?? 'webp';
  const iconPath = path.join(
    root,
    'public/images/icons/meulinkbio/v2',
    `${iconName}.${extension}`,
  );
  if (!fs.existsSync(iconPath)) {
    failures.push(`Missing v2 icon asset: ${iconName}.${extension}`);
  }
}

if (!selector.includes("image: '/images/icons/meulinkbio/v2/link.webp'")) {
  failures.push('The standalone link action is not using the v2 link icon.');
}

if (!selector.includes('bg-muted/60 ring-1 ring-border/70')) {
  failures.push(
    'Widget icons are not using the shared semantic thumbnail surface.',
  );
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Widget catalog icon contract passed for ${widgetEntries.length} widget types.`,
);
