(function() {
  var EventEmitter, InputResponder;
  var __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  EventEmitter = require('events').EventEmitter;
  InputResponder = function(config) {
    this.MINBIDVALUE = config.minSharePrice;
    this.MAXBIDVALUE = config.maxSharePrice;
    this.MAXBIDATONCE = config.maxSharesPerBid;
    return this;
  };
  __extends(InputResponder, EventEmitter);
  InputResponder.prototype.MINBIDVALUE = 0;
  InputResponder.prototype.MAXBIDVALUE = 0;
  InputResponder.prototype.MAXBIDATONCE = 0;
  InputResponder.prototype.ACCEPTSTRING = "A\r\n";
  InputResponder.prototype.ERRORSTRING = "E\r\n";
  InputResponder.prototype.BIDCLOSEDSTRING = "C\r\n";
  InputResponder.prototype.acceptingBids = true;
  InputResponder.prototype.parseInput = function(inputString) {
    var _ref, stringSplit;
    inputString = inputString.replace(/[\s\u0000\u0012]*$/mig, "").replace(/^[\s\u0000\u0012]*/mig, "");
    stringSplit = inputString.split("|");
    if (!((typeof (_ref = stringSplit[0]) !== "undefined" && _ref !== null) && typeof stringSplit[0] === "string")) {
      return this.ERRORSTRING;
    }
    switch (stringSplit[0].toUpperCase()) {
      case "B":
        return this.parseSubmission(stringSplit, inputString);
      case "C":
        return this.parseClose(stringSplit, inputString);
      case "S":
        return this.parseSummary(stringSplit, inputString);
      case "R":
        return this.parseReset(stringSplit, inputString);
      default:
        return this.ERRORSTRING;
    }
  };
  InputResponder.prototype.parseSubmission = function(split, full) {
    var _ref, price, shares;
    if (!(this.acceptingBids)) {
      return this.BIDCLOSEDSTRING;
    }
    shares = parseFloat(split[1]);
    price = parseFloat(split[2]);
    if (!((typeof full !== "undefined" && full !== null) && (typeof shares !== "undefined" && shares !== null) && (typeof price !== "undefined" && price !== null) && (typeof (_ref = split[3]) !== "undefined" && _ref !== null))) {
      return this.ERRORSTRING;
    }
    if (shares > this.MAXBIDATONCE) {
      return this.ERRORSTRING;
    }
    if ((price <= this.MINBIDVALUE) || (price >= this.MAXBIDVALUE)) {
      return this.ERRORSTRING;
    }
    this.emit("bidReceived", shares, price, split[3]);
    return this.ACCEPTSTRING;
  };
  InputResponder.prototype.parseClose = function(split, full) {
    if (full !== "C|TERMINATE") {
      return this.ERRORSTRING;
    } else {
      this.acceptingBids = false;
      this.emit("close");
      return this.ACCEPTSTRING;
    }
  };
  InputResponder.prototype.parseSummary = function(split, full) {
    if (full !== "S|SUMMARY") {
      return this.ERRORSTRING;
    } else {
      this.emit("summaryRequest");
      return this.ACCEPTSTRING;
    }
  };
  InputResponder.prototype.parseReset = function(split, full) {
    if (full !== "R") {
      return this.ERRORSTRING;
    } else {
      this.acceptingBids = true;
      this.emit("resetDatabase");
      return this.ACCEPTSTRING;
    }
  };
  exports.InputResponder = InputResponder;
}).call(this);
