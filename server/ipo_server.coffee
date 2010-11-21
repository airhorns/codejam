fs = require('fs')
config = require('yaml').eval(fs.readFileSync('./../public/config.yaml', 'utf8'))

require.paths.unshift('.')
hexy = require("hexy")
net = require('net')
InputResponder = require('./input_responder.js').InputResponder
BidDatabase = require('./bid_database.js').BidDatabase
BidAnalyser = require('./bid_analyser.js').BidAnalyser

server = net.createServer (stream) ->
	stream.removeAllListeners 'error'
	stream.on 'error', (error) ->
		console.log("Node errror!", error)

	stream.setEncoding 'ascii'

	buffer = ""
	stream.on 'data', (data) ->
		return unless data.length > 0
		buffer += data
		lineEnd = buffer.indexOf("\r\n")
		if lineEnd
			data = buffer.substring(0, lineEnd)
			retStr = responder.parseInput(data)
			stream.write(retStr, 'ascii')
			buffer = buffer.substring(data.length + 1, buffer.length)
			return
			# console.log(hexy.hexy(data))
			# console.log(hexy.hexy(retStr))
			# console.log("Message "+data+" being returned "+retStr)
		else
			# Maximum message length is 52 chars (1 | 8 | 8 | 32)
			if buffer.length > 52
				stream.write(responder.ERRORSTRING, 'ascii')
				return
		return

	stream.on 'end', () ->
		stream.end()

# Initialize our components
responder = new InputResponder(config)
database = new BidDatabase()
database.watchResponder(responder)
# database.reInitialize()
analyser = new BidAnalyser(config.clearingShares, database, responder)

server.maxConnections = 10000
server.listen(config.port)
