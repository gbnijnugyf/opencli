import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiGet, formatTime } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'list',
  description: '查询知识库列表',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'classify', default: 'all', help: 'Filter: all / manager', choices: ['all', 'manager'] },
    { name: 'limit', type: 'int', default: 50, help: 'Max results' },
  ],
  columns: ['name', 'kuid', 'desc', 'files', 'members', 'updated'],
  func: async (page: IPage, kwargs) => {
    const result = await wikiGet<any>(page, '/space/list', {
      classify: kwargs.classify,
      page_size: String(kwargs.limit),
    });
    const list = result.data?.list || [];
    return list.map((item: any) => ({
      name: item.space_name || '',
      kuid: item.kuid || '',
      desc: (item.desc || '').slice(0, 60),
      files: item.member_total ?? 0,
      members: item.member_total ?? 0,
      updated: formatTime(item.utime),
    }));
  },
});
