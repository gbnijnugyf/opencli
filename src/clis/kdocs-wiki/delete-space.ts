import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiPost } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'delete-space',
  description: '删除知识库',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, positional: true, help: 'Space kuid to delete (e.g. 0s_xxx)' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    await wikiPost(page, '/space/close', { kuid: kwargs.kuid });
    return [
      { field: 'kuid', value: kwargs.kuid },
      { field: 'status', value: 'deleted' },
    ];
  },
});
