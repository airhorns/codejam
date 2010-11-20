class BidAnalyser
	constructor: (shares, db, responder) ->
		throw {message:"Must pass BidAnalyser a database to work with!"} unless db?
		@database = db
		@shares = shares
		this.watchResponder(responder) if responder?

	watchResponder: (responder) ->
		responder.on "summaryRequest", () => this.generateSummary(true)

	generateSummary: (output, callback) ->
		obj =
			bids: {}
		obj.status = if @database.acceptingBids then "OPEN" else "CLOSED"
		this.getClearingPrice obj,(error, price) =>
			throw error if error?
			this.outputSummary(obj) if output?
			callback(obj) if callback?

	outputSummary: (memo) ->
		console.log "Auction Status #{memo.status}"
		console.log "Clearing Price #{memo.clearingPrice || "Not Enough Bids"}"
		console.log "Bid Price  Total Shares"
		for price,shares of memo.bids
			console.log "#{price}     #{shares}"

	getClearingPrice: (memo, callback) ->
		console.log("Generating Summary")
		client = @database.client

		# Get count of bids in DB
		client.scard("bIds", (error, count) =>
			throw error if error?
			console.log("#{count} bids total.")

			chunkSize = 1000
			chunks = Math.ceil(count/chunkSize)
			currentChunk = 0
			sharesSold = 0
			targetShares = @shares

			processChunk = (data) ->
				"Processing chunk #{currentChunk}"
				console.log(data.length)
				while data.length > 0
					shares = parseFloat(data.pop().toString('ascii'))
					price = parseFloat(data.pop().toString('ascii'))
					
					if price? && shares?
						sharesSold += price * shares

						if memo
							key = "$"+String(price)
							memo.bids[key] ?= 0
							memo.bids[key] += shares

					else
						callback {message:"Can't parse out the price/share information from the database!"}, null
						return false

					if sharesSold > targetShares
						memo.clearingPrice = price
						callback(null, price)
						return true

				unless currentChunk >= chunks
					getNextChunk()
				else
					callback({message: "Not enough shares to generate a summary!"}, null)
					return false

			getNextChunk = () ->
				client.sort(["bIds", "BY", "bid_*->price", "DESC", "LIMIT", currentChunk * chunkSize, chunkSize, "GET", "bid_*->price", "GET", "bid_*->shares"], (err, reply) ->
				# client.sort(["bIds", "GET bid_*"], (err, reply) ->
					console.log("Got chunk")
					throw err if err?
					processChunk(reply)
				)
				currentChunk += 1
			# Start pagination of results
			getNextChunk()
		)
	clearingValue: () ->

exports.BidAnalyser = BidAnalyser
