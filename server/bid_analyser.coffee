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
		
		this.getClearingPrice(obj,(error, price) =>
			throw error if error?
			this.outputSummary(obj) if output?
			callback(obj) if callback?
		)

	outputSummary: (details) ->
		console.log "Auction Status #{details.status}"
		console.log "Clearing Price #{details.clearingPrice || "Not Enough Bids"}"
		console.log "Bid Price  Total Shares"
		for price,shares of details.bids
			console.log "#{price}     #{shares}"

	getClearingPrice: (memo, callback) ->
		sharesSold = 0
		targetShares = 100000
		@database.fetchBidsInChunks((error, data) ->
			# In context of ChunkProcessor
			throw error if error?
			while data? && data.length > 0
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
				
			# Calls this function or the given one if there are no more chunks
			this.tryNextChunk () ->
				# No more chunks!
				if sharesSold > targetShares
					memo.clearingPrice = price
					memo.totalBids = @count
					callback(null, price)
					return true
				else
					callback({message: "Not enough shares to generate a summary!"}, null)
			)
	
exports.BidAnalyser = BidAnalyser
