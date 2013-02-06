var mongoose = require('mongoose');
var md = require('node-markdown').Markdown;

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/blog');

var schema = new mongoose.Schema({
  title: { type: String, required: true, set: function(title) {
    // Generate slug from title
    str = title.toString().replace(/[\\&]/g, 'and').replace(/^\s+|\s+$/g, '').toLowerCase();
    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    var to   = "aaaaeeeeiiiioooouuuunc------";
    for (var i=0, l=from.length ; i<l ; i++) {
      str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 \-]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // collapse whitespace and replace by -
      .replace(/-+/g, '-'); // collapse dashes

    this.slug = str;

    // Return original title unchanged
    return title;
  }},
  comments: [{
    name: { type: String, required: true },
    body: { type: String, required: true, set: function(comment) {
      comment = comment.replace(/(<([^>]+)>)/ig, ''); // Strip HTML
      comment = comment.replace(/\n/g, '<br>'); // nl2br
      comment = comment.replace(/\[js\](.?)*\[\/js\]/g, function(match) {
        // Unreplace <br> tags in code blocks
        return match.replace(/(<br>)/g, '\n');
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
  slug: { type: String, required: true },
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

var Post = module.exports = mongoose.model('Post', schema, 'posts');