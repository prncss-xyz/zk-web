import fs from 'node:fs/promises';
import matter from 'gray-matter';
import rehypeRaw from 'rehype-raw';
import breaks from 'remark-breaks';
import emoji from 'remark-emoji';
import gfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import removeComments from 'remark-remove-comments';
import smartyPants from 'remark-smartypants';
import wikiLink from 'remark-wiki-link';
import { unified } from 'unified';
import { visitParents } from 'unist-util-visit-parents';
import { toHtml } from 'hast-util-to-html';
import { toText } from 'hast-util-to-text';
import { remove } from 'unist-util-remove';
import { visit } from 'unist-util-visit';
import pkg from 'words-count';
const { wordsCount } = pkg;
import config from './config.js';
const { notebookDir, noteExtension } = config;

function transform() {
  return async function (tree) {
    visit(tree, 'wikiLink', (node) => {
      node.data.hProperties.className = 'internal';
      node.data.hProperties.href = node.data.alias + config.noteExtension;
      node.data.hChildren = [];
    });
  };
}

// TODO: assets
function analyse(tree) {
  const links = [];
  let title;
  visitParents(tree, 'element', function (node, ancestors) {
    if (node.tagName === 'h1') {
      title = toText(node);
      return;
    }
    if (
      node.tagName === 'a' &&
      node?.properties.className?.includes('internal')
    ) {
      let i = ancestors.length;
      let context;
      while (i > 0) {
        --i;
        const ancestor = ancestors[i];
        // finds the enclosing p
        if (
          (['p', 'li', 'dt', 'dd'].includes(ancestor.tagName) &&
            ancestor.type === 'element') ||
          i === 1
        ) {
          context = toHtml({
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['backlink'],
            },
            children: ancestor.children,
          });
          break;
        }
      }
      links.push({
        context,
        href: node.properties.href,
        position: node.position,
        title,
      });
      return;
    }
  });
  remove(
    tree,
    (node) =>
      node.tagName === 'a' && node?.properties.className?.includes('internal'),
  );
  const rawText = toText(tree);
  // wiki link titles arbitrarily count as one word
  const wordcount = wordsCount(rawText) + links.length;
  return { title, links, rawText, wordcount };
}

function spit() {
  this.Compiler = analyse;
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
  .use(spit);

export async function parseFromId(id) {
  const absPath = notebookDir + id + noteExtension;
  let raw;
  try {
    raw = await fs.readFile(absPath, 'utf-8');
  } catch (error) {
    if (error.code !== 'ENOENT') return;
    else throw error;
  }
  return parse(raw);

  // const id_ = id.slice(1);
  // id: id_,
  // path: id_ + note_extension,
}

export async function parse(raw) {
  const { data, content: contentMd, matter: rawMatter } = matter(raw);
  const { result } = await processor.process(contentMd);
  if (rawMatter) {
    const lines = (rawMatter.match(/\n/g) || '').length + 1;
    const offset = rawMatter.length;
    // correct position with frontmatter
    for (const link of result.links) {
      link.position.start.line += lines;
      link.position.start.offset += offset;
      link.position.end.line += lines;
      link.position.end.offset += offset;
    }
  }
  return {
    meta: data,
    ...result,
  };
}
