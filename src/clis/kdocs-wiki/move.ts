import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiPost } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'move',
  description: '移动文件/文件夹',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, help: 'File kuid to move' },
    { name: 'target', required: true, positional: true, help: 'Target space or folder kuid' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    await wikiPost(page, '/file/move', {
      kuid: kwargs.kuid,
      target_kuid: kwargs.target,
    });
    return [
      { field: 'kuid', value: kwargs.kuid },
      { field: 'target', value: kwargs.target },
      { field: 'status', value: 'moved' },
    ];
  },
});
