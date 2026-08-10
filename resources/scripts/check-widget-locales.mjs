import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const widgetRoot = path.join(
  root,
  'resources/client/dashboard/biolink/biolink-editor/content/widgets',
);
const sourceFiles = [];
const messageKeys = new Set([
  'Online',
  'Idle',
  'Do not disturb',
  'Offline',
  'Status',
  'Playing',
  'Platform',
  'Rank',
  'None',
  'Soft',
  'Strong',
  'Hard',
]);
const rawUiText = [];
const staticAccessibilityText = [];
const untranslatedDescriptorUsage = [];

const allowedRawUiText = new Set(['Spotify', '&middot;']);
const allowedIdenticalPtBr = new Set([
  'Status',
  'Layout',
  'Podcast',
  'Premium',
  'OG',
  'Hone.gg',
  'Spotify',
  'Bandcamp',
  'Mixcloud',
  'Apple Music',
  'YouTube Music',
  'YouTube',
  'Deezer',
  'SoundCloud',
  'Tidal',
  'Amazon Music',
  'Audiomack',
  'Pandora',
  'Yandex Music',
  'Napster',
  'iTunes',
  'Latitude',
  'Longitude',
  'OpenStreetMap',
  'Google Maps',
  'Waze',
  'Item',
  'URL',
  'Manual',
  'Gamertag',
  'links',
  'WhatsApp',
  'Discord',
  'PC, PlayStation, Xbox...',
  'Social',
  'Link',
  'CPF',
  'CNPJ',
  'TxID',
  'PDF',
  'Instagram',
  'TikTok',
  'X',
  'Bluesky',
  'Facebook',
  'Telegram',
  'Reddit',
  'Snapchat',
  'Pinterest',
  'Google Forms',
  'Typeform',
  'Rumble',
  'VK Video',
]);
const wordsThatNeedDiacritics = new Set([
  'voce',
  'voces',
  'nao',
  'acao',
  'acoes',
  'opcao',
  'opcoes',
  'informacao',
  'informacoes',
  'descricao',
  'descricoes',
  'pagina',
  'paginas',
  'publico',
  'publica',
  'publicos',
  'publicas',
  'servico',
  'servicos',
  'usuario',
  'usuarios',
  'numero',
  'numeros',
  'codigo',
  'codigos',
  'endereco',
  'enderecos',
  'disponivel',
  'possivel',
  'proximo',
  'proxima',
  'proximos',
  'proximas',
  'unico',
  'unica',
  'ultimos',
  'ultimas',
  'apos',
  'ate',
  'tambem',
  'sera',
  'sao',
  'estao',
  'selecao',
  'confirmacao',
  'configuracao',
  'configuracoes',
  'navegacao',
  'apresentacao',
  'colecao',
  'colecoes',
  'secao',
  'secoes',
  'conexao',
  'conexoes',
  'botao',
  'botoes',
  'midia',
  'conteudo',
  'conteudos',
  'icone',
  'icones',
  'titulo',
  'titulos',
  'automatico',
  'automatica',
  'automaticos',
  'automaticas',
  'metricas',
  'periodo',
  'horario',
  'horarios',
  'classificacao',
  'avaliacao',
  'avaliacoes',
  'promocao',
  'promocoes',
  'duracao',
  'localizacao',
  'reproducao',
  'inscricao',
  'inscricoes',
  'atualizacao',
  'exclusao',
  'edicao',
]);
const englishLeakWords = new Set([
  'the',
  'your',
  'with',
  'without',
  'from',
  'this',
  'that',
  'these',
  'those',
  'show',
  'add',
  'choose',
  'select',
  'create',
  'update',
  'delete',
  'cancel',
  'save',
  'open',
  'close',
  'view',
  'loading',
  'available',
  'required',
  'optional',
  'button',
  'page',
  'visitor',
  'visitors',
  'when',
  'where',
  'before',
  'after',
  'another',
  'display',
  'collect',
  'redirect',
  'upload',
  'paste',
  'playback',
  'service',
  'services',
  'title',
  'description',
  'settings',
  'content',
  'image',
  'video',
  'audio',
  'form',
  'event',
  'course',
  'product',
  'products',
]);
const portugueseSourceWords = new Set([
  'agende',
  'buscar',
  'cidade',
  'complemento',
  'endereço',
  'estado',
  'localização',
  'localizar',
  'logradouro',
  'não',
  'número',
  'possível',
  'seção',
  'você',
]);

walk(widgetRoot);

for (const filePath of sourceFiles) {
  inspectSource(filePath);
}

