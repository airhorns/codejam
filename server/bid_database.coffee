Redis = require("redis")
# Redis.debug_mode = true

class BidChunkProcessor
	chunkSize: 300
	currentChunk: 0
	count: 0
	processing: true
	constructor: (client, processCallback) ->
		@processCallback = processCallback
		@client = client
		@client.scard("bIds", (error, count) =>
			throw error if error?
			console.log("#{count} bids total.")
			# Calculate the total number of chunks
			@totalChunks = Math.ceil(count/@chunkSize)-1
			# Start pagination of results
			this.getNextChunk()
		)

	getNextChunk: () =>
		return false unless @processing
		console.log(@currentChunk, @chunkSize, @totalChunks)
		@client.sort(["bIds", "BY", "bid_*->price", "DESC",
									"LIMIT", @currentChunk * @chunkSize, @chunkSize,
									"GET", "#",
									"GET", "bid_*->shares",
									"GET", "bid_*->price",
									"GET", "bid_*->bidder",
									"GET", "bid_*->time"],
			(err, reply) =>
				if !reply?
					@processing = false
					@processCallback({msg: "no more records"})
					return false

				formatted = []
				while reply.length > 0
					throw {message: "Weird number of replies returned"} if reply.length < 5
					bId = parseInt(reply.shift().toString('ascii'))
					shares = parseInt(reply.shift().toString('ascii'))
					price = parseInt(reply.shift().toString('ascii'))
					bidder = reply.shift().toString('ascii')
					time = reply.shift().toString('ascii')
					formatted.push {bId: bId, shares:shares, price:price, bidder:bidder, time: time}
				if formatted.length > 0
					reply = formatted
				else
					reply = []
				@processCallback(err, reply)
		)

	tryNextChunk: (errorCallback) =>
		console.log("trying next chunk")
		unless @currentChunk >= @totalChunks
			console.log("more chunks!")
			@currentChunk += 1
			this.getNextChunk()
		else
			@processing = false
			errorCallback() if errorCallback?

class BidDatabase
	constructor: (responder) ->
		@client = Redis.createClient()
		# @client.on "error", (err) =>
		#		console.log("Redis connection error to " + @client.host + ":" + @client.port + " - " + err)
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
			t = new Date().getTime()
			@client.multi()
				.hmset("bid_#{bId}", "shares", shares, "price", price, "bidder", bidder, "time", t)
				.sadd("bIds", bId)
				.publish("bids", JSON.stringify({bId: bId, shares: shares, price: price, bidder: bidder, time: t}))
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
