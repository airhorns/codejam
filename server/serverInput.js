
//assuming data is string

var acceptingBids = true;
var MINBIDVALUE = 30;
var MAXBIDVALUE = 100;
var MAXBIDATONCE = 10000;

var ACCEPTSTRING="A\r\n";
var ERRORSTRING="E\r\n";
var BIDCLOSEDSTRING="C\r\n";

var sendBack = function(data){
	console.log(data);
	;
}

var testStr1="C|TERMINATE\r\n";



var parseInput = function(inputString){

	if( !acceptingBids){
		//return error: not acepting bids anymore			
		sendBack(BIDCLOSEDSTRING);
		return;
	}
	var lastchar1 = inputString.charAt(inputString.length-2);
	var lasrchar2 = inputString.charAt(inputString.length-1);
	if( (lastchar1 != "\r" ) || (lastchar1 != "\r" ) ){
		sendBack(ERRORSTRING);
		return;
	}
	var stringSplit = inputString.split("|");
	if (typeof stringSplit[1] == "undefined"){
		sendBack(ERRORSTRING);
		return;
	}	
	
	if(stringSplit[0] == "B"){ //or lowercase
		
		var bidAmount=parseFloat(stringSplit[1]);
		if( bidAmount > MAXBIDATONCE){
			sendBack(ERRORSTRING);
			return;
		}
		if(( stringSplit[2] < MINBIDVALUE) || (stringSplit[2] > MAXBIDVALUE) ){
			sendBack(ERRORSTRING);
			return;
		}
		
		//verify using regex
		
		//do shit
		sendBack(ACCEPTSTRING);
		return;
	
	}
	else if ( stringSplit[0] == "C" ){
		if(!acceptingBids){
			//return error: bidding is already closed
			sendBack(ERRORSTRING);
			return;
		}
		if(inputString != "C|TERMINATE\r\n"){
			//return input error
			sendBack(ERRORSTRING);
			return;
		}else{
			//terminate bid submission
			acceptingBids = false;
			sendBack(ACCEPTSTRING);
			return;
			//send returnString
		}
	
	}
	else if ( stringSplit[0] == "S"){
		if(inputString != "S|SUMMARY\r\n" ){
			//malformed request
			sendBack(ERRORSTRING);
			return;
		}else{
		
			//print to stdout or something
			sendBack(ACCEPTSTRING);
			return;
		}
	}
	else {
		//return error: malformed request
		sendBack(ERRORSTRING);
		return;
	
	}
}

var crap = parseInput(testStr1);
var crap = parseInput(testStr1);