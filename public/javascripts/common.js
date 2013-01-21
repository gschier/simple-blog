$( function() {
  var calcH = function() {
    var $this = $(this);
    while($this.outerHeight() < this.scrollHeight+parseFloat($this.css("borderTopWidth"))+parseFloat($this.css("borderBottomWidth"))) {
      $this.height($this.height()+1);
    }
  };

  $('textarea')
    .on('keyup', calcH)
    .on('change', calcH)
    .on('focus', calcH);
});