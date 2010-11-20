class InputResponder
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
		
		lastchar1 = inputString.charAt(inputString.length-2)
		lasrchar2 = inputString.charAt(inputString.length-1)
		# if (lastchar1 != "\\r" ) || (lastchar1 != "\\r" )
		# 	return ERRORSTRING

		stringSplit = inputString.split("|")

		# Ensure string was split and stuff
		unless stringSplit[0]? && typeof stringSplit[0] == "string" && stringSplit[1]?
			return @ERRORSTRING
		
		switch stringSplit[0].toUpperCase
			when "B" then	return this.parseSubmission(stringSplit, inputString)
			when "C" then return this.parseClose(stringSplit, inputString)
			when "S" then	return this.parseSummary(stringSplit, inputString)
			else return @ERRORSTRING

	parseSubmission: (split, full) ->
		bidAmount = parseFloat(split[1])
		
		if bidAmount > @MAXBIDATONCE
			return @ERRORSTRING
				
		if (stringSplit[2] < @MINBIDVALUE) || (stringSplit[2] > @MAXBIDVALUE)
			return @ERRORSTRING

		return @ACCEPTSTRING

	parseClose: (split, full) ->
		if full != "C|TERMINATE\r\n"
			#return input error
			return @ERRORSTRING
		else
			#terminate bid submission
			@acceptingBids = false
			return @ACCEPTSTRING
			#send returnString

	parseSummary: (split, full) ->
		if inputString != "S|SUMMARY\r\n"
			#malformed request
			return @ERRORSTRING
		else
			#print to stdout or something
			return @ACCEPTSTRING

exports.InputResponder = InputResponder
