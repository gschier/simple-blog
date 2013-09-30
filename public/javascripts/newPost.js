$( function() {

  var $form = $('#new-post-form');
  var $body = $('#new-post-body');
  var $title = $('#new-post-title');
  var $published = $('#new-post-published');
  var $tags = $('#new-post-tags');
  var $addCode = $('#new-post-add-code');
  var $previewContainer = $('#post-preview');
  var $previewBtn = $('#preview-button');

  // TRIGGER TEXTAREA RESIZE
  setTimeout( function() {
    $body.trigger('change');
  });

  $form.delegate('input[type="text"], textarea', 'keydown', function(e) {
    $(this).removeClass('error');
  });

  $addCode.on('click', function(e) {
    e.preventDefault();
    $body.val($body.val()+'\n\n<pre><code class="language-javascript">\n\n</code></pre>\n\n').focus();
  });

  $previewBtn.on('click', function(e) {
    e.preventDefault();
    submitPost(true);
  });

  $form.on('submit', function(e) {
    e.preventDefault();
    submitPost();
  });

  var showPreview = function(post) {
    $previewContainer.html(post);
    Prism.highlightAll();
  };

  var submitPost = function(isPreview) {
    var title = $title.val();
    var published = $published.is(':checked');
    var body = $body.val();
    var tags = [ ];

    var parsedTags = ($tags.val() || '').split(',');
    for (var i=0; i<parsedTags.length; i++) {
      tags.push(parsedTags[i].toLowerCase().trim());
    }

    var err = false;

    if (!title) { $title.addClass('error'); err = true; }
    if (!body) { $body.addClass('error'); err = true; }

    var url = '';
    var editing = $('#submit-button').data('edit');

    if (isPreview) {
      url = '/preview';
    } else if (editing) {
      url = '/edit/'+editing;
    } else {
      url = '/new';
    }

    if (!err) {
      $.ajax({
        url: url,
        type: (editing && !isPreview) ? 'PUT' : 'POST',
        dataType: isPreview ? 'html' : 'json',
        contentType: 'application/json',
        data: JSON.stringify({
          title: title,
          md: body,
          tags: tags,
          published: published,
          secret: $('#new-post-secret').val()
        }),
        success: function(data, textStatus, jqXHR) {
          if (isPreview) {
            showPreview(data);
          } else if (data && data.slug) {
            window.location = '/post/'+data.slug;
          } else {
            alert('Malformed post returned');
            console.log(data);
          }
        },
        error: function(data) {
          console.log(data);
        }
      });
    }
  };
});