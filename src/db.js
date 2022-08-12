import sqlite3 from 'sqlite3';
import config from './config.js';
import fs from 'node:fs/promises';
import { snakeCase } from 'change-case';

let db;

export async function clear() {
  try {
    await fs.rm(config.dbFile);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    console.error(`db file ${config.dbFile} do not exist`);
    process.exit(1);
  }
}

// TODO: check database version and reset if needed
function create(filename) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filename, (err) => {
      if (err) {
        console.error(query);
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

export async function connect() {
  if (db) return;
  await fs.mkdir(config.dbDir, { recursive: true });
  db = await create(config.dbFile);
}

export async function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve(err);
    });
  });
}

// pascal double-quote escape
// escape sql identifiers
export function escape_id(value) {
  return '"' + String(value).replace(/\"/g, '""') + '"';
}

// pascal single-quote escape
function escape_single(str) {
  return "'" + str.replace(/\'/g, "''") + "'";
}

// escape sql values
export function escape_value(value) {
  if (value === null) return 'NULL';
  if (value === undefined) return 'NULL';
  if (value instanceof Date) return escape_single(value.toISOString());
  if (typeof value === 'string') {
    return escape_single(value);
  }
  if (typeof value === 'number') {
    return value;
  }
  return escape_single(JSON.stringify(value));
}

export function insertStr(table, obj) {
  const keys = [];
  const values = [];
  for (const [key, value] of Object.entries(obj)) {
    keys.push(escape_id(snakeCase(key)));
    values.push(escape_value(value));
  }
  if (keys.length === 0) return '';
  return `
    INSERT OR REPLACE INTO ${table} (${keys.join(', ')})
    VALUES (${values.join(', ')});
  `;
}

export function exec(query) {
  return new Promise((resolve, reject) => {
    db.exec(query, (err) => {
      if (err) {
        console.error(query);
        reject(err);
      } else resolve();
    });
  });
}

export function run(query, ...params) {
  return new Promise((resolve, reject) => {
    db.run(query, ...params, (err) => {
      if (err) {
        console.error(query);
        reject(err);
      } else resolve();
    });
  });
}

export function get(query, ...params) {
  return new Promise((resolve, reject) => {
    db.get(query, ...params, (err, row) => {
      if (err) {
        console.error(query);
        reject(err);
      } else resolve(row);
    });
  });
}

export function all(query, ...params) {
  return new Promise((resolve, reject) => {
    db.all(query, ...params, (err, rows) => {
      if (err) {
        console.error(query);
        reject(err);
      } else resolve(rows);
    });
  });
}
