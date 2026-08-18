export type HostingPlan = {
  id: number;
  type: 'free' | 'paid';
  max_accounts_per_workspace: number;
  quotas: Record<string, string | number | boolean>;
  purchase_available: boolean;
  can_create_account: boolean;
  creation_unavailable_reason: HostingPlanCreationUnavailableReason | null;
  is_active?: boolean;
  sort_order?: number;
  provider_packages?: Array<{
    id: number;
    provider: 'fake' | 'mofh';
    remote_package: string;
    is_active: boolean;
  }>;
  product: {
    id: number;
    name: string;
    description: string | null;
    features: string[];
    recommended: boolean;
    free: boolean;
  };
  prices: Array<{
    id: number;
    amount: number;
    currency: string;
    interval: string;
    interval_count: number;
    purchase_available: boolean;
  }>;
};

export type HostingPlanCreationUnavailableReason =
  | 'provider_unavailable'
  | 'paid_hosting_disabled'
  | 'checkout_unavailable'
  | 'plan_unavailable'
  | 'workspace_unavailable'
  | 'free_entitlement_used'
  | 'plan_account_limit_reached';

export type HostingPremiumPrice = {
  id: number;
  product_id: number;
  product_name: string | null;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  purchase_available: boolean;
};

export type HostingPremiumDecision = {
  is_premium: true;
  available: boolean;
  can_use: boolean;
  requires_purchase: boolean;
  entitlement: 'subscription' | 'complimentary' | null;
  price: HostingPremiumPrice | null;
  reserved_until: string | null;
  purchase?: {uuid: string};
};

export type HostingAvailability = {
  available: boolean;
  can_use: boolean;
  subdomain: string;
  fqdn: string;
  zone: {id: number; domain: string};
  premium: HostingPremiumDecision | null;
};

export type AdminPremiumSubdomain = {
  id: number;
  hosting_zone_id: number;
  label: string;
  fqdn: string;
  annual_price_id: number | null;
  price: HostingPremiumPrice | null;
  assigned_user: {id: number; email: string} | null;
  subscription_id: number | null;
  complimentary_until: string | null;
  reserved_user: {id: number; email: string} | null;
  reservation_expires_at: string | null;
  is_active: boolean;
  notes: string | null;
  status:
    | 'inactive'
    | 'expired'
    | 'paid'
    | 'complimentary'
    | 'reserved'
    | 'for_sale'
    | 'draft';
  can_delete: boolean;
};

export type AdminPremiumSubdomainsResponse = {
  data: AdminPremiumSubdomain[];
  options: {
    zones: Array<{id: number; domain: string; is_default: boolean}>;
    annual_prices: HostingPremiumPrice[];
    standard_min_length: number;
  };
};

export type HostingOrder = {
  id: number;
  uuid: string;
  fqdn: string;
  status:
    | 'requested'
    | 'awaiting_payment'
    | 'paid'
    | 'provisioning'
    | 'fulfilled'
    | 'failed'
    | 'cancelled';
  failure: {code: string; message: string | null} | null;
  paid_at: string | null;
  fulfilled_at: string | null;
  cancelled_at: string | null;
  expires_at: string | null;
  can_cancel: boolean;
  created_at: string;
  plan?: {
    id: number;
    product_id: number;
    name: string | null;
    type: 'free' | 'paid';
  };
  price?: {
    id: number;
    amount: number;
    currency: string;
    interval: string;
    interval_count: number;
  };
  account?: HostingAccount | null;
};

export type HostingAccountStatus =
  | 'pending'
  | 'provisioning'
  | 'active'
  | 'suspended'
  | 'pending_downgrade'
  | 'pending_deletion'
  | 'deleting'
  | 'deleted'
  | 'failed'
  | 'action_required';

export type HostingAccount = {
  id: number;
  uuid: string;
  fqdn: string;
  status: HostingAccountStatus;
  desired_status: HostingAccountStatus | null;
  username_masked: string | null;
  has_credentials: boolean;
  technical: {ftp_host: string | null; sql_host: string | null};
  tools: {
    control_panel: boolean;
    webftp: boolean;
    installer: boolean;
    file_manager: boolean;
    site_builder: boolean;
    ssl: boolean;
    mysql: boolean;
    stats: boolean;
  };
  plan?: {
    id: number;
    product_id: number;
    type: 'free' | 'paid';
    name: string;
    quotas: Record<string, string | number | boolean>;
  };
  activated_at: string | null;
  last_synced_at: string | null;
  deletion_requested_at: string | null;
  deletes_at: string | null;
  can_cancel_deletion: boolean;
  created_at: string;
};

export type HostingMetric = {
  used: number | null;
  limit: number | null;
  unit: 'bytes' | 'count';
};

