import * as utils from '../utils.js';
import * as templates from '../templates.js';

export async function render(tag) {
  const raw = await utils.zk(['tag', 'list']);

  const items = [];
  for (const row of raw.split('\n')) {
    const res = row.match(/(\S+) \((.+)\)/);
    if (res) {
      let [, name, count] = res;
      const href = encodeURI('/list?args=--tag+' + name);
      items.push({ href, name, count });
    }
  }

  return templates.tags({
    items,
  });
}
