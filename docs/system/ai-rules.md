# Regras para agentes — HospedFree

## Ordem de leitura

1. AGENTS.md da raiz.
2. PRODUCT.md.
3. DESIGN.md.
4. docs/brand-hospedfree.md para trabalho visual ou de conteúdo.
5. docs/system/module-map.md para arquitetura.
6. docs/system/reference-systems.md quando o assunto vier do projeto antigo, plugins ou Bixa.
7. docs/security/security-audit.md para qualquer fluxo sensível.

## Classificação obrigatória

Antes de propor ou documentar um recurso, classifique-o:

- atual: confirmado no código local;
- reutilizável: existe na base herdada e exige adaptação;
- alvo: aprovado, mas pode não existir;
- referência: observado em outro projeto, sem autorização de cópia;
- aberto: depende de decisão.

Não converter referência em implementado por inferência.

## Limites rígidos

- Não modificar D:\ARQUIVOS\PROJETOS\2025\SITES\hospedfree nem seu bixa-2.0.1.
- Não copiar código, configuração, segredo, banco, asset ou payload desses projetos.
- Não usar MOFH, AMVHost, Bixa, Botble, BeLink ou Vebto como marca pública.
- Não inventar preços, limites, uptime, métricas, integrações ou prazos.
- Não usar o valor histórico de R$ 5,90 como preço aprovado.
- Não manter links, biolinks e QR Codes como recursos do HospedFree por conveniência.
- Não reintroduzir licença Envato/Vebto, purchase code ou updater remoto.
- Não editar arquivos gerados da skill Impeccable.

## Arquitetura

- O código local é a verdade sobre implementação.
- Manter integrações de hosting atrás de interfaces/adapters.
- Separar pedido, cobrança, provisionamento e ativação.
- Tornar operações de provider idempotentes.
- Manter recursos do cliente associados ao usuário/workspace atual até uma migração de identidade aprovada.
- Não copiar o modelo members/member_id da aplicação Botble antiga.
- Preservar billing existente enquanto se projeta o catálogo de hospedagem paga.

## Frontend

- Usar shadcn, depois a biblioteca UI da foundation.
- Usar Trans com mensagens estáticas.
- Usar Lucide.
- Preferir tokens semânticos.
- Seguir a marca canônica e os logos oficiais.
- Incluir loading, vazio, erro, permissão, limitação de plano e operação em andamento.
- Credenciais ficam mascaradas por padrão.

## Segurança

- Nunca registrar ou retornar senha de hospedagem, token, cookie, 2FA, chave privada ou segredo de pagamento.
- Criptografar credenciais recuperáveis quando armazenamento for inevitável.
- Redigir payloads e exceções.
- Validar autenticação, propriedade, política e escopo em toda operação.
- Autenticar callbacks e webhooks.
- Bloquear path traversal e arquivos sensíveis em ZIP/Git.
- Executar testes reais de MOFH/DNS/ACME somente em ambiente autorizado e descartável.

## Documentação

- Preservar fatos históricos como históricos.
- Atualizar source maps quando caminhos ou responsabilidades mudarem.
- Não colar páginas inteiras de fornecedores.
- Nunca incluir conteúdo de .env real.
- Marcar datas de revisão em documentos operacionais.
- Se a documentação alvo divergir do código, declarar a divergência.

## Validação

- Escolher checks proporcionais ao que mudou.
- Não afirmar que um comando passou sem executá-lo.
- Em trabalho documental, verificar caminhos, links, termos de marca, vazamento de segredo e consistência de estados.
- Em código sensível, adicionar teste focado antes de confiar em checks globais.
