define ['imjs'], ({Service}) -> Array '$scope', 'identifyItem', (scope, identifyItem) ->

  data = scope.data
  service = Service.connect scope.data.service

  service.fetchModel().then (model) ->
    path = model.makePath "#{ data.item.type }.sequence.residues"
    scope.$apply -> scope.isSuitable = true

  scope.activate = ->
    identifyItem(data.service, data.item).then (fields) ->
      step =
        title: "Viewed sequence"
        tool: scope.tool.ident
        data:
          service:
            root: service.root
          object:
            type: data.item.type
            fields: fields
          pathToSequence: 'sequence.residues'

      scope.appendStep data: step

