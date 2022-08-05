# zk-web

**very WIP**

Developing utilities around markdown flat files structured _à la_ [zk](https://github.com/mickael-menu/zk) [obsidian](https://obsidian.md/) [GitJournal](https://github.com/GitJournal/GitJournal).

`zk-web serve` starts a web server. 

`parse/{id}` pages are there to help development of markdown parsing and analysis, basee on [unifiedjs](https://github.com/unifiedjs). Main features are context rich backlinks and fetching header title.

`query/{id}` pages are there to help development of sqlite queries based on pages metadata. 

Other pages offer very crude navigation using handlebars templates that will eventually be supplanted by a react app.

`zk-web scan` updates a sqlite database with relevant metadata. Database is located in its conventional xdg-data directory.

`zk-web html <id>` process relevant markdown file to standard output so it can be used by other tools.

`serve` and `html` subcommands still use `mickael-menu/zk`, this should eventually be removed now that there is a built-in database.

`zk-web` uses a configuration file in standard xdg-config location.
