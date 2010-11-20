var net = require('net');
var acceptingBids = true;
var MINBIDVALUE = 0;
var MAXBIDVALUE = 100;
var MAXBIDATONCE = 10000;
var TOTALSHARES= 1000;
var PORTNUM = 8124;

var ACCEPTSTRING="A\r\n";
var ERRORSTRING="E\r\n";
var BIDCLOSEDSTRING="C\r\n";

var sendBack = function(data){
	console.log(data);
	;
}

var testStr1="C|TERMINATE\r\n";



var parseInput = function(inputString){
	return ACCEPTSTRING;
	if( !acceptingBids){
		//return error: not acepting bids anymore			
		return(BIDCLOSEDSTRING);
	}
	var lastchar1 = inputString.charAt(inputString.length-2);
	var lasrchar2 = inputString.charAt(inputString.length-1);
	/*if( (lastchar1 != "\r" ) || (lastchar1 != "\r" ) ){
		return(ERRORSTRING);
	}*/
	var stringSplit = inputString.split("|");
	if (typeof stringSplit[1] == "undefined"){
		return(ERRORSTRING);
	}	
	
	if(stringSplit[0] == "B"){ //or lowercase
		
		var bidAmount=parseFloat(stringSplit[1]);
		if( bidAmount > MAXBIDATONCE){
			return(ERRORSTRING);
		}
		if(( stringSplit[2] < MINBIDVALUE) || (stringSplit[2] > MAXBIDVALUE) ){
			return(ERRORSTRING);
		}
		
		//verify using regex
		
		//do shit
		return(ACCEPTSTRING);
	
	}
	else if ( stringSplit[0] == "C" ){
		if(!acceptingBids){
			//return error: bidding is already closed
			return(ERRORSTRING);
		}
		if(inputString != "C|TERMINATE\r\n"){
			//return input error
			return(ERRORSTRING);
		}else{
			//terminate bid submission
			acceptingBids = false;
			return(ACCEPTSTRING);
			//send returnString
		}
	
	}
	else if ( stringSplit[0] == "S"){
		if(inputString != "S|SUMMARY\r\n" ){
			//malformed request
			return(ERRORSTRING);
		}else{
		
			//print to stdout or something
			return(ACCEPTSTRING);
		}
	}
	else {
		//return error: malformed request
		return(ERRORSTRING);
	}
}

var server = net.createServer( function (stream) {
	stream.setEncoding('ascii');
	stream.on('data', function(data){
		var retStr= parseInput(data);
		stream.write(retStr);
	});
	stream.on('end', function(){
		stream.end();
	});
});

server.listen(PORTNUM, 'localhost');
