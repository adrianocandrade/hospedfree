import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourcePath =
  'resources/client/short-links/renderers/biolink-renderer/biolink-public-header-actions.tsx';
const source = fs.readFileSync(path.join(root, sourcePath), 'utf8');
const english = readLocale('en');
const portuguese = readLocale('pt-BR');
const clientTranslations = JSON.parse(
  fs.readFileSync(
    path.join(root, 'resources/client-translations.json'),
    'utf8',
  ),
);
const failures = [];

const expectedPortuguese = {
  'Create your account on :site': 'Crie sua conta no :site',
  'Share this page': 'Compartilhar esta página',
  'Share :title': 'Compartilhar :title',
  'Choose where you want to share this page.':
    'Escolha onde deseja compartilhar esta página.',
  'Share options': 'Opções de compartilhamento',
  Copied: 'Copiado',
  'Copy link': 'Copiar link',
  'Create your own page on :site': 'Crie sua própria página no :site',
  'Bring your links, content and contacts together in one professional page.':
    'Reúna seus links, conteúdos e contatos em uma única página profissional.',
  'Sign up for free': 'Cadastre-se gratuitamente',
  'Learn more': 'Saiba mais',
  'Create your account': 'Crie sua conta',
  'Create your professional link in bio on :site.':
    'Crie seu link profissional na bio no :site.',
  'Your professional page, ready without code.':
    'Sua página profissional, pronta sem precisar programar.',
  'Create your account, choose a template and publish all your links, products and contacts in one place.':
    'Crie sua conta, escolha um modelo e publique todos os seus links, produtos e contatos em um só lugar.',
  'Create my free account': 'Criar minha conta gratuita',
  'Explore :site': 'Conheça o :site',
};

for (const [key, value] of Object.entries(expectedPortuguese)) {
  if (!Object.hasOwn(english, key)) {
    failures.push(`resources/lang/en.json: missing key "${key}"`);
  }
  if (!Object.hasOwn(clientTranslations, key)) {
    failures.push(`resources/client-translations.json: missing key "${key}"`);
  }
  if (portuguese[key] !== value) {
    failures.push(
      `resources/lang/pt-BR.json: expected "${key}" to be "${value}"`,
    );
  }
}

requireText(
  'const promoLogoClassName =',
  'the promotional logo must use a dedicated contrast surface',
);
requireText(
  'rounded-xl bg-white',
  'the promotional logo contrast surface must remain white',
);
requireText(
  "aria-label={trans({message: 'Share options'})}",
  'share options accessibility copy must use the active locale',
);
forbidText(
  'aria-label="Share options"',
  'share options must not expose a raw English accessibility label',
);

if (failures.length) {
  console.error('Biolink public actions contract failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  'Biolink public actions contract passed for promotional logo contrast and pt-BR copy.',
);

function readLocale(locale) {
  return JSON.parse(
    fs.readFileSync(path.join(root, `resources/lang/${locale}.json`), 'utf8'),
  );
}

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
