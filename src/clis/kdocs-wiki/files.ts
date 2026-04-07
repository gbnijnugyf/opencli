import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { wikiGet, formatTime } from './utils.js';

const DOC_TYPES: Record<string, string> = {
  w: 'Word', s: 'Sheet', p: 'PPT', f: 'PDF', o: 'Outline',
  pof: 'MindMap', i: 'Image', folder: 'folder', unknown: 'Other',
};

interface FileRow {
  title: string;
  type: string;
  kuid: string;
  file_id: string;
  size: number;
  created: string;
  path: string;
}

async function listFolder(
  page: IPage,
  kuid: string,
  pageSize: number,
  recursive: boolean,
  parentPath: string,
): Promise<FileRow[]> {
  const result = await wikiGet<any>(page, '/file/node/get', {
    kuid,
    page_size: String(pageSize),
  });
  const nodes = result.data?.list || [];
  const rows: FileRow[] = [];

  for (const n of nodes) {
    const title = n.title || '';
    const isFolder = n.doc_type === 'folder';
    const currentPath = parentPath ? `${parentPath}/${title}` : title;

    rows.push({
      title: recursive ? currentPath : title,
      type: DOC_TYPES[n.doc_type] || n.doc_type || '',
      kuid: n.kuid || '',
      file_id: n.file_id || '',
      size: n.size ?? 0,
      created: formatTime(n.ctime),
      path: currentPath,
    });

    if (recursive && isFolder && n.kuid) {
      const children = await listFolder(page, n.kuid, pageSize, true, currentPath);
      rows.push(...children);
    }
  }
  return rows;
}

cli({
  site: 'kdocs-wiki',
  name: 'files',
  description: '查询文件/文件夹列表',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, positional: true, help: 'Space or folder kuid' },
    { name: 'limit', type: 'int', default: 50, help: 'Max results per folder' },
    { name: 'recursive', type: 'bool', default: false, help: 'Recursively list sub-folder contents' },
  ],
  columns: ['title', 'type', 'kuid', 'file_id', 'size', 'created'],
  func: async (page: IPage, kwargs) => {
    const rows = await listFolder(
      page,
      kwargs.kuid,
      kwargs.limit ?? 50,
      Boolean(kwargs.recursive),
      '',
    );
    return rows.map(({ path: _path, ...rest }) => rest);
  },
});
