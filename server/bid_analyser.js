(function() {
  var BidAnalyser;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  BidAnalyser = function(shares, db, responder) {
    var _this;
    _this = this;
    this.generateSummary = function(){ return BidAnalyser.prototype.generateSummary.apply(_this, arguments); };
    if (!(typeof db !== "undefined" && db !== null)) {
      throw {
        message: "Must pass BidAnalyser a database to work with!"
      };
    }
    this.database = db;
    this.shares = shares;
    if (typeof responder !== "undefined" && responder !== null) {
      this.watchResponder(responder);
    }
    return this;
  };
  BidAnalyser.prototype.watchResponder = function(responder) {
    return responder.on("summaryRequest", this.generateSummary);
  };
  BidAnalyser.prototype.generateSummary = function() {
    return this.getClearingPrice(function(error, price) {
      if (error) {
        throw error;
      }
      return console.log("Clearing price is " + (price));
    });
  };
  BidAnalyser.prototype.getClearingPrice = function(callback) {
    var client;
    console.log("Generating Summary");
    client = this.database.client;
    return client.zcard("bIds", __bind(function(error, count) {
      var chunkSize, chunks, currentChunk, getNextChunk, processChunk, sharesSold, targetShares;
      if (typeof error !== "undefined" && error !== null) {
        throw error;
      }
      console.log("" + (count) + " bids total.");
      chunkSize = 1000;
      chunks = Math.ceil(count / chunkSize);
      currentChunk = 0;
      sharesSold = 0;
      targetShares = this.shares;
      processChunk = function(data) {
        var price, shares;
        ("Processing chunk " + (currentChunk));
        console.log(data);
        while (data.length > 0) {
          price = data.pop;
          shares = data.pop;
          sharesSold += parseFloat(price) * parseFloat(shares);
          console.log(sharesSold);
          if (sharesSold > targetShares) {
            callback(null, price);
            return null;
          }
        }
        return !(currentChunk >= chunks) ? getNextChunk() : callback({
          message: "Not enough shares to generate a summary!"
        });
      };
      getNextChunk = function() {
        client.sort(["bIds", "LIMIT", currentChunk * chunkSize, chunkSize, "GET", "bid_*->price", "GET", "bid_*->shares"], function(err, reply) {
          if (typeof err !== "undefined" && err !== null) {
            throw err;
          }
          return processChunk(reply);
        });
        return currentChunk += 1;
      };
      return getNextChunk();
    }, this));
  };
  BidAnalyser.prototype.clearingValue = function() {};
  exports.BidAnalyser = BidAnalyser;
}).call(this);
