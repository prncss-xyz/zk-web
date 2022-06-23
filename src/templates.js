import Handlebars from 'handlebars';
import { h } from 'hastscript';
import { toHtml } from 'hast-util-to-html';
import * as utils from './utils.js';

// TODO: use hastscript
function translateTags(array) {
  console.log(array, Array.isArray(array));
  if (!Array.isArray(array)) return array;
  return array.map((tag) =>
    typeof tag === 'string' ? h('a', { href: utils.tag(tag).href }, tag) : tag,
  );
}

function td(value) {
  if (typeof value === 'string') return h('td.string', value);
  if (typeof value === 'number') return h('td.number', value);
  if (value instanceof Date) return h('td.string', String(value));
  return h('td.object', JSON.stringify(value));
}

Handlebars.registerHelper('meta', (obj) => {
  let res = [];
  for (const [key, value] of Object.entries(obj)) {
    let valueCell;
    if (key == 'tags') valueCell = h('td', translateTags(value));
    else if (key == 'keywords') valueCell = h('td', translateTags(value));
    else valueCell = td(value);
    res.push(h('tr', [h('td', key), valueCell]));
  }
  return toHtml(h('table', res));
});

export const note = Handlebars.compile(`<!doctype html>
<html>
<body>
  {{{meta data}}}
  <div id='nav-tags'>
    {{#each tags}}
      <a href={{href}}><div>{{name}}</div></a>
    {{/each}}
  </div>
{{{content}}}
  <div id='backlinks'>
    {{#each backlinks}}
      <a href="{{href}}"><div>{{title}}</div></a>
    {{/each}}
  </div>
</body>
</html> 
`);

export const list = Handlebars.compile(`<!doctype html>
<html>
<body>
  <div id='nav'>
    {{#with nav}}
    <a href="/tags">tags</a>
    <a href={{home}}>home</a>
    <a href={{up}}>up</a>
    <a href={{plain}}>plain</a> 
    {{#each views}}
      <a href={{href}}>{{name}}</a> 
    {{/each}}
    {{/with}}
    {{#each dirs}}
      <a href={{href}}>{{dir}}</a>
    {{/each}}
  </div>
  <h1>{{tag}}</h1>
  <div id='tag-list'>
  {{#each items}}
    <a href="{{href}}"><div>{{title}}</div></a>
  {{/each}}
  </div>
</body>
</html> 
`);

export const agenda = Handlebars.compile(`<!doctype html>
<html>
<body>
  <div id='nav'>
    {{#with nav}}
    <a href={{home}}>home</a>
    <a href={{up}}>up</a>
    {{#each alias}}
      <a href={{href}}>{{name}}</a> 
    {{/each}}
    {{/with}}
    {{#each dirs}}
      <a href={{href}}>{{dir}}</a>
    {{/each}}
  </div>
  <h1>{{tag}}</h1>
  <div id='tag-list'>
  {{#each events}}
  {{#with items}}
    <a href="{{href}}"><div>{{date}} {{field}}: {{title}}</div></a>
  {{/with}}
  {{/events}}
  </div>
</body>
</html> 
`);

export const board = Handlebars.compile(`<!doctype html>
<html>
<body>
  <h1>{{tag}}</h1>
  <div id='board'>
  {{#each columns}}
    <a class='column' href="{{tag.href}}"><div>{{tag.name}}</div></a>
    {{#each this.items}}
      <a class='item' href="{{href}}"><div>{{title}}</div></a>
    {{/each}}
  {{/each}}
  </div>
</body>
</html> 
`);

export const tags = Handlebars.compile(`<!doctype html>
<html>
<body>
  <div id='nav'>
  <a href="/list">list</a>
  </div>
  <h1>Tags</h1>
  <div id={{note-list}}>
  {{#each items}}
    <a href="{{href}}"><div>{{name}} ({{count}})</div></a>
  {{/each}}
  </div>
</body>
</html> 
`);
