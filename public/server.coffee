BidDatabase = require('../server/bid_database.js').BidDatabase
BidAnalyser = require('../server/bid_analyser.js').BidAnalyser
Redis = require("redis")

db = new BidDatabase()
analyser = new BidAnalyser(100000, db)
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
	db.fetchBidsInChunks((error, data) ->
		if error?
			console.log(error)
			return false
		else
			while data? && data.length > 0
				bId = parseFloat(data.pop().toString('ascii'))
				shares = parseFloat(data.pop().toString('ascii'))
				price = parseFloat(data.pop().toString('ascii'))
				bidder = data.pop().toString('ascii')
				time = data.pop().toString('ascii')
				browser.send(JSON.stringify({bId: bId, shares:shares, price:price, bidder:bidder, time: new Date(time)}))
			this.tryNextChunk()
	)
	
socket.on 'message', (data) ->
  alert(data)

socket.on 'disconnect', ->

redisSubscriber = Redis.createClient()

redisSubscriber.on "message", (channel, message) ->
	return unless channel == "bids"
	console.log("broadcasting message #{message}")
	socket.broadcast(message)

redisSubscriber.subscribe("bids")

app.listen(3000)

