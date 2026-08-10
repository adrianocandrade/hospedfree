# Estrutura alvo do site — HospedFree

> Esta arquitetura é uma proposta aprovada de conteúdo. A landing herdada ainda não representa o produto.

## Navegação

- Hospedagem gratuita
- Planos
- Recursos
- Ajuda
- Blog ou Status, somente quando existirem
- Entrar
- Começar gratuitamente

O menu mobile preserva ordem e ações. Não criar links sem destino real.

## Home

### 1. Header e hero

Objetivo: explicar que a pessoa pode colocar um site no ar gratuitamente e evoluir para hospedagem paga.

Conteúdo:

- proposta específica;
- referência ao hsite.top;
- CTA de cadastro;
- link para planos;
- visual real do fluxo quando disponível.

Não citar fornecedor nem usar mockup fictício.

### 2. Prova

Usar somente fatos verificáveis: capacidades ativas, status público, documentação, suporte e limites. O bloco pode ser omitido enquanto não houver dados confiáveis.

### 3. Como funciona

1. Crie sua conta.
2. Escolha o endereço hsite.top.
3. Publique seu site.

Se o fluxo real tiver etapas adicionais, o conteúdo deve acompanhar a implementação.

### 4. Hospedagem gratuita

Mostrar o que existe, limites e requisitos. Separar incluído, opcional e ainda não disponível.

### 5. Recursos

Agrupar por tarefa:

- publicar;
- administrar domínio e SSL;
- trabalhar com arquivos e banco;
- acompanhar a hospedagem;
- obter ajuda.

### 6. Planos gratuito e pago

Comparação honesta com preço somente quando aprovado. O pago é hospedagem recorrente, não apenas uma doação ou remoção de marca.

### 7. Painel

Mostrar tela real com domínio, status, SSL e próxima ação. Remover dados pessoais e credenciais.

### 8. Ajuda

Apontar para artigos, FAQ e suporte realmente disponíveis.

### 9. FAQ

Priorizar:

- o que está incluído;
- como funciona hsite.top;
- quais tecnologias são aceitas;
- limites;
- upgrade para pago;
- dados e migração;
- suporte e suspensão.

### 10. CTA e footer

Um CTA principal. Footer com produto, ajuda, empresa, status, legal e contato, desde que as rotas existam.

## Páginas

### Hospedagem gratuita

Detalha público, recursos, limites, fluxo, uso aceitável e próximos passos.

### Planos

Mostra Free e planos pagos ativos, moeda, período, renovação, limites e comparação.

### Recursos

Explica capacidades implementadas sem reproduzir jargão do provedor.

### Ajuda e conhecimento

Busca, categorias, artigos e rota para suporte. Artigos devem refletir a interface atual.

### Status

Somente criar quando houver fonte operacional real, histórico e política de atualização.

### Conteúdo legal

Termos, privacidade, cookies e uso aceitável exigem revisão jurídica antes de publicação. Templates herdados não são automaticamente válidos.

## Fluxos conectados

### Cadastro

- cadastro claro e curto;
- confirmação de e-mail quando configurada;
- captcha/rate limit conforme risco;
- aceite legal verificável;
- sem pedido obrigatório de dados desnecessários.

### Pedido gratuito

- escolher plano;
- escolher endereço;
- validar disponibilidade;
- revisar limites;
- provisionar;
- mostrar resultado ou recuperação.

### Pedido pago

- escolher plano;
- revisar cobrança;
- pagar;
- aguardar provisionamento;
- receber confirmação de ativação separada.

### Upgrade

- comparar plano atual e destino;
- explicar cobrança e efeito;
- confirmar;
- executar mudança idempotente;
- mostrar estado e recuperação.

## Regra de verdade

Se um recurso não existe ou não foi verificado, a página usa em breve de forma específica ou não mostra o recurso. Nunca simular preço, quota, status, tela ou depoimento.
