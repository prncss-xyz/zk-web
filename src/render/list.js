import * as utils from '../utils.js';
import * as templates from '../templates.js';
import config from '../config.js';

export async function render(path, query) {
  let args = query.get('args') || '';

  if (args) args = args.trim().split(' ');
  else args = [];
  // TODO: query only what is needed
  const cmdArgs = [
    'list',
    '--format',
    '{{link}}\t{{title}}\t{{tags}}\t{{metadata}}',
    args,
  ].flat();

  if (path[0] === '/') path = path.slice(1);

  let up;
  let queryString = query.toString();
  if (queryString !== '') queryString = '?' + queryString;
  if (path !== '') {
    const ndx = path.lastIndexOf('/');
    if (ndx) {
      up = '/list/' + path.slice(1, ndx) + queryString;
    } else {
      up = '/list/' + queryString;
    }
  }
  const plain = '/list/' + path;

  const views = [];
  for (const [name, value] of Object.entries(config.views || {})) {
    let queryNav = new URLSearchParams(query.toString());
    for (let [k, v] of Object.entries(value)) {
      if (typeof v === 'object') {
        v = v.join(' ');
      }
      queryNav.set(k, v);
    }
    const href = '/list/' + path + '?' + queryNav.toString();
    views.push({
      name,
      href,
    });
  }

  const nav = {
    path,
    href: '/list/' + path + queryString,
    home: '/list/' + queryString,
    up,
    plain,
    views,
  };

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

  const items = [];
  for (const row of raw.split('\n')) {
    if (row === '') continue;
    let [path, title, tags, metadata] = row.split('\t');
    [, path] = row.match(/\[([^\[\]]+)\]/);
    let href = encodeURI('/note/' + path);
    items.push({ href, path, title, tags, metadata });
  }

  const dirs = [];
  for (const item of items) {
    const ndx = item.path.lastIndexOf('/');
    const dir = item.path.slice(0, ndx);
    const dir_ = dirs.find((d) => d.dir == dir);
    if (dir_) {
      dir_.count++;
    } else {
      dirs.push({ dir, count: 1, href: '/list/' + dir });
    }
  }

  if (query.get('view') === 'board') {
    const columns = [];
    const tags = query.get('tags').split(' ');
    for (const tag of tags) {
      const res = [];
      for (const item of items) {
        if (item.tags.indexOf(tag) !== -1) {
          res.push(item);
        }
      }
      columns.push({ tag: utils.tag(tag), items: res });
    }
    return templates.board({
      nav,
      dirs,
      path: path || '~',
      columns,
    });
  }

  // NOTE: currently not in use, will need LSP API
  if (false && query.get('view') === 'agenda') {
    const fields = query.get('fields').split(' ');
    const events = [];
    for (const field of fields) {
      for (const item of items) {
        const value = item.metadata?.[field];
        if (value) {
          const date = Number(new Date(value));
          if (date) {
            events.push({
              item,
              date,
              value,
              field,
            });
          }
        }
      }
    }
    events.sort((a, b) => a.date - b.date);
    return templates.agenda({
      nav,
      dirs,
      path: path || '~',
      events,
    });
  }

  return templates.list({
    nav,
    dirs,
    path: path || '~',
    items,
  });
}
