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
    this.responder = responder;
    return responder.on("summaryRequest", __bind(function() {
      return this.generateSummary(true);
    }, this));
  };
  BidAnalyser.prototype.generateSummary = function(output, callback) {
    var obj;
    obj = {
      bids: {}
    };
    obj.status = this.responder.acceptingBids ? "OPEN" : "CLOSED";
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
    var clearingPrice, sharesSold, targetShares;
    sharesSold = 0;
    targetShares = this.shares;
    clearingPrice = null;
    return this.database.fetchBidsInChunks(function(error, bids) {
      var _i, _len, _ref, bid, key;
      if (typeof error !== "undefined" && error !== null) {
        throw error;
      }
      if (!(typeof bids !== "undefined" && bids !== null) || !(typeof (_ref = bids.length) !== "undefined" && _ref !== null)) {
        console.log("Unable to get clearing price, needed " + (targetShares) + " and only had " + (this.count));
        callback(null, null);
        return null;
      }
      _ref = bids;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        bid = _ref[_i];
        sharesSold += bid.price * bid.shares;
        if (memo) {
          key = "$" + String(bid.price);
          memo.bids[key] = (typeof memo.bids[key] !== "undefined" && memo.bids[key] !== null) ? memo.bids[key] : 0;
          memo.bids[key] += bid.shares;
        }
        if (sharesSold > targetShares) {
          clearingPrice = bid.price;
        }
      }
      return this.tryNextChunk(function() {
        if (sharesSold > targetShares) {
          if (typeof memo !== "undefined" && memo !== null) {
            memo.clearingPrice = clearingPrice;
            memo.totalBids = this.count;
          }
          callback(null, clearingPrice);
          return true;
        } else {
          console.log("Unable to get clearing price, needed " + (targetShares) + " and only had " + (sharesSold));
          callback(null, null);
          return true;
        }
      });
    });
  };
  exports.BidAnalyser = BidAnalyser;
}).call(this);
