var mongoose = require('mongoose');
var md = require('node-markdown').Markdown;
var slug = require('slug');
var bases = require('bases');

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/blog');

var schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  comments: [{
    name: { type: String, required: true, trim: true },
    body: { type: String, required: true, set: function(comment) {
      comment = comment.replace(/(<([^>]+)>)/ig, ''); // Strip HTML
      comment = comment.replace(/\n/g, '<br>'); // nl2br
      comment = comment.replace(/\[js\](.?)*\[\/js\]/g, function(match) {
        // Unreplace <br> tags in code blocks
        match = match.replace(/(<br>)/g, '\n');

        // Encode angle brackets
        match = match.replace(/</g, '&lt;');
        match = match.replace(/>/g, '&gt;');
        return match;
      });

      // Convert code blocks to Prism.js format
      comment = comment.replace(/(\[js\]\s*)/g, '<pre><code class="language-javascript">');
      comment = comment.replace(/(\[\/js\]\s*)/g, '</code></pre>');

      return comment;
    }},
    date: { type: Date, 'default': Date.now },
    email: { type: String }
  }],
  numComments: { type: Number, 'default': 0 },
  slug: { type: String, lowercase: true },
  author: { type: String, 'default': '' },
  body: { type: String, required: true},
  md: { type: String, required: true, set: function(markdown) {
    this.body = md(markdown);
    return markdown;
  }},
  published: { type: Boolean, 'default': false },
  date: { type: Date, 'default': Date.now },
  tags: [ String ]
});

schema.pre('save', function(next) {
  if (this.isSelected('comments')) {
    this.numComments = this.comments.length;
  }
  next();
});

schema.index({ slug: 1 }, { unique: true });

schema.methods = {
  setSlugType: function(type) {
    this.slugType = type;
    return this; // For method chaining
  },
  setSlug: function() {
    if (this.slugType === 'base36') {
      var timestamp = parseInt(this.date.getTime()/1000, 10);
      this.slug = bases.toBase(timestamp, 36);
    } else {
      // Default to regular title slug
      this.slug = slug(this.title);
    }
  }
};

schema.pre('save', function(next) {
  if (this.isNew) { this.setSlug(); }
  next();
});

var Post = module.exports = mongoose.model('Post', schema, 'posts');
