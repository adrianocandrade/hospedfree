import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const widgetsRoot =
  'resources/client/dashboard/biolink/biolink-editor/content/widgets';
const widgetRegistryPath = `${widgetsRoot}/widget-registry.ts`;
const dialogModules = new Map([
  [
    'resources/client/dashboard/biolink/biolink-editor/content/widgets/new-widgets/new-widgets.tsx',
    3,
  ],
  [
    'resources/client/dashboard/biolink/biolink-editor/content/widgets/showcase-widgets/showcase-widgets.tsx',
    1,
  ],
  [
    'resources/client/dashboard/biolink/biolink-editor/content/widgets/booking-widget/booking-widget-dialog.tsx',
    1,
  ],
  [
    'resources/client/dashboard/biolink/biolink-editor/content/widgets/music-hub-widget/music-hub-widget.tsx',
    1,
  ],
  [
    'resources/client/dashboard/biolink/biolink-editor/content/widgets/enhanced-widgets/enhanced-widgets.tsx',
    1,
  ],
  ...[
    'image-widget/image-widget-dialog.tsx',
    'socials-widget/socials-widget-dialog.tsx',
    'soundcloud-widget/soundcloud-widget-dialog.tsx',
    'text-widget/text-widget-dialog.tsx',
    'tiktok-widget/tiktok-widget-dialog.tsx',
    'twitch-widget/twitch-widget-dialog.tsx',
    'viewer-count-widget/viewer-count-widget-dialog.tsx',
    'vimeo-widget/vimeo-widget-dialog.tsx',
    'youtube-widget/youtube-widget-dialog.tsx',
  ].map(file => [
    `resources/client/dashboard/biolink/biolink-editor/content/widgets/${file}`,
    1,
  ]),
]);

const failures = [];

const widgetRegistrySource = fs.readFileSync(
  path.join(root, widgetRegistryPath),
  'utf8',
);
const importedDialogModules = new Set();
const importPattern = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/g;

for (const match of widgetRegistrySource.matchAll(importPattern)) {
  const [, imports, modulePath] = match;

  if (!imports.includes('WidgetDialog')) {
    continue;
  }

  const relativeModulePath = modulePath.startsWith(
    '@app/dashboard/biolink/biolink-editor/content/widgets/',
  )
    ? `${widgetsRoot}/${modulePath.replace(
        '@app/dashboard/biolink/biolink-editor/content/widgets/',
        '',
      )}.tsx`
    : path
        .relative(
          root,
          path.resolve(
            root,
            path.dirname(widgetRegistryPath),
            `${modulePath}.tsx`,
          ),
        )
        .replaceAll('\\', '/');

  importedDialogModules.add(relativeModulePath);
}

for (const modulePath of importedDialogModules) {
  if (!dialogModules.has(modulePath)) {
    failures.push(`${modulePath}: dialog module is missing from the audit`);
  }
}

for (const modulePath of dialogModules.keys()) {
  if (!importedDialogModules.has(modulePath)) {
    failures.push(
      `${modulePath}: audited module is not used by WidgetRegistry`,
    );
  }
}

for (const [relativePath, expectedCount] of dialogModules) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const count = source.match(/<WidgetFormActionButtons\b/g)?.length ?? 0;

  if (count !== expectedCount) {
    failures.push(`${relativePath}: expected ${expectedCount}, found ${count}`);
  }
}

const mutationHookPath = `${widgetsRoot}/use-crupdate-biolink-widget.tsx`;
const mutationHookSource = fs.readFileSync(
  path.join(root, mutationHookPath),
  'utf8',
);

if (!mutationHookSource.includes('widgetAdvancedPayload(form.getValues())')) {
  failures.push(
    `${mutationHookPath}: advanced fields are not forwarded to the API`,
  );
}

if (!mutationHookSource.includes('withoutWidgetAdvancedFields(body.config)')) {
  failures.push(
    `${mutationHookPath}: advanced fields are not removed from widget config`,
  );
}

if (failures.length) {
  console.error('Widget dialog action footer contract failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Widget dialog action footer contract passed for ${dialogModules.size} dialog modules.`,
);
