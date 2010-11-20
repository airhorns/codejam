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
	app.set('view engine', 'hamljs')


app.configure 'development', () ->
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))


app.configure 'production', () ->
  app.use(express.errorHandler())

app.get '/', (req, res) ->
    res.render('index.haml')


io = require('socket.io')
io.listen(app)

io.on 'connection', () ->

io.on 'message', (data) ->
  alert(data)

io.on 'disconnect', ->

db.client.on "message", (channel, message) ->
	return unless channel == "bids"
	io.broadcast(message)

db.client.subscribe("bids")

app.listen(3000)
