import {
  HostingAccount,
  HostingPlan,
  HostingOperation,
  KnowledgeArticle,
  PaginatedResource,
  SupportTicket,
  HostingSslCertificate,
  HostingTool,
  HostingToolKey,
  AdminHostingSettings,
  AdminHostingFileManagerHealth,
  AdminHostingProviderHealth,
  UpdateAdminHostingSettings,
  HostingStats,
  HostingAccountActivity,
  HostingDomain,
  HostingDomainVerification,
  HostingDomainsResponse,
  HostingFileContent,
  HostingFilesResponse,
  HostingDatabase,
  HostingDatabasesResponse,
  AdminHostingAccountResources,
  HostingSslFilter,
  HostingSslIndexResponse,
  HostingOrder,
  HostingAvailability,
  HostingPremiumDecision,
  AdminPremiumSubdomain,
  AdminPremiumSubdomainsResponse,
} from '@app/hosting/hosting-types';
import {apiClient, queryClient} from '@common/http/query-client';
import {PaginatedBackendResponse} from '@common/http/backend-response/pagination-response';
import {getBootstrapData} from '@ui/bootstrap-data/bootstrap-data-store';
import {
  mutationOptions,
  queryOptions,
  keepPreviousData,
} from '@tanstack/react-query';

export const hostingAccountsKey = ['hosting', 'accounts'];
export const hostingPlansKey = ['hosting', 'plans'];
export const hostingOrdersKey = ['hosting', 'orders'];
export const supportTicketsKey = ['support', 'tickets'];
const hostingPollLimit = 10;
const transientAccountStatuses = new Set([
  'pending',
  'provisioning',
  'pending_downgrade',
  'deleting',
]);
const transientDomainStatuses = new Set([
  'creating',
  'pending',
  'pending_verification',
  'processing',
  'provisioning',
  'verifying',
]);

export function hostingPollingDelay(dataUpdateCount: number) {
  if (dataUpdateCount >= hostingPollLimit) return false;

  return Math.min(
    30_000,
    5_000 * 2 ** Math.floor(Math.max(0, dataUpdateCount - 1) / 3),
  );
}

export function shouldPollHostingDomains(result: HostingDomainsResponse) {
  if (result.availability !== 'available') {
    return result.availability === 'unavailable' && result.retryable;
  }

  return result.data.some(domain => transientDomainStatuses.has(domain.status));
}

export const hostingAccountsIndexOptions = (
  params: Record<string, string | number>,
) =>
  queryOptions({
    queryKey: [...hostingAccountsKey, params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResource<HostingAccount>>(
        'hosting/accounts',
        {params},
      );
      const resource = response.data;
      const meta = resource.meta;

      return {
        pagination: {
          data: resource.data,
          current_page: meta?.current_page ?? 1,
          last_page: meta?.last_page ?? 1,
          per_page: meta?.per_page ?? Math.max(resource.data.length, 1),
          total: meta?.total ?? resource.data.length,
          from: meta?.from ?? (resource.data.length ? 1 : null),
          to: meta?.to ?? (resource.data.length || null),
        },
      } satisfies PaginatedBackendResponse<HostingAccount>;
    },
    placeholderData: keepPreviousData,
    refetchInterval: query => {
      const accounts = query.state.data?.pagination.data;
      return accounts?.some(
        account =>
          transientAccountStatuses.has(account.status) ||
          (account.desired_status !== null &&
            account.desired_status !== account.status),
      )
        ? hostingPollingDelay(query.state.dataUpdateCount)
        : false;
    },
  });

export const hostingPlansOptions = () =>
  queryOptions({
    queryKey: hostingPlansKey,
    queryFn: async () =>
      (await apiClient.get<{data: HostingPlan[]}>('hosting/plans')).data.data,
  });

export const hostingAccountsOptions = () =>
  queryOptions({
    queryKey: hostingAccountsKey,
    queryFn: async () =>
      (
        await apiClient.get<PaginatedResource<HostingAccount>>(
          'hosting/accounts',
        )
      ).data.data,
    refetchInterval: query => {
      const accounts = query.state.data;
      return accounts?.some(
        account =>
          transientAccountStatuses.has(account.status) ||
          (account.desired_status !== null &&
            account.desired_status !== account.status),
      )
        ? hostingPollingDelay(query.state.dataUpdateCount)
        : false;
    },
  });

