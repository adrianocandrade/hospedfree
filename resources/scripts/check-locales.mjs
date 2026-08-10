import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const baseLocale = 'en';
const checkedLocales = ['pt-BR', 'pt-PT'];
const maxExamples = 30;

const allowedIdenticalValues = new Set([
  'Links',
  'Biolinks',
  'Webhooks',
  'Status',
  'QR codes',
  'Unsplash',
  'Global',
  'Host',
  'Link',
  'QR code',
  'Desktop',
  'Tablet',
  'OS X',
  'iOS',
  'Windows',
  'Linux',
  'Android',
  ':count total engagements',
  'links',
  'biolinks',
  'URL',
  'Logs',
  'logs',
  'Overlays',
  'Frame',
  'Splash',
  'Phishtank',
  ':count links',
  ':format',
  'Logo',
  'Retargeting',
  'Tags',
  'Back-half',
  'site.com',
  'Pixels',
  'Overlay',
  'WhatsApp',
  'Avatar',
  'Dashboard',
  'Super admin',
]);

const base = readLocale(baseLocale);
let hasStructuralErrors = false;

for (const locale of checkedLocales) {
  const target = readLocale(locale);
  const report = compareLocale(locale, base, target);
  printReport(report);

  if (
    report.missingKeys.length ||
    report.extraKeys.length ||
    report.emptyValues.length ||
    report.placeholderMismatches.length ||
    report.suspiciousEncodingArtifacts.length
  ) {
    hasStructuralErrors = true;
  }
}

if (hasStructuralErrors) {
  process.exitCode = 1;
}

function readLocale(locale) {
  const filePath = path.join(root, `resources/lang/${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function compareLocale(locale, baseLines, targetLines) {
  const baseKeys = Object.keys(baseLines);
  const targetKeys = Object.keys(targetLines);
  const baseKeySet = new Set(baseKeys);
  const targetKeySet = new Set(targetKeys);

  const missingKeys = baseKeys.filter(key => !targetKeySet.has(key));
  const extraKeys = targetKeys.filter(key => !baseKeySet.has(key));
  const emptyValues = targetKeys.filter(key => isEmpty(targetLines[key]));
  const placeholderMismatches = [];
  const sameAsBaseWarnings = [];
  const acceptedIdenticalValues = [];
  const suspiciousEncodingArtifacts = [];

  for (const key of baseKeys) {
    if (!targetKeySet.has(key)) {
      continue;
    }

    const baseValue = baseLines[key];
    const targetValue = targetLines[key];
    const baseTokens = extractTokens(baseValue);
    const targetTokens = extractTokens(targetValue);

    if (!sameTokenSet(baseTokens, targetTokens)) {
      placeholderMismatches.push({
        key,
        base: baseTokens,
        target: targetTokens,
      });
    }

    if (typeof baseValue === 'string' && baseValue === targetValue) {
      if (allowedIdenticalValues.has(baseValue)) {
        acceptedIdenticalValues.push(key);
      } else if (probablyShouldTranslate(baseValue)) {
        sameAsBaseWarnings.push(key);
      }
    }

    if (hasSuspiciousEncodingArtifact(targetValue)) {
      suspiciousEncodingArtifacts.push(`${key} | ${targetValue}`);
    }
  }

  return {
    locale,
    totalBaseKeys: baseKeys.length,
    totalTargetKeys: targetKeys.length,
    missingKeys,
    extraKeys,
    emptyValues,
    placeholderMismatches,
    suspiciousEncodingArtifacts,
    sameAsBaseWarnings,
    acceptedIdenticalValues,
  };
}

function isEmpty(value) {
  return typeof value !== 'string' || value.trim() === '';
}

function extractTokens(value) {
  if (typeof value !== 'string') {
    return [];
  }

  const tokens = [];
  const patterns = [
    /:[A-Za-z_][A-Za-z0-9_]*/g,
    /\$[A-Za-z_][A-Za-z0-9_]*/g,
    /<\/?[a-z][^>]*>/gi,
    /\[(one|zero|two|few|many|other)\b/gi,
    /\|(?:one|zero|two|few|many|other)\b/gi,
  ];

  for (const pattern of patterns) {
    for (const match of value.matchAll(pattern)) {
      tokens.push(match[0]);
    }
  }

  return tokens.sort();
}

function sameTokenSet(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function probablyShouldTranslate(value) {
  return /[A-Za-z]/.test(value) && /[\s.!?]/.test(value);
}

function hasSuspiciousEncodingArtifact(value) {
  return typeof value === 'string' && /[\p{L}]\?+[\p{L}]|\?{2,}/u.test(value);
}

function printReport(report) {
  console.log(`\nLocale ${baseLocale} -> ${report.locale}`);
  console.log(`Keys: ${report.totalTargetKeys}/${report.totalBaseKeys}`);
  printSection('Missing keys', report.missingKeys);
  printSection('Extra keys', report.extraKeys);
  printSection('Empty values', report.emptyValues);
  printSection(
    'Placeholder or HTML mismatches',
    report.placeholderMismatches.map(
      mismatch =>
        `${mismatch.key} | base=${mismatch.base.join(',')} | target=${mismatch.target.join(',')}`,
    ),
  );
  printSection('Suspicious encoding artifacts', report.suspiciousEncodingArtifacts);
  printSection('Same as base warnings', report.sameAsBaseWarnings);
  console.log(
    `Accepted identical technical terms: ${report.acceptedIdenticalValues.length}`,
  );
}

function printSection(title, items) {
  const prefix = items.length ? '!' : 'OK';
  console.log(`${prefix} ${title}: ${items.length}`);

  if (items.length) {
    for (const item of items.slice(0, maxExamples)) {
      console.log(`  - ${item}`);
    }
    if (items.length > maxExamples) {
      console.log(`  ... ${items.length - maxExamples} more`);
    }
  }
}
