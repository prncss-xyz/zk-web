import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { load } from 'js-yaml';
import { xdgConfig } from 'xdg-basedir';

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

console.log('config:', config);

export default config;
