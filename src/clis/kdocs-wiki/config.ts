import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiGet, wikiPost } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'config',
  description: '修改知识库基础配置',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, positional: true, help: 'Space kuid (e.g. 0s_xxx)' },
    { name: 'name', required: true, help: 'New name' },
    { name: 'desc', default: '', help: 'New description' },
    { name: 'cover', default: '', help: 'Cover image URL' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    // Resolve kuid → drive_id (the config API expects drive_id as group_id)
    const meta = await wikiGet<any>(page, '/kuid/meta', { kuid: kwargs.kuid, is_record: 'false' });
    const space = meta.data?.space || meta.data || {};
    const driveId = space.drive_id || kwargs.kuid.replace(/^0s_/, '');

    const body: Record<string, unknown> = {
      group_id: driveId,
      name: kwargs.name,
      desc: kwargs.desc || space.desc || '',
      cover_img: kwargs.cover || space.cover_img || '',
      status: 1,
    };

    await wikiPost(page, '/group/knowledge_view', body);
    return [
      { field: 'kuid', value: kwargs.kuid },
      { field: 'drive_id', value: driveId },
      { field: 'name', value: kwargs.name },
      { field: 'status', value: 'updated' },
    ];
  },
});
