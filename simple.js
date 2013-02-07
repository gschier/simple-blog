var express = require('express');
var http    = require('http');
var path    = require('path');
var util    = require('util');
var RSS     = require('rss');
var Post    = require('./models/Post');

var app = module.exports.app = express();

var config = {
  name: 'Simple Blog',
  publicPath: '/public',
  viewPath: '/views',
  slugType: 'title',
  rootDir: __dirname,
  redirectWWW: true,
  secret: process.env.BLOG_SECRET || 'password',
  rss: false
};

var isSetup = false;

var setup = module.exports.setup = function(userConfig) {
  if (userConfig) {
    for (var key in userConfig) {
      config[key] = userConfig[key];
    }
  }

  isSetup = true;

  app.configure(function() {
    app.set('port', process.env.PORT || 5000);
    app.set('postsPerPage', 3);
    app.set('prod', process.env.NODE_ENV === 'production');
    app.set('views', config.rootDir+config.viewPath);
    app.set('view engine', 'jade');
    if (config.redirectWWW) {
      app.use(function(req, res, next) {
        if (req.headers.host.match(/^www/) !== null ) {
          res.redirect(301, 'http://'+req.headers.host.replace(/^www\./, '')+req.url);
        }
        else { next(); }
      });
    }
    app.use(express.compress());
    app.use(express.favicon(config.rootDir+config.publicPath+'/favicon.ico'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(require('stylus').middleware(config.rootDir+config.publicPath));
    app.use(express['static'](config.rootDir+config.publicPath));
    app.use( function(req, res, next) {
      var protocol = req.connection.encrypted ? 'https://' : 'http://';

      app.locals.host = req.headers.host;
      app.locals.rssEnabled = !!config.rss;
      app.locals.baseUrl = protocol+app.locals.host;
      app.locals.rssURL = app.locals.baseUrl+'/rss.xml';
      app.locals.blogName = config.name;

      if (app.locals.totalPosts === undefined) {
        Post.where('published', true).count().exec( function(err, data) {
          app.locals({ totalPosts: data });
          app.locals({ totalPages: Math.ceil(data/app.get('postsPerPage'), 10) });
          next();
        });
      } else {
        next();
      }
    });
    app.use(app.router);
  });

  app.configure('development', function(){
    app.use(express.errorHandler());
  });

  // HOME PAGE
  app.get('/', function(req, res) {
    var limit = 3;

    // ?p=1 OR ?page=1
    req.query.page = req.query.p || req.query.page;

    Post
      .where('published', true)
      .sort({ date: 'desc' })
      .limit(limit)
      .skip(Math.max(0, req.query.page-1)*limit || 0)
      .exec(function(err, posts) {
        if (err) { res.statusCode(500); res.end(); }
        res.render('index', {
          title: '',
          posts: posts,
          page: parseInt(req.query.page, 10) || 1
        });
      });
  });

  // RECENT COMMENTS
  app.get('/comments', function(req, res) {
    Post
      .where('numComments').gt(0)
      .sort({ 'comments.date': 'desc' })
      .limit(10)
      .exec(function(err, posts) {
        if (err) { res.statusCode(500); res.end(); }
        res.render('comments', {
          title: 'Comments',
          posts: posts
        });
      });
  });

  // NEW POST FORM
  app.get('/new', function(req, res) {
    res.render('newPost', { title: 'New Post' });
  });

  // EDIT A POST
  app.get('/edit/post/:slug', function(req, res) {
    Post
      .where('slug', req.params.slug)
      .findOne( function(err, post) {
        if (err) { res.statusCode = 404; res.end(); }
        res.render('newPost', { title: 'Edit Post', isEditing: true, post: post });
      });
  });

  // VIEW POST SHORTHAND
  app.get('/p/:slug', function(req, res) {
    var url = req.protocol+'://'+req.host+'/post/'+req.params.slug;
    // This won't work if a port is needed
    res.redirect(301, url);
  });

  // VIEW POST
  app.get('/post/:slug', function(req, res) {
    Post
      .where('slug', req.params.slug)
      .where('published', true)
      .findOne( function(err, post) {
        if (err) { res.statusCode = 404; res.end(); }
        res.render('post', { title: post.title, post: post });
      });
  });

  // VIEW POSTS BY TAG
  app.get('/tag/:tag', function(req, res) {
    Post
      .where('tags', req.params.tag)
      .where('published', true)
      .sort({ date: 'desc' })
      .exec(function(err, posts) {
        if (err) { res.statusCode = 500; res.end(); }
        if (posts) {
          var post = posts[0];
          res.render('tag', { title: '#'+req.params.tag, posts: posts, tag: req.params.tag });
        } else {
          res.statusCode = 404;
          res.end();
        }
      });
  });

  // SUBMIT A NEW POST
  app.post('/new', function(req, res) {
    if (
      process.env.NODE_ENV === 'production' &&
      req.body.secret !== config.secret
    ) {
      res.statusCode = 400;
      res.end();
    } else {
      new Post(req.body)
        .setSlugType(config.slugType)
        .save(function(err, data) {
          if (err) {
            res.statusCode = 400;
            res.json(err);
            console.log('Error submitting post: ', err);
          } else {
            app.locals({ totalPosts: undefined });
            res.json(data);
          }
      });
    }
  });

  // EDIT A POST
  app.put('/edit/:slug', function(req, res) {
    if (
      process.env.NODE_ENV === 'production' &&
      req.body.secret !== config.secret
    ) {
      res.statusCode = 400;
      res.end();
    } else {
      Post
        .where('slug', req.params.slug)
        .where('published', true)
        .findOne( function(err, post) {
          if (err) { res.statusCode = 404; res.end(); return; }
          post.md = req.body.md;
          post.tags = req.body.tags;
          post.save( function(err, newPost) {
            if (err) { res.statusCode = 500; res.end(); return console.log(err); }
            res.json(newPost);
          });
        });
    }
  });

  // PREVIEW POST
  app.post('/preview', function(req, res) {
    var post = new Post(req.body);
    res.render('preview', { title: post.title, post: post });
  });

  // SUBMIT COMMENT
  app.post('/post/:slug/comment', function(req, res) {
    if (!(req.body && req.body.name && req.body.body)) {
      res.statusCode = 500; res.end(); return;
    }
    Post
      .where('slug', req.params.slug)
      .where('published', true)
      .findOne( function(err, post) {
        if (err) { res.statusCode = 404; res.end(); }
        post.comments.push(req.body);
        post.save( function(err, data) {
          if (err) {
            res.statusCode = 500;
            res.end();
            console.log('Error submitting comment: ', err);
          }
          else { res.json(data); }
        });
      });
  });

  // RSS FEED
  if (config.rss) {
    app.get('/rss.xml', function(req, res) {
      Post
        .where('published', true)
        .sort({ date: 'desc' })
        .limit(config.rss.limit || 10)
        .exec( function(err, posts) {
          if (err) {
            res.status(500).end();
            console.warn('Failed to get posts for RSS feed ', err.stack);
            return;
          }

          var baseUrl = app.locals.baseUrl;

          var feed = new RSS({
            title: config.name,
            description: config.rss.description || '',
            feed_url: baseUrl+'/rss.xml',
            site_url: baseUrl,
            image_url: baseUrl+(config.rss.img || '/favicon.ico'),
            author: config.rss.author || config.name
          });

          for (var i=0; i<posts.length; i++) {
            var post = posts[i];
            feed.item({
              title:  post.title,
              description: post.body,
              url: baseUrl+'/posts/'+post.slug,
              date: post.date
            });
          }

          res.setHeader('Content-Type', 'application/xml');
          res.end(feed.xml());
        });
    });
  }
};

module.exports.start = function() {
  if (!isSetup) { setup(); }
  http.createServer(app).listen(app.get('port'), function() {
    console.log('Started '+config.name+' on port ' + app.get('port'));
    console.log('Config used: ', config);
  });
};
