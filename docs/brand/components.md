# Componentes de produto — HospedFree

> Contratos alvo. Implementar somente quando o domínio correspondente estiver aprovado.

## Regras comuns

Todos os componentes devem:

- usar tokens semânticos e componentes compartilhados;
- ter loading, vazio, erro e ausência de permissão quando aplicável;
- oferecer foco visível e navegação por teclado;
- manter alvos de 44 px;
- preservar dados preenchidos após falha;
- não expor segredo em HTML, log, tooltip ou analytics;
- distinguir disponibilidade do recurso, permissão e limite do plano.

## HostingStatusCard

Conteúdo:

- nome amigável;
- domínio principal;
- estado legível;
- plano;
- última atualização;
- próxima ação.

Não mostrar status bruto do provedor como mensagem principal.

## DomainCard

Conteúdo:

- domínio/subdomínio;
- papel: principal, adicional ou temporário;
- DNS;
- SSL;
- ação de abrir/copiar/configurar;
- ajuda contextual.

Domínio longo deve truncar visualmente sem perder acesso ao valor completo.

## ResourceUsage

Conteúdo:

- recurso;
- valor usado;
- limite;
- período ou momento da medição;
- nível textual;
- ação quando útil.

Não mostrar percentuais quando o provedor não fornece medidas confiáveis.

## ProvisioningTimeline

Representa pedido, pagamento, provisionamento e ativação como etapas separadas. Exibe horário, estado e falha recuperável, sem payloads do provedor.

## CredentialField

Estados:

- mascarado;
- revelando;
- visível;
- copiado;
- redefinindo;
- indisponível.

Revelação pode exigir autenticação recente. Ações de reset explicam impacto e pedem confirmação.

## PlanCard

Conteúdo:

- nome;
- público indicado;
- preço/moeda/período, quando aprovado;
- limites essenciais;
- recursos;
- renovação;
- CTA;
- estado atual ou indisponível.

Free e Pago usam a mesma linguagem visual. Nenhum valor provisório pode aparecer.

## PlanComparison

- mesmas unidades em todas as colunas;
- cabeçalho fixo quando necessário;
- suporte a mobile sem tabela ilegível;
- diferença real destacada;
- legenda para termos técnicos;
- CTA alinhado ao estado do cliente.

## DeploymentCard

Conteúdo:

- origem;
- destino;
- último estado;
- horário;
- ação segura de repetir;
- log resumido e redigido.

Deploy por Git ou ZIP deve mostrar validação, progresso e falha sem listar arquivos secretos.

## SSLStatus

- domínio;
- estado do certificado;
- validade quando disponível;
- renovação;
- explicação e ação.

Nunca expor chave privada. Não prometer emissão antes da validação real.

## SupportTicketCard

- assunto;
- categoria;
- hospedagem relacionada;
- prioridade quando usada;
- estado;
- última resposta;
- ação.

Não mostrar contagem global ou dados de outro cliente.

## KnowledgeArticleCard

- título;
- resumo;
- categoria;
- atualização;
- tempo de leitura opcional;
- relação com a tarefa.

## EmptyState

Explica por que não há conteúdo e oferece um próximo passo. Diferenciar:

- primeiro uso;
- filtro sem resultado;
- recurso indisponível;
- falta de permissão;
- limite do plano;
- falha de carregamento.

## InlineAlert e Toast

- alertas persistentes para problemas que afetam o site;
- toast para confirmações temporárias;
- aria-live adequado;
- mensagem objetiva;
- ação quando recuperável;
- não empilhar notificações repetidas.

## ConfirmDialog

Obrigatório para suspensão, exclusão, troca de pacote com impacto, reset de credencial, migração e outras ações destrutivas.

- nomear o recurso afetado;
- explicar consequência;
- indicar reversibilidade;
- bloquear dupla submissão;
- manter foco correto.

## AdminDataTable

- busca e filtros;
- paginação;
- colunas essenciais;
- estado persistente quando útil;
- ações com permissão;
- exportação sem segredo;
- alternativa responsiva.

## Formulários

- label visível;
- ajuda e erro associados;
- placeholder não substitui label;
- não limpar após falha;
- obrigatoriedade explícita;
- validação do servidor continua sendo a autoridade;
- erros de provider são traduzidos em instruções seguras.
