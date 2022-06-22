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
  // TODO: query only what is needed
  const cmdArgs = [
    'list',
    '--format',
    '{{link}}\t{{title}}\t{{tags}}\t{{metadata}}',
    args,
  ].flat();

  let up;
  let queryString = query.toString();
  if (queryString !== '') queryString = '?' + queryString;
  if (path !== '') {
    const ndx = path.lastIndexOf('/');
    if (ndx) {
      up = '/list/' + path.slice(1, ndx) + queryString;
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
    console.log(tags);
    console.log(columns);
    return templates.board({
      nav,
      dirs,
      path,
      path,
      columns,
    });
  }

  // FIXME: won't work without LSP interface
  if (query.get('view') === 'agenda') {
    const fields = query.get('fields').split(' ');
    const events = [];
    for (const field of fields) {
      for (const item of items) {
        console.log(item.metadata, field);
        const value = item.metadata?.[field];
        if (value) {
          console.log('!!', field, value);
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
    console.log(events);
    return templates.agenda({
      nav,
      dirs,
      path,
      events,
    });
  }

  return templates.list({
    nav,
    dirs,
    path,
    items,
  });
}
