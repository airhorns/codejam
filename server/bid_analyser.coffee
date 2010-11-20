class BidAnalyser
	constructor: (db, responder) ->
		throw {message:"Must pass BidAnalyser a database to work with!"} unless db?
		@database = db
		this.watchResponder(responder) if responder?
	
	watchResponder: (responder) ->
		responder.on "summaryRequest", this.generateSummary
	
	generateSummary: () =>
		console.log("Generating Summary")
		@database.client.zcard("bids", (error, count) ->
			console.log(count)
		)
	clearingValue: () ->

exports.BidAnalyser = BidAnalyser
