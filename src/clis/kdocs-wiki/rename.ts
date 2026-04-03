import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiPost } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'rename',
  description: '重命名文件/文件夹',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, help: 'File kuid' },
    { name: 'title', required: true, positional: true, help: 'New name' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    await wikiPost(page, '/file/operate', {
      kuid: kwargs.kuid,
      action: 'rename',
      title: kwargs.title,
      operate_kdocs: true,
    });
    return [
      { field: 'kuid', value: kwargs.kuid },
      { field: 'title', value: kwargs.title },
      { field: 'status', value: 'renamed' },
    ];
  },
});
