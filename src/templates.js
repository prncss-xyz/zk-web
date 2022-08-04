import Handlebars from 'handlebars';
import { h } from 'hastscript';
import { toHtml } from 'hast-util-to-html';
import * as utils from './utils.js';

// TODO: use hastscript
function translateTags(array) {
  // console.log(array, Array.isArray(array));
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

// TODO: title and other metadatas
Handlebars.registerHelper('page', function (options) {
  return new Handlebars.SafeString(`<!doctype html><html>
  <head>
    <link rel="stylesheet" href="/assets/github-markdown.css">
    <link rel="stylesheet" href="/assets/stylesheet.css">
  </head>
  <body class="markdown-body">
    ${options.fn(this)}
  </body>
</html>`);
});

Handlebars.registerHelper('meta', function (obj) {
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

Handlebars.registerPartial(
  'listNav',
  `<div id='nav'>
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
  </div>`,
);

export const note = Handlebars.compile(`{{#page}}
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
{{/page}}`);

export const list = Handlebars.compile(`{{#page}}
  {{> listNav}}
  <h1>{{path}}</h1>
  <div id='tag-list'>
  {{#each items}}
    <a href="{{href}}"><div>{{title}}</div></a>
  {{/each}}
  </div>
{{/page}}`);

export const tags_ = Handlebars.compile(`{{#page}}
  {{> listNav}}
  <h1>{{path}}</h1>
  <div id="tags">
  {{#each columns}}
    <div class="column">
      <a class="column-title" href="{{tag.href}}"><div>{{tag.name}}</div></a>
      {{#each this.sections}}
        <div class="section">
          <a class="section-title" href="{{this.href}}"><div>{{this.dir}}</div></a>
          {{#each this.items}}
            <a class="item" href="{{href}}"><div>{{title}}</div></a>
          {{/each}}
        </div>
      {{/each}}
    </div>
  {{/each}}
  </div>
{{/page}}`);

export const board = Handlebars.compile(`{{#page}}
  {{> listNav}}
  <h1>{{path}}</h1>
  <div id="board">
  {{#each columns}}
    <div class="column">
      <a class="column-title" href="{{tag.href}}"><div>{{tag.name}}</div></a>
      {{#each this.sections}}
        <div class="section">
          <a class="section-title" href="{{this.href}}"><div>{{this.dir}}</div></a>
          {{#each this.items}}
            <a class="item" href="{{href}}"><div>{{title}}</div></a>
          {{/each}}
        </div>
      {{/each}}
    </div>
  {{/each}}
  </div>
{{/page}}`);

// NOTE: currently not in use, will need LSP API
export const agenda = Handlebars.compile(`{{#page}}
  {{> listNav}}
  <h1>{{path}}</h1>
  <div id='tag-list'>
  {{#each events}}
  {{#with items}}
    <a href="{{href}}"><div>{{date}} {{field}}: {{title}}</div></a>
  {{/with}}
  {{/events}}
  </div>
{{/page}}`);

export const tags = Handlebars.compile(`{{#page}}
  <div id='nav'>
  <a href="/list">list</a>
  </div>
  <h1>Tags</h1>
  <div id={{note-list}}>
  {{#each items}}
    <a href="{{href}}"><div>{{name}} ({{count}})</div></a>
  {{/each}}
  </div>
{{/page}}`);
