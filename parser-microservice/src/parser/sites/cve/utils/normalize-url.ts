import * as UrlParse from 'url-parse';

const BASE_DOMAIN = 'cev.eu';

export function normalizeUrl(url: string) {
  const parsedUrl = UrlParse(url);

  parsedUrl.set('protocol', 'https:');
  if (!parsedUrl.hostname || !parsedUrl.host) {
    parsedUrl.set('host', BASE_DOMAIN);
    parsedUrl.set('hostname', BASE_DOMAIN);
  }
  return parsedUrl.href;
}
