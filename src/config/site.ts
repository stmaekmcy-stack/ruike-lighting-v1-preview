// One canonical origin for public metadata. Preview origins must never enter the brand graph.
export const SITE_URL = 'https://ruikelight.com/'

export function resolveSiteConfig(env: Record<string, string | undefined>) {
  const siteUrl = new URL(env.VITE_SITE_URL?.trim() || SITE_URL)
  if (siteUrl.href !== SITE_URL) {
    throw new Error('VITE_SITE_URL must equal the verified canonical SITE_URL; preview URLs are not allowed.')
  }
  const deploymentTarget = env.VITE_DEPLOYMENT_TARGET || 'preview'
  if (!['preview', 'production'].includes(deploymentTarget)) {
    throw new Error('VITE_DEPLOYMENT_TARGET must be preview or production.')
  }
  if (env.VITE_ALLOW_INDEXING && !['true', 'false'].includes(env.VITE_ALLOW_INDEXING)) {
    throw new Error('VITE_ALLOW_INDEXING must be true or false.')
  }
  const allowIndexing = env.VITE_ALLOW_INDEXING === 'true'
  const base = env.VITE_BASE_PATH || '/'
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) {
    throw new Error('VITE_BASE_PATH must be a root-relative directory path with a trailing slash.')
  }
  if (deploymentTarget === 'production' && base !== '/') {
    throw new Error('Production builds require VITE_BASE_PATH=/.')
  }
  if (allowIndexing && deploymentTarget !== 'production') {
    throw new Error('Only a production build may allow indexing.')
  }
  return { siteUrl: siteUrl.href, deploymentTarget, allowIndexing, base }
}
