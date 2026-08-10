# Auditoria da conversão documental HospedFree

Data: 10 de agosto de 2026

## Objetivo

Definir produto, marca, design, arquitetura alvo e regras de agentes antes de qualquer conversão de código.

## Decisões registradas

- hospedagem gratuita como porta de entrada;
- hospedagem paga recorrente como produto principal adicional;
- preços e limites ainda em aberto;
- hsite.top como subdomínio gratuito inicial;
- MOFH atrás de adapter e fora da marca pública;
- logo geométrico HF e assets existentes em public/images;
- links, biolinks e QR Codes fora do escopo;
- preservação temporária de users/workspaces, billing e módulos herdados até migração segura.

## Referências analisadas

- HospedFree antigo;
- platform/plugins do projeto antigo;
- bixa-2.0.1;
- documentação e código herdado do hospedfree-base.

As referências antigas foram acessadas somente para leitura. Nenhum código, asset, segredo, configuração ou dado foi copiado.

## Documentos atualizados

- AGENTS.md, PRODUCT.md, DESIGN.md e README.md;
- documentation.html e banner de provenance no changelog.html;
- docs/brand-hospedfree.md e docs/brand/;
- docs/system/;
- docs/security/;
- docs/ai/;
- classificação dos audits, migrations e acervos herdados;
- .agents/context, rules, reviewer e workflow;
- nova skill .agents/skills/hospedfree-system;
- skill MeuLinkBio mantida apenas como compatibilidade depreciada;
- nomes de MCP Storybook em .codex e .cursor;
- README de assets herdados da interface.

## Arquivos não alterados

- aplicação Laravel/React;
- migrations, models, controllers, routes e testes;
- logos e ícones em public/images;
- imagens e corpus herdados;
- .env;
- vendor;
- projetos HospedFree antigo e Bixa.

## Validação realizada

- skill hospedfree-system: Skill is valid.
- skill meulinkbio-system depreciada: Skill is valid.
- PRODUCT.md reconhecido pela Impeccable como platform web.
- metadado Register depreciado removido.
- arquivos JSON de .codex e .cursor parseados com sucesso.
- caminhos canônicos e quatro assets de logo confirmados.
- busca por marcadores de chave privada e formatos comuns de token sem ocorrências nos documentos autorais.
- busca por títulos ativos MeuLinkBio sem ocorrências; menções restantes estão classificadas como herança, proibição ou histórico.
- lista temporal de mudanças não mostrou arquivos da aplicação, somente documentação, agentes e configuração documental de MCP.

node_modules não está instalado nesta cópia; por isso não foi executado Prettier. Nenhum teste de aplicação foi necessário ou executado, pois não houve mudança de código.

## Próximo gate

Antes de implementar hosting:

1. aprovar ADR de identidade e ownership;
2. aprovar catálogo/limites dos planos;
3. definir contrato e estados do provider;
4. criar threat model das credenciais e callbacks;
5. escolher o primeiro módulo vertical a implementar com fake provider.
