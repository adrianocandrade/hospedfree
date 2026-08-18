# Sistema visual — HospedFree

> Contrato alvo. A base herdada ainda pode usar tokens de MeuLinkBio.

## Tokens

| Papel | Claro | Escuro Product Eclipse |
| --- | ---: | ---: |
| Background | #F8F8FC | #080916 |
| Foreground | #202034 | #F5F4FB |
| Card | #FFFFFF | #111426 |
| Popover | #FFFFFF | #15182C |
| Primary | #5C5AA4 | #625DEB |
| Primary foreground | #FFFFFF | #FFFFFF |
| Secondary | #F0EFF8 | #181B31 |
| Secondary foreground | #202034 | #F5F4FB |
| Muted | #F0EFF8 | #15182C |
| Muted foreground | #6F7083 | #A4A7BB |
| Accent | #766CAF | #222148 |
| Accent foreground | #FFFFFF | #F5F4FB |
| Border | #DDDCEA | #292C44 |
| Input | #8E8AA7 | #606487 |
| Ring | #5C5AA4 | #625DEB |
| Destructive | #B91C1C | #FCA5A5 |

O tema escuro usa os mesmos papéis Product Eclipse na landing, no painel e no admin. A composição de cada superfície continua própria: a landing persuade; as áreas autenticadas priorizam operação, leitura e estado. Não copiar seletores da landing para telas de produto.

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
