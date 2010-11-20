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
    test.accept("B|67|43|00016 Corp");
    test.accept("B|30|28|00001 Corp");
    test.accept("B|10|0|Statistical Outlier Inc");
    test.accept("B|73|50|00023 Corp");
    test.accept("B|10|0|Statistical Outlier Inc");
    test.accept("B|10|0|Statistical Outlier Inc");
    test.accept("B|41|68|00041 Corp");
    test.accept("B|67|57|00030 Corp");
    return test.done();
  };
}).call(this);
