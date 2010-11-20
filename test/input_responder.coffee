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
		test.accept("B|67|43|00016 Corp")
		test.accept("B|30|28|00001 Corp")
		test.accept("B|10|0|Statistical Outlier Inc")
		test.accept("B|73|50|00023 Corp")
		test.accept("B|10|0|Statistical Outlier Inc")
		test.accept("B|10|0|Statistical Outlier Inc")
		test.accept("B|41|68|00041 Corp")
		test.accept("B|67|57|00030 Corp")
		test.done()
