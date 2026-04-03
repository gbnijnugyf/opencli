import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiPost } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'delete-file',
  description: '删除知识库文件/文件夹',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, positional: true, help: 'File kuid to delete' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    await wikiPost(page, '/file/delete', { kuid: kwargs.kuid });
    return [
      { field: 'kuid', value: kwargs.kuid },
      { field: 'status', value: 'deleted' },
    ];
  },
});
