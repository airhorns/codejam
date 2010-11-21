Redis = require("redis")
# Redis.debug_mode = true

class BidChunkProcessor
	chunkSize: 100
	currentChunk: 0
	count: 0
	constructor: (client, processCallback) ->
		@processCallback = processCallback
		@client = client
		@client.scard("bIds", (error, count) =>
			throw error if error?
			console.log("#{count} bids total.")
			# Calculate the total number of chunks
			@totalChunks = Math.ceil(count/@chunkSize)
			# Start pagination of results
			this.getNextChunk()
		)

	getNextChunk: () =>
		@client.sort(["bIds", "BY", "bid_*->price", "DESC",
									"LIMIT", @currentChunk * @chunkSize, @chunkSize,
									"GET", "bid_*->price",
									"GET", "bid_*->shares"],
									(err, reply) =>
										@processCallback(err, reply)
										@currentChunk += 1
		)

	tryNextChunk: (errorCallback) =>
		unless @currentChunk >= @totalChunks
			this.getNextChunk()
		else
			errorCallback()
			return false

class BidDatabase
	constructor: (config, responder) ->
		@client = Redis.createClient()
		@client.on "error", (err) =>
			console.log("Redis connection error to " + @client.host + ":" + @client.port + " - " + err)
		this.watchResponder(responder) if responder?

	watchResponder: (responder) ->
		responder.on "bidReceived", this.addBid
		responder.on "resetDatabase", this.reInitialize

	addBid: (shares, price, bidder) =>
		console.log("Adding bid", shares, price, bidder)
		this.getBidId((error, bId) =>
			# Store bids as hashes keyed by their bid id in a bid_ namespace.
			# @client.hmset("bid_#{bId}", "shares", shares, "price", price, "bidder", bidder, "time", new Date().getTime(), -> )

			# # Store bid IDs in a set for easy tracking of total and sorting
			# # Consider flipping this to a Redis Sorted Set if the performance needs to be better for summaries and can be worse for insertions
			# @client.sadd("bIds", bId)
			# 
			# # Notify subscribers of bid addition
			# @client.publish("bids", JSON.stringify({bId: bId, shares: shares, price: price, bidder: bidder}))

			@client.multi()
				.hmset("bid_#{bId}", "shares", shares, "price", price, "bidder", bidder, "time", new Date().getTime())
				.sadd("bIds", bId)
				.publish("bids", JSON.stringify({bId: bId, shares: shares, price: price, bidder: bidder}))
				.exec(->)

		)

	getBidId: (callback) ->
		@client.incr("global:nextBid", callback)

	fetchBidsInChunks: (processChunkCallback) ->
		# Get count of bids in DB
		new BidChunkProcessor(@client, processChunkCallback)

	reInitialize: () =>
		console.log("Resetting database")
		@client.flushall(Redis.print)
		@client.incr("global:nextBid", Redis.print)
		true

exports.BidDatabase = BidDatabase
