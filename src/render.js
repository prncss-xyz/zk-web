import * as zk from './utils.js';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import breaks from 'remark-breaks';
import wikiLink from 'remark-wiki-link';
import emoji from 'remark-emoji';
import gfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import rehypeFormat from 'rehype-format';
import { visit } from 'unist-util-visit';
import config from './config.js';
import * as templates from './templates.js';

function transform() {
  return async function (tree) {
    const nodes = [];
    visit(tree, 'wikiLink', (node) => {
      nodes.push(node);
    });
    for (const node of nodes) {
      const value = node.value;
      let alias = node.data?.alias;
      if (value == alias) {
        alias = await fetchTitle(value);
      }
      node.data.hProperties.className = 'internal';
      node.data.hProperties.href = config.notes + '/' + value;
      node.data.hChildren = [{ type: 'text', value: alias }];
    }
  };
}

const processor = unified()
  .use(remarkParse)
  .use(transform)
  .use(wikiLink)
  .use(breaks)
  .use(emoji)
  .use(gfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)
  .use(rehypeFormat);

async function fetchBacklinks(link) {
  const raw = await zk.zk(['list', '--link-to', link, '--format', '{{link}}']);
  const res = [];
  for (const [, link] of raw.matchAll(/\[([^\[\]]+)\]/g)) {
    const title = await fetchTitle(link);
    const href = config.notes + '/' + link;
    res.push({ href, title });
  }
  return res;
}

async function fetchTitle(link) {
  let title = await zk.zk(['list', link, '--format', '{{title}}']);
  title = title.trim();
  if (title == '') title = link;
  return title;
}

export async function render(link) {
  const raw = await zk.zk(['list', '--format', '{{raw-content}}', link]);
  if (raw == '') throw Error('link does not exists');
  const { data, content: contentMd } = matter(raw);
  const contentAST = await processor.process(contentMd);
  const content = String(contentAST);
  const backlinks = await fetchBacklinks(link);
  const tags = data.tags ?? [];
  const record = {
    data,
    content,
    backlinks,
    tags,
  };
  return templates.notes(record);
}
