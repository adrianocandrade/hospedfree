# Plano de expansão comercial do HospedFree

Revisado em: 2026-08-17

## Objetivo

Transformar a hospedagem gratuita em porta de entrada para produtos recorrentes sem misturar direito comercial, provisionamento técnico e estado exibido ao cliente. Todo produto pago precisa ter preço, provedor configurado, operação recuperável e margem conhecida antes de aparecer como comprável.

## Decisão comercial aprovada

| Oferta | Estado | Preço | Limites aprovados | Entrega interna |
| --- | --- | --- | --- | --- |
| Free | Oferta atual aprovada | R$ 0 | Limites do pacote Free administrados no catálogo atual | Pacote gratuito atual |
| Hospedagem Pro | Oferta atual aprovada; só fica comprável após sincronização segura do preço, gateway habilitado e mapeamento remoto ativo | R$ 9,90/mês ou R$ 99/ano | 10 GB de disco, 150 GB de tráfego mensal, 5 domínios, 10 bancos MySQL e sem anúncios | Pacote interno MOFH `pro`; publicamente aparece apenas como Hospedagem Pro |
| Dois planos Premium | Alvo futuro, indisponível para compra | Em aberto | Em aberto até validar custo, capacidade e suporte | AndradeHost/KeyHelp, após adapters e smoke tests autorizados |

O preço aprovado não transforma pagamento em ativação técnica. Checkout, assinatura, direito comercial, mudança de pacote e estado da hospedagem continuam separados e recuperáveis.

## Estado da conversão comercial

| Capacidade | Estado no painel | Limite atual |
| --- | --- | --- |
| Nova hospedagem | Catálogo real, verificação do subdomínio, uma vaga Free e pedidos pagos adicionais conforme o limite configurado | O plano pago só abre checkout quando preço, pacote remoto, flag comercial e gateway suportado estiverem ativos |
| Site.pro | Lista pesquisável de sites/domínios e abertura por sessão autorizada do servidor | Disponibilidade técnica do editor não é apresentada como entitlement ou plano comercial do Site.pro |
| SSL | Lista filtrável e paginada, solicitação por domínio ativo, verificação, renovação e revogação conforme o estado | Certificado comercial ainda não possui catálogo; instalação remota depende do contrato verificado do painel |
| Domínios | Pesquisa local, subdomínio gratuito e verificação DNS de domínio próprio | Registro e transferência permanecem claramente indisponíveis até o adapter ResellerClub retornar preço e disponibilidade reais |
| Pedidos pagos | Pedido antes do checkout, correlação exata com tentativa/assinatura, reconciliação finita e reserva protegida | A ativação continua condicionada ao pagamento autorizado e ao provisionamento bem-sucedido; estados incertos exigem recuperação administrativa |
| KeyHelp e backup | Arquitetura e sequência documentadas | Nenhum produto é publicado antes do adapter, custo, quota, retenção e smoke test autorizados |

## Portfólio-alvo

| Linha | Entrada | Oferta paga | Integração planejada | Regra principal |
| --- | --- | --- | --- | --- |
| Hospedagem | Uma hospedagem Free por workspace pessoal | Hospedagem Pro básica por R$ 9,90/mês ou R$ 99/ano; dois planos Premium futuros sem preço aprovado | MOFH para Free e Pro atuais; AndradeHost/KeyHelp para os dois planos Premium futuros | Pagamento cria o direito; somente provisionamento confirmado ativa a hospedagem |
| Domínios | Subdomínio `hsite.top` | Registro, transferência e renovação de domínio próprio | ResellerClub atrás de `DomainRegistrarProvider` | Nunca exibir disponibilidade ou preço estimado como resultado real |
| Backup | Orientação manual no Free | Backup recorrente e restauração assistida | Infraestrutura própria atrás de `HostingBackupProvider` | Retenção, quota, criptografia e teste de restauração precisam estar configurados por plano |
| Site Builder | Sessão básica autorizada por domínio | Upgrade do construtor quando houver contrato e catálogo reais | Site.pro atrás de `HostingSiteBuilderProvider` | A HospedFree não inventa limites, preço, publicação ou plano remoto |
| SSL | Let's Encrypt/ACME quando tecnicamente instalável | Certificados comerciais opcionais | ACME/Cloudflare e, futuramente, catálogo de certificados do registrar | Emissão e instalação são estados diferentes; chave privada nunca chega ao navegador |
| E-mail | Não prometido no Free | E-mail profissional como produto separado | Catálogo futuro do ResellerClub ou servidor próprio | Caixa postal não deve ser apresentada como recurso da hospedagem antes do provisionamento |

