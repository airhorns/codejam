InputResponder = require('../server/input_responder').InputResponder
inputResponderWrap = (test) ->
	RESPONDER = new InputResponder()
	test.accept = (str) ->
		this.equal(RESPONDER.parseInput(str), RESPONDER.ACCEPTSTRING, "Responder doesn't respond right to #{str}. Expected acceptance.")
	
	test.error = (str) ->
		this.equal(RESPONDER.parseInput(str), RESPONDER.ERRORSTRING, "Responder doesn't respond right to #{str}. Expected error.")
	
	test.closed = (str) ->
		this.equal(RESPONDER.parseInput(str), RESPONDER.BIDCLOSEDSTRING, "Responder doesn't respond right to #{str}. Expected closing.")


exports.testBasicParsing = (test) ->
	inputResponderWrap(test)
	test.accept("B|67|43|00016 Corp\r\n")
	test.accept("B|30|28|00001 Corp\r\n")
	test.accept("B|10|0|Statistical Outlier Inc\r\n")
	test.accept("B|73|50|00023 Corp\r\n")
	test.accept("B|10|0|Statistical Outlier Inc\r\n")
	test.accept("B|10|0|Statistical Outlier Inc\r\n")
	test.accept("B|41|68|00041 Corp\r\n")
	test.accept("B|67|57|00030 Corp\r\n")
	test.done()

exports.testMoreParsing = (test) ->
	inputResponderWrap(test)
	test.accept("B|1000|12|John Lobaugh\r\n")
	test.accept("B|00100|012| John Lobaugh \r\n")
	test.done()

exports.testNewLines = (test) ->
	inputResponderWrap(test)
	test.accept("\r\nB|1000|12|John Lobaugh")
	test.accept("\r\nB|00100|012| John Lobaugh ")
	test.accept("\u0000\u0012B|1000|12|John Lobaugh")
	test.accept("\u0000\u0012B|00100|012| John Lobaugh ")
	test.done()

exports.testMalformed = (test) ->
	inputResponderWrap(test)
	test.error("|30|28|00001 Corp\r\n")
	test.error("B||0|Statistical Outlier Inc\r\n")
	test.error("BB|73|50|00023 Corp\r\n")
	test.error("B|1000000000000000000000|0|Statistical Outlier Inc\r\n")
	test.error("B|10|0|\r\n")
	test.error("B|41|68")
	test.error("B|67|5700030 Corp")
	test.done()

exports.testSummary = (test) ->
	inputResponderWrap(test)
	test.accept("S|SUMMARY\r\n")
	test.done()

exports.testStop = (test) ->
	inputResponderWrap(test)
	test.accept("C|TERMINATE\r\n")
	test.done()

exports.testReset = (test) ->
	inputResponderWrap(test)
	test.accept("R\r\n")
	test.accept("\r\nR") # fucked up sample of what the old client is doing
	test.done()