export const hostingStatsOptions = (accountId: number | null) =>
  queryOptions({
    queryKey: [...hostingAccountsKey, accountId, 'stats'],
    enabled: accountId != null,
    queryFn: async () =>
      (
        await apiClient.get<{data: HostingStats}>(
          `hosting/accounts/${accountId}/stats`,
        )
      ).data.data,
    staleTime: 60_000,
    retry: 1,
  });

export const hostingActivityOptions = (accountId: number | null) =>
  queryOptions({
    queryKey: [...hostingAccountsKey, accountId, 'activity'],
    enabled: accountId != null,
    queryFn: async () =>
      (
        await apiClient.get<{data: HostingAccountActivity[]}>(
          `hosting/accounts/${accountId}/activity`,
        )
      ).data.data,
    staleTime: 30_000,
  });

export const hostingDomainsOptions = (accountId: number) =>
  queryOptions({
    queryKey: [...hostingAccountsKey, accountId, 'domains'],
    queryFn: async () =>
      (
        await apiClient.get<HostingDomainsResponse>(
          `hosting/accounts/${accountId}/domains`,
        )
      ).data,
    staleTime: 30_000,
    refetchInterval: query => {
      const result = query.state.data;
      if (!result) return false;

      return shouldPollHostingDomains(result)
        ? hostingPollingDelay(query.state.dataUpdateCount)
        : false;
    },
  });

export const verifyHostingDomainOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (domain: string) =>
      (
        await apiClient.post<HostingDomainVerification>(
          `hosting/accounts/${accountId}/domains/verify`,
          {domain},
        )
      ).data,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...hostingAccountsKey, accountId, 'domains'],
      }),
  });

export const createHostingSubdomainOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (payload: {label: string; zone: string}) =>
      (
        await apiClient.post<{data: HostingDomain}>(
          `hosting/accounts/${accountId}/domains/subdomains`,
          payload,
        )
      ).data.data,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...hostingAccountsKey, accountId, 'domains'],
      }),
  });

export const deleteHostingDomainOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (domain: string) =>
      (
        await apiClient.delete(
          `hosting/accounts/${accountId}/domains/${encodeURIComponent(domain)}`,
        )
      ).data,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...hostingAccountsKey, accountId, 'domains'],
      }),
  });

export const hostingFilesOptions = (accountId: number, path: string) =>
  queryOptions({
    queryKey: [...hostingAccountsKey, accountId, 'files', path],
    queryFn: async () =>
      (
        await apiClient.get<HostingFilesResponse>(
          `hosting/accounts/${accountId}/files`,
          {params: path ? {path} : undefined},
        )
      ).data,
    staleTime: 10_000,
  });

export const hostingFileContentOptions = (
  accountId: number,
  path: string | null,
) =>
  queryOptions({
    queryKey: [...hostingAccountsKey, accountId, 'files', 'content', path],
    enabled: path != null,
    queryFn: async () =>
      (
        await apiClient.get<{data: HostingFileContent}>(
          `hosting/accounts/${accountId}/files/content`,
          {params: {path}},
        )
      ).data.data,
  });

export const createHostingFileOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (payload: {
      type: 'file' | 'directory';
      directory: string;
      name: string;
      content?: string;
    }) =>
      (await apiClient.post(`hosting/accounts/${accountId}/files`, payload))
        .data,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...hostingAccountsKey, accountId, 'files'],
      }),
  });

export const updateHostingFileOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (payload: {
      path: string;
      operation: 'write' | 'rename' | 'copy' | 'move' | 'archive' | 'extract';
      content?: string;
      name?: string;
      destination?: string;
    }) =>
      (await apiClient.put(`hosting/accounts/${accountId}/files`, payload))
        .data,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...hostingAccountsKey, accountId, 'files'],
      }),
  });

export const deleteHostingFileOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (path: string) =>
      (
        await apiClient.delete(`hosting/accounts/${accountId}/files`, {
          data: {path},
        })
      ).data,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...hostingAccountsKey, accountId, 'files'],
      }),
  });

