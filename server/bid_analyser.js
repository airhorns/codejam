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
  BidAnalyser.prototype.outputSummary = function(details) {
    var _ref, _result, price, shares;
    console.log("Auction Status " + (details.status));
    console.log("Clearing Price " + (details.clearingPrice || "Not Enough Bids"));
    console.log("Bid Price  Total Shares");
    _result = []; _ref = details.bids;
    for (price in _ref) {
      if (!__hasProp.call(_ref, price)) continue;
      shares = _ref[price];
      _result.push(console.log("" + (price) + "     " + (shares)));
    }
    return _result;
  };
  BidAnalyser.prototype.getClearingPrice = function(memo, callback) {
    var sharesSold, targetShares;
    sharesSold = 0;
    targetShares = 100000;
    return this.database.fetchBidsInChunks(function(error, data) {
      var key, price, shares;
      if (typeof error !== "undefined" && error !== null) {
        throw error;
      }
      while ((typeof data !== "undefined" && data !== null) && data.length > 0) {
        data.pop();
        shares = parseFloat(data.pop().toString('ascii'));
        price = parseFloat(data.pop().toString('ascii'));
        data.pop();
        data.pop();
        if ((typeof price !== "undefined" && price !== null) && (typeof shares !== "undefined" && shares !== null)) {
          sharesSold += price * shares;
          if (memo) {
            key = "$" + String(price);
            memo.bids[key] = (typeof memo.bids[key] !== "undefined" && memo.bids[key] !== null) ? memo.bids[key] : 0;
            memo.bids[key] += shares;
          } else {
            callback({
              message: "Can't parse out the price/share information from the database!"
            }, null);
            return false;
          }
        }
      }
      return this.tryNextChunk(function() {
        if (sharesSold > targetShares) {
          memo.clearingPrice = price;
          memo.totalBids = this.count;
          callback(null, price);
          return true;
        } else {
          return callback({
            message: "Not enough shares to generate a summary!"
          }, null);
        }
      });
    });
  };
  exports.BidAnalyser = BidAnalyser;
}).call(this);
