import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiPost } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'config',
  description: '修改知识库基础配置',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'group-id', required: true, help: 'Knowledge base group_id' },
    { name: 'name', required: true, help: 'New name' },
    { name: 'desc', default: '', help: 'New description' },
    { name: 'cover', default: '', help: 'Cover image URL' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    const body: Record<string, unknown> = {
      group_id: kwargs['group-id'],
      name: kwargs.name,
      status: 1,
    };
    if (kwargs.desc) body.desc = kwargs.desc;
    if (kwargs.cover) body.cover_img = kwargs.cover;

    await wikiPost(page, '/group/knowledge_view', body);
    return [
      { field: 'group_id', value: kwargs['group-id'] },
      { field: 'name', value: kwargs.name },
      { field: 'status', value: 'updated' },
    ];
  },
});
