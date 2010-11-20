Redis = require("redis")
# Redis.debug_mode = true

class BidDatabase
	constructor: (config, responder) ->
		@client = Redis.createClient()
		@client.on "error", (err) =>
			console.log("Redis connection error to " + @client.host + ":" + @client.port + " - " + err)

	watchResponder: (responder) ->
		responder.on "bidReceived", this.addBid
		responder.on "resetDatabase", this.reInitialize

	addBid: (shares, price, bidder) =>
		console.log("Adding bid", shares, price, bidder)
		# bid = this.getBidId()

		# Bid shares count ordered set, for quick summing
		@client.zadd "bids", price, "#{shares}:#{bidder}", Redis.print

		# Bid ids ordered set, for quick finding of data
		# @client.zadd "#{shares}:#{price}:#{bidder}"

	reInitialize: () =>
		console.log("Resetting database")
		@client.flushall(Redis.print)
		@client.incr("global:nextBid", Redis.print)
		true
	
	getBidId: () ->
		return @client.incr("global:nextBid")

exports.BidDatabase = BidDatabase
