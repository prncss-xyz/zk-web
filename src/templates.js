import Handlebars from 'handlebars';

export const notes = Handlebars.compile(`<!doctype html>
<html>
<body>
  <div id='tags'>
    {{#each tags}}
      <div>{{this}}</div>
    {{/each}}
  </div>
{{{content}}}
  <div id='backlinks'>
    {{#each backlinks}}
      <a href="{{this.href}}"><div>{{this.title}}</div></a>
    {{/each}}
  </div>
</body>
</html> 
`);
