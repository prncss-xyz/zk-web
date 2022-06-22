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
        reject({ errno: code, message: stderr });
      }
    });
  });
}

export async function rawContent(link) {
  const raw = await zk(['list', '--format', '{{raw-content}}', link]);
  if (raw == '') throw Error('link does not exists');
  return raw;
}

export async function tags(link) {
  const raw = await zk(['list', '--format', '{{tags}}', link]);
  return raw;
}

export function tag(name) {
  return {
    name,
    href: encodeURI('/list/?args=--tag+' + name),
  };
}
