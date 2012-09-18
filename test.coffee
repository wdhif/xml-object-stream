assert = require 'assert'
{Stream} = require 'stream'
{parse} = require './index'

describe "xml streamer thing", ->

  it "should parse", (done) ->
    stream = new Stream()
    foundBook = false

    parser = parse stream
    parser.each 'book', (book) ->
      console.log "BOOK", book
      foundBook = true
      assert.ok book
      assert.equal book.$.asdf, "asdf"
      assert.equal book.title.$text, "Title"
      assert.equal book.description.$text, "stuff"

      authors = book.$children.filter (node) -> node.$name is "author"
      assert.equal authors.length, 2
      assert.equal authors[0].$.name, "john"
      assert.equal authors[1].name.$text, "will"

    parser.on 'end', ->
      console.log 'ended'
      assert.ok foundBook
      done()

    xml = """
    <root>
      <book asdf="asdf">
        <author name="john"></author>
        <author><name>will</name></author>
        <title>Title</title>
        <description>stuff</description>
      </book>
    </root>
    """

    stream.emit 'data', xml
    stream.emit 'end'


