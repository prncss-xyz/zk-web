import { connect, get } from './db.js';

export default async function query(id) {
  await connect();
  console.log(id);
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
  return { id, title, date, asset, tags, backlinks };
}
