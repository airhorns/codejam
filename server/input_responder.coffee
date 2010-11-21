EventEmitter = require('events').EventEmitter
class InputResponder extends EventEmitter
	MINBIDVALUE: 0
	MAXBIDVALUE: 100
	MAXBIDATONCE: 10000
	TOTALSHARES: 1000

	ACCEPTSTRING: "A\r\n"
	ERRORSTRING: "E\r\n"
	BIDCLOSEDSTRING: "C\r\n"

	# Start up accepting bids.
	acceptingBids: true
	parseInput: (inputString) ->
		# return error: not acepting bids anymore
		return @BIDCLOSEDSTRING unless @acceptingBids

		# Trim input string to get rid of any shenanigans
		inputString = inputString.replace(/[\s\u0000\u0012]*$/mig, "").replace(/^[\s\u0000\u0012]*/mig, "")
		stringSplit = inputString.split("|")

		unless stringSplit[0]? && typeof stringSplit[0] == "string"
			return @ERRORSTRING

		switch stringSplit[0].toUpperCase()
			when "B" then	return this.parseSubmission(stringSplit, inputString)
			when "C" then return this.parseClose(stringSplit, inputString)
			when "S" then	return this.parseSummary(stringSplit, inputString)
			when "R" then return this.parseReset(stringSplit, inputString)
			else return @ERRORSTRING

	parseSubmission: (split, full) ->
		shares = parseFloat(split[1])
		if shares > @MAXBIDATONCE
			return @ERRORSTRING
		
		price = parseFloat(split[2])
		if (price < @MINBIDVALUE) || (price > @MAXBIDVALUE)
			return @ERRORSTRING
		
		throw {message: "Bad parse!"} unless full? && shares? && price? && split[3]?
		this.emit("bidReceived", shares, price, split[3])
		return @ACCEPTSTRING

	parseClose: (split, full) ->
		if full != "C|TERMINATE"
			#return input error
			return @ERRORSTRING
		else
			#terminate bid submission
			@acceptingBids = false
			this.emit("close")
			return @ACCEPTSTRING
			#send returnString

	parseSummary: (split, full) ->
		if full != "S|SUMMARY"
			#malformed request
			return @ERRORSTRING
		else
			#print to stdout or something
			this.emit("summaryRequest")
			return @ACCEPTSTRING

	parseReset: (split, full) ->
		if full != "R"
			return @ERRORSTRING
		else
			@acceptingBids = true
			this.emit("resetDatabase")
			return @ACCEPTSTRING

exports.InputResponder = InputResponder
