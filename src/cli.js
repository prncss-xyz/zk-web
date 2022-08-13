#!/usr/bin/env node

import { program } from 'commander';
import { render } from './render/note.js';
import { scanDir } from './scan.js';
import { scanAssets } from './scan_assets.js';
import { clear } from './db.js';
import { status } from './status.js';
import serve from './serve.js';

program.command('html <link>').action(async (link) => {
  const raw = await render(link);
  console.log(raw);
});
program.command('serve').action(serve);
program.command('scan').action(scanDir);
program.command('scan-assets').action(scanAssets);
program.command('clear-db').action(clear);
program.command('status <note> <status>').action(status);

program.parseAsync(process.argv);
