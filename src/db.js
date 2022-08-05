import sqlite3 from 'sqlite3';
import config from './config.js';
import fs from 'node:fs/promises';

let db;

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

// single-quote escape for sql
export function sql_escape(value) {
  if (value === null) return 'NULL';
  if (value === undefined) return 'NULL';
  if (typeof value === 'number') {
    return value;
  }
  return "'" + String(value).replace(/\'/g, "''") + "'";
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
