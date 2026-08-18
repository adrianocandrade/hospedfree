---
version: 2
slug: 'resources-client-landing-landing-page-tsx'
primary_target: 'resources/client/landing/landing-page.tsx'
related_targets:
  - 'resources/client/landing/landing-home.css'
  - 'resources/views/seo/landing-page/prerender.blade.php'
  - 'public/images/hospedfree'
---

# Landing HospedFree — Product Eclipse

Mode: Persuade.

## Direção visual

A landing usa uma direção **Product Eclipse / editorial dark**: fundo azul-marinho quase preto, tipografia clara e precisa, violeta HospedFree como acento, superfícies com contraste discreto e imagens reais do produto como principal prova visual. O resultado deve parecer uma marca de hospedagem madura e intencional, não um template SaaS genérico nem uma coleção de cards produzida por IA.

O ritmo é editorial: alternar texto, produto e respiro; variar proporções entre capítulos; usar brilho e geometria somente para enquadrar conteúdo real. Não repetir bento grids, halos, gradientes ou cards equivalentes em todas as seções. Ícones Lucide podem orientar leitura, mas nunca substituir as imagens principais.

## Jornada e narrativa

A página conta uma história única, nesta ordem:

1. **Promessa:** hospedagem gratuita para colocar o site no ar, com um caminho claro para crescer.
2. **Controle:** painel real, arquivos/WebFTP, domínios, SSL e bancos no mesmo fluxo.
3. **Criação:** construtor visual para quem prefere publicar sem começar do zero.
4. **Instalação:** Softaculous como caminho curto para WordPress e outros aplicativos.
5. **Processo:** criar conta, publicar e administrar em três passos concretos.
6. **Escolha:** comparação honesta entre Free e Pro, baseada no catálogo atual.
7. **Ajuda:** artigos públicos com URL própria e suporte quando necessário.
8. **Ação final:** criar a conta, sem distrações ou promessas adicionais.

Cada capítulo deve responder à próxima dúvida natural do visitante. Evitar blocos isolados que apenas enumerem recursos sem explicar como eles ajudam a publicar e manter um site.

## Hierarquia tipográfica

- O título do hero deve ocupar no máximo **duas linhas em desktop** e manter leitura confortável em telas menores.
- Títulos de seção também devem ocupar no máximo duas linhas no breakpoint para o qual foram compostos.
- Não usar colunas estreitas para forçar títulos a quebrar em três ou quatro linhas.
- O hero pode ter mais presença que os demais títulos, mas não deve dominar a viewport nem empurrar a imagem principal para baixo.
- Textos de apoio devem ser curtos, concretos e legíveis; evitar slogans vagos, superlativos e parágrafos longos.

## Evidência visual e assets

Usar os assets reais existentes, preservando proporção, enquadramento e legibilidade:

| Papel | Asset aprovado | Regra |
| --- | --- | --- |
| Hero humano/produto | `/images/hospedfree/hero-hospedfree.png` | Imagem dominante ao lado da proposta, sem crop que esconda produto ou pessoa |
| Prova do painel | `/images/hospedfree/painel-user-hospedfree.png` | Preservar a composição com a pessoa e o notebook; o painel na tela precisa continuar reconhecível em desktop e mobile |
| Construtor de sites | `/images/hospedfree/construtor-hospedfree.png` | Manter o editor como foco da seção, sem miniaturizá-lo dentro de um card genérico |
| Processo de publicação | `/images/hospedfree/desenvolvedor-publicando-site-em-casa.jpg` | Usar como prova humana junto às três etapas; preservar o notebook e o círculo violeta no enquadramento |
| Fechamento | `/images/hospedfree/sucesso-hospedfree.png` | Apoiar o CTA final sem competir com o texto e a ação |

Não usar screenshots herdados do MeuLinkBio, imagens abstratas aleatórias ou mockups que afirmem uma função inexistente. Quando não houver screenshot real do Softaculous, representar o fluxo com composição de interface e ícones oficiais/conhecíveis, sem simular estatísticas ou resultados.

## Verdade do produto e catálogo

