const BASE_URL = 'https://www.cev.eu';

export function normalizeUrl(url: string, base = BASE_URL) {
  if (!url) return url;

  return /^https?:\/\//i.test(url)
    ? url
    : `${base.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
}
