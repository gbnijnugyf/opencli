import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiGet, formatTime } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'info',
  description: '查询知识库详情',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, positional: true, help: 'Space kuid (e.g. 0s_3053257612)' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    const result = await wikiGet<any>(page, '/kuid/meta', {
      kuid: kwargs.kuid,
      is_record: 'true',
      resource: 'permissions',
    });
    const d = result.data || {};
    return [
      { field: 'name', value: d.space_name || d.title || '' },
      { field: 'kuid', value: d.kuid || kwargs.kuid },
      { field: 'desc', value: d.desc || '' },
      { field: 'group_id', value: d.group_id || '' },
      { field: 'drive_id', value: d.drive_id || '' },
      { field: 'owner', value: d.owner?.name || '' },
      { field: 'created', value: formatTime(d.ctime) },
      { field: 'updated', value: formatTime(d.utime) },
      { field: 'cover', value: d.cover_img || '' },
    ].filter(r => r.value);
  },
});