- Free e Pro vêm da API/catálogo real de hospedagem; não duplicar nomes, limites, benefícios ou preços no frontend.
- O plano Free pode mostrar `R$ 0,00` somente quando isso vier do catálogo/contrato do produto.
- Um plano pago sem preço, gateway ou pacote remoto válido continua visível para explicar o caminho de upgrade, mas exibe **“Preço em configuração”** e não oferece checkout.
- O CTA de compra deve respeitar `purchase_available` e o estado de cadastro. Quando indisponível, o controle precisa ser desabilitado e explicar o motivo em texto.
- Assincronismo não pode fazer o Pro desaparecer depois do carregamento. Estados de loading, catálogo vazio e falha devem manter a comparação compreensível.
- Nunca inventar uptime, número de clientes, sites publicados, popularidade, economia, prazo de suporte ou qualquer outra métrica.

## Proibições explícitas

- Sem métricas fictícias.
- Sem depoimentos fabricados.
- Sem formulário de domínio no hero que apenas descarte o valor ao mandar o visitante para cadastro.
- Sem preço inventado ou placeholder comercial com aparência de oferta ativa.
- Sem FAQ em accordion; o resumo da ajuda aponta para páginas públicas SEO individuais.
- Sem nome do provider na comunicação pública.
- Sem excesso de cards iguais, fundos decorativos repetidos, gradientes aleatórios ou frases genéricas com “cara de IA”.

## Responsividade

- **Desktop (≥ 1280 px):** hero em duas colunas equilibradas; imagem com presença equivalente ao texto; títulos com no máximo duas linhas; capítulos usam larguras variadas e respiro editorial.
- **Tablet (768–1279 px):** colunas podem empilhar sem alterar a ordem narrativa; screenshots preservam proporção; comparativo de planos continua legível e ações não se sobrepõem.
- **Mobile (< 768 px):** conteúdo em uma coluna; texto antes da imagem quando isso esclarece a tarefa; títulos reduzem de escala; imagens ocupam a largura útil sem crop; cards e planos deixam de depender de hover.
- Não pode haver rolagem horizontal em nenhum breakpoint.
- Imagens abaixo da dobra podem usar lazy loading, mas devem carregar corretamente quando entram no viewport e reservar espaço para evitar layout shift.

## Acessibilidade e interação

- Atender WCAG 2.2 AA para contraste, foco e estrutura semântica.
- Navegação por teclado deve alcançar links, CTAs e menu móvel em ordem lógica.
- Todo botão e link precisa ter nome acessível e texto de ação concreto.
- Ícones decorativos usam `aria-hidden`; informação nunca depende apenas de cor ou ícone.
- Estados indisponíveis precisam de texto, não apenas opacidade.
- Alvos interativos devem ter no mínimo 44 px quando prático.
- Respeitar `prefers-reduced-motion`; animações são discretas e nunca bloqueiam conteúdo.
- Imagens informativas têm `alt` útil; imagens puramente decorativas usam `alt=""`.

## QA visual antes de concluir

Validar em uma única rodada desktop + mobile e uma confirmação final após correções:

- captura desktop em 1440 px ou maior e mobile em aproximadamente 390 px;
- hero e títulos de seção com no máximo duas linhas nos breakpoints planejados;
- Free e Pro visíveis simultaneamente, incluindo o estado honesto de preço indisponível;
- nenhuma métrica, depoimento, formulário de domínio ou accordion fictício;
- todas as imagens carregadas, sem distorção, crop acidental ou texto do produto ilegível;
- nenhum overflow horizontal, sobreposição, salto de layout ou CTA fora da viewport;
- navegação por âncoras, registro, planos e artigos apontando para destinos reais;
- console sem erros de renderização e sem requisições essenciais quebradas;
- teste com cadastro desativado e plano pago incompleto para confirmar estados seguros;
- prerender SEO alinhado à mesma narrativa e sem promessas que a interface React não faça.

## Critério de pronto

A landing está pronta quando uma pessoa entende, sem inferência, o que recebe no Free, como publica arquivos ou aplicativos, onde administra o site, como o Pro será oferecido e onde busca ajuda. O design deve dar protagonismo ao produto real, manter títulos controlados e conduzir a uma ação honesta do início ao fim.