## Funil recomendado

1. O visitante cria a única hospedagem gratuita e publica o primeiro site.
2. O painel identifica necessidades reais: limite de recurso, domínio próprio, backup, e-mail, suporte ou mais uma hospedagem.
3. O cliente escolhe um produto no contexto da conta ou domínio correto.
4. O sistema cria um pedido pendente e só então abre o checkout do gateway habilitado.
5. O webhook confirmado cria o direito comercial e agenda o provisionamento idempotente.
6. O painel mostra separadamente pagamento, preparação, ação necessária e serviço ativo.

## Regras já aplicadas ao checkout de hospedagem

- a mesma chave idempotente não pode ser reutilizada com outro plano, preço ou domínio;
- a assinatura precisa carregar a referência exata do pedido e pertencer ao mesmo usuário, produto, preço e customer/payer;
- retorno do navegador não é prova de pagamento; o estado remoto e os webhooks autenticados continuam sendo verificados;
- duas tentativas para o mesmo pedido não são simplesmente esquecidas: a excedente precisa ser cancelada remotamente antes de ser encerrada localmente;
- `past_due`, `unpaid`, `paused`, `SUSPENDED`, estado desconhecido ou contexto remoto divergente nunca provisionam uma hospedagem;
- um pagamento confirmado com falha posterior mantém a reserva em `action_required`, evitando liberar o domínio para outro cliente;
- registro e transferência de domínio, certificado comercial, upgrade do Site.pro, KeyHelp e backup não aparecem como compras reais antes dos respectivos adapters e catálogos estarem prontos.

## Regras de catálogo e margem

- Um produto só fica público quando tiver preço local, mapeamento remoto ativo e ao menos um gateway habilitado.
- Free e Hospedagem Pro são as únicas ofertas de hospedagem com decisão comercial aprovada nesta etapa. O Pro usa 10 GB de disco, 150 GB de tráfego mensal, 5 domínios, 10 bancos MySQL e não exibe anúncios por R$ 9,90/mês ou R$ 99/ano.
- O nome MOFH é apenas de integração interna. Catálogo, checkout, fatura e comunicação ao cliente usam `Hospedagem Pro`.
- Os dois planos Premium de AndradeHost/KeyHelp permanecem indisponíveis e sem preço até que custo real, quotas, adapter, capacidade e suporte sejam validados.
- Custos do provedor e preço de venda devem ser armazenados separadamente; margem não pode depender de texto ou JSON livre.
- Registro, renovação, transferência e restauração têm custos e operações diferentes, mesmo quando pertencem ao mesmo domínio ou backup.
- Preços vindos de um provedor precisam de sincronização versionada, cache com validade e revisão administrativa antes da publicação.
- Nunca substituir automaticamente um preço já contratado sem preservar o histórico comercial e a regra de renovação aplicável.
- Produtos de terceiros devem deixar claro o responsável técnico e o compartilhamento mínimo de dados na política de privacidade.

## Contratos internos necessários

### `DomainRegistrarProvider`

