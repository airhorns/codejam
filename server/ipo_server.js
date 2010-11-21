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
      if (!(data.length > 0)) {
        return null;
      }
      buffer += data;
      lineEnd = buffer.indexOf("\r\n");
      if (lineEnd) {
        data = buffer.substring(0, lineEnd);
        retStr = responder.parseInput(data);
        stream.write(retStr, 'ascii');
        buffer = buffer.substring(data.length + 1, buffer.length);
        return null;
      } else {
        if (buffer.length > 52) {
          stream.write(responder.ERRORSTRING, 'ascii');
          return null;
        }
      }
      return null;
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
