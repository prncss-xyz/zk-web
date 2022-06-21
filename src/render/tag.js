import * as zk from '../utils.js';
import * as templates from '../templates.js';
import config from '../config.js';

export async function render(tag) {
  const raw = await zk.zk([
    'list',
    '--tag',
    tag,
    '--format',
    '{{link}} {{title}}',
  ]);
  if (raw == '')
    throw Error({
      code: 'ERR_NO_TAG',
      message: `tag ${tag} does not exists`,
    });

  const items = [];
  for (const row of raw.split('\n')) {
    const res = row.match(/\[([^\[\]]+)\][^ ]* (.*)/);
    if (res) {
      let [, href, title] = res;
      href = config.notes + '/' + href;
      items.push({ href, title });
    }
  }

  return templates.tag({
    tag,
    items,
  });
}
