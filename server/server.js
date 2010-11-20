require.paths.unshift('.')

var net = require('net');
var parseInput = require('parse_input').parseInput;

var server = net.createServer( function (stream) {
	stream.setEncoding('ascii');
	stream.on('data', function(data){
		var retStr = parseInput(data);
		console.log(retStr);
		stream.write(retStr);
	});
	stream.on('end', function(){
		stream.end();
	});
});

server.listen(8124, 'localhost');
