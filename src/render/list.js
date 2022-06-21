import * as zk from '../utils.js';
import * as templates from '../templates.js';

export async function render(path, query) {
  const args = query.get('args').split(' ');
  const cmdArgs = ['list', '--format', '{{link}} {{title}}', args].flat();
  if (path.length > 0) {
    cmdArgs.push(path);
  }
  console.log('zk', cmdArgs);
  const raw = await zk.zk(cmdArgs);
  if (raw == '')
    throw {
      code: 'ERR_NO_LIST',
      message: `list ${path} is empty`,
    };

  // TODO: views

  const items = [];
  for (const row of raw.split('\n')) {
    const res = row.match(/\[([^\[\]]+)\][^ ]* (.*)/);
    if (res) {
      let [, href, title] = res;
      href = encodeURI('/note/' + href);
      items.push({ href, title });
    }
  }

  return templates.list({
    path,
    items,
  });
}