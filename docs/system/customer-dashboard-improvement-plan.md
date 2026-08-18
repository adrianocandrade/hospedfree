# Plano de melhoria do painel do cliente

Revisado em: 2026-08-12

## Objetivo

Transformar o dashboard do cliente em uma central operacional clara, começando por uma página inicial real em `/dashboard`. O cliente deve compreender rapidamente o estado da hospedagem, o uso da conta, o plano atual, as próximas ações e onde pedir ajuda.

Este plano vem antes da próxima etapa de integração Bixa. A interface será construída sobre o dashboard Foundation existente e consumirá os contratos provider-neutral já definidos. Não será criado um segundo sistema visual ou uma camada paralela de navegação.

## Direção visual dos anexos

Os dois anexos fornecidos na conversa em 12 de agosto de 2026 são referências de direção visual, não layouts para cópia literal. O manifesto permanente das referências está em `docs/design-references/hospedfree-dashboard/README.md`:

- **Anexo 1 — detalhe da hospedagem/domínio:** orienta hierarquia de status, ações rápidas, resumo técnico, health check, recursos e ações de domínio.
- **Anexo 2 — visão geral do cliente:** é a principal referência da nova home, com saudação, resumo da conta, uso de recursos, atalhos, plano e acesso a ajuda.

Elementos aprovados como direção:

- navegação de hospedagem fácil de escanear;
- status e próxima ação acima de detalhes secundários;
- uso de recursos em posição de destaque;
- atalhos operacionais agrupados;
- card contextual de upgrade e resumo compacto de recursos na sidebar;
- densidade controlada, cards bem delimitados e boa leitura em tema escuro.

Os anexos não autorizam:

- copiar cores, ilustrações 3D, ícones ou assets sem origem e direitos confirmados;
- publicar os números ilustrativos de disco, tráfego, domínios ou datas;
- prometer "sem anúncios", suporte prioritário, SSL ou qualquer benefício não configurado no produto pago;
- substituir componentes Foundation por cards independentes sem necessidade;
- tornar o tema escuro o único tema. O contrato oficial continua com tema claro como padrão e escuro opcional.

As imagens originais ainda não estão disponíveis como arquivos locais. Quando forem fornecidas dessa forma, devem ficar em `docs/design-references/hospedfree-dashboard/`, identificadas como `reference-only` e sem dados reais de clientes.

## Job e público

Modo da superfície: **Operate**.

O cliente chega ao painel normalmente sem conhecimento técnico avançado. Ele precisa responder, nessa ordem:

1. Minha hospedagem está funcionando?
2. Qual domínio e plano estão ativos?
3. Quanto dos recursos eu já usei?
4. O que posso fazer agora?
5. Existe algum problema que exige minha atenção?
6. Como faço upgrade ou peço ajuda?

Sucesso significa concluir a próxima ação sem sair do dashboard e sem precisar interpretar termos ou estados brutos do provider.

## Arquitetura de informação

### Rotas

| Rota                                     | Papel planejado                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `/dashboard`                             | Nova home do cliente com resumo da conta e da hospedagem selecionada. Não redireciona automaticamente. |
| `/dashboard/hosting`                     | Lista/onboarding de hospedagens e seleção de conta.                                                    |
| `/dashboard/hosting/{account}`           | Detalhe operacional da hospedagem.                                                                     |
| `/dashboard/hosting/{account}/domains`   | Domínios e subdomínios da conta.                                                                       |
| `/dashboard/hosting/{account}/files`     | File Manager/WebFTP.                                                                                   |
| `/dashboard/hosting/{account}/databases` | Bancos MySQL.                                                                                          |
| `/dashboard/hosting/{account}/ssl`       | Certificados e validação.                                                                              |
| `/dashboard/hosting/{account}/tools`     | Painel, instalador, Site Builder e ferramentas autorizadas.                                            |
| `/dashboard/hosting/plans`               | Comparação e upgrade dentro do dashboard.                                                              |
| `/dashboard/support`                     | Chamados do cliente.                                                                                   |
| `/faq`                                   | Base pública de conhecimento, fora do shell autenticado.                                               |

### Navegação principal

Menu recomendado:

1. Visão geral;
2. Minha hospedagem;
3. Planos;
4. Suporte;
5. Central de ajuda;
6. Minha conta.

