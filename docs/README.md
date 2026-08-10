# Documentação HospedFree

Este diretório separa a verdade atual da base herdada, o produto alvo e as referências históricas. Um recurso só pode ser chamado de implementado quando existir e tiver sido verificado neste repositório.

## Ordem de autoridade

1. ../PRODUCT.md — escopo e decisões de produto.
2. brand-hospedfree.md — identidade visual canônica.
3. ../DESIGN.md — contrato geral de experiência.
4. brand/ — aplicação de marca, conteúdo, componentes e site.
5. system/ — arquitetura atual, arquitetura alvo, operação e referências.
6. security/ — invariantes e riscos.
7. Código local — verdade final sobre o que está implementado.

## Índice

### Produto e marca

- brand-hospedfree.md — cores, logotipo e regras oficiais.
- brand/README.md — índice da documentação detalhada de marca.
- brand/brand.md — personalidade, posicionamento e aplicação.
- brand/design-system.md — tokens, tipografia, contraste e temas.
- brand/content.md — voz, mensagens e terminologia.
- brand/components.md — contratos de componentes.
- brand/site-structure.md — arquitetura da experiência pública.

### Sistema

- system/module-map.md — base atual, candidatos a reaproveitamento e módulos alvo.
- system/reference-systems.md — HospedFree antigo, plugins e Bixa, apenas como referência.
- system/operations.md — desenvolvimento, execução e operação segura.
- system/divergences-and-known-issues.md — divergências e decisões pendentes.
- system/localization.md — localização e português do Brasil.
- system/ai-rules.md — regras para agentes.
- system/biolink-themes.md e system/biolink-widgets.md — inventário herdado fora do escopo.
- system/vebto-docs-map.md — proveniência histórica da base, não documentação HospedFree.

### Segurança e histórico

- security/security-audit.md — baseline e requisitos do produto alvo.
- audits/ — registros históricos da estabilização da base anterior.
- audits/hospedfree-documentation-rebrand.md — decisões e validação desta conversão documental.
- migrations/remove-license-system.md — histórico da remoção do licenciamento legado.
- ai/impeccable.md — uso da skill de qualidade visual.

## Acervos herdados

Os diretórios abaixo não definem a marca ou o produto HospedFree:

- 66biolinks (47 - 69)/ — corpus de terceiros/referência.
- themes/linkbio/ — imagens de temas da base de biolinks.
- imagensExemplo/ — imagens de exemplo antigas.
- brand/assets/meulinkbio-color-system-v1.1.pdf — documento visual legado.

Eles permanecem intactos para auditoria e futura limpeza controlada. Não devem aparecer em novas telas, materiais ou decisões de marca.

## Estados documentais

- Atual: confirmado no código atual.
- Reutilizável: existe na base, mas exige revisão para HospedFree.
- Alvo: aprovado para o produto, ainda não necessariamente implementado.
- Referência: informa fluxo ou domínio; nunca deve ser copiado automaticamente.
- Aberto: depende de decisão de produto, negócio ou infraestrutura.

## Regra de atualização

Toda mudança relevante deve atualizar o documento mais próximo do assunto. Documentação nunca deve conter senhas, tokens, cookies, chaves, payloads privados ou valores copiados de ambientes reais.
