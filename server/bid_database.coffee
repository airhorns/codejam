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
		this.getBidId((error, bId) =>
			console.log("Bid #{bId}")
			# Bid shares count ordered set, for quick summing
			# @client.multi()
			@client.hmset("bid_#{bId}", "shares", shares, "price", price, "bidder", bidder, Redis.print)
			@client.zadd("bIds", price, bId, Redis.print)
				# .exec((err, replies) ->
				# 	console.log "Redis saving error!", err if err
				# 	for r in replies
				# 		Redis.print r
				# )
			# Bid ids ordered set, for quick finding of data
			# @client.zadd "#{shares}:#{price}:#{bidder}"
		)
	reInitialize: () =>
		console.log("Resetting database")
		@client.flushall(Redis.print)
		@client.incr("global:nextBid", Redis.print)
		true
	
	getBidId: (callback) ->
		x = @client.incr("global:nextBid", callback)

exports.BidDatabase = BidDatabase
