import {
  adminHostingSettingsOptions,
  testAdminHostingCloudflareOptions,
  testAdminHostingFileManagerOptions,
  testAdminHostingProviderOptions,
  testAdminHostingSiteBuilderOptions,
  updateAdminHostingSettingsOptions,
} from '@app/hosting/hosting-queries';
import {
  AdminHostingSettings,
  UpdateAdminHostingSettings,
} from '@app/hosting/hosting-types';
import {SettingsPanel} from '@common/admin/settings/layout/settings-panel';
import {onFormQueryError} from '@common/http/errors/on-form-query-error';
import {StaticPageTitle} from '@common/seo/static-page-title';
import {DashboardLayout} from '@common/ui/dashboard/dashboard-layout';
import {Alert} from '@shadcn/alert/alert';
import {Button} from '@shadcn/button/button';
import {Field} from '@shadcn/forms/field';
import {HookForm} from '@shadcn/forms/form/hook-form';
import {Select} from '@shadcn/forms/select/select';
import {toast} from '@shadcn/toast/toast';
import {useMutation, useSuspenseQuery} from '@tanstack/react-query';
import {FormTextField} from '@ui/forms/input-field/text-field/text-field';
import {FormSwitch} from '@ui/forms/toggle/switch';
import {Trans} from '@ui/i18n/trans';
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
  SaveIcon,
} from 'lucide-react';
import {useForm} from 'react-hook-form';

type HostingSettingsForm = Omit<
  UpdateAdminHostingSettings,
  'allowed_domains'
> & {
  allowed_domains_text: string;
};

const providerOptions = [
  {value: 'fake', label: <Trans message="Desenvolvimento (fake)" />},
  {value: 'mofh', label: <Trans message="MOFH" />},
] as const;

const fileEditorThemeOptions = [
  {value: 'auto', label: <Trans message="Acompanhar tema do painel" />},
  {value: 'chrome', label: <Trans message="Chrome (claro)" />},
  {value: 'monokai', label: <Trans message="Monokai (escuro)" />},
  {value: 'tomorrow_night', label: <Trans message="Tomorrow Night" />},
] as const;

export function Component() {
  const settings = useSuspenseQuery(adminHostingSettingsOptions());
  const data = settings.data;
  const form = useForm<HostingSettingsForm>({
    defaultValues: formDefaults(data),
  });
  const update = useMutation({
    ...updateAdminHostingSettingsOptions(),
    onSuccess: () => {
      toast.success(<Trans message="Configurações de hospedagem salvas." />);
      form.reset({
        ...form.getValues(),
        mofh_password: '',
        site_builder_password: '',
        cloudflare_api_token: '',
      });
    },
    onError: error => onFormQueryError(error, form),
  });

  const submit = (values: HostingSettingsForm) => {
    const {allowed_domains_text, ...rest} = values;
    update.mutate({
      ...rest,
      allowed_domains: allowed_domains_text
        .split(/[\n,]/)
        .map(domain => domain.trim().toLowerCase())
        .filter(Boolean),
    });
  };

  return (
    <DashboardLayout.MainSection>
      <StaticPageTitle>
        <Trans message="Configurações de hospedagem" />
      </StaticPageTitle>
      <DashboardLayout.SectionHeader>
        <DashboardLayout.SidebarToggle />
        <DashboardLayout.SectionTitle>
          <h1>
            <Trans message="Configurações de hospedagem" />
          </h1>
        </DashboardLayout.SectionTitle>
        <Button
          type="submit"
          form="hosting-settings-form"
          disabled={update.isPending || !form.formState.isDirty}
        >
          <SaveIcon />
          <Trans message="Salvar alterações" />
        </Button>
      </DashboardLayout.SectionHeader>

      <DashboardLayout.SectionContent>
        <DashboardLayout.SectionScrollContainer>
          <HookForm.Root
            id="hosting-settings-form"
            form={form}
            onSubmit={submit}
            className="mx-auto w-full max-w-5xl space-y-6 py-2"
          >
            <ProviderSection hasUnsavedChanges={form.formState.isDirty} />
            <MofhSection settings={data} />
            <ToolsSection />
            <FileManagerSection hasUnsavedChanges={form.formState.isDirty} />
            <SiteBuilderSection
              settings={data}
              hasUnsavedChanges={form.formState.isDirty}
            />
            <SslAndDnsSection
              settings={data}
              hasUnsavedChanges={form.formState.isDirty}
            />
            <AllowedDomainsSection />
          </HookForm.Root>
        </DashboardLayout.SectionScrollContainer>
      </DashboardLayout.SectionContent>
    </DashboardLayout.MainSection>
  );
}