export const uploadHostingFileOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (payload: {directory: string; file: File}) => {
      const formData = new FormData();
      formData.append('directory', payload.directory);
      formData.append('file', payload.file);

      return (
        await apiClient.post(
          `hosting/accounts/${accountId}/files/upload`,
          formData,
          {headers: {'Content-Type': 'multipart/form-data'}},
        )
      ).data;
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...hostingAccountsKey, accountId, 'files'],
      }),
  });

export const downloadHostingFile = async (
  accountId: number,
  path: string,
): Promise<Blob> =>
  (
    await apiClient.get<Blob>(`hosting/accounts/${accountId}/files/download`, {
      params: {path},
      responseType: 'blob',
    })
  ).data;

export const hostingDatabasesOptions = (accountId: number) =>
  queryOptions({
    queryKey: [...hostingAccountsKey, accountId, 'databases'],
    queryFn: async () =>
      (
        await apiClient.get<HostingDatabasesResponse>(
          `hosting/accounts/${accountId}/databases`,
        )
      ).data,
    staleTime: 10_000,
  });

export const createHostingDatabaseOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (name: string) =>
      (
        await apiClient.post<{data: HostingDatabase}>(
          `hosting/accounts/${accountId}/databases`,
          {name},
        )
      ).data.data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...hostingAccountsKey, accountId, 'databases'],
      }),
  });

export const checkAvailabilityOptions = () =>
  mutationOptions({
    mutationFn: async (subdomain: string) =>
      (
        await apiClient.post<HostingAvailability>('hosting/availability', {
          subdomain,
        })
      ).data,
  });

export const reservePremiumSubdomainOptions = () =>
  mutationOptions({
    mutationFn: async (subdomain: string) =>
      (
        await apiClient.post<{
          subdomain: string;
          fqdn: string;
          premium: HostingPremiumDecision;
        }>('hosting/premium-subdomains/reserve', {subdomain})
      ).data,
  });

export const createHostingOrderOptions = () =>
  mutationOptions({
    mutationFn: async (payload: {
      hosting_plan_id: number;
      subdomain: string;
      price_id?: number;
      idempotency_key: string;
    }) =>
      (await apiClient.post<{data: HostingOrder}>('hosting/orders', payload))
        .data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: hostingAccountsKey});
      queryClient.invalidateQueries({queryKey: hostingOrdersKey});
      queryClient.invalidateQueries({queryKey: hostingPlansKey});
    },
  });

export const pendingHostingOrdersOptions = () =>
  queryOptions({
    queryKey: hostingOrdersKey,
    queryFn: async () =>
      (await apiClient.get<PaginatedResource<HostingOrder>>('hosting/orders'))
        .data.data,
    staleTime: 15_000,
  });

export const cancelPendingHostingOrderOptions = () =>
  mutationOptions({
    mutationFn: async (orderId: number) =>
      (
        await apiClient.delete<{data: HostingOrder}>(
          `hosting/orders/${orderId}`,
        )
      ).data.data,
    onMutate: orderId => {
      queryClient.setQueryData<HostingOrder[]>(hostingOrdersKey, orders =>
        orders?.filter(order => order.id !== orderId),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: hostingOrdersKey});
      queryClient.invalidateQueries({queryKey: hostingPlansKey});
      queryClient.invalidateQueries({queryKey: hostingAccountsKey});
    },
  });

export const revealCredentialsOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async () =>
      (
        await apiClient.post<{username: string; password: string}>(
          `hosting/accounts/${accountId}/credentials/reveal`,
        )
      ).data,
  });

export const resetHostingPasswordOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async () =>
      (await apiClient.post(`hosting/accounts/${accountId}/password-reset`))
        .data,
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: hostingAccountsKey}),
  });

export const reconcileHostingAccountOptions = () =>
  mutationOptions({
    mutationFn: async (accountId: number) =>
      (await apiClient.post(`hosting/accounts/${accountId}/reconcile`)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: hostingAccountsKey}),
  });

export const openHostingToolOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (
      input: HostingToolKey | {tool: HostingToolKey; domain?: string},
    ) => {
      const tool = typeof input === 'string' ? input : input.tool;
      const data =
        typeof input === 'string' ? undefined : {domain: input.domain};

      return (
        await apiClient.post<{url: string}>(
          `hosting/accounts/${accountId}/tools/${tool}`,
          data,
        )
      ).data;
    },
  });

