BidDatabase = require('database').BidDatabase

db = new BidDatabase()

for i in [0..1000000]
	db.addBid(10, i, "test")

process.exit()