const en = readLocale('en');
const ptBr = readLocale('pt-BR');
for (const key of Object.keys(en)) {
  if (key.startsWith('biolink.badges.')) {
    messageKeys.add(key);
  }
}
const missingKeys = [...messageKeys].filter(
  key => !hasOwn(en, key) || !hasOwn(ptBr, key),
);
const emptyValues = [...messageKeys].filter(
  key => hasOwn(ptBr, key) && !String(ptBr[key]).trim(),
);
const placeholderMismatches = [...messageKeys].filter(
  key =>
    hasOwn(en, key) &&
    hasOwn(ptBr, key) &&
    JSON.stringify(extractTokens(en[key])) !==
      JSON.stringify(extractTokens(ptBr[key])),
);
const identicalLanguageLeaks = [...messageKeys].filter(
  key =>
    en[key] === ptBr[key] &&
    /[A-Za-z]/.test(en[key] ?? '') &&
    !allowedIdenticalPtBr.has(en[key]),
);
const missingDiacritics = [...messageKeys].filter(key =>
  words(String(ptBr[key]).replaceAll('America/Sao_Paulo', '')).some(word =>
    wordsThatNeedDiacritics.has(word),
  ),
);
const englishFragments = [...messageKeys].filter(key => {
  if (allowedIdenticalPtBr.has(ptBr[key])) {
    return false;
  }
  const valueWithoutTokens = String(ptBr[key] ?? '')
    .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, '')
    .replace(/https?:\/\/\S+/g, '');
  return words(valueWithoutTokens).some(word => englishLeakWords.has(word));
});
const encodingArtifacts = [...messageKeys].filter(key =>
  /\uFFFD|Ã\S|Â\S|[\p{L}]\?+[\p{L}]/u.test(String(ptBr[key] ?? '')),
);
const nonEnglishSourceKeys = [...messageKeys].filter(key =>
  words(key).some(word => portugueseSourceWords.has(word)),
);

const report = {
  files: sourceFiles.length,
  messages: messageKeys.size,
  missingKeys,
  emptyValues,
  placeholderMismatches,
  identicalLanguageLeaks,
  missingDiacritics,
  englishFragments,
  encodingArtifacts,
  nonEnglishSourceKeys,
  rawUiText,
  staticAccessibilityText,
  untranslatedDescriptorUsage,
};

console.log(
  `Widget locale audit: ${report.messages} messages across ${report.files} files`,
);
for (const [name, issues] of Object.entries(report).slice(2)) {
  const status = issues.length ? 'FAIL' : 'OK';
  console.log(`${status} ${name}: ${issues.length}`);
  for (const issue of issues.slice(0, 200)) {
    console.log(`  - ${issue}`);
  }
}

if (
  Object.values(report)
    .slice(2)
    .some(issues => issues.length)
) {
  process.exitCode = 1;
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath);
    } else if (/\.tsx?$/.test(entry.name)) {
      sourceFiles.push(entryPath);
    }
  }
}

function inspectSource(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const relativePath = path.relative(root, filePath);

  visit(sourceFile);

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'message' &&
      node.arguments.length &&
      isStaticString(node.arguments[0])
    ) {
      messageKeys.add(node.arguments[0].text);
    }

    if (
      ts.isPropertyAssignment(node) &&
      propertyName(node.name) === 'message' &&
      isStaticString(node.initializer) &&
      node.initializer.text
    ) {
      messageKeys.add(node.initializer.text);
    }

    if (
      ts.isPropertyAssignment(node) &&
      ['defaultTitle', 'defaultButton', 'defaultSuccess'].includes(
        propertyName(node.name),
      ) &&
      isStaticString(node.initializer)
    ) {
      messageKeys.add(node.initializer.text);
    }

    if (ts.isJsxOpeningLikeElement(node) && jsxTagName(node) === 'Trans') {
      const messageAttribute = node.attributes.properties.find(
        property =>
          ts.isJsxAttribute(property) && property.name.text === 'message',
      );
      if (
        messageAttribute &&
        ts.isJsxAttribute(messageAttribute) &&
        messageAttribute.initializer &&
        ts.isStringLiteral(messageAttribute.initializer)
      ) {
        messageKeys.add(messageAttribute.initializer.text);
      }
    }

    if (ts.isJsxText(node)) {
      const value = node.text.trim();
      if (value && /\p{L}/u.test(value) && !allowedRawUiText.has(value)) {
        rawUiText.push(`${relativePath}:${lineOf(node)} | ${value}`);
      }
    }

    if (ts.isJsxAttribute(node)) {
      const name = node.name.text;
      if (
        (name === 'ariaLabel' || name === 'aria-label') &&
        node.initializer &&
        ts.isStringLiteral(node.initializer) &&
        node.initializer.text
      ) {
        staticAccessibilityText.push(
          `${relativePath}:${lineOf(node)} | ${node.initializer.text}`,
        );
      }
    }

    if (
      ts.isPropertyAccessExpression(node) &&
      node.name.text === 'message' &&
      ts.isCallExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'message'
    ) {
      untranslatedDescriptorUsage.push(`${relativePath}:${lineOf(node)}`);
    }

    ts.forEachChild(node, visit);
  }

  function lineOf(node) {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  }
}

function readLocale(locale) {
  return JSON.parse(
    fs.readFileSync(path.join(root, `resources/lang/${locale}.json`), 'utf8'),
  );
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isStaticString(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function propertyName(node) {
  return ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : '';
}

function jsxTagName(node) {
  return ts.isIdentifier(node.tagName) ? node.tagName.text : '';
}

function words(value) {
  return (
    String(value ?? '')
      .toLocaleLowerCase('pt-BR')
      .match(/\p{L}+/gu) ?? []
  );
}

function extractTokens(value) {
  const tokens = [];
  const patterns = [
    /:[A-Za-z_][A-Za-z0-9_]*/g,
    /\$[A-Za-z_][A-Za-z0-9_]*/g,
    /<\/?[a-z][^>]*>/gi,
    /\[(one|zero|two|few|many|other)\b/gi,
    /\|(?:one|zero|two|few|many|other)\b/gi,
  ];
  for (const pattern of patterns) {
    for (const match of String(value ?? '').matchAll(pattern)) {
      tokens.push(match[0]);
    }
  }
  return tokens.sort();
}