export const hostingToolsOptions = (accountId: number) =>
  queryOptions({
    queryKey: [...hostingAccountsKey, accountId, 'tools'],
    queryFn: async () =>
      (
        await apiClient.get<{data: HostingTool[]}>(
          `hosting/accounts/${accountId}/tools`,
        )
      ).data.data,
  });

export const hostingSslOptions = (
  accountId: number,
  params: {status: HostingSslFilter; page: number; perPage: number},
) =>
  queryOptions({
    queryKey: [...hostingAccountsKey, accountId, 'ssl', params],
    queryFn: async () =>
      (
        await apiClient.get<HostingSslIndexResponse>(
          `hosting/accounts/${accountId}/ssl`,
          {params},
        )
      ).data,
    placeholderData: keepPreviousData,
  });

export const requestHostingSslOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (domain?: string) =>
      (
        await apiClient.post<{data: HostingSslCertificate}>(
          `hosting/accounts/${accountId}/ssl`,
          domain ? {domain} : {},
        )
      ).data.data,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...hostingAccountsKey, accountId, 'ssl'],
      }),
  });

export const verifyHostingSslOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (certificateId: number) =>
      (
        await apiClient.post(
          `hosting/accounts/${accountId}/ssl/${certificateId}/verify`,
        )
      ).data,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...hostingAccountsKey, accountId, 'ssl'],
      }),
  });

export const revokeHostingSslOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (certificateId: number) =>
      (
        await apiClient.delete(
          `hosting/accounts/${accountId}/ssl/${certificateId}`,
        )
      ).data,
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [...hostingAccountsKey, accountId, 'ssl'],
      }),
  });

export const requestHostingDeletionOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (confirmation: string) =>
      (
        await apiClient.delete(`hosting/accounts/${accountId}`, {
          data: {confirmation},
        })
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: hostingAccountsKey}),
  });

export const suspendHostingAccountOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async () =>
      (await apiClient.post(`hosting/accounts/${accountId}/suspend`)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: hostingAccountsKey}),
  });

export const reactivateHostingAccountOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async () =>
      (await apiClient.post(`hosting/accounts/${accountId}/reactivate`)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: hostingAccountsKey}),
  });

export const cancelHostingDeletionOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async () =>
      (await apiClient.post(`hosting/accounts/${accountId}/deletion/cancel`))
        .data,
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: hostingAccountsKey}),
  });

export const supportTicketsOptions = () =>
  queryOptions({
    queryKey: supportTicketsKey,
    queryFn: async () =>
      (await apiClient.get<PaginatedResource<SupportTicket>>('support/tickets'))
        .data.data,
  });

export type CreateSupportTicketPayload = {
  subject: string;
  message: string;
  hosting_account_id?: number;
  type: 'ticket' | 'bug' | 'feature';
  department: 'technical' | 'general' | 'billing';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: File[];
};

export type ReplySupportTicketPayload =
  | string
  | {
      message: string;
      attachments?: File[];
    };

function supportTicketFormData(
  payload:
    | CreateSupportTicketPayload
    | Exclude<ReplySupportTicketPayload, string>,
) {
  const formData = new FormData();
  formData.append('message', payload.message);
  if ('subject' in payload) {
    formData.append('subject', payload.subject);
  }
  if ('hosting_account_id' in payload && payload.hosting_account_id) {
    formData.append('hosting_account_id', `${payload.hosting_account_id}`);
  }
  if ('type' in payload) {
    formData.append('type', payload.type);
    formData.append('department', payload.department);
    formData.append('priority', payload.priority);
  }
  payload.attachments?.forEach(file => formData.append('attachments[]', file));
  return formData;
}

export const createSupportTicketOptions = () =>
  mutationOptions({
    mutationFn: async (payload: CreateSupportTicketPayload) =>
      (
        await apiClient.post<{data: SupportTicket}>(
          'support/tickets',
          supportTicketFormData(payload),
        )
      ).data.data,
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: supportTicketsKey}),
  });

export const supportTicketOptions = (ticketId: number | null) =>
  queryOptions({
    queryKey: [...supportTicketsKey, ticketId],
    queryFn: async () =>
      (
        await apiClient.get<{data: SupportTicket}>(
          `support/tickets/${ticketId}`,
        )
      ).data.data,
    enabled: ticketId !== null,
  });

