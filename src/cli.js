#!/usr/bin/env node

import { program } from 'commander';
import { render } from './render/note.js';
import serve from './serve.js';

program.command('html <link>').action(async (link) => {
  const raw = await render(link);
  console.log(raw);
});
program.command('serve').action(() => serve());
program.parseAsync(process.argv);
