import Koa from 'koa';
import Router from '@koa/router';
import koaStatic from 'koa-static';

import mount from 'koa-mount';
import config from './config.js';
import { render } from './render.js';
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
    const html = await render(link);
    ctx.type = 'text/html';
    ctx.body = html;
  } catch (e) {
    // TODO: 404
  }
});

const router = new Router();
router.get('/stop', (ctx) => {
  ctx.type = 'text/plain';
  ctx.body = 'bye!';
  setImmediate(() => {
    process.exit(0);
  });
});

const app = new Koa();
app
  .use(logger)
  .use(onlyLocal)
  .use(mount(config.notes, notes.routes()))
  .use(mount('/api', router.routes()))
  .use(mount('/assets', koaStatic(resolve(config.dir, 'assets'))))
  .use(mount('/assets', koaStatic(resolve(process.env.HOME, config.assets))))
  .use(router.allowedMethods());

export default function serve() {
  app.listen(config.port);
  console.log(`You can access our notes at http://localhost:${config.port}/`);
}
