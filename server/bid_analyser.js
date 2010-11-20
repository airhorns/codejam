(function() {
  var BidAnalyser;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __hasProp = Object.prototype.hasOwnProperty;
  BidAnalyser = function(shares, db, responder) {
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
    return responder.on("summaryRequest", __bind(function() {
      return this.generateSummary(true);
    }, this));
  };
  BidAnalyser.prototype.generateSummary = function(output, callback) {
    var obj;
    obj = {
      bids: {}
    };
    obj.status = this.database.acceptingBids ? "OPEN" : "CLOSED";
    return this.getClearingPrice(obj, __bind(function(error, price) {
      if (typeof error !== "undefined" && error !== null) {
        throw error;
      }
      if (typeof output !== "undefined" && output !== null) {
        this.outputSummary(obj);
      }
      if (typeof callback !== "undefined" && callback !== null) {
        return callback(obj);
      }
    }, this));
  };
  BidAnalyser.prototype.outputSummary = function(memo) {
    var _ref, _result, price, shares;
    console.log("Auction Status " + (memo.status));
    console.log("Clearing Price " + (memo.clearingPrice || "Not Enough Bids"));
    console.log("Bid Price  Total Shares");
    _result = []; _ref = memo.bids;
    for (price in _ref) {
      if (!__hasProp.call(_ref, price)) continue;
      shares = _ref[price];
      _result.push(console.log("" + (price) + "     " + (shares)));
    }
    return _result;
  };
  BidAnalyser.prototype.getClearingPrice = function(memo, callback) {
    var client;
    console.log("Generating Summary");
    client = this.database.client;
    return client.scard("bIds", __bind(function(error, count) {
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
        var key, price, shares;
        ("Processing chunk " + (currentChunk));
        console.log(data.length);
        while (data.length > 0) {
          shares = parseFloat(data.pop().toString('ascii'));
          price = parseFloat(data.pop().toString('ascii'));
          if ((typeof price !== "undefined" && price !== null) && (typeof shares !== "undefined" && shares !== null)) {
            sharesSold += price * shares;
            if (memo) {
              key = "$" + String(price);
              memo.bids[key] = (typeof memo.bids[key] !== "undefined" && memo.bids[key] !== null) ? memo.bids[key] : 0;
              memo.bids[key] += shares;
            }
          } else {
            callback({
              message: "Can't parse out the price/share information from the database!"
            }, null);
            return false;
          }
          if (sharesSold > targetShares) {
            memo.clearingPrice = price;
            callback(null, price);
            return true;
          }
        }
        if (!(currentChunk >= chunks)) {
          return getNextChunk();
        } else {
          callback({
            message: "Not enough shares to generate a summary!"
          }, null);
          return false;
        }
      };
      getNextChunk = function() {
        client.sort(["bIds", "BY", "bid_*->price", "DESC", "LIMIT", currentChunk * chunkSize, chunkSize, "GET", "bid_*->price", "GET", "bid_*->shares"], function(err, reply) {
          console.log("Got chunk");
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
