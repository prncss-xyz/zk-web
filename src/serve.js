import Koa from 'koa';
import Router from '@koa/router';
import koaStatic from 'koa-static';
import mount from 'koa-mount';
import config from './config.js';
import { render as renderNote } from './render/note.js';
import { render as renderTag } from './render/tag.js';
import { render as renderTags } from './render/tags.js';
import { resolve } from 'path';

async function logger(ctx, next) {
  console.log(ctx.method, ctx.url);
  await next();
}

async function onlyLocal(ctx, next) {
  if (ctx.ip === '::1' || ctx.ip === '::ffff:127.0.0.1') {
    await next();
  } else {
    message(`Denied access to ip $ ${ctx.ip}.`);
    ctx.status = 403;
    ctx.body = 'Access denied.';
  }
}

const notes = new Router();
notes.get('/(.+)', async (ctx) => {
  const link = ctx.url.slice(1);
  try {
    const html = await renderNote(link);
    ctx.type = 'text/html';
    ctx.body = html;
  } catch (e) {
    if (e.code !== 'ERR_NO_NOTE') {
      throw e;
    }
  }
});

const tags = new Router();
tags.get('/', async (ctx) => {
  const html = await renderTags();
  ctx.type = 'text/html';
  ctx.body = html;
});
tags.get('/(.+)', async (ctx) => {
  const link = ctx.url.slice(1);
  try {
    const html = await renderTag(link);
    ctx.type = 'text/html';
    ctx.body = html;
  } catch (e) {
    if (e.code !== 'ERR_NO_TAG') {
      throw e;
    }
  }
});

const api = new Router();
api.get('/stop', (ctx) => {
  ctx.type = 'text/plain';
  ctx.body = 'bye!';
  setImmediate(() => {
    process.exit(0);
  });
});

const index = new Router(); // without this app crashes on path '/'

const app = new Koa();
app
  .use(logger)
  .use(onlyLocal)
  .use(index.routes())
  .use(mount(config.notes, notes.routes()))
  .use(mount('/tags', tags.routes()))
  .use(mount('/api', api.routes()))
  .use(mount('/assets', koaStatic(resolve(config.dir, 'assets'))))
  .use(mount('/assets', koaStatic(resolve(process.env.HOME, config.assets))))
  .use(api.allowedMethods());

export default function serve() {
  app.listen(config.port);
  console.log(`You can access our notes at http://localhost:${config.port}/`);
}
