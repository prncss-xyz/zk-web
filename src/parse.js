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
import flatMap from 'unist-util-flatmap';
import { toHtml } from 'hast-util-to-html';
import { toText } from 'hast-util-to-text';
import { remove } from 'unist-util-remove';
import pkg from 'words-count';
const { wordsCount } = pkg;

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
        if (ancestor.tagName === 'p' && ancestor.type === 'element') {
          // replaces the link node with a dummy <this></this> element
          const contextAST = flatMap(ancestor, (node_) => {
            if (node === node_) {
              return [
                {
                  type: 'element',
                  tagName: 'this',
                },
              ];
            }
            return [node_];
          });
          context = toHtml(contextAST);
          break;
        }
      }
      links.push({
        context,
        href: node.properties.href.slice(7),
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
  const wc = wordsCount(rawText) + links.length;
  return { title, links, rawText, wc };
}

function spit() {
  this.Compiler = analyse;
}

const processor = unified()
  .use(remarkParse)
  .use(wikiLink)
  .use(breaks)
  .use(emoji)
  .use(gfm)
  .use(smartyPants)
  .use(removeComments)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(spit);

const source = process.env.ZK_NOTEBOOK_DIR;
const ext = '.md';

export default async function parse(id) {
  const absPath = source + id + ext;
  id = id.slice(1);
  let raw;
  try {
    raw = await fs.readFile(absPath, 'utf-8');
  } catch (error) {
    if (error.code !== 'ENOENT') return;
    else throw error;
  }
  const { data, content: contentMd, matter: rawMatter } = matter(raw);
  const lines = (rawMatter.match(/\n/g) || '').length + 1;
  const offset = rawMatter.length;
  // correct position with frontmatter
  const { result } = await processor.process(contentMd);
  for (const link of result.links) {
    link.position.start.line += lines;
    link.position.start.offset += offset;
    link.position.end.line += lines;
    link.position.end.offset += offset;
  }
  return {
    id,
    meta: data,
    absPath,
    ...result,
  };
}
