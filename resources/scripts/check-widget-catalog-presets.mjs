import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const widgetRoot = path.join(
  root,
  'resources/client/dashboard/biolink/biolink-editor/content/widgets',
);
const registry = fs.readFileSync(
  path.join(widgetRoot, 'widget-registry.ts'),
  'utf8',
);
const catalog = fs.readFileSync(
  path.join(widgetRoot, 'widget-catalog-entries.tsx'),
  'utf8',
);
const widgetList = fs.readFileSync(
  path.join(widgetRoot, 'widget-list.tsx'),
  'utf8',
);
const failures = [];

const persistedTypes = new Set(
  [...widgetList.matchAll(/^  ([A-Za-z][A-Za-z0-9]*): \{/gm)].map(
    match => match[1],
  ),
);
const registryTypes = new Set(
  [...registry.matchAll(/^  ([A-Za-z][A-Za-z0-9]*): \{/gm)].map(
    match => match[1],
  ),
);

for (const type of persistedTypes) {
  if (!registryTypes.has(type)) {
    failures.push(
      `Missing technical registry entry for persisted type: ${type}`,
    );
  }
}
for (const type of registryTypes) {
  if (!persistedTypes.has(type)) {
    failures.push(`Technical registry contains an unknown type: ${type}`);
  }
}

const requiredProviders = [
  'spotify',
  'appleMusic',
  'bandcamp',
  'tidal',
  'mixcloud',
  'instagram',
  'tiktok',
  'youtube',
  'bluesky',
  'facebook',
  'telegram',
  'reddit',
  'snapchat',
  'pinterest',
  'google',
  'typeform',
  'pdf',
  'spreadsheet',
  'presentation',
  'rumble',
  'vk',
  'direct',
];
for (const provider of requiredProviders) {
  if (!catalog.includes(`['${provider}',`)) {
    failures.push(`Missing requested catalog preset provider: ${provider}`);
  }
}

for (const id of [
  'spotlight:large-link',
  'spotlight:featured-link',
  'cta:primary',
  'contact:public',
  'contact:vcard',
]) {
  if (!catalog.includes(`id: '${id}'`)) {
    failures.push(`Missing requested catalog preset: ${id}`);
  }
}

for (const family of [
  'music',
  'embed',
  'social',
  'form',
  'document',
  'video',
  'gallery',
  'text',
]) {
  if (!catalog.includes(`id: \`${family}:`)) {
    failures.push(`Missing preset family: ${family}`);
  }
}

for (const keyword of [
  'musica',
  'rede social',
  'formulario',
  'arquivo',
  'link grande',
  'galeria',
  'salvar contato',
]) {
  if (!catalog.includes(`'${keyword}'`)) {
    failures.push(`Missing Portuguese catalog search keyword: ${keyword}`);
  }
}

if (!catalog.includes('initialConfig: {presetProvider: provider}')) {
  failures.push(
    'Provider presets are not injecting their initial configuration.',
  );
}
if (
  !catalog.includes("type: 'contactCard'") ||
  !catalog.includes('enableVcard: true')
) {
  failures.push(
    'The vCard preset does not reuse contactCard with enableVcard.',
  );
}
if (
  !catalog.includes("type: 'text'") ||
  !catalog.includes('initialConfig: {variant}')
) {
  failures.push('Text presentation presets are not reusing the text type.');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Widget registry/catalog contract passed for ${persistedTypes.size} persisted types and all requested preset families.`,
);
