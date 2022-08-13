import * as db from './db.js';

function toCalDateFull(str) {
  return str.slice(0, 19).replaceAll(/[-:]/g, '') + 'Z';
}

function toCalDateDay(str) {
  return str.slice(0, 10).replaceAll(/[-:]/g, '');
}

export default async function ical() {
  const events = await db.all(
    `
      SELECT
        id, 
        title,
        event_start,
        event_end,
        event_day,
        ctime_ms
      FROM 
        notes
      WHERE 
        event_start NOT NULL;
    `,
  );
  console.log(events);
  let core = '';
  core += 'BEGIN:VCALENDAR\n';
  core += 'VERSION:2.0\n';
  core += 'PRODID:zk-web\n';
  for (let {
    id,
    title,
    event_start,
    event_end,
    event_day,
    ctime_ms,
  } of events) {
    let start_str, end_str;
    if (event_day) {
      const date = new Date(event_end ?? event_start);
      date.setDate(date.getDate() + 1);
      event_end = date.toISOString();
      start_str = toCalDateDay(event_start);
      end_str = toCalDateDay(event_end);
    } else {
      if (!event_end) {
        const date = new Date(event_start);
        date.setHours(date.getHours() + 1);
        event_end = date.toISOString();
      }
      start_str = toCalDateFull(event_start);
      end_str = toCalDateFull(event_end);
    }
    ctime_ms = new Date(ctime_ms).toISOString();

    core += 'BEGIN:VEVENT\n';
    core += 'UID:' + JSON.stringify(id) + '\n';
    core += 'DTSTAMP:' + toCalDateFull(event_start) + '\n';
    core += 'DTSTART:' + start_str + '\n';
    core += 'DTEND:' + end_str + '\n';
    core += 'SUMMARY:' + JSON.stringify(title) + '\n';
    core += 'LAST-MODIFIED:' + toCalDateFull(ctime_ms) + '\n';
    core += 'END:VEVENT\n';
  }

  core += 'X-WR-CALNAME:zk-web\n';
  core += 'END:VCALENDAR\n';
  console.log(core);
  return core;
}
