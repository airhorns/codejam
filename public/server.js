(function() {
  var BidAnalyser, BidDatabase, Redis, analyser, app, config, db, express, fs, io, redisSubscriber, socket, summaryRunning;
  fs = require('fs');
  config = require('yaml').eval(fs.readFileSync('./../public/config.yaml', 'utf8'));
  BidDatabase = require('../server/bid_database.js').BidDatabase;
  BidAnalyser = require('../server/bid_analyser.js').BidAnalyser;
  Redis = require("redis");
  db = new BidDatabase();
  analyser = new BidAnalyser(config.clearingShares, db);
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
      var bid, _i, _len;
      if ((error != null) || !(bids != null)) {
        console.log(error);
        return false;
      } else {
        for (_i = 0, _len = bids.length; _i < _len; _i++) {
          bid = bids[_i];
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
      return;
    }
    return socket.broadcast(message);
  });
  redisSubscriber.subscribe("bids");
  summaryRunning = false;
  setInterval(function() {
    if (summaryRunning) {
      return;
    }
    summaryRunning = true;
    return analyser.getClearingPrice(null, function(error, price) {
      if (error != null) {
        return console.log(error);
      } else {
        if (price != null) {
          socket.broadcast(JSON.stringify({
            summary: {
              clearingPrice: price
            }
          }));
        } else {
          console.log("Unable to get clearing price!", error, price);
        }
        return summaryRunning = false;
      }
    });
  }, 2000);
  app.listen(config.webServerPort);
}).call(this);
