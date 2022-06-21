import Handlebars from 'handlebars';

export const note = Handlebars.compile(`<!doctype html>
<html>
<body>
  <div id='nav-tags'>
    {{#each tags}}
      <a href={{href}}><div>{{tag}}</div></a>
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

export const tag = Handlebars.compile(`<!doctype html>
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


export const tags = Handlebars.compile(`<!doctype html>
<html>
<body>
  <h1>Tags</h1>
  <div id={{note-list}}>
  {{#each items}}
    <a href="{{href}}"><div>{{tag}} ({{count}})</div></a>
  {{/each}}
  </div>
</body>
</html> 
`);
