SimpleBlog
==========

A *simple* blogging platform built on [Node.js](http://nodejs.org/)
and [Express.js](http://expressjs.com/) that uses
[Markdown](http://daringfireball.net/projects/markdown/syntax) syntax
for posting.

To speed things up, Simple doesn't make use of user sessions.
Since there are no sessions, there is no *admin* user. Simple makes
all admin pages (new post, edit, etc) accessible to the public but
requires a master password to do anything serious.

**Demo:** [My blog](http://schier.co)

## Installation
``` shell
npm install simple-blog
```

## Enviroment Setup

Your app will need access to a [MongoDb](http://www.mongodb.org/) database
to save posts. You can do one of the following:

  - Have [MongoDb](http://www.mongodb.org/) installed locally on port 27017
  - Set environment variable *MONGO_URL* to a remote location (ex. MongoHQ)

You can also set the password you will use to create/edit posts by setting
the environment variable BLOG_SECRET. The password is only required if
NODE_ENV is set to *production* and will default to "password" if not
specified.


## Sample Server

``` js
require('simple-blog').start();
```

## Server With Custom Views And Stuff

Simple Uses [Express.js](http://expressjs.com/) for a backend so
setup is very simple.

### Copy template and public directories
Simple comes with a default template but I'm sure you'll want to
make your own. To make sure you have everything you need to get
started you can copy the sample files from the module by doing
the following:

```
$ cd myApp/
$ cp -r node_modules/simple-blog/public ./
$ cp -r node_modules/simple-blog/views ./
```

### Point Simple To The Layout Files

To prevent Simple from using it's sample files, call the *setup()*
function in your main app script.

``` js
var simple = require('simple-blog');

// ALL PARAMETERS ARE OPTIONAL
simple.setup({
  name: 'Test Blog', // Blog Title

  // How to generate slugs (defaults to "title")
  slugType: 'base36', // options: "title" | "base36"

  // Path to the root of your app
  rootDir: __dirname,

  // Specify a URL that will dump all data
  //   Leave out or set to FALSE to disable
  dumpPath: '/dump',

  // Set amount of posts per page (defaults to 3)
  pageSize: 5,

  // Path to Express.js directories
  publicPath: '/public',
  viewPath: '/views',

  // Redirect www.domain... to domain...
  redirectWWW: true,

  /*************************************************
   * The rest is used for the RSS feed
   */

  // Disable RSS
  // rss: false,

  // Enable RSS at /rss.xml (defaults to disabled)
  rss: {
    description: 'A test blog to showcase simple-blog',
    author: 'Gregory Schier',
    img: '/favicon.ico', // Feed image
    limit: 10 // Feed item cutoff
  }
});

// Add custom routes the same as you would with Express.js
simple.app.get('/about', function(req, res) {
  res.render('about', { title: 'About' });
});

// Add event listeners. Options are 'comment', 'start'

simple.events.on('comment', function(comment) {
  console.log('COMMENT', comment)
});

simple.events.on('start', function(config) {
  console.log('START', config);
});


// Start Simple Blog
simple.start();
```

## User Guide

Since Simple doesn't use sessions it doesn't know who the admin is. To
keep people from finding the admin pages they are only accessable by
direct url. Here is what you need to know:

```
// Admin stuff
New post      /new
edit post     /edit/post/<POST SLUG>

// General stuff
Home             /
Pagination       /?p=1
View Post        /post/<POST SLUG>
View Tag         /tag/<TAG>
Drafts           /drafts
Recent Comments  /comments
JSON Dump Posts  /dump
```

## Screenshots

This is the default template

![Simple Blog](http://i.imgur.com/2MpgWnD.png)
