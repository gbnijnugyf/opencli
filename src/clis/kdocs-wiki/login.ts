import { cli, Strategy } from '../../registry.js';
import type { IPage } from '../../types.js';

cli({
  site: 'kdocs-wiki',
  name: 'login',
  description: '登录金山文档（在浏览器中完成登录，验证 Cookie）',
  domain: 'www.kdocs.cn',
  strategy: Strategy.COOKIE,
  browser: true,
  navigateBefore: false,
  args: [],
  columns: ['field', 'value'],
  func: async (page: IPage) => {
    await page.goto('https://www.kdocs.cn/wiki/pers/aidocs/home');

    // Wait up to 30s for login to complete (page may redirect to login page)
    for (let i = 0; i < 15; i++) {
      await page.wait(2);
      const url = await page.evaluate(`(() => window.location.href)()`);
      if (url && url.includes('/wiki/') && !url.includes('account.wps.cn')) break;
    }

    // Verify by checking cookies and making a lightweight API call
    const cookies = await page.getCookies({ domain: 'kdocs.cn' });
    const csrf = cookies.find(c => c.name === 'csrf')?.value;
    const uid = cookies.find(c => c.name === 'uid')?.value;

    if (!csrf) {
      return [
        { field: 'status', value: 'not_logged_in' },
        { field: 'hint', value: '请在弹出的浏览器窗口中完成登录，然后重新运行此命令' },
      ];
    }

    // Verify session with a real API call
    const result = await page.evaluate(`
      (async () => {
        try {
          const resp = await fetch('/wiki/api/km/space/list?classify=all&page_size=1', {
            credentials: 'include'
          });
          const data = await resp.json();
          return { ok: data.code === 0, count: data.data?.list?.length ?? 0 };
        } catch { return { ok: false }; }
      })()
    `);

    if (!result?.ok) {
      return [
        { field: 'status', value: 'session_expired' },
        { field: 'uid', value: uid || '' },
        { field: 'hint', value: 'Cookie 存在但 API 调用失败，请重新登录' },
      ];
    }

    return [
      { field: 'status', value: 'logged_in' },
      { field: 'uid', value: uid || '' },
      { field: 'csrf', value: csrf.slice(0, 8) + '...' },
    ];
  },
});
