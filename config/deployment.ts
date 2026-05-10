export type DeploymentProvider = 'none' | 'vercel' | 'railway' | 'custom';

export interface DeploymentConfig {
  provider: DeploymentProvider;
  productionUrl: string;
  stagingUrl: string;
  previewEnabled: boolean;
}

const DEFAULT_PRODUCTION_URL = 'https://TradeOS.app';
const DEFAULT_STAGING_URL = 'https://staging.tradeos.app';

function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function normalizeProvider(value: string | undefined): DeploymentProvider {
  const provider = (value ?? 'none').toLowerCase();
  if (provider === 'vercel' || provider === 'railway' || provider === 'custom') {
    return provider;
  }
  return 'none';
}

export function getDeploymentConfig(): DeploymentConfig {
  const primaryDomain = normalizeUrl(process.env.DEPLOYMENT_PRIMARY_DOMAIN ?? DEFAULT_PRODUCTION_URL);
  const productionUrl = normalizeUrl(process.env.PRODUCTION_URL ?? primaryDomain);
  const stagingUrl = normalizeUrl(process.env.STAGING_URL ?? DEFAULT_STAGING_URL);
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
