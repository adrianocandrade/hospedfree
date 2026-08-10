# Sistema visual — HospedFree

> Contrato alvo. A base herdada ainda pode usar tokens de MeuLinkBio.

## Tokens

| Papel | Claro |
| --- | ---: |
| Background | #F8F8FC |
| Foreground | #202034 |
| Card / Popover | #FFFFFF |
| Primary | #5C5AA4 |
| Primary foreground | #FFFFFF |
| Secondary | #F0EFF8 |
| Secondary foreground | #202034 |
| Muted | #F0EFF8 |
| Muted foreground | #6F7083 |
| Accent | #766CAF |
| Accent foreground | #FFFFFF |
| Border / Input | #DDDCEA |
| Ring | #5C5AA4 |
| Destructive | #B91C1C |

O tema escuro deve ser derivado semanticamente e validado no produto real. Não manter duas paletas independentes nem mapear tokens por semelhança visual sem teste de contraste.

## Tipografia

- Inter para corpo e interface.
- Manrope é fallback e pode orientar títulos quando já estiver disponível.
- Títulos de marketing: 700–800.
- Títulos de interface: 600–700.
- Corpo: 400–500.
- Labels e botões: 500–600.
- Base recomendada: 16 px no site e 14–16 px em ferramentas densas, sem reduzir legibilidade.

## Espaço e forma

- escala de 4 px;
- alvo mínimo de 44 por 44 px;
- campos comuns com 44–48 px;
- cards de painel com raio de 12–16 px;
- blocos de marketing até 24 px;
- bordas discretas;
- sombra leve apenas quando indicar elevação.

## Layout

- conteúdo público com largura de leitura controlada;
- painel com navegação lateral no desktop e navegação adaptada no mobile;
- densidade maior no admin, nunca à custa de clareza;
- tabelas responsivas preservam rótulos e ações;
- domínios, caminhos e identificadores longos têm tratamento de overflow.

## Estados

Todo componente relevante deve considerar:

- loading;
- vazio;
- sucesso;
- atenção;
- erro recuperável;
- erro bloqueante;
- indisponível;
- sem permissão;
- limitado pelo plano;
- operação em andamento.

Status não usa apenas cor. Mostrar rótulo, explicação curta e próxima ação.

## Gráficos e recursos

Gráficos de uso devem partir do roxo principal e cores funcionais, sempre com legenda e valor textual. Não criar uma paleta arco-íris para categorias técnicas.

Medidores de quota:

- mostram usado e limite;
- explicam o período;
- avisam antes do bloqueio;
- não arredondam de forma enganosa;
- oferecem ação relacionada quando existir.

## Claro e escuro

Claro é a referência institucional. Escuro é uma preferência de interface:

- sem preto absoluto dominante;
- primary permanece reconhecível;
- muted text mantém AA;
- warning/error/success são ajustados para a superfície;
- logos usam a variante apropriada;
- screenshots nunca misturam temas sem contexto.

## Implementação

Usar componentes shadcn, tokens semânticos do Tailwind e Lucide. Não espalhar hexadecimais pelos componentes. A migração dos tokens atuais precisa ser planejada e validada, pois este documento não modifica o código.

## Validação mínima

- contraste WCAG 2.2 AA;
- foco visível;
- teclado;
- zoom a 200%;
- 360, 430, 768 e 1440 px;
- modo escuro quando disponível;
- textos longos e dados ausentes;
- redução de movimento;
- estados de loading, erro e sem permissão.
