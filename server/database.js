(function() {
  var BidDatabase, Redis;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  Redis = require("redis");
  BidDatabase = function() {
    this.client = Redis.createClient();
    this.client.on("error", __bind(function(err) {
      return console.log("Redis connection error to " + this.client.host + ":" + this.client.port + " - " + err);
    }, this));
    return this;
  };
  BidDatabase.prototype.addBid = function(shares, price, bidder) {
    return this.client.zadd("bids", price, "" + (shares) + ":" + (bidder), function() {});
  };
  BidDatabase.prototype.reInitialize = function() {
    this.client.flushall();
    this.client.incr("global:nextBid");
    return true;
  };
  BidDatabase.prototype.getBidId = function() {
    return this.client.incr("global:nextBid");
  };
  exports.BidDatabase = BidDatabase;
}).call(this);
