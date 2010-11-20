require.paths.unshift('.')

var net = require('net');
var InputResponder = require('./input_responder.js').InputResponder;
var BidDatabase = require('./bid_database.js').BidDatabase;
var server = net.createServer( function (stream) {
	responder = new InputResponder();
	database = new BidDatabase();
	database.watchResponder(responder);
	stream.setEncoding('ascii');
	stream.on('data', function(data){
		var retStr = responder.parseInput(data.toString());
		console.log("Message "+data+" being returned "+retStr);
		stream.write(retStr);
	});

	stream.on('end', function(){
		stream.end();
	});
});

server.listen(8124, 'localhost');
