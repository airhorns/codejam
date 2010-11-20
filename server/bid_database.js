(function() {
  var BidDatabase, Redis;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  Redis = require("redis");
  BidDatabase = function(config, responder) {
    var _this;
    _this = this;
    this.reInitialize = function(){ return BidDatabase.prototype.reInitialize.apply(_this, arguments); };
    this.addBid = function(){ return BidDatabase.prototype.addBid.apply(_this, arguments); };
    this.client = Redis.createClient();
    this.client.on("error", __bind(function(err) {
      return console.log("Redis connection error to " + this.client.host + ":" + this.client.port + " - " + err);
    }, this));
    return this;
  };
  BidDatabase.prototype.watchResponder = function(responder) {
    var _ref;
    if (typeof (_ref = responder.eventEmitter) !== "undefined" && _ref !== null) {
      responder.on("bidReceived", this.addBid);
      return responder.on("resetDatabase", this.reInitialize);
    }
  };
  BidDatabase.prototype.addBid = function(shares, price, bidder) {
    return this.client.zadd("bids", price, "" + (shares) + ":" + (bidder), function() {});
  };
  BidDatabase.prototype.reInitialize = function() {
    console.log("Resetting database");
    this.client.flushall();
    this.client.incr("global:nextBid");
    return true;
  };
  BidDatabase.prototype.getBidId = function() {
    return this.client.incr("global:nextBid");
  };
  exports.BidDatabase = BidDatabase;
}).call(this);
