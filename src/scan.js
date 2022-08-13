import fs from 'node:fs/promises';
import config from './config.js';
import { parse } from './parse.js';
import { escape_value, connect, exec, all, close, insertStr } from './db.js';
import { join, getFiles, getChecksum } from './file-utils.js';

let updateCount;

async function scanFile_(noteIndex, base, id) {
  const { ctimeMs, birthtime } = await fs.stat(join(base, id));
  const note = noteIndex.get(id);
  if (note?.ctimeMs === ctimeMs) return;
  const raw = await fs.readFile(join(base, id), 'utf-8');
  const checksum = getChecksum(raw);
  if (note?.checksum === checksum) return;
  updateCount++;
  console.log('updating', id);
  let transaction = 'BEGIN TRANSACTION;\n';
  const parsed = await parse(raw, id);
  const noteEntry = {
    id,
    ctimeMs,
    checksum,
    date: birthtime,
    ...parsed.note,
  };
  transaction += insertStr('notes', noteEntry);
  transaction += `
  DELETE FROM links
  WHERE source=${escape_value(id)};
  `;
  for (const link of parsed.links) {
    transaction += insertStr('links', link);
  }
  transaction += `
  DELETE FROM tags
  WHERE source=${escape_value(id)};
  `;
  for (const tag of parsed.tags) {
    transaction += insertStr('tags', tag);
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
      ctime_ms REAL NOT NULL,
      checksum TEXT NOT NULL,
      title TEXT,
      date TEXT,
      asset TEXT,
      dued TEXT,
      status TEXT,
      word_count INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_status_notes
    ON notes (status);
    CREATE TABLE IF NOT EXISTS links (
      target TEXT,
      source TEXT,
      start_line INTEGER,
      start_column INTEGER,
      start_offset INTEGER,
      end_line INTEGER,
      end_column INTEGER,
      end_offset INTEGER,
      context TEXT,
      rank INTEGER
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
    SELECT id, ctime_ms, checksum
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
        WHERE id=${escape_value(note.id)};
        DELETE FROM links
        WHERE source=${escape_value(note.id)};
        DELETE FROM tags
        WHERE source=${escape_value(note.id)};
        COMMIT;
        `,
      ),
    );
  }
  await Promise.all(proms);
  const endTime = Date.now();
  console.log(`updated ${updateCount}`);
  console.log(`deleted ${deleteCount}`);
  console.log(`in ${endTime - startTime}`);
  await close();
}
