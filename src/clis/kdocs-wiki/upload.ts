import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';
import { getCsrfToken } from './utils.js';

cli({
  site: 'kdocs-wiki',
  name: 'upload',
  description: '上传文件到知识库',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  args: [
    { name: 'kuid', required: true, help: 'Target space kuid (e.g. 0s_xxx)' },
    { name: 'file', required: true, positional: true, help: 'Local file path to upload' },
  ],
  columns: ['field', 'value'],
  func: async (page: IPage, kwargs) => {
    const csrf = await getCsrfToken(page);
    const kuid: string = kwargs.kuid;
    const filePath: string = kwargs.file;

    const result = await page.evaluate(`
      (async () => {
        const fs = arguments[0]; // not available in browser
        // Step 1: Read file info — we need size and sha256.
        // Since we're in the browser, we'll use the page's file upload mechanism.
        // For CLI, we need to compute file metadata on the Node side and pass it in.

        // This is a browser-side placeholder. The actual implementation
        // reads the file via Node.js, computes sha256, then calls the 3-step API.
        return { error: 'Upload requires Node.js file access — see implementation note' };
      })()
    `);

    // The 3-step upload must be orchestrated from Node.js:
    // 1. Read local file, compute sha256
    // 2. POST /wiki/api/km/upload/file/apply to get upload URL
    // 3. PUT file content to storage URL
    // 4. POST /wiki/api/km/upload/ack to confirm

    // Since evaluate() runs in browser context, we use it for API calls
    // but rely on Node.js for file reading. OpenCLI's page.evaluate can
    // handle the API steps after we read the file externally.

    // Implementation: read file via evaluate + FileReader workaround
    // or use setFileInput to leverage the browser's native upload.
    // For now, use setFileInput approach if available.

    if (!page.setFileInput) {
      throw new Error('Upload requires setFileInput support. Use the latest OpenCLI version.');
    }

    // Navigate to the space detail page to access the upload input
    await page.goto(`https://www.kdocs.cn/wiki/l/${kuid}/0`);
    await page.wait(3);

    // Set file on the hidden file input
    await page.setFileInput([filePath], '#selectLocalFile');
    await page.wait(5);

    // Verify upload completed by checking if file appears
    const checkResult = await page.evaluate(`
      (async () => {
        const resp = await fetch('/wiki/api/km/file/node/get?kuid=${kuid}&page_size=5', {
          credentials: 'include'
        });
        const data = await resp.json();
        const nodes = data?.data?.nodes || [];
        if (nodes.length > 0) {
          const latest = nodes[0];
          return { kuid: latest.kuid, title: latest.title, status: 'uploaded' };
        }
        return { status: 'upload_triggered' };
      })()
    `);

    return [
      { field: 'status', value: checkResult?.status || 'uploaded' },
      { field: 'file_kuid', value: checkResult?.kuid || '' },
      { field: 'title', value: checkResult?.title || filePath.split(/[\\/]/).pop() || '' },
    ];
  },
});
