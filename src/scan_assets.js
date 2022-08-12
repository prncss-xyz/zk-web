import path from 'node:path';
import fs from 'node:fs/promises';
import config from './config.js';
import { sql_escape, connect, exec, all, close } from './db.js';
import { getFiles } from './file-utils.js';

function isInside(parent, dir) {
  const relative = path.relative(parent, dir);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

export async function scanAssets() {
  const purgeDelai = config.purgeDelai * 1000 * 3600 * 24;
  const startTime = Date.now();
  await connect();
  await exec(
    `
      CREATE TABLE IF NOT EXISTS orphan_assets (
        id TEXT PRIMARY KEY NOT NULL,
        time REAL NOT NULL
      );
    `,
  );
  const indexed_assets = await all(
    `
      SELECT
        asset
      FROM 
        notes
      WHERE 
        asset IS NOT NULL;
    `,
  );
  const r = await all(
    `
      SELECT
        id, time
      FROM
        orphan_assets
    `,
  );

  const record_orphans = new Map();
  for (const { id, time } of r) {
    record_orphans.set(id, time);
  }

  const proms = [];
  const assetIndex = new Set();
  for (const asset of indexed_assets) {
    if (isInside('assets', asset.asset)) {
      assetIndex.add(asset.asset);
      if (record_orphans.has(asset.asset)) {
        proms.push(
          exec(
            `
              DELETE FROM orphan_assets
              WHERE id=${sql_escape(asset.asset)};
            `,
          ),
        );
        record_orphans.delete(asset.asset);
      }
    }
  }
  const base = config.notebookDir;
  const time = Date.now();
  for await (const filename of getFiles(base, 'assets')) {
    if (assetIndex.has(filename)) {
      assetIndex.delete(filename);
    } else {
      let delta;
      if (record_orphans.has(filename)) {
        delta = time - record_orphans.get(filename);
        if (delta >= purgeDelai) {
          console.log('deleting', filename);
          proms.push(fs.unlink(filename));
        }
      } else {
        delta = 0;
        proms.push(
          exec(
            `
              INSERT INTO orphan_assets (
                id,
                time
              )
              VALUES (
                ${sql_escape(filename)},
                ${sql_escape(time)}
              );
            `,
          ),
        );
      }
      console.log('orphan', filename, 'since', delta);
    }
  }
  for (const asset of assetIndex.keys()) {
    console.log('broken', asset);
  }
  await Promise.all(proms);
  const endTime = Date.now();
  console.log(`in ${endTime - startTime}`);
  await close();
}
