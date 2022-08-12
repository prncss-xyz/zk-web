import { connect, get, all } from './db.js';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import { visit } from 'unist-util-visit';

// PERF: fetch in one query
async function processBacklinks(backlinks) {
  for (const backlink of backlinks) {
    const hast = fromHtml(backlink.context, { fragment: true });
    const backlinkRefs = [];
    const toChange = [];
    visit(hast, 'element', (node) => {
      if (
        node.tagName === 'a' &&
        node?.properties.className?.includes('internal')
      ) {
        backlinkRefs.push(node.properties.href);
        toChange.push(node);
      }
    });
    backlinkRefs.sort();
    for (let i = 0; i < backlinkRefs.length - 1; ) {
      if (backlinkRefs[i] === backlinkRefs[1] + 1) {
        backlinkRefs.splice(i, 1);
      } else i++;
    }
    const links = await all(
      `
      SELECT
        id, 
      title
      FROM 
        notes
      WHERE 
        id IN (?);
    `,
      backlinkRefs,
    );
    const refs = {};
    for (const link of links) {
      refs[link.id] = link.title;
    }
    for (const node of toChange) {
      const value = refs[node.properties.href];
      node.tagName = 'div';
      node.children = [{ type: 'text', value }];
    }
    backlink.context = toHtml(hast);
  }
}

export default async function query(id) {
  await connect();
  let res;
  res = await get(
    `
    SELECT title, date, asset
    FROM notes
    WHERE id = ?
    LIMIT 1
    `,
    id,
  );
  if (!res) return null;
  const { title, date, asset } = res;
  res = await all(
    `
    SELECT tag
    FROM tags
    WHERE source = ?
    `,
    id,
  );
  const tags = res.map(({ tag }) => tag);
  const links = await all(
    `
    SELECT id, title
    FROM notes
    WHERE id IN (
      SELECT
        target
      FROM links
      WHERE source = ?
    );
    `,
    id,
  );
  const backlinks = await all(
    `
    SELECT
      source,
      start_line,
      start_column,
      start_offset,
      end_line,
      end_column,
      end_offset,
      context
    FROM links
    WHERE target = ?
    `,
    id,
  );
  await processBacklinks(backlinks);

  return { id, title, date, asset, tags, links, backlinks };
}
