require.paths.unshift('.');
var hexy = require("hexy");
var database, responder;
var net = require('net');
var InputResponder = require('./input_responder.js').InputResponder;
var BidDatabase = require('./bid_database.js').BidDatabase;

var server = net.createServer( function (stream) {
	stream.setEncoding('ascii');
	stream.on('data', function(data){
		var retStr = responder.parseInput(data);
		// console.log(hexy.hexy(data));
		// console.log(hexy.hexy(retStr));
		// console.log("Message "+data+" being returned "+retStr);
		
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

server.listen(8124, 'localhost');
