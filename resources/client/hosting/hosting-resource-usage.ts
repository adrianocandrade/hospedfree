import {
  HostingAccount,
  HostingMetric,
  HostingStats,
} from '@app/hosting/hosting-types';

export type HostingResourceUsage = {
  used: number | null;
  limit: number | null;
  unit: 'bytes' | 'count';
  usedLabel: string | null;
  limitLabel: string | null;
  valueLabel: string;
  percentage: number | null;
};

export type HostingResourceSummary = {
  disk: HostingResourceUsage;
  bandwidth: HostingResourceUsage;
  domains: HostingResourceUsage;
  databases: HostingResourceUsage;
  inodes: HostingResourceUsage;
  hasMeasuredUsage: boolean;
};

export function resolveHostingResourceSummary(
  account: HostingAccount,
  stats?: HostingStats,
  overrides: {domains?: number | null; databases?: number | null} = {},
): HostingResourceSummary {
  const metrics = stats?.metrics;
  const disk = resource(
    metrics?.disk,
    quotaBytes(account, 'disk_mb'),
    quotaStorageLabel(account, 'disk_mb', 1024),
  );
  const bandwidth = resource(
    metrics?.bandwidth,
    quotaBytes(account, 'bandwidth_mb'),
    quotaStorageLabel(account, 'bandwidth_mb', 1000),
  );
  const domains = resource(
    withUsed(metrics?.domains, overrides.domains),
    quotaNumber(account, 'domains'),
  );
  const databases = resource(
    withUsed(metrics?.databases, overrides.databases),
    quotaNumber(account, 'databases'),
  );
  const inodes = resource(metrics?.inodes);

  return {
    disk,
    bandwidth,
    domains,
    databases,
    inodes,
    hasMeasuredUsage: [disk, bandwidth, domains, databases, inodes].some(
      item => item.used != null,
    ),
  };
}

function withUsed(
  metric: HostingMetric | undefined,
  override: number | null | undefined,
): HostingMetric | undefined {
  if (override == null) return metric;

  return {
    used: override,
    limit: metric?.limit ?? null,
    unit: 'count',
  };
}

function resource(
  metric?: HostingMetric,
  contractualLimit?: number | null,
  contractualLimitLabel?: string | null,
): HostingResourceUsage {
  const used = metric?.used ?? null;
  const limit = contractualLimit ?? metric?.limit ?? null;
  const unit = metric?.unit ?? 'count';
  const usedLabel = used == null ? null : formatValue(used, unit);
  const limitLabel =
    contractualLimitLabel ?? (limit == null ? null : formatValue(limit, unit));
  const percentage =
    used != null && limit != null && limit > 0
      ? Math.min(100, Math.round((used / limit) * 100))
      : null;

  return {
    used,
    limit,
    unit,
    usedLabel,
    limitLabel,
    valueLabel:
      usedLabel && limitLabel
        ? `${usedLabel} / ${limitLabel}`
        : (usedLabel ?? limitLabel ?? '—'),
    percentage,
  };
}

function quotaBytes(account: HostingAccount, key: string): number | null {
  const megabytes = quotaNumber(account, key);
  return megabytes == null ? null : megabytes * 1024 * 1024;
}

function quotaStorageLabel(
  account: HostingAccount,
  key: string,
  megabytesPerGigabyte: number,
): string | null {
  const megabytes = quotaNumber(account, key);
  if (megabytes == null) return null;

  if (megabytes >= megabytesPerGigabyte) {
    return `${formatNumber(megabytes / megabytesPerGigabyte, 1)} GB`;
  }

  return `${formatNumber(megabytes, 0)} MB`;
}

function quotaNumber(account: HostingAccount, key: string): number | null {
  const value = account.plan?.quotas?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
  }
  return null;
}

function formatValue(value: number, unit: 'bytes' | 'count'): string {
  return unit === 'bytes' ? formatBytes(value) : formatNumber(value, 0);
}

function formatBytes(value: number): string {
  if (value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(value) / Math.log(1024)),
  );
  return `${formatNumber(value / 1024 ** index, 1)} ${units[index]}`;
}

function formatNumber(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat('pt-BR', {maximumFractionDigits}).format(value);
}
