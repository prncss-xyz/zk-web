import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export function join(a, b) {
  if (a && b) {
    return path.join(a, b);
  }
  if (a) {
    return a;
  }
  return b;
}

export async function* getFiles(dir, dir0) {
  const entries = await fs.readdir(join(dir, dir0), {
    withFileTypes: true,
  });
  for (const file of entries) {
    if (file.name.startsWith('.')) continue;
    if (file.isDirectory()) {
      yield* getFiles(dir, join(dir0, file.name));
    } else {
      yield join(dir0, file.name);
    }
  }
}

export function getChecksum(raw) {
  return crypto.createHash('md5').update(raw, 'utf8').digest('hex');
}
