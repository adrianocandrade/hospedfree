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
import {MailIcon, MessageSquareTextIcon, ShieldCheckIcon} from 'lucide-react';
import {ReactNode} from 'react';
import {useForm} from 'react-hook-form';
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
    <PublicContentShell mainClassName="bg-[var(--lp-surface-soft)]">
      <StaticPageTitle>
        <Trans message="Contato" />
      </StaticPageTitle>

      <div className="lp-container grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(520px,1.2fr)] lg:items-start lg:gap-16 lg:py-24">
        <section className="lg:sticky lg:top-32">
          <h1 className="max-w-[12ch] text-4xl font-[var(--lp-font-display)] font-semibold tracking-[-0.03em] text-balance text-[var(--lp-ink)] md:text-5xl">
            <Trans message="Como podemos ajudar?" />
          </h1>
          <p className="mt-5 max-w-[52ch] text-base leading-7 text-[var(--lp-muted)] md:text-lg">
            <Trans message="Envie sua dúvida pelo formulário. Assim conseguimos entender o contexto e direcionar sua mensagem corretamente." />
          </p>

          <div className="mt-10 divide-y divide-[var(--lp-border)] border-y border-[var(--lp-border)]">
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
                <Trans message="Recursos, páginas, links e informações comerciais" />
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
        </section>

        <Card.Root className="rounded-2xl border-[var(--lp-border)] bg-[var(--lp-surface)]">
          <Card.Header className="border-b border-[var(--lp-border)] p-6 sm:p-8">
            <Card.Title className="text-xl font-semibold tracking-[-0.02em] text-[var(--lp-ink)]">
              <Trans message="Envie uma mensagem" />
            </Card.Title>
            <Card.Description className="mt-2 max-w-[58ch] leading-6 text-[var(--lp-muted)]">
              <Trans message="Preencha os campos abaixo com os detalhes necessários para analisarmos sua solicitação." />
            </Card.Description>
          </Card.Header>
          <Card.Content className="p-6 sm:p-8">
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
                  <Textarea rows={7} required />
                  <Field.Error />
                </HookForm.Field>
              </Field.Group>
              {captchaEnabled ? <CaptchaContainer className="mt-6" /> : null}
              <Button
                type="submit"
                className="mt-6 w-full sm:w-auto"
                size="lg"
                disabled={submitForm.isPending}
              >
                <Trans message="Enviar mensagem" />
              </Button>
            </HookForm.Root>
          </Card.Content>
        </Card.Root>
      </div>
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
    <div className="flex items-start gap-4 py-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--lp-blue-soft)] text-[var(--lp-primary)] [&_svg]:size-5">
        {icon}
      </div>
      <div>
        <div className="font-medium text-[var(--lp-ink)]">{title}</div>
        <div className="mt-1 text-sm leading-6 text-[var(--lp-muted)]">
          {description}
        </div>
      </div>
    </div>
  );
}
