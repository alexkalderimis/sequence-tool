require.config({
    baseUrl: 'js',
    paths: {
      requireLib: '../bower_components/requirejs/require',
      sequence: '../bower_components/biojs-sequence/build/sequence.min',
      jquery: '../bower_components/jquery/dist/jquery',
      q: '../bower_components/q/q',
      underscore: '../bower_components/underscore/underscore',
      backbone: '../bower_components/backbone/backbone', 
      jschannel: '../bower_components/jschannel/src/jschannel',
      imjs: '../bower_components/imjs/js/im'
    },
    shim: {
      sequence: { deps: ['jquery'], exports: 'Sequence' },
      jquery: {
        exports: '$',
        init: function () {
          $.browser = {};
        }
      },
      underscore: {
        exports: '_'
      },
      backbone: {
        deps: ['underscore', 'jquery'],
        exports: 'Backbone'
      },
      jschannel: {
        exports: 'Channel'
      }
    },
    deps: ['./child']
});
