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
	stream.on('data', function(data){
		var retStr = responder.parseInput(data);
		console.log(hexy.hexy(data));
		console.log(hexy.hexy(retStr));
		console.log("Message "+data+" being returned "+retStr);
		
		stream.write(retStr);
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
analyser = new BidAnalyser(database, responder);

server.listen(8124, 'localhost');