export const replySupportTicketOptions = (ticketId: number) =>
  mutationOptions({
    mutationFn: async (payload: ReplySupportTicketPayload) =>
      (
        await apiClient.post<{data: SupportTicket}>(
          `support/tickets/${ticketId}/messages`,
          typeof payload === 'string'
            ? supportTicketFormData({message: payload})
            : supportTicketFormData(payload),
        )
      ).data.data,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({queryKey: supportTicketsKey}),
        queryClient.invalidateQueries({
          queryKey: [...supportTicketsKey, ticketId],
        }),
      ]),
  });

export const knowledgeArticlesOptions = (search = '') =>
  queryOptions({
    queryKey: ['knowledge', 'articles', search],
    queryFn: async () =>
      (
        await apiClient.get<PaginatedResource<KnowledgeArticle>>(
          'knowledge/articles',
          {params: search ? {query: search} : undefined},
        )
      ).data.data,
  });

export type KnowledgeArticlesPageParams = {
  search?: string;
  category?: string;
  page?: number;
};

export const knowledgeArticlesPageOptions = ({
  search = '',
  category = '',
  page = 1,
}: KnowledgeArticlesPageParams = {}) =>
  queryOptions({
    queryKey: ['knowledge', 'articles-page', {search, category, page}],
    queryFn: async () =>
      (
        await apiClient.get<PaginatedResource<KnowledgeArticle>>(
          'knowledge/articles',
          {
            params: {
              ...(search ? {query: search} : {}),
              ...(category ? {category} : {}),
              ...(page > 1 ? {page} : {}),
            },
          },
        )
      ).data,
    initialData: () => {
      if (search || category || page !== 1) {
        return undefined;
      }

      const loaders = getBootstrapData().loaders as
        | {
            knowledgeIndex?: {
              articles?: PaginatedResource<KnowledgeArticle>;
            };
          }
        | undefined;

      return loaders?.knowledgeIndex?.articles;
    },
  });

export const knowledgeArticleOptions = (slug: string | null) =>
  queryOptions({
    queryKey: ['knowledge', 'article', slug],
    queryFn: async () =>
      (
        await apiClient.get<{data: KnowledgeArticle}>(
          `knowledge/articles/${slug}`,
        )
      ).data.data,
    enabled: slug !== null,
  });

export const adminHostingAccountsOptions = (
  params: Record<string, string | number | undefined> = {},
) =>
  queryOptions({
    queryKey: ['admin', 'hosting', 'accounts', params],
    queryFn: async () =>
      (
        await apiClient.get<PaginatedResource<HostingAccount>>(
          'admin/hosting/accounts',
          {params},
        )
      ).data,
  });

export const adminHostingAccountResourcesOptions = (
  accountId: number,
  path: string,
) =>
  queryOptions({
    queryKey: ['admin', 'hosting', 'accounts', accountId, 'resources', path],
    queryFn: async () =>
      (
        await apiClient.get<{data: AdminHostingAccountResources}>(
          `admin/hosting/accounts/${accountId}/resources`,
          {params: path ? {path} : undefined},
        )
      ).data.data,
    staleTime: 10_000,
  });

export const deleteAdminHostingFileOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (path: string) =>
      (
        await apiClient.delete(`admin/hosting/accounts/${accountId}/files`, {
          data: {path},
        })
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'hosting', 'accounts', accountId, 'resources'],
      }),
  });

export const revokeAdminHostingSslOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (certificateId: number) =>
      (
        await apiClient.delete(
          `admin/hosting/accounts/${accountId}/ssl/${certificateId}`,
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'hosting', 'accounts', accountId, 'resources'],
      }),
  });

export const adminHostingOperationsOptions = (
  params: Record<string, string | number | undefined> = {},
) =>
  queryOptions({
    queryKey: ['admin', 'hosting', 'operations', params],
    queryFn: async () =>
      (
        await apiClient.get<PaginatedResource<HostingOperation>>(
          'admin/hosting/operations',
          {params},
        )
      ).data,
    refetchInterval: query =>
      query.state.data?.data.some(item =>
        ['queued', 'running'].includes(item.status),
      )
        ? 4000
        : false,
  });

