import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiGet, formatTime } from './utils.js';

const DOC_TYPES: Record<string, string> = {
  w: 'Word', s: 'Sheet', p: 'PPT', f: 'PDF', o: 'Outline',
  pof: 'MindMap', unknown: 'Other',
};

cli({
  site: 'kdocs-wiki',
  name: 'files',
  description: '查询文件/文件夹列表',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, positional: true, help: 'Space kuid (e.g. 0s_3053257612)' },
    { name: 'limit', type: 'int', default: 50, help: 'Max results' },
  ],
  columns: ['title', 'type', 'kuid', 'file_id', 'size', 'created'],
  func: async (page: IPage, kwargs) => {
    const result = await wikiGet<any>(page, '/file/node/get', {
      kuid: kwargs.kuid,
      page_size: String(kwargs.limit),
    });
    const nodes = result.data?.list || [];
    return nodes.map((n: any) => ({
      title: n.title || '',
      type: DOC_TYPES[n.doc_type] || n.doc_type || '',
      kuid: n.kuid || '',
      file_id: n.file_id || '',
      size: n.size ?? 0,
      created: formatTime(n.ctime),
    }));
  },
});
