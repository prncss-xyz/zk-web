import Koa from 'koa';
import Router from '@koa/router';
import koaStatic from 'koa-static';
import mount from 'koa-mount';
import config from './config.js';
import { render as renderNote } from './render/note.js';
import { render as renderList } from './render/list.js';
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

const api = new Router();
api.get('/stop', (ctx) => {
  ctx.type = 'text/plain';
  ctx.body = 'bye!';
  setImmediate(() => {
    process.exit(0);
  });
});

const index = new Router();
index.get('/tags', async (ctx) => {
  const body = await renderTags();
  ctx.type = 'text/html';
  ctx.body = body;
});
index.get('/list(/)?(.*)', async (ctx) => {
  const url = decodeURI(ctx.url.slice('/list'.length));
  let link, query;
  let qIndex = url.indexOf('?');
  if (qIndex === -1) {
    link = url;
    query = new URLSearchParams('');
  } else {
    link = url.slice(1, qIndex);
    query = new URLSearchParams(url.slice(qIndex + 1));
    if (query.get('alias')) {
      query = config.alias?.[query.get('alias')];
      if (!query) {
        console.log(`unkdown alias: ${query.get('alias')}`);
        return;
      }
    }
  }
  try {
    const body = await renderList(link, query);
    ctx.type = 'text/html';
    ctx.body = body;
  } catch (e) {
    console.log(e);
    if (e.code !== 'ERR_NO_LIST') {
      throw e;
    }
  }
});

index.get('/note/(.+)', async (ctx) => {
  const link = decodeURI(ctx.url.slice('/note/'.length));
  console.log('--', link);
  try {
    const body = await renderNote(link);
    ctx.type = 'text/html';
    ctx.body = body;
  } catch (e) {
    if (e.code !== 'ERR_NO_NOTE') {
      throw e;
    }
  }
});

const app = new Koa();
app
  .use(logger)
  .use(onlyLocal)
  .use(index.routes())
  .use(mount('/api', api.routes()))
  .use(mount('/assets', koaStatic(resolve(config.dir, 'assets'))))
  .use(mount('/assets', koaStatic(resolve(process.env.HOME, config.assets))))
  .use(api.allowedMethods());

export default function serve() {
  app.listen(config.port);
  console.log(`You can access our notes at http://localhost:${config.port}/`);
}