- pesquisar disponibilidade e sugestões;
- consultar preço de registro, transferência e renovação por período;
- registrar e transferir com idempotência;
- consultar e reconciliar o pedido remoto;
- renovar e configurar renovação automática;
- normalizar códigos e mensagens sem devolver payload bruto.

### `PremiumHostingProvider`

- listar pacotes publicáveis;
- criar, consultar, suspender, reativar, alterar pacote e excluir conta;
- associar domínio, quota e servidor;
- gerar somente sessões autorizadas para painel e ferramentas;
- reconciliar a conta sem expor credenciais.

### `HostingBackupProvider`

- criar política por hospedagem;
- iniciar e consultar backup;
- listar pontos de restauração;
- restaurar com confirmação forte, auditoria e idempotência;
- aplicar retenção, quota e exclusão segura.

## Ordem de implementação

### 1. Múltiplas hospedagens e checkout contextual

- manter uma única vaga Free;
- permitir pedidos pagos adicionais conforme o limite de cada plano;
- reservar o endereço antes do checkout;
- anexar a assinatura confirmada ao pedido pendente correto;
- preservar o site e abrir ação operacional quando um pago encerrado não puder ocupar a vaga Free.

### 2. Domínios ResellerClub

- criar entidades de fornecedor, TLD, preço, pesquisa, pedido e ciclo de vida do domínio;
- implementar pesquisa real com rate limit, cache curto e indicação de validade do preço;
- suportar registro, transferência, uso de domínio existente e renovação;
- integrar o domínio contratado à hospedagem somente depois da confirmação do registrar;
- manter as opções indisponíveis e explicadas na interface até o adapter estar configurado e testado.

### 3. Hospedagem Premium no KeyHelp

- inventariar a integração existente em AndradeHost apenas como referência funcional;
- criar adapter novo e seguro, sem copiar credenciais, clientes ou payloads;
- definir os dois planos Premium somente depois de medir custos reais de servidor, backup, gateway, impostos e suporte;
- cadastrar produtos, preços e pacotes no catálogo atual apenas após essa validação, sem derivar preço do Hospedagem Pro/MOFH;
- provisionar como conta independente e oferecer migração assistida do site gratuito.

### 4. Backup recorrente

- definir armazenamento, criptografia, retenção, limites e custo por GB;
- implementar backup e restauração em conta descartável;
- vender como adicional da hospedagem paga e como upgrade isolado quando operacionalmente viável;
- exibir último backup válido e teste de restauração, não apenas “backup ativado”.

### 5. Site.pro, SSL e e-mail

- manter o Site Builder básico quando configurado;
- só publicar upgrade do Site.pro quando preço, entitlement e retorno do provedor forem verificáveis;
- manter Let's Encrypt como benefício técnico e separar certificado comercial em outro produto;
- adicionar e-mail profissional somente após contrato, provisionamento e suporte estarem definidos.

## Indicadores mínimos

- ativação: cadastro até primeira hospedagem ativa;
- publicação: hospedagens com domínio respondendo;
- conversão Free → pago por motivo e produto;
- receita recorrente, custo do provedor, margem bruta e falha de pagamento;
- pedidos pagos aguardando ou falhando no provisionamento;
- churn, downgrade, migração e tickets por produto;
- backups válidos e restaurações testadas;
- pesquisa de domínio → checkout → registro concluído.

## Bloqueios de lançamento

- nenhum segredo, cookie, senha, chave privada ou payload bruto em URL, frontend, e-mail ou log comum;
- webhooks autenticados, idempotentes e tolerantes a eventos duplicados/fora de ordem;
- ownership/IDOR testado em pedidos, hospedagens, domínios, backups e sessões de ferramenta;
- preço e disponibilidade precisam indicar sua fonte e validade; resultado simulado não pode parecer real;
- termos, privacidade, política de uso aceitável, cancelamento, reembolso e responsabilidade de terceiros revisados antes da venda pública;
- smoke test somente com conta, domínio e pagamento descartáveis autorizados.
