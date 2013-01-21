SimpleBlog
==========

A simple blogging platform built on Node.js that doesn't need user sessions.

## Installation
``` shell
npm install simple-blog
```
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
$ cp -r node_modules/simple-blog/public/ ./
$ cp -r node_modules/simple-blog/views/ ./
```

### Point Simple To The Layout Files

To prevent Simple from using it's sample files, call the *setup()*
function in your main app script.

``` js
var simple = require('simple-blog');

simple.setup({
  // The name of your blog
  name: 'My Blog',

  // Path to the root of your app
  rootDir: __dirname,

  // Path to Express.js directories
  publicPath: '/public',
  viewPath: '/views'
});

// Start Simple Blog
simple.start();
```




