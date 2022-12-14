import Koa from 'koa';
import Router from '@koa/router';
import koaStatic from 'koa-static';
import mount from 'koa-mount';
import config from './config.js';
import { render as renderNote } from './render/note.js';
import { render as renderList } from './render/list.js';
import { render as renderTags } from './render/tags.js';
import { resolve } from 'path';
import { parseFromId } from './parse.js';
import query from './query.js';
import ical from './ical.js';
import * as db from './db.js';

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
api.get('/stop', async (ctx) => {
  ctx.type = 'text/plain';
  ctx.body = 'bye!';
  await db.close();
  setImmediate(() => {
    process.exit(0);
  });
});

const router = new Router();
router.get('/', (ctx) => ctx.redirect('/list'));
router.get('/tags', async (ctx) => {
  const body = await renderTags();
  ctx.type = 'text/html';
  ctx.body = body;
});
router.get('/list(/)?(.*)', async (ctx) => {
  const url = ctx.url.slice('/list'.length);
  // const url = decodeURI(ctx.url.slice('/list'.length));
  let link, query;
  let qIndex = url.indexOf('?');
  if (qIndex === -1) {
    link = url;
    query = new URLSearchParams('');
  } else {
    link = url.slice(0, qIndex);
    query = new URLSearchParams(url.slice(qIndex + 1));
  }
  if (link !== '/' && link.endsWith('/')) {
    link = link.slice(0, -1);
  }
  try {
    ctx.type = 'text/html';
    ctx.body = await renderList(link, query);
  } catch (e) {
    if (e.code === 'ERR_NO_LIST') {
      ctx.type = 'text/plain';
      ctx.body = e.message;
    } else throw e;
  }
});
router.get('/cal.ics(/)?', async (ctx) => {
  ctx.type = 'text/plain';
  ctx.body = await ical();
});

router.get('/note/(.+)', async (ctx) => {
  let link = decodeURI(ctx.url.slice('/note/'.length));
  if (link !== '/' && link.endsWith('/')) {
    link = link.slice(0, -1);
  }
  try {
    const body = await renderNote(link);
    ctx.type = 'text/html';
    ctx.body = body;
  } catch (e) {
    if (e.code === 'ERR_NO_ALIAS' || e.code === 'ERR_NO_NOTE') {
      ctx.type = 'text/plain';
      ctx.body = e.message;
    } else throw e;
  }
});

router.get('/parse/(.+)', async (ctx) => {
  let link = decodeURI(ctx.url.slice('/note/'.length));
  if (link !== '/' && link.endsWith('/')) {
    link = link.slice(0, -1);
  }
  try {
    const json = await parseFromId(link);
    ctx.type = 'application/json';
    ctx.body = JSON.stringify(json);
  } catch (e) {
    if (e.code === 'ERR_NO_ALIAS' || e.code === 'ERR_NO_NOTE') {
      ctx.type = 'text/plain';
      ctx.body = e.message;
    } else throw e;
  }
});

router.get('/query/(.+)', async (ctx) => {
  let link = decodeURI(ctx.url.slice('/note/'.length));
  if (link !== '/' && link.endsWith('/')) {
    link = link.slice(0, -1);
  }
  try {
    const json = await query(link.slice(1) + '.md');
    ctx.type = 'application/json';
    ctx.body = JSON.stringify(json);
  } catch (e) {
    if (e.code === 'ERR_NO_ALIAS' || e.code === 'ERR_NO_NOTE') {
      ctx.type = 'text/plain';
      ctx.body = e.message;
    } else throw e;
  }
});

const app = new Koa();
app
  .use(logger)
  .use(onlyLocal)
  .use(router.routes())
  .use(mount('/api', api.routes()))
  .use(mount('/assets', koaStatic(resolve(config.dir, 'assets'))))
  .use(mount('/assets', koaStatic(resolve(process.env.HOME, config.assets))))
  .use(api.allowedMethods());

db.connect();

export default function serve() {
  app.listen(config.port);
  console.log(`You can access our notes at http://localhost:${config.port}/`);
}
