import * as zk from '../utils.js';
import * as templates from '../templates.js';

export async function render(tag) {
  const raw = await zk.zk(['tag', 'list']);

  const items = [];
  for (const row of raw.split('\n')) {
    const res = row.match(/(\S+) \((.+)\)/);
    if (res) {
      let [, tag, count] = res;
      const href = '/tags/' + tag;
      items.push({ href, tag, count });
    }
  }

  return templates.tags({
    items,
  });
}
