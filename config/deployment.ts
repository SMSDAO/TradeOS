export type DeploymentProvider = 'none' | 'vercel' | 'railway' | 'custom';

export interface DeploymentConfig {
  provider: DeploymentProvider;
  productionUrl: string;
  stagingUrl: string;
  previewEnabled: boolean;
}

const DEFAULT_PRODUCTION_URL = 'https://tradeos.app';
const DEFAULT_STAGING_URL = 'https://staging.tradeos.app';

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    parsed.hostname = parsed.hostname.toLowerCase();
    const normalized = parsed.toString();
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  } catch {
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  }
}

function normalizeProvider(value: string | undefined): DeploymentProvider {
  const provider = (value ?? 'none').toLowerCase();
  if (provider === 'vercel' || provider === 'railway' || provider === 'custom') {
    return provider;
  }
  return 'none';
}

function getNonEmptyEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getDeploymentConfig(): DeploymentConfig {
  const primaryDomain = normalizeUrl(getNonEmptyEnv('DEPLOYMENT_PRIMARY_DOMAIN') ?? DEFAULT_PRODUCTION_URL);
  const productionUrl = normalizeUrl(getNonEmptyEnv('PRODUCTION_URL') ?? primaryDomain);
  const stagingUrl = normalizeUrl(getNonEmptyEnv('STAGING_URL') ?? DEFAULT_STAGING_URL);
  const provider = normalizeProvider(process.env.DEPLOYMENT_PROVIDER);
  const previewEnabled = process.env.DEPLOY_PREVIEW_ENABLED === 'true';

  return {
    provider,
    productionUrl,
    stagingUrl,
    previewEnabled,
  };
}

export function getAllowedOrigins(): string[] {
  const config = getDeploymentConfig();
  const additionalOrigins = (process.env.ADDITIONAL_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      config.productionUrl,
      config.stagingUrl,
      'http://localhost:3000',
      'http://localhost:3001',
      ...additionalOrigins,
    ])
  );
}
