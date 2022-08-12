import fs from 'node:fs/promises';
import path from 'node:path';
import config from './config.js';
import matter from 'gray-matter';
import yaml from "js-yaml";

export default async function adjustMeta(id, cb) {
  const absPath = path.resolve(config.notebookDir, id);
  let rawIn;
  try {
    rawIn = await fs.readFile(absPath, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`file ${id} does not exist`);
      process.exit(1);
    } else throw error;
  }

  const { content, data } = matter(rawIn);
  await cb(data);
  let rawOut = '---\n';
  rawOut += yaml.dump(data);
  rawOut += '---\n';
  rawOut += content;
  await fs.writeFile(absPath, rawOut);
}
