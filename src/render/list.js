import * as utils from '../utils.js';
import * as templates from '../templates.js';
import config from '../config.js';

export async function render(path, query) {
  let args = query.get('args') || '';
  if (query.get('alias')) {
    const alias = config.alias[query.get('alias')];
    if (!alias) {
      throw {
        code: 'ERR_NO_ALIAS',
        message: `alias ${query.get('alias')} do not exist`,
      };
    }
    args = alias + ' ' + args;
  }

  if (args) args = args.trim().split(' ');
  else args = [];
  const cmdArgs = [
    'list',
    '--format',
    '{{link}}\t{{title}}\t{{tags}}',
    args,
  ].flat();

  let up;
  let queryString = query.toString();
  if (queryString !== '') queryString = '?' + queryString;
  if (path !== '') {
    const ndx = path.match(/[^\/]*$/).index;
    if (ndx) {
      up = path.slice(1, ndx) + queryString;
    }
  }

  const alias = Object.entries(config.alias).map(([name, value]) => {
    let queryNav = new URLSearchParams(query.toString());
    queryNav.set('alias', name);
    const href = '/list' + path + '?' + queryNav.toString();
    return {
      name,
      href,
    };
  });
  let queryNav = new URLSearchParams(query.toString());
  queryNav.delete('alias');
  let str = queryNav.toString();
  if (str !== '') str = '?' + str;
  const href = '/list' + path + str;
  alias.splice(0, 0, {
    name: 'plain',
    href,
  });

  const nav = {
    href: '/list' + path + queryString,
    home: '/list' + queryString,
    up,
    alias,
  };
  console.log(nav);

  if (path.length > 0) {
    cmdArgs.push(path.slice(1));
  }

  console.log('zk', cmdArgs);
  const raw = await utils.zk(cmdArgs);
  if (raw == '')
    throw {
      code: 'ERR_NO_LIST',
      message: `list ${path} is empty`,
    };

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
      columns.push({ tag: utils.tag(tag), items: items_ });
    }
    return templates.board({
      path,
      columns,
    });
  }

  return templates.list({
    nav,
    path,
    items,
  });
}