export const runAdminHostingOperationOptions = (accountId: number) =>
  mutationOptions({
    mutationFn: async (payload: {
      operation:
        | 'reconcile'
        | 'suspend'
        | 'unsuspend'
        | 'delete'
        | 'change_password'
        | 'change_package';
      target_plan_id?: number;
    }) =>
      (
        await apiClient.post(
          `admin/hosting/accounts/${accountId}/operations`,
          payload,
        )
      ).data,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['admin', 'hosting', 'accounts'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['admin', 'hosting', 'operations'],
        }),
      ]),
  });

export const retryAdminHostingOperationOptions = () =>
  mutationOptions({
    mutationFn: async (operationId: number) =>
      (await apiClient.post(`admin/hosting/operations/${operationId}/retry`))
        .data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'hosting', 'operations'],
      }),
  });

export const adminHostingPlansOptions = () =>
  queryOptions({
    queryKey: ['admin', 'hosting', 'plans'],
    queryFn: async () =>
      (await apiClient.get<{data: HostingPlan[]}>('admin/hosting/plans')).data
        .data,
  });

export const adminPremiumSubdomainsOptions = () =>
  queryOptions({
    queryKey: ['admin', 'hosting', 'premium-subdomains'],
    queryFn: async () =>
      (
        await apiClient.get<AdminPremiumSubdomainsResponse>(
          'admin/hosting/premium-subdomains',
        )
      ).data,
  });

export type AdminPremiumSubdomainPayload = {
  hosting_zone_id: number;
  label: string;
  annual_price_id: number | null;
  grant_user_email: string | null;
  complimentary_until: string | null;
  is_active: boolean;
  notes: string | null;
};

export const createAdminPremiumSubdomainOptions = () =>
  mutationOptions({
    mutationFn: async (payload: AdminPremiumSubdomainPayload) =>
      (
        await apiClient.post<{data: AdminPremiumSubdomain}>(
          'admin/hosting/premium-subdomains',
          payload,
        )
      ).data.data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'hosting', 'premium-subdomains'],
      }),
  });

export const updateAdminPremiumSubdomainOptions = (id: number) =>
  mutationOptions({
    mutationFn: async (payload: AdminPremiumSubdomainPayload) =>
      (
        await apiClient.put<{data: AdminPremiumSubdomain}>(
          `admin/hosting/premium-subdomains/${id}`,
          payload,
        )
      ).data.data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'hosting', 'premium-subdomains'],
      }),
  });

export const deleteAdminPremiumSubdomainOptions = () =>
  mutationOptions({
    mutationFn: async (id: number) =>
      (await apiClient.delete(`admin/hosting/premium-subdomains/${id}`)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'hosting', 'premium-subdomains'],
      }),
  });

export const updateAdminHostingPlanOptions = (planId: number) =>
  mutationOptions({
    mutationFn: async (
      payload: Partial<{
        type: 'free' | 'paid';
        max_accounts_per_workspace: number;
        quotas: Record<string, string | number | boolean>;
        is_active: boolean;
        sort_order: number;
      }>,
    ) =>
      (
        await apiClient.put<{data: HostingPlan}>(
          `admin/hosting/plans/${planId}`,
          payload,
        )
      ).data.data,
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['admin', 'hosting', 'plans']}),
  });

export const createAdminHostingPlanOptions = () =>
  mutationOptions({
    mutationFn: async (payload: {
      product_id: number;
      type: 'free' | 'paid';
      max_accounts_per_workspace: number;
      quotas?: Record<string, string | number | boolean>;
      is_active: boolean;
      sort_order: number;
    }) =>
      (
        await apiClient.post<{data: HostingPlan}>(
          'admin/hosting/plans',
          payload,
        )
      ).data.data,
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['admin', 'hosting', 'plans']}),
  });

export const upsertAdminHostingPackageOptions = (planId: number) =>
  mutationOptions({
    mutationFn: async (payload: {
      provider: 'fake' | 'mofh';
      remote_package: string;
      is_active: boolean;
    }) =>
      (
        await apiClient.put(
          `admin/hosting/plans/${planId}/provider-package`,
          payload,
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['admin', 'hosting', 'plans']}),
  });

export const adminHostingSettingsOptions = () =>
  queryOptions({
    queryKey: ['admin', 'hosting', 'settings'],
    queryFn: async () =>
      (
        await apiClient.get<{data: AdminHostingSettings}>(
          'admin/hosting/settings',
        )
      ).data.data,
  });

