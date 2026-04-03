import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { officeGet } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'download',
  description: '下载知识库文件',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'file-id', required: true, positional: true, help: 'Numeric file_id (from files command)' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    const fileId = kwargs['file-id'];
    const result = await officeGet<any>(page, `/api/v3/office/file/${fileId}/download`);

    if (!result?.download_url) {
      throw new Error(`Download URL not available. Status: ${result?.status || 'unknown'}`);
    }

    return [
      { field: 'download_url', value: result.download_url },
      { field: 'size', value: result.fize ?? 0 },
      { field: 'version', value: result.fver ?? 1 },
      { field: 'status', value: result.status || 'finished' },
    ];
  },
});