function ProviderSection({hasUnsavedChanges}: {hasUnsavedChanges: boolean}) {
  const health = useMutation(testAdminHostingProviderOptions());

  return (
    <SettingsPanel
      title={<Trans message="Provider e resiliência" />}
      description={
        <Trans message="Selecione o adapter interno e ajuste somente limites técnicos necessários para chamadas remotas." />
      }
    >
      <HookForm.Field name="provider_driver">
        <Field.Label>
          <Trans message="Provider ativo" />
        </Field.Label>
        <Select.Root items={providerOptions}>
          <Select.Trigger className="w-full">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {providerOptions.map(option => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Field.Error />
      </HookForm.Field>
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <FormTextField
          name="provider_connect_timeout_seconds"
          type="number"
          min={1}
          max={60}
          label={<Trans message="Timeout de conexão (segundos)" />}
        />
        <FormTextField
          name="provider_timeout_seconds"
          type="number"
          min={1}
          max={120}
          label={<Trans message="Timeout total (segundos)" />}
        />
        <FormTextField
          name="provider_retries"
          type="number"
          min={0}
          max={10}
          label={<Trans message="Tentativas" />}
        />
      </div>
      <div className="mt-5 space-y-4 border-t pt-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="text-sm font-medium">
              <Trans message="Conectividade do provider" />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              <Trans message="Executa uma verificação segura usando as configurações já salvas." />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={hasUnsavedChanges || health.isPending}
            onClick={() => health.mutate()}
          >
            {health.isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <RefreshCwIcon />
            )}
            <Trans message="Testar conexão" />
          </Button>
        </div>

        {hasUnsavedChanges && (
          <p className="text-sm text-muted-foreground">
            <Trans message="Salve as alterações antes de testar a conexão." />
          </p>
        )}

        {health.data && (
          <Alert
            variant={health.data.success ? 'positive' : 'destructive'}
            fillStyle="subtleFill"
            aria-live="polite"
          >
            {health.data.success ? <CheckCircle2Icon /> : <CircleAlertIcon />}
            <Alert.Title>
              <Trans
                message={
                  health.data.success
                    ? 'Conexão validada'
                    : 'Não foi possível conectar'
                }
              />
            </Alert.Title>
            <Alert.Description>
              <ProviderHealthMessage code={health.data.code} />
            </Alert.Description>
          </Alert>
        )}

        {health.isError && (
          <Alert
            variant="destructive"
            fillStyle="subtleFill"
            aria-live="polite"
          >
            <CircleAlertIcon />
            <Alert.Title>
              <Trans message="Falha ao executar o teste" />
            </Alert.Title>
            <Alert.Description>
              <Trans message="A solicitação não pôde ser concluída. Tente novamente." />
            </Alert.Description>
          </Alert>
        )}
      </div>
    </SettingsPanel>
  );
}

function ProviderHealthMessage({code}: {code: string}) {
  const message =
    {
      ok: 'O provider ativo respondeu corretamente.',
      provider_not_configured:
        'As credenciais obrigatórias ainda não estão configuradas.',
      provider_unreachable:
        'O provider não respondeu dentro do tempo configurado.',
      provider_invalid_response:
        'O provider respondeu, mas o formato recebido não pôde ser validado.',
      provider_request_failed:
        'A verificação falhou antes de receber uma resposta válida.',
    }[code] ?? 'A conectividade não pôde ser confirmada com segurança.';

  return <Trans message={message} />;
}

function MofhSection({settings}: {settings: AdminHostingSettings}) {
  return (
    <SettingsPanel
      title={<Trans message="MOFH e VistaPanel" />}
      description={
        <Trans message="Credenciais ficam somente no servidor. Deixe a senha vazia para preservar o valor configurado." />
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormTextField
          name="mofh_base_url"
          type="url"
          label={<Trans message="URL da API MOFH" />}
        />
        <FormTextField
          name="mofh_ftp_host"
          label={<Trans message="Servidor FTP padrão" />}
        />
        <FormTextField
          name="mofh_username"
          autoComplete="off"
          label={<Trans message="Usuário da API" />}
        />
        <FormTextField
          name="mofh_password"
          type="password"
          autoComplete="new-password"
          label={<Trans message="Nova senha da API" />}
          description={
            <Trans
              message={
                settings.mofh_password_configured
                  ? 'Uma senha já está configurada. Preencha somente para substituir.'
                  : 'Nenhuma senha configurada.'
              }
            />
          }
        />
      </div>
      <div className="mt-5 border-t pt-5">
        <FormSwitch name="vistapanel_enabled">
          <Trans message="Habilitar recursos do VistaPanel" />
        </FormSwitch>
        <FormTextField
          className="mt-5"
          name="vistapanel_url"
          type="url"
          label={<Trans message="URL do VistaPanel" />}
        />
      </div>
    </SettingsPanel>
  );
}

function ToolsSection() {
  return (
    <SettingsPanel
      title={<Trans message="Ferramentas externas" />}
      description={
        <Trans message="Somente URLs HTTPS sem credenciais incorporadas serão aceitas pelo servidor." />
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormTextField
          name="control_panel_url"
          type="url"
          label={<Trans message="Painel de hospedagem" />}
        />
        <FormTextField
          name="webftp_url"
          type="url"
          label={<Trans message="WebFTP" />}
        />
        <FormTextField
          name="installer_url"
          type="url"
          label={<Trans message="URL autorizada do instalador" />}
          description={
            <Trans message="Opcional. Autoriza o host HTTPS devolvido pelo VistaPanel para abrir o instalador com uma sessão temporária." />
          }
        />
        <FormTextField
          name="installer_allowed_hosts"
          label={<Trans message="Hosts adicionais do instalador" />}
          description={
            <Trans message="Separe por vírgula. Use somente hosts HTTPS confirmados, como os servidores regionais do instalador." />
          }
        />
        <FormTextField
          name="file_manager_url"
          type="url"
          label={<Trans message="Gerenciador de arquivos" />}
        />
      </div>
    </SettingsPanel>
  );
}

function FileManagerSection({hasUnsavedChanges}: {hasUnsavedChanges: boolean}) {
  const health = useMutation(testAdminHostingFileManagerOptions());
  const checks = health.data?.checks;

  return (
    <SettingsPanel
      title={<Trans message="WebFTP e gerenciador de arquivos" />}
      description={
        <Trans message="Gerenciador integrado por FTP com TLS. As credenciais de hospedagem permanecem no servidor e nunca são enviadas ao navegador." />
      }
    >
      <div className="flex flex-wrap gap-6">
        <FormSwitch name="file_manager_enabled">
          <Trans message="Habilitar WebFTP integrado" />
        </FormSwitch>
        <FormSwitch name="file_manager_external_fallback">
          <Trans message="Usar serviço externo como alternativa" />
        </FormSwitch>
        <FormSwitch name="file_manager_ssl">
          <Trans message="Exigir FTP com TLS" />
        </FormSwitch>
        <FormSwitch name="file_manager_passive">
          <Trans message="Usar modo passivo" />
        </FormSwitch>
        <FormSwitch name="file_manager_allow_zip_operations">
          <Trans message="Permitir compactar e extrair ZIP" />
        </FormSwitch>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <FormTextField
          className="lg:col-span-2"
          name="file_manager_host"
          label={<Trans message="Servidor FTP/FTPS" />}
        />
        <FormTextField
          name="file_manager_port"
          type="number"
          min={1}
          max={65535}
          label={<Trans message="Porta" />}
        />
        <FormTextField
          name="file_manager_root"
          label={<Trans message="Diretório raiz" />}
        />
        <FormTextField
          name="file_manager_max_upload_bytes"
          type="number"
          min={1024}
          max={104857600}
          label={<Trans message="Limite de upload (bytes)" />}
        />
        <FormTextField
          name="file_manager_max_archive_entries"
          type="number"
          min={1}
          max={5000}
          label={<Trans message="Máximo de itens por ZIP" />}
        />
        <FormTextField
          name="file_manager_max_archive_source_bytes"
          type="number"
          min={1024}
          max={524288000}
          label={<Trans message="Limite para compactar (bytes)" />}
        />
        <FormTextField
          name="file_manager_max_archive_bytes"
          type="number"
          min={1024}
          max={524288000}
          label={<Trans message="Tamanho máximo do ZIP (bytes)" />}
        />
        <FormTextField
          name="file_manager_max_extract_entries"
          type="number"
          min={1}
          max={5000}
          label={<Trans message="Máximo de itens ao extrair" />}
        />
        <FormTextField
          name="file_manager_max_extract_bytes"
          type="number"
          min={1024}
          max={1073741824}
          label={<Trans message="Limite de extração (bytes)" />}
        />
      </div>
      <div className="mt-5 border-t pt-5">
        <h3 className="text-sm font-medium">
          <Trans message="Editor de código" />
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          <Trans message="O editor Ace é carregado somente quando um arquivo compatível é aberto." />
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <HookForm.Field name="file_manager_editor_theme">
            <Field.Label>
              <Trans message="Tema do editor" />
            </Field.Label>
            <Select.Root items={fileEditorThemeOptions}>
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {fileEditorThemeOptions.map(option => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Field.Error />
          </HookForm.Field>
          <div className="flex flex-wrap gap-x-6 gap-y-3 sm:items-end sm:pb-2">
            <FormSwitch name="file_manager_code_beautify">
              <Trans message="Formatar código" />
            </FormSwitch>
            <FormSwitch name="file_manager_code_suggestion">
              <Trans message="Sugestões" />
            </FormSwitch>
            <FormSwitch name="file_manager_auto_complete">
              <Trans message="Autocompletar" />
            </FormSwitch>
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-4 border-t pt-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="text-sm font-medium">
              <Trans message="Requisitos do servidor" />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              <Trans message="Valida FTP, Flysystem, ZIP, diretório temporário e TLS sem revelar configurações." />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={hasUnsavedChanges || health.isPending}
            onClick={() => health.mutate()}
          >
            {health.isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <RefreshCwIcon />
            )}
            <Trans message="Verificar requisitos" />
          </Button>
        </div>
        {hasUnsavedChanges ? (
          <p className="text-sm text-muted-foreground">
            <Trans message="Salve as alterações antes de executar a verificação." />
          </p>
        ) : null}
        {checks ? (
          <div className="grid gap-2 sm:grid-cols-2" aria-live="polite">
            <RequirementStatus
              label="Configuração ativa"
              ok={checks.configured}
            />
            <RequirementStatus
              label="Extensão FTP do PHP"
              ok={checks.ftp_extension}
            />
            <RequirementStatus
              label="Adapter Flysystem FTP"
              ok={checks.flysystem_adapter}
            />
            <RequirementStatus label="Extensão ZIP" ok={checks.zip_extension} />
            <RequirementStatus
              label="Diretório temporário gravável"
              ok={checks.temporary_directory}
            />
            <RequirementStatus
              label="Conexão TLS obrigatória"
              ok={checks.tls_required}
            />
          </div>
        ) : null}
        {health.isError ? (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <Alert.Description>
              <Trans message="Não foi possível verificar os requisitos do WebFTP. Tente novamente." />
            </Alert.Description>
          </Alert>
        ) : null}
      </div>
    </SettingsPanel>
  );
}

function RequirementStatus({label, ok}: {label: string; ok: boolean}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-input border px-3 py-2 text-sm">
      {ok ? (
        <CheckCircle2Icon className="size-4 shrink-0 text-positive" />
      ) : (
        <CircleAlertIcon className="text-danger size-4 shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate">
        <Trans message={label} />
      </span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {ok ? <Trans message="Disponível" /> : <Trans message="Indisponível" />}
      </span>
    </div>
  );
}

function SiteBuilderSection({
  settings,
  hasUnsavedChanges,
}: {
  settings: AdminHostingSettings;
  hasUnsavedChanges: boolean;
}) {
  const health = useMutation(testAdminHostingSiteBuilderOptions());

  return (
    <SettingsPanel
      title={<Trans message="Site.Pro e construtor de site" />}
      description={
        <Trans message="Configure a criação de sessão do editor pelo servidor." />
      }
    >
      <FormSwitch name="site_builder_enabled">
        <Trans message="Habilitar construtor de site" />
      </FormSwitch>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <FormTextField
          name="site_builder_provider"
          label={<Trans message="Provider do editor" />}
        />
        <FormTextField
          name="site_builder_endpoint"
          type="url"
          label={<Trans message="Endpoint" />}
        />
        <div className="sm:col-span-2">
          <FormTextField
            name="site_builder_allowed_hosts"
            autoComplete="off"
            label={<Trans message="Hosts autorizados para retorno" />}
            description={
              <Trans message="Informe somente os domínios separados por vírgula, sem https:// ou caminhos. Exemplo: br.site.pro" />
            }
          />
        </div>
        <FormTextField
          name="site_builder_username"
          autoComplete="off"
          label={<Trans message="Usuário" />}
        />
        <FormTextField
          name="site_builder_password"
          type="password"
          autoComplete="new-password"
          label={<Trans message="Nova senha" />}
          description={
            <Trans
              message={
                settings.site_builder_password_configured
                  ? 'Uma senha já está configurada.'
                  : 'Nenhuma senha configurada.'
              }
            />
          }
        />
      </div>
      <div className="mt-5 space-y-3 border-t pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">
              <Trans message="Conexão com o construtor" />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              <Trans message="Valida o endpoint salvo sem criar uma sessão de cliente." />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={hasUnsavedChanges || health.isPending}
            onClick={() => health.mutate()}
          >
            {health.isPending ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <RefreshCwIcon />
            )}
            <Trans message="Testar construtor" />
          </Button>
        </div>
        {hasUnsavedChanges ? (
          <p className="text-sm text-muted-foreground">
            <Trans message="Salve as alterações antes de testar o construtor." />
          </p>
        ) : null}
        {health.data ? (
          <Alert
            variant={health.data.success ? 'positive' : 'destructive'}
            fillStyle="subtleFill"
            aria-live="polite"
          >
            {health.data.success ? <CheckCircle2Icon /> : <CircleAlertIcon />}
            <Alert.Title>
              <Trans
                message={
                  health.data.success
                    ? 'Construtor disponível'
                    : 'Construtor indisponível'
                }
              />
            </Alert.Title>
            <Alert.Description>
              <SiteBuilderHealthMessage code={health.data.code} />
            </Alert.Description>
          </Alert>
        ) : null}
        {health.isError ? (
          <Alert
            variant="destructive"
            fillStyle="subtleFill"
            aria-live="polite"
          >
            <CircleAlertIcon />
            <Alert.Title>
              <Trans message="Falha ao testar o construtor" />
            </Alert.Title>
          </Alert>
        ) : null}
      </div>
    </SettingsPanel>
  );
}

function SiteBuilderHealthMessage({code}: {code: string}) {
  const message =
    {
      ok: 'O endpoint do construtor respondeu corretamente.',
      site_builder_not_configured:
        'Habilite e salve o endpoint e as credenciais antes de testar.',
      site_builder_invalid_credentials:
        'O construtor rejeitou as credenciais configuradas.',
      site_builder_unreachable:
        'O construtor não respondeu dentro do tempo configurado.',
      site_builder_health_failed:
        'A resposta do construtor não pôde ser validada com segurança.',
      capability_not_configured:
        'O adapter do construtor não está habilitado para este ambiente.',
    }[code] ?? 'A conexão com o construtor não pôde ser confirmada.';

  return <Trans message={message} />;
}

const sslProviderOptions = [
  {value: 'manual', label: <Trans message="Manual/desabilitado" />},
  {value: 'acme', label: <Trans message="ACME DNS-01" />},
] as const;

function SslAndDnsSection({
  settings,
  hasUnsavedChanges,
}: {
  settings: AdminHostingSettings;
  hasUnsavedChanges: boolean;
}) {
  const cloudflareHealth = useMutation(testAdminHostingCloudflareOptions());

  return (
    <SettingsPanel
      title={<Trans message="SSL, ACME e Cloudflare" />}
      description={
        <Trans message="Configure emissão e automação DNS sem expor tokens ao painel do cliente." />
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div>
          <FormSwitch name="ssl_enabled">
            <Trans message="Habilitar solicitações SSL" />
          </FormSwitch>
          <FormSwitch name="ssl_maintenance_enabled" className="mt-4">
            <Trans message="Habilitar renovação e reconciliação automáticas" />
          </FormSwitch>
          <HookForm.Field name="ssl_provider" className="mt-4">
            <Field.Label>
              <Trans message="Emissor SSL" />
            </Field.Label>
            <Select.Root items={sslProviderOptions}>
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {sslProviderOptions.map(option => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Field.Error />
          </HookForm.Field>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <FormTextField
              name="ssl_renew_before_days"
              type="number"
              min={7}
              max={60}
              label={<Trans message="Renovar antes de expirar (dias)" />}
            />
            <FormTextField
              name="ssl_reconcile_after_hours"
              type="number"
              min={1}
              max={168}
              label={<Trans message="Reconciliar a cada (horas)" />}
            />
          </div>
        </div>
        <div>
          <FormSwitch name="acme_enabled">
            <Trans message="Habilitar ACME" />
          </FormSwitch>
          <FormTextField
            className="mt-4"
            name="acme_directory_url"
            type="url"
            label={<Trans message="Diretório ACME" />}
          />
          <FormTextField
            className="mt-4"
            name="acme_email"
            type="email"
            label={<Trans message="E-mail ACME" />}
          />
        </div>
        <div>
          <FormSwitch name="cloudflare_enabled">
            <Trans message="Habilitar Cloudflare" />
          </FormSwitch>
          <FormTextField
            className="mt-4"
            name="cloudflare_api_token"
            type="password"
            autoComplete="new-password"
            label={<Trans message="Novo token da API" />}
            description={
              <Trans
                message={
                  settings.cloudflare_api_token_configured
                    ? 'Um token já está configurado.'
                    : 'Nenhum token configurado.'
                }
              />
            }
          />
          <FormTextField
            className="mt-4"
            name="cloudflare_account_id"
            label={<Trans message="Account ID" />}
          />
          <FormTextField
            className="mt-4"
            name="cloudflare_zone_id"
            label={<Trans message="Zone ID" />}
          />
          <div className="mt-4 space-y-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={hasUnsavedChanges || cloudflareHealth.isPending}
              onClick={() => cloudflareHealth.mutate()}
            >
              {cloudflareHealth.isPending ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                <RefreshCwIcon />
              )}
              <Trans message="Testar Cloudflare" />
            </Button>
            {hasUnsavedChanges ? (
              <p className="text-sm text-muted-foreground">
                <Trans message="Salve as alterações antes de testar a automação DNS." />
              </p>
            ) : null}
            {cloudflareHealth.data ? (
              <Alert
                variant={
                  cloudflareHealth.data.success ? 'positive' : 'destructive'
                }
                fillStyle="subtleFill"
                aria-live="polite"
              >
                {cloudflareHealth.data.success ? (
                  <CheckCircle2Icon />
                ) : (
                  <CircleAlertIcon />
                )}
                <Alert.Title>
                  <Trans
                    message={
                      cloudflareHealth.data.success
                        ? 'Automação DNS validada'
                        : 'Cloudflare indisponível'
                    }
                  />
                </Alert.Title>
                <Alert.Description>
                  <CloudflareHealthMessage code={cloudflareHealth.data.code} />
                </Alert.Description>
              </Alert>
            ) : null}
          </div>
        </div>
      </div>
    </SettingsPanel>
  );
}

function CloudflareHealthMessage({code}: {code: string}) {
  const message =
    {
      ok: 'O token e a zona configurados responderam corretamente.',
      cloudflare_not_configured:
        'Informe e salve um token e um Zone ID antes de testar.',
      cloudflare_invalid_credentials:
        'O token não possui acesso à zona ou foi rejeitado.',
      cloudflare_unreachable:
        'O Cloudflare não respondeu dentro do tempo configurado.',
      cloudflare_invalid_response:
        'A resposta recebida não pôde ser validada com segurança.',
    }[code] ?? 'A automação DNS não pôde ser confirmada com segurança.';

  return <Trans message={message} />;
}

function AllowedDomainsSection() {
  return (
    <SettingsPanel
      title={<Trans message="Domínios e validação DNS" />}
      description={
        <Trans message="Configure as zonas gratuitas e o destino CNAME fornecido pela infraestrutura de hospedagem." />
      }
    >
      <FormTextField
        name="domain_cname_target"
        label={<Trans message="Destino do CNAME de verificação" />}
        description={
          <Trans message="O hash gerado pelo provedor apontará para este host. Altere somente quando a infraestrutura confirmar outro destino." />
        }
      />
      <FormTextField
        className="mt-5"
        name="allowed_domains_text"
        inputElementType="textarea"
        rows={5}
        label={<Trans message="Zonas permitidas" />}
      />
    </SettingsPanel>
  );
}

function formDefaults(data: AdminHostingSettings): HostingSettingsForm {
  return {
    provider_driver: data.provider_driver,
    provider_timeout_seconds: data.provider_timeout_seconds,
    provider_connect_timeout_seconds: data.provider_connect_timeout_seconds,
    provider_retries: data.provider_retries,
    mofh_base_url: data.mofh_base_url ?? '',
    mofh_username: data.mofh_username ?? '',
    mofh_password: '',
    mofh_ftp_host: data.mofh_ftp_host ?? '',
    domain_cname_target: data.domain_cname_target,
    control_panel_url: data.control_panel_url ?? '',
    webftp_url: data.webftp_url ?? '',
    installer_url: data.installer_url ?? '',
    installer_allowed_hosts: data.installer_allowed_hosts ?? '',
    file_manager_url: data.file_manager_url ?? '',
    file_manager_enabled: data.file_manager_enabled,
    file_manager_external_fallback: data.file_manager_external_fallback,
    file_manager_host: data.file_manager_host ?? '',
    file_manager_port: data.file_manager_port,
    file_manager_ssl: data.file_manager_ssl,
    file_manager_passive: data.file_manager_passive,
    file_manager_root: data.file_manager_root,
    file_manager_allow_zip_operations: data.file_manager_allow_zip_operations,
    file_manager_editor_theme: data.file_manager_editor_theme,
    file_manager_code_beautify: data.file_manager_code_beautify,
    file_manager_code_suggestion: data.file_manager_code_suggestion,
    file_manager_auto_complete: data.file_manager_auto_complete,
    file_manager_max_upload_bytes: data.file_manager_max_upload_bytes,
    file_manager_max_archive_entries: data.file_manager_max_archive_entries,
    file_manager_max_archive_source_bytes:
      data.file_manager_max_archive_source_bytes,
    file_manager_max_archive_bytes: data.file_manager_max_archive_bytes,
    file_manager_max_extract_entries: data.file_manager_max_extract_entries,
    file_manager_max_extract_bytes: data.file_manager_max_extract_bytes,
    vistapanel_enabled: data.vistapanel_enabled,
    vistapanel_url: data.vistapanel_url ?? '',
    site_builder_enabled: data.site_builder_enabled,
    site_builder_provider: data.site_builder_provider,
    site_builder_endpoint: data.site_builder_endpoint ?? '',
    site_builder_allowed_hosts: data.site_builder_allowed_hosts ?? '',
    site_builder_username: data.site_builder_username ?? '',
    site_builder_password: '',
    ssl_enabled: data.ssl_enabled,
    ssl_provider: data.ssl_provider,
    ssl_maintenance_enabled: data.ssl_maintenance_enabled,
    ssl_renew_before_days: data.ssl_renew_before_days,
    ssl_reconcile_after_hours: data.ssl_reconcile_after_hours,
    cloudflare_enabled: data.cloudflare_enabled,
    cloudflare_api_token: '',
    cloudflare_account_id: data.cloudflare_account_id ?? '',
    cloudflare_zone_id: data.cloudflare_zone_id ?? '',
    acme_enabled: data.acme_enabled,
    acme_directory_url: data.acme_directory_url ?? '',
    acme_email: data.acme_email ?? '',
    allowed_domains_text: data.allowed_domains.join('\n'),
  };
}
