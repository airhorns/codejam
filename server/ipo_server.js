(function() {
  var BidAnalyser, BidDatabase, CLEARINGSHARES, InputResponder, analyser, database, hexy, net, responder, server;
  CLEARINGSHARES = 1000000;
  require.paths.unshift('.');
  hexy = require("hexy");
  net = require('net');
  InputResponder = require('./input_responder.js').InputResponder;
  BidDatabase = require('./bid_database.js').BidDatabase;
  BidAnalyser = require('./bid_analyser.js').BidAnalyser;
  server = net.createServer(function(stream) {
    var buffer;
    stream.removeAllListeners('error');
    stream.on('error', function(error) {
      return console.log("Node errror!", error);
    });
    stream.setEncoding('ascii');
    buffer = "";
    stream.on('data', function(data) {
      var lineEnd, retStr;
      buffer += data;
      lineEnd = buffer.indexOf("\r\n");
      if (lineEnd) {
        data = buffer.substring(0, lineEnd);
        buffer = buffer.substring(data.length + 1, buffer.length);
        retStr = responder.parseInput(data);
      }
      return stream.write(retStr);
    });
    return stream.on('end', function() {
      return stream.end();
    });
  });
  responder = new InputResponder();
  database = new BidDatabase();
  database.watchResponder(responder);
  analyser = new BidAnalyser(CLEARINGSHARES, database, responder);
  server.maxConnections = 10000;
  server.listen(8124);
}).call(this);
