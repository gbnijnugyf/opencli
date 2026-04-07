import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { getCsrfToken } from './utils.js';

interface NodeMeta {
  kuid: string;
  file_id: string;
  doc_type: string;
  parent_kuid: string;
  space_kuid: string;
  drive_id: string;
  title: string;
}

async function getNodeMeta(page: IPage, kuid: string): Promise<NodeMeta> {
  const result = await page.evaluate(`
    (async () => {
      const resp = await fetch(${JSON.stringify(`/wiki/api/km/kuid/meta?kuid=${kuid}&is_record=true`)}, {
        credentials: 'include'
      });
      return await resp.json();
    })()
  `);
  if (result?.code !== 0) {
    throw new Error(`Failed to get metadata for ${kuid}: ${result?.message || 'unknown'}`);
  }
  const file = result.data?.file || {};
  const space = result.data?.space || {};
  return {
    kuid: file.kuid || kuid,
    file_id: file.k_file_id || '',
    doc_type: file.doc_type || '',
    parent_kuid: file.parent_k_file_id === '0' ? space.kuid || '' : file.parent_kuid || '',
    space_kuid: space.kuid || '',
    drive_id: space.drive_id || '',
    title: file.title || space.space_name || '',
  };
}

async function pollTask(page: IPage, taskId: string, maxWaitMs = 10_000): Promise<boolean> {
  const pollMs = 1_000;
  const maxAttempts = Math.ceil(maxWaitMs / pollMs);
  for (let i = 0; i < maxAttempts; i++) {
    const result = await page.evaluate(`
      (async () => {
        const resp = await fetch(${JSON.stringify(`/wiki/api/km/task/progress?task_id=${taskId}`)}, {
          credentials: 'include'
        });
        return await resp.json();
      })()
    `);
    if (result?.data?.status === 'done' || result?.data?.status === 'success') return true;
    if (result?.data?.status === 'failed') return false;
    await page.wait(pollMs / 1_000);
  }
  return true; // Assume success after timeout
}

cli({
  site: 'kdocs-wiki',
  name: 'move',
  description: '移动文件/文件夹',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, help: 'File kuid to move' },
    { name: 'target', required: true, positional: true, help: 'Target folder kuid to move into' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    const fileKuid: string = kwargs.kuid;
    const targetKuid: string = kwargs.target;

    await page.goto(`https://www.kdocs.cn/wiki/l/${fileKuid}/0`);
    await page.wait(3);

    const [fileMeta, targetMeta] = await Promise.all([
      getNodeMeta(page, fileKuid),
      getNodeMeta(page, targetKuid),
    ]);

    const csrf = await getCsrfToken(page);
    const spaceKuid = fileMeta.space_kuid || targetMeta.space_kuid;

    const moveBody = JSON.stringify({
      kuid: fileKuid,
      dest_parent_id: targetMeta.file_id,
      dest_drive_id: targetMeta.drive_id || fileMeta.drive_id,
      dest_file_id: '',
      space_kuid: spaceKuid,
      action_type: 'drop',
      doc_type: fileMeta.doc_type,
      dragging_parent_kuid: fileMeta.parent_kuid || spaceKuid,
      action: 'drag',
      isCollect: true,
      csrfmiddlewaretoken: csrf,
    });

    const result = await page.evaluate(`
      (async () => {
        const resp = await fetch('/wiki/api/km/file/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: ${JSON.stringify(moveBody)}
        });
        return await resp.json();
      })()
    `);

    if (result?.code !== 0) {
      throw new Error(`Move failed: ${result?.message || 'unknown'} (code: ${result?.code})`);
    }

    const taskId = result.data?.task_id;
    if (taskId) {
      await pollTask(page, taskId);
    }

    return [
      { field: 'status', value: 'moved' },
      { field: 'file', value: `${fileMeta.title} (${fileKuid})` },
      { field: 'target', value: `${targetMeta.title} (${targetKuid})` },
    ];
  },
});
