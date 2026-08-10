# Localização — HospedFree

## Estado atual

A base herdada possui:

- en como idioma-base de chaves;
- pt-BR para português do Brasil;
- pt-PT preservado da localização anterior;
- resolução automática de idioma;
- arquivos JSON e grupos PHP em resources/lang.

Os arquivos ainda podem conter MeuLinkBio, links e biolinks. A reescrita de documentação não altera traduções de aplicação.

## Idioma do produto

Português do Brasil é o idioma primário da HospedFree. O produto deve usar linguagem clara para iniciantes e explicar:

- domínio e subdomínio;
- DNS e nameserver;
- SSL;
- FTP/WebFTP;
- banco de dados;
- provisionamento;
- plano, limite, cobrança e renovação.

Traduções não podem trocar termos técnicos por promessas incorretas.

## Arquivos e resolução

- JSON de runtime: resources/lang/{locale}.json.
- Grupos Laravel: resources/lang/{locale}/*.php.
- Bootstrap: common/foundation/src/Core/Bootstrap/BaseBootstrapData.php.
- Seletor público/conta: common/foundation/resources/client/locale-switcher.
- Lista administrativa: common/foundation/resources/client/ui/library/utils/intl/languages.ts.

A resolução atual considera query lang, usuário autenticado, cookie de visitante, locale administrativo e Accept-Language. Confirmar no código antes de modificar.

## Formatação

- BRL usa convenções pt-BR quando for a moeda real do plano.
- Locale não decide preço, moeda ou período.
- Datas de provisionamento e renovação precisam de timezone explícito.
- Tamanhos de armazenamento e transferência usam unidade consistente.
- Identificadores de domínio, usuário e caminhos não são traduzidos.

## Regras

- usar Trans com mensagem estática no frontend;
- manter placeholders e tokens;
- não inserir HTML não revisado em traduções;
- testar textos longos no mobile;
- não misturar inglês em ações principais;
- preservar termos necessários para suporte técnico com explicação contextual;
- remover MeuLinkBio somente durante uma fase de localização de código, com revisão de todas as ocorrências.

## Validação

    npm run locales:check

Também revisar:

- chaves ausentes/extras;
- placeholders;
- mensagens de erro do provider convertidas em linguagem segura;
- moeda, data, número e fuso;
- layout em pt-BR;
- nenhuma credencial ou payload incorporado à tradução.
