(function() {
  var BidAnalyser, BidDatabase, analyser, app, db, express, io, socket;
  BidDatabase = require('../server/bid_database.js').BidDatabase;
  BidAnalyser = require('../server/bid_analyser.js').BidAnalyser;
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
  app.listen(3000);
  io = require('socket.io');
  socket = io.listen(app);
  socket.on('connection', function() {});
  socket.on('message', function(data) {
    return alert(data);
  });
  socket.on('disconnect', function() {});
  db.client.on("message", function(channel, message) {
    if (channel !== "bids") {
      return null;
    }
    console.log("broadcasting message " + (message));
    return socket.broadcast(message);
  });
  db.client.subscribe("bids");
}).call(this);
