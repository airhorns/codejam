(function() {
  var InputResponder;
  InputResponder = function() {};
  InputResponder.prototype.MINBIDVALUE = 0;
  InputResponder.prototype.MAXBIDVALUE = 100;
  InputResponder.prototype.MAXBIDATONCE = 10000;
  InputResponder.prototype.TOTALSHARES = 1000;
  InputResponder.prototype.ACCEPTSTRING = "A\r\n";
  InputResponder.prototype.ERRORSTRING = "E\r\n";
  InputResponder.prototype.BIDCLOSEDSTRING = "C\r\n";
  InputResponder.prototype.acceptingBids = true;
  InputResponder.prototype.parseInput = function(inputString) {
    var _ref, lasrchar2, lastchar1, stringSplit;
    if (!(this.acceptingBids)) {
      return this.BIDCLOSEDSTRING;
    }
    lastchar1 = inputString.charAt(inputString.length - 2);
    lasrchar2 = inputString.charAt(inputString.length - 1);
    stringSplit = inputString.split("|");
    if (!((typeof (_ref = stringSplit[0]) !== "undefined" && _ref !== null) && typeof stringSplit[0] === "string" && (typeof (_ref = stringSplit[1]) !== "undefined" && _ref !== null))) {
      return this.ERRORSTRING;
    }
    switch (stringSplit[0].toUpperCase) {
      case "B":
        return this.parseSubmission(stringSplit, inputString);
      case "C":
        return this.parseClose(stringSplit, inputString);
      case "S":
        return this.parseSummary(stringSplit, inputString);
      default:
        return this.ERRORSTRING;
    }
  };
  InputResponder.prototype.parseSubmission = function(split, full) {
    var bidAmount;
    bidAmount = parseFloat(split[1]);
    if (bidAmount > this.MAXBIDATONCE) {
      return this.ERRORSTRING;
    }
    if ((stringSplit[2] < this.MINBIDVALUE) || (stringSplit[2] > this.MAXBIDVALUE)) {
      return this.ERRORSTRING;
    }
    return this.ACCEPTSTRING;
  };
  InputResponder.prototype.parseClose = function(split, full) {
    if (full !== "C|TERMINATE\r\n") {
      return this.ERRORSTRING;
    } else {
      this.acceptingBids = false;
      return this.ACCEPTSTRING;
    }
  };
  InputResponder.prototype.parseSummary = function(split, full) {
    if (inputString !== "S|SUMMARY\r\n") {
      return this.ERRORSTRING;
    } else {
      return this.ACCEPTSTRING;
    }
  };
  exports.InputResponder = InputResponder;
}).call(this);
