import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { getCsrfToken } from './utils.js';

function computeSha256(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

cli({
  site: 'kdocs-wiki',
  name: 'upload',
  description: '上传文件到知识库',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, help: 'Target space kuid (e.g. 0s_xxx)' },
    { name: 'file', required: true, positional: true, help: 'Local file path to upload' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    const kuid: string = kwargs.kuid;
    const filePath: string = kwargs.file;

    // Strip invisible Unicode control chars (e.g. U+202A from Windows clipboard)
    const cleanPath = filePath.replace(/[\u200B-\u200D\u202A-\u202E\u2066-\u2069\uFEFF]/g, '');
    const absPath = path.resolve(cleanPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`File not found: ${absPath}`);
    }

    const fileName = path.basename(absPath);
    const fileSize = fs.statSync(absPath).size;
    const sha256 = computeSha256(absPath);

    await page.goto(`https://www.kdocs.cn/wiki/l/${kuid}/0`);
    await page.wait(3);

    const csrf = await getCsrfToken(page);

    // Step 1: Apply for upload — get a pre-signed upload URL
    const applyBody = JSON.stringify({
      kuid,
      name: fileName,
      size: fileSize,
      content_sha256: sha256,
      from: '',
      action: null,
      csrfmiddlewaretoken: csrf,
    });

    const applyResult = await page.evaluate(`
      (async () => {
        const resp = await fetch('/wiki/api/km/upload/file/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: ${JSON.stringify(applyBody)}
        });
        return await resp.json();
      })()
    `);

    if (applyResult?.code !== 0) {
      const msg = applyResult?.message || applyResult?.msg || 'unknown error';
      throw new Error(`Upload apply failed: ${msg} (code: ${applyResult?.code})`);
    }

    const applyData = applyResult.data || {};
    const uploadUrl = applyData.request?.url;
    const method = (applyData.request?.method || 'PUT').toUpperCase();
    const extraHeaders: { name: string; value: string }[] = applyData.request?.headers || [];
    const uploadId = applyData.id || '';

    if (!uploadUrl) {
      throw new Error('Upload apply returned no upload URL. Response: ' + JSON.stringify(applyData));
    }

    // Step 2: Upload file content to the pre-signed URL
    const base64 = fs.readFileSync(absPath).toString('base64');
    const headersObj = Object.fromEntries(extraHeaders.map(h => [h.name, h.value]));

    const uploadResult = await page.evaluate(`
      (async () => {
        try {
          const base64 = ${JSON.stringify(base64)};
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes]);

          // Read wpsua from cookie for the upload endpoint
          const wpsua = document.cookie.split(';')
            .map(c => c.trim())
            .find(c => c.startsWith('wpsua='))?.split('=').slice(1).join('=') || '';

          const headers = {
            ...${JSON.stringify(headersObj)},
            ...(wpsua ? { 'wpsua': wpsua } : {}),
          };

          const resp = await fetch(${JSON.stringify(uploadUrl)}, {
            method: ${JSON.stringify(method)},
            headers,
            body: blob,
            credentials: 'include',
          });

          const text = await resp.text();
          let data = null;
          try { data = JSON.parse(text); } catch {}
          return { ok: resp.ok, status: resp.status, data, text: text.substring(0, 500) };
        } catch (err) {
          return { ok: false, error: err.message };
        }
      })()
    `);

    if (!uploadResult?.ok) {
      throw new Error(
        `File content upload failed: ${uploadResult?.error || uploadResult?.text || 'unknown'} (status: ${uploadResult?.status})`
      );
    }

    // Step 3: ACK — confirm the upload and create the file node
    const ackBody = JSON.stringify({
      store_response: [],
      id: uploadId,
      kuid,
      multi_upload: false,
      csrfmiddlewaretoken: csrf,
    });

    const ackResult = await page.evaluate(`
      (async () => {
        const resp = await fetch('/wiki/api/km/upload/ack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: ${JSON.stringify(ackBody)}
        });
        return await resp.json();
      })()
    `);

    if (ackResult?.code !== 0) {
      const msg = ackResult?.message || 'unknown error';
      throw new Error(`Upload ack failed: ${msg} (code: ${ackResult?.code})`);
    }

    const fileKuid = ackResult.data?.kuid || '';

    return [
      { field: 'status', value: 'uploaded' },
      { field: 'file_kuid', value: fileKuid },
      { field: 'title', value: fileName },
    ];
  },
});
