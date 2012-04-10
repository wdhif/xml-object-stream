
xml-events
==========

This module provides a more usable interface to [node-expat](https://github.com/astro/node-expat)'s fast SAX parser. 


Installation 
------------

    npm install xml-events


Parsing
-------

Contextual events are fired when the parser finishes parsing a descendant's attributes and text. You can then listen for futher descendants on the matched node. 

    var xml = require('xml-events')
    var data = "<root><person age='32'><name>Somebody</name></person></root>"
    xml.parse(data, function(err, root) {

        // find <person> nodes anywhere in the document
        root.on('person', function(person) {
    
            // find <name> nodes anywhere within this <person>
            person.on('name', function(name) {
                
                // person is still in scope, so we can access its attributes.
                console.log("Found person: " + name.text + " with age " + person.attr('age'))
            })
        })

        root.onEnd(function() {
            console.log("Done parsing the document")
        })
    })

Streaming
---------

You can stream data to the parser with `xml.parser`. 

    var xml = require('xml-events')
    var parse = xml.parser(function(err, root) {
        root.on('name', function(name) {
            console.log("found name: " + name)
        })
    })

    parse("<root><nam")
    parse("e>bob</nam")
    parse("e></root>")

If you are using a file stream, just listen to the `data` event and pass it to `parse`

    var parse = xml.parser(function(err, root) {
        ...
    })

    var stream = fs.createReadStream("somefile.xml")
    stream.on('data', function(data) {
        parse(data)
    })
    

