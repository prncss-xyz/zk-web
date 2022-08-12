import fs from 'node:fs/promises';
import config from './config.js';
import { parse } from './parse.js';
import { sql_escape, connect, exec, all, close } from './db.js';
import { join, getFiles, getChecksum } from './file-utils.js';

let updateCount;

function updateNote(obj) {
  const entries = Object.entries(obj);
  return `
  INSERT OR REPLACE INTO notes (${entries.map(([key]) => key).join(',')})
  VALUES (${entries.map(([_, value]) => sql_escape(value)).join(',')});
  DELETE FROM links
  WHERE source=${sql_escape(obj.id)};
  DELETE FROM tags
  WHERE source=${sql_escape(obj.id)};
  `;
}

async function scanFile_(noteIndex, base, id) {
  const { ctimeMs, birthtime } = await fs.stat(join(base, id));
  const note = noteIndex.get(id);
  if (note?.ctimeMs === ctimeMs) return;
  const raw = await fs.readFile(join(base, id), 'utf-8');
  const checksum = getChecksum(raw);
  if (note?.checksum === checksum) return;
  console.log('updating ' + id);
  updateCount++;
  let transaction = 'BEGIN TRANSACTION;\n';
  const { title, meta, links, wordcount } = await parse(raw);
  transaction += updateNote({
    id,
    ctimeMs,
    checksum,
    title,
    date: meta.date ?? birthtime,
    asset: meta.asset,
    wordcount,
  });
  for (const link of links) {
    transaction += `
      INSERT INTO links (
        target,
        source,
        start_line,
        start_column,
        start_offset,
        end_line, 
        end_column,
        end_offset,
        context
      )
      VALUES (
        ${sql_escape(link.href)},
        ${sql_escape(id)},
        ${link.position.start.line},
        ${link.position.start.column},
        ${link.position.start.offset},
        ${link.position.end.line},
        ${link.position.end.column},
        ${link.position.end.offset},
        ${sql_escape(link.context)}
      );
    `;
  }
  for (const tag of meta.tags || []) {
    transaction += `
        INSERT INTO tags (
          source,
          tag
        )
        VALUES (
          ${sql_escape(id)},
          ${sql_escape(tag)}
        );
        `;
  }
  transaction += 'COMMIT;\n';
  await exec(transaction);
}

async function scanFile(noteIndex, base, filename) {
  await scanFile_(noteIndex, base, filename);
  noteIndex.delete(filename);
}

export async function scanDir() {
  updateCount = 0;
  const startTime = Date.now();
  await connect();
  await exec(
    `
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY NOT NULL,
      ctimeMs REAL NOT NULL,
      checksum TEXT NOT NULL,
      title TEXT,
      date TEXT,
      asset TEXT,
      wordcount INTEGER
    );
    CREATE TABLE IF NOT EXISTS links (
      target TEXT,
      source TEXT,
      start_line INTEGER,
      start_column INTEGER,
      start_offset INTEGER,
      end_line INTEGER,
      end_column INTEGER,
      end_offset INTEGER,
      context TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_source_links
    ON links (source);
    CREATE TABLE IF NOT EXISTS tags (
      source TEXT,
      tag TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_source_tags
    ON tags (source);
  `,
  );
  const notes = await all(
    `
    SELECT id, ctimeMs, checksum
    FROM notes;
    `,
  );
  const noteIndex = new Map();
  for (const note of notes) {
    if (!note.id) console.log(note);
    noteIndex.set(note.id, note);
  }
  let proms = [];
  const base = config.notebookDir;
  for await (const filename of getFiles(base)) {
    if (filename.endsWith(config.noteExtension)) {
      proms.push(scanFile(noteIndex, base, filename));
    }
  }
  await Promise.all(proms);
  const deleteCount = 0;
  for (const note of noteIndex.values()) {
    console.log('removing ' + note.id);
    ++deleteCount;
    proms.push(
      exec(
        `
        BEGIN TRANSACTION;
        DELETE FROM notes
        WHERE id=${sql_escape(note.id)};
        DELETE FROM links
        WHERE source=${sql_escape(note.id)};
        DELETE FROM tags
        WHERE source=${sql_escape(note.id)};
        COMMIT;
        `,
      ),
    );
  }
  await Promise.all(proms);
  const endTime = Date.now();
  proms = [];
  console.log(`updated ${updateCount}`);
  console.log(`deleted ${deleteCount}`);
  console.log(`in ${endTime - startTime}`);
  await close();
}
