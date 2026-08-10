import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const read = relativePath =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

const builderPath =
  'resources/client/dashboard/qr-codes/types/build-qr-code-payload.ts';
const compiledBuilder = ts.transpileModule(read(builderPath), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const builderModule = {exports: {}};
new Function('module', 'exports', compiledBuilder)(
  builderModule,
  builderModule.exports,
);
const {buildQrCodePayload, pixKeyIsValid} = builderModule.exports;

assert.equal(
  buildQrCodePayload('url', {}, 'example.com'),
  'https://example.com/',
);
assert.throws(() => buildQrCodePayload('url', {}, 'javascript:alert(1)'));
assert.equal(
  buildQrCodePayload('wifi', {
    ssid: 'Minha;Rede',
    security: 'WPA',
    password: 'senha:forte',
    hidden: true,
  }),
  'WIFI:T:WPA;S:Minha\\;Rede;P:senha\\:forte;H:true;;',
);
assert.equal(
  buildQrCodePayload('whatsapp', {
    phone: '(11) 99999-9999',
    message: 'Olá mundo',
  }),
  'https://wa.me/5511999999999?text=Ol%C3%A1%20mundo',
);
assert.equal(
  buildQrCodePayload('phone', {phone: '(11) 99999-9999'}),
  'tel:+5511999999999',
);
assert.equal(
  buildQrCodePayload('sms', {
    phone: '(11) 99999-9999',
    message: 'Teste',
  }),
  'SMSTO:+5511999999999:Teste',
);
assert.equal(
  buildQrCodePayload('text', {content: 'Conteúdo simples'}),
  'Conteúdo simples',
);
assert.equal(
  buildQrCodePayload('location', {
    latitude: '-23.5505',
    longitude: '-46.6333',
  }),
  'geo:-23.5505,-46.6333',
);
assert.match(
  buildQrCodePayload('email', {
    email: 'CLIENTE@example.com',
    subject: 'Olá',
  }),
  /^mailto:cliente@example\.com\?subject=Ol%C3%A1$/,
);
assert.match(
  buildQrCodePayload('vcard', {
    first_name: 'Ana',
    phone: '(11) 99999-9999',
    website: 'https://example.com',
  }),
  /TEL;TYPE=CELL:\+5511999999999/,
);
assert.equal(pixKeyIsValid('cpf', '529.982.247-25'), true);
assert.equal(pixKeyIsValid('cpf', '111.111.111-11'), false);
assert.equal(pixKeyIsValid('cnpj', '11.222.333/0001-81'), true);

const pixPayload = buildQrCodePayload('pix', {
  key_type: 'cpf',
  key: '529.982.247-25',
  receiver_name: 'José da Silva',
  receiver_city: 'São Paulo',
  amount: '10,50',
});
assert.match(pixPayload, /^000201/);
assert.match(pixPayload, /540510\.50/);
assert.match(pixPayload, /5913JOSE DA SILVA/);
assert.match(pixPayload, /6009SAO PAULO/);
assert.match(pixPayload, /6304[0-9A-F]{4}$/);

const typeRegistry = read(
  'resources/client/dashboard/qr-codes/types/qr-code-types.tsx',
);
const typeFields = read(
  'resources/client/dashboard/qr-codes/types/qr-code-type-fields.tsx',
);
const selector = read(
  'resources/client/dashboard/qr-codes/types/qr-code-type-selector.tsx',
);
const preview = read(
  'resources/client/dashboard/qr-codes/types/qr-code-preview-panel.tsx',
);
const createDialog = read(
  'resources/client/dashboard/qr-codes/create-qr-code-dialog.tsx',
);
const editPage = read(
  'resources/client/dashboard/qr-codes/qr-code-details-page/qr-code-settings-page.tsx',
);

const types = [
  'url',
  'pix',
  'wifi',
  'whatsapp',
  'phone',
  'email',
  'sms',
  'text',
  'vcard',
  'location',
];
for (const type of types) {
  assert.match(typeRegistry, new RegExp(`value: '${type}'`));
  assert.match(typeFields, new RegExp(`case '${type}'`));
}
assert.match(selector, /aria-pressed=\{selected\}/);
assert.match(selector, /grid-cols-2/);
assert.match(preview, /useDebounce\(resolvedPayload, 300\)/);
assert.match(preview, /Pix code copied/);
assert.match(createDialog, /sanitizeQrCodeFormValues\(values\)/);
assert.match(editPage, /window\.confirm/);
assert.match(editPage, /disabled=\{!qrCodeCapabilities\[type\]\.tracking\}/);

const catalogs = [
  JSON.parse(read('resources/client-translations.json')),
  JSON.parse(read('resources/lang/pt-BR.json')),
];
const qrSourceFiles = fs
  .readdirSync(path.join(root, 'resources/client/dashboard/qr-codes'), {
    recursive: true,
  })
  .filter(file => /\.(tsx?|jsx?)$/.test(file));
const messages = new Set();
for (const file of qrSourceFiles) {
  const source = read(`resources/client/dashboard/qr-codes/${file}`);
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  assertFieldDescriptionsHaveRoot(sourceFile, file);
  for (const match of source.matchAll(/message="([^"]+)"/g)) {
    messages.add(match[1]);
  }
  for (const match of source.matchAll(/message\(\s*'([^']+)'/gs)) {
    messages.add(match[1]);
  }
}
for (const catalog of catalogs) {
  for (const translation of messages) {
    assert.ok(
      Object.hasOwn(catalog, translation),
      `Missing translation: ${translation}`,
    );
  }
}

console.log('QR code type contracts passed.');

function assertFieldDescriptionsHaveRoot(sourceFile, filename) {
  const visit = (node, fieldRootDepth = 0) => {
    const tagName = ts.isJsxElement(node)
      ? node.openingElement.tagName.getText(sourceFile)
      : null;
    const nextDepth =
      tagName === 'Field.Root' || tagName === 'HookForm.Field'
        ? fieldRootDepth + 1
        : fieldRootDepth;

    if (tagName === 'Field.Description') {
      assert.ok(
        fieldRootDepth > 0,
        `${filename}: Field.Description must be inside Field.Root or HookForm.Field`,
      );
    }

    ts.forEachChild(node, child => visit(child, nextDepth));
  };

  visit(sourceFile);
}
