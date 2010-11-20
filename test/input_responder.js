(function() {
  var InputResponder, inputResponderWrap;
  InputResponder = require('../server/input_responder').InputResponder;
  inputResponderWrap = function(test) {
    var RESPONDER;
    RESPONDER = new InputResponder();
    test.accept = function(str) {
      return this.equal(RESPONDER.parseInput(str), RESPONDER.ACCEPTSTRING, "Responder doesn't respond right to " + (str) + ". Expected acceptance.");
    };
    test.error = function(str) {
      return this.equal(RESPONDER.parseInput(str), RESPONDER.ERRORSTRING, "Responder doesn't respond right to " + (str) + ". Expected error.");
    };
    return (test.closed = function(str) {
      return this.equal(RESPONDER.parseInput(str), RESPONDER.BIDCLOSEDSTRING, "Responder doesn't respond right to " + (str) + ". Expected closing.");
    });
  };
  exports.testBasicParsing = function(test) {
    inputResponderWrap(test);
    test.accept("B|67|43|00016 Corp\r\n");
    test.accept("B|30|28|00001 Corp\r\n");
    test.accept("B|10|0|Statistical Outlier Inc\r\n");
    test.accept("B|73|50|00023 Corp\r\n");
    test.accept("B|10|0|Statistical Outlier Inc\r\n");
    test.accept("B|10|0|Statistical Outlier Inc\r\n");
    test.accept("B|41|68|00041 Corp\r\n");
    test.accept("B|67|57|00030 Corp\r\n");
    return test.done();
  };
  exports.testMoreParsing = function(test) {
    inputResponderWrap(test);
    test.accept("B|1000|12|John Lobaugh\r\n");
    test.accept("B|00100|012| John Lobaugh \r\n");
    return test.done();
  };
  exports.testMalformed = function(test) {
    inputResponderWrap(test);
    test.error("|30|28|00001 Corp\r\n");
    test.error("B||0|Statistical Outlier Inc\r\n");
    test.error("BB|73|50|00023 Corp\r\n");
    test.error("B|1000000000000000000000|0|Statistical Outlier Inc\r\n");
    test.error("B|10|0|\r\n");
    test.error("B|41|68");
    test.error("B|67|5700030 Corp");
    return test.done();
  };
  exports.testSummary = function(test) {
    inputResponderWrap(test);
    test.accept("S|SUMMARY\r\n");
    return test.done();
  };
  exports.testStop = function(test) {
    inputResponderWrap(test);
    test.accept("C|TERMINATE\r\n");
    return test.done();
  };
  exports.testReset = function(test) {
    inputResponderWrap(test);
    test.accept("R\r\n");
    return test.done();
  };
}).call(this);
