$( function() {

  var $form = $('#comment-form');
  var $name = $('#comment-name');
  var $email = $('#comment-email');
  var $body = $('#comment-body');
  var $addCode = $('#comment-add-code');

  $form.delegate('input[type="text"], textarea', 'keydown', function(e) {
    $(this).removeClass('error');
  });

  $addCode.on('click', function(e) {
    e.preventDefault();
    $body.val($body.val()+'\n[js]\n\n[/js]\n').focus();
  });

  $form.on('submit', function(e) {
    e.preventDefault();

    var name = $name.val();
    var email = $email.val();
    var body = $body.val();
    var url = '/post/'+$form.data('slug')+'/comment';

    var err = false;

    if (!name) { $name.addClass('error'); err = true; }
    if (!body) { $body.addClass('error'); err = true; }

    if (!err) {
      $.ajax({
        url: url,
        type: 'POST',
        dataType: 'json',
        data: {
          name: name,
          body: body,
          email: email
        },
        success: function(data, textStatus, jqXHR) {
          if (data && data.slug) {
            window.location.reload();
          } else {
            alert('Malformed post returned');
            console.log(data);
          }
        },
        error: function(data) {
          console.log(data);
        }
      });
    } else {
      console.log('There were errors');
    }
  });
});