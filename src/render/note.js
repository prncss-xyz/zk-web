import matter from 'gray-matter';
import rehypeFormat from 'rehype-format';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import breaks from 'remark-breaks';
import emoji from 'remark-emoji';
import gfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import removeComments from 'remark-remove-comments';
import smartyPants from 'remark-smartypants';
import wikiLink from 'remark-wiki-link';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import * as templates from '../templates.js';
import * as utils from '../utils.js';

function transform() {
  return async function (tree) {
    const once = new Set();
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
      node.data.hProperties.href = encodeURI('/note/' + value);
      // we don't want two elements with same id on one page
      if (!once.has(value)) {
        node.data.hProperties.id = encodeURI(value);
        once.add(value);
      }
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
  .use(smartyPants)
  .use(removeComments)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)
  .use(rehypeFormat);

async function fetchBacklinks(link) {
  const raw = await utils.zk([
    'list',
    '--link-to',
    link,
    '--format',
    '{{link}}',
  ]);
  const res = [];
  for (const [, link_] of raw.matchAll(/\[([^\[\]]+)\]/g)) {
    const title = await fetchTitle(link_);
    const href = encodeURI('/note/' + link_ + '#' + link);
    res.push({ href, title });
  }
  return res;
}

async function fetchTitle(link) {
  let title = await utils.zk(['list', link, '--format', '{{title}}']);
  title = title.trim();
  if (title == '') title = link;
  return title;
}

export async function render(link) {
  const raw = await utils.zk(['list', '--format', '{{raw-content}}', link]);
  if (raw == '')
    throw {
      code: 'ERR_NO_NOTE',
      message: `note ${link} does not exists`,
    };
  const { data, content: contentMd } = matter(raw);
  const contentAST = await processor.process(contentMd);
  const content = String(contentAST);
  const backlinks = await fetchBacklinks(link);
  // TODO: test if value is string
  const record = {
    data,
    content,
    backlinks,
  };
  return templates.note(record);
}
