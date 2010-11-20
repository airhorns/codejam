(function() {
  var BidAnalyser;
  BidAnalyser = function(db, responder) {
    var _this;
    _this = this;
    this.generateSummary = function(){ return BidAnalyser.prototype.generateSummary.apply(_this, arguments); };
    if (!(typeof db !== "undefined" && db !== null)) {
      throw {
        message: "Must pass BidAnalyser a database to work with!"
      };
    }
    this.database = db;
    if (typeof responder !== "undefined" && responder !== null) {
      this.watchResponder(responder);
    }
    return this;
  };
  BidAnalyser.prototype.watchResponder = function(responder) {
    return responder.on("summaryRequest", this.generateSummary);
  };
  BidAnalyser.prototype.generateSummary = function() {
    console.log("Generating Summary");
    return this.database.client.zcard("bids", function(error, count) {
      return console.log(count);
    });
  };
  BidAnalyser.prototype.clearingValue = function() {};
  exports.BidAnalyser = BidAnalyser;
}).call(this);
