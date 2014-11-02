define(function (require) {
  'use strict';

  var Backbone = require('backbone');
  var _ = require('underscore');

  return Backbone.Model.extend({

    getId: function () {
      // TODO - don't hard wire these fields...
      var feature = this;
      var keyFields = ['symbol', 'uniprotAccession', 'primaryIdentifier'];
      var key = _.find(keyFields, function (field) {
        return feature.has(field);
      });
      return feature.get(key);
    },

    initialize: function () {
      var self = this;
      if (this.getId()) {
        this.trigger('ready');
      } else {
        this.on('change', function () {
          if (self.getId() && self.has('sequence')) {
            self.trigger('ready');
          }
        });
      }
    }
  });

});
