import * as utils from '../utils.js';
import * as templates from '../templates.js';

export async function render(path, query) {
  if (query.get('alias')) {
    const alias = config.alias?.[query.get('alias')];
    if (!query) {
      throw {
        code: 'ERR_NO_ALIAS',
        message: `alias ${query.get('alias')} do not exist`,
      };
    }
    query = new Map([...alias, ...query]);
  }

  const args = query.get('args').split(' ');
  const cmdArgs = [
    'list',
    '--format',
    '{{link}}\t{{title}}\t{{tags}}',
    args,
  ].flat();
  if (path.length > 0) {
    cmdArgs.push(path);
  }
  console.log('zk', cmdArgs);
  const raw = await utils.zk(cmdArgs);
  if (raw == '')
    throw {
      code: 'ERR_NO_LIST',
      message: `list ${path} is empty`,
    };

  // TODO: views

  const items = [];
  for (const row of raw.split('\n')) {
    if (row === '') continue;
    let [href, title, tags] = row.split('\t');
    [, href] = row.match(/\[([^\[\]]+)\]/);
    href = encodeURI('/note/' + href);
    items.push({ href, title, tags });
  }

  const columns = [];
  if (query.get('view') === 'board') {
    const tags = query.get('tags').split(' ');
    for (const tag of tags) {
      let items_ = [];
      for (const item of items) {
        if (item.tags.indexOf(tag) !== -1) {
          items_.push(item);
        }
      }
      console.log(items);
      columns.push({ tag: utils.tag(tag), items: items_ });
    }
    console.log(path, columns);
    return templates.board({
      path,
      columns,
    });
  }

  return templates.list({
    path,
    items,
  });
}
