/*
 * Main here is a normal Backbone view with the following API:
 *   * ::constructor(options) receive the initial options.
 *   * ::render() Render the component to the element.
 * 
 * The following events are listened for:
 *   * rendered - the view sucessfully rendered. Should be triggered
 *                when the render cycle is complete.
 *   * error - If there is an error rendering.
 *   * message - If the component wishes to broadcast any message to the parent.
 */
require(['underscore', 'jschannel', './main'], function (_, Channel, Tool) {
    'use strict';

    var chan = Channel.build({
      window: window.parent,
      origin: '*',
      scope: 'CurrentStep'
    });

    var conf = {};

    chan.bind('configure', function (trans, params) {
      _.extend(conf, params);
      return 'ok';
    });

    chan.bind('init', function (trans, params) {
      var view, rootNode = document.body;

      trans.delayReturn(true);

      try {
        var view = new Tool({data: params, config: conf});

        view.once('rendered', function () {
          trans.complete('ok');
        });

        view.on('error', function (err) {
          console.error(err);
          trans.error(err.message);
        });

        view.on('message', function (method, params) {
          chan.notify({method: method, params: params});
        });

        view.setElement(rootNode);
        view.render();
      } catch (e) {
        console.error(e, e.stack);
        trans.error(e.message);
      }

    });

    chan.bind('style', function (trans, params) {

      var head = document.getElementsByTagName("head")[0];
      var link = document.createElement('link');

      link.rel = "stylesheet";
      link.href = params.stylesheet;

      head.appendChild(link);

    });

});


