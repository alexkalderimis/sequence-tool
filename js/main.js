define(function (require) {

  'use strict';

  var Backbone = require('backbone');
  var _ = require('underscore');
  var Q = require('q');
  var Sequence = require('sequence');
  var imjs = require('imjs');

  var FormatButtons = require('./format-buttons');
  var Feature = require('./feature');

  var defaultFormat = 'FASTA';

  var headerTemplate = _.template('<h4><em><%= feature %></em> (<%= length %> bp)</h4>');

  var Annotations = Backbone.Collection.extend({ model: Feature });

  var Tool = Backbone.View.extend({

    initialize: function (options) {
      if (options.data.sequence) {
        this.feature = new Feature(_.omit(options.data, 'annotations'));
      } else {
        this.feature = new Feature();
        this.requestFeature(options.data);
      }
      this.annotations = new Annotations(options.data.annotations || []);
      this.settings = new Backbone.Model();
      this.settings.set('format', (options.config.format || defaultFormat));

      this.listenTo(this.feature, 'change:sequence', this.setSequence.bind(this));
      this.listenTo(this.settings, 'change', this.applySettings.bind(this));

      var def = Q.defer();
      this.ready = def.promise;
      this.feature.once('ready', _.defer.bind(null, def.resolve));
    },

    requestFeature: function (data) {
      var self = this;
      var type = data.object.type;
      var fields = data.object.fields;
      var service = imjs.Service.connect(data.service);
      var query = {select: ['*'], from: type, where: fields};
      var feature = self.feature;

      service.records(query).then(function (matches) {
        feature.set(matches[0]);
      }).then(function () {
        var sequenceQuery = {
          select: [data.pathToSequence],
          from: type,
          where: {id: feature.get('objectId')}
        };
        return service.rows(sequenceQuery);
      }).then(function (rows) {
          feature.set({sequence: rows[0][0]});
        }, function (e) {
          console.error(e);
          self.trigger('error', 'Could not find sequence for ' + type, e);
      });
    },

    applySettings: function () {
      if (!this.bioJsComponent) return;

      this.bioJsComponent.setFormat(this.settings.get('format'));
      var newS = this.settings.pick('start', 'end');
      this.bioJsComponent.setSelection(newS.start, newS.end);
    },

    setSequence: function () {
      if (!this.bioJsComponent) return;

      this.bioJsComponent.setSequence(
          this.feature.get('sequence'),
          this.feature.getId());
    },

    render: function () {
      this.ready.then(function () {

        var panel = document.createElement('div');
        panel.className = 'panel panel-default';

        var header = document.createElement('div');
        header.className = 'panel-heading';
        header.innerHTML = headerTemplate({
          feature: this.feature.getId(),
          length: this.feature.get('sequence').length
        });
        panel.appendChild(header);

        var viewer = document.createElement('div');
        viewer.className = 'panel-body sequence';
        panel.appendChild(viewer);
        this.el.appendChild(panel);
        var sequence =this.feature.get('sequence'); 

        try {
          this.bioJsComponent = new Sequence({
            sequence: sequence,
            target: viewer,
            format: this.settings.get('format'),
            id: this.feature.getId(),
            annotations: this.annotations.toJSON(),
            formatSelectorVisible: false
          });
          this.bioJsComponent.on('selection-changed', function (selection) {
            // selection: {start, end}
            this.settings.set(selection);
          }.bind(this));
        } catch (e) {
          console.error(e);
          return this.trigger('error', "Error rendering");
        }

        var footer = document.createElement('div');
        footer.className = 'panel-footer';
        var formatButtons = new FormatButtons({sequence: sequence, model: this.settings});
        footer.appendChild(formatButtons.el);
        formatButtons.render();
        panel.appendChild(footer);

        this.trigger('rendered');
      }.bind(this));
    }
  });

  return Tool;

});