O seletor de conta pode aparecer no cabeçalho quando existir mais de uma hospedagem. Workspace permanece oculto. A seleção precisa persistir de forma segura e nunca alterar o ownership real.

## Home do cliente

### Ordem de conteúdo

1. **Resumo principal:** saudação, plano, domínio primário, status e data relevante.
2. **Atenção necessária:** falha, provisionamento, suspensão, pagamento, SSL, limite ou exclusão pendente. Este bloco substitui conteúdo promocional quando há risco operacional.
3. **Uso de recursos:** disco, tráfego/banda, inodes e quotas disponíveis, com atualização e período explícitos.
4. **Ações rápidas:** somente ações reais e autorizadas para a conta selecionada.
5. **Resumo da conta:** quantidades reais de domínios, hospedagens, bancos e certificados.
6. **Hospedagem e domínio principal:** estado e links para gerenciamento.
7. **Plano atual:** condição comercial e CTA contextual.
8. **Atividade recente e notificações:** somente eventos locais auditáveis e notificações existentes.
9. **Ajuda:** links para FAQ e abertura de chamado.

### Estados obrigatórios

- nenhuma hospedagem: home de ativação com criação do Free;
- provisionando: progresso e próxima verificação, sem métricas inventadas;
- ativa com estatísticas: home completa;
- ativa sem estatísticas: estado recuperável com última sincronização;
- suspensa ou `action_required`: alerta prioritário e ação segura;
- exclusão pendente: prazo e cancelamento visível;
- plano pago sem renovação ou com inadimplência: estado comercial separado do estado remoto;
- múltiplas hospedagens: seletor e dados sempre escopados à conta escolhida;
- loading, erro, offline, sem permissão e dados parciais;
- domínios longos, textos traduzidos maiores e valores de quota ausentes.

## Sidebar

### Card de upgrade

Exibir somente quando:

- o cliente estiver no Free;
- existir pelo menos um produto pago público elegível;
- houver preço, package remoto e gateway habilitado;
- a feature flag de hospedagem paga estiver ativa.

Conteúdo:

- nome do plano alvo ou chamada genérica traduzida;
- no máximo quatro benefícios reais derivados do produto/quotas configurados;
- CTA para `/dashboard/hosting/plans`;
- sem preço ou economia inventados.

Para cliente pago, substituir o upsell por resumo do plano/renovação e ação "Gerenciar plano" quando essa informação estiver disponível.

Comportamento responsivo:

- desktop com sidebar expandida: card completo;
- sidebar recolhida: não comprimir o card em ícones sem significado;
- tablet/mobile: mover a oportunidade de upgrade para a home, depois do estado operacional e do uso;
- nunca cobrir navegação, rodapé ou conteúdo rolável.

### Resumo de recursos

Mostrar um resumo compacto dos dois recursos mais relevantes ou mais próximos do limite. O painel completo permanece na home.

Regras:

- dados vêm de `HostingPanelProvider::stats` e quotas consolidadas do plano;
- exibir valor usado, limite, unidade e porcentagem somente quando calculáveis;
- limite desconhecido não é "ilimitado";
- estado desatualizado mostra horário da última sincronização;
- atingir limites usa texto e ícone, não apenas mudança de cor;
- o antigo `useUsage` de links/biolinks não pode alimentar o painel HospedFree.

## Componentes e dados

Reutilizar primeiro:

- `DashboardLayout`, `Sidebar`, `Tabs`, `Item`, `Alert`, `Badge`, `Meter`, `Skeleton`, `Button`, dropdowns e dialogs Foundation/shadcn;
- produtos, preços, subscriptions, invoices e feature lists da base de billing;
- eventos de `HostingAccountEvent` para atividade recente;
- notificações atuais somente quando relacionadas ao cliente;
- contratos provider-neutral para stats, domínios, bancos, SSL e ferramentas.

Novos componentes devem ser pequenos e reutilizáveis:

- `HostingDashboardHome`;
- `HostingAccountSummary`;
- `HostingStatusNotice`;
- `HostingResourceSummary` e `HostingResourceMeter`;
- `HostingQuickActions`;
- `HostingPlanUpgradeCard`;
- `HostingRecentActivity`;
- `HostingHelpCard`.

