SimpleBlog
==========

A simple blogging platform built on Node.js that doesn't need user sessions.

## Installation

  npm install simple-blog

## Sample Server

``` js
require('simple-blog').start();
```

## Server With Custom Jade/CSS/JS

``` js
var simple = require('simple-blog');

simple.setup({
  // The name of your blog
  name: 'My Blog',

  // Path to public directory
  publicPath: '/public',

  // Path to the root of your app
  rootDir: __dirname
});

// Start Simple Blog
simple.start();
```
