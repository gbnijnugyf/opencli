import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiPost } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'create-space',
  description: '创建个人知识库',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'name', required: true, positional: true, help: 'Knowledge base name' },
    { name: 'desc', default: '', help: 'Description' },
    { name: 'cover', default: '', help: 'Cover image URL' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    const body: Record<string, string> = {
      name: kwargs.name,
      desc: kwargs.desc || '',
      space_type: 'personal',
      square_category: 'doclib',
    };
    if (kwargs.cover) body.cover_img = kwargs.cover;

    const result = await wikiPost<any>(page, '/group/create', body, 'form');
    const d = result.data || {};
    return [
      { field: 'kuid', value: d.kuid || '' },
      { field: 'group_id', value: d.group_id || '' },
      { field: 'drive_id', value: d.drive_id || '' },
      { field: 'status', value: 'created' },
    ];
  },
});