export const updateAdminHostingSettingsOptions = () =>
  mutationOptions({
    mutationFn: async (payload: UpdateAdminHostingSettings) =>
      (await apiClient.put('admin/hosting/settings', payload)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'hosting', 'settings'],
      }),
  });

export const testAdminHostingProviderOptions = () =>
  mutationOptions({
    mutationFn: async () =>
      (
        await apiClient.post<{data: AdminHostingProviderHealth}>(
          'admin/hosting/settings/provider-health',
        )
      ).data.data,
  });

export const testAdminHostingCloudflareOptions = () =>
  mutationOptions({
    mutationFn: async () =>
      (
        await apiClient.post<{data: AdminHostingProviderHealth}>(
          'admin/hosting/settings/cloudflare-health',
        )
      ).data.data,
  });

export const testAdminHostingSiteBuilderOptions = () =>
  mutationOptions({
    mutationFn: async () =>
      (
        await apiClient.post<{data: AdminHostingProviderHealth}>(
          'admin/hosting/settings/site-builder-health',
        )
      ).data.data,
  });

export const testAdminHostingFileManagerOptions = () =>
  mutationOptions({
    mutationFn: async () =>
      (
        await apiClient.post<{data: AdminHostingFileManagerHealth}>(
          'admin/hosting/settings/file-manager-health',
        )
      ).data.data,
  });

export const adminSupportTicketsOptions = () =>
  queryOptions({
    queryKey: ['admin', 'support', 'tickets'],
    queryFn: async () =>
      (
        await apiClient.get<PaginatedResource<SupportTicket>>(
          'admin/support/tickets',
        )
      ).data.data,
  });

export const replyAdminSupportTicketOptions = (ticketId: number) =>
  mutationOptions({
    mutationFn: async (payload: ReplySupportTicketPayload) =>
      (
        await apiClient.post<{data: SupportTicket}>(
          `admin/support/tickets/${ticketId}/messages`,
          typeof payload === 'string'
            ? supportTicketFormData({message: payload})
            : supportTicketFormData(payload),
        )
      ).data.data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'support', 'tickets'],
      }),
  });

export const updateAdminSupportTicketOptions = (ticketId: number) =>
  mutationOptions({
    mutationFn: async (
      payload: Partial<{
        status: string;
        priority: string;
        type: string;
        department: string;
      }>,
    ) =>
      (
        await apiClient.put<{data: SupportTicket}>(
          `admin/support/tickets/${ticketId}`,
          payload,
        )
      ).data.data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'support', 'tickets'],
      }),
  });

export const adminKnowledgeArticlesOptions = () =>
  queryOptions({
    queryKey: ['admin', 'knowledge', 'articles'],
    queryFn: async () =>
      (
        await apiClient.get<PaginatedResource<KnowledgeArticle>>(
          'admin/knowledge/articles',
        )
      ).data.data,
  });

export const adminKnowledgeCategoriesOptions = () =>
  queryOptions({
    queryKey: ['admin', 'knowledge', 'categories'],
    queryFn: async () =>
      (
        await apiClient.get<{
          data: Array<{id: number; name: string; slug: string}>;
        }>('admin/knowledge/categories')
      ).data.data,
  });

export const createAdminKnowledgeCategoryOptions = () =>
  mutationOptions({
    mutationFn: async (name: string) =>
      (await apiClient.post('admin/knowledge/categories', {name})).data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'knowledge', 'categories'],
      }),
  });

export const createAdminKnowledgeArticleOptions = () =>
  mutationOptions({
    mutationFn: async (payload: {
      knowledge_category_id: number;
      title: string;
      excerpt?: string;
      body: string;
      status: 'draft' | 'published';
    }) => (await apiClient.post('admin/knowledge/articles', payload)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'knowledge', 'articles'],
      }),
  });

export const updateAdminKnowledgeArticleOptions = (articleId: number) =>
  mutationOptions({
    mutationFn: async (
      payload: Partial<{
        knowledge_category_id: number;
        title: string;
        excerpt: string;
        body: string;
        status: 'draft' | 'published';
      }>,
    ) =>
      (await apiClient.put(`admin/knowledge/articles/${articleId}`, payload))
        .data,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'knowledge', 'articles'],
      }),
  });
