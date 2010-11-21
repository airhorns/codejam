fs = require('fs')
config = require('yaml').eval(fs.readFileSync('./../public/config.yaml', 'utf8'))

BidDatabase = require('../server/bid_database.js').BidDatabase
BidAnalyser = require('../server/bid_analyser.js').BidAnalyser
Redis = require("redis")

db = new BidDatabase()
analyser = new BidAnalyser(config.clearingShares, db)
express = require('express')
app = express.createServer()

app.configure ->
  app.use(express.methodOverride())
  app.use(express.bodyDecoder())
  app.use(app.router)
  app.use(express.staticProvider(__dirname + '/public'))
	app.set('view engine', 'jade')


app.configure 'development', () ->
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))


app.configure 'production', () ->
  app.use(express.errorHandler())

app.get '/', (req, res) ->
  res.render('index')

io = require('socket.io')
socket = io.listen(app)

socket.on 'connection', (browser) ->
	db.fetchBidsInChunks((error, bids) ->
		if error? || !bids?
			console.log(error)
			return false
		else
			for bid in bids
				browser.send(JSON.stringify(bid))
			this.tryNextChunk()
	)
	
socket.on 'message', (data) ->
  alert(data)

socket.on 'disconnect', ->

redisSubscriber = Redis.createClient()

redisSubscriber.on "message", (channel, message) ->
	return unless channel == "bids"
	# console.log("broadcasting message #{message}")
	socket.broadcast(message)

redisSubscriber.subscribe("bids")

summaryRunning = false

setInterval(() ->
	return if summaryRunning
	# Broadcast summary every 2 seconds
	summaryRunning = true
	analyser.getClearingPrice null, (error, price) ->
		if error?
			console.log(error)
		else
			if price?
				socket.broadcast JSON.stringify {summary:{clearingPrice: price}}
			else
				console.log "Unable to get clearing price!", error, price
			summaryRunning = false
, 2000)

app.listen(config.webServerPort)
