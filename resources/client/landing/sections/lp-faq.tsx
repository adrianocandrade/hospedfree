import {PlusIcon} from 'lucide-react';

const faqItems = [
  {
    question: 'O MeuLinkBio é gratuito?',
    answer:
      'Sim. Você pode começar com o plano gratuito e fazer o upgrade apenas quando precisar de limites maiores ou recursos avançados.',
  },
  {
    question: 'Ao criar a minha conta, o que acontece?',
    answer:
      'Você ganha acesso imediato ao painel onde pode criar sua primeira bio, personalizar cores e links, e publicar em poucos minutos.',
  },
  {
    question: 'Quantos links posso criar dentro da minha bio?',
    answer:
      'No plano gratuito, você pode adicionar links ilimitados. Planos pagos liberam recursos extras como analytics avançado e domínio próprio.',
  },
  {
    question: 'Como adicionar minha bio ao meu perfil do Instagram?',
    answer:
      'Basta copiar o link da sua página MeuLinkBio e colá-lo no campo de site do seu perfil do Instagram. É simples e leva menos de um minuto.',
  },
  {
    question: 'Posso usar meu próprio domínio?',
    answer:
      'Com certeza! Você pode conectar seu próprio domínio (como links.suamarca.com) em qualquer um de nossos planos pagos para uma aparência totalmente personalizada.',
  },
  {
    question: 'Quais métodos de pagamento são aceitos?',
    answer:
      'Aceitamos todos os principais cartões de crédito, boleto bancário e PIX para planos pagos.',
  },
];

export function LpFaq() {
  return (
    <section className="lp bg-[var(--lp-surface)] py-16 lg:py-24">
      <div className="lp-container">
        <div className="mx-auto max-w-3xl text-center">
          <span className="lp-badge lp-badge--gold mb-5">FAQs</span>
          <h2 className="lp-heading lp-heading--section">
            Precisa de mais informações? 🤔
          </h2>
        </div>

        <div className="mx-auto mt-14 max-w-3xl">
          {faqItems.map((item, i) => (
            <details key={i} className="lp-faq-item group">
              <summary className="lp-faq-summary">
                <span className="pr-6">{item.question}</span>
                <span className="lp-faq-icon">
                  <PlusIcon className="size-5" />
                </span>
              </summary>
              <div className="lp-faq-answer">{item.answer}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
