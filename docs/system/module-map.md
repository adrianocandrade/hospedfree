# Mapa de módulos — HospedFree

> Revisado em 10 de agosto de 2026

## Como ler

O repositório está entre dois estados:

- Base atual: Laravel 12/React 19 herdada do MeuLinkBio.
- Produto alvo: plataforma HospedFree de hospedagem gratuita e paga.

Este mapa impede que a intenção futura seja confundida com código existente.

## Camadas atuais

| Camada | Caminho | Estado |
| --- | --- | --- |
| Backend de produto | app/ | atual herdado |
| Backend compartilhado | common/foundation/src/ | atual, candidato a reuso |
| Frontend de produto | resources/client/ | atual herdado |
| Frontend compartilhado | common/foundation/resources/client/ | atual, candidato a reuso |
| API de produto | routes/api.php | atual herdado |
| API compartilhada | common/foundation/routes/api.php | atual |
| Web público | routes/web.php e common/foundation/routes/web.php | atual |
| Webhooks de billing | common/foundation/routes/webhooks.php | atual |
| Cliente API gerado | resources/client/gen/ | atual/gerado |

## Base herdada

### Candidatos a reaproveitamento

| Área | Local atual | Uso pretendido |
| --- | --- | --- |
| Autenticação e usuários | common/foundation/src/Auth e Users | contas HospedFree |
| Workspaces e permissões | common/foundation/src/Workspaces, Roles e Permissions | avaliar como limite de propriedade/admin |
| Billing e assinaturas | common/foundation/src/Billing | planos pagos de hospedagem |
| Configurações | common/foundation/src/Settings | configuração administrativa |
| Arquivos e uploads | common/foundation/src/Files e Images | base para uploads, nunca credenciais |
| Domínios personalizados | common/foundation/src/Domains | avaliar para domínio próprio |
| Notificações e e-mail | módulos da foundation | eventos de conta e hosting |
| Logs e auditoria | módulos da foundation | diagnóstico redigido |
| Localização | resources/lang e foundation locale | português e outros idiomas |
| Admin/layout/UI | frontend compartilhado | painel e operação |

Reutilizável não significa aprovado sem revisão de regras, modelos, políticas e experiência.

### Fora do escopo HospedFree

| Área herdada | Caminho principal | Tratamento |
| --- | --- | --- |
| Links curtos | app/Links | manter estável; planejar remoção/adaptação |
| Pastas de links | app/Folders | dependência herdada |
| Biolinks | app/Biolinks | manter estável; não comercializar |
| QR Codes | app/QrCodes | manter estável; não comercializar |
| Analytics de links | app/Analytics | avaliar reuso técnico, não manter semântica |
| Tracking pixels | app/TrackingPixels | fora do produto alvo |
| Link pages/overlays | app/LinkPages e app/LinkOverlays | fora do produto alvo |
| Widgets e temas de biolink | app/Biolinks e frontend correspondente | inventariado em documentos arquivados |

Nenhum desses módulos deve ser removido de forma destrutiva antes de mapear rotas, banco, políticas, jobs, traduções, testes e dependências geradas.

## Arquitetura alvo

### Identity and access

- conta do cliente;
- autenticação, e-mail verificado e 2FA;
- propriedade de recursos;
- permissões administrativas;
- auditoria.

Decisão atual: preservar users/workspaces como base até ADR específico. Não importar members/member_id do Botble antigo.

### Catalog and billing

- produtos Free e Pago;
- pacotes e limites;
- preço, moeda e período;
- pedidos;
- assinaturas, pagamentos e invoices;
- upgrade/downgrade/cancelamento.

Preço e limites continuam em aberto.

### Hosting accounts

- pedido de conta;
- endereço hsite.top;
- pacote;
- estado;
- identificadores internos do provider;
- credenciais protegidas;
- suspensão, reativação, alteração de pacote e encerramento.

### Provider integration

Contrato alvo:

- verificar disponibilidade de endereço;
- criar conta;
- consultar/sincronizar estado;
- suspender;
- reativar;
- encerrar;
- trocar senha;
- trocar pacote.

MOFH é a implementação inicial planejada. Controladores e jobs não devem depender de detalhes MOFH.

### Provisioning

Orquestra:

- validação do pedido;
- reserva do domínio;
- pagamento quando aplicável;
- criação idempotente;
- persistência segura do resultado;
- notificação;
- compensação ou suporte em falha.

Estados de pagamento e provisionamento são independentes.

### Domains, DNS and SSL

- hsite.top como domínio gratuito inicial;
- domínio principal/adicional;
- verificação DNS;
- integração opcional Cloudflare;
- emissão/renovação SSL;
- histórico seguro.

Custom domain, Cloudflare e ACME permanecem alvo até implementação verificada.

### Files and deployments

- entrada segura para gerenciamento de arquivos;
- WebFTP/File Manager ou console externo autorizado;
- instalação de aplicações;
- deploy ZIP;
- deploy Git.

Git v1 deve ser somente repositório público até existir desenho seguro de tokens. ZIP deve bloquear path traversal e arquivos sensíveis.

### Support and knowledge

- tickets associados à hospedagem;
- mensagens e categorias;
- base de conhecimento pública;
- busca, avaliações e artigos relacionados à tarefa;
- comunicação operacional.

### Admin and operations

- clientes, contas, pacotes e pedidos;
- fila e falhas de provisionamento;
- logs redigidos de provider;
- SSL/DNS;
- suporte e conteúdo;
- auditoria e configuração.

## Fluxo principal alvo

    cadastro
      -> escolha Free ou Pago
      -> endereço hsite.top
      -> validação de disponibilidade
      -> revisão
      -> pagamento, se Pago
      -> provisionamento
      -> ativação
      -> painel e onboarding

Qualquer etapa pode falhar sem perder rastreabilidade. Repetições não podem criar contas duplicadas.

## Regra de implementação

Antes de criar um módulo:

1. Verificar a capacidade equivalente na foundation.
2. Ler reference-systems.md apenas como domínio/requisitos.
3. Definir modelos, ownership, estados e idempotência localmente.
4. Definir adapter e política de segredo.
5. Implementar testes focados.
6. Atualizar este mapa com caminhos reais.
