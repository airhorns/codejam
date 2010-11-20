var CLEARINGSHARES = 1000000
require.paths.unshift('.');
var hexy = require("hexy");
var database, responder, analyser;
var net = require('net');
var InputResponder = require('./input_responder.js').InputResponder;
var BidDatabase = require('./bid_database.js').BidDatabase;
var BidAnalyser = require('./bid_analyser.js').BidAnalyser; 
var server = net.createServer( function (stream) {
	stream.removeAllListeners('error');
	stream.on('error', function(error) {
		console.log("Node errror!", error);
	});

	stream.setEncoding('ascii');
	buffer = ""; 
	stream.on('data', function(data){
		buffer += data;
  	lineEnd = buffer.indexOf("\r\n");  
		if (lineEnd) {
      data = buffer.substring(0, lineEnd);  
      buffer = buffer.substring(data.length + 1, buffer.length);  
      retStr = responder.parseInput(data);
			stream.write(retStr);
		}
			
		// console.log(hexy.hexy(data));
		// console.log(hexy.hexy(retStr));
		// console.log("Message "+data+" being returned "+retStr);
		// 
	});
	stream.on('end', function(){
		stream.end();
	});
});

// Initialize our components
responder = new InputResponder();
database = new BidDatabase();
database.watchResponder(responder);
database.reInitialize();
analyser = new BidAnalyser(CLEARINGSHARES, database, responder);

server.listen(8124, 'localhost');
