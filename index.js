
// A better wrapper around a sax parser

var expat = require('node-expat')
var events = require('events')
var _ = require('underscore')

// The root node is returned in the callback to parse
// You can call 'on' and 'onEnd'
//    - node.on 'someNode', (node) ->
// you can call on and onEnd of subnodes too

function Node(name, attrs, text) {
    var emitter = new events.EventEmitter(), 
        self = this
    
    self.name = name
    self.attrs = attrs || {}
    self.text = text || ""

	// by default the max listeners is 10, this won't actually limit the listeners,
	// but print warnings for each listener added after 10.  0 is unlimited.

    emitter.setMaxListeners(0)

    _(self).extend(events.EventEmitter)

    self.on = function(name, cb) {
        emitter.on(name, cb)
    }

    // Listen for when this node ends
    self.onEnd = function(cb) {
        emitter.on(Node.EndedEvent, cb)
    }

    // internal. when the node has closed. 
    self.ended = function() {
        emitter.emit(Node.EndedEvent)
    }

    // interal. when we found a node inside it
    self.foundDescendant = function(node) {
        emitter.emit(node.name, node)
    }

    // Returns an attribute
    self.attr = function(name) {
        return self.attrs[name]
    }

    // Just for fun
    self.toString = function() {
        var out = "<" + self.name

        _(self.attrs).each(function(value, name) {
            out += " " + name + '="' + value + '"'
        })
        out += ">" + self.text + "</" + self.name + ">"
        return out
    }
    return self
}

Node.EndedEvent = '_ended'
// Returns a parser you can feed things to

exports.parser = function(cb) {
    var parents = [],
        currentNode,
        parser,
        sendUnsentNode,
        unsentNode
    
    var calledCallback = false
    
    function callback(err, root) {
        calledCallback = true
        cb(err, root)
    }

    // Send foundNode to every parent along the way
    // Not to yourself though

    function sendUnsentNode() {
        var _i, _len, _ref, parent
        if (typeof unsentNode !== "undefined" && unsentNode !== null) {
            _ref = parents
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                parent = _ref[_i]
                parent.foundDescendant(unsentNode)
            }
            return (unsentNode = null)
        }
    }

    // Set up the parser
    parser = new expat.Parser("UTF-8")

    parser.on('startElement', function(name, attrs) {
        if (currentNode) {
            parents.push(currentNode)
            sendUnsentNode()
        }
        currentNode = new Node(name, attrs)
        unsentNode = currentNode
        // Send back the root
        if (parents.length === 0) 
            callback(null, currentNode)
    })

    parser.on('endElement', function(name) {

        // sys.puts "Ending #{name} (#{currentNode})"
        sendUnsentNode()
        currentNode.ended()
        currentNode = parents.pop()
    })

    parser.on('text', function(text) {
        currentNode.text = currentNode.text || ""
        currentNode.text += text;
        // sendUnsentNode()
    });
    
    // parser.addListener 'processingInstruction', (target, data) ->
    // parser.addListener 'comment', (comment) ->
    // parser.addListener 'xmlDeclaration', (version, encoding, standalone) ->

    return function(somethingWithToString) {
        
        
        if (!somethingWithToString) return callback(new Error("PARSE ERROR - string was null"))

        // somethingWithToString.toString() because string might be a buffer
        var result = parser.parse(somethingWithToString.toString())        

        if (!result)
            callback(new Error("PARSE ERROR: " + parser.getError() + " For String: ((( " + somethingWithToString + " )))"))
            
        return calledCallback
    }
}

// Parse a string
// cb (err, root)
// If you want to know when we're done parsing, do:
// parser.parse string, (err, root) ->
//        root.onEnd -> sys.puts "Ended"
// 
// Normal Example
// parser.parse string, (err, root) ->
//     root.on 'somenode', (node) ->
//             node.on 'subnode', (node) -> 
//                     sys.puts node.text
//                     sys.puts node.attr 'someattribute'
//     root.onEnd -> sys.puts "Ended"

exports.parse = function(string, cb) {
    
    // this temporary until we can get it to call back more than once and then we will know the xml where it breaks
    var callbacked = false
    function callback (err, data) {
        if (callbacked) {
            // this would throw an error anyway, now we just add the xml to 
            throw new Error("Parser called back multiple times on xml: " + string)
        }
        else {
            callbacked = true
            cb(err, data)
        }
    }
    
    var parse = exports.parser(callback)
    var result = parse(string)
    
    if (!result) callback(new Error("parser.parse never finished: " + string))
    // if not result then cb new Error "Could not parse" else null
}
