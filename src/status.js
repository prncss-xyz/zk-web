import adjustMeta from './ajust-meta.js';

export async function status(id, name) {
  await adjustMeta(id, (meta) => {
    meta.status ??= [];
    meta.status.push({ name, date: new Date() });
  });
}