Não criar um segundo conjunto de botões, cards, badges ou gráficos se o Foundation já atender ao papel.

## Contrato de dados planejado

Criar um agregador próprio da home, sem reutilizar payloads legados de links:

- `GET /api/v1/hosting/dashboard` para conta selecionada, resumo comercial e estados locais;
- `GET /api/v1/hosting/accounts/{account}/stats` para uso/quota provider-neutral;
- `GET /api/v1/hosting/accounts/{account}/activity` para eventos auditáveis paginados;
- manter ferramentas em `GET/POST /api/v1/hosting/accounts/{account}/tools`;
- dados precisam respeitar policy de conta e workspace pessoal;
- nenhuma resposta inclui senha, cookie, token, chave privada ou payload bruto.

O formato deve distinguir:

- `used`, `limit`, `unit` e `percentage`;
- `measured_at` e `is_stale`;
- `available`, `unavailable`, `loading`, `failed` e `not_supported`;
- status comercial, status local e status remoto sem misturá-los.

## Tarefas executáveis

### HF-DASH-01 — Baseline e arquitetura

- [x] Capturar screenshots reais do dashboard atual em desktop e mobile. Tablet permanece no passe completo de responsividade.
- [x] Mapear componentes Foundation reutilizáveis e remover dependência visual de módulos de links.
- [x] Definir o payload do agregador da home e o schema de stats.
- [ ] Confirmar estados e limites reais disponíveis no MOFH/VistaPanel.
- [x] Registrar quais dados dos anexos são apenas ilustrativos.

Aceite: mapa de componentes/dados revisado e nenhuma métrica fictícia necessária para renderizar a página.

### HF-DASH-02 — Home e rotas

- [x] Substituir o redirect de `/dashboard` pela home real.
- [x] Implementar zero-account/onboarding, provisioning, active, attention e partial-data states.
- [x] Adicionar seletor de hospedagem quando houver múltiplas contas.
- [x] Garantir que links internos permaneçam no dashboard.
- [x] Atualizar menus armazenados no banco por migration idempotente; não criar fallback de menu no código.

Aceite: `/dashboard` funciona como ponto inicial consistente antes e depois da criação da hospedagem.

### HF-DASH-03 — Uso e resumo da conta

- [x] Implementar endpoint provider-neutral de estatísticas.
- [ ] Integrar disco, banda/tráfego, inodes, domínios, bancos e SSL somente quando disponíveis.
- [x] Criar meters e tendência/gráfico apenas quando houver série temporal real.
- [ ] Mostrar última atualização, dado parcial, indisponível e retry.
- [x] Adicionar testes de ownership e ausência de credenciais.

Aceite: valores da home correspondem ao provider/plano e falhas não derrubam o restante do dashboard.

### HF-DASH-04 — Ações rápidas e atividade

- [x] Montar atalhos a partir da disponibilidade real das ferramentas.
- [x] Desabilitar com explicação recursos ainda não configurados.
- [x] Listar eventos recentes de conta sem expor payloads técnicos.
- [ ] Integrar notificações existentes sem duplicar o sistema Foundation.
- [ ] Garantir feedback imediato após operações.

Aceite: nenhuma ação é decorativa e toda ação remota possui feedback, auditoria e estado recuperável.

### HF-DASH-05 — Upgrade contextual

- [x] Criar seletor do melhor plano elegível sem fixar produto no código.
- [x] Derivar benefícios e quotas do produto/plano configurado.
- [x] Criar card Premium na sidebar expandida.
- [x] Criar versão inline para mobile e para sidebar recolhida.
- [x] Substituir upsell por gerenciamento para clientes pagos.
- [ ] Validar checkout e retorno mantendo o usuário no fluxo autenticado.

Aceite: o card só aparece com oferta realmente contratável e nunca apresenta benefício/preço inventado.

### HF-DASH-06 — Responsividade, acessibilidade e temas

- [ ] Validar larguras de 320, 375, 768, 1024, 1440 e 1920 px.
- [ ] Definir ordem mobile: estado, próxima ação, recursos, atalhos, plano, resumo e ajuda.
- [ ] Garantir touch targets, foco, headings e nomes acessíveis.
- [ ] Validar tema claro oficial e tema escuro opcional.
- [ ] Testar zoom 200%, textos longos e português traduzido.
- [ ] Respeitar `prefers-reduced-motion` em gráficos/transições.