export type HostingStats = {
  availability: 'available' | 'unavailable' | 'not_supported';
  retryable: boolean;
  safe_code: string;
  measured_at: string | null;
  is_stale: boolean;
  metrics: {
    disk: HostingMetric;
    bandwidth: HostingMetric;
    inodes: HostingMetric;
    domains: HostingMetric;
    databases: HostingMetric;
  } | null;
};

export type HostingAccountActivity = {
  id: number;
  event: string;
  from_status: HostingAccountStatus | null;
  to_status: HostingAccountStatus | null;
  metadata: {
    tool?: string;
    operation?: string;
    plan_id?: number;
    reason_code?: string;
  };
  created_at: string;
};

export type HostingDomain = {
  domain: string;
  type: 'primary' | 'custom' | 'subdomain';
  status: string;
  is_primary: boolean;
};

export type HostingDnsInstruction = {
  type: 'CNAME';
  name: string;
  value: string;
  ttl: number;
};

export type HostingDomainVerification = {
  data: HostingDomain;
  dns: {
    status: 'verified' | 'pending' | 'unavailable';
    retryable: boolean;
    safe_code: string;
    checked_at: string;
    instructions: HostingDnsInstruction[];
  };
  next_action:
    | 'none'
    | 'add_in_control_panel'
    | 'configure_dns'
    | 'retry_verification';
};

export type HostingDomainsResponse = {
  data: HostingDomain[];
  availability: 'available' | 'unavailable' | 'not_supported';
  retryable: boolean;
  safe_code: string;
  allowed_zones: string[];
  can_manage_subdomains: boolean;
  can_manage_custom_domains: boolean;
};

export type HostingFileEntry = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number | null;
  modified_at: string | null;
  permissions: string | null;
};

export type HostingFilesResponse = {
  data: HostingFileEntry[];
  path: string;
  availability: 'available' | 'unavailable' | 'not_supported';
  retryable: boolean;
  safe_code: string;
  settings: HostingFileManagerSettings;
};

export type HostingFileManagerSettings = {
  external_fallback: boolean;
  allow_zip_operations: boolean;
  editor_theme: 'auto' | 'chrome' | 'monokai' | 'tomorrow_night';
  code_beautify: boolean;
  code_suggestion: boolean;
  auto_complete: boolean;
  max_upload_bytes: number;
  max_editable_bytes: number;
};

export type HostingFileContent = {
  path: string;
  content: string;
  mime_type: string;
  size: number | null;
};

export type HostingDatabase = {
  name: string;
  host: string;
  username: string | null;
};

export type HostingDatabasesResponse = {
  data: HostingDatabase[];
  availability: 'available' | 'unavailable' | 'not_supported';
  retryable: boolean;
  safe_code: string;
};

export type AdminHostingAccountResources = {
  account: HostingAccount;
  customer: {
    id: number;
    display_name: string;
    email: string;
  } | null;
  domains: Pick<
    HostingDomainsResponse,
    'data' | 'availability' | 'retryable' | 'safe_code'
  >;
  files: HostingFilesResponse;
  databases: HostingDatabasesResponse;
  ssl: HostingSslCertificate[];
  events: Array<{
    id: number;
    event: string;
    safe_message: string | null;
    from_status: HostingAccountStatus | null;
    to_status: HostingAccountStatus | null;
    created_at: string;
  }>;
};

export type SupportTicket = {
  id: number;
  uuid: string;
  subject: string;
  type: 'ticket' | 'bug' | 'feature';
  department: 'technical' | 'general' | 'billing';
  status: string;
  priority: string;
  customer?: {id: number; display_name: string; email: string};
  hosting_account_id: number | null;
  last_message_at: string | null;
  messages?: Array<{
    id: number;
    author_type: string;
    body: string;
    is_internal: boolean;
    attachments: SupportTicketAttachment[];
    created_at: string;
  }>;
  created_at: string;
};

export type SupportTicketAttachment = {
  id: number;
  file_name: string;
  mime_type: string | null;
  size: number;
  download_url: string;
};

export type KnowledgeArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  published_at: string | null;
  category?: {id: number; name: string; slug: string};
};

