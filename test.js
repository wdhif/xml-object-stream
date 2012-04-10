
var sys = require('util')
var xml = require('./index')
var assert = require('assert')

describe('xml-events', function() {
    it('should return an error for a null string', function(done) {
        var parse = xml.parser(function(err, root) {
            assert.ok(err)
            done()
        })
        parse(null)
    })

    it('should error if not complete', function(done) {
        xml.parse("<root", function(err, root) {
            assert.ok(err, "Parser should have returned an error on parse if incomplete")
            done()
        })
    })

    it('should parse some xml', function(done) {
        
        xml.parse("<root><one>hello</one><two att='value'/></root>", function(err, root) {
            
            assert.ifError(err)
            assert.ok(root.toString())
        
            root.on('one', function(node) {
                assert.equal(node.text, "hello")
                
                root.on('two', function(node) {
                    assert.equal(node.attr('att'), "value")
                    
                    root.onEnd(function() {
                        done()
                    })
                })
            })
        })
    })

    it('should parse a stream', function(done) {
        var parse = xml.parser(function(err, root) {
            var names = []
            root.on('name', function(name) {
                names.push(name.text)
            })
            root.onEnd(function() {
                assert.equal(names.length, 4)
                done()
            })
        })

        parse("<roo")
        parse("t><name>henry</name><name>bo")
        parse("b</name><name>john</na")
        parse("me><name>will</name></root>")
    })
})

