(function() {
  var BidAnalyser, BidDatabase, Redis, analyser, app, db, express, io, redisSubscriber, socket;
  BidDatabase = require('../server/bid_database.js').BidDatabase;
  BidAnalyser = require('../server/bid_analyser.js').BidAnalyser;
  Redis = require("redis");
  db = new BidDatabase();
  analyser = new BidAnalyser(100000, db);
  express = require('express');
  app = express.createServer();
  app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyDecoder());
    app.use(app.router);
    return app.use(express.staticProvider(__dirname + '/public'));
  });
  app.set('view engine', 'jade');
  app.configure('development', function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  app.configure('production', function() {
    return app.use(express.errorHandler());
  });
  app.get('/', function(req, res) {
    return res.render('index');
  });
  io = require('socket.io');
  socket = io.listen(app);
  socket.on('connection', function(browser) {
    return db.fetchBidsInChunks(function(error, data) {
      var bId, bidder, price, shares, time;
      if (typeof error !== "undefined" && error !== null) {
        console.log(error);
        return false;
      } else {
        while ((typeof data !== "undefined" && data !== null) && data.length > 0) {
          bId = parseFloat(data.pop().toString('ascii'));
          shares = parseFloat(data.pop().toString('ascii'));
          price = parseFloat(data.pop().toString('ascii'));
          bidder = data.pop().toString('ascii');
          time = data.pop().toString('ascii');
          browser.send(JSON.stringify({
            bId: bId,
            shares: shares,
            price: price,
            bidder: bidder,
            time: new Date(time)
          }));
        }
        return this.tryNextChunk();
      }
    });
  });
  socket.on('message', function(data) {
    return alert(data);
  });
  socket.on('disconnect', function() {});
  redisSubscriber = Redis.createClient();
  redisSubscriber.on("message", function(channel, message) {
    if (channel !== "bids") {
      return null;
    }
    console.log("broadcasting message " + (message));
    return socket.broadcast(message);
  });
  redisSubscriber.subscribe("bids");
  app.listen(3000);
}).call(this);
