import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourcePath = 'resources/client/landing/sections/lp-benefits.tsx';
const source = fs.readFileSync(path.join(root, sourcePath), 'utf8');
const failures = [];

const expectedImages = [
  '/images/landing/pagina-burger-meu-link-bio-transparent.png',
  '/images/landing/pagina-game-meu-link-bio.png',
  '/images/landing/pagina-nekoverse-meu-link-bio.png',
];

for (const image of expectedImages) {
  requireText(image, `missing landing benefit image "${image}"`);
  const publicPath = path.join(
    root,
    'public',
    image.replace(/^\/images\//, 'images/'),
  );
  if (!fs.existsSync(publicPath)) {
    failures.push(`missing public asset for "${image}"`);
  }
}

forbidText(
  '/images/others/mocks/',
  'legacy mockups must not remain in the benefit cards',
);
requireText(
  'min-h-[34rem]',
  'benefit cards need enough vertical room for the cropped showcase media',
);
requireText(
  'relative -mx-8 mt-6 min-h-72 flex-1 overflow-hidden',
  'benefit media must use a clipped viewport at the bottom of each card',
);
requireText(
  "'absolute top-0 left-1/2 w-[122%] max-w-none -translate-x-1/2 object-contain object-top",
  'benefit images must stay top-anchored, enlarged, and cropped below the card',
);

if (failures.length) {
  console.error('Landing benefit media contract failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  'Landing benefit media contract passed for the three showcase images and bottom crop.',
);

function requireText(text, reason) {
  if (!source.includes(text)) {
    failures.push(`${sourcePath}: ${reason}`);
  }
}

function forbidText(text, reason) {
  if (source.includes(text)) {
    failures.push(`${sourcePath}: ${reason}`);
  }
}
