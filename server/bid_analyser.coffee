class BidAnalyser
	constructor: (shares, db, responder) ->
		throw {message:"Must pass BidAnalyser a database to work with!"} unless db?
		@database = db
		@shares = shares
		this.watchResponder(responder) if responder?
	
	watchResponder: (responder) ->
		responder.on "summaryRequest", this.generateSummary

	generateSummary: () =>
		this.getClearingPrice((error, price) ->
			throw error if error
			console.log("Clearing price is #{price}")
		)
	
	getClearingPrice: (callback) ->
		console.log("Generating Summary")
		client = @database.client

		# Get count of bids in DB
		client.zcard("bIds", (error, count) =>
			throw error if error?
			console.log("#{count} bids total.")
			
			chunkSize = 1000
			chunks = Math.ceil(count/chunkSize)
			currentChunk = 0
			sharesSold = 0
			targetShares = @shares
			processChunk = (data) ->
				"Processing chunk #{currentChunk}"
				console.log(data)
				while data.length > 0
					price = data.pop
					shares = data.pop
					sharesSold += parseFloat(price) * parseFloat(shares)
					console.log(sharesSold)
					if sharesSold > targetShares
						callback(null, price)
						return
				unless currentChunk >= chunks
					getNextChunk()
				else
					callback({message: "Not enough shares to generate a summary!"})

			getNextChunk = () ->
				client.sort(["bIds", "LIMIT", currentChunk * chunkSize, chunkSize, "GET", "bid_*->price", "GET", "bid_*->shares"], (err, reply) ->
				# client.sort(["bIds", "GET bid_*"], (err, reply) ->
					throw err if err?
					processChunk(reply)
				)
				currentChunk += 1
			# Start pagination of results
			getNextChunk()
		)
	clearingValue: () ->

exports.BidAnalyser = BidAnalyser
