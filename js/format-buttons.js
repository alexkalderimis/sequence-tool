define(function (require) {

  'use strict';

  var Backbone = require('backbone');
  var _ = require('underscore');
  var nullSelection = {start: null, end: null};

  var FormatButtons = Backbone.View.extend({

    initialize: function (options) {
      this.listenTo(this.model, 'change', this.render.bind(this));
      // Sequence is not mutable.
      this.sequence = options.sequence;
      this.cgContent = calculateCG(options.sequence);
    },

    className: 'btn-toolbar',

    events: function () {
      var e = {};
      var model = this.model;
      _.each(FormatButtons.FORMATS, function (fmt) {
        e['click .btn.' + fmt.toLowerCase()] = model.set.bind(model, {format: fmt}, null);
      });
      e['click .btn-clear'] = model.set.bind(model, nullSelection, null);
      e['click .toggle-annotations'] = function () {
        model.set('hideAnnotations', !model.get('hideAnnotations'));
      };
      return e;
    },
  
    render: function () {
      var frag = document.createDocumentFragment();

      var group = document.createElement('div');
      group.className = 'btn-group';
      frag.appendChild(group);
      var currentFormat = this.model.get('format');
      _.each(FormatButtons.FORMATS, function (fmt) {
        var btn = document.createElement('button');
        btn.className = 'btn btn-default';
        btn.classList.add(fmt.toLowerCase());
        if (currentFormat === fmt) {
          btn.classList.add('active');
        }
        btn.innerHTML = fmt;
        group.appendChild(btn);
      });

      var selection = this.model.pick('start', 'end');
      if (selection.start && selection.end) {
        var group2 = document.createElement('div');
        group2.className = 'btn-group';

        var selectionLabel = document.createElement('button');
        selectionLabel.className = 'btn btn-default disabled';
        selectionLabel.innerHTML = (selection.end - selection.start + 1) +
          " bases selected (CG count: " +
          calculateCG(this.sequence.slice(selection.start - 1, selection.end)) + '%)';

        var unselect = document.createElement('button');
        unselect.className = 'btn btn-default btn-clear';
        unselect.innerHTML = 'Clear selection';

        group2.appendChild(selectionLabel);
        group2.appendChild(unselect);

        frag.appendChild(group2);
      }

      var group3 = document.createElement('div');
      group3.className = 'btn-group';

      var cgLabel = document.createElement('button');
      cgLabel.className = 'btn btn-default disabled';
      cgLabel.innerHTML = _.escape('CG content: ' + this.cgContent + '%');

      group3.appendChild(cgLabel);
      frag.appendChild(group3);

      var toggleAnnotations = document.createElement('button');
      toggleAnnotations.className = 'btn btn-default toggle-annotations';
      toggleAnnotations.appendChild(document.createTextNode('Toggle Annotations'));
      frag.appendChild(toggleAnnotations);

      this.$el.html(frag);
    }
  });

  FormatButtons.FORMATS = ['FASTA', 'CODATA', 'PRIDE', 'RAW'];

  return FormatButtons;

  function calculateCG (sequence) {
    var base, i;
    var cgCount = 0;
    var length = sequence.length;

    for (i = 0; i < length; i++) {
      base = sequence.charAt(i).toLowerCase();
      if (base === 'c' || base === 'g') {
        cgCount++;
      }
    }

    return (cgCount / length * 100).toFixed(2);
  }
});
