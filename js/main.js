define(function (require) {

  'use strict';

  var Backbone = require('backbone');
  var _ = require('underscore');
  var Q = require('q');
  var Sequence = require('sequence');
  var imjs = require('imjs');
  var DEFAULT_SETTINGS = require('./default-settings');

  var FormatButtons = require('./format-buttons');
  var Feature = require('./feature');
  var Annotation = require('./annotation');
  var Settings = Backbone.Model.extend({defaults: DEFAULT_SETTINGS});
  var Annotations = Backbone.Collection.extend({ model: Annotation });

  var headerTemplate = _.template('<h4><em><%= feature %></em> (<%= length %> bp)</h4>');

  var Tool = Backbone.View.extend({

    initialize: function (options) {
      var annoData = (options.data.annotations || []);
      this.feature = new Feature();
      this.annotations = new Annotations();
      this.settings = new Settings();
      if (options.config.format) this.settings.set('format');
      this.settings.set('service', options.data.service);

      if (options.data.sequence) {
        this.feature.set(_.omit(options.data, 'annotations'));
        this.annotations.add(annoData);
      } else {
        this.requestFeature(options.data);
      }

      this.listenTo(this.settings, 'change', this.applySettings.bind(this));
      this.listenTo(this.feature, 'change:sequence', this.setSequence.bind(this));
      this.listenTo(this.feature, 'change:objectId',
        this.fetchAnnotations.bind(this, annoData));
      this.listenTo(this.annotations, 'add', this.addAnnotation.bind(this));

      var def = Q.defer();
      this.ready = def.promise;
      this.feature.once('ready', _.defer.bind(null, def.resolve));
    },

    requestFeature: function (data) {
      var self = this;
      var type = data.object.type;
      var fields = data.object.fields;
      var connection = imjs.Service.connect(data.service);
      var query = {select: ['*'], from: type, where: fields};
      var feature = self.feature;

      connection.records(query).then(function (matches) {
        feature.set(matches[0]);
      }).then(function () {
        var sequenceQuery = {
          select: [data.pathToSequence],
          from: type,
          where: {id: feature.get('objectId')}
        };
        return connection.rows(sequenceQuery);
      }).then(function (rows) {
          feature.set({sequence: rows[0][0]});
        }, function (e) {
          console.error(e);
          self.trigger('error', 'Could not find sequence for ' + type, e);
      });
    },

    fetchAnnotations: function (annotationData) {
      var self = this
        , id = this.feature.get('objectId')
        , type = this.feature.get('class')
        , c = imjs.Service.connect(this.settings.get('service'))
        , featureStart = ['chromosomeLocation.start']
        , constraint = {id: id};

      var getOffset = c.rows({select: featureStart, from: type, where: constraint})
                       .then(getIn([0, 0]))
                       .then(toOffset);
      getOffset.then(function (offset) {
        var toRegions = rowsToRegions(offset);
        _.each(annotationData, function (a) {
          var query = {select: a.select, from: type, where: {id: id}};
          c.rows(query).then(toRegions).then(createAnnotation).then(addAnnotation);

          function createAnnotation(regions) {
            console.log(regions);
            return {name: a.name, regions: regions, className: a.className};
          }

          function addAnnotation (annotation) {
            return self.annotations.add(annotation);
          }
        });
      });
    },

    applySettings: function () {
      if (!this.bioJsComponent) return;

      var newS = this.settings.pick('start', 'end');

      this.bioJsComponent.setFormat(this.settings.get('format'));
      this.bioJsComponent.setSelection(newS.start, newS.end);
      this.bioJsComponent.setNumCols(this.settings.get('columns'));
      if (this.settings.get('hideAnnotations')) {
        this.bioJsComponent.hideAnnotations();
      } else {
        this.bioJsComponent.showAnnotations();
      }
    },

    setSequence: function () {
      if (!this.bioJsComponent) return;

      this.bioJsComponent.setSequence(
          this.feature.get('sequence'),
          this.feature.getId());
    },

    addAnnotation: function (annotation) {
      if (!this.bioJsComponent) return;

      this.bioJsComponent.addAnnotation(annotation.toJSON());
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
            numCols: this.settings.get('columns'),
            id: this.feature.getId(),
            annotations: this.annotations.toJSON(),
            formatSelectorVisible: false
          });
          this.bioJsComponent.on(Sequence.EVT_ON_SELECTION_CHANGED, function (s) {
            // selection: {start, end}
            this.settings.set(s);
          }.bind(this));
          this.applySettings();
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

  function getIn (coords) {
    return function (object) {
      return coords.reduce(function (memo, coord) { return memo[coord]; }, object);
    };
  }

  function toOffset (startPos) {
    return startPos - 1; // Genomic locations are 1-based.
  }

  function rowsToRegions (offset) {
    return function (rows) {
      return rows.map(function (row) {
        return {start: row[0] - offset, end: row[1] - offset};
      });
    };
  }

});