export type HostingOperation = {
  id: number;
  uuid: string;
  hosting_account_id: number | null;
  hosting_order_id: number | null;
  provider: string;
  operation: string;
  status:
    | 'queued'
    | 'running'
    | 'succeeded'
    | 'retryable_failed'
    | 'permanent_failed';
  attempt_count: number;
  safe_code: string | null;
  safe_message: string | null;
  retry_after: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type HostingToolKey =
  | 'control-panel'
  | 'webftp'
  | 'installer'
  | 'file-manager'
  | 'site-builder'
  | 'ssl'
  | 'mysql'
  | 'stats';

export type HostingTool = {
  key: HostingToolKey;
  label: string;
  available: boolean;
};

export type HostingSslCertificate = {
  id: number;
  hosting_account_id: number;
  domain: string;
  status:
    | 'requested'
    | 'action_required'
    | 'verifying'
    | 'issued'
    | 'failed'
    | 'revoked';
  installation_status:
    | 'not_started'
    | 'queued'
    | 'installing'
    | 'installed'
    | 'manual_required'
    | 'action_required'
    | 'failed';
  renewal_status: 'action_required' | 'verifying' | 'failed' | null;
  validation_method: string;
  dns_validation: {
    type?: string;
    name?: string;
    value?: string;
    ttl?: number;
    managed?: boolean;
  } | null;
  renewal_dns_validation: {
    type?: string;
    name?: string;
    value?: string;
    ttl?: number;
    managed?: boolean;
  } | null;
  safe_message: string | null;
  requested_at: string | null;
  verified_at: string | null;
  issued_at: string | null;
  installation_attempted_at: string | null;
  installed_at: string | null;
  last_checked_at: string | null;
  renewal_requested_at: string | null;
  renewal_retry_after: string | null;
  last_renewed_at: string | null;
  valid_until: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type HostingSslFilter =
  | 'all'
  | 'action_required'
  | 'issued'
  | 'expired'
  | 'revoked'
  | 'failed';

export type HostingSslCounts = Record<HostingSslFilter, number>;

export type HostingSslIndexResponse = {
  data: HostingSslCertificate[];
  meta: NonNullable<PaginatedResource<HostingSslCertificate>['meta']>;
  links: NonNullable<PaginatedResource<HostingSslCertificate>['links']>;
  counts: HostingSslCounts;
};

export type AdminHostingSettings = {
  provider_driver: 'fake' | 'mofh';
  provider_timeout_seconds: number;
  provider_connect_timeout_seconds: number;
  provider_retries: number;
  mofh_base_url: string | null;
  mofh_username: string | null;
  mofh_password_configured: boolean;
  mofh_ftp_host: string | null;
  domain_cname_target: string;
  control_panel_url: string | null;
  webftp_url: string | null;
  installer_url: string | null;
  installer_allowed_hosts: string;
  file_manager_url: string | null;
  file_manager_enabled: boolean;
  file_manager_external_fallback: boolean;
  file_manager_host: string | null;
  file_manager_port: number;
  file_manager_ssl: boolean;
  file_manager_passive: boolean;
  file_manager_root: string;
  file_manager_allow_zip_operations: boolean;
  file_manager_editor_theme: 'auto' | 'chrome' | 'monokai' | 'tomorrow_night';
  file_manager_code_beautify: boolean;
  file_manager_code_suggestion: boolean;
  file_manager_auto_complete: boolean;
  file_manager_max_upload_bytes: number;
  file_manager_max_archive_entries: number;
  file_manager_max_archive_source_bytes: number;
  file_manager_max_archive_bytes: number;
  file_manager_max_extract_entries: number;
  file_manager_max_extract_bytes: number;
  vistapanel_enabled: boolean;
  vistapanel_url: string | null;
  site_builder_enabled: boolean;
  site_builder_provider: string;
  site_builder_endpoint: string | null;
  site_builder_allowed_hosts: string;
  site_builder_username: string | null;
  site_builder_password_configured: boolean;
  ssl_enabled: boolean;
  ssl_provider: string;
  ssl_maintenance_enabled: boolean;
  ssl_renew_before_days: number;
  ssl_reconcile_after_hours: number;
  cloudflare_enabled: boolean;
  cloudflare_api_token_configured: boolean;
  cloudflare_account_id: string | null;
  cloudflare_zone_id: string | null;
  acme_enabled: boolean;
  acme_directory_url: string | null;
  acme_email: string | null;
  allowed_domains: string[];
};

export type UpdateAdminHostingSettings = Omit<
  AdminHostingSettings,
  | 'mofh_password_configured'
  | 'site_builder_password_configured'
  | 'cloudflare_api_token_configured'
> & {
  mofh_password?: string;
  site_builder_password?: string;
  cloudflare_api_token?: string;
};

export type AdminHostingProviderHealth = {
  success: boolean;
  retryable: boolean;
  code: string;
  status: string | null;
  provider:
    | 'fake'
    | 'mofh'
    | 'cloudflare'
    | 'site-builder'
    | 'mofh-file-manager';
  checked_at: string;
};

export type AdminHostingFileManagerHealth = AdminHostingProviderHealth & {
  provider: 'mofh-file-manager';
  checks: {
    configured: boolean;
    ftp_extension: boolean;
    flysystem_adapter: boolean;
    zip_extension: boolean;
    temporary_directory: boolean;
    tls_required: boolean;
  };
};

export type PaginatedResource<T> = {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links?: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
};
