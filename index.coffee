expat = require 'node-expat'
events = require 'events'


# simply parse a read stream as xml
# give the system the base node, 

exports.parse = (readStream) ->

  parser = new expat.Parser("UTF-8")
  emitter = new events.EventEmitter()

  readStream.on 'data', (data) ->
    parser.parse data.toString()

  readStream.on 'end', ->
    process.nextTick ->
      emitter.emit 'end'

  readStream.on 'error', (err) ->
    emitter.emit 'error', err

  readStream.on 'close', ->
    emitter.emit 'close'


  # parse EVERYTHING inside of them.
  each = (nodeName, eachNode) ->

    eachNodeDelayed = (node) ->
      process.nextTick ->
        eachNode node

    currentNode = null

    parser.on 'error', (err) ->
      emitter.emit 'error', err

    parser.on 'startElement', (name, attrs) ->
      currentNode = {$name: name, $:attrs, $parent: currentNode}

    parser.on 'text', (text) ->
      return if not currentNode?
      currentNode.$text ?= ""
      currentNode.$text += text


    parser.on 'endElement', (name) ->
      return if not currentNode?

      parent = currentNode.$parent

      if parent?
        delete currentNode.$parent
        parent.$children ?= []
        parent.$children.push currentNode
        parent[currentNode.$name] = currentNode
   
      if currentNode.$name is nodeName
        eachNodeDelayed currentNode

      currentNode = parent


  return {
    each: each
    on: (e, cb) -> emitter.on e, cb
    pause: -> readStream.pause()
    resume: -> readStream.resume()
  }


