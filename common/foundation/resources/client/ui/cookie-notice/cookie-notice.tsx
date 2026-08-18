import {
  OPEN_COOKIE_PREFERENCES_EVENT,
  useCookieConsent,
} from '@common/ui/cookie-notice/cookie-consent';
import {UnstyledCustomMenuItem} from '@common/menus/custom-menu';
import {Button} from '@shadcn/button/button';
import {Dialog} from '@shadcn/dialog/dialog';
import {Switch} from '@shadcn/forms/switch/switch';
import {Trans} from '@ui/i18n/trans';
import {useSettings} from '@ui/settings/use-settings';
import {cn} from '@ui/utils/cn';
import {
  BarChart3Icon,
  CookieIcon,
  LockKeyholeIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import {ReactNode, useCallback, useEffect, useId, useState} from 'react';

export function CookieNotice() {
  const {analytics, cookie_notice: cookieNoticeSettings} = useSettings();
  const {consent, saveConsent} = useCookieConsent();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    consent?.analytics ?? false,
  );
  const consentRequired = Boolean(
    cookieNoticeSettings?.enable || analytics?.tracking_code,
  );

  const openPreferences = useCallback(() => {
    setAnalyticsEnabled(consent?.analytics ?? false);
    setPreferencesOpen(true);
  }, [consent?.analytics]);

  useEffect(() => {
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
    return () => {
      window.removeEventListener(
        OPEN_COOKIE_PREFERENCES_EVENT,
        openPreferences,
      );
    };
  }, [openPreferences]);

  const choose = (allowAnalytics: boolean) => {
    saveConsent(allowAnalytics);
    setAnalyticsEnabled(allowAnalytics);
    setPreferencesOpen(false);
  };

  return (
    <>
      {consentRequired && !consent ? (
        <aside
          className={cn(
            'fixed inset-x-0 z-50 p-3 sm:p-4',
            cookieNoticeSettings?.position === 'top' ? 'top-0' : 'bottom-0',
          )}
          aria-labelledby="hospedfree-cookie-notice-title"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-card border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CookieIcon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2
                  id="hospedfree-cookie-notice-title"
                  className="text-base font-semibold"
                >
                  <Trans message={'Voc\u00ea escolhe como usamos cookies'} />
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  <Trans
                    message={
                      'Cookies necess\u00e1rios mant\u00eam sua sess\u00e3o e prefer\u00eancias. Com sua permiss\u00e3o, o Analytics nos ajuda a entender o uso do site sem liberar cookies de publicidade.'
                    }
                  />
                </p>
                {cookieNoticeSettings?.button?.label ? (
                  <UnstyledCustomMenuItem
                    item={cookieNoticeSettings.button}
                    className={() =>
                      'mt-2 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
                    }
                  />
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              <Button
                variant="ghost"
                color="default"
                size="lg"
                className="min-h-11"
                onClick={openPreferences}
              >
                <SlidersHorizontalIcon />
                <Trans message="Personalizar" />
              </Button>
              <Button
                variant="outline"
                color="default"
                size="lg"
                className="min-h-11"
                onClick={() => choose(false)}
              >
                <Trans message={'Somente necess\u00e1rios'} />
              </Button>
              <Button
                size="lg"
                className="min-h-11"
                onClick={() => choose(true)}
              >
                <Trans message="Aceitar Analytics" />
              </Button>
            </div>
          </div>
        </aside>
      ) : null}

      <Dialog.Root open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Content className="max-w-lg">
            <Dialog.Header>
              <Dialog.Title>
                <SlidersHorizontalIcon />
                <Trans message={'Prefer\u00eancias de cookies'} />
              </Dialog.Title>
              <Dialog.Description>
                <Trans
                  message={
                    'Voc\u00ea pode alterar esta escolha a qualquer momento na p\u00e1gina de cookies.'
                  }
                />
              </Dialog.Description>
            </Dialog.Header>

            <Dialog.Body className="space-y-3">
              <CookieCategory
                icon={<LockKeyholeIcon />}
                title={<Trans message={'Cookies necess\u00e1rios'} />}
                description={
                  <Trans
                    message={
                      'Mant\u00eam login, seguran\u00e7a, idioma, tema e a hospedagem selecionada. Eles n\u00e3o podem ser desativados.'
                    }
                  />
                }
                checked
                disabled
              />
              <CookieCategory
                icon={<BarChart3Icon />}
                title={<Trans message="Analytics" />}
                description={
                  <Trans
                    message={
                      'Mede visitas e intera\u00e7\u00f5es para melhorar o HospedFree. Nenhum dado \u00e9 enviado ao Google antes da sua permiss\u00e3o.'
                    }
                  />
                }
                checked={analyticsEnabled}
                onCheckedChange={setAnalyticsEnabled}
              />
            </Dialog.Body>

            <Dialog.Footer variant="muted">
              <Button
                variant="outline"
                color="default"
                onClick={() => choose(false)}
              >
                <Trans message={'Usar somente necess\u00e1rios'} />
              </Button>
              <Button onClick={() => choose(analyticsEnabled)}>
                <Trans message={'Salvar prefer\u00eancias'} />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

interface CookieCategoryProps {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function CookieCategory({
  icon,
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: CookieCategoryProps) {
  const titleId = useId();

  return (
    <div className="flex gap-3 rounded-card border border-border bg-muted/35 p-4">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground [&_svg]:size-4">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-h-8 items-center justify-between gap-4">
          <h3 id={titleId} className="font-medium">
            {title}
          </h3>
          <Switch
            checked={checked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
            aria-labelledby={titleId}
          />
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
