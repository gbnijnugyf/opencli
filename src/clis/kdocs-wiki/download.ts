import * as path from 'node:path';

import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { officeGet, wikiGet } from './utils.js';
import { httpDownload, formatCookieHeader } from '../../download/index.js';
import { createProgressBar, formatBytes } from '../../download/progress.js';

cli({
  site: 'kdocs-wiki',
  name: 'download',
  description: '下载知识库文件',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'file-id', required: true, positional: true, help: 'Numeric file_id (from files command)' },
    { name: 'output', default: '.', help: 'Output directory' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    const fileId = kwargs['file-id'];
    const outputDir = String(kwargs.output ?? '.');

    const result = await officeGet<any>(page, `/api/v3/office/file/${fileId}/download`);
    if (!result?.download_url) {
      throw new Error(`Download URL not available. Status: ${result?.status || 'unknown'}`);
    }

    const downloadUrl: string = result.download_url;

    // Extract filename from URL or Content-Disposition
    let fileName = 'download';
    try {
      const urlObj = new URL(downloadUrl);
      const disposition = urlObj.searchParams.get('response-content-disposition') || '';
      const match = disposition.match(/filename\*?=(?:utf-8''|")?([^;&"]+)/i);
      if (match) {
        fileName = decodeURIComponent(match[1]);
      } else {
        fileName = path.basename(urlObj.pathname);
      }
    } catch {
      fileName = `file_${fileId}`;
    }

    const destPath = path.resolve(outputDir, fileName);
    const cookies = formatCookieHeader(await page.getCookies({ domain: 'kdocs.cn' }));

    const bar = createProgressBar(fileName, 0, 1);
    const dlResult = await httpDownload(downloadUrl, destPath, {
      cookies,
      timeout: 120_000,
      onProgress: (received, total) => bar.update(received, total),
    });

    if (!dlResult.success) {
      bar.fail(dlResult.error || 'unknown error');
      throw new Error(`Download failed: ${dlResult.error}`);
    }

    bar.complete(true, formatBytes(dlResult.size));

    return [
      { field: 'status', value: 'downloaded' },
      { field: 'file', value: destPath },
      { field: 'size', value: formatBytes(dlResult.size) },
    ];
  },
});
