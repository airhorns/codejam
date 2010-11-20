Redis = require("redis")

class BidDatabase
	constructor: () ->
		@client = Redis.createClient()
		@client.on "error", (err) ->
			console.log("Redis connection error to " + client.host + ":" + client.port + " - " + err)

	addBid: (shares, price, bidder) ->
		# bid = this.getBidId()
		@client.zadd "#{shares}:#{price}:#{bidder}"

	reInitialize: () ->
		@client.flushall()
		@client.incr("global:nextBid")
		true
	
	getBidId: () ->
		return @client.incr("global:nextBid")

exports = BidDatabase
