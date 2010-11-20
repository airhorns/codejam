(function() {
  var BidDatabase, Redis, exports;
  Redis = require("redis");
  BidDatabase = function() {
    this.client = Redis.createClient();
    this.client.on("error", function(err) {
      return console.log("Redis connection error to " + client.host + ":" + client.port + " - " + err);
    });
    return this;
  };
  BidDatabase.prototype.addBid = function(shares, price, bidder) {
    return this.client.zadd("" + (shares) + ":" + (price) + ":" + (bidder));
  };
  BidDatabase.prototype.reInitialize = function() {
    this.client.flushall();
    this.client.incr("global:nextBid");
    return true;
  };
  BidDatabase.prototype.getBidId = function() {
    return this.client.incr("global:nextBid");
  };
  exports = BidDatabase;
}).call(this);
