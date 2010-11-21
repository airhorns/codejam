BidDatabase = require('../server/bid_database.js').BidDatabase
BidAnalyser = require('../server/bid_analyser.js').BidAnalyser
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

app.listen(3000)

io = require('socket.io')
socket = io.listen(app)

socket.on 'connection', () ->
	
socket.on 'message', (data) ->
  alert(data)

socket.on 'disconnect', ->

db.client.on "message", (channel, message) ->
	return unless channel == "bids"
	console.log("broadcasting message #{message}")
	socket.broadcast(message)

db.client.subscribe("bids")

