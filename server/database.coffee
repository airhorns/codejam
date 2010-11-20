Redis = require("redis")

class BidDatabase
	constructor: () ->
		@client = Redis.createClient()
		@client.on "error", (err) ->
			console.log("Redis connection error to " + client.host + ":" + client.port + " - " + err)

	addBid: (shares, price, bidder) ->
		# bid = this.getBidId()
		# Bid shares count ordered set, for quick summing
		@client.zadd "bids", price, "#{shares}:#{bidder}"
		# Bid ids ordered set, for quick finding of data
		@client.zadd "#{shares}:#{price}:#{bidder}"

	reInitialize: () ->
		@client.flushall()
		@client.incr("global:nextBid")
		true
	
	getBidId: () ->
		return @client.incr("global:nextBid")

exports.BidDatabase = BidDatabase
