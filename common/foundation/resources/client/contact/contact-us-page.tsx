import {PublicContentShell} from '@app/landing/public-content-shell';
import {CaptchaContainer} from '@common/captcha/captcha-container';
import {Button} from '@shadcn/button/button';
import {Card} from '@shadcn/card/card';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Input} from '@shadcn/forms/input/input';
import {Textarea} from '@shadcn/forms/textarea/textarea';
import {toast} from '@shadcn/toast/toast';
import {Trans} from '@ui/i18n/trans';
import {
  ArrowRightIcon,
  BookOpenIcon,
  Clock3Icon,
  LifeBuoyIcon,
  MailIcon,
  MessageSquareTextIcon,
  SendIcon,
  ServerIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import {ReactNode} from 'react';
import {useForm} from 'react-hook-form';
import {Link} from 'react-router';
import {useCaptcha} from '../captcha/use-captcha';
import {StaticPageTitle} from '../seo/static-page-title';
import {
  ContactPagePayload,
  useSubmitContactForm,
} from './use-submit-contact-form';

export function Component() {
  const form = useForm<ContactPagePayload>();
  const submitForm = useSubmitContactForm(form);
  const {captchaToken, captchaEnabled, resetCaptcha} = useCaptcha('contact');

  return (
    <PublicContentShell>
      <StaticPageTitle>
        <Trans message="Contato" />
      </StaticPageTitle>

      <section className="hf-editorial-hero hf-contact-hero">
        <div className="hf-shell hf-editorial-hero-grid">
          <div>
            <span className="hf-editorial-mark" aria-hidden="true">
              <MailIcon />
            </span>
            <h1 className="hf-editorial-heading">
              <Trans message="Como podemos ajudar?" />
            </h1>
            <p className="hf-editorial-lead">
              <Trans message="Conte o que você precisa e encaminharemos sua mensagem para a área certa. Não envie senhas, códigos ou chaves de acesso." />
            </p>
          </div>

          <aside className="hf-contact-route-panel">
            <h2>
              <Trans message="Talvez a resposta já esteja pronta" />
            </h2>
            <p>
              <Trans message="Use o caminho mais rápido para resolver sua solicitação." />
            </p>
            <div className="hf-contact-route-list">
              <Link to="/faq">
                <span aria-hidden="true">
                  <BookOpenIcon />
                </span>
                <span>
                  <strong>
                    <Trans message="Consultar a Central de Ajuda" />
                  </strong>
                  <small>
                    <Trans message="Tutoriais sobre domínio, arquivos, banco de dados e SSL." />
                  </small>
                </span>
                <ArrowRightIcon aria-hidden="true" />
              </Link>
              <Link to="/dashboard/support">
                <span aria-hidden="true">
                  <LifeBuoyIcon />
                </span>
                <span>
                  <strong>
                    <Trans message="Abrir um chamado" />
                  </strong>
                  <small>
                    <Trans message="Para quem já possui uma hospedagem ou conta ativa." />
                  </small>
                </span>
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="hf-shell hf-editorial-section">
        <div className="hf-contact-layout">
          <aside className="hf-contact-topics">
            <h2>
              <Trans message="Direcione sua mensagem" />
            </h2>
            <p>
              <Trans message="Inclua o domínio ou o e-mail da conta quando isso ajudar a identificar a solicitação, mas nunca compartilhe credenciais." />
            </p>

            <div className="hf-contact-topic-list">
              <ContactTopic
                icon={<ServerIcon />}
                title={<Trans message="Hospedagem e publicação" />}
                description={
                  <Trans message="Domínios, arquivos, bancos, SSL e ferramentas do site" />
                }
              />
              <ContactTopic
                icon={<MessageSquareTextIcon />}
                title={<Trans message="Conta e acesso" />}
                description={
                  <Trans message="Login, cadastro e configurações da conta" />
                }
              />
              <ContactTopic
                icon={<MailIcon />}
                title={<Trans message="Produto e planos" />}
                description={
                  <Trans message="Planos, limites, upgrade e informações comerciais" />
                }
              />
              <ContactTopic
                icon={<ShieldCheckIcon />}
                title={<Trans message="Privacidade e segurança" />}
                description={
                  <Trans message="Dados pessoais, denúncias e acesso indevido" />
                }
              />
            </div>

            <div className="hf-contact-response-note">
              <Clock3Icon aria-hidden="true" />
              <p>
                <strong>
                  <Trans message="Uma solicitação, um contexto claro" />
                </strong>
                <span>
                  <Trans message="Envie uma mensagem por assunto. Isso evita respostas duplicadas e facilita o acompanhamento." />
                </span>
              </p>
            </div>
          </aside>

          <Card.Root className="hf-contact-form-panel">
            <Card.Header className="hf-contact-form-header">
              <span aria-hidden="true">
                <SendIcon />
              </span>
              <div>
                <Card.Title>
                  <Trans message="Envie uma mensagem" />
                </Card.Title>
                <Card.Description>
                  <Trans message="Preencha os campos abaixo com os detalhes necessários para analisarmos sua solicitação." />
                </Card.Description>
              </div>
            </Card.Header>
            <Card.Content className="hf-contact-form-content">
              <HookForm.Root
                form={form}
                onSubmit={async value => {
                  if (captchaEnabled && !captchaToken) {
                    toast.error(
                      <Trans message="Confirme que você não é um robô." />,
                    );
                    return;
                  }
                  submitForm.mutate(
                    {...value, captcha_token: captchaToken},
                    {onError: () => resetCaptcha()},
                  );
                }}
              >
                <Field.Group>
                  <HookForm.Field name="name">
                    <Field.Label>
                      <Trans message="Nome" />
                    </Field.Label>
                    <Input autoComplete="name" required />
                    <Field.Error />
                  </HookForm.Field>
                  <HookForm.Field name="email">
                    <Field.Label>
                      <Trans message="E-mail" />
                    </Field.Label>
                    <Input type="email" autoComplete="email" required />
                    <Field.Error />
                  </HookForm.Field>
                  <HookForm.Field name="message">
                    <Field.Label>
                      <Trans message="Mensagem" />
                    </Field.Label>
                    <Textarea rows={8} required />
                    <Field.Error />
                  </HookForm.Field>
                </Field.Group>
                {captchaEnabled ? <CaptchaContainer className="mt-6" /> : null}
                <div className="hf-contact-submit-row">
                  <p>
                    <ShieldCheckIcon aria-hidden="true" />
                    <span>
                      <Trans message="Usaremos estes dados para processar e responder à solicitação, com os fornecedores necessários descritos na nossa" />{' '}
                      <Link to="/pages/privacy-policy">
                        <Trans message="Política de Privacidade" />
                      </Link>
                      .
                    </span>
                  </p>
                  <Button
                    type="submit"
                    className="hf-button-primary"
                    size="lg"
                    disabled={submitForm.isPending}
                  >
                    {submitForm.isPending ? (
                      <Trans message="Enviando..." />
                    ) : (
                      <Trans message="Enviar mensagem" />
                    )}
                    <SendIcon aria-hidden="true" />
                  </Button>
                </div>
              </HookForm.Root>
            </Card.Content>
          </Card.Root>
        </div>
      </section>
    </PublicContentShell>
  );
}

function ContactTopic({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
}) {
  return (
    <div className="hf-contact-topic">
      <div aria-hidden="true">{icon}</div>
      <div className="min-w-0">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </div>
  );
}