Aceite: nenhuma rolagem horizontal da página, ações críticas continuam visíveis e status não depende de cor.

### HF-DASH-07 — Verificação visual e técnica

- [ ] Testes de componentes e queries.
- [x] Testes de IDOR para home, stats e atividade.
- [ ] Testes de Free, pago, sem oferta, falha de provider e múltiplas contas.
- [x] Inspeção visual em um passe combinado desktop/mobile e uma confirmação final.
- [x] `composer test:php`, typecheck, lint focado, build e route list.
- [x] Atualizar documentação e screenshots somente com dados descartáveis.

Aceite: implementação corresponde à direção dos anexos sem quebrar os padrões Foundation nem declarar recursos inexistentes.

## Sequência recomendada

1. HF-DASH-01 e contrato de dados.
2. HF-DASH-02 com home e estados locais.
3. HF-DASH-03 após o primeiro adapter real de estatísticas.
4. HF-DASH-04 em paralelo com ferramentas reais do bloco Bixa.
5. HF-DASH-05 quando o catálogo pago estiver configurado e testável.
6. HF-DASH-06 e HF-DASH-07 antes do handoff.

O esqueleto da home pode ser construído antes da paridade total, mas cards dependentes devem permanecer ausentes ou explicitamente indisponíveis até suas APIs reais existirem.

## Progresso — 2026-08-12

- `/dashboard` agora é uma home real e não redireciona para a lista de hospedagens.
- A home possui estados sem conta, conta ativa, conta em processamento/atenção e dados parciais.
- O seletor usa somente contas presentes na resposta escopada ao cliente e persiste a seleção na URL.
- Foram adicionados endpoints protegidos para stats e atividade; o payload de atividade aceita apenas metadados em lista permitida.
- Disco, tráfego e inodes usam `Meter` Foundation; nenhum gráfico é exibido sem série temporal real.
- Ações rápidas respeitam as capacidades expostas pela conta e permanecem desabilitadas com explicação quando indisponíveis.
- Upgrade e plano atual são derivados do catálogo público já elegível; benefícios vêm do produto configurado.
- A sidebar expandida ganhou resumo de plano e recursos, e a home mantém o card de plano disponível em layouts compactos.
- A migration `2026_08_12_010000_add_customer_dashboard_overview_navigation` atualizou menus e homepage no banco sem fallback de menu no código.
- A inspeção Playwright em 1440 px e 375 px passou sem erros de console; o passe também corrigiu o contraste dos logos claro/escuro e compactou o menu inferior para cinco colunas previsíveis.
- O adapter real VistaPanel agora autentica somente no servidor e fornece disco, tráfego e inodes normalizados; credenciais, cookies e HTML bruto não chegam ao frontend ou aos logs.
- Validação executada: suíte completa com 263 testes e 1154 assertions, TypeScript, Oxlint focado, build de produção, route list e inspeção Playwright. O build preserva avisos herdados sobre `eval` no módulo antigo de anúncios e chunks grandes.

Pendente antes do aceite final: contagens reais de domínios, bancos e SSL, última medição/retry visíveis, notificações, retorno do checkout e matriz completa de responsividade/temas.

- `/dashboard/hosting/{account}` now consumes real account, domain, tool and statistics responses. The previous illustrative chart, fixed directory/IP values, fake check time and decorative tool actions were removed. File Manager routes to the native account-scoped browser and Site Builder creates its server-side Site.Pro session.
- The detail page has explicit unavailable states for VistaPanel-dependent statistics and databases, and its desktop/mobile visual check passes without horizontal overflow or browser errors.
- The hosting detail visual hierarchy was restored after the real-data pass: branded status hero, four high-signal quick actions, richer resource states, technical tiles and a dedicated operational summary column now follow the supplied account-overview direction in both themes without reintroducing illustrative values.

## Fora deste plano

- redesenho do admin;
- alteração da identidade oficial ou do logotipo;
- invenção de novas quotas ou preços;
- migração de contas/dados do Bixa;
- criação de ilustrações finais antes da definição de origem/licença;
- substituir FAQ pública ou fluxo de suporte já planejados.
