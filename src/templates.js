import Handlebars from 'handlebars';

export const note = Handlebars.compile(`<!doctype html>
<html>
<body>
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
  <h1>{{tag}}</h1>
  <div id='tag-list'>
  {{#each items}}
    <a href="{{href}}"><div>{{title}}</div></a>
  {{/each}}
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
  <h1>Tags</h1>
  <div id={{note-list}}>
  {{#each items}}
    <a href="{{href}}"><div>{{name}} ({{count}})</div></a>
  {{/each}}
  </div>
</body>
</html> 
`);
