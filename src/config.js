import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { load } from 'js-yaml';
import { xdgConfig, xdgData } from 'xdg-basedir';

const name = 'zk-web';

let config = {};
const dir = resolve(xdgConfig, name);
try {
  const raw = readFileSync(join(dir, 'config.yaml'), 'utf-8');
  config = load(raw);
} catch (err) {}

config.port ??= process.env.PORT ?? '3000';
config.notes ??= '/zk';
config.dir = dir;
config.alias ??= {};
config.notebookDir ??= process.env.ZK_NOTEBOOK_DIR;
config.noteExtension ??= '.md';
config.dbDir = join(xdgData, name);
config.dbFile = join(config.dbDir, 'db.db');

export default config;
