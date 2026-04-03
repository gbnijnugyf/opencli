import type { IPage } from '../../types.js';

const SITE_URL = 'https://www.kdocs.cn';
const WIKI_BASE = '/wiki/api/km';

export interface KdocsApiResult {
  code: number;
  message: string;
  data?: unknown;
}

export async function ensureKdocsPage(page: IPage): Promise<void> {
  await page.goto(`${SITE_URL}/wiki/pers/aidocs/home`);
  await page.wait(2);
}

export function getCsrfFromCookies(cookies: { name: string; value: string }[]): string {
  const csrf = cookies.find(c => c.name === 'csrf');
  if (!csrf?.value) throw new Error('CSRF cookie not found. Please login to kdocs.cn first.');
  return csrf.value;
}

export async function getCsrfToken(page: IPage): Promise<string> {
  const cookies = await page.getCookies({ domain: 'kdocs.cn' });
  return getCsrfFromCookies(cookies);
}

export async function wikiGet<T = unknown>(page: IPage, path: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `${WIKI_BASE}${path}${qs}`;
  const result = await page.evaluate(`
    (async () => {
      const resp = await fetch(${JSON.stringify(url)}, { credentials: 'include' });
      return await resp.json();
    })()
  `);
  if (result?.code !== 0) {
    throw new Error(`KDocs API error: ${result?.message || 'unknown'} (code: ${result?.code})`);
  }
  return result as T;
}

export async function wikiPost<T = unknown>(
  page: IPage,
  path: string,
  body: Record<string, unknown>,
  contentType: 'json' | 'form' = 'json',
): Promise<T> {
  const csrf = await getCsrfToken(page);
  const url = `${WIKI_BASE}${path}`;

  const fetchCode = contentType === 'json'
    ? `
      const resp = await fetch(${JSON.stringify(url)}, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...${JSON.stringify(body)}, csrfmiddlewaretoken: ${JSON.stringify(csrf)} })
      });
      return await resp.json();
    `
    : `
      const params = new URLSearchParams(${JSON.stringify({ ...body, csrfmiddlewaretoken: csrf })});
      const resp = await fetch(${JSON.stringify(url)}, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: params.toString()
      });
      return await resp.json();
    `;

  const result = await page.evaluate(`(async () => { ${fetchCode} })()`);
  if (result?.code !== 0) {
    throw new Error(`KDocs API error: ${result?.message || 'unknown'} (code: ${result?.code})`);
  }
  return result as T;
}

export async function officeGet<T = unknown>(page: IPage, path: string): Promise<T> {
  const result = await page.evaluate(`
    (async () => {
      const resp = await fetch(${JSON.stringify(path)}, { credentials: 'include' });
      return await resp.json();
    })()
  `);
  return result as T;
}

export function formatTime(timestamp: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp * 1000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}
