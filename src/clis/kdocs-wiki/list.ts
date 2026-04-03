import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { formatTime } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'list',
  description: '查询知识库列表',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'limit', type: 'int', default: 30, help: 'Max results' },
  ],
  columns: ['name', 'kuid', 'desc', 'files', 'members', 'updated'],
  func: async (page: IPage, kwargs) => {
    const pageSize = kwargs.limit ?? 30;
    const result = await page.evaluate(`
      (async () => {
        const resp = await fetch(
          'https://wiki.kdocs.cn/kwiki/api/v1/groups/space/list?page_size=${pageSize}&classify=allWithSquare&permission_key=view_space_setting&page_token=&with_more=true',
          { credentials: 'include' }
        );
        return await resp.json();
      })()
    `);
    if (result?.code !== 0) {
      throw new Error(`KDocs API error: ${result?.msg || 'unknown'}`);
    }
    const list = result.data?.list || [];
    return list.map((item: any) => ({
      name: item.space_name || '',
      kuid: item.kuid || '',
      desc: (item.desc || '').slice(0, 60),
      files: item.file_total ?? 0,
      members: item.member_total ?? 0,
      updated: formatTime(item.utime),
    }));
  },
});
