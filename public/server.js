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
    return db.fetchBidsInChunks(function(error, bids) {
      var _i, _len, _ref, bid;
      if ((typeof error !== "undefined" && error !== null) || !(typeof bids !== "undefined" && bids !== null)) {
        console.log(error);
        return false;
      } else {
        _ref = bids;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          bid = _ref[_i];
          browser.send(JSON.stringify(bid));
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
    return socket.broadcast(message);
  });
  redisSubscriber.subscribe("bids");
  app.listen(3000);
}).call(this);
