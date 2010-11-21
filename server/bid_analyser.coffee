class BidAnalyser
	constructor: (shares, db, responder) ->
		throw {message:"Must pass BidAnalyser a database to work with!"} unless db?
		@database = db
		@shares = shares
		this.watchResponder(responder) if responder?

	watchResponder: (responder) ->
		@responder = responder
		responder.on "summaryRequest", () => this.generateSummary(true)

	generateSummary: (output, callback) ->
		obj =
			bids: {}
		obj.status = if @responder.acceptingBids then "OPEN" else "CLOSED"
		
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
		targetShares = @shares
		clearingPrice = null
		@database.fetchBidsInChunks((error, bids) ->
			# In context of ChunkProcessor
			throw error if error?
			if !bids? || !bids.length?
				console.log("Unable to get clearing price, needed #{targetShares} and only had #{@count}")
				callback(null, null)
				return
			for bid in bids
				sharesSold += bid.price * bid.shares

				if memo
					key = "$"+String(bid.price)
					memo.bids[key] ?= 0
					memo.bids[key] += bid.shares
				if sharesSold > targetShares
					clearingPrice = bid.price
	
			# Calls this function or the given one if there are no more chunks
			this.tryNextChunk () ->
				# No more chunks!
				if sharesSold > targetShares
					if memo?
						memo.clearingPrice = clearingPrice
						memo.totalBids = @count
					callback(null, clearingPrice)
					return true
				else
					console.log("Unable to get clearing price, needed #{targetShares} and only had #{sharesSold}")
					callback(null, null)
					return true
			)
	
exports.BidAnalyser = BidAnalyser
