# Temas de biolink — inventário herdado

## Estado

Este módulo pertence à base MeuLinkBio e está fora do produto HospedFree.

O código atual inclui modelos, configuração, editor, renderer público, rotas administrativas e testes relacionados a temas de biolink. Ele continua fisicamente presente para que a conversão não quebre a base.

## Regra

- não divulgar como recurso HospedFree;
- não desenvolver novos temas;
- não usar imagens de docs/themes/linkbio na marca;
- não remover migrations, modelos, rotas ou assets isoladamente;
- preservar páginas/dados existentes até uma decisão de migração;
- mapear dependências antes de remover.

## Dependências a verificar

- app/Biolinks;
- controllers e policies;
- config/themes.php;
- editor e renderer em resources/client;
- configurações administrativas;
- uploads e fontes;
- dados seedados;
- API gerada;
- traduções;
- testes;
- imagens em docs/themes/linkbio.

## Saída futura

Um plano separado deve decidir entre:

- remover integralmente;
- extrair para outro produto;
- reaproveitar apenas infraestrutura genérica.

Analytics, uploads, themes e public rendering não devem ser chamados de genéricos sem auditoria.
