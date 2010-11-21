(function() {
  var BidChunkProcessor, BidDatabase, Redis;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  Redis = require("redis");
  BidChunkProcessor = function(client, processCallback) {
    var _this;
    _this = this;
    this.tryNextChunk = function(){ return BidChunkProcessor.prototype.tryNextChunk.apply(_this, arguments); };
    this.getNextChunk = function(){ return BidChunkProcessor.prototype.getNextChunk.apply(_this, arguments); };
    this.processCallback = processCallback;
    this.client = client;
    this.client.scard("bIds", __bind(function(error, count) {
      if (typeof error !== "undefined" && error !== null) {
        throw error;
      }
      console.log("" + (count) + " bids total.");
      this.totalChunks = Math.ceil(count / this.chunkSize);
      return this.getNextChunk();
    }, this));
    return this;
  };
  BidChunkProcessor.prototype.chunkSize = 100;
  BidChunkProcessor.prototype.currentChunk = 0;
  BidChunkProcessor.prototype.count = 0;
  BidChunkProcessor.prototype.getNextChunk = function() {
    return this.client.sort(["bIds", "BY", "bid_*->price", "DESC", "LIMIT", this.currentChunk * this.chunkSize, this.chunkSize, "GET", "#", "GET", "bid_*->shares", "GET", "bid_*->price", "GET", "bid_*->bidder", "GET", "bid_*->time"], __bind(function(err, reply) {
      this.processCallback(err, reply);
      return this.currentChunk += 1;
    }, this));
  };
  BidChunkProcessor.prototype.tryNextChunk = function(errorCallback) {
    if (!(this.currentChunk >= this.totalChunks)) {
      this.getNextChunk();
    } else {
      if (typeof errorCallback !== "undefined" && errorCallback !== null) {
        errorCallback();
      }
    }
    return false;
  };
  BidDatabase = function(config, responder) {
    var _this;
    _this = this;
    this.reInitialize = function(){ return BidDatabase.prototype.reInitialize.apply(_this, arguments); };
    this.addBid = function(){ return BidDatabase.prototype.addBid.apply(_this, arguments); };
    this.client = Redis.createClient();
    if (typeof responder !== "undefined" && responder !== null) {
      this.watchResponder(responder);
    }
    return this;
  };
  BidDatabase.prototype.watchResponder = function(responder) {
    responder.on("bidReceived", this.addBid);
    return responder.on("resetDatabase", this.reInitialize);
  };
  BidDatabase.prototype.addBid = function(shares, price, bidder) {
    console.log("Adding bid", shares, price, bidder);
    return this.getBidId(__bind(function(error, bId) {
      var t;
      t = new Date().getTime();
      return this.client.multi().hmset("bid_" + (bId), "shares", shares, "price", price, "bidder", bidder, "time", t).sadd("bIds", bId).publish("bids", JSON.stringify({
        bId: bId,
        shares: shares,
        price: price,
        bidder: bidder,
        time: t
      })).exec(function() {});
    }, this));
  };
  BidDatabase.prototype.getBidId = function(callback) {
    return this.client.incr("global:nextBid", callback);
  };
  BidDatabase.prototype.fetchBidsInChunks = function(processChunkCallback) {
    return new BidChunkProcessor(this.client, processChunkCallback);
  };
  BidDatabase.prototype.reInitialize = function() {
    console.log("Resetting database");
    this.client.flushall(Redis.print);
    this.client.incr("global:nextBid", Redis.print);
    return true;
  };
  exports.BidDatabase = BidDatabase;
}).call(this);
