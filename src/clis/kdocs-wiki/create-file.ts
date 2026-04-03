import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiPost } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'create-file',
  description: '创建文件/文件夹',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, help: 'Target space kuid or parent folder kuid' },
    { name: 'title', required: true, positional: true, help: 'File name' },
    { name: 'type', default: 'w', help: 'Type: w(Word) / s(Sheet) / p(PPT) / folder', choices: ['w', 's', 'p', 'folder'] },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    const result = await wikiPost<any>(page, '/file/create', {
      kuid: kwargs.kuid,
      title: kwargs.title,
      doc_type: kwargs.type,
    });
    const d = result.data || {};
    return [
      { field: 'kuid', value: d.kuid || '' },
      { field: 'title', value: d.title || kwargs.title },
      { field: 'url', value: d.url || '' },
      { field: 'status', value: 'created' },
    ];
  },
});
