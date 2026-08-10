import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const widgetsRoot =
  'resources/client/dashboard/biolink/biolink-editor/content/widgets';

const sources = Object.fromEntries(
  Object.entries({
    fields: `${widgetsRoot}/biolink-section-fields.tsx`,
    frame: `${widgetsRoot}/biolink-section-frame.tsx`,
    booking: `${widgetsRoot}/booking-widget/booking-widget-renderer.tsx`,
    showcase: `${widgetsRoot}/showcase-widgets/showcase-widgets.tsx`,
    newWidgets: `${widgetsRoot}/new-widgets/new-widgets.tsx`,
  }).map(([name, relativePath]) => [
    name,
    {
      relativePath,
      source: fs.readFileSync(path.join(root, relativePath), 'utf8'),
    },
  ]),
);

const failures = [];

function requireText(sourceName, text, reason) {
  const entry = sources[sourceName];
  if (!entry.source.includes(text)) {
    failures.push(`${entry.relativePath}: ${reason}`);
  }
}

function forbidText(sourceName, text, reason) {
  const entry = sources[sourceName];
  if (entry.source.includes(text)) {
    failures.push(`${entry.relativePath}: ${reason}`);
  }
}

requireText(
  'fields',
  'IconPickerDialogContent',
  'section icons must use the project icon picker',
);
requireText(
  'fields',
  'onIconNameSelected',
  'the icon picker must persist a validated Lucide icon name',
);
forbidText(
  'fields',
  'Lucide icon name (optional)',
  'users must not type library icon names manually',
);
forbidText(
  'fields',
  'placeholder="Sparkles"',
  'users must not type library icon names manually',
);

for (const sourceName of ['frame', 'booking', 'showcase', 'newWidgets']) {
  requireText(
    sourceName,
    'shouldShowBiolinkSectionHeading',
    'title and description visibility must share the section heading rule',
  );
}

forbidText(
  'frame',
  '|| description ||',
  'description must not keep a hidden section heading visible',
);
forbidText(
  'booking',
  'widget.config?.section?.showTitle !== false ||',
  'booking description must be hidden with its title',
);
forbidText(
  'showcase',
  'showTitle || widget.config.description',
  'showcase description must be hidden with its title',
);
forbidText(
  'newWidgets',
  'description={description}',
  'action widget description must be hidden with its title',
);
forbidText(
  'newWidgets',
  'description={question}',
  'poll description must be hidden with its title',
);
forbidText(
  'newWidgets',
  'description={widget.config.description || displayAddress}',
  'location description must be hidden with its title',
);
forbidText(
  'newWidgets',
  'if (!showTitle && !widget.config.description && !section?.actionUrl)',
  'section description must not bypass the hidden heading rule',
);

if (failures.length) {
  console.error('Widget section controls contract failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  'Widget section controls contract passed for icon selection and heading visibility.',
);
