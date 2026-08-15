(function(){
  'use strict';
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.data-filter'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.dataset-card[data-category]'));
  var count = document.getElementById('dataset-count');
  var label = document.getElementById('dataset-label');
  if (!buttons.length || !cards.length || !count || !label) return;

  buttons.forEach(function(button){
    button.addEventListener('click', function(){
      var filter = button.getAttribute('data-filter') || 'all';
      var visible = 0;
      buttons.forEach(function(item){
        var active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      cards.forEach(function(card){
        var show = filter === 'all' || card.getAttribute('data-category') === filter;
        card.hidden = !show;
        if (show) visible += 1;
      });
      count.textContent = String(visible);
      label.textContent = visible === 1 ? 'dataset zobrazen' : (visible >= 2 && visible <= 4 ? 'datasety zobrazeny' : 'datasetů zobrazeno');
    });
  });
})();
