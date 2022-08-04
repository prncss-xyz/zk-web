import { spawn } from 'node:child_process';

export function zk(args) {
  let stdout = '';
  let stderr = '';
  return new Promise((resolve, reject) => {
    const ls = spawn('zk', args);

    ls.stdout.on('data', (data) => {
      stdout += data;
    });

    ls.stderr.on('data', (data) => {
      stderr += data;
    });

    ls.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject({
          code: 'ERR_ZK',
          no: code,
          message: stderr,
        });
      }
    });
  });
}

export function tag(name) {
  return {
    name,
    href: encodeURI('/list?args=--tag+' + name),
  };
}

export function groupBy(field, items) {
  const res = {};
  for (const item of items) {
    if (field in item) {
      const key = item[field];
      res[key] ??= [];
      res[key].push(item);
    }
  }
  return res;
}

export function isSubtag(long, short) {
  if (long === short) return true;
  if (long.startsWith(short + '/')) return true;
  return false;
}
